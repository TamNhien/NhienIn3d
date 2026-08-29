import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Prisma } from "../generated/prisma/client.js";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";

@ApiTags("Sản phẩm")
@Controller("san-pham")
export class SanPhamController {
  constructor(private readonly db: CoSoDuLieuService) {}

  @Get()
  @ApiQuery({ name: "tim_kiem", required: false })
  @ApiQuery({ name: "danh_muc", required: false, description: "Đường dẫn danh mục" })
  @ApiQuery({ name: "con_hang", required: false, enum: ["true", "false"] })
  @ApiQuery({ name: "gia_tu", required: false })
  @ApiQuery({ name: "gia_den", required: false })
  @ApiQuery({ name: "sap_xep", required: false, enum: ["moi_nhat", "gia_tang", "gia_giam", "ten_az"] })
  @ApiQuery({ name: "gioi_han", required: false, description: "1-50, mặc định 50" })
  async danh_sach(
    @Query("tim_kiem") tim_kiem?: string,
    @Query("danh_muc") danh_muc?: string,
    @Query("con_hang") con_hang?: string,
    @Query("gia_tu") gia_tu?: string,
    @Query("gia_den") gia_den?: string,
    @Query("sap_xep") sap_xep = "moi_nhat",
    @Query("gioi_han") gioi_han = "50"
  ) {
    if (tim_kiem && tim_kiem.trim().length > 100) throw new BadRequestException("tim_kiem tối đa 100 ký tự");
    if (danh_muc && !/^[a-z0-9-]{1,160}$/i.test(danh_muc.trim())) throw new BadRequestException("danh_muc không hợp lệ");
    if (con_hang && !["true", "false"].includes(con_hang)) throw new BadRequestException("con_hang chỉ nhận true hoặc false");
    if (!["moi_nhat", "gia_tang", "gia_giam", "ten_az"].includes(sap_xep)) throw new BadRequestException("sap_xep không hợp lệ");

    const tu = gia_tu ? Number(gia_tu) : undefined;
    const den = gia_den ? Number(gia_den) : undefined;
    if (tu !== undefined && (!Number.isFinite(tu) || tu < 0)) throw new BadRequestException("gia_tu không hợp lệ");
    if (den !== undefined && (!Number.isFinite(den) || den < 0)) throw new BadRequestException("gia_den không hợp lệ");
    if (tu !== undefined && den !== undefined && tu > den) throw new BadRequestException("gia_tu phải nhỏ hơn hoặc bằng gia_den");

    const gioi_han_so = Math.min(50, Math.max(1, Number.parseInt(gioi_han, 10) || 50));
    const where: Prisma.SanPhamWhereInput = {
      trang_thai: "DANG_BAN",
      ...(tim_kiem?.trim() ? {
        OR: [
          { ten_san_pham: { contains: tim_kiem.trim(), mode: "insensitive" } },
          { ma_san_pham: { contains: tim_kiem.trim(), mode: "insensitive" } },
          { mo_ta_ngan: { contains: tim_kiem.trim(), mode: "insensitive" } }
        ]
      } : {}),
      ...(danh_muc?.trim() ? { danh_muc: { duong_dan: danh_muc.trim() } } : {}),
      ...(con_hang === "true" ? { bien_the: { some: { dang_hien_thi: true, so_luong_ton: { gt: 0 } } } } : {}),
      ...((tu !== undefined || den !== undefined) ? { gia_ban: { ...(tu !== undefined ? { gte: tu } : {}), ...(den !== undefined ? { lte: den } : {}) } } : {})
    };

    const orderBy: Prisma.SanPhamOrderByWithRelationInput[] = sap_xep === "gia_tang"
      ? [{ gia_ban: "asc" }, { ten_san_pham: "asc" }]
      : sap_xep === "gia_giam"
        ? [{ gia_ban: "desc" }, { ten_san_pham: "asc" }]
        : sap_xep === "ten_az"
          ? [{ ten_san_pham: "asc" }]
          : [{ ngay_tao: "desc" }];

    return this.db.sanPham.findMany({
      where,
      include: {
        danh_muc: true,
        hinh_anh: { orderBy: { thu_tu: "asc" } },
        bien_the: { where: { dang_hien_thi: true }, include: { vat_lieu: true, mau_sac: true }, orderBy: { ma_bien_the: "asc" } }
      },
      orderBy,
      take: gioi_han_so
    });
  }

  @Get(":duong_dan")
  async chi_tiet(@Param("duong_dan") duong_dan: string) {
    const san_pham = await this.db.sanPham.findUnique({
      where: { duong_dan },
      include: {
        danh_muc: true,
        hinh_anh: { orderBy: { thu_tu: "asc" } },
        bien_the: { where: { dang_hien_thi: true }, include: { vat_lieu: true, mau_sac: true }, orderBy: { ma_bien_the: "asc" } }
      }
    });
    if (!san_pham || san_pham.trang_thai !== "DANG_BAN") throw new NotFoundException("Không tìm thấy sản phẩm");
    return san_pham;
  }
}
