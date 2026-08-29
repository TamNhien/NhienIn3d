import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";

@Injectable()
export class YeuThichService {
  constructor(private readonly db: CoSoDuLieuService) {}

  private kiemTraMaPhien(ma_phien: string) {
    if (!/^[A-Za-z0-9_-]{16,120}$/.test(ma_phien)) throw new BadRequestException("Mã phiên yêu thích không hợp lệ");
  }

  private kiemTraMaSanPham(ma_san_pham: string) {
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(ma_san_pham)) throw new BadRequestException("Mã sản phẩm không hợp lệ");
  }

  async danhSach(ma_phien: string) {
    this.kiemTraMaPhien(ma_phien);
    return this.db.yeuThich.findMany({
      where: { ma_phien, san_pham: { trang_thai: "DANG_BAN" } },
      include: {
        san_pham: {
          include: {
            danh_muc: true,
            hinh_anh: { orderBy: { thu_tu: "asc" } },
            bien_the: { where: { dang_hien_thi: true }, include: { vat_lieu: true, mau_sac: true } }
          }
        }
      },
      orderBy: { ngay_tao: "desc" }
    });
  }

  async them(ma_phien: string, ma_san_pham: string) {
    this.kiemTraMaPhien(ma_phien);
    this.kiemTraMaSanPham(ma_san_pham);
    const san_pham = await this.db.sanPham.findUnique({ where: { ma_san_pham } });
    if (!san_pham || san_pham.trang_thai !== "DANG_BAN") throw new NotFoundException("Không tìm thấy sản phẩm");
    return this.db.yeuThich.upsert({
      where: { ma_phien_san_pham_id: { ma_phien, san_pham_id: san_pham.id } },
      update: {},
      create: { ma_phien, san_pham_id: san_pham.id }
    });
  }

  async xoa(ma_phien: string, ma_san_pham: string) {
    this.kiemTraMaPhien(ma_phien);
    this.kiemTraMaSanPham(ma_san_pham);
    const san_pham = await this.db.sanPham.findUnique({ where: { ma_san_pham } });
    if (!san_pham) return { da_xoa: false };
    const ket_qua = await this.db.yeuThich.deleteMany({ where: { ma_phien, san_pham_id: san_pham.id } });
    return { da_xoa: ket_qua.count > 0 };
  }
}
