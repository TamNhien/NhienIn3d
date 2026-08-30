import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { CapNhatHoSoDto } from "./dto/cap-nhat-ho-so.dto.js";
import { DoiMatKhauDto } from "./dto/doi-mat-khau.dto.js";

@Injectable()
export class TaiKhoanService {
  constructor(private readonly db: CoSoDuLieuService, private readonly jwt: JwtService) {}

  async ho_so(nguoi_dung_id: string) {
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
        dia_chi: {
          where: { la_mac_dinh: true },
          orderBy: { ngay_cap_nhat: "desc" },
          take: 1,
          select: { id: true, dia_chi_cu_the: true, tinh_thanh: true, quan_huyen: true, phuong_xa: true, la_mac_dinh: true }
        },
        nhan_vien: {
          select: {
            id: true,
            ma_nhan_vien: true,
            chuc_danh: true,
            bo_phan: true,
            ngay_vao_lam: true,
            trang_thai: true
          }
        }
      }
    });
    if (!nguoi_dung) throw new NotFoundException("Không tìm thấy tài khoản");
    return nguoi_dung;
  }

  async cap_nhat_ho_so(nguoi_dung_id: string, dto: CapNhatHoSoDto) {
    const data: { ho_ten?: string; so_dien_thoai?: string | null; thu_dien_tu?: string } = {};
    const dia_chi = dto.dia_chi !== undefined ? dto.dia_chi.trim() : undefined;
    if (dto.ho_ten !== undefined) data.ho_ten = dto.ho_ten.trim();
    if (dto.so_dien_thoai !== undefined) data.so_dien_thoai = dto.so_dien_thoai.trim() || null;
    if (dto.thu_dien_tu !== undefined) {
      const thu_dien_tu = dto.thu_dien_tu.trim().toLowerCase();
      const da_co = await this.db.nguoiDung.findFirst({ where: { thu_dien_tu, id: { not: nguoi_dung_id } }, select: { id: true } });
      if (da_co) throw new ConflictException("Email này đã được sử dụng bởi tài khoản khác");
      data.thu_dien_tu = thu_dien_tu;
    }
    if (!Object.keys(data).length && dia_chi === undefined) throw new BadRequestException("Không có thông tin nào để cập nhật");

    // Ghi và đọc lại trong CÙNG transaction để phản hồi luôn là dữ liệu vừa commit,
    // không phụ thuộc request GET kế tiếp hoặc dữ liệu cache phía trình duyệt.
    return this.db.$transaction(async tx => {
      const nguoi_dung = await tx.nguoiDung.update({ where: { id: nguoi_dung_id }, data });

      if (dia_chi !== undefined) {
        const hien_tai = await tx.diaChiNguoiDung.findFirst({
          where: { nguoi_dung_id, la_mac_dinh: true },
          orderBy: [{ ngay_cap_nhat: "desc" }, { ngay_tao: "desc" }]
        });

        if (hien_tai) {
          await tx.diaChiNguoiDung.update({
            where: { id: hien_tai.id },
            data: {
              dia_chi_cu_the: dia_chi,
              ten_nguoi_nhan: nguoi_dung.ho_ten,
              so_dien_thoai: nguoi_dung.so_dien_thoai || hien_tai.so_dien_thoai || "Chưa cập nhật",
              la_mac_dinh: true
            }
          });
          await tx.diaChiNguoiDung.updateMany({
            where: { nguoi_dung_id, id: { not: hien_tai.id }, la_mac_dinh: true },
            data: { la_mac_dinh: false }
          });
        } else {
          await tx.diaChiNguoiDung.create({
            data: {
              nguoi_dung_id,
              ten_nguoi_nhan: nguoi_dung.ho_ten,
              so_dien_thoai: nguoi_dung.so_dien_thoai || "Chưa cập nhật",
              tinh_thanh: "",
              quan_huyen: "",
              phuong_xa: "",
              dia_chi_cu_the: dia_chi,
              la_mac_dinh: true
            }
          });
        }
      }

      await tx.nhatKyBaoMat.create({
        data: {
          loai_su_kien: "CAP_NHAT_HO_SO",
          nguoi_dung_id,
          chi_tiet: { truong_cap_nhat: [...Object.keys(data), ...(dia_chi !== undefined ? ["dia_chi"] : [])], thu_dien_tu_moi: nguoi_dung.thu_dien_tu }
        }
      });

      return tx.nguoiDung.findUniqueOrThrow({
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
          dia_chi: {
            where: { la_mac_dinh: true },
            orderBy: { ngay_cap_nhat: "desc" },
            take: 1,
            select: { id: true, dia_chi_cu_the: true, tinh_thanh: true, quan_huyen: true, phuong_xa: true, la_mac_dinh: true }
          },
          nhan_vien: {
            select: { id: true, ma_nhan_vien: true, chuc_danh: true, bo_phan: true, ngay_vao_lam: true, trang_thai: true }
          }
        }
      });
    });
  }

  async danh_sach_phien(nguoi_dung_id: string) {
    return this.db.phienDangNhap.findMany({
      where: { nguoi_dung_id, da_thu_hoi: false, het_han_luc: { gt: new Date() } },
      select: { id: true, dia_chi_ip: true, trinh_duyet: true, het_han_luc: true, ngay_tao: true },
      orderBy: { ngay_tao: "desc" }
    });
  }

  async cap_nhat_phien_hien_tai(nguoi_dung_id: string, phien_id: string | undefined, trinh_duyet_hien_thi: string) {
    if (!phien_id) return { da_cap_nhat: false };
    const nhan = trinh_duyet_hien_thi.trim().slice(0, 160);
    const kq = await this.db.phienDangNhap.updateMany({
      where: { id: phien_id, nguoi_dung_id, da_thu_hoi: false },
      data: { trinh_duyet: nhan }
    });
    return { da_cap_nhat: kq.count > 0 };
  }

  async thu_hoi_phien(nguoi_dung_id: string, phien_id: string) {
    const kq = await this.db.phienDangNhap.updateMany({
      where: { id: phien_id, nguoi_dung_id, da_thu_hoi: false },
      data: { da_thu_hoi: true }
    });
    if (!kq.count) throw new NotFoundException("Không tìm thấy phiên đăng nhập");
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "THU_HOI_PHIEN", nguoi_dung_id, chi_tiet: { phien_id } }
    });
    return { thong_bao: "Đã thu hồi phiên đăng nhập" };
  }

  async doi_mat_khau(nguoi_dung_id: string, phien_id: string | undefined, dto: DoiMatKhauDto) {
    const nguoi_dung = await this.db.nguoiDung.findUnique({ where: { id: nguoi_dung_id } });
    if (!nguoi_dung || !nguoi_dung.da_kich_hoat) throw new UnauthorizedException("Tài khoản không còn hoạt động");

    const dung_mat_khau = await argon2.verify(nguoi_dung.mat_khau_bam, dto.mat_khau_hien_tai);
    if (!dung_mat_khau) throw new UnauthorizedException("Mật khẩu hiện tại không đúng");
    if (await argon2.verify(nguoi_dung.mat_khau_bam, dto.mat_khau_moi)) {
      throw new BadRequestException("Mật khẩu mới phải khác mật khẩu hiện tại");
    }

    const mat_khau_bam = await argon2.hash(dto.mat_khau_moi, { type: argon2.argon2id });
    await this.db.$transaction([
      this.db.nguoiDung.update({
        where: { id: nguoi_dung_id },
        data: {
          mat_khau_bam,
          phien_ban_mat_khau: { increment: 1 },
          so_lan_dang_nhap_that_bai: 0,
          khoa_den: null
        }
      }),
      this.db.phienDangNhap.updateMany({
        where: phien_id
          ? { nguoi_dung_id, id: { not: phien_id }, da_thu_hoi: false }
          : { nguoi_dung_id, da_thu_hoi: false },
        data: { da_thu_hoi: true }
      }),
      this.db.nhatKyBaoMat.create({
        data: {
          loai_su_kien: "DOI_MAT_KHAU",
          nguoi_dung_id,
          chi_tiet: { giu_phien_hien_tai: Boolean(phien_id), thu_hoi_cac_phien_khac: true }
        }
      })
    ]);

    if (!phien_id) {
      return { thong_bao: "Đã đổi mật khẩu. Vui lòng đăng nhập lại.", yeu_cau_dang_nhap_lai: true as const };
    }

    const moi = await this.db.nguoiDung.findUnique({ where: { id: nguoi_dung_id } });
    if (!moi) throw new UnauthorizedException("Không tìm thấy tài khoản");
    const jwt_secret = process.env.JWT_SECRET;
    if (!jwt_secret || jwt_secret.length < 32) throw new Error("JWT_SECRET chưa an toàn");
    const ma_truy_cap = await this.jwt.signAsync(
      { sub: moi.id, sid: phien_id, vai_tro: moi.vai_tro, phien_ban_mat_khau: moi.phien_ban_mat_khau },
      { secret: jwt_secret, expiresIn: "15m", issuer: "NhienIn3d", audience: "NhienIn3d-Web" }
    );
    return {
      thong_bao: "Đã đổi mật khẩu. Các phiên đăng nhập khác đã được thu hồi.",
      yeu_cau_dang_nhap_lai: false as const,
      ma_truy_cap
    };
  }

  async don_hang(nguoi_dung_id: string) {
    return this.db.donHang.findMany({
      where: { nguoi_dung_id },
      select: {
        id: true,
        ma_don_hang: true,
        tong_tien: true,
        trang_thai: true,
        ngay_tao: true,
        ho_ten_nguoi_nhan: true,
        chi_tiet: { select: { id: true, ten_san_pham: true, ma_san_pham: true, so_luong: true, don_gia: true, thanh_tien: true, tuy_chon: true } },
        thanh_toan: { select: { ma_giao_dich: true, so_tien: true, trang_thai: true, ngay_thanh_toan: true } }
      },
      orderBy: { ngay_tao: "desc" },
      take: 50
    });
  }

  async lich_lam_viec(nguoi_dung_id: string) {
    const nhan_vien = await this.db.nhanVien.findUnique({
      where: { nguoi_dung_id },
      select: {
        id: true,
        ma_nhan_vien: true,
        chuc_danh: true,
        bo_phan: true,
        trang_thai: true,
        phan_ca: {
          select: {
            id: true,
            ngay_lam: true,
            trang_thai: true,
            ghi_chu: true,
            ca_lam_viec: { select: { ma_ca: true, ten_ca: true, gio_bat_dau: true, gio_ket_thuc: true, mau_hien_thi: true } }
          },
          orderBy: { ngay_lam: "asc" },
          take: 60
        }
      }
    });
    return nhan_vien;
  }
}
