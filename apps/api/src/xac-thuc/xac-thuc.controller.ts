import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { VaiTro } from "../generated/prisma/client.js";
import { DangKyDto } from "./dto/dang-ky.dto.js";
import { DangNhapDto } from "./dto/dang-nhap.dto.js";
import { DatLaiMatKhauDto } from "./dto/dat-lai-mat-khau.dto.js";
import { QuenMatKhauDto } from "./dto/quen-mat-khau.dto.js";
import { JwtGuard, type YeuCauCoNguoiDung } from "./jwt.guard.js";
import { VaiTroChoPhep } from "./vai-tro.decorator.js";
import { VaiTroGuard } from "./vai-tro.guard.js";
import { XacThucService } from "./xac-thuc.service.js";

const ACCESS_GIAY = 15 * 60;
const REFRESH_GIAY = 7 * 24 * 60 * 60;

@ApiTags("Xác thực")
@Controller("xac-thuc")
export class XacThucController {
  constructor(private readonly service: XacThucService) {}

  private cookieBaoMat() {
    return process.env.NODE_ENV === "production" || (process.env.WEB_PUBLIC_URL || "").toLowerCase().startsWith("https://");
  }

  private ghiCookie(reply: FastifyReply, ket_qua: { ma_truy_cap: string; ma_lam_moi: string }) {
    const bao_mat = this.cookieBaoMat();
    reply.setCookie("nhienin3d_phien", ket_qua.ma_truy_cap, { httpOnly: true, secure: bao_mat, sameSite: "lax", path: "/", maxAge: ACCESS_GIAY });
    reply.setCookie("nhienin3d_lam_moi", ket_qua.ma_lam_moi, { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/api/v1/xac-thuc", maxAge: REFRESH_GIAY });
  }

  @Post("dang-ky")
  async dang_ky(@Body() dto: DangKyDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const trinh_duyet = dto.trinh_duyet_hien_thi?.trim() || req.headers["user-agent"];
    const kq = await this.service.dang_ky(dto, req.ip, trinh_duyet);
    this.ghiCookie(reply, kq);
    return { nguoi_dung: kq.nguoi_dung };
  }

  @Post("dang-nhap")
  async dang_nhap(@Body() dto: DangNhapDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const trinh_duyet = dto.trinh_duyet_hien_thi?.trim() || req.headers["user-agent"];
    const kq = await this.service.dang_nhap(dto, req.ip, trinh_duyet);
    this.ghiCookie(reply, kq);
    return { nguoi_dung: kq.nguoi_dung };
  }

  @Post("lam-moi")
  async lam_moi(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kq = await this.service.lam_moi(req.cookies?.nhienin3d_lam_moi, req.ip, req.headers["user-agent"]);
    this.ghiCookie(reply, kq);
    return { nguoi_dung: kq.nguoi_dung };
  }

  @Post("quen-mat-khau")
  @HttpCode(200)
  quen_mat_khau(@Body() dto: QuenMatKhauDto, @Req() req: FastifyRequest) {
    return this.service.quen_mat_khau(dto, req.ip);
  }

  @Post("dat-lai-mat-khau")
  @HttpCode(200)
  dat_lai_mat_khau(@Body() dto: DatLaiMatKhauDto, @Req() req: FastifyRequest) {
    return this.service.dat_lai_mat_khau(dto, req.ip);
  }

  @Post("dang-xuat")
  @HttpCode(200)
  async dang_xuat(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.service.dang_xuat(req.cookies?.nhienin3d_lam_moi, req.cookies?.nhienin3d_phien, req.ip);
    const bao_mat = this.cookieBaoMat();
    const het_han = new Date(0);
    reply.setCookie("nhienin3d_phien", "", { httpOnly: true, secure: bao_mat, sameSite: "lax", path: "/", maxAge: 0, expires: het_han });
    reply.setCookie("nhienin3d_lam_moi", "", { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/api/v1/xac-thuc", maxAge: 0, expires: het_han });
    reply.clearCookie("nhienin3d_phien", { httpOnly: true, secure: bao_mat, sameSite: "lax", path: "/" });
    reply.clearCookie("nhienin3d_lam_moi", { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/api/v1/xac-thuc" });
    // Dọn cookie refresh legacy từng dùng path=/ ở các bản cũ.
    reply.setCookie("nhienin3d_lam_moi", "", { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/", maxAge: 0, expires: het_han });
    reply.clearCookie("nhienin3d_lam_moi", { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/" });
    return { thong_bao: "Đã đăng xuất hoàn toàn" };
  }

  @Get("toi")
  @UseGuards(JwtGuard)
  @ApiCookieAuth("nhienin3d_phien")
  toi(@Req() req: YeuCauCoNguoiDung) {
    return this.service.thong_tin_tai_khoan(req.nguoi_dung_xac_thuc!.id);
  }

  @Get("quan-tri/kiem-tra")
  @UseGuards(JwtGuard, VaiTroGuard)
  @VaiTroChoPhep(VaiTro.ADMIN)
  @ApiCookieAuth("nhienin3d_phien")
  kiem_tra_quan_tri(@Req() req: YeuCauCoNguoiDung) {
    return { duoc_phep: true, nguoi_dung: req.nguoi_dung_xac_thuc };
  }
}
