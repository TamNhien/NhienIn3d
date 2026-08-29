import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { TrangThaiThanhToan } from "../generated/prisma/client.js";
import { DatHangDto } from "./dto/dat-hang.dto.js";

@Injectable()
export class ThanhToanService {
  constructor(private readonly db: CoSoDuLieuService) {}

  private dangChayLocal() {
    return (process.env.NODE_ENV || "development").toLowerCase() !== "production";
  }

  async phuongThuc() {
    const dang_local = this.dangChayLocal();
    const danh_sach = await this.db.phuongThucThanhToan.findMany({
      where: dang_local ? undefined : { dang_hoat_dong: true },
      orderBy: [{ thu_tu: "asc" }, { ten_phuong_thuc: "asc" }]
    });

    return danh_sach.map((item) => ({
      ...item,
      la_gia_lap: dang_local && !item.dang_hoat_dong
    }));
  }

  async datHang(dto: DatHangDto) {
    const gio_hang = await this.db.gioHang.findUnique({
      where: { ma_phien: dto.ma_gio_hang },
      include: {
        chi_tiet: {
          include: {
            bien_the: { include: { san_pham: true, vat_lieu: true, mau_sac: true } }
          }
        }
      }
    });
    if (!gio_hang || gio_hang.trang_thai !== "DANG_MO" || gio_hang.ngay_het_han <= new Date()) {
      throw new NotFoundException("Giỏ hàng không tồn tại hoặc đã hết hạn");
    }
    if (!gio_hang.chi_tiet.length) throw new BadRequestException("Giỏ hàng đang trống");

    const phuong_thuc = await this.db.phuongThucThanhToan.findUnique({ where: { ma_phuong_thuc: dto.ma_phuong_thuc } });
    const la_gia_lap = Boolean(phuong_thuc && this.dangChayLocal() && !phuong_thuc.dang_hoat_dong);
    if (!phuong_thuc || (!phuong_thuc.dang_hoat_dong && !la_gia_lap)) {
      throw new BadRequestException("Phương thức thanh toán chưa được hỗ trợ");
    }

    const tong_tien = gio_hang.chi_tiet.reduce((tong, item) => tong + Number(item.don_gia) * item.so_luong, 0);
    const ma_don_hang = `N3D-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const tien_to_giao_dich = la_gia_lap ? "N3D-MOCK" : "N3D-TT";
    const ma_giao_dich = `${tien_to_giao_dich}-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;

    return this.db.$transaction(async (tx) => {
      for (const item of gio_hang.chi_tiet) {
        const cap_nhat = await tx.bienTheSanPham.updateMany({
          where: { id: item.bien_the_id, so_luong_ton: { gte: item.so_luong } },
          data: { so_luong_ton: { decrement: item.so_luong } }
        });
        if (cap_nhat.count !== 1) throw new BadRequestException(`Sản phẩm ${item.bien_the.san_pham.ten_san_pham} không còn đủ tồn kho`);
      }

      const don_hang = await tx.donHang.create({
        data: {
          ma_don_hang,
          nguoi_dung_id: gio_hang.nguoi_dung_id,
          ho_ten_nguoi_nhan: dto.ho_ten_nguoi_nhan.trim(),
          so_dien_thoai: dto.so_dien_thoai.trim(),
          dia_chi_giao_hang: dto.dia_chi_giao_hang.trim(),
          ghi_chu: dto.ghi_chu?.trim(),
          tong_tien,
          chi_tiet: {
            create: gio_hang.chi_tiet.map((item) => ({
              san_pham_id: item.bien_the.san_pham_id,
              ten_san_pham: item.bien_the.san_pham.ten_san_pham,
              ma_san_pham: item.bien_the.san_pham.ma_san_pham,
              so_luong: item.so_luong,
              don_gia: item.don_gia,
              thanh_tien: Number(item.don_gia) * item.so_luong,
              tuy_chon: {
                ma_bien_the: item.bien_the.ma_bien_the,
                vat_lieu: item.bien_the.vat_lieu?.ten_vat_lieu ?? null,
                mau_sac: item.bien_the.mau_sac?.ten_mau ?? null
              }
            }))
          }
        },
        include: { chi_tiet: true }
      });

      const thanh_toan = await tx.thanhToan.create({
        data: {
          don_hang_id: don_hang.id,
          phuong_thuc_id: phuong_thuc.id,
          ma_giao_dich,
          so_tien: tong_tien,
          trang_thai: la_gia_lap ? TrangThaiThanhToan.DA_THANH_TOAN : TrangThaiThanhToan.CHO_THANH_TOAN,
          ngay_thanh_toan: la_gia_lap ? new Date() : null,
          noi_dung: la_gia_lap
            ? `Thanh toán giả lập local bằng ${phuong_thuc.ten_phuong_thuc} cho ${ma_don_hang}`
            : phuong_thuc.ma_phuong_thuc === "COD"
              ? `Thanh toán khi nhận hàng cho ${ma_don_hang}`
              : `Chuyển khoản cho ${ma_don_hang}`
        }
      });

      await tx.gioHang.update({ where: { id: gio_hang.id }, data: { trang_thai: "DA_DAT_HANG" } });

      return {
        thong_bao: "Đặt hàng thành công",
        don_hang,
        thanh_toan: {
          ...thanh_toan,
          phuong_thuc: phuong_thuc.ten_phuong_thuc,
          la_gia_lap,
          huong_dan: la_gia_lap
            ? `Thanh toán giả lập ${phuong_thuc.ten_phuong_thuc} đã thành công trong môi trường local. Không có giao dịch tiền thật.`
            : phuong_thuc.ma_phuong_thuc === "CHUYEN_KHOAN"
              ? `Vui lòng chuyển khoản với nội dung ${ma_don_hang}.`
              : "Bạn sẽ thanh toán khi nhận hàng."
        }
      };
    });
  }
}
