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
import { CapNhatCauHinhKhoDto } from "./dto/cap-nhat-cau-hinh-kho.dto.js";
import { KiemTraTepNhapKhoDto } from "./dto/kiem-tra-tep-nhap-kho.dto.js";
import { NhapKhoLoDto } from "./dto/nhap-kho-lo.dto.js";
import { TaoNhaCungCapDto } from "./dto/tao-nha-cung-cap.dto.js";
import { CapNhatNhaCungCapDto } from "./dto/cap-nhat-nha-cung-cap.dto.js";
import { CapNhatCauHinhCanhBaoHeThongDto } from "./dto/cap-nhat-cau-hinh-canh-bao-he-thong.dto.js";
import { CapNhatSuCoVanHanhDto } from "./dto/cap-nhat-su-co-van-hanh.dto.js";
import { CapNhatSloVanHanhDto } from "./dto/cap-nhat-slo-van-hanh.dto.js";
import { CapNhatBaoTriHeThongDto } from "./dto/cap-nhat-bao-tri-he-thong.dto.js";
import { CapNhatBaoTriNangCaoDto, TaoBaoTriNangCaoDto } from "./dto/cap-nhat-bao-tri-nang-cao.dto.js";
import { CapNhatSloNangCaoDto } from "./dto/cap-nhat-slo-nang-cao.dto.js";
import { AckWebhookDeadLetterDto, ReplayBulkWebhookDeadLetterDto } from "./dto/webhook-dead-letter.dto.js";
import { CapNhatOpsPhanCongDto, TaoOpsPhanCongDto } from "./dto/ops-phan-cong.dto.js";
import { GanChuSoHuuIncidentDto, ImportOpsOnCallCalendarDto, OpsArchiveDto, OpsArchiveExportDto, OpsArchiveRestoreDto, RotateDlqKeyDto, TaoOpsOnCallOverrideDto, TaoOpsOnCallScheduleDto, TaoWebhookReplayJobDto, UpsertOpsEscalationPolicyDto } from "./dto/ops-v3110.dto.js";
import { TaoProbeEnrollmentTokenDto } from "./dto/probe-enrollment-v3150.dto.js";
import { CapNhatProbeDesiredStateDto, LuuIncidentPostmortemDto } from "./dto/ops-v3170.dto.js";
import { QuanTriService } from "./quan-tri.service.js";

@ApiTags("Quản trị")
@ApiCookieAuth("nhienin3d_phien")
@UseGuards(JwtGuard, VaiTroGuard)
@VaiTroChoPhep(VaiTro.ADMIN)
@Controller("quan-tri")
export class QuanTriController {
  constructor(private readonly service: QuanTriService) {}

  @Get("tong-quan") tong_quan() { return this.service.tong_quan(); }
  @Get("he-thong/suc-khoe") suc_khoe_he_thong() { return this.service.suc_khoe_he_thong(); }
  @Get("he-thong/cau-hinh-canh-bao") cau_hinh_canh_bao_he_thong() { return this.service.lay_cau_hinh_canh_bao_he_thong(); }
  @Post("he-thong/cau-hinh-canh-bao") cap_nhat_cau_hinh_canh_bao_he_thong(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatCauHinhCanhBaoHeThongDto) { return this.service.cap_nhat_cau_hinh_canh_bao_he_thong(req.nguoi_dung_xac_thuc!, dto); }
  @Get("he-thong/cau-hinh-slo") cau_hinh_slo_van_hanh() { return this.service.lay_cau_hinh_slo_van_hanh(); }
  @Post("he-thong/cau-hinh-slo") cap_nhat_cau_hinh_slo_van_hanh(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatSloVanHanhDto) { return this.service.cap_nhat_cau_hinh_slo_van_hanh(req.nguoi_dung_xac_thuc!, dto); }
  @Get("he-thong/cau-hinh-slo-nang-cao") cau_hinh_slo_nang_cao() { return this.service.lay_cau_hinh_slo_nang_cao(); }
  @Post("he-thong/cau-hinh-slo-nang-cao") cap_nhat_cau_hinh_slo_nang_cao(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatSloNangCaoDto) { return this.service.cap_nhat_cau_hinh_slo_nang_cao(req.nguoi_dung_xac_thuc!, dto); }
  @Get("he-thong/bao-tri") bao_tri_he_thong() { return this.service.lay_bao_tri_he_thong(); }
  @Post("he-thong/bao-tri") cap_nhat_bao_tri_he_thong(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatBaoTriHeThongDto) { return this.service.cap_nhat_bao_tri_he_thong(req.nguoi_dung_xac_thuc!, dto); }
  @Get("he-thong/bao-tri/danh-sach") danh_sach_bao_tri_he_thong() { return this.service.lay_danh_sach_bao_tri_he_thong(); }
  @Post("he-thong/bao-tri/danh-sach") tao_bao_tri_he_thong(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoBaoTriNangCaoDto) { return this.service.tao_bao_tri_he_thong(req.nguoi_dung_xac_thuc!, dto); }
  @Post("he-thong/bao-tri/:id/cap-nhat") cap_nhat_bao_tri_nang_cao(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatBaoTriNangCaoDto) { return this.service.cap_nhat_bao_tri_nang_cao(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("he-thong/bao-tri/:id/xoa") xoa_bao_tri_he_thong(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_bao_tri_he_thong(req.nguoi_dung_xac_thuc!, id); }
  @Get("he-thong/lich-su") lich_su_he_thong(@Query("loai") loai?: string, @Query("trang_thai") trang_thai?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string, @Query("trang") trang?: string, @Query("kich_thuoc") kich_thuoc?: string) { return this.service.danh_sach_lich_su_van_hanh(loai, trang_thai, tu_ngay, den_ngay, trang, kich_thuoc); }
  @Get("he-thong/lich-su/cursor") lich_su_he_thong_cursor(@Query("loai") loai?: string, @Query("trang_thai") trang_thai?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string, @Query("cursor") cursor?: string, @Query("kich_thuoc") kich_thuoc?: string) { return this.service.danh_sach_lich_su_van_hanh_cursor(loai, trang_thai, tu_ngay, den_ngay, cursor, kich_thuoc); }
  @Get("he-thong/lich-su/excel") lich_su_he_thong_excel(@Query("loai") loai?: string, @Query("trang_thai") trang_thai?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_excel_lich_su_van_hanh(loai, trang_thai, tu_ngay, den_ngay); }
  @Get("he-thong/thong-ke") thong_ke_he_thong() { return this.service.thong_ke_van_hanh(); }
  @Get("he-thong/sla") sla_he_thong(@Query("so_ngay") so_ngay?: string) { return this.service.thong_ke_sla_van_hanh(so_ngay); }
  @Get("he-thong/su-co") su_co_he_thong(@Query("gioi_han") gioi_han?: string, @Query("trang_thai_xu_ly") trang_thai_xu_ly?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.danh_sach_su_co_van_hanh(gioi_han, trang_thai_xu_ly, tu_ngay, den_ngay); }
  @Get("he-thong/su-co/excel") su_co_he_thong_excel(@Query("trang_thai_xu_ly") trang_thai_xu_ly?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_excel_danh_sach_su_co_van_hanh(trang_thai_xu_ly, tu_ngay, den_ngay); }
  @Get("he-thong/ops/excel") ops_excel(@Query("trang_thai_xu_ly") trang_thai_xu_ly?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_excel_ops_tong_hop(trang_thai_xu_ly, tu_ngay, den_ngay); }
  @Get("he-thong/ops/runtime") ops_runtime() { return this.service.trang_thai_ops_v3170(); }
  @Get("he-thong/ops/probe-desired-state") probe_desired_state() { return this.service.lay_probe_desired_state_v3170(); }
  @Post("he-thong/ops/probe-desired-state") cap_nhat_probe_desired_state(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatProbeDesiredStateDto) { return this.service.cap_nhat_probe_desired_state_v3170(req.nguoi_dung_xac_thuc!, dto); }
  @Post("he-thong/ops/probe-desired-state/rollback") rollback_probe_desired_state(@Req() req: YeuCauCoNguoiDung) { return this.service.rollback_probe_desired_state_v3170(req.nguoi_dung_xac_thuc!); }
  @Post("he-thong/ops/probe-enrollment-token") tao_probe_enrollment_token(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoProbeEnrollmentTokenDto) { return this.service.tao_probe_enrollment_token_v3150(req.nguoi_dung_xac_thuc!, dto); }
  @Get("he-thong/ops/phan-cong") ops_phan_cong() { return this.service.danh_sach_ops_phan_cong(); }
  @Post("he-thong/ops/phan-cong") tao_ops_phan_cong(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoOpsPhanCongDto) { return this.service.tao_ops_phan_cong(req.nguoi_dung_xac_thuc!, dto); }
  @Post("he-thong/ops/phan-cong/:id/cap-nhat") cap_nhat_ops_phan_cong(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatOpsPhanCongDto) { return this.service.cap_nhat_ops_phan_cong(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("he-thong/ops/phan-cong/:id/xoa") xoa_ops_phan_cong(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_ops_phan_cong(req.nguoi_dung_xac_thuc!, id); }
  @Get("he-thong/ops/on-call") ops_on_call() { return this.service.danh_sach_on_call_v3160(); }
  @Post("he-thong/ops/on-call") tao_ops_on_call(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoOpsOnCallScheduleDto) { return this.service.tao_on_call_v3110(req.nguoi_dung_xac_thuc!, dto); }
  @Get("he-thong/ops/on-call/calendar") xuat_ops_on_call_calendar() { return this.service.xuat_on_call_calendar_v3160(); }
  @Post("he-thong/ops/on-call/calendar/import") import_ops_on_call_calendar(@Req() req: YeuCauCoNguoiDung, @Body() dto: ImportOpsOnCallCalendarDto) { return this.service.import_on_call_calendar_v3160(req.nguoi_dung_xac_thuc!, dto.ics, dto.dry_run !== false); }
  @Get("he-thong/ops/on-call/handoff") ops_on_call_handoff(@Query("dich_vu") dich_vu?: string) { return this.service.handoff_on_call_v3160(dich_vu); }
  @Get("he-thong/ops/on-call/overrides") ops_on_call_overrides() { return this.service.danh_sach_on_call_override_v3160(); }
  @Post("he-thong/ops/on-call/overrides") tao_ops_on_call_override(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoOpsOnCallOverrideDto) { return this.service.tao_on_call_override_v3160(req.nguoi_dung_xac_thuc!, dto); }
  @Post("he-thong/ops/on-call/overrides/:id/xoa") xoa_ops_on_call_override(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_on_call_override_v3160(req.nguoi_dung_xac_thuc!, id); }
  @Post("he-thong/ops/on-call/:id/xoa") xoa_ops_on_call(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_on_call_v3110(req.nguoi_dung_xac_thuc!, id); }
  @Post("he-thong/ops/escalation") upsert_ops_escalation(@Req() req: YeuCauCoNguoiDung, @Body() dto: UpsertOpsEscalationPolicyDto) { return this.service.upsert_escalation_policy_v3110(req.nguoi_dung_xac_thuc!, dto); }
  @Get("he-thong/ops/archive/preview") archive_preview(@Query("bang_nguon") bang_nguon: string, @Query("thang") thang: string) { return this.service.kiem_tra_archive_ops_v3110(bang_nguon, thang); }
  @Get("he-thong/ops/archive/batches") archive_batches() { return this.service.danh_sach_archive_batch_v3160(); }
  @Get("he-thong/ops/archive/export") archive_export(@Query("bang_nguon") bang_nguon: string, @Query("thang") thang: string) { return this.service.xuat_archive_bundle_v3160(bang_nguon, thang); }
  @Post("he-thong/ops/archive/export/presigned") archive_export_presigned(@Req() req: YeuCauCoNguoiDung, @Body() dto: OpsArchiveExportDto) { return this.service.upload_archive_presigned_v3160(req.nguoi_dung_xac_thuc!, dto.bang_nguon, dto.thang, dto.presigned_url || ""); }
  @Post("he-thong/ops/archive/restore") archive_restore(@Req() req: YeuCauCoNguoiDung, @Body() dto: OpsArchiveRestoreDto) { return this.service.restore_archive_partition_v3160(req.nguoi_dung_xac_thuc!, dto.bang_nguon, dto.thang, dto.xac_nhan === true); }
  @Post("he-thong/ops/archive") archive_ops(@Req() req: YeuCauCoNguoiDung, @Body() dto: OpsArchiveDto) { return this.service.archive_ops_v3110(req.nguoi_dung_xac_thuc!, dto.bang_nguon, dto.thang); }
  @Get("he-thong/webhook/delivery") webhook_delivery(@Query("gioi_han") gioi_han?: string, @Query("trang_thai") trang_thai?: string) { return this.service.danh_sach_webhook_delivery(gioi_han, trang_thai); }
  @Get("he-thong/webhook/dead-letter") webhook_dead_letter(@Query("gioi_han") gioi_han?: string, @Query("trang_thai") trang_thai?: string) { return this.service.danh_sach_webhook_dead_letter(gioi_han, trang_thai); }
  @Post("he-thong/webhook/dead-letter/replay-bulk") webhook_dead_letter_replay_bulk(@Req() req: YeuCauCoNguoiDung, @Body() dto: ReplayBulkWebhookDeadLetterDto) { return this.service.replay_bulk_webhook_dead_letter(req.nguoi_dung_xac_thuc!, dto.ids, dto.bo_qua_idempotency === true); }
  @Get("he-thong/webhook/dead-letter/keyring") webhook_dlq_keyring() { return this.service.thong_tin_dlq_keyring_v3110(); }
  @Post("he-thong/webhook/dead-letter/keyring/rotate") webhook_dlq_keyring_rotate(@Req() req: YeuCauCoNguoiDung, @Body() dto: RotateDlqKeyDto) { return this.service.rotate_dlq_key_v3110(req.nguoi_dung_xac_thuc!, dto.gioi_han); }
  @Get("he-thong/webhook/dead-letter/replay-jobs") webhook_replay_jobs() { return this.service.danh_sach_webhook_replay_job_v3110(); }
  @Post("he-thong/webhook/dead-letter/replay-jobs") tao_webhook_replay_job(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoWebhookReplayJobDto) { return this.service.tao_webhook_replay_job_v3110(req.nguoi_dung_xac_thuc!, dto.ids, dto.bo_qua_idempotency === true); }
  @Post("he-thong/webhook/dead-letter/replay-jobs/:id/huy") huy_webhook_replay_job(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.huy_webhook_replay_job_v3110(req.nguoi_dung_xac_thuc!, id); }
  @Post("he-thong/webhook/dead-letter/:id/ack") webhook_dead_letter_ack(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: AckWebhookDeadLetterDto) { return this.service.acknowledge_webhook_dead_letter(req.nguoi_dung_xac_thuc!, id, dto.ghi_chu); }
  @Post("he-thong/webhook/dead-letter/:id/replay") webhook_dead_letter_replay(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.replay_webhook_dead_letter(req.nguoi_dung_xac_thuc!, id); }
  @Get("he-thong/su-co/:chu_ky/postmortem") incident_postmortem(@Param("chu_ky") chu_ky: string) { return this.service.lay_incident_postmortem_v3170(chu_ky); }
  @Post("he-thong/su-co/:chu_ky/postmortem") luu_incident_postmortem(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: LuuIncidentPostmortemDto) { return this.service.luu_incident_postmortem_v3170(req.nguoi_dung_xac_thuc!, chu_ky, dto); }
  @Get("he-thong/su-co/:chu_ky/excel") chi_tiet_su_co_he_thong_excel(@Param("chu_ky") chu_ky: string) { return this.service.xuat_excel_chi_tiet_su_co_van_hanh(chu_ky); }
  @Get("he-thong/su-co/:chu_ky/timeline") timeline_su_co_he_thong(@Param("chu_ky") chu_ky: string, @Query("q") q?: string, @Query("cursor") cursor?: string, @Query("kich_thuoc") kich_thuoc?: string) { return this.service.timeline_su_co_van_hanh(chu_ky, q, cursor, kich_thuoc); }
  @Get("he-thong/su-co/:chu_ky") chi_tiet_su_co_he_thong(@Param("chu_ky") chu_ky: string) { return this.service.chi_tiet_su_co_van_hanh(chu_ky); }
  @Post("he-thong/su-co/:chu_ky/tiep-nhan") tiep_nhan_su_co_he_thong(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: CapNhatSuCoVanHanhDto) { return this.service.tiep_nhan_su_co_van_hanh(req.nguoi_dung_xac_thuc!, chu_ky, dto); }
  @Post("he-thong/su-co/:chu_ky/chu-so-huu") gan_chu_so_huu_su_co(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: GanChuSoHuuIncidentDto) { return this.service.gan_chu_so_huu_su_co_v3110(req.nguoi_dung_xac_thuc!, chu_ky, dto.nguoi_dung_id, dto.dich_vu); }
  @Post("he-thong/su-co/:chu_ky/escalation-ack") ack_escalation_su_co(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: AckWebhookDeadLetterDto) { return this.service.acknowledge_escalation_v3160(req.nguoi_dung_xac_thuc!, chu_ky, dto.ghi_chu); }
  @Post("he-thong/su-co/:chu_ky/khac-phuc") khac_phuc_su_co_he_thong(@Req() req: YeuCauCoNguoiDung, @Param("chu_ky") chu_ky: string, @Body() dto: CapNhatSuCoVanHanhDto) { return this.service.khac_phuc_su_co_van_hanh(req.nguoi_dung_xac_thuc!, chu_ky, dto); }
  @Post("he-thong/canh-bao-email/gui") gui_canh_bao_he_thong() { return this.service.kiem_tra_gui_canh_bao_he_thong_email(true); }
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
  @Post("don-hang/doi-soat-doanh-thu") doi_soat_doanh_thu_don_da_giao(@Req() req: YeuCauCoNguoiDung) { return this.service.doi_soat_doanh_thu_don_da_giao(req.nguoi_dung_xac_thuc!); }
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
  @Get("nha-cung-cap") nha_cung_cap(@Query("tim_kiem") tim_kiem?: string, @Query("dang_hoat_dong") dang_hoat_dong?: string) { return this.service.danh_sach_nha_cung_cap(tim_kiem, dang_hoat_dong); }
  @Post("nha-cung-cap") tao_nha_cung_cap(@Req() req: YeuCauCoNguoiDung, @Body() dto: TaoNhaCungCapDto) { return this.service.tao_nha_cung_cap(req.nguoi_dung_xac_thuc!, dto); }
  @Post("nha-cung-cap/:id/cap-nhat") cap_nhat_nha_cung_cap(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string, @Body() dto: CapNhatNhaCungCapDto) { return this.service.cap_nhat_nha_cung_cap(req.nguoi_dung_xac_thuc!, id, dto); }
  @Post("nha-cung-cap/:id/xoa") xoa_nha_cung_cap(@Req() req: YeuCauCoNguoiDung, @Param("id") id: string) { return this.service.xoa_nha_cung_cap(req.nguoi_dung_xac_thuc!, id); }

  @Get("kho/cau-hinh") cau_hinh_kho() { return this.service.lay_cau_hinh_kho(); }
  @Post("kho/cau-hinh") cap_nhat_cau_hinh_kho(@Req() req: YeuCauCoNguoiDung, @Body() dto: CapNhatCauHinhKhoDto) { return this.service.cap_nhat_cau_hinh_kho(req.nguoi_dung_xac_thuc!, dto); }
  @Get("kho/lich-su") lich_su_kho(@Query("loai") loai?: string) { return this.service.lich_su_dieu_chinh_ton_kho(loai); }
  @Post("kho/import/kiem-tra") kiem_tra_import_kho(@Body() dto: KiemTraTepNhapKhoDto) { return this.service.kiem_tra_tep_nhap_kho(dto); }
  @Post("kho/nhap-lo") nhap_kho_theo_lo(@Req() req: YeuCauCoNguoiDung, @Body() dto: NhapKhoLoDto) { return this.service.nhap_kho_theo_lo(req.nguoi_dung_xac_thuc!, dto); }
  @Get("kho/phieu-nhap") phieu_nhap_kho(@Query("tim_kiem") tim_kiem?: string, @Query("nha_cung_cap_id") nha_cung_cap_id?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.danh_sach_phieu_nhap_kho(tim_kiem, nha_cung_cap_id, tu_ngay, den_ngay); }
  @Get("kho/phieu-nhap/excel") phieu_nhap_kho_excel(@Query("tim_kiem") tim_kiem?: string, @Query("nha_cung_cap_id") nha_cung_cap_id?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_excel_phieu_nhap_kho(tim_kiem, nha_cung_cap_id, tu_ngay, den_ngay); }
  @Get("kho/phieu-nhap/:id") chi_tiet_phieu_nhap_kho(@Param("id") id: string) { return this.service.chi_tiet_phieu_nhap_kho(id); }
  @Get("kho/canh-bao-email") canh_bao_email() { return this.service.trang_thai_canh_bao_kho_email(); }
  @Post("kho/canh-bao-email/gui") gui_canh_bao_email() { return this.service.kiem_tra_gui_canh_bao_kho_email(); }

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

  @Get("nhat-ky") nhat_ky_admin(@Query("tim_kiem") tim_kiem?: string, @Query("loai") loai?: string, @Query("nguoi_dung_id") nguoi_dung_id?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string, @Query("gioi_han") gioi_han?: string) { return this.service.danh_sach_nhat_ky_admin(tim_kiem, loai, nguoi_dung_id, tu_ngay, den_ngay, gioi_han); }
  @Get("nhat-ky/phan-trang") nhat_ky_admin_phan_trang(@Query("tim_kiem") tim_kiem?: string, @Query("loai") loai?: string, @Query("nguoi_dung_id") nguoi_dung_id?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string, @Query("trang") trang?: string, @Query("kich_thuoc") kich_thuoc?: string) { return this.service.danh_sach_nhat_ky_admin_phan_trang(tim_kiem, loai, nguoi_dung_id, tu_ngay, den_ngay, trang, kich_thuoc); }
  @Get("nhat-ky/cursor") nhat_ky_admin_cursor(@Query("tim_kiem") tim_kiem?: string, @Query("loai") loai?: string, @Query("nguoi_dung_id") nguoi_dung_id?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string, @Query("cursor") cursor?: string, @Query("kich_thuoc") kich_thuoc?: string) { return this.service.danh_sach_nhat_ky_admin_cursor(tim_kiem, loai, nguoi_dung_id, tu_ngay, den_ngay, cursor, kich_thuoc); }
  @Get("nhat-ky/csv") nhat_ky_admin_csv(@Query("tim_kiem") tim_kiem?: string, @Query("loai") loai?: string, @Query("nguoi_dung_id") nguoi_dung_id?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_nhat_ky_admin_csv(tim_kiem, loai, nguoi_dung_id, tu_ngay, den_ngay); }
  @Get("nhat-ky/excel") nhat_ky_admin_excel(@Query("tim_kiem") tim_kiem?: string, @Query("loai") loai?: string, @Query("nguoi_dung_id") nguoi_dung_id?: string, @Query("tu_ngay") tu_ngay?: string, @Query("den_ngay") den_ngay?: string) { return this.service.xuat_nhat_ky_admin_excel(tim_kiem, loai, nguoi_dung_id, tu_ngay, den_ngay); }
}
