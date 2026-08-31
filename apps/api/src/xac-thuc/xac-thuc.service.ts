import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { ThuDienTuService } from "../thu-dien-tu/thu-dien-tu.service.js";
import { VaiTro } from "../generated/prisma/client.js";
import { DangKyDto } from "./dto/dang-ky.dto.js";
import { DangNhapDto } from "./dto/dang-nhap.dto.js";
import { DatLaiMatKhauDto } from "./dto/dat-lai-mat-khau.dto.js";
import { QuenMatKhauDto } from "./dto/quen-mat-khau.dto.js";

const SO_LAN_THAT_BAI_TOI_DA = 5;
const THOI_GIAN_KHOA_MS = 15 * 60 * 1000;
const THOI_GIAN_REFRESH_GIAY = 7 * 24 * 60 * 60;
const SO_YEU_CAU_DAT_LAI_TOI_DA = 3;
const CUA_SO_GIOI_HAN_DAT_LAI_MS = 15 * 60 * 1000;

function thoiGianDatLaiPhut() {
  const gia_tri = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES || 15);
  return Number.isFinite(gia_tri) ? Math.min(60, Math.max(5, Math.floor(gia_tri))) : 15;
}

@Injectable()
export class XacThucService {
  private readonly logger = new Logger(XacThucService.name);

  constructor(
    private readonly db: CoSoDuLieuService,
    private readonly jwt: JwtService,
    private readonly thu_dien_tu: ThuDienTuService
  ) {}

  private bamMaLamMoi(ma_lam_moi: string) {
    return createHash("sha256").update(ma_lam_moi).digest("hex");
  }

  private thongTinNguoiDung(nguoi_dung: { id: string; thu_dien_tu: string; ho_ten: string; vai_tro: VaiTro }) {
    return { id: nguoi_dung.id, thu_dien_tu: nguoi_dung.thu_dien_tu, ho_ten: nguoi_dung.ho_ten, vai_tro: nguoi_dung.vai_tro };
  }

  private async taoPhien(nguoi_dung: { id: string; thu_dien_tu: string; ho_ten: string; vai_tro: VaiTro; phien_ban_mat_khau: number }, dia_chi_ip?: string, trinh_duyet?: string) {
    const jwt_secret = process.env.JWT_SECRET;
    if (!jwt_secret || jwt_secret.length < 32) throw new Error("JWT_SECRET chưa an toàn");

    const ma_lam_moi = randomBytes(48).toString("base64url");
    const ma_lam_moi_bam = this.bamMaLamMoi(ma_lam_moi);
    const het_han_luc = new Date(Date.now() + THOI_GIAN_REFRESH_GIAY * 1000);
    const phien = await this.db.phienDangNhap.create({
      data: { nguoi_dung_id: nguoi_dung.id, ma_lam_moi_bam, dia_chi_ip, trinh_duyet, het_han_luc }
    });

    const ma_truy_cap = await this.jwt.signAsync(
      { sub: nguoi_dung.id, sid: phien.id, vai_tro: nguoi_dung.vai_tro, phien_ban_mat_khau: nguoi_dung.phien_ban_mat_khau },
      { secret: jwt_secret, expiresIn: "15m", issuer: "NhienIn3d", audience: "NhienIn3d-Web" }
    );
    return { ma_truy_cap, ma_lam_moi, nguoi_dung: this.thongTinNguoiDung(nguoi_dung) };
  }

  async dang_ky(dto: DangKyDto, dia_chi_ip?: string, trinh_duyet?: string) {
    const thu_dien_tu = dto.thu_dien_tu.trim().toLowerCase();
    const da_co = await this.db.nguoiDung.findUnique({ where: { thu_dien_tu }, select: { id: true } });
    if (da_co) throw new ConflictException("Email này đã được đăng ký");

    const mat_khau_bam = await argon2.hash(dto.mat_khau, { type: argon2.argon2id });
    const nguoi_dung = await this.db.$transaction(async tx => {
      const moi = await tx.nguoiDung.create({
        data: {
          thu_dien_tu,
          ho_ten: dto.ho_ten.trim(),
          so_dien_thoai: dto.so_dien_thoai.trim(),
          mat_khau_bam,
          vai_tro: VaiTro.KHACH_HANG,
          da_kich_hoat: true
        }
      });
      await tx.diaChiNguoiDung.create({
        data: {
          nguoi_dung_id: moi.id,
          ten_nguoi_nhan: moi.ho_ten,
          so_dien_thoai: dto.so_dien_thoai.trim(),
          tinh_thanh: "",
          quan_huyen: "",
          phuong_xa: "",
          dia_chi_cu_the: dto.dia_chi.trim(),
          la_mac_dinh: true
        }
      });
      await tx.nhatKyBaoMat.create({
        data: { loai_su_kien: "DANG_KY_TAI_KHOAN", nguoi_dung_id: moi.id, dia_chi_ip, chi_tiet: { thu_dien_tu, co_dia_chi_mac_dinh: true } }
      });
      return moi;
    });
    return this.taoPhien(nguoi_dung, dia_chi_ip, trinh_duyet);
  }

  async dang_nhap(dto: DangNhapDto, dia_chi_ip?: string, trinh_duyet?: string) {
    const thu_dien_tu = dto.thu_dien_tu.trim().toLowerCase();
    const nguoi_dung = await this.db.nguoiDung.findUnique({ where: { thu_dien_tu } });
    const bay_gio = new Date();

    if (nguoi_dung?.khoa_den && nguoi_dung.khoa_den > bay_gio) {
      await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_NHAP_BI_KHOA", nguoi_dung_id: nguoi_dung.id, dia_chi_ip } });
      throw new UnauthorizedException("Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.");
    }

    const hop_le = !!nguoi_dung && nguoi_dung.da_kich_hoat && await argon2.verify(nguoi_dung.mat_khau_bam, dto.mat_khau);
    if (!hop_le) {
      if (nguoi_dung) {
        const so_lan = nguoi_dung.so_lan_dang_nhap_that_bai + 1;
        const khoa_den = so_lan >= SO_LAN_THAT_BAI_TOI_DA ? new Date(Date.now() + THOI_GIAN_KHOA_MS) : null;
        await this.db.nguoiDung.update({ where: { id: nguoi_dung.id }, data: { so_lan_dang_nhap_that_bai: so_lan >= SO_LAN_THAT_BAI_TOI_DA ? 0 : so_lan, khoa_den } });
      }
      await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_NHAP_THAT_BAI", nguoi_dung_id: nguoi_dung?.id, dia_chi_ip, chi_tiet: { thu_dien_tu } } });
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    const da_cap_nhat = await this.db.nguoiDung.update({
      where: { id: nguoi_dung.id },
      data: { so_lan_dang_nhap_that_bai: 0, khoa_den: null }
    });

    await this.db.nguoiDung.update({ where: { id: da_cap_nhat.id }, data: { lan_dang_nhap_cuoi: bay_gio } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_NHAP_THANH_CONG", nguoi_dung_id: da_cap_nhat.id, dia_chi_ip } });
    return this.taoPhien(da_cap_nhat, dia_chi_ip, trinh_duyet);
  }

  async lam_moi(ma_lam_moi: string | undefined, dia_chi_ip?: string, trinh_duyet?: string) {
    if (!ma_lam_moi) throw new UnauthorizedException("Thiếu phiên làm mới");
    const ma_lam_moi_bam = this.bamMaLamMoi(ma_lam_moi);
    const phien = await this.db.phienDangNhap.findUnique({ where: { ma_lam_moi_bam }, include: { nguoi_dung: true } });
    if (!phien || phien.da_thu_hoi || phien.het_han_luc <= new Date() || !phien.nguoi_dung.da_kich_hoat) {
      throw new UnauthorizedException("Phiên làm mới không hợp lệ hoặc đã hết hạn");
    }

    await this.db.$transaction([
      this.db.phienDangNhap.update({ where: { id: phien.id }, data: { da_thu_hoi: true } }),
      this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "LAM_MOI_PHIEN", nguoi_dung_id: phien.nguoi_dung_id, dia_chi_ip } })
    ]);
    return this.taoPhien(phien.nguoi_dung, dia_chi_ip, phien.trinh_duyet || trinh_duyet);
  }

  async dang_xuat(ma_lam_moi?: string, ma_truy_cap?: string, dia_chi_ip?: string) {
    let nguoi_dung_id: string | undefined;
    let phien_id: string | undefined;
    if (ma_truy_cap) {
      const jwt_secret = process.env.JWT_SECRET;
      if (jwt_secret) {
        try {
          const payload = await this.jwt.verifyAsync<{ sub?: string; sid?: string }>(ma_truy_cap, {
            secret: jwt_secret, issuer: "NhienIn3d", audience: "NhienIn3d-Web", ignoreExpiration: true
          });
          nguoi_dung_id = payload.sub;
          phien_id = payload.sid;
        } catch {
          // Cookie vẫn được xóa ở controller ngay cả khi access token đã hỏng/hết hạn.
        }
      }
    }
    if (!nguoi_dung_id && ma_lam_moi) {
      const phien_refresh = await this.db.phienDangNhap.findUnique({
        where: { ma_lam_moi_bam: this.bamMaLamMoi(ma_lam_moi) },
        select: { nguoi_dung_id: true }
      });
      nguoi_dung_id = phien_refresh?.nguoi_dung_id;
    }

    // Đăng xuất v2.8.7 thu hồi toàn bộ phiên của tài khoản. Cách này vô hiệu hóa cả
    // refresh cookie cũ/duplicate từ các version trước, nên F5 không thể tự đăng nhập lại.
    if (nguoi_dung_id) {
      await this.db.phienDangNhap.updateMany({
        where: { nguoi_dung_id, da_thu_hoi: false },
        data: { da_thu_hoi: true }
      });
    } else {
      if (ma_lam_moi) {
        await this.db.phienDangNhap.updateMany({ where: { ma_lam_moi_bam: this.bamMaLamMoi(ma_lam_moi), da_thu_hoi: false }, data: { da_thu_hoi: true } });
      }
      if (phien_id) {
        await this.db.phienDangNhap.updateMany({ where: { id: phien_id, da_thu_hoi: false }, data: { da_thu_hoi: true } });
      }
    }
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_XUAT", nguoi_dung_id, dia_chi_ip, chi_tiet: { phien_id, thu_hoi_tat_ca_phien: !!nguoi_dung_id } } });
    return { thong_bao: "Đã đăng xuất" };
  }

  async quen_mat_khau(dto: QuenMatKhauDto, dia_chi_ip?: string) {
    const thu_dien_tu = dto.thu_dien_tu.trim().toLowerCase();
    const phan_hoi_chung = {
      thong_bao: "Nếu email đã đăng ký và đang hoạt động, NhienIn3d sẽ gửi liên kết đặt lại mật khẩu."
    };
    const nguoi_dung = await this.db.nguoiDung.findUnique({ where: { thu_dien_tu } });

    // Luôn trả cùng một nội dung để tránh dò xem email có tồn tại hay không.
    if (!nguoi_dung || !nguoi_dung.da_kich_hoat) {
      await this.db.nhatKyBaoMat.create({
        data: {
          loai_su_kien: "QUEN_MAT_KHAU_EMAIL_KHONG_KHOP",
          dia_chi_ip,
          chi_tiet: { thu_dien_tu_bam: createHash("sha256").update(thu_dien_tu).digest("hex") }
        }
      });
      return phan_hoi_chung;
    }

    const tu_luc = new Date(Date.now() - CUA_SO_GIOI_HAN_DAT_LAI_MS);
    const so_yeu_cau_gan_day = await this.db.datLaiMatKhau.count({
      where: { nguoi_dung_id: nguoi_dung.id, ngay_tao: { gte: tu_luc } }
    });
    if (so_yeu_cau_gan_day >= SO_YEU_CAU_DAT_LAI_TOI_DA) {
      await this.db.nhatKyBaoMat.create({
        data: { loai_su_kien: "QUEN_MAT_KHAU_BI_GIOI_HAN", nguoi_dung_id: nguoi_dung.id, dia_chi_ip }
      });
      return phan_hoi_chung;
    }

    const ma = randomBytes(32).toString("base64url");
    const ma_bi_mat_bam = createHash("sha256").update(ma).digest("hex");
    const het_han_phut = thoiGianDatLaiPhut();
    const het_han_luc = new Date(Date.now() + het_han_phut * 60 * 1000);
    const web = (process.env.WEB_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");
    const lien_ket = `${web}/dat-lai-mat-khau?ma=${encodeURIComponent(ma)}`;

    await this.db.$transaction([
      this.db.datLaiMatKhau.updateMany({
        where: { nguoi_dung_id: nguoi_dung.id, da_su_dung: false },
        data: { da_su_dung: true, ngay_su_dung: new Date() }
      }),
      this.db.datLaiMatKhau.create({
        data: { nguoi_dung_id: nguoi_dung.id, ma_bi_mat_bam, het_han_luc, dia_chi_ip }
      })
    ]);

    try {
      await this.thu_dien_tu.guiLienKetDatLaiMatKhau({
        thu_dien_tu: nguoi_dung.thu_dien_tu,
        ho_ten: nguoi_dung.ho_ten,
        lien_ket,
        het_han_phut
      });
      await this.db.nhatKyBaoMat.create({
        data: { loai_su_kien: "QUEN_MAT_KHAU_DA_GUI_EMAIL", nguoi_dung_id: nguoi_dung.id, dia_chi_ip }
      });
    } catch (loi) {
      // Không để token tồn tại nếu email không gửi được, đồng thời không làm lộ email có trong hệ thống.
      await this.db.datLaiMatKhau.updateMany({
        where: { ma_bi_mat_bam, da_su_dung: false },
        data: { da_su_dung: true, ngay_su_dung: new Date() }
      });
      await this.db.nhatKyBaoMat.create({
        data: {
          loai_su_kien: "QUEN_MAT_KHAU_GUI_EMAIL_THAT_BAI",
          nguoi_dung_id: nguoi_dung.id,
          dia_chi_ip,
          chi_tiet: { thong_bao: loi instanceof Error ? loi.message.slice(0, 300) : "Lỗi gửi email" }
        }
      });
      this.logger.error("Không gửi được email đặt lại mật khẩu", loi instanceof Error ? loi.stack : undefined);
    }

    return phan_hoi_chung;
  }

  async dat_lai_mat_khau(dto: DatLaiMatKhauDto, dia_chi_ip?: string) {
    const ma_bi_mat_bam = createHash("sha256").update(dto.ma).digest("hex");
    const yeu_cau = await this.db.datLaiMatKhau.findUnique({
      where: { ma_bi_mat_bam },
      include: { nguoi_dung: true }
    });
    const bay_gio = new Date();

    if (!yeu_cau || yeu_cau.da_su_dung || yeu_cau.het_han_luc <= bay_gio || !yeu_cau.nguoi_dung.da_kich_hoat) {
      await this.db.nhatKyBaoMat.create({
        data: { loai_su_kien: "DAT_LAI_MAT_KHAU_MA_KHONG_HOP_LE", nguoi_dung_id: yeu_cau?.nguoi_dung_id, dia_chi_ip }
      });
      throw new BadRequestException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
    }

    const mat_khau_bam = await argon2.hash(dto.mat_khau_moi, { type: argon2.argon2id });
    await this.db.$transaction([
      this.db.nguoiDung.update({
        where: { id: yeu_cau.nguoi_dung_id },
        data: {
          mat_khau_bam,
          phien_ban_mat_khau: { increment: 1 },
          so_lan_dang_nhap_that_bai: 0,
          khoa_den: null
        }
      }),
      this.db.datLaiMatKhau.update({
        where: { id: yeu_cau.id },
        data: { da_su_dung: true, ngay_su_dung: bay_gio }
      }),
      this.db.datLaiMatKhau.updateMany({
        where: { nguoi_dung_id: yeu_cau.nguoi_dung_id, id: { not: yeu_cau.id }, da_su_dung: false },
        data: { da_su_dung: true, ngay_su_dung: bay_gio }
      }),
      this.db.phienDangNhap.updateMany({
        where: { nguoi_dung_id: yeu_cau.nguoi_dung_id, da_thu_hoi: false },
        data: { da_thu_hoi: true }
      }),
      this.db.nhatKyBaoMat.create({
        data: {
          loai_su_kien: "DAT_LAI_MAT_KHAU_THANH_CONG",
          nguoi_dung_id: yeu_cau.nguoi_dung_id,
          dia_chi_ip,
          chi_tiet: { thu_hoi_tat_ca_phien: true }
        }
      })
    ]);

    return { thong_bao: "Mật khẩu đã được đặt lại. Tất cả phiên đăng nhập cũ đã bị thu hồi." };
  }

  async thong_tin_tai_khoan(nguoi_dung_id: string) {
    const nguoi_dung = await this.db.nguoiDung.findUnique({
      where: { id: nguoi_dung_id },
      select: {
        id: true,
        thu_dien_tu: true,
        ho_ten: true,
        so_dien_thoai: true,
        vai_tro: true,
        da_kich_hoat: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
        lan_dang_nhap_cuoi: true,
        nhan_vien: { select: { id: true, ma_nhan_vien: true, chuc_danh: true, bo_phan: true, trang_thai: true } }
      }
    });
    if (!nguoi_dung) throw new UnauthorizedException("Không tìm thấy tài khoản");
    return nguoi_dung;
  }
}
