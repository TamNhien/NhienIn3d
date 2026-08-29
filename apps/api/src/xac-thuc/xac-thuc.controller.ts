import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { DangNhapDto } from "./dto/dang-nhap.dto.js";
import { XacThucService } from "./xac-thuc.service.js";

@ApiTags("Xác thực")
@Controller("xac-thuc")
export class XacThucController {
  constructor(private readonly service: XacThucService) {}

  @Post("dang-nhap")
  async dang_nhap(@Body() dto: DangNhapDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kq = await this.service.dang_nhap(dto, req.ip, req.headers["user-agent"]);
    const bao_mat = process.env.NODE_ENV === "production";
    reply.setCookie("nhienin3d_phien", kq.ma_truy_cap, { httpOnly: true, secure: bao_mat, sameSite: "lax", path: "/", maxAge: 15 * 60 });
    reply.setCookie("nhienin3d_lam_moi", kq.ma_lam_moi, { httpOnly: true, secure: bao_mat, sameSite: "strict", path: "/api/v1/xac-thuc", maxAge: 7 * 24 * 60 * 60 });
    return { nguoi_dung: kq.nguoi_dung };
  }

  @Post("dang-xuat")
  dang_xuat(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie("nhienin3d_phien", { path: "/" });
    reply.clearCookie("nhienin3d_lam_moi", { path: "/api/v1/xac-thuc" });
    return { thong_bao: "Đã đăng xuất" };
  }
}
