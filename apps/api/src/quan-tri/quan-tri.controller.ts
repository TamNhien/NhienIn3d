import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { VaiTro } from "../generated/prisma/client.js";
import { JwtGuard, type YeuCauCoNguoiDung } from "../xac-thuc/jwt.guard.js";
import { VaiTroChoPhep } from "../xac-thuc/vai-tro.decorator.js";
import { VaiTroGuard } from "../xac-thuc/vai-tro.guard.js";
import { CapNhatNguoiDungDto } from "./dto/cap-nhat-nguoi-dung.dto.js";
import { CapNhatNhanVienDto } from "./dto/cap-nhat-nhan-vien.dto.js";
import { CapNhatCaLamDto } from "./dto/cap-nhat-ca-lam.dto.js";
import { CapNhatPhanCaDto } from "./dto/cap-nhat-phan-ca.dto.js";
import { TaoCaLamDto } from "./dto/tao-ca-lam.dto.js";
import { TaoNhanVienDto } from "./dto/tao-nhan-vien.dto.js";
import { TaoPhanCaDto } from "./dto/tao-phan-ca.dto.js";
import { CapNhatTrangThaiDonHangDto } from "./dto/cap-nhat-trang-thai-don-hang.dto.js";
import { CapNhatSanPhamQuanTriDto } from "./dto/cap-nhat-san-pham-quan-tri.dto.js";
import { TaoSanPhamQuanTriDto } from "./dto/tao-san-pham-quan-tri.dto.js";
import { CapNhatTonKhoDto } from "./dto/cap-nhat-ton-kho.dto.js";
import { TaoDanhMucDto } from "./dto/tao-danh-muc.dto.js";
import { CapNhatDanhMucDto } from "./dto/cap-nhat-danh-muc.dto.js";
import { TaoBienTheDto } from "./dto/tao-bien-the.dto.js";
import { CapNhatBienTheDto } from "./dto/cap-nhat-bien-the.dto.js";
import { CapNhatDanhGiaDto } from "./dto/cap-nhat-danh-gia.dto.js";
import { TaoVatLieuDto } from "./dto/tao-vat-lieu.dto.js";
import { CapNhatVatLieuDto } from "./dto/cap-nhat-vat-lieu.dto.js";
import { TaoMauSacDto } from "./dto/tao-mau-sac.dto.js";
import { CapNhatMauSacDto } from "./dto/cap-nhat-mau-sac.dto.js";
import { QuanTriService } from "./quan-tri.service.js";

@ApiTags("Quản trị")
@ApiCookieAuth("nhienin3d_phien")
@UseGuards(JwtGuard, VaiTroGuard)
@VaiTroChoPhep(VaiTro.ADMIN)
@Controller("quan-tri")
export class QuanTriController {
  constructor(private readonly service: QuanTriService) {}

  @Get("tong-quan") tong_quan() { return this.service.tong_quan(); }
  @Get("nguoi-dung") nguoi_dung() { return this.service.danh_sach_nguoi_dung(); }
  @Patch("nguoi-dung/:id") cap_nhat_nguoi_dung(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatNguoiDungDto) { return this.service.cap_nhat_nguoi_dung(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("nguoi-dung/:id/cap-nhat") cap_nhat_nguoi_dung_post(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatNguoiDungDto) { return this.service.cap_nhat_nguoi_dung(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("nguoi-dung/:id/kich-hoat") kich_hoat_nguoi_dung(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.kich_hoat_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }
  @Post("nguoi-dung/:id/khoa") khoa_nguoi_dung(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.khoa_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }
  @Post("nguoi-dung/:id/xoa") xoa_nguoi_dung_post(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }
  @Delete("nguoi-dung/:id") xoa_nguoi_dung(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }

  @Get("nhan-vien") nhan_vien() { return this.service.danh_sach_nhan_vien(); }
  @Post("nhan-vien") tao_nhan_vien(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoNhanVienDto) { return this.service.tao_nhan_vien(req.nguoi_dung_xac_thuc!, dto); }
  @Patch("nhan-vien/:id") cap_nhat_nhan_vien(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatNhanVienDto) { return this.service.cap_nhat_nhan_vien(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("nhan-vien/:id/trang-thai") luu_trang_thai_nhan_vien(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatNhanVienDto) { return this.service.cap_nhat_nhan_vien(req.nguoi_dung_xac_thuc!, id, dto); }

  @Get("ca-lam") ca_lam() { return this.service.danh_sach_ca(); }
  @Post("ca-lam") tao_ca(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoCaLamDto) { return this.service.tao_ca(req.nguoi_dung_xac_thuc!, dto); }
  @Patch("ca-lam/:id") cap_nhat_ca(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatCaLamDto) { return this.service.cap_nhat_ca(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("ca-lam/:id/cap-nhat") cap_nhat_ca_post(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatCaLamDto) { return this.service.cap_nhat_ca(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("ca-lam/:id/xoa") xoa_ca_post(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_ca(req.nguoi_dung_xac_thuc!, id); }
  @Delete("ca-lam/:id") xoa_ca(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_ca(req.nguoi_dung_xac_thuc!, id); }

  @Get("phan-ca") phan_ca() { return this.service.danh_sach_phan_ca(); }
  @Post("phan-ca") tao_phan_ca(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoPhanCaDto) { return this.service.tao_phan_ca(req.nguoi_dung_xac_thuc!, dto); }
  @Patch("phan-ca/:id") cap_nhat_phan_ca(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatPhanCaDto) { return this.service.cap_nhat_phan_ca(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("phan-ca/:id/cap-nhat") cap_nhat_phan_ca_post(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatPhanCaDto) { return this.service.cap_nhat_phan_ca(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("phan-ca/:id/xoa") xoa_phan_ca_post(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_phan_ca(req.nguoi_dung_xac_thuc!, id); }
  @Delete("phan-ca/:id") xoa_phan_ca(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_phan_ca(req.nguoi_dung_xac_thuc!, id); }

  @Get("don-hang") don_hang(@Query("trang_thai") trang_thai?: string, @Query("tim_kiem") tim_kiem?: string) { return this.service.danh_sach_don_hang(trang_thai, tim_kiem); }
  @Get("don-hang/:id") chi_tiet_don_hang(@Param("id") id: string) { return this.service.chi_tiet_don_hang(id); }
  @Post("don-hang/:id/trang-thai") cap_nhat_trang_thai_don_hang(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatTrangThaiDonHangDto) { return this.service.cap_nhat_trang_thai_don_hang(req.nguoi_dung_xac_thuc!, id, dto); }

  @Get("danh-muc") danh_muc_quan_tri() { return this.service.danh_sach_danh_muc_quan_tri(); }
  @Post("danh-muc") tao_danh_muc(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoDanhMucDto) { return this.service.tao_danh_muc(req.nguoi_dung_xac_thuc!, dto); }
  @Post("danh-muc/:id/cap-nhat") cap_nhat_danh_muc(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatDanhMucDto) { return this.service.cap_nhat_danh_muc(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("danh-muc/:id/xoa") xoa_danh_muc(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_danh_muc(req.nguoi_dung_xac_thuc!, id); }

  @Get("vat-lieu") vat_lieu_quan_tri() { return this.service.danh_sach_vat_lieu_quan_tri(); }
  @Post("vat-lieu") tao_vat_lieu(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoVatLieuDto) { return this.service.tao_vat_lieu(req.nguoi_dung_xac_thuc!, dto); }
  @Post("vat-lieu/:id/cap-nhat") cap_nhat_vat_lieu(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatVatLieuDto) { return this.service.cap_nhat_vat_lieu(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("vat-lieu/:id/xoa") xoa_vat_lieu(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_vat_lieu(req.nguoi_dung_xac_thuc!, id); }
  @Get("mau-sac") mau_sac_quan_tri() { return this.service.danh_sach_mau_sac_quan_tri(); }
  @Post("mau-sac") tao_mau_sac(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoMauSacDto) { return this.service.tao_mau_sac(req.nguoi_dung_xac_thuc!, dto); }
  @Post("mau-sac/:id/cap-nhat") cap_nhat_mau_sac(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatMauSacDto) { return this.service.cap_nhat_mau_sac(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("mau-sac/:id/xoa") xoa_mau_sac(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_mau_sac(req.nguoi_dung_xac_thuc!, id); }
  @Get("kho/lich-su") lich_su_kho() { return this.service.lich_su_dieu_chinh_ton_kho(); }

  @Get("san-pham") san_pham_quan_tri() { return this.service.danh_sach_san_pham_quan_tri(); }
  @Post("san-pham") tao_san_pham_quan_tri(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoSanPhamQuanTriDto) { return this.service.tao_san_pham_quan_tri(req.nguoi_dung_xac_thuc!, dto); }
  @Post("san-pham/:id/cap-nhat") cap_nhat_san_pham_quan_tri(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatSanPhamQuanTriDto) { return this.service.cap_nhat_san_pham_quan_tri(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("san-pham/:id/xoa") xoa_san_pham_quan_tri(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_san_pham_quan_tri(req.nguoi_dung_xac_thuc!, id); }
  @Delete("san-pham/:id") xoa_san_pham_quan_tri_delete(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_san_pham_quan_tri(req.nguoi_dung_xac_thuc!, id); }
  @Post("bien-the/:id/ton-kho") cap_nhat_ton_kho(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatTonKhoDto) { return this.service.cap_nhat_ton_kho(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("san-pham/:id/bien-the") tao_bien_the(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: TaoBienTheDto) { return this.service.tao_bien_the(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("bien-the/:id/cap-nhat") cap_nhat_bien_the(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatBienTheDto) { return this.service.cap_nhat_bien_the(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("bien-the/:id/xoa") xoa_bien_the(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_bien_the(req.nguoi_dung_xac_thuc!, id); }

  @Get("danh-gia") danh_gia_quan_tri(@Query("trang_thai") trang_thai?: string) { return this.service.danh_sach_danh_gia_quan_tri(trang_thai); }
  @Post("danh-gia/:id/trang-thai") cap_nhat_danh_gia(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatDanhGiaDto) { return this.service.cap_nhat_danh_gia(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("danh-gia/:id/xoa") xoa_danh_gia(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_danh_gia(req.nguoi_dung_xac_thuc!, id); }

  @Get("bao-cao/:loai") bao_cao_csv(@Param("loai") loai: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_bao_cao_csv(loai, tu_ngay, den_ngay); }
  @Get("bao-cao/:loai/excel") bao_cao_excel(@Param("loai") loai: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_bao_cao_excel(loai, tu_ngay, den_ngay); }

  @Get("nhat-ky") nhat_ky_admin() { return this.service.danh_sach_nhat_ky_admin(); }
}
