import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";

@ApiTags("Sản phẩm")
@Controller("san-pham")
export class SanPhamController {
  constructor(private readonly db: CoSoDuLieuService) {}

  @Get()
  @ApiQuery({ name: "tim_kiem", required: false })
  async danh_sach(@Query("tim_kiem") tim_kiem?: string) {
    return this.db.sanPham.findMany({
      where: { trang_thai: "DANG_BAN", ...(tim_kiem ? { ten_san_pham: { contains: tim_kiem, mode: "insensitive" } } : {}) },
      include: { danh_muc: true, hinh_anh: { orderBy: { thu_tu: "asc" } }, bien_the: { include: { vat_lieu: true, mau_sac: true } } },
      orderBy: { ngay_tao: "desc" }
    });
  }

  @Get(":duong_dan")
  async chi_tiet(@Param("duong_dan") duong_dan: string) {
    const san_pham = await this.db.sanPham.findUnique({ where: { duong_dan }, include: { danh_muc: true, hinh_anh: true, bien_the: { include: { vat_lieu: true, mau_sac: true } } } });
    if (!san_pham) throw new NotFoundException("Không tìm thấy sản phẩm");
    return san_pham;
  }
}
