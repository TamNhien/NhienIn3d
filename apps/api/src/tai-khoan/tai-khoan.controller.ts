import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { JwtGuard, type YeuCauCoNguoiDung } from "../xac-thuc/jwt.guard.js";
import { CapNhatHoSoDto } from "./dto/cap-nhat-ho-so.dto.js";
import { CapNhatPhienDto } from "./dto/cap-nhat-phien.dto.js";
import { DoiMatKhauDto } from "./dto/doi-mat-khau.dto.js";
import { TaiKhoanService } from "./tai-khoan.service.js";

const ACCESS_GIAY = 15 * 60;

@ApiTags("Tài khoản")
@ApiCookieAuth("nhienin3d_phien")
@UseGuards(JwtGuard)
@Controller("tai-khoan")
export class TaiKhoanController {
  constructor(private readonly service: TaiKhoanService) {}

  @Get("ho-so")
  ho_so(@Req() req: YeuCauCoNguoiDung) {
    return this.service.ho_so(req.nguoi_dung_xac_thuc!.id);
  }

  @Patch("ho-so")
  cap_nhat_ho_so(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatHoSoDto) {
    return this.service.cap_nhat_ho_so(req.nguoi_dung_xac_thuc!.id, dto);
  }

  // POST alias dùng cho trình duyệt/proxy chỉ cho phép nhóm method đơn giản ổn định.
  // PATCH vẫn được giữ để tương thích API cũ.
  @Post("ho-so")
  cap_nhat_ho_so_post(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatHoSoDto) {
    return this.service.cap_nhat_ho_so(req.nguoi_dung_xac_thuc!.id, dto);
  }

  @Patch("doi-mat-khau")
  async doi_mat_khau(
    @Req() req: YeuCauCoNguoiDung,
    @Body() dto: DoiMatKhauDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    return this.xu_ly_doi_mat_khau(req, dto, reply);
  }

  // POST alias tránh lỗi CORS/preflight với PATCH trên một số cấu hình local/proxy.
  @Post("doi-mat-khau")
  async doi_mat_khau_post(
    @Req() req: YeuCauCoNguoiDung,
    @Body() dto: DoiMatKhauDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    return this.xu_ly_doi_mat_khau(req, dto, reply);
  }

  private async xu_ly_doi_mat_khau(req: YeuCauCoNguoiDung, dto: DoiMatKhauDto, reply: FastifyReply) {
    const kq = await this.service.doi_mat_khau(req.nguoi_dung_xac_thuc!.id, req.nguoi_dung_xac_thuc!.phien_id, dto);
    const bao_mat = process.env.NODE_ENV === "production";
    if ("ma_truy_cap" in kq && kq.ma_truy_cap) {
      reply.setCookie("nhienin3d_phien", kq.ma_truy_cap, { httpOnly: true, secure: bao_mat, sameSite: "lax", path: "/", maxAge: ACCESS_GIAY });
    }
    if (kq.yeu_cau_dang_nhap_lai) {
      const het_han = new Date(0);
      reply.setCookie("nhienin3d_phien", "", { httpOnly: true, secure: bao_mat, sameSite: "lax", path: "/", maxAge: 0, expires: het_han });
      reply.clearCookie("nhienin3d_phien", { path: "/" });
      reply.setCookie("nhienin3d_lam_moi", "", { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/api/v1/xac-thuc", maxAge: 0, expires: het_han });
      reply.clearCookie("nhienin3d_lam_moi", { path: "/api/v1/xac-thuc" });
    }
    const { ma_truy_cap: _bo_ma, ...phan_hoi } = kq as typeof kq & { ma_truy_cap?: string };
    return phan_hoi;
  }

  @Get("phien")
  danh_sach_phien(@Req() req: YeuCauCoNguoiDung) {
    return this.service.danh_sach_phien(req.nguoi_dung_xac_thuc!.id);
  }

  @Patch("phien/hien-tai")
  cap_nhat_phien_hien_tai(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatPhienDto) {
    return this.service.cap_nhat_phien_hien_tai(
      req.nguoi_dung_xac_thuc!.id,
      req.nguoi_dung_xac_thuc!.phien_id,
      dto.trinh_duyet_hien_thi
    );
  }

  @Delete("phien/:id")
  thu_hoi_phien(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) {
    return this.service.thu_hoi_phien(req.nguoi_dung_xac_thuc!.id, id);
  }

  @Get("don-hang")
  don_hang(@Req() req: YeuCauCoNguoiDung) {
    return this.service.don_hang(req.nguoi_dung_xac_thuc!.id);
  }

  @Get("lich-lam-viec")
  lich_lam_viec(@Req() req: YeuCauCoNguoiDung) {
    return this.service.lich_lam_viec(req.nguoi_dung_xac_thuc!.id);
  }
}
