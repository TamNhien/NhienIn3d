import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { FastifyRequest } from "fastify";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";

export type NguoiDungXacThuc = {
  id: string;
  thu_dien_tu: string;
  ho_ten: string;
  vai_tro: string;
  phien_ban_mat_khau: number;
  phien_id?: string;
};

export type YeuCauCoNguoiDung = FastifyRequest & { nguoi_dung_xac_thuc?: NguoiDungXacThuc };

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly db: CoSoDuLieuService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<YeuCauCoNguoiDung>();
    const token = req.cookies?.nhienin3d_phien;
    if (!token) throw new UnauthorizedException("Bạn cần đăng nhập");

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("JWT_SECRET chưa an toàn");

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; sid?: string; phien_ban_mat_khau: number }>(token, {
        secret,
        issuer: "NhienIn3d",
        audience: "NhienIn3d-Web"
      });
      const nguoi_dung = await this.db.nguoiDung.findUnique({ where: { id: payload.sub } });
      if (!nguoi_dung || !nguoi_dung.da_kich_hoat || nguoi_dung.phien_ban_mat_khau !== payload.phien_ban_mat_khau) {
        throw new UnauthorizedException("Phiên đăng nhập không còn hợp lệ");
      }
      // Từ v2.8.7 mọi access JWT bắt buộc phải liên kết một session PostgreSQL bằng sid.
      // Token legacy không có sid phải đăng nhập lại; nhờ vậy logout/thu hồi phiên có hiệu lực ngay.
      if (!payload.sid) throw new UnauthorizedException("Phiên cũ cần đăng nhập lại");
      const phien = await this.db.phienDangNhap.findFirst({
        where: { id: payload.sid, nguoi_dung_id: payload.sub, da_thu_hoi: false, het_han_luc: { gt: new Date() } },
        select: { id: true }
      });
      if (!phien) throw new UnauthorizedException("Phiên đăng nhập đã được đăng xuất hoặc thu hồi");
      req.nguoi_dung_xac_thuc = {
        id: nguoi_dung.id,
        thu_dien_tu: nguoi_dung.thu_dien_tu,
        ho_ten: nguoi_dung.ho_ten,
        vai_tro: nguoi_dung.vai_tro,
        phien_ban_mat_khau: nguoi_dung.phien_ban_mat_khau,
        phien_id: payload.sid
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ");
    }
  }
}
