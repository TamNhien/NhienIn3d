import { Injectable, NotFoundException } from "@nestjs/common";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { CapNhatHoSoDto } from "./dto/cap-nhat-ho-so.dto.js";

@Injectable()
export class TaiKhoanService {
  constructor(private readonly db: CoSoDuLieuService) {}

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
    const data: { ho_ten?: string; so_dien_thoai?: string | null } = {};
    if (dto.ho_ten !== undefined) data.ho_ten = dto.ho_ten.trim();
    if (dto.so_dien_thoai !== undefined) data.so_dien_thoai = dto.so_dien_thoai.trim() || null;

    await this.db.nguoiDung.update({ where: { id: nguoi_dung_id }, data });
    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: "CAP_NHAT_HO_SO",
        nguoi_dung_id,
        chi_tiet: { truong_cap_nhat: Object.keys(data) }
      }
    });
    return this.ho_so(nguoi_dung_id);
  }

  async danh_sach_phien(nguoi_dung_id: string) {
    return this.db.phienDangNhap.findMany({
      where: { nguoi_dung_id, da_thu_hoi: false, het_han_luc: { gt: new Date() } },
      select: { id: true, dia_chi_ip: true, trinh_duyet: true, het_han_luc: true, ngay_tao: true },
      orderBy: { ngay_tao: "desc" }
    });
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
