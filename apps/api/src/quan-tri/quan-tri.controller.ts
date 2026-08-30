import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
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
  @Post("nguoi-dung/:id/kich-hoat") kich_hoat_nguoi_dung(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.kich_hoat_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }
  @Post("nguoi-dung/:id/khoa") khoa_nguoi_dung(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.khoa_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }
  @Post("nguoi-dung/:id/xoa") xoa_nguoi_dung_post(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }
  @Delete("nguoi-dung/:id") xoa_nguoi_dung(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_nguoi_dung(req.nguoi_dung_xac_thuc!, id); }

  @Get("nhan-vien") nhan_vien() { return this.service.danh_sach_nhan_vien(); }
  @Post("nhan-vien") tao_nhan_vien(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoNhanVienDto) { return this.service.tao_nhan_vien(req.nguoi_dung_xac_thuc!, dto); }
  @Patch("nhan-vien/:id") cap_nhat_nhan_vien(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatNhanVienDto) { return this.service.cap_nhat_nhan_vien(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("nhan-vien/:id/trang-thai") luu_trang_thai_nhan_vien(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatNhanVienDto) { return this.service.cap_nhat_nhan_vien(req.nguoi_dung_xac_thuc!, id, dto); }

  @Get("ca-lam") ca_lam() { return this.service.danh_sach_ca(); }
  @Post("ca-lam") tao_ca(@Body() dto: TaoCaLamDto) { return this.service.tao_ca(dto); }
  @Patch("ca-lam/:id") cap_nhat_ca(@Param("id") id: string, @Body() dto: CapNhatCaLamDto) { return this.service.cap_nhat_ca(id, dto); }
  @Post("ca-lam/:id/xoa") xoa_ca_post(@Param("id") id: string) { return this.service.xoa_ca(id); }
  @Delete("ca-lam/:id") xoa_ca(@Param("id") id: string) { return this.service.xoa_ca(id); }

  @Get("phan-ca") phan_ca() { return this.service.danh_sach_phan_ca(); }
  @Post("phan-ca") tao_phan_ca(@Body() dto: TaoPhanCaDto) { return this.service.tao_phan_ca(dto); }
  @Patch("phan-ca/:id") cap_nhat_phan_ca(@Param("id") id: string, @Body() dto: CapNhatPhanCaDto) { return this.service.cap_nhat_phan_ca(id, dto); }
  @Post("phan-ca/:id/xoa") xoa_phan_ca_post(@Param("id") id: string) { return this.service.xoa_phan_ca(id); }
  @Delete("phan-ca/:id") xoa_phan_ca(@Param("id") id: string) { return this.service.xoa_phan_ca(id); }
}
