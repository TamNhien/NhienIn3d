import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { VaiTro } from "../generated/prisma/client.js";
import type { YeuCauCoNguoiDung } from "./jwt.guard.js";
import { KHOA_VAI_TRO } from "./vai-tro.decorator.js";

@Injectable()
export class VaiTroGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const cho_phep = this.reflector.getAllAndOverride<VaiTro[]>(KHOA_VAI_TRO, [context.getHandler(), context.getClass()]);
    if (!cho_phep?.length) return true;
    const req = context.switchToHttp().getRequest<YeuCauCoNguoiDung>();
    const vai_tro = req.nguoi_dung_xac_thuc?.vai_tro as VaiTro | undefined;
    if (vai_tro === VaiTro.SIEU_QUAN_TRI) return true;
    if (!vai_tro || !cho_phep.includes(vai_tro)) throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này");
    return true;
  }
}
