import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { VaiTro } from "../generated/prisma/client.js";
import { DangKyDto } from "./dto/dang-ky.dto.js";
import { DangNhapDto } from "./dto/dang-nhap.dto.js";
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

  private ghiCookie(reply: FastifyReply, ket_qua: { ma_truy_cap: string; ma_lam_moi: string }) {
    const bao_mat = process.env.NODE_ENV === "production";
    reply.setCookie("nhienin3d_phien", ket_qua.ma_truy_cap, { httpOnly: true, secure: bao_mat, sameSite: "lax", path: "/", maxAge: ACCESS_GIAY });
    reply.setCookie("nhienin3d_lam_moi", ket_qua.ma_lam_moi, { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/api/v1/xac-thuc", maxAge: REFRESH_GIAY });
  }

  @Post("dang-ky")
  async dang_ky(@Body() dto: DangKyDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kq = await this.service.dang_ky(dto, req.ip, req.headers["user-agent"]);
    this.ghiCookie(reply, kq);
    return { nguoi_dung: kq.nguoi_dung };
  }

  @Post("dang-nhap")
  async dang_nhap(@Body() dto: DangNhapDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kq = await this.service.dang_nhap(dto, req.ip, req.headers["user-agent"]);
    this.ghiCookie(reply, kq);
    return { nguoi_dung: kq.nguoi_dung };
  }

  @Post("lam-moi")
  async lam_moi(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kq = await this.service.lam_moi(req.cookies?.nhienin3d_lam_moi, req.ip, req.headers["user-agent"]);
    this.ghiCookie(reply, kq);
    return { nguoi_dung: kq.nguoi_dung };
  }

  @Post("dang-xuat")
  async dang_xuat(@Req() req: YeuCauCoNguoiDung, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.service.dang_xuat(req.cookies?.nhienin3d_lam_moi, req.nguoi_dung_xac_thuc?.id, req.ip);
    reply.clearCookie("nhienin3d_phien", { path: "/" });
    reply.clearCookie("nhienin3d_lam_moi", { path: "/api/v1/xac-thuc" });
    return { thong_bao: "Đã đăng xuất" };
  }

  @Get("toi")
  @UseGuards(JwtGuard)
  @ApiCookieAuth("nhienin3d_phien")
  toi(@Req() req: YeuCauCoNguoiDung) {
    return this.service.thong_tin_tai_khoan(req.nguoi_dung_xac_thuc!.id);
  }

  @Get("quan-tri/kiem-tra")
  @UseGuards(JwtGuard, VaiTroGuard)
  @VaiTroChoPhep(VaiTro.QUAN_TRI, VaiTro.SIEU_QUAN_TRI)
  @ApiCookieAuth("nhienin3d_phien")
  kiem_tra_quan_tri(@Req() req: YeuCauCoNguoiDung) {
    return { duoc_phep: true, nguoi_dung: req.nguoi_dung_xac_thuc };
  }
}
