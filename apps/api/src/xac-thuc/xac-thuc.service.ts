import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { VaiTro } from "../generated/prisma/client.js";
import { DangKyDto } from "./dto/dang-ky.dto.js";
import { DangNhapDto } from "./dto/dang-nhap.dto.js";

const SO_LAN_THAT_BAI_TOI_DA = 5;
const THOI_GIAN_KHOA_MS = 15 * 60 * 1000;
const THOI_GIAN_REFRESH_GIAY = 7 * 24 * 60 * 60;

@Injectable()
export class XacThucService {
  constructor(private readonly db: CoSoDuLieuService, private readonly jwt: JwtService) {}

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
    await this.db.phienDangNhap.create({
      data: { nguoi_dung_id: nguoi_dung.id, ma_lam_moi_bam, dia_chi_ip, trinh_duyet, het_han_luc }
    });

    const ma_truy_cap = await this.jwt.signAsync(
      { sub: nguoi_dung.id, vai_tro: nguoi_dung.vai_tro, phien_ban_mat_khau: nguoi_dung.phien_ban_mat_khau },
      { secret: jwt_secret, expiresIn: "15m", issuer: "NhienIn3d", audience: "NhienIn3d-Web" }
    );
    return { ma_truy_cap, ma_lam_moi, nguoi_dung: this.thongTinNguoiDung(nguoi_dung) };
  }

  async dang_ky(dto: DangKyDto, dia_chi_ip?: string, trinh_duyet?: string) {
    const thu_dien_tu = dto.thu_dien_tu.trim().toLowerCase();
    const da_co = await this.db.nguoiDung.findUnique({ where: { thu_dien_tu }, select: { id: true } });
    if (da_co) throw new ConflictException("Email này đã được đăng ký");

    const mat_khau_bam = await argon2.hash(dto.mat_khau, { type: argon2.argon2id });
    const nguoi_dung = await this.db.nguoiDung.create({
      data: {
        thu_dien_tu,
        ho_ten: dto.ho_ten.trim(),
        mat_khau_bam,
        vai_tro: VaiTro.KHACH_HANG,
        da_kich_hoat: true
      }
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "DANG_KY_TAI_KHOAN", nguoi_dung_id: nguoi_dung.id, dia_chi_ip, chi_tiet: { thu_dien_tu } }
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
      data: { so_lan_dang_nhap_that_bai: 0, khoa_den: null, lan_dang_nhap_cuoi: bay_gio }
    });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_NHAP_THANH_CONG", nguoi_dung_id: nguoi_dung.id, dia_chi_ip } });
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
    return this.taoPhien(phien.nguoi_dung, dia_chi_ip, trinh_duyet);
  }

  async dang_xuat(ma_lam_moi?: string, nguoi_dung_id?: string, dia_chi_ip?: string) {
    if (ma_lam_moi) {
      await this.db.phienDangNhap.updateMany({ where: { ma_lam_moi_bam: this.bamMaLamMoi(ma_lam_moi), da_thu_hoi: false }, data: { da_thu_hoi: true } });
    }
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "DANG_XUAT", nguoi_dung_id, dia_chi_ip } });
    return { thong_bao: "Đã đăng xuất" };
  }

  async thong_tin_tai_khoan(nguoi_dung_id: string) {
    const nguoi_dung = await this.db.nguoiDung.findUnique({
      where: { id: nguoi_dung_id },
      select: { id: true, thu_dien_tu: true, ho_ten: true, vai_tro: true, da_kich_hoat: true, ngay_tao: true, lan_dang_nhap_cuoi: true }
    });
    if (!nguoi_dung) throw new UnauthorizedException("Không tìm thấy tài khoản");
    return nguoi_dung;
  }
}
