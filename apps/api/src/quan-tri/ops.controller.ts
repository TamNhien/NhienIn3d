import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { JwtGuard, type YeuCauCoNguoiDung } from "../xac-thuc/jwt.guard.js";
import { CapNhatSuCoVanHanhDto } from "./dto/cap-nhat-su-co-van-hanh.dto.js";
import { GanChuSoHuuIncidentDto } from "./dto/ops-v3110.dto.js";
import { QuanTriService } from "./quan-tri.service.js";

@ApiTags("Ops")
@ApiCookieAuth("nhienin3d_phien")
@UseGuards(JwtGuard)
@Controller("ops")
export class OpsController {
  constructor(private readonly service: QuanTriService) {}

  @Get("toi") toi(@Req() req: YeuCauCoNguoiDung) { return this.service.kiem_tra_quyen_ops(req.nguoi_dung_xac_thuc!, false); }
  @Get("dashboard") dashboard(@Req() req: YeuCauCoNguoiDung, @Query("so_ngay") so_ngay?: string) { return this.service.ops_dashboard_readonly(req.nguoi_dung_xac_thuc!, so_ngay); }
  @Get("su-co/:chu_ky/timeline") timeline(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Query("q") q?: string, @Query("cursor") cursor?: string, @Query("kich_thuoc") kich_thuoc?: string) { return this.service.ops_incident_timeline_readonly(req.nguoi_dung_xac_thuc!, chu_ky, q, cursor, kich_thuoc); }
  @Post("su-co/:chu_ky/tiep-nhan") tiep_nhan(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: CapNhatSuCoVanHanhDto) { return this.service.ops_incident_tiep_nhan(req.nguoi_dung_xac_thuc!, chu_ky, dto); }
  @Get("on-call") async on_call(@Req() req: YeuCauCoNguoiDung, @Query("dich_vu") dich_vu?: string) { await this.service.kiem_tra_quyen_ops(req.nguoi_dung_xac_thuc!, false); return this.service.on_call_hien_tai_v3110(dich_vu); }
  @Post("su-co/:chu_ky/chu-so-huu") async owner(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: GanChuSoHuuIncidentDto) { await this.service.kiem_tra_quyen_ops(req.nguoi_dung_xac_thuc!, true); return this.service.gan_chu_so_huu_su_co_v3110(req.nguoi_dung_xac_thuc!, chu_ky, dto.nguoi_dung_id, dto.dich_vu); }
  @Post("su-co/:chu_ky/khac-phuc") khac_phuc(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: CapNhatSuCoVanHanhDto) { return this.service.ops_incident_khac_phuc(req.nguoi_dung_xac_thuc!, chu_ky, dto); }
}
