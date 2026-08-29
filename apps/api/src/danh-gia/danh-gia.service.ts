import { Injectable, NotFoundException } from "@nestjs/common";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { LuuDanhGiaDto } from "./dto/luu-danh-gia.dto.js";

@Injectable()
export class DanhGiaService {
  constructor(private readonly db: CoSoDuLieuService) {}

  async danhSach(duong_dan: string) {
    const san_pham = await this.db.sanPham.findUnique({ where: { duong_dan }, select: { id: true, ten_san_pham: true } });
    if (!san_pham) throw new NotFoundException("Không tìm thấy sản phẩm");
    const danh_gia = await this.db.danhGiaSanPham.findMany({
      where: { san_pham_id: san_pham.id, da_duyet: true },
      select: { id: true, ho_ten: true, so_sao: true, noi_dung: true, ngay_tao: true },
      orderBy: { ngay_tao: "desc" },
      take: 30
    });
    const so_luong = danh_gia.length;
    const diem_trung_binh = so_luong ? Number((danh_gia.reduce((tong, item) => tong + item.so_sao, 0) / so_luong).toFixed(1)) : 0;
    return { san_pham: san_pham.ten_san_pham, diem_trung_binh, so_luong, danh_gia };
  }

  async luu(duong_dan: string, dto: LuuDanhGiaDto) {
    const san_pham = await this.db.sanPham.findUnique({ where: { duong_dan }, select: { id: true } });
    if (!san_pham) throw new NotFoundException("Không tìm thấy sản phẩm");
    const da_duyet = process.env.NODE_ENV !== "production";
    const item = await this.db.danhGiaSanPham.upsert({
      where: { ma_phien_san_pham_id: { ma_phien: dto.ma_phien.trim(), san_pham_id: san_pham.id } },
      update: { ho_ten: dto.ho_ten.trim(), so_sao: dto.so_sao, noi_dung: dto.noi_dung.trim(), da_duyet },
      create: { san_pham_id: san_pham.id, ma_phien: dto.ma_phien.trim(), ho_ten: dto.ho_ten.trim(), so_sao: dto.so_sao, noi_dung: dto.noi_dung.trim(), da_duyet }
    });
    return { id: item.id, trang_thai: da_duyet ? "DA_DUYET" : "CHO_DUYET", thong_bao: da_duyet ? "Đánh giá đã được đăng." : "Đánh giá đã được gửi và đang chờ duyệt." };
  }
}
