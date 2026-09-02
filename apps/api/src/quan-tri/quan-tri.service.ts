import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import * as argon2 from "argon2";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual, verify as verifySignature } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
import { ThuDienTuService } from "../thu-dien-tu/thu-dien-tu.service.js";
import { TrangThaiDonHang, TrangThaiNhanVien, TrangThaiNguon, TrangThaiPhanCa, TrangThaiSanPham, TrangThaiThanhToan, VaiTro, type Prisma } from "../generated/prisma/client.js";
import type { NguoiDungXacThuc } from "../xac-thuc/jwt.guard.js";
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

type BaoTriV370Luu = {
  id: string;
  ten: string;
  bat: boolean;
  bat_dau: string;
  ket_thuc: string;
  lap_lai: "KHONG" | "HANG_NGAY" | "HANG_TUAN";
  ly_do: string;
};

type SloEndpointCheckV390 = {
  id: string;
  ten: string;
  path: string;
  method: "GET" | "HEAD";
  headers: Record<string, string>;
  auth_template: "NONE" | "BEARER_ENV";
  auth_env: string;
  muc_tieu_percent: number;
  latency_target_ms: number;
  timeout_ms: number;
};

type SloMaintenancePolicyV390 = {
  exclude_from_availability: boolean;
  exclude_from_error_budget: boolean;
  max_gap_multiplier: number;
};

type WebhookSendResultV390 = {
  da_gui: boolean;
  ly_do?: string;
  http_status?: number;
  so_lan_thu: number;
  hmac: boolean;
  adapter: "GENERIC" | "SLACK" | "TEAMS" | "DISCORD";
};

@Injectable()
export class QuanTriService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QuanTriService.name);
  private bo_hen_canh_bao_kho: NodeJS.Timeout | null = null;
  private bo_hen_canh_bao_he_thong: NodeJS.Timeout | null = null;
  private bo_hen_slo_endpoint: NodeJS.Timeout | null = null;
  private bo_hen_webhook_dlq: NodeJS.Timeout | null = null;
  private bo_hen_ops_metrics: NodeJS.Timeout | null = null;
  private bo_hen_ops_retention: NodeJS.Timeout | null = null;
  private chu_ky_canh_bao_he_thong: string | null = null;

  constructor(private readonly db: CoSoDuLieuService, private readonly thu_dien_tu: ThuDienTuService) {}

  async onModuleInit() {
    const kho = this.cau_hinh_canh_bao_kho_runtime();
    if (kho.bat) {
      const chayKho = () => this.kiem_tra_gui_canh_bao_kho_email().catch(error => this.logger.warn(`Không thể gửi cảnh báo tồn kho: ${error instanceof Error ? error.message : String(error)}`));
      setTimeout(chayKho, 30_000).unref();
      this.bo_hen_canh_bao_kho = setInterval(chayKho, kho.chu_ky_phut * 60_000);
      this.bo_hen_canh_bao_kho.unref();
      this.logger.log(`Cảnh báo tồn kho qua email được kiểm tra mỗi ${kho.chu_ky_phut} phút.`);
    }

    const heThong = await this.cau_hinh_canh_bao_he_thong_runtime();
    this.ap_dung_bo_hen_canh_bao_he_thong(heThong, true);

    const sloEndpoint = this.cau_hinh_slo_endpoint_runtime();
    const chaySloEndpoint = () => this.kiem_tra_slo_endpoints().catch(error => this.logger.warn(`SLO endpoint probe failed: ${error instanceof Error ? error.message : String(error)}`));
    setTimeout(chaySloEndpoint, 60_000).unref();
    this.bo_hen_slo_endpoint = setInterval(chaySloEndpoint, sloEndpoint.chu_ky_phut * 60_000);
    this.bo_hen_slo_endpoint.unref();
    this.logger.log(`SLO endpoint probe runs every ${sloEndpoint.chu_ky_phut} minutes.`);

    const dlqPolicy = this.cau_hinh_webhook_dlq_scheduler();
    const chayDlq = () => this.xu_ly_webhook_dlq_job().catch(error => this.logger.warn(`Webhook DLQ scheduler failed: ${error instanceof Error ? error.message : String(error)}`));
    setTimeout(chayDlq, 90_000).unref();
    this.bo_hen_webhook_dlq = setInterval(chayDlq, dlqPolicy.chu_ky_phut * 60_000);
    this.bo_hen_webhook_dlq.unref();

    const opsPolicy = this.cau_hinh_ops_scheduler();
    const refreshOps = () => this.refresh_ops_metrics_cache().catch(error => this.logger.warn(`Ops metrics refresh failed: ${error instanceof Error ? error.message : String(error)}`));
    setTimeout(refreshOps, 75_000).unref();
    this.bo_hen_ops_metrics = setInterval(refreshOps, opsPolicy.refresh_phut * 60_000);
    this.bo_hen_ops_metrics.unref();
    const cleanupOps = () => this.cleanup_ops_retention().catch(error => this.logger.warn(`Ops retention cleanup failed: ${error instanceof Error ? error.message : String(error)}`));
    setTimeout(cleanupOps, 120_000).unref();
    this.bo_hen_ops_retention = setInterval(cleanupOps, 6 * 60 * 60_000);
    this.bo_hen_ops_retention.unref();
    this.logger.log(`Ops v3.13.0 schedulers: DLQ ${dlqPolicy.chu_ky_phut}m, metrics ${opsPolicy.refresh_phut}m, retention ${opsPolicy.retention_days}d.`);
  }

  onModuleDestroy() {
    if (this.bo_hen_canh_bao_kho) clearInterval(this.bo_hen_canh_bao_kho);
    if (this.bo_hen_canh_bao_he_thong) clearInterval(this.bo_hen_canh_bao_he_thong);
    if (this.bo_hen_slo_endpoint) clearInterval(this.bo_hen_slo_endpoint);
    if (this.bo_hen_webhook_dlq) clearInterval(this.bo_hen_webhook_dlq);
    if (this.bo_hen_ops_metrics) clearInterval(this.bo_hen_ops_metrics);
    if (this.bo_hen_ops_retention) clearInterval(this.bo_hen_ops_retention);
  }

  private cau_hinh_canh_bao_kho_runtime() {
    const bat = ["1", "true", "yes", "on"].includes((process.env.LOW_STOCK_EMAIL_ENABLED || "false").trim().toLowerCase());
    const raw = Number(process.env.LOW_STOCK_EMAIL_INTERVAL_MINUTES || 60);
    const chu_ky_phut = Number.isFinite(raw) ? Math.max(15, Math.min(1440, Math.floor(raw))) : 60;
    return { bat, chu_ky_phut };
  }

  private cau_hinh_slo_endpoint_runtime() {
    const raw = Number(process.env.SYSTEM_SLO_ENDPOINT_INTERVAL_MINUTES || 5);
    return { chu_ky_phut: Number.isFinite(raw) ? Math.max(1, Math.min(60, Math.floor(raw))) : 5 };
  }

  private cau_hinh_probe_agent_v3100() {
    const clean = (value: string | undefined, fallback: string, max = 120) => (value || fallback).trim().replace(/[^a-zA-Z0-9._:-]/g, "-").slice(0, max) || fallback;
    return {
      agent_id: clean(process.env.SYSTEM_SLO_PROBE_AGENT_ID, "local-agent", 80),
      region: clean(process.env.SYSTEM_SLO_PROBE_REGION, "local", 80),
      node_name: clean(process.env.SYSTEM_SLO_PROBE_NODE, process.env.HOSTNAME || "local", 120)
    };
  }

  private cau_hinh_webhook_dlq_scheduler() {
    const intervalRaw = Number(process.env.SYSTEM_ALERT_WEBHOOK_DLQ_RETRY_INTERVAL_MINUTES || 15);
    const maxRaw = Number(process.env.SYSTEM_ALERT_WEBHOOK_DLQ_SCHEDULED_MAX_ATTEMPTS || 5);
    return {
      chu_ky_phut: Number.isFinite(intervalRaw) ? Math.max(1, Math.min(1440, Math.floor(intervalRaw))) : 15,
      max_attempts: Number.isFinite(maxRaw) ? Math.max(1, Math.min(20, Math.floor(maxRaw))) : 5
    };
  }

  private cau_hinh_ops_scheduler() {
    const refreshRaw = Number(process.env.SYSTEM_OPS_METRICS_REFRESH_MINUTES || 5);
    const retentionRaw = Number(process.env.SYSTEM_OPS_HISTORY_RETENTION_DAYS || 180);
    return {
      refresh_phut: Number.isFinite(refreshRaw) ? Math.max(1, Math.min(60, Math.floor(refreshRaw))) : 5,
      retention_days: Number.isFinite(retentionRaw) ? Math.max(30, Math.min(3650, Math.floor(retentionRaw))) : 180
    };
  }

  private cau_hinh_canh_bao_he_thong_env() {
    const bat = ["1", "true", "yes", "on"].includes((process.env.SYSTEM_HEALTH_EMAIL_ENABLED || "false").trim().toLowerCase());
    const raw = Number(process.env.SYSTEM_HEALTH_EMAIL_INTERVAL_MINUTES || 30);
    const maxBackupRaw = Number(process.env.SYSTEM_HEALTH_BACKUP_MAX_AGE_HOURS || 36);
    const silenceRaw = Number(process.env.SYSTEM_HEALTH_ALERT_SILENCE_MINUTES || 180);
    const escalationRaw = Number(process.env.SYSTEM_HEALTH_ALERT_ESCALATION_MINUTES || 720);
    return {
      bat,
      chu_ky_phut: Number.isFinite(raw) ? Math.max(15, Math.min(1440, Math.floor(raw))) : 30,
      backup_qua_han_gio: Number.isFinite(maxBackupRaw) ? Math.max(6, Math.min(720, Math.floor(maxBackupRaw))) : 36,
      im_lang_phut: Number.isFinite(silenceRaw) ? Math.max(15, Math.min(10080, Math.floor(silenceRaw))) : 180,
      leo_thang_phut: Number.isFinite(escalationRaw) ? Math.max(60, Math.min(43200, Math.floor(escalationRaw))) : 720,
      nguoi_nhan_co_dinh: (process.env.SYSTEM_HEALTH_EMAIL_TO || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean),
      nguon_cau_hinh: "ENV" as const
    };
  }

  private async cau_hinh_canh_bao_he_thong_runtime() {
    const mac_dinh = this.cau_hinh_canh_bao_he_thong_env();
    try {
      const item = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "CANH_BAO_HE_THONG_CAU_HINH" } });
      const raw = item?.gia_tri;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return mac_dinh;
      const x = raw as Record<string, unknown>;
      const so = (key: string, fallback: number, min: number, max: number) => { const n = Number(x[key]); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; };
      const nguoiNhanRaw = Array.isArray(x.nguoi_nhan) ? x.nguoi_nhan : typeof x.nguoi_nhan === "string" ? x.nguoi_nhan.split(",") : mac_dinh.nguoi_nhan_co_dinh;
      const nguoi_nhan_co_dinh = [...new Set(nguoiNhanRaw.map(v => String(v).trim().toLowerCase()).filter(Boolean))];
      return {
        bat: typeof x.bat === "boolean" ? x.bat : mac_dinh.bat,
        chu_ky_phut: so("chu_ky_phut", mac_dinh.chu_ky_phut, 15, 1440),
        backup_qua_han_gio: so("backup_qua_han_gio", mac_dinh.backup_qua_han_gio, 6, 720),
        im_lang_phut: so("im_lang_phut", mac_dinh.im_lang_phut, 15, 10080),
        leo_thang_phut: so("leo_thang_phut", mac_dinh.leo_thang_phut, 60, 43200),
        nguoi_nhan_co_dinh,
        nguon_cau_hinh: "DATABASE" as const,
        ngay_cap_nhat: item?.ngay_cap_nhat || null
      };
    } catch (error) {
      this.logger.debug(`Không đọc được cấu hình cảnh báo hệ thống từ DB, dùng .env: ${error instanceof Error ? error.message : String(error)}`);
      return mac_dinh;
    }
  }

  private ap_dung_bo_hen_canh_bao_he_thong(cau_hinh: { bat: boolean; chu_ky_phut: number; nguon_cau_hinh: string }, chay_som = false) {
    if (this.bo_hen_canh_bao_he_thong) { clearInterval(this.bo_hen_canh_bao_he_thong); this.bo_hen_canh_bao_he_thong = null; }
    if (!cau_hinh.bat) { this.logger.log("Cảnh báo sức khỏe hệ thống đang tắt."); return; }
    const chayHeThong = () => this.kiem_tra_gui_canh_bao_he_thong_email().catch(error => this.logger.warn(`Không thể kiểm tra/gửi cảnh báo hệ thống: ${error instanceof Error ? error.message : String(error)}`));
    if (chay_som) setTimeout(chayHeThong, 45_000).unref();
    this.bo_hen_canh_bao_he_thong = setInterval(chayHeThong, cau_hinh.chu_ky_phut * 60_000);
    this.bo_hen_canh_bao_he_thong.unref();
    this.logger.log(`Cảnh báo sức khỏe hệ thống được kiểm tra mỗi ${cau_hinh.chu_ky_phut} phút (${cau_hinh.nguon_cau_hinh}).`);
  }

  async lay_cau_hinh_canh_bao_he_thong() {
    const x = await this.cau_hinh_canh_bao_he_thong_runtime();
    return { ...x, nguoi_nhan: x.nguoi_nhan_co_dinh.join(", "), nguoi_nhan_co_dinh: undefined };
  }

  async cap_nhat_cau_hinh_canh_bao_he_thong(actor: NguoiDungXacThuc, dto: CapNhatCauHinhCanhBaoHeThongDto) {
    const truocRuntime = await this.cau_hinh_canh_bao_he_thong_runtime();
    const truoc = { bat: truocRuntime.bat, chu_ky_phut: truocRuntime.chu_ky_phut, backup_qua_han_gio: truocRuntime.backup_qua_han_gio, im_lang_phut: truocRuntime.im_lang_phut, leo_thang_phut: truocRuntime.leo_thang_phut, nguoi_nhan: truocRuntime.nguoi_nhan_co_dinh.join(", ") };
    const nguoi_nhan = [...new Set((dto.nguoi_nhan || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean))];
    const sau = { bat: dto.bat, chu_ky_phut: dto.chu_ky_phut, backup_qua_han_gio: dto.backup_qua_han_gio, im_lang_phut: dto.im_lang_phut, leo_thang_phut: dto.leo_thang_phut, nguoi_nhan: nguoi_nhan.join(", ") };
    await this.db.$transaction([
      this.db.cauHinhHeThong.upsert({ where: { khoa: "CANH_BAO_HE_THONG_CAU_HINH" }, create: { khoa: "CANH_BAO_HE_THONG_CAU_HINH", gia_tri: { ...sau, nguoi_nhan }, nguoi_cap_nhat_id: actor.id }, update: { gia_tri: { ...sau, nguoi_nhan }, nguoi_cap_nhat_id: actor.id } }),
      this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_CAU_HINH_CANH_BAO_HE_THONG", nguoi_dung_id: actor.id, chi_tiet: { truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } })
    ]);
    const runtime = await this.cau_hinh_canh_bao_he_thong_runtime();
    this.ap_dung_bo_hen_canh_bao_he_thong(runtime);
    return { ...runtime, nguoi_nhan: runtime.nguoi_nhan_co_dinh.join(", "), nguoi_nhan_co_dinh: undefined };
  }

  private cau_hinh_slo_van_hanh_env() {
    const slaRaw = Number(process.env.SYSTEM_SLO_SLA_TARGET_PERCENT || 99);
    const uptimeRaw = Number(process.env.SYSTEM_SLO_UPTIME_TARGET_PERCENT || 99.9);
    const canhBaoRaw = (process.env.SYSTEM_SLO_TREND_ALERT_ENABLED || "true").trim().toLowerCase();
    const chuan = (n: number, fallback: number) => Number.isFinite(n) ? Math.max(90, Math.min(100, Math.round(n * 1000) / 1000)) : fallback;
    return {
      sla_muc_tieu_percent: chuan(slaRaw, 99),
      uptime_muc_tieu_percent: chuan(uptimeRaw, 99.9),
      canh_bao_xu_huong: ["1", "true", "yes", "on"].includes(canhBaoRaw),
      nguon_cau_hinh: "ENV" as const
    };
  }

  private async cau_hinh_slo_van_hanh_runtime() {
    const mac_dinh = this.cau_hinh_slo_van_hanh_env();
    try {
      const item = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "SLO_VAN_HANH_CAU_HINH" } });
      const raw = item?.gia_tri;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return mac_dinh;
      const x = raw as Record<string, unknown>;
      const chuan = (value: unknown, fallback: number) => { const n = Number(value); return Number.isFinite(n) ? Math.max(90, Math.min(100, Math.round(n * 1000) / 1000)) : fallback; };
      return {
        sla_muc_tieu_percent: chuan(x.sla_muc_tieu_percent, mac_dinh.sla_muc_tieu_percent),
        uptime_muc_tieu_percent: chuan(x.uptime_muc_tieu_percent, mac_dinh.uptime_muc_tieu_percent),
        canh_bao_xu_huong: typeof x.canh_bao_xu_huong === "boolean" ? x.canh_bao_xu_huong : mac_dinh.canh_bao_xu_huong,
        nguon_cau_hinh: "DATABASE" as const,
        ngay_cap_nhat: item.ngay_cap_nhat
      };
    } catch (error) {
      this.logger.debug(`Không đọc được cấu hình SLO từ DB, dùng .env: ${error instanceof Error ? error.message : String(error)}`);
      return mac_dinh;
    }
  }

  async lay_cau_hinh_slo_van_hanh() {
    return this.cau_hinh_slo_van_hanh_runtime();
  }

  async cap_nhat_cau_hinh_slo_van_hanh(actor: NguoiDungXacThuc, dto: CapNhatSloVanHanhDto) {
    const truocRuntime = await this.cau_hinh_slo_van_hanh_runtime();
    const truoc = { sla_muc_tieu_percent: truocRuntime.sla_muc_tieu_percent, uptime_muc_tieu_percent: truocRuntime.uptime_muc_tieu_percent, canh_bao_xu_huong: truocRuntime.canh_bao_xu_huong };
    const sau = {
      sla_muc_tieu_percent: Math.round(dto.sla_muc_tieu_percent * 1000) / 1000,
      uptime_muc_tieu_percent: Math.round(dto.uptime_muc_tieu_percent * 1000) / 1000,
      canh_bao_xu_huong: dto.canh_bao_xu_huong
    };
    await this.db.$transaction([
      this.db.cauHinhHeThong.upsert({ where: { khoa: "SLO_VAN_HANH_CAU_HINH" }, create: { khoa: "SLO_VAN_HANH_CAU_HINH", gia_tri: sau, nguoi_cap_nhat_id: actor.id }, update: { gia_tri: sau, nguoi_cap_nhat_id: actor.id } }),
      this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_CAU_HINH_SLO_VAN_HANH", nguoi_dung_id: actor.id, chi_tiet: { truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } })
    ]);
    return this.cau_hinh_slo_van_hanh_runtime();
  }

  private doc_moc_thoi_gian(raw: unknown) {
    if (typeof raw !== "string" || !raw.trim()) return null;
    const value = new Date(raw);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  private chuan_hoa_bao_tri_v370(raw: unknown): BaoTriV370Luu | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const x = raw as Record<string, unknown>;
    const bat_dau = this.doc_moc_thoi_gian(x.bat_dau);
    const ket_thuc = this.doc_moc_thoi_gian(x.ket_thuc);
    if (!bat_dau || !ket_thuc || ket_thuc <= bat_dau) return null;
    const lap_lai = ["KHONG", "HANG_NGAY", "HANG_TUAN"].includes(String(x.lap_lai || "KHONG").toUpperCase())
      ? String(x.lap_lai || "KHONG").toUpperCase() as "KHONG" | "HANG_NGAY" | "HANG_TUAN"
      : "KHONG";
    return {
      id: typeof x.id === "string" && x.id.trim() ? x.id.trim() : randomUUID(),
      ten: typeof x.ten === "string" && x.ten.trim() ? x.ten.trim().slice(0, 120) : "Maintenance window",
      bat: x.bat === true,
      bat_dau: bat_dau.toISOString(),
      ket_thuc: ket_thuc.toISOString(),
      lap_lai,
      ly_do: typeof x.ly_do === "string" ? x.ly_do.trim().slice(0, 500) : ""
    };
  }

  private tinh_trang_thai_bao_tri_v370(item: { bat: boolean; bat_dau: string; ket_thuc: string; lap_lai: "KHONG" | "HANG_NGAY" | "HANG_TUAN" }, now = new Date()) {
    const anchorStart = new Date(item.bat_dau).getTime();
    const anchorEnd = new Date(item.ket_thuc).getTime();
    const duration = anchorEnd - anchorStart;
    if (!item.bat || duration <= 0) return { dang_bao_tri: false, sap_bao_tri: false, da_ket_thuc: false, lan_bat_dau: null as string | null, lan_ket_thuc: null as string | null, lan_tiep_theo: null as string | null };
    const nowMs = now.getTime();
    if (item.lap_lai === "KHONG") {
      return {
        dang_bao_tri: nowMs >= anchorStart && nowMs <= anchorEnd,
        sap_bao_tri: nowMs < anchorStart,
        da_ket_thuc: nowMs > anchorEnd,
        lan_bat_dau: new Date(anchorStart).toISOString(),
        lan_ket_thuc: new Date(anchorEnd).toISOString(),
        lan_tiep_theo: nowMs < anchorStart ? new Date(anchorStart).toISOString() : null
      };
    }
    const period = item.lap_lai === "HANG_NGAY" ? 86_400_000 : 7 * 86_400_000;
    if (nowMs < anchorStart) return { dang_bao_tri: false, sap_bao_tri: true, da_ket_thuc: false, lan_bat_dau: null, lan_ket_thuc: null, lan_tiep_theo: new Date(anchorStart).toISOString() };
    const index = Math.floor((nowMs - anchorStart) / period);
    const currentStart = anchorStart + index * period;
    const currentEnd = currentStart + duration;
    if (nowMs <= currentEnd) return { dang_bao_tri: true, sap_bao_tri: false, da_ket_thuc: false, lan_bat_dau: new Date(currentStart).toISOString(), lan_ket_thuc: new Date(currentEnd).toISOString(), lan_tiep_theo: new Date(currentStart + period).toISOString() };
    const nextStart = currentStart + period;
    return { dang_bao_tri: false, sap_bao_tri: true, da_ket_thuc: false, lan_bat_dau: new Date(currentStart).toISOString(), lan_ket_thuc: new Date(currentEnd).toISOString(), lan_tiep_theo: new Date(nextStart).toISOString() };
  }

  private kiem_tra_bao_tri_v370(item: { bat: boolean; bat_dau: string; ket_thuc: string; lap_lai: "KHONG" | "HANG_NGAY" | "HANG_TUAN" }) {
    const bat_dau = this.doc_moc_thoi_gian(item.bat_dau);
    const ket_thuc = this.doc_moc_thoi_gian(item.ket_thuc);
    if (!bat_dau || !ket_thuc) throw new BadRequestException("Thời gian maintenance window không hợp lệ");
    if (ket_thuc <= bat_dau) throw new BadRequestException("Thời gian kết thúc bảo trì phải sau thời gian bắt đầu");
    const duration = ket_thuc.getTime() - bat_dau.getTime();
    if (item.lap_lai === "KHONG" && duration > 30 * 86_400_000) throw new BadRequestException("Một maintenance window không lặp không được dài quá 30 ngày");
    if (item.lap_lai === "HANG_NGAY" && duration > 86_400_000) throw new BadRequestException("Maintenance lặp hằng ngày không được dài quá 24 giờ");
    if (item.lap_lai === "HANG_TUAN" && duration > 7 * 86_400_000) throw new BadRequestException("Maintenance lặp hằng tuần không được dài quá 7 ngày");
  }

  private async danh_sach_bao_tri_v370_runtime() {
    try {
      const item = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "BAO_TRI_HE_THONG_V370" } });
      const raw = item?.gia_tri;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const windows = Array.isArray((raw as Record<string, unknown>).windows) ? (raw as Record<string, unknown>).windows as unknown[] : [];
        const ds = windows.map(x => this.chuan_hoa_bao_tri_v370(x)).filter((x): x is NonNullable<typeof x> => !!x);
        return { du_lieu: ds.map(x => ({ ...x, ...this.tinh_trang_thai_bao_tri_v370(x) })), nguon_cau_hinh: "DATABASE" as const, ngay_cap_nhat: item?.ngay_cap_nhat || null };
      }
      const legacy = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "BAO_TRI_HE_THONG_CAU_HINH" } });
      const old = this.chuan_hoa_bao_tri_v370(legacy?.gia_tri && typeof legacy.gia_tri === "object" && !Array.isArray(legacy.gia_tri) ? { id: "legacy", ten: "Maintenance window mặc định", lap_lai: "KHONG", ...(legacy.gia_tri as Record<string, unknown>) } : null);
      return { du_lieu: old ? [{ ...old, ...this.tinh_trang_thai_bao_tri_v370(old) }] : [], nguon_cau_hinh: old ? "LEGACY" as const : "MAC_DINH" as const, ngay_cap_nhat: legacy?.ngay_cap_nhat || null };
    } catch (error) {
      this.logger.debug(`Không đọc được maintenance windows: ${error instanceof Error ? error.message : String(error)}`);
      return { du_lieu: [], nguon_cau_hinh: "MAC_DINH" as const, ngay_cap_nhat: null };
    }
  }

  private async luu_danh_sach_bao_tri_v370(actor: NguoiDungXacThuc, windows: BaoTriV370Luu[]) {
    const gia_tri: Prisma.InputJsonObject = { windows };
    await this.db.cauHinhHeThong.upsert({
      where: { khoa: "BAO_TRI_HE_THONG_V370" },
      create: { khoa: "BAO_TRI_HE_THONG_V370", gia_tri, nguoi_cap_nhat_id: actor.id },
      update: { gia_tri, nguoi_cap_nhat_id: actor.id }
    });
  }

  private async bao_tri_he_thong_runtime() {
    const all = await this.danh_sach_bao_tri_v370_runtime();
    const dang = all.du_lieu.find(x => x.dang_bao_tri) || null;
    const sap = all.du_lieu.filter(x => x.bat && x.lan_tiep_theo).sort((a, b) => new Date(a.lan_tiep_theo!).getTime() - new Date(b.lan_tiep_theo!).getTime())[0] || null;
    const chon = dang || sap;
    return {
      bat: all.du_lieu.some(x => x.bat),
      bat_dau: chon?.lan_bat_dau || chon?.lan_tiep_theo || null,
      ket_thuc: chon?.lan_ket_thuc || null,
      ly_do: chon?.ly_do || "",
      dang_bao_tri: !!dang,
      sap_bao_tri: !dang && !!sap,
      da_ket_thuc: !dang && !sap && all.du_lieu.length > 0,
      cua_so_dang_hoat_dong: dang,
      cua_so_tiep_theo: sap,
      tong_cua_so: all.du_lieu.length,
      danh_sach: all.du_lieu,
      nguon_cau_hinh: all.nguon_cau_hinh,
      ngay_cap_nhat: all.ngay_cap_nhat
    };
  }

  async lay_bao_tri_he_thong() { return this.bao_tri_he_thong_runtime(); }
  async lay_danh_sach_bao_tri_he_thong() { return this.danh_sach_bao_tri_v370_runtime(); }

  async tao_bao_tri_he_thong(actor: NguoiDungXacThuc, dto: TaoBaoTriNangCaoDto) {
    const current = await this.danh_sach_bao_tri_v370_runtime();
    if (current.du_lieu.length >= 50) throw new BadRequestException("Tối đa 50 maintenance window");
    const item = { id: randomUUID(), ten: dto.ten.trim(), bat: dto.bat, bat_dau: new Date(dto.bat_dau).toISOString(), ket_thuc: new Date(dto.ket_thuc).toISOString(), lap_lai: dto.lap_lai || "KHONG" as const, ly_do: dto.ly_do?.trim() || "" };
    this.kiem_tra_bao_tri_v370(item);
    const windows = [...current.du_lieu.map(({ dang_bao_tri: _1, sap_bao_tri: _2, da_ket_thuc: _3, lan_bat_dau: _4, lan_ket_thuc: _5, lan_tiep_theo: _6, ...x }) => x), item];
    await this.luu_danh_sach_bao_tri_v370(actor, windows);
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_BAO_TRI_HE_THONG", nguoi_dung_id: actor.id, chi_tiet: { sau: item } } });
    await this.ghi_lich_su_van_hanh("MAINTENANCE", "DA_LEN_LICH", `Admin ${actor.ho_ten} tạo maintenance window`, { ...item, nguoi_cap_nhat: actor.ho_ten });
    return this.lay_danh_sach_bao_tri_he_thong();
  }

  async cap_nhat_bao_tri_nang_cao(actor: NguoiDungXacThuc, id: string, dto: CapNhatBaoTriNangCaoDto) {
    const current = await this.danh_sach_bao_tri_v370_runtime();
    const index = current.du_lieu.findIndex(x => x.id === id);
    if (index < 0) throw new NotFoundException("Không tìm thấy maintenance window");
    const old = current.du_lieu[index];
    const item = {
      id: old.id,
      ten: dto.ten?.trim() || old.ten,
      bat: dto.bat ?? old.bat,
      bat_dau: dto.bat_dau ? new Date(dto.bat_dau).toISOString() : old.bat_dau,
      ket_thuc: dto.ket_thuc ? new Date(dto.ket_thuc).toISOString() : old.ket_thuc,
      lap_lai: dto.lap_lai || old.lap_lai,
      ly_do: dto.ly_do !== undefined ? dto.ly_do.trim() : old.ly_do
    };
    this.kiem_tra_bao_tri_v370(item);
    const windows = current.du_lieu.map((x, i) => i === index ? item : ({ id: x.id, ten: x.ten, bat: x.bat, bat_dau: x.bat_dau, ket_thuc: x.ket_thuc, lap_lai: x.lap_lai, ly_do: x.ly_do }));
    await this.luu_danh_sach_bao_tri_v370(actor, windows);
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_BAO_TRI_HE_THONG_V370", nguoi_dung_id: actor.id, chi_tiet: { id, truoc: old, sau: item, thay_doi: this.tao_diff(old as unknown as Record<string, unknown>, item as unknown as Record<string, unknown>) } } });
    await this.ghi_lich_su_van_hanh("MAINTENANCE", item.bat ? "DA_LEN_LICH" : "DA_TAT", `Admin ${actor.ho_ten} cập nhật maintenance window`, { ...item, nguoi_cap_nhat: actor.ho_ten });
    return this.lay_danh_sach_bao_tri_he_thong();
  }

  async xoa_bao_tri_he_thong(actor: NguoiDungXacThuc, id: string) {
    const current = await this.danh_sach_bao_tri_v370_runtime();
    const old = current.du_lieu.find(x => x.id === id);
    if (!old) throw new NotFoundException("Không tìm thấy maintenance window");
    const windows = current.du_lieu.filter(x => x.id !== id).map(x => ({ id: x.id, ten: x.ten, bat: x.bat, bat_dau: x.bat_dau, ket_thuc: x.ket_thuc, lap_lai: x.lap_lai, ly_do: x.ly_do }));
    await this.luu_danh_sach_bao_tri_v370(actor, windows);
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_BAO_TRI_HE_THONG", nguoi_dung_id: actor.id, chi_tiet: { truoc: old } } });
    await this.ghi_lich_su_van_hanh("MAINTENANCE", "DA_XOA", `Admin ${actor.ho_ten} xóa maintenance window`, { id, ten: old.ten, nguoi_cap_nhat: actor.ho_ten });
    return this.lay_danh_sach_bao_tri_he_thong();
  }

  async cap_nhat_bao_tri_he_thong(actor: NguoiDungXacThuc, dto: CapNhatBaoTriHeThongDto) {
    let bat_dau: Date | null = null; let ket_thuc: Date | null = null;
    if (dto.bat) {
      bat_dau = this.doc_moc_thoi_gian(dto.bat_dau); ket_thuc = this.doc_moc_thoi_gian(dto.ket_thuc);
      if (!bat_dau || !ket_thuc) throw new BadRequestException("Bảo trì đang bật thì phải có thời gian bắt đầu và kết thúc hợp lệ");
    } else {
      bat_dau = this.doc_moc_thoi_gian(dto.bat_dau) || new Date();
      ket_thuc = this.doc_moc_thoi_gian(dto.ket_thuc) || new Date(bat_dau.getTime() + 3_600_000);
    }
    const current = await this.danh_sach_bao_tri_v370_runtime();
    const legacy = { id: "legacy", ten: "Maintenance window mặc định", bat: dto.bat, bat_dau: bat_dau.toISOString(), ket_thuc: ket_thuc.toISOString(), lap_lai: "KHONG" as const, ly_do: dto.ly_do?.trim() || "" };
    this.kiem_tra_bao_tri_v370(legacy);
    const windows = [legacy, ...current.du_lieu.filter(x => x.id !== "legacy").map(x => ({ id: x.id, ten: x.ten, bat: x.bat, bat_dau: x.bat_dau, ket_thuc: x.ket_thuc, lap_lai: x.lap_lai, ly_do: x.ly_do }))];
    await this.luu_danh_sach_bao_tri_v370(actor, windows);
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_BAO_TRI_HE_THONG", nguoi_dung_id: actor.id, chi_tiet: { sau: legacy } } });
    await this.ghi_lich_su_van_hanh("MAINTENANCE", dto.bat ? "DA_LEN_LICH" : "DA_TAT", dto.bat ? "Admin cập nhật maintenance window tương thích" : "Admin tắt maintenance window tương thích", { ...legacy, nguoi_cap_nhat: actor.ho_ten });
    return this.bao_tri_he_thong_runtime();
  }

  private cau_hinh_webhook_canh_bao() {
    const bat = ["1", "true", "yes", "on"].includes((process.env.SYSTEM_ALERT_WEBHOOK_ENABLED || "false").trim().toLowerCase());
    const rawUrl = process.env.SYSTEM_ALERT_WEBHOOK_URL?.trim() || "";
    let hop_le = false; let endpoint = "";
    if (rawUrl) {
      try {
        const url = new URL(rawUrl);
        hop_le = url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:");
        endpoint = hop_le ? `${url.protocol}//${url.host}${url.pathname}` : "";
      } catch { hop_le = false; }
    }
    const retriesRaw = Number(process.env.SYSTEM_ALERT_WEBHOOK_MAX_RETRIES || 3);
    const backoffRaw = Number(process.env.SYSTEM_ALERT_WEBHOOK_BACKOFF_MS || 750);
    const max_retries = Number.isFinite(retriesRaw) ? Math.max(0, Math.min(5, Math.floor(retriesRaw))) : 3;
    const backoff_ms = Number.isFinite(backoffRaw) ? Math.max(100, Math.min(10_000, Math.floor(backoffRaw))) : 750;
    const co_hmac = !!process.env.SYSTEM_ALERT_WEBHOOK_SECRET?.trim();
    const adapterRaw = (process.env.SYSTEM_ALERT_WEBHOOK_ADAPTER || "GENERIC").trim().toUpperCase();
    const adapter = (["GENERIC", "SLACK", "TEAMS", "DISCORD"].includes(adapterRaw) ? adapterRaw : "GENERIC") as "GENERIC" | "SLACK" | "TEAMS" | "DISCORD";
    const retentionRaw = Number(process.env.SYSTEM_ALERT_WEBHOOK_DLQ_RETENTION_DAYS || 30);
    const dlq_retention_days = Number.isFinite(retentionRaw) ? Math.max(1, Math.min(365, Math.floor(retentionRaw))) : 30;
    const replay_allow_duplicate = ["1", "true", "yes", "on"].includes((process.env.SYSTEM_ALERT_WEBHOOK_REPLAY_ALLOW_DUPLICATE || "false").trim().toLowerCase());
    return { bat, san_sang: bat && hop_le, endpoint, timeout_ms: 5000, max_retries, backoff_ms, co_hmac, adapter, dlq_retention_days, replay_allow_duplicate, dlq_encryption_ready: !!this.khoa_ma_hoa_dlq_v3100(), dlq_scheduler: this.cau_hinh_webhook_dlq_scheduler() };
  }

  private dinh_dang_webhook_payload(payload: Record<string, unknown>, adapter: "GENERIC" | "SLACK" | "TEAMS" | "DISCORD") {
    if (adapter === "GENERIC") return payload;
    const van_de = Array.isArray(payload.van_de) ? payload.van_de.map(x => String(x)) : [];
    const title = `NhienIn3d · ${String(payload.event || "system.alert")}`;
    const summary = van_de.length ? van_de.join(" · ") : String(payload.trang_thai || "Cảnh báo vận hành");
    const stamp = new Date().toISOString();
    if (adapter === "SLACK") return { text: `${title}: ${summary}`, blocks: [{ type: "section", text: { type: "mrkdwn", text: `*${title}*\n${summary}` } }], nhienin3d: payload };
    if (adapter === "DISCORD") return { content: `${title}: ${summary}`, embeds: [{ title, description: summary, timestamp: stamp }], nhienin3d: payload };
    return { type: "message", attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", content: { type: "AdaptiveCard", version: "1.4", body: [{ type: "TextBlock", weight: "Bolder", text: title }, { type: "TextBlock", wrap: true, text: summary }] } }], nhienin3d: payload };
  }

  private giai_quyet_secret_ref_v3110(raw: string) {
    const value = raw.trim();
    const match = value.match(/^\$\{ENV:([A-Z][A-Z0-9_]{1,79})\}$/);
    return match ? (process.env[match[1]]?.trim() || "") : value;
  }

  private dlq_keyring_v3110() {
    const keys = new Map<string, { key: Buffer; key_id: string; nguon: string }>();
    const rawRing = process.env.SYSTEM_ALERT_WEBHOOK_DLQ_KEYRING_JSON?.trim();
    if (rawRing) {
      try {
        const parsed = JSON.parse(rawRing) as Record<string, unknown>;
        for (const [idRaw, secretRaw] of Object.entries(parsed)) {
          const id = idRaw.trim();
          if (!/^[A-Za-z0-9._-]{2,64}$/.test(id) || typeof secretRaw !== "string") continue;
          const secret = this.giai_quyet_secret_ref_v3110(secretRaw);
          if (secret.length < 16) continue;
          keys.set(id, { key: createHash("sha256").update(secret).digest(), key_id: id, nguon: secretRaw.includes("${ENV:") ? "KEYRING_ENV_REF" : "KEYRING_INLINE" });
        }
      } catch (error) {
        this.logger.warn(`SYSTEM_ALERT_WEBHOOK_DLQ_KEYRING_JSON không hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const legacyRaw = process.env.SYSTEM_ALERT_WEBHOOK_DLQ_ENCRYPTION_KEY?.trim() || process.env.COOKIE_SECRET?.trim() || "";
    if (legacyRaw) {
      const digest = createHash("sha256").update(legacyRaw).digest();
      const legacyId = createHash("sha256").update(digest).digest("hex").slice(0, 16);
      if (!keys.has(legacyId)) keys.set(legacyId, { key: digest, key_id: legacyId, nguon: process.env.SYSTEM_ALERT_WEBHOOK_DLQ_ENCRYPTION_KEY?.trim() ? "DLQ_ENV_LEGACY" : "COOKIE_SECRET_DERIVED" });
    }
    const requested = process.env.SYSTEM_ALERT_WEBHOOK_DLQ_ACTIVE_KEY_ID?.trim() || "";
    // Fail closed khi operator yêu cầu một key_id không tồn tại: không tự rơi sang key khác
    // vì điều đó có thể làm rotation mã hóa bằng khóa ngoài ý muốn.
    const active = requested ? (keys.get(requested) || null) : ([...keys.values()][0] || null);
    return { active, keys, active_key_id: active?.key_id || null, key_ids: [...keys.keys()], configured: keys.size, requested_active_key_id: requested || null };
  }

  private khoa_ma_hoa_dlq_v3100() {
    return this.dlq_keyring_v3110().active;
  }

  private ma_hoa_payload_dlq_v3100(payload: Record<string, unknown>) {
    const keyInfo = this.khoa_ma_hoa_dlq_v3100();
    if (!keyInfo) return null;
    const plain = JSON.stringify(payload);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", keyInfo.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      payload_ciphertext: ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      auth_tag: authTag.toString("base64"),
      key_id: keyInfo.key_id,
      payload_hash: createHash("sha256").update(plain).digest("hex")
    };
  }

  private giai_ma_payload_dlq_v3100(item: { payload_ciphertext: string; iv: string; auth_tag: string; key_id: string }) {
    const keyInfo = this.dlq_keyring_v3110().keys.get(item.key_id) || null;
    if (!keyInfo) throw new BadRequestException(`Không có khóa giải mã phù hợp cho dead-letter payload key_id=${item.key_id}`);
    try {
      const decipher = createDecipheriv("aes-256-gcm", keyInfo.key, Buffer.from(item.iv, "base64"));
      decipher.setAuthTag(Buffer.from(item.auth_tag, "base64"));
      const plain = Buffer.concat([decipher.update(Buffer.from(item.payload_ciphertext, "base64")), decipher.final()]).toString("utf8");
      const payload = JSON.parse(plain);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("payload invalid");
      return payload as Record<string, unknown>;
    } catch (error) {
      throw new BadRequestException(`Không giải mã được dead-letter payload: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async luu_dead_letter_ma_hoa_v3100(payload: Record<string, unknown>, meta: { endpoint: string; adapter: string; ly_do: string; so_lan_thu: number; http_status: number | null; idempotency_key: string; retention_days: number }) {
    const encrypted = this.ma_hoa_payload_dlq_v3100(payload);
    const payload_ref = encrypted ? randomUUID() : null;
    const history = await this.ghi_lich_su_van_hanh("WEBHOOK_DLQ", "CHO_RETRY", "Webhook thất bại sau retry, đã đưa vào dead-letter mã hóa", {
      endpoint: meta.endpoint, adapter: meta.adapter, payload_ref, payload_hash: encrypted?.payload_hash || null, payload_encrypted: !!encrypted, ly_do: meta.ly_do, so_lan_thu: meta.so_lan_thu, http_status: meta.http_status, idempotency_key: meta.idempotency_key, retention_days: meta.retention_days
    });
    if (!encrypted || !payload_ref) return;
    const policy = this.cau_hinh_webhook_dlq_scheduler();
    const retryAt = new Date(Date.now() + policy.chu_ky_phut * 60_000);
    const expiresAt = new Date(Date.now() + meta.retention_days * 86_400_000);
    try {
      await this.db.webhookDlqPayload.create({ data: { id: payload_ref, dead_letter_history_id: history?.id ?? null, ...encrypted, idempotency_key: meta.idempotency_key, endpoint: meta.endpoint, adapter: meta.adapter, trang_thai: "CHO_RETRY", so_lan_retry_tu_dong: 0, retry_tiep_theo_luc: retryAt, het_han_luc: expiresAt, loi_cuoi: meta.ly_do } });
    } catch (error) {
      this.logger.warn(`Không lưu được encrypted DLQ payload v3.11.0: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async gui_webhook_canh_bao(payload: Record<string, unknown>, context: { replay_of?: string; tao_dead_letter?: boolean } = {}): Promise<WebhookSendResultV390> {
    const cau_hinh = this.cau_hinh_webhook_canh_bao();
    if (!cau_hinh.san_sang) return { da_gui: false, ly_do: cau_hinh.bat ? "Webhook chưa có URL hợp lệ" : "Webhook đang tắt", so_lan_thu: 0, hmac: false, adapter: cau_hinh.adapter };
    const token = process.env.SYSTEM_ALERT_WEBHOOK_BEARER_TOKEN?.trim();
    const secret = process.env.SYSTEM_ALERT_WEBHOOK_SECRET?.trim();
    const url = process.env.SYSTEM_ALERT_WEBHOOK_URL!.trim();
    const adapterPayload = this.dinh_dang_webhook_payload(payload, cau_hinh.adapter);
    const body = JSON.stringify(adapterPayload);
    const idempotency_key = createHash("sha256").update(`${cau_hinh.endpoint}|${body}`).digest("hex");
    let ket_qua_cuoi: WebhookSendResultV390 = { da_gui: false, ly_do: "Chưa gửi", so_lan_thu: 0, hmac: !!secret, adapter: cau_hinh.adapter };
    for (let index = 0; index <= cau_hinh.max_retries; index++) {
      const lan_thu = index + 1;
      const timestamp = String(Math.floor(Date.now() / 1000));
      const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "NhienIn3d-Ops/3.13.0", "x-nhienin3d-timestamp": timestamp, "x-nhienin3d-adapter": cau_hinh.adapter };
      if (token) headers.authorization = `Bearer ${token}`;
      if (secret) headers["x-nhienin3d-signature"] = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
      const bat_dau = performance.now();
      try {
        const response = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(cau_hinh.timeout_ms) });
        const do_tre_ms = Math.max(0, Math.round((performance.now() - bat_dau) * 10) / 10);
        const thanh_cong = response.ok;
        await this.ghi_lich_su_van_hanh("WEBHOOK", thanh_cong ? "THANH_CONG" : "THAT_BAI", thanh_cong ? "Webhook cảnh báo đã giao thành công" : `Webhook cảnh báo trả HTTP ${response.status}`, { endpoint: cau_hinh.endpoint, adapter: cau_hinh.adapter, lan_thu, http_status: response.status, do_tre_ms, hmac: !!secret, event: payload.event, chu_ky: payload.chu_ky, replay_of: context.replay_of || null, idempotency_key });
        if (thanh_cong) return { da_gui: true, http_status: response.status, so_lan_thu: lan_thu, hmac: !!secret, adapter: cau_hinh.adapter };
        ket_qua_cuoi = { da_gui: false, ly_do: `Webhook trả HTTP ${response.status}`, http_status: response.status, so_lan_thu: lan_thu, hmac: !!secret, adapter: cau_hinh.adapter };
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        if (!retryable) break;
      } catch (error) {
        const do_tre_ms = Math.max(0, Math.round((performance.now() - bat_dau) * 10) / 10);
        const ly_do = error instanceof Error ? error.message : String(error);
        ket_qua_cuoi = { da_gui: false, ly_do, so_lan_thu: lan_thu, hmac: !!secret, adapter: cau_hinh.adapter };
        await this.ghi_lich_su_van_hanh("WEBHOOK", "THAT_BAI", "Webhook cảnh báo gặp lỗi kết nối", { endpoint: cau_hinh.endpoint, adapter: cau_hinh.adapter, lan_thu, do_tre_ms, hmac: !!secret, loi: ly_do, event: payload.event, chu_ky: payload.chu_ky, replay_of: context.replay_of || null, idempotency_key });
      }
      if (index < cau_hinh.max_retries) await new Promise(resolve => setTimeout(resolve, Math.min(5000, cau_hinh.backoff_ms * (2 ** index))));
    }
    if (context.tao_dead_letter !== false) {
      await this.luu_dead_letter_ma_hoa_v3100(payload, { endpoint: cau_hinh.endpoint, adapter: cau_hinh.adapter, ly_do: ket_qua_cuoi.ly_do || "Không rõ", so_lan_thu: ket_qua_cuoi.so_lan_thu, http_status: ket_qua_cuoi.http_status ?? null, idempotency_key, retention_days: cau_hinh.dlq_retention_days });
    }
    return ket_qua_cuoi;
  }

  async danh_sach_webhook_delivery(gioiHanRaw?: string, trangThaiRaw?: string) {
    const gioi_han = Math.max(5, Math.min(100, Number.parseInt(gioiHanRaw || "30", 10) || 30));
    const trang_thai = trangThaiRaw?.trim().toUpperCase();
    if (trang_thai && !["THANH_CONG", "THAT_BAI"].includes(trang_thai)) throw new BadRequestException("Trạng thái webhook không hợp lệ");
    const ds = await this.db.lichSuVanHanh.findMany({ where: { loai: "WEBHOOK", ...(trang_thai ? { trang_thai } : {}) }, orderBy: { id: "desc" }, take: gioi_han });
    return { du_lieu: ds.map(x => ({ ...x, id: x.id.toString() })), gioi_han, cau_hinh: this.cau_hinh_webhook_canh_bao() };
  }

  private parse_webhook_dead_letter_id(idRaw: string) {
    try { const id = BigInt(idRaw.trim()); if (id <= 0n) throw new Error(); return id; }
    catch { throw new BadRequestException("ID dead-letter không hợp lệ"); }
  }

  async danh_sach_webhook_dead_letter(gioiHanRaw?: string, trangThaiRaw?: string) {
    const gioi_han = Math.max(5, Math.min(100, Number.parseInt(gioiHanRaw || "30", 10) || 30));
    const cau_hinh = this.cau_hinh_webhook_canh_bao();
    const trang_thai = trangThaiRaw?.trim().toUpperCase() || "";
    if (trang_thai && !["CHO_RETRY", "CHO_REPLAY", "DA_REPLAY", "DA_ACK", "HET_HAN", "RETRY_THAT_BAI"].includes(trang_thai)) throw new BadRequestException("Trạng thái dead-letter không hợp lệ");
    try {
      const payloads = await this.db.webhookDlqPayload.findMany({ orderBy: { ngay_tao: "desc" }, take: Math.max(gioi_han * 4, 100) });
      const historyIds = payloads.map(x => x.dead_letter_history_id).filter((x): x is bigint => x != null);
      const histories = historyIds.length ? await this.db.lichSuVanHanh.findMany({ where: { id: { in: historyIds } } }) : [];
      const byId = new Map(histories.map(x => [x.id.toString(), x]));
      const now = Date.now();
      const mapped = payloads.map(x => {
        const hid = x.dead_letter_history_id?.toString() || x.id;
        const history = x.dead_letter_history_id ? byId.get(x.dead_letter_history_id.toString()) : null;
        const het_han = x.het_han_luc.getTime() <= now || x.trang_thai === "HET_HAN";
        const trang_thai_dlq = het_han ? "HET_HAN" : x.trang_thai;
        return {
          id: hid,
          payload_ref: x.id,
          loai: "WEBHOOK_DLQ",
          trang_thai: x.trang_thai,
          mo_ta: history?.mo_ta || "Webhook encrypted dead-letter",
          chi_tiet: history?.chi_tiet || {},
          ngay_tao: history?.ngay_tao || x.ngay_tao,
          da_replay: x.trang_thai === "DA_REPLAY",
          da_ack: x.trang_thai === "DA_ACK",
          het_han,
          trang_thai_dlq,
          idempotency_key: x.idempotency_key,
          het_han_luc: x.het_han_luc.toISOString(),
          retry_tiep_theo_luc: x.retry_tiep_theo_luc?.toISOString() || null,
          so_lan_retry_tu_dong: x.so_lan_retry_tu_dong,
          payload_encrypted: true,
          key_id: x.key_id
        };
      }).filter(x => !trang_thai || x.trang_thai_dlq === trang_thai || (trang_thai === "CHO_REPLAY" && x.trang_thai_dlq === "CHO_RETRY")).slice(0, gioi_han);
      return { du_lieu: mapped, gioi_han, bo_loc: { trang_thai: trang_thai || null }, cau_hinh: { ...cau_hinh, encrypted_payload_store: true, scheduler: this.cau_hinh_webhook_dlq_scheduler() } };
    } catch (error) {
      this.logger.debug(`DLQ v3.11.0 fallback sang lịch sử v3.9: ${error instanceof Error ? error.message : String(error)}`);
      const [ds, replay, ack] = await Promise.all([
        this.db.lichSuVanHanh.findMany({ where: { loai: "WEBHOOK_DLQ" }, orderBy: { id: "desc" }, take: Math.max(gioi_han * 4, 100) }),
        this.db.lichSuVanHanh.findMany({ where: { loai: "WEBHOOK_REPLAY", trang_thai: "THANH_CONG" }, orderBy: { id: "desc" }, take: 1000, select: { chi_tiet: true } }),
        this.db.lichSuVanHanh.findMany({ where: { loai: "WEBHOOK_DLQ_ACK", trang_thai: "DA_ACK" }, orderBy: { id: "desc" }, take: 1000, select: { chi_tiet: true } })
      ]);
      const replayed = new Set(replay.map(x => { const c = x.chi_tiet && typeof x.chi_tiet === "object" && !Array.isArray(x.chi_tiet) ? x.chi_tiet as Record<string, unknown> : {}; return String(c.dead_letter_id || ""); }).filter(Boolean));
      const acknowledged = new Set(ack.map(x => { const c = x.chi_tiet && typeof x.chi_tiet === "object" && !Array.isArray(x.chi_tiet) ? x.chi_tiet as Record<string, unknown> : {}; return String(c.dead_letter_id || ""); }).filter(Boolean));
      const expiresMs = cau_hinh.dlq_retention_days * 86_400_000;
      const mapped = ds.map(x => {
        const id = x.id.toString(); const da_replay = replayed.has(id); const da_ack = acknowledged.has(id); const het_han = Date.now() - x.ngay_tao.getTime() > expiresMs;
        const trang_thai_dlq = da_replay ? "DA_REPLAY" : da_ack ? "DA_ACK" : het_han ? "HET_HAN" : "CHO_REPLAY";
        const chi_tiet = x.chi_tiet && typeof x.chi_tiet === "object" && !Array.isArray(x.chi_tiet) ? x.chi_tiet as Record<string, unknown> : {};
        return { ...x, id, da_replay, da_ack, het_han, trang_thai_dlq, idempotency_key: String(chi_tiet.idempotency_key || ""), het_han_luc: new Date(x.ngay_tao.getTime() + expiresMs).toISOString(), payload_encrypted: false };
      }).filter(x => !trang_thai || x.trang_thai_dlq === trang_thai).slice(0, gioi_han);
      return { du_lieu: mapped, gioi_han, bo_loc: { trang_thai: trang_thai || null }, cau_hinh };
    }
  }

  async acknowledge_webhook_dead_letter(actor: NguoiDungXacThuc, idRaw: string, ghiChuRaw?: string) {
    const id = this.parse_webhook_dead_letter_id(idRaw);
    const item = await this.db.lichSuVanHanh.findUnique({ where: { id } });
    if (!item || item.loai !== "WEBHOOK_DLQ") throw new NotFoundException("Không tìm thấy webhook dead-letter");
    try {
      const payload = await this.db.webhookDlqPayload.findUnique({ where: { dead_letter_history_id: id } });
      if (payload) {
        if (payload.trang_thai === "DA_ACK") return { dead_letter_id: id.toString(), da_ack: true, lap_lai: true };
        await this.db.webhookDlqPayload.update({ where: { id: payload.id }, data: { trang_thai: "DA_ACK", retry_tiep_theo_luc: null } });
      }
    } catch (error) { this.logger.debug(`Không cập nhật DLQ payload khi acknowledge: ${error instanceof Error ? error.message : String(error)}`); }
    const existing = await this.db.lichSuVanHanh.findMany({ where: { loai: "WEBHOOK_DLQ_ACK" }, orderBy: { id: "desc" }, take: 1000, select: { chi_tiet: true } });
    if (existing.some(x => { const c = x.chi_tiet && typeof x.chi_tiet === "object" && !Array.isArray(x.chi_tiet) ? x.chi_tiet as Record<string, unknown> : {}; return String(c.dead_letter_id || "") === id.toString(); })) return { dead_letter_id: id.toString(), da_ack: true, lap_lai: true };
    await this.ghi_lich_su_van_hanh("WEBHOOK_DLQ_ACK", "DA_ACK", `Admin ${actor.ho_ten} acknowledge webhook dead-letter`, { dead_letter_id: id.toString(), ghi_chu: ghiChuRaw?.trim().slice(0, 500) || null, nguoi_ack: actor.ho_ten });
    return { dead_letter_id: id.toString(), da_ack: true, lap_lai: false };
  }

  async replay_webhook_dead_letter(actor: { ho_ten: string }, idRaw: string, boQuaIdempotency = false, scheduled = false, bulkJobId?: string) {
    const id = this.parse_webhook_dead_letter_id(idRaw);
    const item = await this.db.lichSuVanHanh.findUnique({ where: { id } });
    if (!item || item.loai !== "WEBHOOK_DLQ") throw new NotFoundException("Không tìm thấy webhook dead-letter");
    const cau_hinh = this.cau_hinh_webhook_canh_bao();
    let payloadRaw: Record<string, unknown> | null = null;
    let idempotency_key = "";
    let encryptedRecord: { id: string; payload_ciphertext: string; iv: string; auth_tag: string; key_id: string; idempotency_key: string; endpoint: string; adapter: string; trang_thai: string; so_lan_retry_tu_dong: number; het_han_luc: Date } | null = null;
    try {
      encryptedRecord = await this.db.webhookDlqPayload.findUnique({ where: { dead_letter_history_id: id } });
      if (encryptedRecord) {
        if (encryptedRecord.het_han_luc.getTime() <= Date.now()) throw new BadRequestException("Dead-letter đã hết retention, không thể replay");
        if (["DA_ACK", "DA_REPLAY", "HET_HAN"].includes(encryptedRecord.trang_thai) && !boQuaIdempotency) throw new BadRequestException(`Dead-letter đang ở trạng thái ${encryptedRecord.trang_thai}`);
        payloadRaw = this.giai_ma_payload_dlq_v3100(encryptedRecord);
        idempotency_key = encryptedRecord.idempotency_key;
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.debug(`Encrypted DLQ lookup fallback v3.9: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!payloadRaw) {
      if (Date.now() - item.ngay_tao.getTime() > cau_hinh.dlq_retention_days * 86_400_000) throw new BadRequestException("Dead-letter đã hết retention, không thể replay");
      const detail = item.chi_tiet && typeof item.chi_tiet === "object" && !Array.isArray(item.chi_tiet) ? item.chi_tiet as Record<string, unknown> : {};
      const legacy = detail.payload;
      if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) throw new BadRequestException("Dead-letter không chứa payload có thể replay hoặc thiếu khóa giải mã");
      payloadRaw = legacy as Record<string, unknown>; idempotency_key = String(detail.idempotency_key || "");
    }
    const allowDuplicate = boQuaIdempotency || cau_hinh.replay_allow_duplicate;
    if (idempotency_key && !allowDuplicate) {
      const replay = await this.db.lichSuVanHanh.findMany({ where: { loai: "WEBHOOK_REPLAY", trang_thai: "THANH_CONG" }, orderBy: { id: "desc" }, take: 1000, select: { chi_tiet: true } });
      const da_gui = replay.some(x => { const c = x.chi_tiet && typeof x.chi_tiet === "object" && !Array.isArray(x.chi_tiet) ? x.chi_tiet as Record<string, unknown> : {}; return String(c.idempotency_key || "") === idempotency_key; });
      if (da_gui) return { dead_letter_id: id.toString(), da_gui: true, bo_qua_idempotency: true, so_lan_thu: 0, hmac: cau_hinh.co_hmac, adapter: cau_hinh.adapter, idempotency_key };
    }
    if ((scheduled || bulkJobId) && encryptedRecord) {
      const budget = await this.tieu_thu_retry_budget_v3110(encryptedRecord.endpoint, encryptedRecord.adapter);
      if (!budget.duoc_phep) throw new BadRequestException(`Retry budget ${encryptedRecord.adapter} đã đạt ${budget.max_attempts}/${budget.window_minutes} phút`);
    }
    const result = await this.gui_webhook_canh_bao(payloadRaw, { replay_of: id.toString(), tao_dead_letter: false });
    if (encryptedRecord) {
      const policy = this.cau_hinh_webhook_dlq_scheduler();
      const attempts = encryptedRecord.so_lan_retry_tu_dong + (scheduled ? 1 : 0);
      const exhausted = scheduled && attempts >= policy.max_attempts;
      await this.db.webhookDlqPayload.update({ where: { id: encryptedRecord.id }, data: { trang_thai: result.da_gui ? "DA_REPLAY" : exhausted ? "RETRY_THAT_BAI" : "CHO_RETRY", so_lan_retry_tu_dong: attempts, retry_tiep_theo_luc: result.da_gui || exhausted ? null : new Date(Date.now() + policy.chu_ky_phut * 60_000 * Math.max(1, 2 ** Math.min(6, attempts))), loi_cuoi: result.ly_do || null } });
    }
    await this.ghi_lich_su_van_hanh("WEBHOOK_REPLAY", result.da_gui ? "THANH_CONG" : "THAT_BAI", result.da_gui ? `${scheduled ? "Scheduler" : `Admin ${actor.ho_ten}`} replay webhook thành công` : `${scheduled ? "Scheduler" : `Admin ${actor.ho_ten}`} replay webhook thất bại`, { dead_letter_id: id.toString(), idempotency_key, adapter: result.adapter, so_lan_thu: result.so_lan_thu, http_status: result.http_status ?? null, ly_do: result.ly_do ?? null, nguoi_replay: scheduled ? "SYSTEM_SCHEDULER" : actor.ho_ten, scheduled, bulk_job_id: bulkJobId || null, bo_qua_idempotency: allowDuplicate });
    return { dead_letter_id: id.toString(), idempotency_key, bo_qua_idempotency: false, scheduled, ...result };
  }

  async replay_bulk_webhook_dead_letter(actor: NguoiDungXacThuc, idsRaw: string[], boQuaIdempotency = false) {
    const ids = [...new Set(idsRaw.map(x => x.trim()).filter(Boolean))];
    if (!ids.length || ids.length > 20) throw new BadRequestException("Bulk replay cần từ 1 đến 20 dead-letter");
    const ket_qua: Array<Record<string, unknown>> = [];
    for (const id of ids) {
      try { ket_qua.push(await this.replay_webhook_dead_letter(actor, id, boQuaIdempotency)); }
      catch (error) { ket_qua.push({ dead_letter_id: id, da_gui: false, ly_do: error instanceof Error ? error.message : String(error) }); }
    }
    return { tong: ket_qua.length, thanh_cong: ket_qua.filter(x => x.da_gui === true).length, that_bai: ket_qua.filter(x => x.da_gui !== true).length, ket_qua };
  }

  private async xu_ly_webhook_dlq_job() {
    const policy = this.cau_hinh_webhook_dlq_scheduler();
    const now = new Date();
    let expired = 0; let processed = 0; let success = 0;
    try {
      const expire = await this.db.webhookDlqPayload.updateMany({ where: { het_han_luc: { lte: now }, trang_thai: { in: ["CHO_RETRY", "RETRY_THAT_BAI"] } }, data: { trang_thai: "HET_HAN", retry_tiep_theo_luc: null } });
      expired = expire.count;
      const due = await this.db.webhookDlqPayload.findMany({ where: { trang_thai: "CHO_RETRY", retry_tiep_theo_luc: { lte: now }, so_lan_retry_tu_dong: { lt: policy.max_attempts }, dead_letter_history_id: { not: null } }, orderBy: { retry_tiep_theo_luc: "asc" }, take: 10 });
      for (const item of due) {
        if (!item.dead_letter_history_id) continue;
        processed += 1;
        try {
          const kq = await this.replay_webhook_dead_letter({ ho_ten: "SYSTEM_SCHEDULER" }, item.dead_letter_history_id.toString(), false, true);
          if (kq.da_gui) success += 1;
        } catch (error) {
          const attempts = item.so_lan_retry_tu_dong + 1;
          await this.db.webhookDlqPayload.update({ where: { id: item.id }, data: { so_lan_retry_tu_dong: attempts, trang_thai: attempts >= policy.max_attempts ? "RETRY_THAT_BAI" : "CHO_RETRY", retry_tiep_theo_luc: attempts >= policy.max_attempts ? null : new Date(Date.now() + policy.chu_ky_phut * 60_000 * Math.max(1, 2 ** Math.min(6, attempts))), loi_cuoi: error instanceof Error ? error.message : String(error) } });
        }
      }
      if (expired || processed) await this.ghi_lich_su_van_hanh("WEBHOOK_DLQ_JOB", "THANH_CONG", "Scheduled retry/retention cleanup DLQ v3.11.0", { processed, success, expired, max_attempts: policy.max_attempts, interval_minutes: policy.chu_ky_phut });
    } catch (error) {
      this.logger.debug(`Webhook DLQ v3.11.0 job chưa sẵn sàng: ${error instanceof Error ? error.message : String(error)}`);
    }
    let replay_jobs: Record<string, unknown> = { jobs: 0, processed: 0 };
    try { replay_jobs = await this.xu_ly_webhook_replay_jobs_v3110(5); } catch (error) { this.logger.debug(`Replay job v3.11.0 chưa sẵn sàng: ${error instanceof Error ? error.message : String(error)}`); }
    try {
      const retryCfg = this.cau_hinh_retry_budget_v3110();
      await this.db.webhookRetryBudget.deleteMany({ where: { window_start: { lt: new Date(Date.now() - retryCfg.window_minutes * 4 * 60_000) } } });
    } catch {}
    return { processed, success, expired, policy, replay_jobs };
  }

  private async refresh_ops_metrics_cache() {
    const now = new Date();
    let value: Record<string, unknown> = { refreshed_at: now.toISOString(), nguon: "RUNTIME_FALLBACK" };
    try {
      await this.db.$executeRawUnsafe('REFRESH MATERIALIZED VIEW "ops_incident_metrics_v390"');
      const rows = await this.db.$queryRawUnsafe<Array<{ tong_incident: bigint; dang_mo: bigint; da_khac_phuc: bigint; mtta_phut: number | null; mtta_p95_phut: number | null; mttr_phut: number | null; mttr_p95_phut: number | null; refreshed_at: Date }>>('SELECT tong_incident, dang_mo, da_khac_phuc, mtta_phut, mtta_p95_phut, mttr_phut, mttr_p95_phut, refreshed_at FROM "ops_incident_metrics_v390" WHERE id = 1');
      const row = rows[0];
      if (row) value = { tong_incident: Number(row.tong_incident), dang_mo: Number(row.dang_mo), da_khac_phuc: Number(row.da_khac_phuc), mtta_phut: row.mtta_phut == null ? null : Number(row.mtta_phut), mtta_p95_phut: row.mtta_p95_phut == null ? null : Number(row.mtta_p95_phut), mttr_phut: row.mttr_phut == null ? null : Number(row.mttr_phut), mttr_p95_phut: row.mttr_p95_phut == null ? null : Number(row.mttr_p95_phut), refreshed_at: row.refreshed_at.toISOString(), nguon: "MATERIALIZED_VIEW_CACHE_V3100" };
      await this.db.opsMetricCache.upsert({ where: { khoa: "incident_metrics" }, create: { khoa: "incident_metrics", gia_tri: this.chuan_hoa_json_object(value), refreshed_at: now }, update: { gia_tri: this.chuan_hoa_json_object(value), refreshed_at: now } });
    } catch (error) {
      this.logger.debug(`Ops metric cache v3.11.0 chưa sẵn sàng: ${error instanceof Error ? error.message : String(error)}`);
    }
    return value;
  }

  private async cleanup_ops_retention() {
    const policy = this.cau_hinh_ops_scheduler();
    const directPrune = /^(1|true|yes|on)$/i.test(process.env.SYSTEM_OPS_DIRECT_PRUNE_ENABLED?.trim() || "false");
    if (!directPrune) {
      // v3.11.0: telemetry phải được archive + verify trước khi prune. Scheduler mặc định
      // không còn xóa trực tiếp dữ liệu nguồn để tránh mất dữ liệu trước khi archive.
      return { retention_days: policy.retention_days, endpoint_samples: 0, history: 0, mode: "ARCHIVE_REQUIRED" };
    }
    const cutoff = new Date(Date.now() - policy.retention_days * 86_400_000);
    let endpoint_samples = 0; let history = 0;
    try { endpoint_samples = (await this.db.sloEndpointMau.deleteMany({ where: { ngay_tao: { lt: cutoff } } })).count; } catch {}
    try {
      history = (await this.db.lichSuVanHanh.deleteMany({ where: { ngay_tao: { lt: cutoff }, chu_ky_canh_bao: null, loai: { in: ["SLO_ENDPOINT", "WEBHOOK", "WEBHOOK_REPLAY", "WEBHOOK_DLQ_JOB"] } } })).count;
    } catch {}
    if (endpoint_samples || history) await this.ghi_lich_su_van_hanh("OPS_RETENTION", "THANH_CONG", "Dọn telemetry trực tiếp theo retention v3.11.0 (explicit opt-in)", { retention_days: policy.retention_days, endpoint_samples, history, mode: "DIRECT_PRUNE" });
    return { retention_days: policy.retention_days, endpoint_samples, history, mode: "DIRECT_PRUNE" };
  }

  async trang_thai_ops_v3100() {
    const scheduler = this.cau_hinh_ops_scheduler();
    const dlq = this.cau_hinh_webhook_dlq_scheduler();
    const crypto = this.khoa_ma_hoa_dlq_v3100();
    const agent = this.cau_hinh_probe_agent_v3100();
    let cached: Record<string, unknown> | null = null;
    let endpoint_samples = 0; let assignments = 0;
    try {
      const [cache, countSamples, countAssignments] = await Promise.all([
        this.db.opsMetricCache.findUnique({ where: { khoa: "incident_metrics" } }),
        this.db.sloEndpointMau.count(),
        this.db.opsPhanCong.count({ where: { dang_hoat_dong: true } })
      ]);
      cached = cache?.gia_tri && typeof cache.gia_tri === "object" && !Array.isArray(cache.gia_tri) ? cache.gia_tri as Record<string, unknown> : null;
      endpoint_samples = countSamples; assignments = countAssignments;
    } catch {}
    return { phien_ban: "3.13.0", probe_agent: agent, endpoint_samples, dlq: { ...dlq, payload_encryption_ready: !!crypto, key_id: crypto?.key_id || null, key_source: crypto?.nguon || null }, ops_metrics: { ...scheduler, cache: cached }, rbac: { active_assignments: assignments, roles: ["OPS_VIEWER", "ON_CALL", "SERVICE_OWNER"] } };
  }

  private tao_headers_slo_endpoint(endpoint: SloEndpointCheckV390) {
    const headers: Record<string, string> = { "user-agent": "NhienIn3d-SLO-Probe/3.13.0" };
    const resolveTemplate = (value: string) => value.replace(/\$\{ENV:([A-Z][A-Z0-9_]*)\}/g, (_all, name: string) => process.env[name] || "");
    for (const [nameRaw, valueRaw] of Object.entries(endpoint.headers || {})) {
      const name = nameRaw.trim().toLowerCase();
      if (!/^[a-z0-9-]{1,50}$/.test(name) || ["host", "content-length", "cookie"].includes(name)) continue;
      headers[name] = resolveTemplate(String(valueRaw).slice(0, 300));
    }
    if (endpoint.auth_template === "BEARER_ENV" && endpoint.auth_env) {
      const token = process.env[endpoint.auth_env]?.trim();
      if (token) headers.authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private async kiem_tra_slo_endpoints() {
    const config = await this.cau_hinh_slo_nang_cao_runtime();
    const apiPort = Number(process.env.API_PORT || 3001);
    const base = `http://127.0.0.1:${Number.isFinite(apiPort) ? apiPort : 3001}`;
    const bao_tri = await this.bao_tri_he_thong_runtime();
    const agent = this.cau_hinh_probe_agent_v3100();
    const results = [] as Array<{ id: string; ten: string; path: string; method: string; ok: boolean; latency_ok: boolean; http_status: number | null; do_tre_ms: number; maintenance_active: boolean; apdex_bucket: string; agent_id: string; region: string; loi?: string }>;
    for (const endpoint of config.endpoint_checks) {
      const bat_dau = performance.now();
      let ok = false; let http_status: number | null = null; let loi: string | undefined;
      try {
        const response = await fetch(`${base}${endpoint.path}`, { method: endpoint.method, signal: AbortSignal.timeout(endpoint.timeout_ms), headers: this.tao_headers_slo_endpoint(endpoint) });
        http_status = response.status; ok = response.ok;
      } catch (error) { loi = error instanceof Error ? error.message : String(error); }
      const do_tre_ms = Math.max(0, Math.round((performance.now() - bat_dau) * 10) / 10);
      const latency_ok = do_tre_ms <= endpoint.latency_target_ms;
      const apdex_t_ms = endpoint.latency_target_ms;
      const apdex_bucket = !ok || do_tre_ms > apdex_t_ms * 4 ? "FRUSTRATED" : do_tre_ms <= apdex_t_ms ? "SATISFIED" : "TOLERATING";
      const item = { id: endpoint.id, ten: endpoint.ten, path: endpoint.path, method: endpoint.method, ok, latency_ok, http_status, do_tre_ms, maintenance_active: bao_tri.dang_bao_tri, apdex_bucket, agent_id: agent.agent_id, region: agent.region, ...(loi ? { loi } : {}) };
      results.push(item);
      try {
        await this.db.sloEndpointMau.create({ data: { endpoint_id: endpoint.id, agent_id: agent.agent_id, region: agent.region, node_name: agent.node_name, trang_thai: ok ? "TOT" : "LOI", http_status, do_tre_ms, latency_target_ms: endpoint.latency_target_ms, apdex_t_ms, apdex_bucket, maintenance_active: bao_tri.dang_bao_tri } });
      } catch (error) { this.logger.debug(`Persistent SLO sample v3.11.0 fallback: ${error instanceof Error ? error.message : String(error)}`); }
      await this.ghi_lich_su_van_hanh("SLO_ENDPOINT", ok ? "TOT" : "LOI", ok ? `Endpoint ${endpoint.ten} đáp ứng SLO probe` : `Endpoint ${endpoint.ten} không đáp ứng SLO probe`, {
        endpoint_id: endpoint.id, endpoint_ten: endpoint.ten, path: endpoint.path, method: endpoint.method,
        header_names: Object.keys(endpoint.headers || {}), auth_template: endpoint.auth_template,
        muc_tieu_percent: endpoint.muc_tieu_percent, latency_target_ms: endpoint.latency_target_ms, timeout_ms: endpoint.timeout_ms,
        ok, latency_ok, http_status, do_tre_ms, maintenance_active: bao_tri.dang_bao_tri, apdex_t_ms, apdex_bucket, agent_id: agent.agent_id, region: agent.region, node_name: agent.node_name, loi: loi || null
      });
    }
    return results;
  }

  private async thong_tin_backup() {
    const thu_muc = process.env.BACKUP_DIRECTORY?.trim() || "/app/backups";
    try {
      const ten_tep = (await readdir(thu_muc)).filter(x => x.toLowerCase().endsWith(".dump"));
      const ds = await Promise.all(ten_tep.map(async ten => {
        const info = await stat(join(thu_muc, ten));
        return { ten_file: ten, kich_thuoc_bytes: info.size, ngay_sua: info.mtime };
      }));
      ds.sort((a, b) => b.ngay_sua.getTime() - a.ngay_sua.getTime());
      const gan_nhat = ds[0] ?? null;
      return {
        thu_muc,
        so_ban_sao: ds.length,
        so_daily: ds.filter(x => x.ten_file.includes("-daily-")).length,
        so_weekly: ds.filter(x => x.ten_file.includes("-weekly-")).length,
        tong_dung_luong_bytes: ds.reduce((tong, x) => tong + x.kich_thuoc_bytes, 0),
        gan_nhat: gan_nhat ? { ...gan_nhat, tuoi_gio: Math.max(0, Math.round((Date.now() - gan_nhat.ngay_sua.getTime()) / 3_600_000)) } : null
      };
    } catch (error) {
      return { thu_muc, so_ban_sao: 0, so_daily: 0, so_weekly: 0, tong_dung_luong_bytes: 0, gan_nhat: null, loi: error instanceof Error ? error.message : String(error) };
    }
  }

  private chuan_hoa_json_object(value: Record<string, unknown>): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as Prisma.InputJsonObject;
  }

  private async dong_bo_tong_hop_su_co(chu_ky: string, loai: string, trang_thai: string, chi_tiet: Record<string, unknown>, ngay_tao: Date) {
    const rawVanDe = chi_tiet.van_de;
    const van_de = Array.isArray(rawVanDe) ? rawVanDe.map(x => String(x)) : [];
    const dich_vu = this.xep_dich_vu_su_co_v3110(van_de);
    const tong_hop = await this.db.suCoVanHanh.upsert({
      where: { chu_ky },
      create: {
        chu_ky, trang_thai_xu_ly: "MOI", van_de, dich_vu, bat_dau: ngay_tao, gan_nhat: ngay_tao,
        so_su_kien: 1, so_health: loai === "HEALTH" ? 1 : 0, so_alert: loai === "ALERT" ? 1 : 0, trang_thai_gan_nhat: trang_thai
      },
      update: {
        gan_nhat: ngay_tao,
        so_su_kien: { increment: 1 },
        ...(loai === "HEALTH" ? { so_health: { increment: 1 } } : {}),
        ...(loai === "ALERT" ? { so_alert: { increment: 1 } } : {}),
        trang_thai_gan_nhat: trang_thai,
        ...(van_de.length ? { van_de, dich_vu } : {})
      }
    });
    const mo_lai = tong_hop.trang_thai_xu_ly === "DA_KHAC_PHUC" && loai !== "INCIDENT";
    if (mo_lai) {
      await this.db.suCoVanHanh.update({ where: { chu_ky }, data: {
        trang_thai_xu_ly: "MOI", ghi_chu: null,
        nguoi_tiep_nhan_id: null, nguoi_tiep_nhan_ten: null, tiep_nhan_luc: null,
        nguoi_khac_phuc_id: null, nguoi_khac_phuc_ten: null, khac_phuc_luc: null
      } });
    }
  }

  private async ghi_lich_su_van_hanh(loai: string, trang_thai: string, mo_ta: string, chi_tiet: Record<string, unknown>, ngay_bat_dau?: Date, chu_ky_canh_bao?: string | null) {
    try {
      const item = await this.db.lichSuVanHanh.create({ data: { loai, trang_thai, mo_ta, chi_tiet: this.chuan_hoa_json_object(chi_tiet), chu_ky_canh_bao: chu_ky_canh_bao || null, ngay_bat_dau: ngay_bat_dau || null, ngay_ket_thuc: new Date() } });
      if (chu_ky_canh_bao) await this.dong_bo_tong_hop_su_co(chu_ky_canh_bao, loai, trang_thai, chi_tiet, item.ngay_tao);
      return item;
    } catch (error) {
      this.logger.debug(`Không ghi được lịch sử vận hành ${loai}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async suc_khoe_he_thong(ghi_lich_su = true) {
    const luc_bat_dau = new Date();
    const bat_dau = performance.now();
    let database: { ket_noi: boolean; do_tre_ms: number | null; dung_luong_bytes: number | null; migration_gan_nhat: { ten: string; hoan_tat_luc: Date | null } | null; loi?: string };
    try {
      await this.db.$queryRawUnsafe<Array<{ ok: number }>>("SELECT 1 AS ok");
      const do_tre_ms = Math.max(0, Math.round((performance.now() - bat_dau) * 10) / 10);
      const sizeRows = await this.db.$queryRawUnsafe<Array<{ bytes: bigint }>>("SELECT pg_database_size(current_database()) AS bytes");
      let migration_gan_nhat: { ten: string; hoan_tat_luc: Date | null } | null = null;
      try {
        const migrationRows = await this.db.$queryRawUnsafe<Array<{ migration_name: string; finished_at: Date | null }>>("SELECT migration_name, finished_at FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1");
        if (migrationRows[0]) migration_gan_nhat = { ten: migrationRows[0].migration_name, hoan_tat_luc: migrationRows[0].finished_at };
      } catch {
        migration_gan_nhat = null;
      }
      database = { ket_noi: true, do_tre_ms, dung_luong_bytes: sizeRows[0]?.bytes == null ? null : Number(sizeRows[0].bytes), migration_gan_nhat };
    } catch (error) {
      database = { ket_noi: false, do_tre_ms: null, dung_luong_bytes: null, migration_gan_nhat: null, loi: error instanceof Error ? error.message : String(error) };
    }

    const bo_nho = process.memoryUsage();
    const smtp = this.thu_dien_tu.trangThaiCauHinh();
    const backup = await this.thong_tin_backup();
    const canh_bao_kho = this.cau_hinh_canh_bao_kho_runtime();
    const canh_bao_he_thong = await this.cau_hinh_canh_bao_he_thong_runtime();
    const bao_tri = await this.bao_tri_he_thong_runtime();
    const webhook = this.cau_hinh_webhook_canh_bao();
    const van_de: string[] = [];
    if (!database.ket_noi) van_de.push(`PostgreSQL mất kết nối${database.loi ? `: ${database.loi}` : ""}`);
    if (!backup.gan_nhat) van_de.push("Chưa có bản backup PostgreSQL");
    else if (backup.gan_nhat.tuoi_gio > canh_bao_he_thong.backup_qua_han_gio) van_de.push(`Backup gần nhất đã ${backup.gan_nhat.tuoi_gio} giờ`);
    if (smtp.bat && !smtp.san_sang) van_de.push("SMTP đã bật nhưng cấu hình chưa sẵn sàng");
    const chu_ky_canh_bao = van_de.length ? createHash("sha256").update(JSON.stringify(van_de)).digest("hex") : null;
    const trang_thai = !database.ket_noi ? "LOI" : (van_de.length ? "CANH_BAO" : "TOT");
    const ket_qua = {
      trang_thai,
      phien_ban: "3.13.0",
      thoi_gian: new Date().toISOString(),
      api: { uptime_giay: Math.floor(process.uptime()), node: process.version, pid: process.pid, rss_bytes: bo_nho.rss, heap_used_bytes: bo_nho.heapUsed, heap_total_bytes: bo_nho.heapTotal },
      database,
      smtp,
      backup,
      van_de,
      chu_ky_canh_bao,
      canh_bao_kho,
      bao_tri,
      webhook,
      canh_bao_he_thong: { bat: canh_bao_he_thong.bat, chu_ky_phut: canh_bao_he_thong.chu_ky_phut, backup_qua_han_gio: canh_bao_he_thong.backup_qua_han_gio, im_lang_phut: canh_bao_he_thong.im_lang_phut, leo_thang_phut: canh_bao_he_thong.leo_thang_phut, nguon_cau_hinh: canh_bao_he_thong.nguon_cau_hinh }
    };
    if (ghi_lich_su && database.ket_noi) {
      await this.ghi_lich_su_van_hanh("HEALTH", trang_thai, trang_thai === "TOT" ? "Kiểm tra sức khỏe hệ thống đạt yêu cầu" : "Kiểm tra sức khỏe hệ thống phát hiện vấn đề", {
        database_ket_noi: database.ket_noi,
        database_do_tre_ms: database.do_tre_ms,
        backup_tuoi_gio: backup.gan_nhat?.tuoi_gio ?? null,
        smtp_bat: smtp.bat,
        smtp_san_sang: smtp.san_sang,
        maintenance_active: bao_tri.dang_bao_tri,
        van_de
      }, luc_bat_dau, chu_ky_canh_bao);
      try { await this.kiem_tra_slo_endpoints(); } catch (error) { this.logger.debug(`Không ghi được SLO endpoint probe: ${error instanceof Error ? error.message : String(error)}`); }
    }
    return ket_qua;
  }

  async kiem_tra_gui_canh_bao_he_thong_email(kiem_tra_thu_cong = false) {
    const cau_hinh = await this.cau_hinh_canh_bao_he_thong_runtime();
    const bao_tri = await this.bao_tri_he_thong_runtime();
    if (bao_tri.dang_bao_tri && !kiem_tra_thu_cong) return { da_gui: false, ly_do: `Đang trong maintenance window${bao_tri.ly_do ? `: ${bao_tri.ly_do}` : ""}`, van_de: [] as string[], cap_leo_thang: 0, bao_tri };
    if (!cau_hinh.bat && !kiem_tra_thu_cong) return { da_gui: false, ly_do: "Cảnh báo hệ thống đang tắt", van_de: [] as string[], cap_leo_thang: 0, bao_tri };
    const health = await this.suc_khoe_he_thong(false);
    const slo = await this.thong_ke_sla_van_hanh("30");
    const canh_bao_slo = slo.muc_tieu.canh_bao_xu_huong ? slo.canh_bao.map(x => `SLO: ${x}`) : [];
    const van_de = [...health.van_de, ...canh_bao_slo];
    const trang_thai_canh_bao = health.trang_thai === "TOT" && van_de.length ? "CANH_BAO" : health.trang_thai;
    if (!van_de.length) {
      this.chu_ky_canh_bao_he_thong = null;
      if (health.database.ket_noi) {
        try {
          await this.db.cauHinhHeThong.upsert({ where: { khoa: "CANH_BAO_HE_THONG_EMAIL" }, create: { khoa: "CANH_BAO_HE_THONG_EMAIL", gia_tri: { chu_ky: null, trang_thai: "TOT", cap_nhat_luc: health.thoi_gian, cap_leo_thang: 0 } }, update: { gia_tri: { chu_ky: null, trang_thai: "TOT", cap_nhat_luc: health.thoi_gian, cap_leo_thang: 0 } } });
        } catch {}
      }
      return { da_gui: false, ly_do: "Hệ thống đang hoạt động tốt", van_de, cap_leo_thang: 0 };
    }

    const chu_ky = canh_bao_slo.length
      ? createHash("sha256").update(JSON.stringify(van_de)).digest("hex")
      : (health.chu_ky_canh_bao || createHash("sha256").update(JSON.stringify(van_de)).digest("hex"));
    const now = new Date();
    let chu_ky_da_gui: string | null = this.chu_ky_canh_bao_he_thong;
    let phat_hien_luc = now;
    let lan_gui_luc: Date | null = null;
    let cap_da_gui = -1;
    if (health.database.ket_noi) {
      try {
        const state = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "CANH_BAO_HE_THONG_EMAIL" } });
        const raw = state?.gia_tri;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          const obj = raw as Record<string, unknown>;
          if (typeof obj.chu_ky === "string") chu_ky_da_gui = obj.chu_ky;
          if (obj.chu_ky === chu_ky && typeof obj.phat_hien_luc === "string") {
            const parsed = new Date(obj.phat_hien_luc); if (!Number.isNaN(parsed.getTime())) phat_hien_luc = parsed;
          }
          if (obj.chu_ky === chu_ky && typeof obj.lan_gui === "string") {
            const parsed = new Date(obj.lan_gui); if (!Number.isNaN(parsed.getTime())) lan_gui_luc = parsed;
          }
          if (obj.chu_ky === chu_ky && typeof obj.cap_leo_thang === "number") cap_da_gui = Math.max(-1, Math.floor(obj.cap_leo_thang));
        }
      } catch {}
    }

    const cung_su_co = chu_ky === chu_ky_da_gui;
    if (!cung_su_co) { phat_hien_luc = now; lan_gui_luc = null; cap_da_gui = -1; }
    const ton_tai_phut = Math.max(0, Math.floor((now.getTime() - phat_hien_luc.getTime()) / 60_000));
    const cap_leo_thang = ton_tai_phut < cau_hinh.leo_thang_phut ? 0 : Math.floor(ton_tai_phut / cau_hinh.leo_thang_phut);
    const tu_lan_gui_phut = lan_gui_luc ? Math.floor((now.getTime() - lan_gui_luc.getTime()) / 60_000) : Number.POSITIVE_INFINITY;
    if (cung_su_co && tu_lan_gui_phut < cau_hinh.im_lang_phut) {
      return { da_gui: false, ly_do: `Sự cố đang trong thời gian im lặng ${cau_hinh.im_lang_phut} phút`, van_de, cap_leo_thang, ton_tai_phut };
    }
    if (cung_su_co && cap_leo_thang <= cap_da_gui) {
      return { da_gui: false, ly_do: cap_leo_thang > 0 ? `Sự cố kéo dài nhưng đã gửi escalation cấp ${cap_da_gui}` : "Trạng thái cảnh báo chưa thay đổi; chờ escalation nếu sự cố kéo dài", van_de, cap_leo_thang, ton_tai_phut };
    }

    const dich_vu = this.xep_dich_vu_su_co_v3110(van_de);
    let onCallRouting: { emails: string[]; people: string[]; policy_level: number; kenh: "EMAIL" | "WEBHOOK" | "EMAIL_WEBHOOK" } = { emails: [], people: [], policy_level: Math.min(5, Math.max(1, cap_leo_thang + 1)), kenh: "EMAIL_WEBHOOK" };
    try {
      const roster = await this.on_call_hien_tai_v3110(dich_vu);
      const eligiblePolicies = roster.policies.filter(x => x.dang_hoat_dong && x.sau_phut <= ton_tai_phut).sort((a, b) => b.sau_phut - a.sau_phut || b.cap_escalation - a.cap_escalation);
      const activePolicy = eligiblePolicies[0];
      const policyLevel = activePolicy?.cap_escalation ?? onCallRouting.policy_level;
      const channel = (activePolicy?.kenh === "EMAIL" || activePolicy?.kenh === "WEBHOOK" || activePolicy?.kenh === "EMAIL_WEBHOOK") ? activePolicy.kenh : "EMAIL_WEBHOOK";
      const selected = roster.current.filter(x => x.cap_escalation <= policyLevel);
      onCallRouting = {
        emails: channel === "WEBHOOK" ? [] : selected.map(x => x.nguoi_dung.thu_dien_tu).filter(Boolean),
        people: selected.map(x => x.nguoi_dung.ho_ten),
        policy_level: policyLevel,
        kenh: channel,
      };
    } catch {}
    let nguoi_nhan = [...new Set([...cau_hinh.nguoi_nhan_co_dinh, ...onCallRouting.emails])];
    if (!nguoi_nhan.length && health.database.ket_noi) {
      try {
        const admins = await this.db.nguoiDung.findMany({ where: { vai_tro: VaiTro.ADMIN, da_kich_hoat: true }, select: { thu_dien_tu: true } });
        nguoi_nhan = admins.map(x => x.thu_dien_tu).filter(Boolean);
      } catch { nguoi_nhan = []; }
    }

    let email: { da_gui: boolean; ly_do?: string; so_nguoi_nhan: number } = { da_gui: false, so_nguoi_nhan: nguoi_nhan.length };
    if (!nguoi_nhan.length) email = { da_gui: false, ly_do: "Không có SYSTEM_HEALTH_EMAIL_TO hoặc Admin khả dụng để nhận cảnh báo", so_nguoi_nhan: 0 };
    else if (!health.smtp.san_sang) email = { da_gui: false, ly_do: "SMTP chưa sẵn sàng", so_nguoi_nhan: nguoi_nhan.length };
    else {
      try {
        await this.thu_dien_tu.guiCanhBaoHeThong({ thu_dien_tu: nguoi_nhan, trang_thai: trang_thai_canh_bao, van_de, thoi_gian: health.thoi_gian, cap_leo_thang, ton_tai_phut });
        email = { da_gui: true, so_nguoi_nhan: nguoi_nhan.length };
      } catch (error) {
        email = { da_gui: false, ly_do: error instanceof Error ? error.message : String(error), so_nguoi_nhan: nguoi_nhan.length };
      }
    }
    const webhook = onCallRouting.kenh === "EMAIL" && onCallRouting.people.length
      ? { da_gui: false, ly_do: "Escalation policy hiện tại chỉ định EMAIL", so_lan_thu: 0, adapter: this.cau_hinh_webhook_canh_bao().adapter }
      : await this.gui_webhook_canh_bao({
          event: "nhienin3d.system.alert", version: "3.13.0", trang_thai: trang_thai_canh_bao, chu_ky, dich_vu, van_de, thoi_gian: health.thoi_gian, cap_leo_thang, ton_tai_phut, on_call: onCallRouting
        });
    const da_gui = email.da_gui || webhook.da_gui;
    if (!da_gui) return { da_gui: false, ly_do: `Không có kênh cảnh báo gửi thành công. Email: ${email.ly_do || "không gửi"}; Webhook: ${webhook.ly_do || "không gửi"}`, van_de, cap_leo_thang, ton_tai_phut, email, webhook, bao_tri };

    this.chu_ky_canh_bao_he_thong = chu_ky;
    if (health.database.ket_noi) {
      try { await this.db.cauHinhHeThong.upsert({ where: { khoa: "CANH_BAO_HE_THONG_EMAIL" }, create: { khoa: "CANH_BAO_HE_THONG_EMAIL", gia_tri: { chu_ky, trang_thai: trang_thai_canh_bao, van_de, phat_hien_luc: phat_hien_luc.toISOString(), lan_gui: health.thoi_gian, cap_leo_thang } }, update: { gia_tri: { chu_ky, trang_thai: trang_thai_canh_bao, van_de, phat_hien_luc: phat_hien_luc.toISOString(), lan_gui: health.thoi_gian, cap_leo_thang } } }); } catch {}
      await this.ghi_lich_su_van_hanh("ALERT", "THANH_CONG", cap_leo_thang > 0 ? `Đã gửi escalation cảnh báo vận hành cấp ${cap_leo_thang}` : "Đã gửi cảnh báo vận hành", { van_de, dich_vu, email, on_call: onCallRouting, cap_leo_thang, ton_tai_phut, chu_ky, webhook }, undefined, chu_ky);
    }
    return { da_gui: true, van_de, so_nguoi_nhan: email.so_nguoi_nhan, cap_leo_thang, ton_tai_phut, email, webhook, bao_tri };
  }

  async danh_sach_lich_su_van_hanh(loai?: string, trang_thai?: string, tu_ngay?: string, den_ngay?: string, trangRaw?: string, kichThuocRaw?: string) {
    const trang = Math.max(1, Number.parseInt(trangRaw || "1", 10) || 1);
    const kich_thuoc = Math.max(10, Math.min(100, Number.parseInt(kichThuocRaw || "20", 10) || 20));
    const bat_dau = tu_ngay ? new Date(`${tu_ngay}T00:00:00.000Z`) : undefined;
    const ket_thuc = den_ngay ? new Date(`${den_ngay}T23:59:59.999Z`) : undefined;
    const where = {
      ...(loai?.trim() ? { loai: loai.trim().toUpperCase() } : {}),
      ...(trang_thai?.trim() ? { trang_thai: trang_thai.trim().toUpperCase() } : {}),
      ...((bat_dau || ket_thuc) ? { ngay_tao: { ...(bat_dau ? { gte: bat_dau } : {}), ...(ket_thuc ? { lte: ket_thuc } : {}) } } : {})
    };
    const [tong, ds] = await this.db.$transaction([
      this.db.lichSuVanHanh.count({ where }),
      this.db.lichSuVanHanh.findMany({ where, orderBy: { ngay_tao: "desc" }, skip: (trang - 1) * kich_thuoc, take: kich_thuoc })
    ]);
    return { du_lieu: ds.map(x => ({ ...x, id: x.id.toString() })), phan_trang: { trang, kich_thuoc, tong, tong_trang: Math.max(1, Math.ceil(tong / kich_thuoc)) } };
  }

  async danh_sach_lich_su_van_hanh_cursor(loai?: string, trang_thai?: string, tu_ngay?: string, den_ngay?: string, cursorRaw?: string, kichThuocRaw?: string) {
    const kich_thuoc = Math.max(10, Math.min(100, Number.parseInt(kichThuocRaw || "25", 10) || 25));
    const bat_dau = tu_ngay ? new Date(`${tu_ngay}T00:00:00.000Z`) : undefined;
    const ket_thuc = den_ngay ? new Date(`${den_ngay}T23:59:59.999Z`) : undefined;
    if (bat_dau && Number.isNaN(bat_dau.getTime())) throw new BadRequestException("Từ ngày không hợp lệ");
    if (ket_thuc && Number.isNaN(ket_thuc.getTime())) throw new BadRequestException("Đến ngày không hợp lệ");
    let cursor: bigint | undefined;
    if (cursorRaw?.trim()) { try { cursor = BigInt(cursorRaw.trim()); if (cursor <= 0n) throw new Error(); } catch { throw new BadRequestException("Cursor lịch sử vận hành không hợp lệ"); } }
    const where = {
      ...(loai?.trim() ? { loai: loai.trim().toUpperCase() } : {}),
      ...(trang_thai?.trim() ? { trang_thai: trang_thai.trim().toUpperCase() } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
      ...((bat_dau || ket_thuc) ? { ngay_tao: { ...(bat_dau ? { gte: bat_dau } : {}), ...(ket_thuc ? { lte: ket_thuc } : {}) } } : {})
    };
    const raw = await this.db.lichSuVanHanh.findMany({ where, orderBy: { id: "desc" }, take: kich_thuoc + 1 });
    const co_them = raw.length > kich_thuoc;
    const ds = raw.slice(0, kich_thuoc);
    return {
      du_lieu: ds.map(x => ({ ...x, id: x.id.toString() })),
      cursor: { kich_thuoc, co_them, next_cursor: co_them && ds.length ? ds[ds.length - 1].id.toString() : null }
    };
  }

  private chuan_hoa_chu_ky_su_co(chu_kyRaw: string) {
    const chu_ky = chu_kyRaw.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(chu_ky)) throw new BadRequestException("Chữ ký sự cố không hợp lệ");
    return chu_ky;
  }

  private van_de_su_co(raw: unknown) {
    return Array.isArray(raw) ? raw.map(x => String(x)) : [];
  }

  async danh_sach_su_co_van_hanh(gioiHanRaw?: string, trangThaiXuLyRaw?: string, tuNgayRaw?: string, denNgayRaw?: string) {
    const gioi_han = Math.max(5, Math.min(100, Number.parseInt(gioiHanRaw || "20", 10) || 20));
    const trang_thai_xu_ly = trangThaiXuLyRaw?.trim().toUpperCase();
    if (trang_thai_xu_ly && !["MOI", "DA_TIEP_NHAN", "DA_KHAC_PHUC"].includes(trang_thai_xu_ly)) throw new BadRequestException("Trạng thái xử lý sự cố không hợp lệ");
    const tu_ngay = tuNgayRaw?.trim() ? new Date(`${tuNgayRaw.trim()}T00:00:00.000Z`) : null;
    const den_ngay = denNgayRaw?.trim() ? new Date(`${denNgayRaw.trim()}T23:59:59.999Z`) : null;
    if (tu_ngay && Number.isNaN(tu_ngay.getTime())) throw new BadRequestException("Từ ngày incident không hợp lệ");
    if (den_ngay && Number.isNaN(den_ngay.getTime())) throw new BadRequestException("Đến ngày incident không hợp lệ");
    const ds = await this.db.suCoVanHanh.findMany({
      where: { ...(trang_thai_xu_ly ? { trang_thai_xu_ly } : {}), ...((tu_ngay || den_ngay) ? { bat_dau: { ...(tu_ngay ? { gte: tu_ngay } : {}), ...(den_ngay ? { lte: den_ngay } : {}) } } : {}) },
      orderBy: { gan_nhat: "desc" },
      take: gioi_han
    });
    return {
      du_lieu: ds.map(x => ({ ...x, van_de: this.van_de_su_co(x.van_de), thoi_luong_phut: Math.max(0, Math.round((x.gan_nhat.getTime() - x.bat_dau.getTime()) / 60_000)) })),
      gioi_han,
      bo_loc: { trang_thai_xu_ly: trang_thai_xu_ly || null, tu_ngay: tuNgayRaw || null, den_ngay: denNgayRaw || null },
      nguon: "BANG_TONG_HOP" as const
    };
  }

  async xuat_excel_danh_sach_su_co_van_hanh(trangThaiXuLyRaw?: string, tuNgayRaw?: string, denNgayRaw?: string) {
    const trang_thai_xu_ly = trangThaiXuLyRaw?.trim().toUpperCase();
    if (trang_thai_xu_ly && !["MOI", "DA_TIEP_NHAN", "DA_KHAC_PHUC"].includes(trang_thai_xu_ly)) throw new BadRequestException("Trạng thái xử lý sự cố không hợp lệ");
    const tu_ngay = tuNgayRaw?.trim() ? new Date(`${tuNgayRaw.trim()}T00:00:00.000Z`) : null;
    const den_ngay = denNgayRaw?.trim() ? new Date(`${denNgayRaw.trim()}T23:59:59.999Z`) : null;
    const ds = await this.db.suCoVanHanh.findMany({ where: { ...(trang_thai_xu_ly ? { trang_thai_xu_ly } : {}), ...((tu_ngay || den_ngay) ? { bat_dau: { ...(tu_ngay ? { gte: tu_ngay } : {}), ...(den_ngay ? { lte: den_ngay } : {}) } } : {}) }, orderBy: { gan_nhat: "desc" }, take: 5000 });
    const rows: unknown[][] = [["Chữ ký", "Trạng thái", "Vấn đề", "Bắt đầu", "Gần nhất", "Sự kiện", "Health", "Alert", "Người tiếp nhận", "Tiếp nhận lúc", "Người khắc phục", "Khắc phục lúc", "Ghi chú"]];
    for (const x of ds) rows.push([x.chu_ky, x.trang_thai_xu_ly, this.van_de_su_co(x.van_de).join(" | "), x.bat_dau.toISOString(), x.gan_nhat.toISOString(), x.so_su_kien, x.so_health, x.so_alert, x.nguoi_tiep_nhan_ten || "", x.tiep_nhan_luc?.toISOString() || "", x.nguoi_khac_phuc_ten || "", x.khac_phuc_luc?.toISOString() || "", x.ghi_chu || ""]);
    const buffer = this.tao_xlsx(rows, "Incident vận hành");
    return { ten_file: `incident-van-hanh-${new Date().toISOString().slice(0, 10)}.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
  }

  async xuat_excel_ops_tong_hop(trangThaiXuLyRaw?: string, tuNgayRaw?: string, denNgayRaw?: string) {
    const [sla, incidents] = await Promise.all([
      this.thong_ke_sla_van_hanh("90"),
      this.danh_sach_su_co_van_hanh("100", trangThaiXuLyRaw, tuNgayRaw, denNgayRaw)
    ]);
    const rows: unknown[][] = [
      ["NhienIn3d Ops Dashboard v3.13.0"],
      ["Tạo lúc", new Date().toISOString()],
      ["Bộ lọc incident", `${tuNgayRaw || "*"} → ${denNgayRaw || "*"} · ${trangThaiXuLyRaw || "Tất cả"}`],
      [],
      ["SLO / Error budget"],
      ["SLA 30 ngày (%)", sla.xu_huong.ba_muoi_ngay.sla_percent ?? ""],
      ["Uptime 30 ngày (%)", sla.xu_huong.ba_muoi_ngay.uptime_percent ?? ""],
      ["Error budget SLA còn lại (%)", sla.ngan_sach_loi.sla.con_lai_percent ?? ""],
      ["Error budget Uptime còn lại (%)", sla.ngan_sach_loi.uptime.con_lai_percent ?? ""],
      ["MTTA (phút)", sla.incident_metrics.mtta_phut ?? ""],
      ["MTTR (phút)", sla.incident_metrics.mttr_phut ?? ""],
      [],
      ["SLO comparison 7 / 30 / 90"],
      ["Window", "SLA (%)", "Uptime (%)", "Samples"],
      ["7d", sla.comparison.bay_ngay.sla_percent ?? "", sla.comparison.bay_ngay.uptime_percent ?? "", sla.comparison.bay_ngay.tong],
      ["30d", sla.comparison.ba_muoi_ngay.sla_percent ?? "", sla.comparison.ba_muoi_ngay.uptime_percent ?? "", sla.comparison.ba_muoi_ngay.tong],
      ["90d", sla.comparison.chin_muoi_ngay.sla_percent ?? "", sla.comparison.chin_muoi_ngay.uptime_percent ?? "", sla.comparison.chin_muoi_ngay.tong],
      [],
      ["Endpoint SLO time-weighted"],
      ["Endpoint", "Path", "Target (%)", "Availability (%)", "Samples", "Observed minutes", "Downtime minutes", "Budget used (%)", "Budget remaining (%)"],
    ];
    for (const endpoint of sla.endpoint_slo.endpoints) rows.push([endpoint.ten, endpoint.path, endpoint.muc_tieu_percent, endpoint.availability_percent ?? "", endpoint.tong_mau, endpoint.tong_thoi_gian_phut, endpoint.downtime_phut, endpoint.error_budget_da_tieu_percent ?? "", endpoint.error_budget_con_lai_percent ?? ""]);
    rows.push([], ["Ngân sách lỗi theo dịch vụ"], ["Dịch vụ", "Mục tiêu (%)", "Tổng mẫu", "Mẫu xấu", "Đã tiêu (%)", "Còn lại (%)"]);
    for (const [ten, value] of Object.entries(sla.ngan_sach_dich_vu)) rows.push([ten, value.muc_tieu_percent, value.tong_mau, value.mau_xau, value.da_tieu_thu_percent ?? "", value.con_lai_percent ?? ""]);
    rows.push([], ["Burn-rate policy"], ["Cửa sổ (h)", "Ngưỡng (x)", "Mức độ", "SLA burn", "Uptime burn"]);
    for (const item of sla.burn_rate_policy) rows.push([item.gio, item.nguong, item.muc_do, item.sla.burn_rate ?? "", item.uptime.burn_rate ?? ""]);
    rows.push([], ["Incident"], ["Chữ ký", "Trạng thái", "Vấn đề", "Bắt đầu", "Gần nhất", "Sự kiện", "Tiếp nhận", "Khắc phục"]);
    for (const item of incidents.du_lieu) rows.push([item.chu_ky, item.trang_thai_xu_ly, item.van_de.join(" | "), item.bat_dau.toISOString(), item.gan_nhat.toISOString(), item.so_su_kien, item.tiep_nhan_luc?.toISOString() || "", item.khac_phuc_luc?.toISOString() || ""]);
    const buffer = this.tao_xlsx(rows, "Ops v3.13.0");
    return { ten_file: `ops-slo-incident-${new Date().toISOString().slice(0, 10)}.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
  }

  async timeline_su_co_van_hanh(chu_kyRaw: string, qRaw?: string, cursorRaw?: string, kichThuocRaw?: string) {
    const chu_ky = this.chuan_hoa_chu_ky_su_co(chu_kyRaw);
    const kich_thuoc = Math.max(10, Math.min(100, Number.parseInt(kichThuocRaw || "25", 10) || 25));
    const q = qRaw?.trim().slice(0, 120) || "";
    let cursor: bigint | null = null;
    if (cursorRaw?.trim()) { try { cursor = BigInt(cursorRaw.trim()); if (cursor <= 0n) throw new Error(); } catch { throw new BadRequestException("Cursor timeline incident không hợp lệ"); } }
    type TimelineRow = { id: bigint; loai: string; trang_thai: string; mo_ta: string | null; chi_tiet: Prisma.JsonValue; chu_ky_canh_bao: string | null; ngay_bat_dau: Date | null; ngay_ket_thuc: Date | null; ngay_tao: Date; xep_hang?: number };
    let rows: TimelineRow[];
    let che_do_tim_kiem = "KHONG";
    if (q) {
      try {
        rows = await this.db.$queryRawUnsafe<TimelineRow[]>(
          `SELECT id, loai, trang_thai, mo_ta, chi_tiet, chu_ky_canh_bao, ngay_bat_dau, ngay_ket_thuc, ngay_tao,
                  ts_rank_cd(search_vector, websearch_to_tsquery('simple', $2))::float8 AS xep_hang
           FROM lich_su_van_hanh
           WHERE chu_ky_canh_bao = $1
             AND search_vector @@ websearch_to_tsquery('simple', $2)
             AND ($3::bigint IS NULL OR id < $3::bigint)
           ORDER BY id DESC LIMIT $4`,
          chu_ky, q, cursor?.toString() ?? null, kich_thuoc + 1
        );
        che_do_tim_kiem = "GIN_TSVECTOR_V390";
      } catch (error) {
        this.logger.debug(`Incident GIN search fallback: ${error instanceof Error ? error.message : String(error)}`);
        rows = await this.db.$queryRawUnsafe<TimelineRow[]>(
          `SELECT id, loai, trang_thai, mo_ta, chi_tiet, chu_ky_canh_bao, ngay_bat_dau, ngay_ket_thuc, ngay_tao
           FROM lich_su_van_hanh
           WHERE chu_ky_canh_bao = $1
             AND (to_tsvector('simple', coalesce(mo_ta,'') || ' ' || coalesce(chi_tiet::text,'')) @@ websearch_to_tsquery('simple',$2) OR loai ILIKE '%' || $2 || '%' OR trang_thai ILIKE '%' || $2 || '%')
             AND ($3::bigint IS NULL OR id < $3::bigint)
           ORDER BY id DESC LIMIT $4`,
          chu_ky, q, cursor?.toString() ?? null, kich_thuoc + 1
        );
        che_do_tim_kiem = "FULL_TEXT_FALLBACK";
      }
    } else {
      rows = await this.db.lichSuVanHanh.findMany({ where: { chu_ky_canh_bao: chu_ky, ...(cursor ? { id: { lt: cursor } } : {}) }, orderBy: { id: "desc" }, take: kich_thuoc + 1 }) as TimelineRow[];
    }
    const co_them = rows.length > kich_thuoc;
    const ds = rows.slice(0, kich_thuoc);
    return { du_lieu: ds.map(x => ({ ...x, id: x.id.toString() })), cursor: { kich_thuoc, co_them, next_cursor: co_them && ds.length ? ds[ds.length - 1].id.toString() : null, che_do_tim_kiem }, q };
  }

  async xuat_excel_chi_tiet_su_co_van_hanh(chu_kyRaw: string) {
    const chi_tiet = await this.chi_tiet_su_co_van_hanh(chu_kyRaw);
    const rows: unknown[][] = [
      ["Incident", chi_tiet.chu_ky],
      ["Trạng thái xử lý", chi_tiet.trang_thai_xu_ly],
      ["Vấn đề", chi_tiet.van_de.join(" | ")],
      ["Bắt đầu", chi_tiet.bat_dau.toISOString()],
      ["Gần nhất", chi_tiet.gan_nhat.toISOString()],
      ["Người tiếp nhận", chi_tiet.nguoi_tiep_nhan_ten || ""],
      ["Người khắc phục", chi_tiet.nguoi_khac_phuc_ten || ""],
      ["Ghi chú", chi_tiet.ghi_chu || ""],
      [],
      ["Thời gian", "Loại", "Trạng thái", "Mô tả", "Chi tiết"]
    ];
    for (const x of chi_tiet.su_kien) rows.push([x.ngay_tao.toISOString(), x.loai, x.trang_thai, x.mo_ta || "", JSON.stringify(x.chi_tiet)]);
    const buffer = this.tao_xlsx(rows, "Timeline incident");
    return { ten_file: `incident-${chi_tiet.chu_ky.slice(0, 12)}-timeline.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
  }

  async chi_tiet_su_co_van_hanh(chu_kyRaw: string) {
    const chu_ky = this.chuan_hoa_chu_ky_su_co(chu_kyRaw);
    const tong_hop = await this.db.suCoVanHanh.findUnique({ where: { chu_ky } });
    if (!tong_hop) throw new NotFoundException("Không tìm thấy chuỗi sự cố vận hành");
    const ds = await this.db.lichSuVanHanh.findMany({ where: { chu_ky_canh_bao: chu_ky }, orderBy: { id: "asc" }, take: 1000 });
    return {
      ...tong_hop,
      van_de: this.van_de_su_co(tong_hop.van_de),
      thoi_luong_phut: Math.max(0, Math.round((tong_hop.gan_nhat.getTime() - tong_hop.bat_dau.getTime()) / 60_000)),
      su_kien: ds.map(x => ({ ...x, id: x.id.toString() }))
    };
  }

  async tiep_nhan_su_co_van_hanh(actor: NguoiDungXacThuc, chu_kyRaw: string, dto: CapNhatSuCoVanHanhDto) {
    const chu_ky = this.chuan_hoa_chu_ky_su_co(chu_kyRaw);
    const hien_tai = await this.db.suCoVanHanh.findUnique({ where: { chu_ky } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy chuỗi sự cố vận hành");
    if (hien_tai.trang_thai_xu_ly === "DA_KHAC_PHUC") throw new BadRequestException("Sự cố đã được khắc phục; không thể tiếp nhận lại");
    const ghi_chu = dto.ghi_chu?.trim() || hien_tai.ghi_chu || null;
    const tiep_nhan_luc = new Date();
    await this.db.$transaction([
      this.db.suCoVanHanh.update({ where: { chu_ky }, data: { trang_thai_xu_ly: "DA_TIEP_NHAN", ghi_chu, nguoi_tiep_nhan_id: actor.id, nguoi_tiep_nhan_ten: actor.ho_ten, tiep_nhan_luc, dich_vu: hien_tai.dich_vu || this.xep_dich_vu_su_co_v3110(hien_tai.van_de), chu_so_huu_id: hien_tai.chu_so_huu_id || actor.id, chu_so_huu_ten: hien_tai.chu_so_huu_ten || actor.ho_ten } }),
      this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TIEP_NHAN_SU_CO_VAN_HANH", nguoi_dung_id: actor.id, chi_tiet: { chu_ky, trang_thai_cu: hien_tai.trang_thai_xu_ly, trang_thai_moi: "DA_TIEP_NHAN", ghi_chu } } })
    ]);
    await this.ghi_lich_su_van_hanh("INCIDENT", "DA_TIEP_NHAN", `Admin ${actor.ho_ten} đã tiếp nhận sự cố`, { van_de: this.van_de_su_co(hien_tai.van_de), ghi_chu, nguoi_xu_ly: actor.ho_ten }, undefined, chu_ky);
    return this.chi_tiet_su_co_van_hanh(chu_ky);
  }

  async khac_phuc_su_co_van_hanh(actor: NguoiDungXacThuc, chu_kyRaw: string, dto: CapNhatSuCoVanHanhDto) {
    const chu_ky = this.chuan_hoa_chu_ky_su_co(chu_kyRaw);
    const hien_tai = await this.db.suCoVanHanh.findUnique({ where: { chu_ky } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy chuỗi sự cố vận hành");
    if (hien_tai.trang_thai_xu_ly === "DA_KHAC_PHUC") return this.chi_tiet_su_co_van_hanh(chu_ky);
    const ghi_chu = dto.ghi_chu?.trim() || hien_tai.ghi_chu || null;
    const khac_phuc_luc = new Date();
    await this.db.$transaction([
      this.db.suCoVanHanh.update({ where: { chu_ky }, data: { trang_thai_xu_ly: "DA_KHAC_PHUC", ghi_chu, nguoi_khac_phuc_id: actor.id, nguoi_khac_phuc_ten: actor.ho_ten, khac_phuc_luc } }),
      this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_KHAC_PHUC_SU_CO_VAN_HANH", nguoi_dung_id: actor.id, chi_tiet: { chu_ky, trang_thai_cu: hien_tai.trang_thai_xu_ly, trang_thai_moi: "DA_KHAC_PHUC", ghi_chu } } })
    ]);
    await this.ghi_lich_su_van_hanh("INCIDENT", "DA_KHAC_PHUC", `Admin ${actor.ho_ten} đã đánh dấu sự cố khắc phục`, { van_de: this.van_de_su_co(hien_tai.van_de), ghi_chu, nguoi_xu_ly: actor.ho_ten }, undefined, chu_ky);
    return this.chi_tiet_su_co_van_hanh(chu_ky);
  }

  private async cau_hinh_slo_nang_cao_runtime() {
    const endpointMacDinh: SloEndpointCheckV390[] = [
      { id: "public-health", ten: "Public health", path: "/api/v1/suc-khoe", method: "GET", headers: {}, auth_template: "NONE", auth_env: "", muc_tieu_percent: 99.95, latency_target_ms: 500, timeout_ms: 2500 },
      { id: "catalog", ten: "Danh mục", path: "/api/v1/danh-muc", method: "GET", headers: {}, auth_template: "NONE", auth_env: "", muc_tieu_percent: 99.9, latency_target_ms: 700, timeout_ms: 3000 },
      { id: "products", ten: "Danh sách sản phẩm", path: "/api/v1/san-pham", method: "GET", headers: {}, auth_template: "NONE", auth_env: "", muc_tieu_percent: 99.9, latency_target_ms: 900, timeout_ms: 3000 }
    ];
    const maintenance_policy: SloMaintenancePolicyV390 = { exclude_from_availability: false, exclude_from_error_budget: false, max_gap_multiplier: 2 };
    const mac_dinh = {
      burn_windows: [
        { gio: 1, nguong: 14.4, muc_do: "NGHIEM_TRONG" },
        { gio: 6, nguong: 6, muc_do: "CAO" },
        { gio: 24, nguong: 1, muc_do: "CANH_BAO" }
      ],
      service_targets: { api: 99.9, postgresql: 99.9, backup: 99, smtp: 99 },
      endpoint_checks: endpointMacDinh,
      maintenance_policy,
      nguon_cau_hinh: "MAC_DINH" as const,
      ngay_cap_nhat: null as Date | null
    };
    try {
      const item = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "SLO_NANG_CAO_V370" } });
      const raw = item?.gia_tri;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return mac_dinh;
      const x = raw as Record<string, unknown>;
      const windows = Array.isArray(x.burn_windows) ? x.burn_windows.map(itemRaw => {
        if (!itemRaw || typeof itemRaw !== "object" || Array.isArray(itemRaw)) return null;
        const r = itemRaw as Record<string, unknown>;
        const gio = Number(r.gio); const nguong = Number(r.nguong); const muc_do = String(r.muc_do || "CANH_BAO").toUpperCase();
        if (!Number.isFinite(gio) || gio < 1 || gio > 168 || !Number.isFinite(nguong) || nguong < 0.1 || nguong > 100 || !["CANH_BAO", "CAO", "NGHIEM_TRONG"].includes(muc_do)) return null;
        return { gio: Math.floor(gio), nguong: Math.round(nguong * 100) / 100, muc_do };
      }).filter((v): v is { gio: number; nguong: number; muc_do: string } => !!v) : [];
      const rawTargets = x.service_targets && typeof x.service_targets === "object" && !Array.isArray(x.service_targets) ? x.service_targets as Record<string, unknown> : {};
      const target = (key: string, fallback: number) => { const n = Number(rawTargets[key]); return Number.isFinite(n) && n >= 90 && n <= 100 ? Math.round(n * 1000) / 1000 : fallback; };
      const endpoints = Array.isArray(x.endpoint_checks) ? x.endpoint_checks.map((rawEndpoint, index) => {
        if (!rawEndpoint || typeof rawEndpoint !== "object" || Array.isArray(rawEndpoint)) return null;
        const r = rawEndpoint as Record<string, unknown>;
        const id = String(r.id || `endpoint-${index + 1}`).trim().toLowerCase();
        const ten = String(r.ten || id).trim();
        const path = String(r.path || "").trim();
        const methodRaw = String(r.method || "GET").trim().toUpperCase();
        const method = (["GET", "HEAD"].includes(methodRaw) ? methodRaw : "GET") as "GET" | "HEAD";
        const muc_tieu_percent = Number(r.muc_tieu_percent);
        const latency_target_ms = Number(r.latency_target_ms ?? 1000);
        const timeout_ms = Number(r.timeout_ms);
        const authRaw = String(r.auth_template || "NONE").trim().toUpperCase();
        const auth_template = (["NONE", "BEARER_ENV"].includes(authRaw) ? authRaw : "NONE") as "NONE" | "BEARER_ENV";
        const auth_env = /^[A-Z][A-Z0-9_]{1,79}$/.test(String(r.auth_env || "").trim()) ? String(r.auth_env || "").trim() : "";
        const headersRaw = r.headers && typeof r.headers === "object" && !Array.isArray(r.headers) ? r.headers as Record<string, unknown> : {};
        const headers = Object.fromEntries(Object.entries(headersRaw).slice(0, 10).filter(([name]) => /^[a-zA-Z0-9-]{1,50}$/.test(name)).map(([name, value]) => [name.toLowerCase(), String(value).slice(0, 300)]));
        if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(id) || !ten || ten.length > 80 || !path.startsWith("/api/v1/") || path.includes("..") || !Number.isFinite(muc_tieu_percent) || muc_tieu_percent < 90 || muc_tieu_percent > 100) return null;
        return { id, ten: ten.slice(0, 80), path: path.slice(0, 180), method, headers, auth_template, auth_env, muc_tieu_percent: Math.round(muc_tieu_percent * 1000) / 1000, latency_target_ms: Number.isFinite(latency_target_ms) ? Math.max(50, Math.min(10_000, Math.floor(latency_target_ms))) : 1000, timeout_ms: Number.isFinite(timeout_ms) ? Math.max(500, Math.min(10_000, Math.floor(timeout_ms))) : 3000 } satisfies SloEndpointCheckV390;
      }).filter((v): v is SloEndpointCheckV390 => !!v) : [];
      const mpRaw = x.maintenance_policy && typeof x.maintenance_policy === "object" && !Array.isArray(x.maintenance_policy) ? x.maintenance_policy as Record<string, unknown> : {};
      const maxGap = Number(mpRaw.max_gap_multiplier ?? maintenance_policy.max_gap_multiplier);
      const parsedMaintenance: SloMaintenancePolicyV390 = {
        exclude_from_availability: typeof mpRaw.exclude_from_availability === "boolean" ? mpRaw.exclude_from_availability : maintenance_policy.exclude_from_availability,
        exclude_from_error_budget: typeof mpRaw.exclude_from_error_budget === "boolean" ? mpRaw.exclude_from_error_budget : maintenance_policy.exclude_from_error_budget,
        max_gap_multiplier: Number.isFinite(maxGap) ? Math.max(1, Math.min(6, Math.round(maxGap * 10) / 10)) : maintenance_policy.max_gap_multiplier
      };
      return {
        burn_windows: windows.length ? windows.slice(0, 6) : mac_dinh.burn_windows,
        service_targets: { api: target("api", 99.9), postgresql: target("postgresql", 99.9), backup: target("backup", 99), smtp: target("smtp", 99) },
        endpoint_checks: endpoints.length ? endpoints.slice(0, 10) : endpointMacDinh,
        maintenance_policy: parsedMaintenance,
        nguon_cau_hinh: "DATABASE" as const,
        ngay_cap_nhat: item?.ngay_cap_nhat || null
      };
    } catch (error) {
      this.logger.debug(`Không đọc được SLO nâng cao: ${error instanceof Error ? error.message : String(error)}`);
      return mac_dinh;
    }
  }

  async lay_cau_hinh_slo_nang_cao() { return this.cau_hinh_slo_nang_cao_runtime(); }

  async cap_nhat_cau_hinh_slo_nang_cao(actor: NguoiDungXacThuc, dto: CapNhatSloNangCaoDto) {
    if (!dto.burn_windows.length || dto.burn_windows.length > 6) throw new BadRequestException("Burn-rate policy cần từ 1 đến 6 cửa sổ");
    const seen = new Set<number>();
    const burn_windows = dto.burn_windows.map(raw => {
      const gio = Number(raw.gio); const nguong = Number(raw.nguong); const muc_do = String(raw.muc_do || "CANH_BAO").toUpperCase();
      if (!Number.isFinite(gio) || gio < 1 || gio > 168 || Math.floor(gio) !== gio) throw new BadRequestException("Cửa sổ burn-rate phải từ 1 đến 168 giờ và là số nguyên");
      if (seen.has(gio)) throw new BadRequestException(`Cửa sổ burn-rate ${gio}h bị trùng`); seen.add(gio);
      if (!Number.isFinite(nguong) || nguong < 0.1 || nguong > 100) throw new BadRequestException("Ngưỡng burn-rate phải từ 0.1x đến 100x");
      if (!["CANH_BAO", "CAO", "NGHIEM_TRONG"].includes(muc_do)) throw new BadRequestException("Mức độ burn-rate không hợp lệ");
      return { gio, nguong: Math.round(nguong * 100) / 100, muc_do };
    }).sort((a, b) => a.gio - b.gio);
    const service_targets: Record<string, number> = {};
    for (const key of ["api", "postgresql", "backup", "smtp"]) {
      const value = Number(dto.service_targets[key]);
      if (!Number.isFinite(value) || value < 90 || value > 100) throw new BadRequestException(`SLO dịch vụ ${key} phải từ 90 đến 100%`);
      service_targets[key] = Math.round(value * 1000) / 1000;
    }
    const current = await this.cau_hinh_slo_nang_cao_runtime();
    const endpointRaw = dto.endpoint_checks ?? current.endpoint_checks;
    if (!endpointRaw.length || endpointRaw.length > 10) throw new BadRequestException("SLO endpoint cần từ 1 đến 10 endpoint");
    const endpointIds = new Set<string>();
    const endpoint_checks: SloEndpointCheckV390[] = endpointRaw.map((raw, index) => {
      const id = String(raw.id || `endpoint-${index + 1}`).trim().toLowerCase(); const ten = String(raw.ten || id).trim(); const path = String(raw.path || "").trim();
      const methodRaw = String(raw.method || "GET").trim().toUpperCase();
      const method = (["GET", "HEAD"].includes(methodRaw) ? methodRaw : "GET") as "GET" | "HEAD";
      const muc_tieu_percent = Number(raw.muc_tieu_percent); const latency_target_ms = Number(raw.latency_target_ms ?? 1000); const timeout_ms = Number(raw.timeout_ms ?? 3000);
      const authRaw = String(raw.auth_template || "NONE").trim().toUpperCase();
      const auth_template = (["NONE", "BEARER_ENV"].includes(authRaw) ? authRaw : "NONE") as "NONE" | "BEARER_ENV";
      const auth_env = String(raw.auth_env || "").trim();
      const headersRaw = raw.headers && typeof raw.headers === "object" && !Array.isArray(raw.headers) ? raw.headers as Record<string, unknown> : {};
      if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(id)) throw new BadRequestException(`ID endpoint ${id || index + 1} không hợp lệ`);
      if (endpointIds.has(id)) throw new BadRequestException(`ID endpoint ${id} bị trùng`); endpointIds.add(id);
      if (!ten || ten.length > 80) throw new BadRequestException(`Tên endpoint ${id} không hợp lệ`);
      if (!path.startsWith("/api/v1/") || path.includes("..") || path.length > 180) throw new BadRequestException(`Path endpoint ${id} phải bắt đầu /api/v1/`);
      if (!["GET", "HEAD"].includes(method)) throw new BadRequestException(`HTTP method endpoint ${id} chỉ hỗ trợ GET/HEAD`);
      if (!Number.isFinite(muc_tieu_percent) || muc_tieu_percent < 90 || muc_tieu_percent > 100) throw new BadRequestException(`SLO endpoint ${id} phải từ 90 đến 100%`);
      if (!Number.isFinite(latency_target_ms) || latency_target_ms < 50 || latency_target_ms > 10_000) throw new BadRequestException(`Latency target endpoint ${id} phải từ 50 đến 10000ms`);
      if (!Number.isFinite(timeout_ms) || timeout_ms < 500 || timeout_ms > 10_000) throw new BadRequestException(`Timeout endpoint ${id} phải từ 500 đến 10000ms`);
      if (auth_template === "BEARER_ENV" && !/^[A-Z][A-Z0-9_]{1,79}$/.test(auth_env)) throw new BadRequestException(`Auth env endpoint ${id} không hợp lệ`);
      const headers: Record<string, string> = {};
      for (const [nameRaw, valueRaw] of Object.entries(headersRaw).slice(0, 10)) {
        const name = nameRaw.trim().toLowerCase(); const value = String(valueRaw);
        if (!/^[a-z0-9-]{1,50}$/.test(name) || ["host", "content-length", "cookie"].includes(name)) throw new BadRequestException(`Header ${nameRaw} của endpoint ${id} không hợp lệ`);
        if (value.length > 300) throw new BadRequestException(`Header ${nameRaw} của endpoint ${id} quá dài`);
        const envRefs = [...value.matchAll(/\$\{ENV:([^}]+)\}/g)].map(m => m[1]);
        if (envRefs.some(name => !/^[A-Z][A-Z0-9_]{1,79}$/.test(name))) throw new BadRequestException(`ENV template trong header ${nameRaw} không hợp lệ`);
        if (["authorization", "proxy-authorization", "x-api-key", "api-key"].includes(name) && envRefs.length === 0) {
          throw new BadRequestException(`Header nhạy cảm ${nameRaw} của endpoint ${id} phải dùng template \${ENV:TEN_BIEN}`);
        }
        headers[name] = value;
      }
      return { id, ten, path, method, headers, auth_template, auth_env: auth_template === "BEARER_ENV" ? auth_env : "", muc_tieu_percent: Math.round(muc_tieu_percent * 1000) / 1000, latency_target_ms: Math.floor(latency_target_ms), timeout_ms: Math.floor(timeout_ms) };
    });
    const rawMaintenance = dto.maintenance_policy ?? current.maintenance_policy;
    const maxGap = Number(rawMaintenance.max_gap_multiplier ?? 2);
    if (!Number.isFinite(maxGap) || maxGap < 1 || maxGap > 6) throw new BadRequestException("Max gap multiplier phải từ 1 đến 6");
    const maintenance_policy: SloMaintenancePolicyV390 = {
      exclude_from_availability: !!rawMaintenance.exclude_from_availability,
      exclude_from_error_budget: !!rawMaintenance.exclude_from_error_budget,
      max_gap_multiplier: Math.round(maxGap * 10) / 10
    };
    const truoc = current;
    const sau = { burn_windows, service_targets, endpoint_checks, maintenance_policy };
    const jsonSau = this.chuan_hoa_json_object(sau as unknown as Record<string, unknown>);
    await this.db.$transaction([
      this.db.cauHinhHeThong.upsert({ where: { khoa: "SLO_NANG_CAO_V370" }, create: { khoa: "SLO_NANG_CAO_V370", gia_tri: jsonSau, nguoi_cap_nhat_id: actor.id }, update: { gia_tri: jsonSau, nguoi_cap_nhat_id: actor.id } }),
      this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_SLO_NANG_CAO", nguoi_dung_id: actor.id, chi_tiet: this.chuan_hoa_json_object({ truoc, sau } as unknown as Record<string, unknown>) } })
    ]);
    await this.ghi_lich_su_van_hanh("SLO_POLICY", "DA_CAP_NHAT", `Admin ${actor.ho_ten} cập nhật burn-rate/error-budget/endpoint/maintenance policy`, sau as unknown as Record<string, unknown>);
    return this.cau_hinh_slo_nang_cao_runtime();
  }


  private json_on_dinh_v3110(value: unknown): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(item => this.json_on_dinh_v3110(item)).join(",")}]`;
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${this.json_on_dinh_v3110(item)}`).join(",")}}`;
  }

  private cau_hinh_probe_agent_signed_v3110(agentId: string) {
    let secret = "";
    const rawMap = process.env.SYSTEM_SLO_AGENT_KEYS_JSON?.trim();
    if (rawMap) {
      try {
        const parsed = JSON.parse(rawMap) as Record<string, unknown>;
        const selected = parsed[agentId];
        if (typeof selected === "string") secret = this.giai_quyet_secret_ref_v3110(selected);
      } catch (error) {
        this.logger.warn(`SYSTEM_SLO_AGENT_KEYS_JSON không hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (!secret) secret = process.env.SYSTEM_SLO_AGENT_SHARED_SECRET?.trim() || "";
    const maxSkew = Math.max(30, Math.min(900, Number.parseInt(process.env.SYSTEM_SLO_AGENT_MAX_CLOCK_SKEW_SECONDS || "300", 10) || 300));
    return { secret, max_skew_seconds: maxSkew, configured: secret.length >= 16, source: rawMap ? "AGENT_KEYRING" : "SHARED_SECRET" };
  }

  private cau_hinh_probe_agent_public_keys_v3130(agentId: string) {
    const rawMap = process.env.SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON?.trim();
    const keys: string[] = [];
    if (rawMap) {
      try {
        const parsed = JSON.parse(rawMap) as Record<string, unknown>;
        const selected = parsed[agentId];
        const values = Array.isArray(selected) ? selected : selected == null ? [] : [selected];
        for (const raw of values) {
          if (typeof raw !== "string") continue;
          const resolved = this.giai_quyet_secret_ref_v3110(raw).replace(/\\n/g, "\n").trim();
          if (resolved.includes("BEGIN PUBLIC KEY")) keys.push(resolved);
        }
      } catch (error) {
        this.logger.warn(`SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON không hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return { keys, configured: keys.length > 0, source: rawMap ? "ED25519_PUBLIC_KEYRING" : "UNCONFIGURED" };
  }

  private async xac_thuc_probe_agent_v3110(
    headers: { agent?: string; timestamp?: string; nonce?: string; signature?: string; algorithm?: string },
    body: Record<string, unknown>,
  ) {
    const agent = headers.agent?.trim() || "";
    const timestampRaw = headers.timestamp?.trim() || "";
    const nonce = headers.nonce?.trim() || "";
    const signatureRaw = headers.signature?.trim() || "";
    const algorithm = (headers.algorithm?.trim().toUpperCase() || "HMAC-SHA256");
    if (!/^[A-Za-z0-9._-]{2,80}$/.test(agent) || String(body.agent_id || "") !== agent) throw new ForbiddenException("Probe agent identity không hợp lệ");
    if (!/^[A-Za-z0-9._-]{12,80}$/.test(nonce)) throw new ForbiddenException("Probe agent nonce không hợp lệ");
    const timestamp = Number(timestampRaw);
    if (!Number.isFinite(timestamp)) throw new ForbiddenException("Probe agent timestamp không hợp lệ");
    const hmacConfig = this.cau_hinh_probe_agent_signed_v3110(agent);
    const maxSkew = hmacConfig.max_skew_seconds;
    const skew = Math.abs(Date.now() - timestamp);
    if (skew > maxSkew * 1000) throw new ForbiddenException("Probe agent timestamp vượt clock-skew cho phép");
    const canonicalBody = this.json_on_dinh_v3110(body);
    const canonical = `${agent}\n${timestampRaw}\n${nonce}\n${canonicalBody}`;
    let protocol = "HMAC-SHA256-v3110";

    if (algorithm === "ED25519") {
      if (!/^[A-Za-z0-9+/=]{80,120}$/.test(signatureRaw)) throw new ForbiddenException("Probe agent Ed25519 signature không hợp lệ");
      const publicKeys = this.cau_hinh_probe_agent_public_keys_v3130(agent);
      if (!publicKeys.configured) throw new ForbiddenException("Probe agent Ed25519 public key chưa được cấu hình");
      const signature = Buffer.from(signatureRaw, "base64");
      let valid = false;
      for (const publicKey of publicKeys.keys) {
        try {
          if (verifySignature(null, Buffer.from(canonical, "utf8"), publicKey, signature)) { valid = true; break; }
        } catch {}
      }
      if (!valid) throw new ForbiddenException("Probe agent Ed25519 signature không hợp lệ");
      protocol = "ED25519-v3130";
    } else {
      const signature = signatureRaw.toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(signature)) throw new ForbiddenException("Probe agent signature không hợp lệ");
      if (!hmacConfig.configured) throw new ForbiddenException("Probe agent signing key chưa được cấu hình");
      const expected = createHmac("sha256", hmacConfig.secret).update(canonical).digest();
      const actual = Buffer.from(signature, "hex");
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new ForbiddenException("Probe agent HMAC signature không hợp lệ");
    }

    try {
      await this.db.sloProbeNonce.deleteMany({ where: { het_han_luc: { lt: new Date() } } });
      await this.db.sloProbeNonce.create({ data: { agent_id: agent, nonce, het_han_luc: new Date(Date.now() + maxSkew * 2000) } });
    } catch {
      throw new ForbiddenException("Probe agent nonce đã được sử dụng hoặc nonce-store chưa sẵn sàng");
    }
    return { agent, config: hmacConfig, protocol };
  }

  async probe_agent_heartbeat_v3110(
    headers: { agent?: string; timestamp?: string; nonce?: string; signature?: string; algorithm?: string },
    dto: { agent_id: string; region: string; node_name: string; phien_ban?: string; metadata?: Record<string, unknown> },
    signedBody?: Record<string, unknown>,
  ) {
    const auth = await this.xac_thuc_probe_agent_v3110(headers, signedBody ?? (dto as unknown as Record<string, unknown>));
    const region = dto.region.trim().slice(0, 80) || "unknown";
    const node_name = dto.node_name.trim().slice(0, 120) || dto.agent_id;
    const now = new Date();
    const metadata = this.chuan_hoa_json_object(dto.metadata || {});
    await this.db.sloProbeAgent.upsert({
      where: { agent_id: dto.agent_id },
      create: { agent_id: dto.agent_id, region, node_name, phien_ban: dto.phien_ban?.trim().slice(0, 40) || null, trang_thai: "ONLINE", lan_heartbeat: now, metadata },
      update: { region, node_name, phien_ban: dto.phien_ban?.trim().slice(0, 40) || null, trang_thai: "ONLINE", lan_heartbeat: now, metadata },
    });
    return { da_nhan: true, agent_id: dto.agent_id, server_time: now.toISOString(), protocol: auth.protocol };
  }

  async probe_agent_ingest_v3110(
    headers: { agent?: string; timestamp?: string; nonce?: string; signature?: string; algorithm?: string },
    dto: { agent_id: string; region: string; node_name: string; phien_ban?: string; metadata?: Record<string, unknown>; samples: Array<{ endpoint_id: string; trang_thai: "TOT" | "LOI" | "CANH_BAO"; http_status?: number; do_tre_ms: number; latency_target_ms: number; maintenance_active?: boolean; observed_at?: string }> },
    signedBody?: Record<string, unknown>,
  ) {
    const auth = await this.xac_thuc_probe_agent_v3110(headers, signedBody ?? (dto as unknown as Record<string, unknown>));
    const region = dto.region.trim().slice(0, 80) || "unknown";
    const node_name = dto.node_name.trim().slice(0, 120) || dto.agent_id;
    const now = new Date();
    const samples = dto.samples.map(sample => {
      const endpoint_id = sample.endpoint_id.trim();
      if (!/^[A-Za-z0-9._-]{1,80}$/.test(endpoint_id)) throw new BadRequestException(`endpoint_id ${sample.endpoint_id} không hợp lệ`);
      const do_tre_ms = Math.max(0, Math.min(600000, Number(sample.do_tre_ms)));
      const latency_target_ms = Math.max(1, Math.min(600000, Math.floor(Number(sample.latency_target_ms))));
      const observed = sample.observed_at ? new Date(sample.observed_at) : now;
      const ngay_tao = Number.isNaN(observed.getTime()) || Math.abs(now.getTime() - observed.getTime()) > 86_400_000 ? now : observed;
      const apdex_bucket = sample.trang_thai !== "TOT" || do_tre_ms > latency_target_ms * 4 ? "FRUSTRATED" : do_tre_ms <= latency_target_ms ? "SATISFIED" : "TOLERATING";
      return { endpoint_id, agent_id: dto.agent_id, region, node_name, trang_thai: sample.trang_thai, http_status: sample.http_status ?? null, do_tre_ms, latency_target_ms, apdex_t_ms: latency_target_ms, apdex_bucket, maintenance_active: sample.maintenance_active === true, ngay_tao };
    });
    await this.db.$transaction([
      this.db.sloEndpointMau.createMany({ data: samples }),
      this.db.sloProbeAgent.upsert({
        where: { agent_id: dto.agent_id },
        create: { agent_id: dto.agent_id, region, node_name, phien_ban: dto.phien_ban?.trim().slice(0, 40) || null, trang_thai: "ONLINE", lan_heartbeat: now, lan_mau: now, metadata: this.chuan_hoa_json_object(dto.metadata || {}) },
        update: { region, node_name, phien_ban: dto.phien_ban?.trim().slice(0, 40) || null, trang_thai: "ONLINE", lan_heartbeat: now, lan_mau: now, metadata: this.chuan_hoa_json_object(dto.metadata || {}) },
      }),
    ]);
    return { da_nhan: true, agent_id: dto.agent_id, so_mau: samples.length, server_time: now.toISOString(), protocol: auth.protocol };
  }

  private async suc_khoe_probe_agents_v3110() {
    const config = this.cau_hinh_slo_endpoint_runtime();
    const staleMs = Math.max(5 * 60_000, config.chu_ky_phut * 3 * 60_000);
    try {
      const rows = await this.db.sloProbeAgent.findMany({ orderBy: [{ region: "asc" }, { agent_id: "asc" }] });
      const now = Date.now();
      const agents = rows.map(row => {
        const ageMs = Math.max(0, now - row.lan_heartbeat.getTime());
        return { ...row, online: ageMs <= staleMs, heartbeat_age_seconds: Math.round(ageMs / 1000) };
      });
      return { stale_after_seconds: Math.round(staleMs / 1000), online: agents.filter(x => x.online).length, offline: agents.filter(x => !x.online).length, agents };
    } catch (error) {
      return { stale_after_seconds: Math.round(staleMs / 1000), online: 0, offline: 0, agents: [], loi: error instanceof Error ? error.message : String(error) };
    }
  }

  private cau_hinh_probe_fleet_v3120() {
    const stale_after_seconds = Math.max(60, Math.min(86_400, Number.parseInt(process.env.SYSTEM_SLO_AGENT_STALE_AFTER_SECONDS || "600", 10) || 600));
    const offlineDefault = Math.max(stale_after_seconds + 60, 1800);
    const offline_after_seconds = Math.max(stale_after_seconds + 60, Math.min(604_800, Number.parseInt(process.env.SYSTEM_SLO_AGENT_OFFLINE_AFTER_SECONDS || String(offlineDefault), 10) || offlineDefault));
    const shared_secret_enabled = (process.env.SYSTEM_SLO_AGENT_SHARED_SECRET?.trim() || "").length >= 16;

    const key_ids: string[] = [];
    const rawKeys = process.env.SYSTEM_SLO_AGENT_KEYS_JSON?.trim();
    if (rawKeys) {
      try {
        const parsed = JSON.parse(rawKeys) as Record<string, unknown>;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("phải là JSON object");
        for (const [agent_id, value] of Object.entries(parsed)) {
          if (!/^[A-Za-z0-9._-]{2,80}$/.test(agent_id) || typeof value !== "string") continue;
          const resolved = this.giai_quyet_secret_ref_v3110(value);
          if (resolved.length >= 16) key_ids.push(agent_id);
        }
      } catch (error) {
        this.logger.warn(`SYSTEM_SLO_AGENT_KEYS_JSON không hợp lệ cho probe fleet v3.13.0: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    key_ids.sort();

    const public_key_ids: string[] = [];
    const rawPublicKeys = process.env.SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON?.trim();
    if (rawPublicKeys) {
      try {
        const parsed = JSON.parse(rawPublicKeys) as Record<string, unknown>;
        for (const [agent_id, value] of Object.entries(parsed)) {
          if (!/^[A-Za-z0-9._-]{2,80}$/.test(agent_id)) continue;
          const values = Array.isArray(value) ? value : [value];
          const configured = values.some(item => typeof item === "string" && this.giai_quyet_secret_ref_v3110(item).replace(/\\n/g, "\n").includes("BEGIN PUBLIC KEY"));
          if (configured) public_key_ids.push(agent_id);
        }
      } catch (error) {
        this.logger.warn(`SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON không hợp lệ cho probe fleet v3.13.0: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    public_key_ids.sort();

    type FleetProfile = { agent_id: string; region: string | null; node_name: string | null; required: boolean; source: "PROFILE" | "KEYRING" };
    const profileMap = new Map<string, FleetProfile>();
    const rawProfiles = process.env.SYSTEM_SLO_AGENT_PROFILES_JSON?.trim();
    if (rawProfiles) {
      try {
        const parsed = JSON.parse(rawProfiles) as unknown;
        if (!Array.isArray(parsed)) throw new Error("phải là JSON array");
        for (const item of parsed) {
          if (!item || typeof item !== "object") continue;
          const raw = item as Record<string, unknown>;
          const agent_id = String(raw.agent_id || "").trim();
          if (!/^[A-Za-z0-9._-]{2,80}$/.test(agent_id)) continue;
          const regionRaw = String(raw.region || "").trim();
          const nodeRaw = String(raw.node_name || "").trim();
          profileMap.set(agent_id, {
            agent_id,
            region: regionRaw ? regionRaw.slice(0, 80) : null,
            node_name: nodeRaw ? nodeRaw.slice(0, 120) : null,
            required: raw.required !== false,
            source: "PROFILE",
          });
        }
      } catch (error) {
        this.logger.warn(`SYSTEM_SLO_AGENT_PROFILES_JSON không hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    for (const agent_id of [...new Set([...key_ids, ...public_key_ids])]) {
      if (!profileMap.has(agent_id)) profileMap.set(agent_id, { agent_id, region: null, node_name: null, required: true, source: "KEYRING" });
    }
    const profiles = [...profileMap.values()].sort((a, b) => a.agent_id.localeCompare(b.agent_id));
    const mode = rawProfiles ? "PROFILES+KEYRING" : (key_ids.length || public_key_ids.length) ? "KEYRING_DERIVED" : shared_secret_enabled ? "SHARED_SECRET_ONLY" : "UNCONFIGURED";
    return { stale_after_seconds, offline_after_seconds, shared_secret_enabled, key_ids, public_key_ids, profiles, mode };
  }

  private async suc_khoe_probe_fleet_v3120() {
    const config = this.cau_hinh_probe_fleet_v3120();
    try {
      const rows = await this.db.sloProbeAgent.findMany({ orderBy: [{ region: "asc" }, { agent_id: "asc" }] });
      const byId = new Map(rows.map(row => [row.agent_id, row]));
      const keySet = new Set(config.key_ids);
      const publicKeySet = new Set(config.public_key_ids);
      const profileSet = new Set(config.profiles.map(x => x.agent_id));
      const now = Date.now();
      const statusFor = (heartbeat: Date | null) => {
        if (!heartbeat) return { status: "MISSING" as const, age: null as number | null };
        const age = Math.max(0, Math.round((now - heartbeat.getTime()) / 1000));
        if (age <= config.stale_after_seconds) return { status: "ONLINE" as const, age };
        if (age <= config.offline_after_seconds) return { status: "STALE" as const, age };
        return { status: "OFFLINE" as const, age };
      };

      const managed = config.profiles.map(profile => {
        const row = byId.get(profile.agent_id);
        const state = statusFor(row?.lan_heartbeat || null);
        const per_agent_key = keySet.has(profile.agent_id);
        const asymmetric_key = publicKeySet.has(profile.agent_id);
        const key_configured = per_agent_key || asymmetric_key || config.shared_secret_enabled;
        const warnings: string[] = [];
        if (!key_configured) warnings.push("MISSING_SIGNING_KEY");
        else if (!per_agent_key && !asymmetric_key && config.shared_secret_enabled) warnings.push("SHARED_SECRET_FALLBACK");
        if (!row) warnings.push("NOT_REGISTERED");
        if (row && profile.region && row.region !== profile.region) warnings.push("REGION_MISMATCH");
        if (row && profile.node_name && row.node_name !== profile.node_name) warnings.push("NODE_MISMATCH");
        return {
          agent_id: profile.agent_id,
          required: profile.required,
          managed: true,
          source: profile.source,
          key_configured,
          per_agent_key,
          asymmetric_key,
          registered: !!row,
          status: state.status,
          heartbeat_age_seconds: state.age,
          expected_region: profile.region,
          expected_node_name: profile.node_name,
          region: row?.region || profile.region || "unknown",
          node_name: row?.node_name || profile.node_name || profile.agent_id,
          phien_ban: row?.phien_ban || null,
          lan_heartbeat: row?.lan_heartbeat || null,
          lan_mau: row?.lan_mau || null,
          warnings,
        };
      });

      const unmanaged = rows.filter(row => !profileSet.has(row.agent_id)).map(row => {
        const state = statusFor(row.lan_heartbeat);
        return {
          agent_id: row.agent_id, required: false, managed: false, source: "UNMANAGED" as const,
          key_configured: keySet.has(row.agent_id) || publicKeySet.has(row.agent_id) || config.shared_secret_enabled, per_agent_key: keySet.has(row.agent_id), asymmetric_key: publicKeySet.has(row.agent_id), registered: true,
          status: state.status, heartbeat_age_seconds: state.age, expected_region: null, expected_node_name: null, region: row.region, node_name: row.node_name, phien_ban: row.phien_ban, lan_heartbeat: row.lan_heartbeat, lan_mau: row.lan_mau, warnings: ["UNMANAGED_AGENT"],
        };
      });

      const required = managed.filter(x => x.required);
      const requiredCount = required.length;
      const registered = required.filter(x => x.registered).length;
      const online = required.filter(x => x.status === "ONLINE").length;
      const stale = required.filter(x => x.status === "STALE").length;
      const offline = required.filter(x => x.status === "OFFLINE").length;
      const missing = required.filter(x => x.status === "MISSING").length;
      const keyReady = required.filter(x => x.per_agent_key || x.asymmetric_key).length;
      const percent = (value: number) => requiredCount ? Math.round((value / requiredCount) * 10_000) / 100 : 100;
      const warnings = [...new Set([...managed, ...unmanaged].flatMap(x => x.warnings))];
      return {
        phien_ban: "3.13.0",
        mode: config.mode,
        stale_after_seconds: config.stale_after_seconds,
        offline_after_seconds: config.offline_after_seconds,
        expected: requiredCount,
        configured_profiles: config.profiles.length,
        per_agent_keys: config.key_ids.length,
        asymmetric_public_keys: config.public_key_ids.length,
        shared_secret_enabled: config.shared_secret_enabled,
        registered, online, stale, offline, missing, unmanaged: unmanaged.length,
        registration_coverage_percent: percent(registered),
        online_coverage_percent: percent(online),
        key_coverage_percent: percent(keyReady),
        ready: required.length > 0 && required.every(x => x.registered && (x.per_agent_key || x.asymmetric_key) && x.status === "ONLINE"),
        warnings,
        agents: [...managed, ...unmanaged].sort((a, b) => a.agent_id.localeCompare(b.agent_id)),
        secret_values_exposed: false,
      };
    } catch (error) {
      return {
        phien_ban: "3.13.0", mode: config.mode, stale_after_seconds: config.stale_after_seconds, offline_after_seconds: config.offline_after_seconds,
        expected: config.profiles.filter(x => x.required).length, configured_profiles: config.profiles.length, per_agent_keys: config.key_ids.length, asymmetric_public_keys: config.public_key_ids.length, shared_secret_enabled: config.shared_secret_enabled,
        registered: 0, online: 0, stale: 0, offline: 0, missing: config.profiles.filter(x => x.required).length, unmanaged: 0,
        registration_coverage_percent: 0, online_coverage_percent: 0, key_coverage_percent: 0, ready: false, warnings: ["FLEET_STORE_UNAVAILABLE"], agents: [], secret_values_exposed: false,
        loi: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private cau_hinh_quorum_v3130() {
    const clampInt = (name: string, fallback: number, min: number, max: number) => Math.max(min, Math.min(max, Number.parseInt(process.env[name] || String(fallback), 10) || fallback));
    const multiplierRaw = Number(process.env.SYSTEM_SLO_ANOMALY_LATENCY_MULTIPLIER || "2.5");
    return {
      window_seconds: clampInt("SYSTEM_SLO_QUORUM_WINDOW_SECONDS", 900, 60, 86_400),
      min_regions: clampInt("SYSTEM_SLO_QUORUM_MIN_REGIONS", 2, 1, 32),
      healthy_percent: clampInt("SYSTEM_SLO_QUORUM_HEALTHY_PERCENT", 67, 50, 100),
      anomaly_lookback_minutes: clampInt("SYSTEM_SLO_ANOMALY_LOOKBACK_MINUTES", 60, 15, 1440),
      anomaly_min_samples: clampInt("SYSTEM_SLO_ANOMALY_MIN_SAMPLES", 6, 3, 500),
      anomaly_latency_multiplier: Number.isFinite(multiplierRaw) ? Math.max(1.2, Math.min(10, multiplierRaw)) : 2.5,
    };
  }

  private trung_vi_v3130(values: number[]) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private async phan_tich_quorum_v3130() {
    const config = this.cau_hinh_quorum_v3130();
    const fleetConfig = this.cau_hinh_probe_fleet_v3120();
    const lookbackSeconds = Math.max(config.window_seconds, config.anomaly_lookback_minutes * 60);
    const since = new Date(Date.now() - lookbackSeconds * 1000);
    try {
      const rows = await this.db.sloEndpointMau.findMany({
        where: { ngay_tao: { gte: since } },
        orderBy: { ngay_tao: "asc" },
        select: { endpoint_id: true, agent_id: true, region: true, node_name: true, trang_thai: true, http_status: true, do_tre_ms: true, latency_target_ms: true, maintenance_active: true, ngay_tao: true },
      });
      const expectedRegions = [...new Set(fleetConfig.profiles.filter(x => x.required && x.region).map(x => x.region as string))].sort();
      const endpointMap = new Map<string, typeof rows>();
      for (const row of rows) {
        const list = endpointMap.get(row.endpoint_id) || [];
        list.push(row);
        endpointMap.set(row.endpoint_id, list);
      }
      const now = Date.now();
      const endpoints = [...endpointMap.entries()].map(([endpoint_id, endpointRows]) => {
        const regionMap = new Map<string, typeof rows>();
        for (const row of endpointRows) {
          const list = regionMap.get(row.region) || [];
          list.push(row);
          regionMap.set(row.region, list);
        }
        const observedRegions = [...regionMap.keys()].sort();
        const regionUniverse = expectedRegions.length ? expectedRegions : observedRegions;
        const expectedCount = Math.max(1, regionUniverse.length);
        const quorumRequired = Math.max(1, Math.min(expectedCount, Math.max(config.min_regions, Math.ceil(expectedCount * config.healthy_percent / 100))));
        const regions = regionUniverse.map(region => {
          const history = [...(regionMap.get(region) || [])].sort((a, b) => a.ngay_tao.getTime() - b.ngay_tao.getTime());
          const latest = history.length ? history[history.length - 1] : null;
          const ageSeconds = latest ? Math.max(0, Math.round((now - latest.ngay_tao.getTime()) / 1000)) : null;
          const inWindow = latest != null && ageSeconds != null && ageSeconds <= config.window_seconds;
          const healthy = !!latest && inWindow && !latest.maintenance_active && latest.trang_thai === "TOT";
          const baseline = history.slice(0, -1).filter(x => !x.maintenance_active && x.trang_thai === "TOT").map(x => x.do_tre_ms).slice(-200);
          const median = this.trung_vi_v3130(baseline);
          const latencyThreshold = latest && median != null ? Math.max(latest.latency_target_ms, median * config.anomaly_latency_multiplier) : null;
          const latencyAnomaly = !!latest && baseline.length >= config.anomaly_min_samples && latencyThreshold != null && latest.do_tre_ms > latencyThreshold;
          const baselineStatus = history.slice(0, -1).filter(x => !x.maintenance_active).slice(-50);
          const healthyBaselinePercent = baselineStatus.length ? (baselineStatus.filter(x => x.trang_thai === "TOT").length / baselineStatus.length) * 100 : null;
          const statusAnomaly = !!latest && baselineStatus.length >= config.anomaly_min_samples && (healthyBaselinePercent ?? 0) >= 90 && latest.trang_thai !== "TOT";
          return {
            region,
            observed: !!latest,
            healthy,
            status: latest?.trang_thai || "MISSING",
            agent_id: latest?.agent_id || null,
            node_name: latest?.node_name || null,
            http_status: latest?.http_status ?? null,
            latency_ms: latest?.do_tre_ms ?? null,
            latency_target_ms: latest?.latency_target_ms ?? null,
            heartbeat_age_seconds: ageSeconds,
            baseline_median_ms: median == null ? null : Math.round(median * 10) / 10,
            latency_threshold_ms: latencyThreshold == null ? null : Math.round(latencyThreshold * 10) / 10,
            latency_anomaly: latencyAnomaly,
            status_anomaly: statusAnomaly,
          };
        });
        const healthyRegions = regions.filter(x => x.healthy).length;
        const observedInWindow = regions.filter(x => x.observed && (x.heartbeat_age_seconds ?? Number.MAX_SAFE_INTEGER) <= config.window_seconds).length;
        const statuses = new Set(regions.filter(x => x.observed).map(x => x.status));
        const disagreement = statuses.size > 1;
        const anomalyRegions = regions.filter(x => x.latency_anomaly || x.status_anomaly).map(x => x.region);
        const consensus = healthyRegions >= quorumRequired ? "QUORUM_OK" : healthyRegions === 0 && observedInWindow >= quorumRequired ? "OUTAGE" : "DEGRADED";
        return {
          endpoint_id,
          expected_regions: expectedCount,
          observed_regions: observedInWindow,
          healthy_regions: healthyRegions,
          quorum_required: quorumRequired,
          quorum_met: healthyRegions >= quorumRequired,
          consensus,
          disagreement,
          anomaly_regions: anomalyRegions,
          regions,
        };
      }).sort((a, b) => a.endpoint_id.localeCompare(b.endpoint_id));
      const summary = {
        endpoints: endpoints.length,
        quorum_ok: endpoints.filter(x => x.consensus === "QUORUM_OK").length,
        degraded: endpoints.filter(x => x.consensus === "DEGRADED").length,
        outage: endpoints.filter(x => x.consensus === "OUTAGE").length,
        disagreements: endpoints.filter(x => x.disagreement).length,
        anomalies: endpoints.reduce((sum, x) => sum + x.anomaly_regions.length, 0),
      };
      return {
        phien_ban: "3.13.0",
        config,
        expected_regions: expectedRegions,
        summary,
        ready: endpoints.length > 0 && endpoints.every(x => x.quorum_met) && summary.anomalies === 0,
        endpoints,
      };
    } catch (error) {
      return {
        phien_ban: "3.13.0",
        config,
        expected_regions: [],
        summary: { endpoints: 0, quorum_ok: 0, degraded: 0, outage: 0, disagreements: 0, anomalies: 0 },
        ready: false,
        endpoints: [],
        loi: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async thong_tin_dlq_keyring_v3110() {
    const ring = this.dlq_keyring_v3110();
    let theo_key: Array<{ key_id: string; so_luong: number }> = [];
    try {
      const groups = await this.db.webhookDlqPayload.groupBy({ by: ["key_id"], _count: { _all: true } });
      theo_key = groups.map(x => ({ key_id: x.key_id, so_luong: x._count._all }));
    } catch {}
    return { active_key_id: ring.active_key_id, key_ids: ring.key_ids, configured_keys: ring.configured, requested_active_key_id: ring.requested_active_key_id, theo_key, kms_friendly: true, secret_values_exposed: false };
  }

  async rotate_dlq_key_v3110(actor: NguoiDungXacThuc, gioiHanRaw?: number) {
    const ring = this.dlq_keyring_v3110();
    if (!ring.active) throw new BadRequestException("Chưa có active DLQ encryption key");
    const take = Math.max(1, Math.min(500, Number(gioiHanRaw || 100)));
    const rows = await this.db.webhookDlqPayload.findMany({ where: { key_id: { not: ring.active.key_id } }, orderBy: { ngay_tao: "asc" }, take });
    let rotated = 0; const failed: Array<{ id: string; key_id: string; loi: string }> = [];
    for (const row of rows) {
      try {
        const payload = this.giai_ma_payload_dlq_v3100(row);
        const encrypted = this.ma_hoa_payload_dlq_v3100(payload);
        if (!encrypted) throw new Error("Active key không sẵn sàng");
        await this.db.webhookDlqPayload.update({ where: { id: row.id }, data: encrypted });
        rotated += 1;
      } catch (error) {
        failed.push({ id: row.id, key_id: row.key_id, loi: error instanceof Error ? error.message : String(error) });
      }
    }
    await this.ghi_lich_su_van_hanh("WEBHOOK_DLQ_KEY_ROTATION", failed.length ? "CANH_BAO" : "THANH_CONG", `Admin ${actor.ho_ten} rotate DLQ encryption key`, { active_key_id: ring.active.key_id, requested: rows.length, rotated, failed: failed.length, failed_items: failed.slice(0, 20) });
    return { active_key_id: ring.active.key_id, requested: rows.length, rotated, failed, con_lai_uoc_tinh: Math.max(0, rows.length - rotated) };
  }

  private cau_hinh_retry_budget_v3110() {
    return {
      max_attempts: Math.max(1, Math.min(1000, Number.parseInt(process.env.SYSTEM_ALERT_WEBHOOK_DLQ_DESTINATION_MAX_ATTEMPTS || "30", 10) || 30)),
      window_minutes: Math.max(1, Math.min(1440, Number.parseInt(process.env.SYSTEM_ALERT_WEBHOOK_DLQ_DESTINATION_WINDOW_MINUTES || "60", 10) || 60)),
    };
  }

  private async tieu_thu_retry_budget_v3110(endpoint: string, adapter: string) {
    const policy = this.cau_hinh_retry_budget_v3110();
    const key = createHash("sha256").update(`${adapter}\n${endpoint}`).digest("hex");
    const now = new Date(); const cutoff = new Date(now.getTime() - policy.window_minutes * 60_000);
    const current = await this.db.webhookRetryBudget.findUnique({ where: { budget_key: key } });
    if (!current || current.window_start < cutoff) {
      await this.db.webhookRetryBudget.upsert({ where: { budget_key: key }, create: { budget_key: key, endpoint, adapter, window_start: now, da_dung: 1 }, update: { endpoint, adapter, window_start: now, da_dung: 1 } });
      return { duoc_phep: true, da_dung: 1, ...policy };
    }
    if (current.da_dung >= policy.max_attempts) return { duoc_phep: false, da_dung: current.da_dung, ...policy };
    const updated = await this.db.webhookRetryBudget.update({ where: { budget_key: key }, data: { da_dung: { increment: 1 } } });
    return { duoc_phep: true, da_dung: updated.da_dung, ...policy };
  }

  async tao_webhook_replay_job_v3110(actor: NguoiDungXacThuc, idsRaw: string[], boQuaIdempotency = false) {
    const ids = [...new Set(idsRaw.map(x => this.parse_webhook_dead_letter_id(x)))];
    if (!ids.length || ids.length > 100) throw new BadRequestException("Replay job cần từ 1 đến 100 dead-letter");
    const job = await this.db.webhookReplayJob.create({
      data: { tong: ids.length, bo_qua_idempotency: boQuaIdempotency, nguoi_tao_id: actor.id, nguoi_tao_ten: actor.ho_ten, items: { create: ids.map(id => ({ dead_letter_history_id: id })) } },
      include: { items: true },
    });
    await this.ghi_lich_su_van_hanh("WEBHOOK_REPLAY_JOB", "CHO_XU_LY", `Admin ${actor.ho_ten} tạo bulk replay job`, { job_id: job.id, tong: ids.length, bo_qua_idempotency: boQuaIdempotency });
    return { ...job, items: job.items.map(x => ({ ...x, dead_letter_history_id: x.dead_letter_history_id.toString() })) };
  }

  async danh_sach_webhook_replay_job_v3110() {
    const rows = await this.db.webhookReplayJob.findMany({ orderBy: { ngay_tao: "desc" }, take: 50, include: { items: { orderBy: { ngay_tao: "asc" }, take: 20 } } });
    return { du_lieu: rows.map(row => ({ ...row, progress_percent: row.tong ? Math.round((row.da_xu_ly / row.tong) * 1000) / 10 : 0, items: row.items.map(x => ({ ...x, dead_letter_history_id: x.dead_letter_history_id.toString() })) })) };
  }

  async huy_webhook_replay_job_v3110(actor: NguoiDungXacThuc, id: string) {
    const job = await this.db.webhookReplayJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException("Không tìm thấy webhook replay job");
    if (["HOAN_TAT", "DA_HUY"].includes(job.trang_thai)) return job;
    const updated = await this.db.webhookReplayJob.update({ where: { id }, data: { da_huy: true, trang_thai: "DA_HUY" } });
    await this.ghi_lich_su_van_hanh("WEBHOOK_REPLAY_JOB", "DA_HUY", `Admin ${actor.ho_ten} hủy bulk replay job`, { job_id: id, da_xu_ly: updated.da_xu_ly, tong: updated.tong });
    return updated;
  }

  private async xu_ly_webhook_replay_jobs_v3110(gioiHan = 5) {
    const job = await this.db.webhookReplayJob.findFirst({ where: { trang_thai: { in: ["CHO_XU_LY", "DANG_XU_LY"] }, da_huy: false }, orderBy: { ngay_tao: "asc" } });
    if (!job) return { jobs: 0, processed: 0 };
    await this.db.webhookReplayJob.update({ where: { id: job.id }, data: { trang_thai: "DANG_XU_LY" } });
    const items = await this.db.webhookReplayItem.findMany({ where: { job_id: job.id, trang_thai: "CHO_XU_LY" }, orderBy: { ngay_tao: "asc" }, take: Math.max(1, Math.min(20, gioiHan)) });
    let success = 0; let failed = 0;
    for (const item of items) {
      const fresh = await this.db.webhookReplayJob.findUnique({ where: { id: job.id } });
      if (!fresh || fresh.da_huy) break;
      try {
        const result = await this.replay_webhook_dead_letter({ ho_ten: job.nguoi_tao_ten || "REPLAY_JOB" }, item.dead_letter_history_id.toString(), job.bo_qua_idempotency, false, job.id);
        const ok = result.da_gui === true;
        const replayFailureReason = !ok && "ly_do" in result && typeof result.ly_do === "string" && result.ly_do.trim()
          ? result.ly_do
          : "Replay thất bại";
        await this.db.webhookReplayItem.update({ where: { id: item.id }, data: { trang_thai: ok ? "THANH_CONG" : "THAT_BAI", loi: ok ? null : replayFailureReason } });
        if (ok) success += 1; else failed += 1;
      } catch (error) {
        failed += 1;
        await this.db.webhookReplayItem.update({ where: { id: item.id }, data: { trang_thai: "THAT_BAI", loi: error instanceof Error ? error.message : String(error) } });
      }
      await this.db.webhookReplayJob.update({ where: { id: job.id }, data: { da_xu_ly: { increment: 1 }, ...(success ? { thanh_cong: { increment: 1 } } : {}), ...(failed ? { that_bai: { increment: 1 } } : {}) } });
      success = 0; failed = 0;
    }
    const conLai = await this.db.webhookReplayItem.count({ where: { job_id: job.id, trang_thai: "CHO_XU_LY" } });
    const finalJob = await this.db.webhookReplayJob.findUnique({ where: { id: job.id } });
    if (finalJob && !finalJob.da_huy && conLai === 0) {
      await this.db.webhookReplayJob.update({ where: { id: job.id }, data: { trang_thai: "HOAN_TAT" } });
      await this.ghi_lich_su_van_hanh("WEBHOOK_REPLAY_JOB", "HOAN_TAT", "Bulk replay job hoàn tất", { job_id: job.id, tong: finalJob.tong, thanh_cong: finalJob.thanh_cong, that_bai: finalJob.that_bai });
    }
    return { jobs: 1, processed: items.length, job_id: job.id, con_lai: conLai };
  }

  private retention_ops_v3110() {
    const clamp = (name: string, fallback: number) => Math.max(7, Math.min(3650, Number.parseInt(process.env[name] || String(fallback), 10) || fallback));
    return {
      health_days: clamp("SYSTEM_OPS_RETENTION_HEALTH_DAYS", 90),
      endpoint_days: clamp("SYSTEM_OPS_RETENTION_SLO_ENDPOINT_DAYS", 90),
      webhook_days: clamp("SYSTEM_OPS_RETENTION_WEBHOOK_DAYS", 180),
      default_days: clamp("SYSTEM_OPS_RETENTION_DEFAULT_DAYS", 365),
    };
  }

  private thong_tin_thang_archive_v3110(thangRaw: string) {
    const thang = thangRaw.trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(thang)) throw new BadRequestException("Tháng archive phải có dạng YYYY-MM");
    const start = new Date(`${thang}-01T00:00:00.000Z`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const suffix = thang.replace("-", "_");
    return { thang, start, end, suffix };
  }

  private dieu_kien_retention_archive_v3110(bang: "lich_su_van_hanh" | "slo_endpoint_mau") {
    const cfg = this.retention_ops_v3110(); const now = Date.now();
    const iso = (days: number) => new Date(now - days * 86_400_000).toISOString();
    if (bang === "slo_endpoint_mau") return `t."ngay_tao" < TIMESTAMPTZ '${iso(cfg.endpoint_days)}'`;
    return `t."ngay_tao" < CASE
      WHEN t."loai" = 'HEALTH' THEN TIMESTAMPTZ '${iso(cfg.health_days)}'
      WHEN t."loai" = 'SLO_ENDPOINT' THEN TIMESTAMPTZ '${iso(cfg.endpoint_days)}'
      WHEN t."loai" LIKE 'WEBHOOK%' THEN TIMESTAMPTZ '${iso(cfg.webhook_days)}'
      ELSE TIMESTAMPTZ '${iso(cfg.default_days)}' END`;
  }

  async kiem_tra_archive_ops_v3110(bangRaw: string, thangRaw: string) {
    const bang = bangRaw === "lich_su_van_hanh" || bangRaw === "slo_endpoint_mau" ? bangRaw : null;
    if (!bang) throw new BadRequestException("Bảng archive không hợp lệ");
    const month = this.thong_tin_thang_archive_v3110(thangRaw);
    const condition = this.dieu_kien_retention_archive_v3110(bang);
    const rows = await this.db.$queryRawUnsafe<Array<{ tong: bigint; min_id: bigint | null; max_id: bigint | null; sum_id: string }>>(
      `SELECT count(*)::bigint AS tong, min(t.id)::bigint AS min_id, max(t.id)::bigint AS max_id, coalesce(sum(t.id),0)::text AS sum_id FROM "${bang}" t WHERE t."ngay_tao" >= TIMESTAMPTZ '${month.start.toISOString()}' AND t."ngay_tao" < TIMESTAMPTZ '${month.end.toISOString()}' AND ${condition}`,
    );
    const row = rows[0] || { tong: 0n, min_id: null, max_id: null, sum_id: "0" };
    const signature = `${bang}|${month.thang}|${row.tong.toString()}|${row.min_id?.toString() || ""}|${row.max_id?.toString() || ""}|${row.sum_id}`;
    const existing = await this.db.opsArchiveBatch.findUnique({ where: { bang_nguon_thang: { bang_nguon: bang, thang: month.thang } } });
    return { bang_nguon: bang, thang: month.thang, eligible_count: Number(row.tong), min_id: row.min_id?.toString() || null, max_id: row.max_id?.toString() || null, sha256: createHash("sha256").update(signature).digest("hex"), retention: this.retention_ops_v3110(), archived: existing != null, existing_batch: existing };
  }

  async archive_ops_v3110(actor: NguoiDungXacThuc, bangRaw: string, thangRaw: string) {
    const preview = await this.kiem_tra_archive_ops_v3110(bangRaw, thangRaw);
    const bang = preview.bang_nguon as "lich_su_van_hanh" | "slo_endpoint_mau";
    if (preview.archived) throw new ConflictException("Tháng telemetry này đã được archive");
    if (!preview.eligible_count) return { ...preview, da_archive: false, ly_do: "Không có bản ghi đủ retention để archive" };
    const month = this.thong_tin_thang_archive_v3110(thangRaw);
    const condition = this.dieu_kien_retention_archive_v3110(bang);
    const partition = `ops_telemetry_archive_${month.suffix}`;
    await this.db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${partition}" PARTITION OF "ops_telemetry_archive" FOR VALUES FROM ('${month.thang}-01') TO ('${month.end.toISOString().slice(0, 10)}')`);
      const payloadExpr = bang === "lich_su_van_hanh" ? `to_jsonb(t) - 'search_vector'` : "to_jsonb(t)";
      await tx.$executeRawUnsafe(`INSERT INTO "ops_telemetry_archive" ("source_table","source_id","archive_month","ngay_tao","payload") SELECT '${bang}', t."id", DATE '${month.thang}-01', t."ngay_tao", ${payloadExpr} FROM "${bang}" t WHERE t."ngay_tao" >= TIMESTAMPTZ '${month.start.toISOString()}' AND t."ngay_tao" < TIMESTAMPTZ '${month.end.toISOString()}' AND ${condition}`);
      const check = await tx.$queryRawUnsafe<Array<{ tong: bigint; min_id: bigint | null; max_id: bigint | null; sum_id: string }>>(`SELECT count(*)::bigint AS tong, min("source_id")::bigint AS min_id, max("source_id")::bigint AS max_id, coalesce(sum("source_id"),0)::text AS sum_id FROM "ops_telemetry_archive" WHERE "source_table"='${bang}' AND "archive_month"=DATE '${month.thang}-01'`);
      const archived = check[0] || { tong: 0n, min_id: null, max_id: null, sum_id: "0" };
      const archiveSignature = `${bang}|${month.thang}|${archived.tong.toString()}|${archived.min_id?.toString() || ""}|${archived.max_id?.toString() || ""}|${archived.sum_id}`;
      const archiveSha = createHash("sha256").update(archiveSignature).digest("hex");
      if (Number(archived.tong) !== preview.eligible_count || archiveSha !== preview.sha256) {
        throw new Error(`Archive verify mismatch: source_count=${preview.eligible_count} archive_count=${Number(archived.tong)} source_sha=${preview.sha256} archive_sha=${archiveSha}`);
      }
      await tx.$executeRawUnsafe(`DELETE FROM "${bang}" t WHERE t."ngay_tao" >= TIMESTAMPTZ '${month.start.toISOString()}' AND t."ngay_tao" < TIMESTAMPTZ '${month.end.toISOString()}' AND ${condition}`);
      await tx.opsArchiveBatch.create({ data: { bang_nguon: bang, thang: month.thang, partition_name: partition, so_ban_ghi: preview.eligible_count, sha256: preview.sha256, trang_thai: "DA_XAC_MINH_VA_PRUNE", nguoi_tao_id: actor.id } });
    });
    await this.ghi_lich_su_van_hanh("OPS_ARCHIVE", "THANH_CONG", `Admin ${actor.ho_ten} archive telemetry ${bang} ${month.thang}`, { bang_nguon: bang, thang: month.thang, partition, so_ban_ghi: preview.eligible_count, sha256: preview.sha256, verify_before_prune: true });
    return { ...preview, da_archive: true, partition_name: partition };
  }

  private validate_ops_service_v3110(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(value)) throw new BadRequestException("Mã dịch vụ Ops không hợp lệ");
    return value;
  }

  async danh_sach_on_call_v3110() {
    const [schedules, policies] = await Promise.all([
      this.db.opsOnCallSchedule.findMany({ include: { nguoi_dung: { select: { id: true, ho_ten: true, thu_dien_tu: true, da_kich_hoat: true } } }, orderBy: [{ dich_vu: "asc" }, { thu_trong_tuan: "asc" }, { bat_dau_phut: "asc" }] }),
      this.db.opsEscalationPolicy.findMany({ orderBy: [{ dich_vu: "asc" }, { cap_escalation: "asc" }] }),
    ]);
    return { schedules, policies, current: await this.on_call_hien_tai_v3110() };
  }

  async tao_on_call_v3110(actor: NguoiDungXacThuc, dto: { dich_vu: string; nguoi_dung_id: string; thu_trong_tuan: number; bat_dau_phut: number; ket_thuc_phut: number; timezone?: string; cap_escalation?: number; dang_hoat_dong?: boolean }) {
    const dich_vu = this.validate_ops_service_v3110(dto.dich_vu);
    const user = await this.db.nguoiDung.findUnique({ where: { id: dto.nguoi_dung_id }, select: { id: true, ho_ten: true, da_kich_hoat: true, vai_tro: true } });
    if (!user || !user.da_kich_hoat || user.vai_tro === "KHACH_HANG") throw new BadRequestException("On-call phải là tài khoản nhân viên đang hoạt động");
    const timezone = dto.timezone?.trim() || "Asia/Ho_Chi_Minh";
    try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date()); } catch { throw new BadRequestException("Timezone on-call không hợp lệ"); }
    const item = await this.db.opsOnCallSchedule.create({ data: { dich_vu, nguoi_dung_id: dto.nguoi_dung_id, thu_trong_tuan: dto.thu_trong_tuan, bat_dau_phut: dto.bat_dau_phut, ket_thuc_phut: dto.ket_thuc_phut, timezone, cap_escalation: dto.cap_escalation ?? 1, dang_hoat_dong: dto.dang_hoat_dong ?? true } });
    await this.ghi_lich_su_van_hanh("OPS_ON_CALL", "DA_TAO", `Admin ${actor.ho_ten} tạo ca on-call`, { schedule_id: item.id, dich_vu, nguoi_dung_id: user.id, thu_trong_tuan: item.thu_trong_tuan, bat_dau_phut: item.bat_dau_phut, ket_thuc_phut: item.ket_thuc_phut, timezone, cap_escalation: item.cap_escalation });
    return item;
  }

  async xoa_on_call_v3110(actor: NguoiDungXacThuc, id: string) {
    const item = await this.db.opsOnCallSchedule.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Không tìm thấy ca on-call");
    await this.db.opsOnCallSchedule.delete({ where: { id } });
    await this.ghi_lich_su_van_hanh("OPS_ON_CALL", "DA_XOA", `Admin ${actor.ho_ten} xóa ca on-call`, { schedule_id: id, dich_vu: item.dich_vu, nguoi_dung_id: item.nguoi_dung_id });
    return { da_xoa: true, id };
  }

  async upsert_escalation_policy_v3110(actor: NguoiDungXacThuc, dto: { dich_vu: string; cap_escalation: number; sau_phut: number; kenh?: "EMAIL" | "WEBHOOK" | "EMAIL_WEBHOOK"; dang_hoat_dong?: boolean }) {
    const dich_vu = this.validate_ops_service_v3110(dto.dich_vu);
    const item = await this.db.opsEscalationPolicy.upsert({
      where: { dich_vu_cap_escalation: { dich_vu, cap_escalation: dto.cap_escalation } },
      create: { dich_vu, cap_escalation: dto.cap_escalation, sau_phut: dto.sau_phut, kenh: dto.kenh || "EMAIL_WEBHOOK", dang_hoat_dong: dto.dang_hoat_dong ?? true },
      update: { sau_phut: dto.sau_phut, kenh: dto.kenh || "EMAIL_WEBHOOK", dang_hoat_dong: dto.dang_hoat_dong ?? true },
    });
    await this.ghi_lich_su_van_hanh("OPS_ESCALATION", "DA_CAP_NHAT", `Admin ${actor.ho_ten} cập nhật escalation policy`, { dich_vu, cap_escalation: item.cap_escalation, sau_phut: item.sau_phut, kenh: item.kenh, dang_hoat_dong: item.dang_hoat_dong });
    return item;
  }

  private lich_on_call_active_v3110(item: { thu_trong_tuan: number; bat_dau_phut: number; ket_thuc_phut: number; timezone: string }, now: Date) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: item.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const value = (type: string) => parts.find(x => x.type === type)?.value || "";
    const day = ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[value("weekday")];
    const minute = Number(value("hour")) * 60 + Number(value("minute"));
    if (item.bat_dau_phut <= item.ket_thuc_phut) return day === item.thu_trong_tuan && minute >= item.bat_dau_phut && minute < item.ket_thuc_phut;
    const previousDay = (day + 6) % 7;
    return (day === item.thu_trong_tuan && minute >= item.bat_dau_phut) || (previousDay === item.thu_trong_tuan && minute < item.ket_thuc_phut);
  }

  async on_call_hien_tai_v3110(dichVuRaw?: string) {
    const service = dichVuRaw?.trim() ? this.validate_ops_service_v3110(dichVuRaw) : undefined;
    const rows = await this.db.opsOnCallSchedule.findMany({ where: { dang_hoat_dong: true, ...(service ? { dich_vu: service } : {}) }, include: { nguoi_dung: { select: { id: true, ho_ten: true, thu_dien_tu: true, da_kich_hoat: true } } }, orderBy: [{ cap_escalation: "asc" }, { dich_vu: "asc" }] });
    const now = new Date();
    const current = rows.filter(item => item.nguoi_dung.da_kich_hoat && this.lich_on_call_active_v3110(item, now));
    const policies = await this.db.opsEscalationPolicy.findMany({ where: { dang_hoat_dong: true, ...(service ? { dich_vu: service } : {}) }, orderBy: [{ dich_vu: "asc" }, { cap_escalation: "asc" }] });
    return { at: now.toISOString(), service: service || "*", current, policies };
  }

  private xep_dich_vu_su_co_v3110(vanDeRaw: unknown) {
    const text = (Array.isArray(vanDeRaw) ? vanDeRaw : []).map(x => String(x).toLowerCase()).join(" ");
    if (/postgres|database|cơ sở dữ liệu|co so du lieu/.test(text)) return "postgresql";
    if (/backup|sao lưu|sao luu|restore/.test(text)) return "backup";
    if (/smtp|email|mail/.test(text)) return "smtp";
    if (/webhook/.test(text)) return "webhook";
    if (/storefront|web|frontend|next/.test(text)) return "storefront";
    return "api";
  }

  async gan_chu_so_huu_su_co_v3110(actor: NguoiDungXacThuc, chuKyRaw: string, nguoiDungIdRaw?: string, dichVuRaw?: string) {
    const chu_ky = this.chuan_hoa_chu_ky_su_co(chuKyRaw);
    const incident = await this.db.suCoVanHanh.findUnique({ where: { chu_ky } });
    if (!incident) throw new NotFoundException("Không tìm thấy incident");
    const dich_vu = dichVuRaw?.trim() ? this.validate_ops_service_v3110(dichVuRaw) : incident.dich_vu || this.xep_dich_vu_su_co_v3110(incident.van_de);
    let userId = nguoiDungIdRaw?.trim() || "";
    let user: { id: string; ho_ten: string; thu_dien_tu: string; da_kich_hoat: boolean } | null = null;
    if (userId) user = await this.db.nguoiDung.findUnique({ where: { id: userId }, select: { id: true, ho_ten: true, thu_dien_tu: true, da_kich_hoat: true } });
    else {
      const roster = await this.on_call_hien_tai_v3110(dich_vu);
      const first = roster.current[0];
      if (first) { userId = first.nguoi_dung.id; user = first.nguoi_dung; }
    }
    if (!user || !user.da_kich_hoat) throw new BadRequestException("Không tìm thấy người trực phù hợp để sở hữu incident");
    const updated = await this.db.suCoVanHanh.update({ where: { chu_ky }, data: { dich_vu, chu_so_huu_id: user.id, chu_so_huu_ten: user.ho_ten } });
    await this.ghi_lich_su_van_hanh("INCIDENT_OWNER", "DA_GAN", `${actor.ho_ten} gán incident cho ${user.ho_ten}`, { chu_ky, dich_vu, chu_so_huu_id: user.id, chu_so_huu_ten: user.ho_ten, thu_dien_tu: user.thu_dien_tu }, undefined, chu_ky);
    return updated;
  }

  async trang_thai_ops_v3110() {
    const [base, distributed_probe, dlq_keyring, on_call] = await Promise.all([this.trang_thai_ops_v3100(), this.suc_khoe_probe_agents_v3110(), this.thong_tin_dlq_keyring_v3110(), this.on_call_hien_tai_v3110()]);
    let replay_jobs = { cho_xu_ly: 0, dang_xu_ly: 0 };
    try {
      const grouped = await this.db.webhookReplayJob.groupBy({ by: ["trang_thai"], _count: { _all: true } });
      replay_jobs = { cho_xu_ly: grouped.find(x => x.trang_thai === "CHO_XU_LY")?._count._all || 0, dang_xu_ly: grouped.find(x => x.trang_thai === "DANG_XU_LY")?._count._all || 0 };
    } catch {}
    return { ...base, distributed_probe, dlq_keyring, replay_jobs, on_call, archive: { retention: this.retention_ops_v3110(), partitioned_store: "ops_telemetry_archive", verify_before_prune: true } };
  }

  async trang_thai_ops_v3120() {
    const [base, probe_fleet] = await Promise.all([this.trang_thai_ops_v3110(), this.suc_khoe_probe_fleet_v3120()]);
    return { ...base, phien_ban: "3.13.0", probe_fleet };
  }

  async trang_thai_ops_v3130() {
    const [base, multi_region_quorum] = await Promise.all([this.trang_thai_ops_v3120(), this.phan_tich_quorum_v3130()]);
    return { ...base, phien_ban: "3.13.0", multi_region_quorum, asymmetric_probe_signing: { algorithm: "Ed25519", public_keyring_configured: (process.env.SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON?.trim() || "").length > 0, hmac_backward_compatible: true, secret_values_exposed: false } };
  }

  private async lay_slo_endpoint_mau_v3100(tu: Date) {
    try {
      return await this.db.sloEndpointMau.findMany({ where: { ngay_tao: { gte: tu } }, orderBy: { ngay_tao: "asc" } });
    } catch (error) {
      this.logger.debug(`Persistent endpoint SLI v3.11.0 chưa sẵn sàng: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async thong_ke_sla_van_hanh(soNgayRaw?: string) {
    const raw = Number.parseInt(soNgayRaw || "90", 10) || 90;
    const so_ngay = raw <= 30 ? 30 : 90;
    const tu = new Date(); tu.setUTCDate(tu.getUTCDate() - (so_ngay - 1)); tu.setUTCHours(0, 0, 0, 0);
    const [healthRows, muc_tieu, nang_cao, incidents, alertConfig, endpointRows, endpointPersistedRows, maintenanceConfig] = await Promise.all([
      this.db.lichSuVanHanh.findMany({ where: { loai: "HEALTH", ngay_tao: { gte: tu } }, orderBy: { ngay_tao: "asc" }, select: { trang_thai: true, ngay_tao: true, chi_tiet: true } }),
      this.cau_hinh_slo_van_hanh_runtime(),
      this.cau_hinh_slo_nang_cao_runtime(),
      this.db.suCoVanHanh.findMany({ where: { bat_dau: { gte: tu } }, select: { bat_dau: true, tiep_nhan_luc: true, khac_phuc_luc: true, trang_thai_xu_ly: true } }),
      this.cau_hinh_canh_bao_he_thong_runtime(),
      this.db.lichSuVanHanh.findMany({ where: { loai: "SLO_ENDPOINT", ngay_tao: { gte: tu } }, orderBy: { ngay_tao: "asc" }, select: { trang_thai: true, ngay_tao: true, chi_tiet: true } }),
      this.lay_slo_endpoint_mau_v3100(tu),
      this.danh_sach_bao_tri_v370_runtime()
    ]);
    const chi_tiet = (value: Prisma.JsonValue) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
    const laMaintenance = (row: { chi_tiet: Prisma.JsonValue }) => chi_tiet(row.chi_tiet).maintenance_active === true;
    const policyMaintenance = nang_cao.maintenance_policy;
    const dsAvailability = policyMaintenance.exclude_from_availability ? healthRows.filter(x => !laMaintenance(x)) : healthRows;
    const dsBudget = policyMaintenance.exclude_from_error_budget ? healthRows.filter(x => !laMaintenance(x)) : healthRows;
    const maintenance_excluded = {
      availability_samples: healthRows.length - dsAvailability.length,
      error_budget_samples: healthRows.length - dsBudget.length
    };

    const map = new Map<string, { tong: number; tot: number; canh_bao: number; loi: number }>();
    for (const item of dsAvailability) {
      const ngay = item.ngay_tao.toISOString().slice(0, 10);
      const x = map.get(ngay) || { tong: 0, tot: 0, canh_bao: 0, loi: 0 }; x.tong += 1;
      if (item.trang_thai === "TOT") x.tot += 1; else if (item.trang_thai === "LOI") x.loi += 1; else x.canh_bao += 1; map.set(ngay, x);
    }
    const theo_ngay = Array.from({ length: so_ngay }, (_, i) => {
      const d = new Date(tu); d.setUTCDate(tu.getUTCDate() + i); const ngay = d.toISOString().slice(0, 10); const x = map.get(ngay) || { tong: 0, tot: 0, canh_bao: 0, loi: 0 };
      return { ngay, ...x, sla_percent: x.tong ? Math.round((x.tot / x.tong) * 10000) / 100 : null, uptime_percent: x.tong ? Math.round(((x.tot + x.canh_bao) / x.tong) * 10000) / 100 : null };
    });
    const tinh = (rows: typeof theo_ngay) => {
      const tong = rows.reduce((a, x) => ({ tong: a.tong + x.tong, tot: a.tot + x.tot, canh_bao: a.canh_bao + x.canh_bao, loi: a.loi + x.loi }), { tong: 0, tot: 0, canh_bao: 0, loi: 0 });
      const sla_percent = tong.tong ? Math.round((tong.tot / tong.tong) * 10000) / 100 : null;
      const uptime_percent = tong.tong ? Math.round(((tong.tot + tong.canh_bao) / tong.tong) * 10000) / 100 : null;
      return { ...tong, sla_percent, uptime_percent, dat_sla: sla_percent == null ? null : sla_percent >= muc_tieu.sla_muc_tieu_percent, dat_uptime: uptime_percent == null ? null : uptime_percent >= muc_tieu.uptime_muc_tieu_percent };
    };
    const tinh_ngan_sach = (tong: number, xau: number, muc_tieu_percent: number) => {
      const cho_phep_ty_le = Math.max(0.000001, 1 - muc_tieu_percent / 100);
      if (!tong) return { tong_mau: 0, mau_xau: 0, loi_cho_phep_percent: Math.round(cho_phep_ty_le * 100000) / 1000, da_tieu_thu_percent: null, con_lai_percent: null };
      const ty_le_xau = xau / tong;
      const da_tieu_thu = ty_le_xau / cho_phep_ty_le;
      return { tong_mau: tong, mau_xau: xau, loi_cho_phep_percent: Math.round(cho_phep_ty_le * 100000) / 1000, da_tieu_thu_percent: Math.round(da_tieu_thu * 10000) / 100, con_lai_percent: Math.round(Math.max(0, 1 - da_tieu_thu) * 10000) / 100 };
    };
    const rows30Budget = dsBudget.filter(x => x.ngay_tao.getTime() >= Date.now() - 30 * 86_400_000);
    const ngan_sach_loi = {
      sla: tinh_ngan_sach(rows30Budget.length, rows30Budget.filter(x => x.trang_thai !== "TOT").length, muc_tieu.sla_muc_tieu_percent),
      uptime: tinh_ngan_sach(rows30Budget.length, rows30Budget.filter(x => x.trang_thai === "LOI").length, muc_tieu.uptime_muc_tieu_percent)
    };
    const tinh_burn = (gio: number, kieu: "sla" | "uptime", muc_tieu_percent: number) => {
      const moc = Date.now() - gio * 3_600_000;
      const rows = dsBudget.filter(x => x.ngay_tao.getTime() >= moc);
      const tong = rows.length;
      if (!tong) return { cua_so_gio: gio, tong_mau: 0, mau_xau: 0, burn_rate: null as number | null, muc_do: "CHUA_CO_DU_LIEU" as const };
      const mau_xau = rows.filter(x => kieu === "sla" ? x.trang_thai !== "TOT" : x.trang_thai === "LOI").length;
      const cho_phep_ty_le = Math.max(0.000001, 1 - muc_tieu_percent / 100);
      const rate = (mau_xau / tong) / cho_phep_ty_le;
      const burn_rate = Math.round(rate * 100) / 100;
      const muc_do = burn_rate >= 6 ? "NGHIEM_TRONG" : burn_rate >= 2 ? "CAO" : burn_rate >= 1 ? "CANH_BAO" : "TOT";
      return { cua_so_gio: gio, tong_mau: tong, mau_xau, burn_rate, muc_do };
    };
    const tong_quan = tinh(theo_ngay);
    const bay_ngay = tinh(theo_ngay.slice(-7));
    const ba_muoi_ngay = tinh(theo_ngay.slice(-30));
    const chin_muoi_ngay = tinh(theo_ngay.slice(-90));
    const burn_rate = {
      sla: { mot_gio: tinh_burn(1, "sla", muc_tieu.sla_muc_tieu_percent), sau_gio: tinh_burn(6, "sla", muc_tieu.sla_muc_tieu_percent), hai_muoi_bon_gio: tinh_burn(24, "sla", muc_tieu.sla_muc_tieu_percent) },
      uptime: { mot_gio: tinh_burn(1, "uptime", muc_tieu.uptime_muc_tieu_percent), sau_gio: tinh_burn(6, "uptime", muc_tieu.uptime_muc_tieu_percent), hai_muoi_bon_gio: tinh_burn(24, "uptime", muc_tieu.uptime_muc_tieu_percent) }
    };
    const burn_rate_policy = nang_cao.burn_windows.map(policy => {
      const sla = tinh_burn(policy.gio, "sla", muc_tieu.sla_muc_tieu_percent);
      const uptime = tinh_burn(policy.gio, "uptime", muc_tieu.uptime_muc_tieu_percent);
      return {
        ...policy,
        sla: { ...sla, vuot_nguong: sla.burn_rate != null && sla.burn_rate >= policy.nguong, muc_do_policy: sla.burn_rate != null && sla.burn_rate >= policy.nguong ? policy.muc_do : "TOT" },
        uptime: { ...uptime, vuot_nguong: uptime.burn_rate != null && uptime.burn_rate >= policy.nguong, muc_do_policy: uptime.burn_rate != null && uptime.burn_rate >= policy.nguong ? policy.muc_do : "TOT" }
      };
    });
    const dich_vu = {
      api: dsBudget.map(x => ({ x, bad: x.trang_thai === "LOI" })),
      postgresql: dsBudget.map(x => ({ x, bad: chi_tiet(x.chi_tiet).database_ket_noi === false })),
      backup: dsBudget.map(x => { const age = chi_tiet(x.chi_tiet).backup_tuoi_gio; return { x, bad: age == null || (typeof age === "number" && age > alertConfig.backup_qua_han_gio) }; }),
      smtp: dsBudget.filter(x => chi_tiet(x.chi_tiet).smtp_bat === true).map(x => ({ x, bad: chi_tiet(x.chi_tiet).smtp_san_sang !== true }))
    };
    const ngan_sach_dich_vu = Object.fromEntries(Object.entries(dich_vu).map(([key, rows]) => {
      const target = Number(nang_cao.service_targets[key as keyof typeof nang_cao.service_targets]);
      const budget = tinh_ngan_sach(rows.length, rows.filter(r => r.bad).length, target);
      return [key, { muc_tieu_percent: target, ...budget }];
    }));
    const percentile = (values: number[], p: number) => {
      if (!values.length) return null;
      const sorted = [...values].sort((a, b) => a - b); const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
      return Math.round(sorted[idx] * 10) / 10;
    };
    const avg = (values: number[]) => values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;
    const mttaValues = incidents.filter(x => x.tiep_nhan_luc).map(x => Math.max(0, (x.tiep_nhan_luc!.getTime() - x.bat_dau.getTime()) / 60_000));
    const mttrValues = incidents.filter(x => x.khac_phuc_luc).map(x => Math.max(0, (x.khac_phuc_luc!.getTime() - x.bat_dau.getTime()) / 60_000));
    let incident_metrics = { tong_incident: incidents.length, dang_mo: incidents.filter(x => x.trang_thai_xu_ly !== "DA_KHAC_PHUC").length, da_khac_phuc: incidents.filter(x => x.trang_thai_xu_ly === "DA_KHAC_PHUC").length, mtta_phut: avg(mttaValues), mtta_p95_phut: percentile(mttaValues, 0.95), mttr_phut: avg(mttrValues), mttr_p95_phut: percentile(mttrValues, 0.95), nguon: "RUNTIME_FALLBACK" as string, refreshed_at: null as string | null };
    try {
      const cache = await this.db.opsMetricCache.findUnique({ where: { khoa: "incident_metrics" } });
      const c = cache?.gia_tri && typeof cache.gia_tri === "object" && !Array.isArray(cache.gia_tri) ? cache.gia_tri as Record<string, unknown> : null;
      if (cache && c) incident_metrics = { tong_incident: Number(c.tong_incident || 0), dang_mo: Number(c.dang_mo || 0), da_khac_phuc: Number(c.da_khac_phuc || 0), mtta_phut: c.mtta_phut == null ? null : Math.round(Number(c.mtta_phut) * 10) / 10, mtta_p95_phut: c.mtta_p95_phut == null ? null : Math.round(Number(c.mtta_p95_phut) * 10) / 10, mttr_phut: c.mttr_phut == null ? null : Math.round(Number(c.mttr_phut) * 10) / 10, mttr_p95_phut: c.mttr_p95_phut == null ? null : Math.round(Number(c.mttr_p95_phut) * 10) / 10, nguon: "SCHEDULER_CACHE_V3100", refreshed_at: cache.refreshed_at.toISOString() };
      else {
        const rows = await this.db.$queryRawUnsafe<Array<{ tong_incident: bigint; dang_mo: bigint; da_khac_phuc: bigint; mtta_phut: number | null; mtta_p95_phut: number | null; mttr_phut: number | null; mttr_p95_phut: number | null; refreshed_at: Date }>>('SELECT tong_incident, dang_mo, da_khac_phuc, mtta_phut, mtta_p95_phut, mttr_phut, mttr_p95_phut, refreshed_at FROM "ops_incident_metrics_v390" WHERE id = 1');
        if (rows[0]) incident_metrics = { tong_incident: Number(rows[0].tong_incident), dang_mo: Number(rows[0].dang_mo), da_khac_phuc: Number(rows[0].da_khac_phuc), mtta_phut: rows[0].mtta_phut == null ? null : Math.round(Number(rows[0].mtta_phut) * 10) / 10, mtta_p95_phut: rows[0].mtta_p95_phut == null ? null : Math.round(Number(rows[0].mtta_p95_phut) * 10) / 10, mttr_phut: rows[0].mttr_phut == null ? null : Math.round(Number(rows[0].mttr_phut) * 10) / 10, mttr_p95_phut: rows[0].mttr_p95_phut == null ? null : Math.round(Number(rows[0].mttr_p95_phut) * 10) / 10, nguon: "MATERIALIZED_VIEW_READONLY_V3100", refreshed_at: rows[0].refreshed_at.toISOString() };
      }
    } catch (error) { this.logger.debug(`Ops incident scheduler/cache fallback: ${error instanceof Error ? error.message : String(error)}`); }

    const maxWeightMs = Math.max(1, this.cau_hinh_slo_endpoint_runtime().chu_ky_phut * policyMaintenance.max_gap_multiplier) * 60_000;
    const endpoint_slo = {
      time_weighted: true,
      maintenance_aware: true,
      endpoints: nang_cao.endpoint_checks.map(endpoint => {
        const persisted = endpointPersistedRows.filter(row => row.endpoint_id === endpoint.id);
        const legacy = endpointRows.filter(row => String(chi_tiet(row.chi_tiet).endpoint_id || "") === endpoint.id);
        const samples = persisted.length
          ? persisted.map(row => ({ ngay_tao: row.ngay_tao, trang_thai: row.trang_thai, maintenance_active: row.maintenance_active, do_tre_ms: row.do_tre_ms, apdex_bucket: row.apdex_bucket, agent_id: row.agent_id, region: row.region, node_name: row.node_name }))
          : legacy.map(row => { const detail = chi_tiet(row.chi_tiet); return { ngay_tao: row.ngay_tao, trang_thai: row.trang_thai, maintenance_active: detail.maintenance_active === true, do_tre_ms: Number(detail.do_tre_ms), apdex_bucket: String(detail.apdex_bucket || ""), agent_id: String(detail.agent_id || "legacy"), region: String(detail.region || "legacy"), node_name: String(detail.node_name || "legacy") }; });
        let availability_ms = 0; let availability_ok_ms = 0; let budget_ms = 0; let budget_ok_ms = 0; let excluded_availability_ms = 0; let excluded_budget_ms = 0;
        const latencyRows: number[] = []; let latencyOk = 0; let apdexSatisfied = 0; let apdexTolerating = 0; let apdexFrustrated = 0;
        for (let i = 0; i < samples.length; i++) {
          const start = Math.max(tu.getTime(), samples[i].ngay_tao.getTime());
          const next = i + 1 < samples.length ? samples[i + 1].ngay_tao.getTime() : Date.now();
          const duration = Math.max(1000, Math.min(maxWeightMs, next - start));
          const maintenanceActive = samples[i].maintenance_active;
          if (maintenanceActive && policyMaintenance.exclude_from_availability) excluded_availability_ms += duration;
          else { availability_ms += duration; if (samples[i].trang_thai === "TOT") availability_ok_ms += duration; }
          if (maintenanceActive && policyMaintenance.exclude_from_error_budget) excluded_budget_ms += duration;
          else { budget_ms += duration; if (samples[i].trang_thai === "TOT") budget_ok_ms += duration; }
          if (!(maintenanceActive && policyMaintenance.exclude_from_availability)) {
            const latency = Number(samples[i].do_tre_ms); if (Number.isFinite(latency)) { latencyRows.push(latency); if (latency <= endpoint.latency_target_ms) latencyOk += 1; }
            const bucket = samples[i].apdex_bucket || (!Number.isFinite(latency) || samples[i].trang_thai !== "TOT" || latency > endpoint.latency_target_ms * 4 ? "FRUSTRATED" : latency <= endpoint.latency_target_ms ? "SATISFIED" : "TOLERATING");
            if (bucket === "SATISFIED") apdexSatisfied += 1; else if (bucket === "TOLERATING") apdexTolerating += 1; else apdexFrustrated += 1;
          }
        }
        const availability_percent = availability_ms ? Math.round((availability_ok_ms / availability_ms) * 100000) / 1000 : null;
        const allowed = budget_ms * Math.max(0.000001, 1 - endpoint.muc_tieu_percent / 100);
        const badBudget = Math.max(0, budget_ms - budget_ok_ms);
        const consumed = budget_ms ? badBudget / allowed : null;
        const histogramBuckets = [100, 250, 500, 1000, 3000];
        const histogram: Record<string, number> = {}; let prev = 0;
        for (const bucket of histogramBuckets) { const count = latencyRows.filter(x => x > prev && x <= bucket).length; histogram[`${prev + (prev ? 1 : 0)}-${bucket}ms`] = count; prev = bucket; }
        histogram[">3000ms"] = latencyRows.filter(x => x > 3000).length;
        const summarizeGroups = (keyFn: (sample: typeof samples[number]) => string) => {
          const groups = new Map<string, typeof samples>();
          for (const sample of samples) { const key = keyFn(sample); const list = groups.get(key) || []; list.push(sample); groups.set(key, list); }
          return [...groups.entries()].map(([key, rows]) => {
            const lat = rows.map(x => Number(x.do_tre_ms)).filter(Number.isFinite);
            const good = rows.filter(x => x.trang_thai === "TOT").length;
            const sat = rows.filter(x => x.apdex_bucket === "SATISFIED").length;
            const tol = rows.filter(x => x.apdex_bucket === "TOLERATING").length;
            return { key, samples: rows.length, availability_percent: rows.length ? Math.round((good / rows.length) * 10000) / 100 : null, p95_ms: percentile(lat, 0.95), apdex: rows.length ? Math.round(((sat + tol * 0.5) / rows.length) * 1000) / 1000 : null };
          }).sort((a, b) => a.key.localeCompare(b.key));
        };
        const by_region = summarizeGroups(sample => sample.region || "unknown");
        const by_node = summarizeGroups(sample => `${sample.region || "unknown"}/${sample.node_name || sample.agent_id || "unknown"}`);
        return {
          ...endpoint,
          tong_mau: samples.length,
          persistent_samples: persisted.length,
          probe_agents: [...new Set(samples.map(x => `${x.agent_id}@${x.region}/${x.node_name}`))],
          by_region,
          by_node,
          tong_thoi_gian_phut: Math.round(availability_ms / 6000) / 10,
          downtime_phut: Math.round(Math.max(0, availability_ms - availability_ok_ms) / 6000) / 10,
          budget_downtime_phut: Math.round(badBudget / 6000) / 10,
          excluded_maintenance_phut: { availability: Math.round(excluded_availability_ms / 6000) / 10, error_budget: Math.round(excluded_budget_ms / 6000) / 10 },
          availability_percent,
          dat_muc_tieu: availability_percent == null ? null : availability_percent >= endpoint.muc_tieu_percent,
          error_budget_da_tieu_percent: consumed == null ? null : Math.round(consumed * 10000) / 100,
          error_budget_con_lai_percent: consumed == null ? null : Math.round(Math.max(0, 1 - consumed) * 10000) / 100,
          latency: { samples: latencyRows.length, sli_percent: latencyRows.length ? Math.round((latencyOk / latencyRows.length) * 10000) / 100 : null, avg_ms: avg(latencyRows), p50_ms: percentile(latencyRows, 0.5), p95_ms: percentile(latencyRows, 0.95), p99_ms: percentile(latencyRows, 0.99), target_ms: endpoint.latency_target_ms, dat_p95: latencyRows.length ? (percentile(latencyRows, 0.95) ?? Infinity) <= endpoint.latency_target_ms : null, histogram, apdex: { score: latencyRows.length ? Math.round(((apdexSatisfied + apdexTolerating * 0.5) / latencyRows.length) * 1000) / 1000 : null, satisfied: apdexSatisfied, tolerating: apdexTolerating, frustrated: apdexFrustrated } }
        };
      })
    };
    const burn_rate_series = theo_ngay.map(row => {
      const burn = (bad: number, total: number, target: number) => total ? Math.round(((bad / total) / Math.max(0.000001, 1 - target / 100)) * 100) / 100 : null;
      return { ngay: row.ngay, sla_burn_rate: burn(row.tong - row.tot, row.tong, muc_tieu.sla_muc_tieu_percent), uptime_burn_rate: burn(row.loi, row.tong, muc_tieu.uptime_muc_tieu_percent) };
    });
    const maintenance_annotations: Array<{ ngay: string; id: string; ten: string; lap_lai: string }> = [];
    for (const window of maintenanceConfig.du_lieu) {
      if (!window.bat) continue;
      const start = new Date(window.bat_dau);
      if (window.lap_lai === "KHONG") { if (start >= tu && start <= new Date()) maintenance_annotations.push({ ngay: start.toISOString().slice(0, 10), id: window.id, ten: window.ten, lap_lai: window.lap_lai }); continue; }
      const step = window.lap_lai === "HANG_NGAY" ? 86_400_000 : 7 * 86_400_000;
      let t = start.getTime(); while (t < tu.getTime()) t += step;
      for (let guard = 0; t <= Date.now() && guard < 200; guard++, t += step) maintenance_annotations.push({ ngay: new Date(t).toISOString().slice(0, 10), id: window.id, ten: window.ten, lap_lai: window.lap_lai });
    }
    const canh_bao: string[] = [];
    if (muc_tieu.canh_bao_xu_huong) {
      if (bay_ngay.dat_sla === false) canh_bao.push(`SLA 7 ngày ${bay_ngay.sla_percent}% dưới mục tiêu ${muc_tieu.sla_muc_tieu_percent}%`);
      if (bay_ngay.dat_uptime === false) canh_bao.push(`Uptime 7 ngày ${bay_ngay.uptime_percent}% dưới mục tiêu ${muc_tieu.uptime_muc_tieu_percent}%`);
      if (ba_muoi_ngay.dat_sla === false) canh_bao.push(`SLA 30 ngày ${ba_muoi_ngay.sla_percent}% dưới mục tiêu ${muc_tieu.sla_muc_tieu_percent}%`);
      if (ba_muoi_ngay.dat_uptime === false) canh_bao.push(`Uptime 30 ngày ${ba_muoi_ngay.uptime_percent}% dưới mục tiêu ${muc_tieu.uptime_muc_tieu_percent}%`);
      for (const item of burn_rate_policy) {
        if (item.sla.vuot_nguong) canh_bao.push(`Burn-rate SLA ${item.gio}h ${item.sla.burn_rate}x vượt policy ${item.nguong}x`);
        if (item.uptime.vuot_nguong) canh_bao.push(`Burn-rate Uptime ${item.gio}h ${item.uptime.burn_rate}x vượt policy ${item.nguong}x`);
      }
      for (const endpoint of endpoint_slo.endpoints) if (endpoint.latency.dat_p95 === false) canh_bao.push(`Latency P95 ${endpoint.ten} ${endpoint.latency.p95_ms}ms vượt mục tiêu ${endpoint.latency.target_ms}ms`);
    }
    return {
      so_ngay, tu_ngay: tu.toISOString(), tao_luc: new Date().toISOString(),
      dinh_nghia: { sla: "Tỷ lệ health snapshot TỐT, có thể loại maintenance theo policy", uptime: "Tỷ lệ health snapshot không LỖI, có thể loại maintenance theo policy", error_budget: "Ngân sách lỗi 30 ngày theo mục tiêu SLO; burn-rate dùng tập mẫu error-budget sau maintenance policy", endpoint_slo: "Availability time-weighted từ HTTP probe; latency SLI/P50/P95/P99 + histogram; gap được cap theo max_gap_multiplier" },
      muc_tieu: { sla_muc_tieu_percent: muc_tieu.sla_muc_tieu_percent, uptime_muc_tieu_percent: muc_tieu.uptime_muc_tieu_percent, canh_bao_xu_huong: muc_tieu.canh_bao_xu_huong, nguon_cau_hinh: muc_tieu.nguon_cau_hinh },
      cau_hinh_nang_cao: nang_cao,
      maintenance_policy_applied: { ...policyMaintenance, ...maintenance_excluded },
      tong_quan,
      xu_huong: { bay_ngay, ba_muoi_ngay, chin_muoi_ngay },
      comparison: { bay_ngay, ba_muoi_ngay, chin_muoi_ngay },
      ngan_sach_loi,
      ngan_sach_dich_vu,
      burn_rate,
      burn_rate_policy,
      burn_rate_series,
      endpoint_slo,
      maintenance_annotations,
      incident_metrics,
      canh_bao,
      theo_ngay
    };
  }

  async kiem_tra_quyen_ops(actor: NguoiDungXacThuc, canWrite = false) {
    if (actor.vai_tro === "ADMIN") return { duoc_phep: true, admin: true, vai_tro_ops: "SERVICE_OWNER", dich_vu: ["*"] };
    const assignments = await this.db.opsPhanCong.findMany({ where: { nguoi_dung_id: actor.id, dang_hoat_dong: true }, orderBy: [{ cap_escalation: "asc" }, { dich_vu: "asc" }] });
    if (!assignments.length) throw new ForbiddenException("Tài khoản chưa được phân quyền Ops/on-call");
    if (canWrite && !assignments.some(x => ["ON_CALL", "SERVICE_OWNER"].includes(x.vai_tro_ops))) throw new ForbiddenException("Vai trò Ops hiện tại chỉ được xem");
    const rank = { OPS_VIEWER: 1, ON_CALL: 2, SERVICE_OWNER: 3 } as const;
    const best = assignments.reduce((a, b) => (rank[b.vai_tro_ops as keyof typeof rank] || 0) > (rank[a.vai_tro_ops as keyof typeof rank] || 0) ? b : a);
    return { duoc_phep: true, admin: false, vai_tro_ops: best.vai_tro_ops, dich_vu: [...new Set(assignments.map(x => x.dich_vu))], cap_escalation: Math.min(...assignments.map(x => x.cap_escalation)) };
  }

  async danh_sach_ops_phan_cong() {
    const ds = await this.db.opsPhanCong.findMany({ include: { nguoi_dung: { select: { id: true, ho_ten: true, thu_dien_tu: true, vai_tro: true, da_kich_hoat: true } } }, orderBy: [{ dich_vu: "asc" }, { cap_escalation: "asc" }, { ngay_tao: "asc" }] });
    return { du_lieu: ds, roles: ["OPS_VIEWER", "ON_CALL", "SERVICE_OWNER"], services: ["api", "postgresql", "backup", "smtp", "webhook", "storefront"] };
  }

  async tao_ops_phan_cong(actor: NguoiDungXacThuc, dto: { nguoi_dung_id: string; dich_vu: string; vai_tro_ops: "OPS_VIEWER" | "ON_CALL" | "SERVICE_OWNER"; cap_escalation?: number; dang_hoat_dong?: boolean }) {
    const user = await this.db.nguoiDung.findUnique({ where: { id: dto.nguoi_dung_id }, select: { id: true, ho_ten: true, vai_tro: true, da_kich_hoat: true } });
    if (!user || !user.da_kich_hoat) throw new NotFoundException("Không tìm thấy tài khoản hoạt động để phân quyền Ops");
    if (user.vai_tro === "KHACH_HANG") throw new BadRequestException("Không thể gán quyền Ops cho tài khoản khách hàng");
    const dich_vu = dto.dich_vu.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(dich_vu)) throw new BadRequestException("Mã dịch vụ Ops không hợp lệ");
    const exists = await this.db.opsPhanCong.findFirst({ where: { nguoi_dung_id: dto.nguoi_dung_id, dich_vu, vai_tro_ops: dto.vai_tro_ops } });
    const data = { cap_escalation: dto.cap_escalation ?? 1, dang_hoat_dong: dto.dang_hoat_dong ?? true };
    const item = exists ? await this.db.opsPhanCong.update({ where: { id: exists.id }, data }) : await this.db.opsPhanCong.create({ data: { nguoi_dung_id: dto.nguoi_dung_id, dich_vu, vai_tro_ops: dto.vai_tro_ops, ...data } });
    await this.ghi_lich_su_van_hanh("OPS_RBAC", "DA_CAP_NHAT", `Admin ${actor.ho_ten} phân quyền ${dto.vai_tro_ops} cho ${user.ho_ten}`, { assignment_id: item.id, nguoi_dung_id: user.id, dich_vu, vai_tro_ops: dto.vai_tro_ops, cap_escalation: item.cap_escalation, dang_hoat_dong: item.dang_hoat_dong });
    return item;
  }

  async cap_nhat_ops_phan_cong(actor: NguoiDungXacThuc, id: string, dto: { cap_escalation?: number; dang_hoat_dong?: boolean }) {
    const item = await this.db.opsPhanCong.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Không tìm thấy phân quyền Ops");
    const updated = await this.db.opsPhanCong.update({ where: { id }, data: { ...(dto.cap_escalation == null ? {} : { cap_escalation: dto.cap_escalation }), ...(dto.dang_hoat_dong == null ? {} : { dang_hoat_dong: dto.dang_hoat_dong }) } });
    await this.ghi_lich_su_van_hanh("OPS_RBAC", "DA_CAP_NHAT", `Admin ${actor.ho_ten} cập nhật phân quyền Ops`, { assignment_id: id, truoc: item, sau: updated });
    return updated;
  }

  async xoa_ops_phan_cong(actor: NguoiDungXacThuc, id: string) {
    const item = await this.db.opsPhanCong.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Không tìm thấy phân quyền Ops");
    await this.db.opsPhanCong.delete({ where: { id } });
    await this.ghi_lich_su_van_hanh("OPS_RBAC", "DA_XOA", `Admin ${actor.ho_ten} xóa phân quyền Ops`, { assignment_id: id, nguoi_dung_id: item.nguoi_dung_id, dich_vu: item.dich_vu, vai_tro_ops: item.vai_tro_ops });
    return { da_xoa: true, id };
  }

  async ops_dashboard_readonly(actor: NguoiDungXacThuc, soNgayRaw?: string) {
    const access = await this.kiem_tra_quyen_ops(actor, false);
    const [sla, incidents, runtime] = await Promise.all([this.thong_ke_sla_van_hanh(soNgayRaw), this.danh_sach_su_co_van_hanh("100"), this.trang_thai_ops_v3130()]);
    return { access, sla, incidents, runtime };
  }

  async ops_incident_timeline_readonly(actor: NguoiDungXacThuc, chuKy: string, q?: string, cursor?: string, kichThuoc?: string) {
    await this.kiem_tra_quyen_ops(actor, false);
    return this.timeline_su_co_van_hanh(chuKy, q, cursor, kichThuoc);
  }

  async ops_incident_tiep_nhan(actor: NguoiDungXacThuc, chuKy: string, dto: CapNhatSuCoVanHanhDto) {
    await this.kiem_tra_quyen_ops(actor, true);
    return this.tiep_nhan_su_co_van_hanh(actor, chuKy, dto);
  }

  async ops_incident_khac_phuc(actor: NguoiDungXacThuc, chuKy: string, dto: CapNhatSuCoVanHanhDto) {
    await this.kiem_tra_quyen_ops(actor, true);
    return this.khac_phuc_su_co_van_hanh(actor, chuKy, dto);
  }

  async thong_ke_van_hanh() {
    const tinh = async (so_ngay: number) => {
      const tu = new Date(Date.now() - (so_ngay - 1) * 86_400_000);
      tu.setUTCHours(0, 0, 0, 0);
      const [health, backup, restore, alert] = await this.db.$transaction([
        this.db.lichSuVanHanh.groupBy({ by: ["trang_thai"], where: { loai: "HEALTH", ngay_tao: { gte: tu } }, _count: { _all: true } }),
        this.db.lichSuVanHanh.groupBy({ by: ["trang_thai"], where: { loai: "BACKUP", ngay_tao: { gte: tu } }, _count: { _all: true } }),
        this.db.lichSuVanHanh.groupBy({ by: ["trang_thai"], where: { loai: "RESTORE", ngay_tao: { gte: tu } }, _count: { _all: true } }),
        this.db.lichSuVanHanh.count({ where: { loai: "ALERT", ngay_tao: { gte: tu } } })
      ]);
      const dem = (rows: Array<{ trang_thai: string; _count: { _all: number } }>, status: string) => rows.find(x => x.trang_thai === status)?._count._all ?? 0;
      const healthTong = health.reduce((t, x) => t + x._count._all, 0);
      const backupTong = backup.reduce((t, x) => t + x._count._all, 0);
      const restoreTong = restore.reduce((t, x) => t + x._count._all, 0);
      const healthTot = dem(health, "TOT");
      const backupOk = dem(backup, "THANH_CONG");
      const restoreOk = dem(restore, "THANH_CONG");
      return {
        so_ngay,
        tu_ngay: tu.toISOString(),
        health: { tong: healthTong, tot: healthTot, canh_bao: dem(health, "CANH_BAO"), loi: dem(health, "LOI"), ty_le_tot: healthTong ? Math.round((healthTot / healthTong) * 1000) / 10 : null },
        backup: { tong: backupTong, thanh_cong: backupOk, that_bai: dem(backup, "THAT_BAI"), ty_le_thanh_cong: backupTong ? Math.round((backupOk / backupTong) * 1000) / 10 : null },
        restore: { tong: restoreTong, thanh_cong: restoreOk, that_bai: dem(restore, "THAT_BAI"), ty_le_thanh_cong: restoreTong ? Math.round((restoreOk / restoreTong) * 1000) / 10 : null },
        canh_bao_email: alert
      };
    };
    const [bay_ngay, ba_muoi_ngay] = await Promise.all([tinh(7), tinh(30)]);
    return { bay_ngay, ba_muoi_ngay, tao_luc: new Date().toISOString() };
  }

  async xuat_excel_lich_su_van_hanh(loai?: string, trang_thai?: string, tu_ngay?: string, den_ngay?: string) {
    const bat_dau = tu_ngay ? new Date(`${tu_ngay}T00:00:00.000Z`) : undefined;
    const ket_thuc = den_ngay ? new Date(`${den_ngay}T23:59:59.999Z`) : undefined;
    const where = {
      ...(loai?.trim() ? { loai: loai.trim().toUpperCase() } : {}),
      ...(trang_thai?.trim() ? { trang_thai: trang_thai.trim().toUpperCase() } : {}),
      ...((bat_dau || ket_thuc) ? { ngay_tao: { ...(bat_dau ? { gte: bat_dau } : {}), ...(ket_thuc ? { lte: ket_thuc } : {}) } } : {})
    };
    const ds = await this.db.lichSuVanHanh.findMany({ where, orderBy: { ngay_tao: "desc" }, take: 5000 });
    const rows: unknown[][] = [["Thời gian", "Loại", "Trạng thái", "Mô tả", "Bắt đầu", "Kết thúc", "Chi tiết"]];
    for (const x of ds) rows.push([x.ngay_tao.toISOString(), x.loai, x.trang_thai, x.mo_ta || "", x.ngay_bat_dau?.toISOString() || "", x.ngay_ket_thuc?.toISOString() || "", JSON.stringify(x.chi_tiet)]);
    const buffer = this.tao_xlsx(rows, "Lịch sử vận hành");
    return { ten_file: `lich-su-van-hanh-${new Date().toISOString().slice(0, 10)}.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
  }

  private tao_diff(truoc: Record<string, unknown>, sau: Record<string, unknown>): Prisma.InputJsonObject {
    const thay_doi: Record<string, Prisma.InputJsonValue | null> = {};
    for (const key of new Set([...Object.keys(truoc), ...Object.keys(sau)])) {
      const a = truoc[key] ?? null, b = sau[key] ?? null;
      if (JSON.stringify(a) !== JSON.stringify(b)) thay_doi[key] = this.chuan_hoa_json_object({ truoc: a, sau: b });
    }
    return thay_doi;
  }

  private phan_loai_bien_dong_kho(ton_cu: number, ton_moi: number) {
    if (ton_moi > ton_cu) return "NHAP_KHO";
    if (ton_moi < ton_cu) return "XUAT_KHO";
    return "DIEU_CHINH";
  }

  async lay_cau_hinh_kho() {
    const item = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "KHO" } });
    const raw = item?.gia_tri;
    const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const n = Number(data.nguong_sap_het);
    const nguong_sap_het = Number.isInteger(n) && n >= 1 && n <= 999 ? n : 5;
    return { nguong_sap_het, ngay_cap_nhat: item?.ngay_cap_nhat ?? null };
  }

  async cap_nhat_cau_hinh_kho(actor: NguoiDungXacThuc, dto: CapNhatCauHinhKhoDto) {
    const item = await this.db.cauHinhHeThong.upsert({
      where: { khoa: "KHO" },
      create: { khoa: "KHO", gia_tri: { nguong_sap_het: dto.nguong_sap_het }, nguoi_cap_nhat_id: actor.id },
      update: { gia_tri: { nguong_sap_het: dto.nguong_sap_het }, nguoi_cap_nhat_id: actor.id }
    });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_CAU_HINH_KHO", nguoi_dung_id: actor.id, chi_tiet: { nguong_sap_het: dto.nguong_sap_het } } });
    return { nguong_sap_het: dto.nguong_sap_het, ngay_cap_nhat: item.ngay_cap_nhat };
  }

  async danh_sach_nha_cung_cap(tim_kiem?: string, dang_hoat_dong?: string) {
    const q = tim_kiem?.trim() || "";
    const active = dang_hoat_dong === "true" ? true : dang_hoat_dong === "false" ? false : undefined;
    const ds = await this.db.nhaCungCap.findMany({
      where: {
        ...(active === undefined ? {} : { dang_hoat_dong: active }),
        ...(q ? { OR: [
          { ma_nha_cung_cap: { contains: q, mode: "insensitive" as const } },
          { ten_nha_cung_cap: { contains: q, mode: "insensitive" as const } },
          { nguoi_lien_he: { contains: q, mode: "insensitive" as const } },
          { so_dien_thoai: { contains: q, mode: "insensitive" as const } },
          { thu_dien_tu: { contains: q, mode: "insensitive" as const } }
        ] } : {})
      },
      include: { _count: { select: { phieu_nhap: true } } },
      orderBy: [{ dang_hoat_dong: "desc" }, { ten_nha_cung_cap: "asc" }],
      take: 500
    });
    return ds.map(x => ({ ...x, so_phieu_nhap: x._count.phieu_nhap, _count: undefined }));
  }

  async tao_nha_cung_cap(actor: NguoiDungXacThuc, dto: TaoNhaCungCapDto) {
    const ma = dto.ma_nha_cung_cap.trim().toUpperCase();
    const trung = await this.db.nhaCungCap.findUnique({ where: { ma_nha_cung_cap: ma }, select: { id: true } });
    if (trung) throw new ConflictException("Mã nhà cung cấp đã tồn tại");
    const item = await this.db.nhaCungCap.create({ data: {
      ma_nha_cung_cap: ma,
      ten_nha_cung_cap: dto.ten_nha_cung_cap.trim(),
      nguoi_lien_he: dto.nguoi_lien_he?.trim() || null,
      so_dien_thoai: dto.so_dien_thoai?.trim() || null,
      thu_dien_tu: dto.thu_dien_tu?.trim().toLowerCase() || null,
      dia_chi: dto.dia_chi?.trim() || null,
      ghi_chu: dto.ghi_chu?.trim() || null,
      dang_hoat_dong: dto.dang_hoat_dong ?? true
    } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_NHA_CUNG_CAP", nguoi_dung_id: actor.id, chi_tiet: { nha_cung_cap_id: item.id, ma_nha_cung_cap: item.ma_nha_cung_cap, ten_nha_cung_cap: item.ten_nha_cung_cap } } });
    return { ...item, so_phieu_nhap: 0 };
  }

  async cap_nhat_nha_cung_cap(actor: NguoiDungXacThuc, id: string, dto: CapNhatNhaCungCapDto) {
    const hien_tai = await this.db.nhaCungCap.findUnique({ where: { id } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy nhà cung cấp");
    const data = {
      ...(dto.ten_nha_cung_cap !== undefined ? { ten_nha_cung_cap: dto.ten_nha_cung_cap.trim() } : {}),
      ...(dto.nguoi_lien_he !== undefined ? { nguoi_lien_he: dto.nguoi_lien_he.trim() || null } : {}),
      ...(dto.so_dien_thoai !== undefined ? { so_dien_thoai: dto.so_dien_thoai.trim() || null } : {}),
      ...(dto.thu_dien_tu !== undefined ? { thu_dien_tu: dto.thu_dien_tu.trim().toLowerCase() || null } : {}),
      ...(dto.dia_chi !== undefined ? { dia_chi: dto.dia_chi.trim() || null } : {}),
      ...(dto.ghi_chu !== undefined ? { ghi_chu: dto.ghi_chu.trim() || null } : {}),
      ...(dto.dang_hoat_dong !== undefined ? { dang_hoat_dong: dto.dang_hoat_dong } : {})
    };
    if (!Object.keys(data).length) throw new BadRequestException("Không có dữ liệu nhà cung cấp để cập nhật");
    const item = await this.db.nhaCungCap.update({ where: { id }, data, include: { _count: { select: { phieu_nhap: true } } } });
    const truoc = { ten_nha_cung_cap: hien_tai.ten_nha_cung_cap, nguoi_lien_he: hien_tai.nguoi_lien_he, so_dien_thoai: hien_tai.so_dien_thoai, thu_dien_tu: hien_tai.thu_dien_tu, dia_chi: hien_tai.dia_chi, ghi_chu: hien_tai.ghi_chu, dang_hoat_dong: hien_tai.dang_hoat_dong };
    const sau = { ten_nha_cung_cap: item.ten_nha_cung_cap, nguoi_lien_he: item.nguoi_lien_he, so_dien_thoai: item.so_dien_thoai, thu_dien_tu: item.thu_dien_tu, dia_chi: item.dia_chi, ghi_chu: item.ghi_chu, dang_hoat_dong: item.dang_hoat_dong };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_NHA_CUNG_CAP", nguoi_dung_id: actor.id, chi_tiet: { nha_cung_cap_id: id, ma_nha_cung_cap: hien_tai.ma_nha_cung_cap, truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } });
    return { ...item, so_phieu_nhap: item._count.phieu_nhap, _count: undefined };
  }

  async xoa_nha_cung_cap(actor: NguoiDungXacThuc, id: string) {
    const item = await this.db.nhaCungCap.findUnique({ where: { id }, include: { _count: { select: { phieu_nhap: true } } } });
    if (!item) throw new NotFoundException("Không tìm thấy nhà cung cấp");
    if (item._count.phieu_nhap > 0) throw new ConflictException(`Nhà cung cấp đang được ${item._count.phieu_nhap} phiếu nhập sử dụng. Hãy chuyển sang trạng thái ngừng hoạt động thay vì xóa.`);
    await this.db.nhaCungCap.delete({ where: { id } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_NHA_CUNG_CAP", nguoi_dung_id: actor.id, chi_tiet: { nha_cung_cap_id: id, ma_nha_cung_cap: item.ma_nha_cung_cap, ten_nha_cung_cap: item.ten_nha_cung_cap } } });
    return { id, thong_bao: `Đã xóa nhà cung cấp ${item.ma_nha_cung_cap}` };
  }

  private giai_ma_xml(value: string) {
    return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(Number.parseInt(n, 16)));
  }

  private tach_csv(text: string) {
    const rows: string[][] = [];
    let row: string[] = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === "," || c === ";") { row.push(cell.trim()); cell = ""; }
      else if (c === "\n") { row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
      else if (c !== "\r") cell += c;
    }
    row.push(cell.trim());
    if (row.some(x => x.length)) rows.push(row);
    return rows;
  }

  private doc_zip_entries(buffer: Buffer) {
    const entries = new Map<string, Buffer>();
    let eocd = -1;
    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
      if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new BadRequestException("File Excel không có cấu trúc ZIP/XLSX hợp lệ");
    const count = buffer.readUInt16LE(eocd + 10);
    let offset = buffer.readUInt32LE(eocd + 16);
    for (let i = 0; i < count; i++) {
      if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) throw new BadRequestException("File Excel bị lỗi bảng thư mục ZIP");
      const method = buffer.readUInt16LE(offset + 10);
      const compressed = buffer.readUInt32LE(offset + 20);
      const nameLen = buffer.readUInt16LE(offset + 28);
      const extraLen = buffer.readUInt16LE(offset + 30);
      const commentLen = buffer.readUInt16LE(offset + 32);
      const localOffset = buffer.readUInt32LE(offset + 42);
      const name = buffer.subarray(offset + 46, offset + 46 + nameLen).toString("utf8");
      if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new BadRequestException("File Excel bị lỗi local ZIP header");
      const localNameLen = buffer.readUInt16LE(localOffset + 26);
      const localExtraLen = buffer.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLen + localExtraLen;
      const payload = buffer.subarray(start, start + compressed);
      const data = method === 0 ? Buffer.from(payload) : method === 8 ? inflateRawSync(payload) : null;
      if (data) entries.set(name, data);
      offset += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  private cot_excel(ref: string) {
    const letters = (ref.match(/[A-Z]+/i)?.[0] || "A").toUpperCase();
    let n = 0;
    for (const c of letters) n = n * 26 + c.charCodeAt(0) - 64;
    return Math.max(0, n - 1);
  }

  private tach_xlsx(buffer: Buffer) {
    const zip = this.doc_zip_entries(buffer);
    const sheetName = [...zip.keys()].filter(x => /^xl\/worksheets\/sheet\d+\.xml$/i.test(x)).sort((a, b) => Number(/sheet(\d+)/i.exec(a)?.[1] || 0) - Number(/sheet(\d+)/i.exec(b)?.[1] || 0))[0];
    const sheet = sheetName ? zip.get(sheetName) : undefined;
    if (!sheet) throw new BadRequestException("Excel phải có ít nhất một worksheet để nhập kho");
    const sharedXml = zip.get("xl/sharedStrings.xml")?.toString("utf8") || "";
    const shared: string[] = [];
    for (const match of sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
      const parts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(x => this.giai_ma_xml(x[1]));
      shared.push(parts.join(""));
    }
    const rows: string[][] = [];
    const xml = sheet.toString("utf8");
    for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const row: string[] = [];
      for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cellMatch[1], body = cellMatch[2];
        const ref = /\br="([A-Z]+\d+)"/i.exec(attrs)?.[1] || `A${rows.length + 1}`;
        const type = /\bt="([^"]+)"/.exec(attrs)?.[1] || "";
        const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(body)?.[1] ?? "";
        const value = type === "s" ? (shared[Number(raw)] ?? "") : this.giai_ma_xml(raw);
        row[this.cot_excel(ref)] = value.trim();
      }
      if (row.some(x => (x || "").trim())) rows.push(row.map(x => x || ""));
    }
    return rows;
  }

  private chuan_hoa_tieu_de(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d").replaceAll("Đ", "D").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  private dong_tu_bang(rows: string[][]) {
    if (rows.length < 2) throw new BadRequestException("File nhập kho phải có hàng tiêu đề và ít nhất 1 dòng dữ liệu");
    const header = rows[0].map(x => this.chuan_hoa_tieu_de(x));
    const tim = (...names: string[]) => header.findIndex(x => names.includes(x));
    const iMa = tim("ma_bien_the", "bien_the", "sku", "ma_sku");
    const iSo = tim("so_luong_nhap", "so_luong", "sl_nhap", "quantity", "qty");
    const iLyDo = tim("ly_do", "ghi_chu", "note", "reason");
    if (iMa < 0 || iSo < 0) throw new BadRequestException("File phải có cột ma_bien_the và so_luong_nhap");
    const dataRows = rows.slice(1).filter(r => r.some(x => (x || "").trim()));
    if (dataRows.length > 500) throw new BadRequestException("Mỗi file chỉ được nhập tối đa 500 dòng dữ liệu");
    return dataRows.map((r, index) => ({
      dong: index + 2,
      ma_bien_the: (r[iMa] || "").trim().toUpperCase(),
      so_luong_nhap: Number((r[iSo] || "").replace(/\s/g, "")),
      ly_do: iLyDo >= 0 ? (r[iLyDo] || "").trim().slice(0, 300) : ""
    }));
  }

  async kiem_tra_tep_nhap_kho(dto: KiemTraTepNhapKhoDto) {
    const ten = dto.ten_file.trim();
    const ext = ten.toLowerCase().split(".").pop();
    if (!ext || !["csv", "xlsx"].includes(ext)) throw new BadRequestException("Chỉ hỗ trợ file .csv hoặc .xlsx");
    let buffer: Buffer;
    try { buffer = Buffer.from(dto.du_lieu_base64.replace(/^data:[^,]+,/, ""), "base64"); }
    catch { throw new BadRequestException("Dữ liệu file không hợp lệ"); }
    if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw new BadRequestException("File nhập kho phải nhỏ hơn hoặc bằng 2 MB");
    const rows = ext === "csv" ? this.tach_csv(buffer.toString("utf8").replace(/^\uFEFF/, "")) : this.tach_xlsx(buffer);
    const dong = this.dong_tu_bang(rows);
    const ma = [...new Set(dong.map(x => x.ma_bien_the).filter(Boolean))];
    const bienThe = await this.db.bienTheSanPham.findMany({ where: { ma_bien_the: { in: ma } }, include: { san_pham: { select: { ma_san_pham: true, ten_san_pham: true } } } });
    const map = new Map(bienThe.map(x => [x.ma_bien_the.toUpperCase(), x]));
    const seen = new Set<string>();
    const ket_qua = dong.map(item => {
      const loi: string[] = [];
      if (!item.ma_bien_the) loi.push("Thiếu mã biến thể");
      if (!Number.isInteger(item.so_luong_nhap) || item.so_luong_nhap < 1 || item.so_luong_nhap > 1000000) loi.push("Số lượng nhập phải là số nguyên 1–1.000.000");
      if (item.ma_bien_the && seen.has(item.ma_bien_the)) loi.push("Mã biến thể bị lặp trong file");
      if (item.ma_bien_the) seen.add(item.ma_bien_the);
      const bt = map.get(item.ma_bien_the);
      if (item.ma_bien_the && !bt) loi.push("Không tìm thấy biến thể trong hệ thống");
      return { ...item, hop_le: loi.length === 0, loi, bien_the_id: bt?.id || null, ma_san_pham: bt?.san_pham.ma_san_pham || "", ten_san_pham: bt?.san_pham.ten_san_pham || "", ton_hien_tai: bt?.so_luong_ton ?? null, ton_sau_nhap: bt ? bt.so_luong_ton + item.so_luong_nhap : null };
    });
    return { ten_file: ten, tong_dong: ket_qua.length, hop_le: ket_qua.filter(x => x.hop_le).length, khong_hop_le: ket_qua.filter(x => !x.hop_le).length, dong: ket_qua };
  }

  private tao_ma_phieu_nhap() {
    const vn = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    return `PNK-${vn}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  async nhap_kho_theo_lo(actor: NguoiDungXacThuc, dto: NhapKhoLoDto) {
    const nha_cung_cap_ref = dto.nha_cung_cap_id ? await this.db.nhaCungCap.findUnique({ where: { id: dto.nha_cung_cap_id } }) : null;
    if (dto.nha_cung_cap_id && !nha_cung_cap_ref) throw new BadRequestException("Nhà cung cấp không tồn tại");
    if (nha_cung_cap_ref && !nha_cung_cap_ref.dang_hoat_dong) throw new BadRequestException("Nhà cung cấp đang ngừng hoạt động");
    const ten_nha_cung_cap = nha_cung_cap_ref?.ten_nha_cung_cap || dto.nha_cung_cap?.trim() || null;
    const seen = new Set<string>();
    const dong = dto.dong.map((x, index) => ({ ...x, ma_bien_the: x.ma_bien_the.trim().toUpperCase(), ly_do: x.ly_do?.trim() || "Nhập kho theo lô", stt: index + 1 }));
    for (const item of dong) {
      if (seen.has(item.ma_bien_the)) throw new BadRequestException(`Mã biến thể ${item.ma_bien_the} bị lặp trong danh sách nhập`);
      seen.add(item.ma_bien_the);
    }
    const bienThe = await this.db.bienTheSanPham.findMany({ where: { ma_bien_the: { in: dong.map(x => x.ma_bien_the) } }, include: { san_pham: { select: { ma_san_pham: true, ten_san_pham: true } } } });
    const map = new Map(bienThe.map(x => [x.ma_bien_the.toUpperCase(), x]));
    const thieu = dong.filter(x => !map.has(x.ma_bien_the)).map(x => x.ma_bien_the);
    if (thieu.length) throw new BadRequestException(`Không tìm thấy biến thể: ${thieu.join(", ")}`);
    const ma_phieu = this.tao_ma_phieu_nhap();
    const tong_so_luong = dong.reduce((sum, x) => sum + x.so_luong_nhap, 0);
    const ket_qua = await this.db.$transaction(async tx => {
      const phieu = await tx.phieuNhapKho.create({ data: { ma_phieu, ma_lo: dto.ma_lo?.trim() || null, nha_cung_cap: ten_nha_cung_cap, nha_cung_cap_id: nha_cung_cap_ref?.id || null, ghi_chu: dto.ghi_chu?.trim() || null, nguoi_tao_id: actor.id, so_dong: dong.length, tong_so_luong } });
      const chi_tiet: Array<{ ma_bien_the: string; ma_san_pham: string; ten_san_pham: string; so_luong_nhap: number; ton_truoc: number; ton_sau: number }> = [];
      for (const item of dong) {
        const hien = await tx.bienTheSanPham.findUniqueOrThrow({ where: { ma_bien_the: item.ma_bien_the }, include: { san_pham: { select: { ma_san_pham: true, ten_san_pham: true } } } });
        const capNhat = await tx.bienTheSanPham.update({ where: { id: hien.id }, data: { so_luong_ton: { increment: item.so_luong_nhap } } });
        // Lấy tồn trước từ kết quả increment để audit vẫn chính xác nếu có hai transaction nhập kho đồng thời.
        const ton_truoc = capNhat.so_luong_ton - item.so_luong_nhap;
        await tx.chiTietPhieuNhapKho.create({ data: { phieu_nhap_id: phieu.id, bien_the_id: hien.id, ma_bien_the: hien.ma_bien_the, so_luong_nhap: item.so_luong_nhap, ton_truoc, ton_sau: capNhat.so_luong_ton, ly_do: item.ly_do } });
        await tx.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_TON_KHO", nguoi_dung_id: actor.id, chi_tiet: { bien_the_id: hien.id, ma_bien_the: hien.ma_bien_the, ma_san_pham: hien.san_pham.ma_san_pham, ton_cu: ton_truoc, ton_moi: capNhat.so_luong_ton, chenh_lech: item.so_luong_nhap, loai_bien_dong: "NHAP_KHO", ly_do: item.ly_do, ma_phieu_nhap: ma_phieu, ma_lo: dto.ma_lo?.trim() || null } } });
        chi_tiet.push({ ma_bien_the: hien.ma_bien_the, ma_san_pham: hien.san_pham.ma_san_pham, ten_san_pham: hien.san_pham.ten_san_pham, so_luong_nhap: item.so_luong_nhap, ton_truoc, ton_sau: capNhat.so_luong_ton });
      }
      await tx.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_NHAP_KHO_THEO_LO", nguoi_dung_id: actor.id, chi_tiet: { phieu_nhap_id: phieu.id, ma_phieu, ma_lo: dto.ma_lo?.trim() || null, nha_cung_cap_id: nha_cung_cap_ref?.id || null, nha_cung_cap: ten_nha_cung_cap, so_dong: dong.length, tong_so_luong } } });
      return { ...phieu, chi_tiet };
    });
    return ket_qua;
  }

  private dieu_kien_phieu_nhap_kho(tim_kiem?: string, nha_cung_cap_id?: string, tu_ngay?: string, den_ngay?: string) {
    const q = tim_kiem?.trim() || "";
    const hopLeNgay = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));
    const start = hopLeNgay(tu_ngay) ? new Date(`${tu_ngay}T00:00:00+07:00`) : undefined;
    const end = hopLeNgay(den_ngay) ? new Date(`${den_ngay}T00:00:00+07:00`) : undefined;
    if (start && end && start > end) throw new BadRequestException("Từ ngày không được lớn hơn đến ngày");
    if (end) end.setDate(end.getDate() + 1);
    return {
      ...(nha_cung_cap_id ? { nha_cung_cap_id } : {}),
      ...(start || end ? { ngay_tao: { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } } : {}),
      ...(q ? { OR: [
        { ma_phieu: { contains: q, mode: "insensitive" as const } },
        { ma_lo: { contains: q, mode: "insensitive" as const } },
        { nha_cung_cap: { contains: q, mode: "insensitive" as const } },
        { nha_cung_cap_ref: { is: { ten_nha_cung_cap: { contains: q, mode: "insensitive" as const } } } },
        { chi_tiet: { some: { ma_bien_the: { contains: q, mode: "insensitive" as const } } } }
      ] } : {})
    };
  }

  async danh_sach_phieu_nhap_kho(tim_kiem?: string, nha_cung_cap_id?: string, tu_ngay?: string, den_ngay?: string) {
    const where = this.dieu_kien_phieu_nhap_kho(tim_kiem, nha_cung_cap_id, tu_ngay, den_ngay);
    return this.db.phieuNhapKho.findMany({
      where,
      include: { nha_cung_cap_ref: { select: { id: true, ma_nha_cung_cap: true, ten_nha_cung_cap: true } }, chi_tiet: { orderBy: { ngay_tao: "asc" } } },
      orderBy: { ngay_tao: "desc" },
      take: 200
    });
  }

  async chi_tiet_phieu_nhap_kho(id: string) {
    const item = await this.db.phieuNhapKho.findUnique({
      where: { id },
      include: {
        nha_cung_cap_ref: true,
        chi_tiet: { include: { bien_the: { include: { san_pham: { select: { ma_san_pham: true, ten_san_pham: true } }, vat_lieu: { select: { ten_vat_lieu: true } }, mau_sac: { select: { ten_mau: true } } } } }, orderBy: { ngay_tao: "asc" } }
      }
    });
    if (!item) throw new NotFoundException("Không tìm thấy phiếu nhập kho");
    return { ...item, chi_tiet: item.chi_tiet.map(x => ({ ...x, ma_san_pham: x.bien_the.san_pham.ma_san_pham, ten_san_pham: x.bien_the.san_pham.ten_san_pham, vat_lieu: x.bien_the.vat_lieu?.ten_vat_lieu || "Mặc định", mau_sac: x.bien_the.mau_sac?.ten_mau || "Mặc định" })) };
  }

  async xuat_excel_phieu_nhap_kho(tim_kiem?: string, nha_cung_cap_id?: string, tu_ngay?: string, den_ngay?: string) {
    const ds = await this.danh_sach_phieu_nhap_kho(tim_kiem, nha_cung_cap_id, tu_ngay, den_ngay);
    const rows: unknown[][] = [["Ngày", "Mã phiếu", "Mã lô", "Mã NCC", "Nhà cung cấp", "Mã biến thể", "Số lượng nhập", "Tồn trước", "Tồn sau", "Lý do", "Ghi chú phiếu"]];
    for (const p of ds) {
      for (const d of p.chi_tiet) rows.push([p.ngay_tao.toISOString(), p.ma_phieu, p.ma_lo || "", p.nha_cung_cap_ref?.ma_nha_cung_cap || "", p.nha_cung_cap_ref?.ten_nha_cung_cap || p.nha_cung_cap || "", d.ma_bien_the, d.so_luong_nhap, d.ton_truoc, d.ton_sau, d.ly_do || "", p.ghi_chu || ""]);
    }
    const buffer = this.tao_xlsx(rows, "Phiếu nhập kho");
    const ngay = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { ten_file: `phieu-nhap-kho_${ngay}.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
  }

  private async danh_sach_canh_bao_kho() {
    const { nguong_sap_het } = await this.lay_cau_hinh_kho();
    const ds = await this.db.bienTheSanPham.findMany({ where: { so_luong_ton: { lte: nguong_sap_het }, dang_hien_thi: true }, include: { san_pham: { select: { ma_san_pham: true, ten_san_pham: true, nguon_tham_khao: true, trang_thai: true } } }, orderBy: [{ so_luong_ton: "asc" }, { ma_bien_the: "asc" }], take: 200 });
    return { nguong_sap_het, bien_the: ds.filter(x => !x.san_pham.nguon_tham_khao?.startsWith("__ADMIN_DELETED__:") && x.san_pham.trang_thai !== TrangThaiSanPham.NGUNG_BAN).map(x => ({ id: x.id, ma_bien_the: x.ma_bien_the, so_luong_ton: x.so_luong_ton, ma_san_pham: x.san_pham.ma_san_pham, ten_san_pham: x.san_pham.ten_san_pham })) };
  }

  private async dia_chi_nhan_canh_bao_kho() {
    const env = (process.env.LOW_STOCK_EMAIL_TO || "").split(",").map(x => x.trim()).filter(Boolean);
    if (env.length) return [...new Set(env)];
    const admin = await this.db.nguoiDung.findMany({ where: { vai_tro: VaiTro.ADMIN, da_kich_hoat: true }, select: { thu_dien_tu: true } });
    return [...new Set(admin.map(x => x.thu_dien_tu).filter(Boolean))];
  }

  async trang_thai_canh_bao_kho_email() {
    const state = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "CANH_BAO_KHO_EMAIL" } });
    const raw = state?.gia_tri;
    const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const bat = ["1", "true", "yes", "on"].includes((process.env.LOW_STOCK_EMAIL_ENABLED || "false").trim().toLowerCase());
    const interval = Math.max(15, Math.min(1440, Number(process.env.LOW_STOCK_EMAIL_INTERVAL_MINUTES || 60) || 60));
    const recipients = await this.dia_chi_nhan_canh_bao_kho();
    return { bat, chu_ky_phut: interval, so_nguoi_nhan: recipients.length, lan_gui_cuoi: typeof data.lan_gui_cuoi === "string" ? data.lan_gui_cuoi : null, tong_canh_bao_lan_cuoi: Number(data.tong_canh_bao || 0), trang_thai_lan_cuoi: typeof data.trang_thai === "string" ? data.trang_thai : "CHUA_GUI" };
  }

  async kiem_tra_gui_canh_bao_kho_email() {
    const { nguong_sap_het, bien_the } = await this.danh_sach_canh_bao_kho();
    const chu_ky = createHash("sha256").update(`${nguong_sap_het}|${bien_the.map(x => `${x.id}:${x.so_luong_ton}`).join("|")}`).digest("hex");
    const state = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "CANH_BAO_KHO_EMAIL" } });
    const raw = state?.gia_tri;
    const cu = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    if (!bien_the.length) {
      await this.db.cauHinhHeThong.upsert({ where: { khoa: "CANH_BAO_KHO_EMAIL" }, create: { khoa: "CANH_BAO_KHO_EMAIL", gia_tri: { chu_ky, tong_canh_bao: 0, trang_thai: "KHONG_CANH_BAO" } }, update: { gia_tri: { chu_ky, tong_canh_bao: 0, trang_thai: "KHONG_CANH_BAO", lan_gui_cuoi: typeof cu.lan_gui_cuoi === "string" ? cu.lan_gui_cuoi : null } } });
      return { da_gui: false, ly_do: "Không có biến thể dưới ngưỡng cảnh báo", tong_canh_bao: 0 };
    }
    if (cu.chu_ky === chu_ky) return { da_gui: false, ly_do: "Trạng thái tồn kho chưa thay đổi; đã chống gửi lặp", tong_canh_bao: bien_the.length };
    const recipients = await this.dia_chi_nhan_canh_bao_kho();
    if (!recipients.length) return { da_gui: false, ly_do: "Không có email Admin nhận cảnh báo", tong_canh_bao: bien_the.length };
    await this.thu_dien_tu.guiCanhBaoTonKho({ thu_dien_tu: recipients, nguong_sap_het, bien_the });
    const now = new Date().toISOString();
    await this.db.cauHinhHeThong.upsert({ where: { khoa: "CANH_BAO_KHO_EMAIL" }, create: { khoa: "CANH_BAO_KHO_EMAIL", gia_tri: { chu_ky, lan_gui_cuoi: now, tong_canh_bao: bien_the.length, trang_thai: "DA_GUI" } }, update: { gia_tri: { chu_ky, lan_gui_cuoi: now, tong_canh_bao: bien_the.length, trang_thai: "DA_GUI" } } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "HE_THONG_GUI_CANH_BAO_KHO_EMAIL", chi_tiet: { nguong_sap_het, tong_canh_bao: bien_the.length, so_nguoi_nhan: recipients.length, chu_ky } } });
    return { da_gui: true, tong_canh_bao: bien_the.length, so_nguoi_nhan: recipients.length, lan_gui: now };
  }

  private anh_data_url_hop_le(value: string) {
    const anh = value.trim();
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(anh);
    if (!match) throw new BadRequestException("Ảnh phải là JPEG, PNG hoặc WebP hợp lệ");
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length < 128) throw new BadRequestException("Dữ liệu ảnh không hợp lệ");
    if (bytes.length > 1300 * 1024) throw new BadRequestException("Ảnh sau chuẩn hóa phải nhỏ hơn 1,3 MB");
    return anh;
  }

  private tao_duong_dan_san_pham(ten: string, ma: string) {
    const slug = ten.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d").replaceAll("Đ", "D")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150) || "san-pham";
    const ma_slug = ma.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `${slug}-${ma_slug}`.slice(0, 220);
  }

  private tao_duong_dan_danh_muc(ten: string, ma: string) {
    const slug = ten.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d").replaceAll("Đ", "D")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "danh-muc";
    const maSlug = ma.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `${slug}-${maSlug}`.slice(0, 160);
  }

  async tong_quan() {
    const MUI_GIO_VIET_NAM = 7 * 60 * 60 * 1000;
    const now = new Date();
    const ngayVietNam = (date: Date) => new Date(date.getTime() + MUI_GIO_VIET_NAM).toISOString().slice(0, 10);
    const batDauNgay = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00+07:00`);
    const truNgay = (soNgay: number) => {
      const local = new Date(now.getTime() + MUI_GIO_VIET_NAM);
      local.setUTCDate(local.getUTCDate() - soNgay);
      return local.toISOString().slice(0, 10);
    };

    const hom_nay = ngayVietNam(now);
    const tu_7_ngay = truNgay(6);
    const tu_30_ngay = truNgay(29);
    const bat_dau_hom_nay = batDauNgay(hom_nay);
    const bat_dau_7_ngay = batDauNgay(tu_7_ngay);
    const bat_dau_30_ngay = batDauNgay(tu_30_ngay);
    const cau_hinh_kho = await this.lay_cau_hinh_kho();
    const nguong_sap_het = cau_hinh_kho.nguong_sap_het;

    const [nguoi_dung, khach_hang, nhan_vien, ca_lam_viec, phan_ca, don_hang, san_pham, don_30_ngay, don_doanh_thu_30_ngay, trang_thai_don, khach_hang_30_ngay, ton_kho_thap, sap_het_count, het_hang_count, don_gan_day] = await Promise.all([
      this.db.nguoiDung.count(),
      this.db.nguoiDung.count({ where: { vai_tro: VaiTro.KHACH_HANG } }),
      this.db.nhanVien.count(),
      this.db.caLamViec.count(),
      this.db.phanCa.count(),
      this.db.donHang.count(),
      this.danh_sach_san_pham_quan_tri().then(x => x.length),
      this.db.donHang.findMany({
        where: { ngay_tao: { gte: bat_dau_30_ngay } },
        orderBy: { ngay_tao: "asc" },
        select: {
          id: true,
          ma_don_hang: true,
          tong_tien: true,
          trang_thai: true,
          ngay_tao: true,
          chi_tiet: { select: { ma_san_pham: true, ten_san_pham: true, so_luong: true, thanh_tien: true } }
        }
      }),
      this.db.donHang.findMany({
        where: {
          trang_thai: { not: TrangThaiDonHang.DA_HUY },
          OR: [
            { thanh_toan: { some: { trang_thai: TrangThaiThanhToan.DA_THANH_TOAN, ngay_thanh_toan: { gte: bat_dau_30_ngay } } } },
            { trang_thai: TrangThaiDonHang.HOAN_TAT, ngay_cap_nhat: { gte: bat_dau_30_ngay } }
          ]
        },
        select: {
          id: true, ma_don_hang: true, tong_tien: true, trang_thai: true, ngay_tao: true, ngay_cap_nhat: true,
          thanh_toan: {
            orderBy: [{ ngay_thanh_toan: "desc" }, { ngay_tao: "desc" }],
            select: { so_tien: true, ngay_thanh_toan: true, trang_thai: true, phuong_thuc: { select: { ma_phuong_thuc: true } } }
          }
        }
      }),
      this.db.donHang.groupBy({ by: ["trang_thai"], _count: { _all: true } }),
      this.db.nguoiDung.findMany({
        where: { vai_tro: VaiTro.KHACH_HANG, ngay_tao: { gte: bat_dau_30_ngay } },
        select: { ngay_tao: true }
      }),
      this.db.bienTheSanPham.findMany({
        where: { dang_hien_thi: true, so_luong_ton: { lte: nguong_sap_het }, san_pham: { trang_thai: TrangThaiSanPham.DANG_BAN } },
        orderBy: [{ so_luong_ton: "asc" }, { ma_bien_the: "asc" }],
        take: 10,
        select: {
          id: true,
          ma_bien_the: true,
          so_luong_ton: true,
          san_pham: { select: { id: true, ma_san_pham: true, ten_san_pham: true } },
          mau_sac: { select: { ten_mau: true } },
          vat_lieu: { select: { ten_vat_lieu: true } }
        }
      }),
      this.db.bienTheSanPham.count({ where: { dang_hien_thi: true, so_luong_ton: { gt: 0, lte: nguong_sap_het }, san_pham: { trang_thai: TrangThaiSanPham.DANG_BAN } } }),
      this.db.bienTheSanPham.count({ where: { dang_hien_thi: true, so_luong_ton: 0, san_pham: { trang_thai: TrangThaiSanPham.DANG_BAN } } }),
      this.db.donHang.findMany({
        orderBy: { ngay_tao: "desc" },
        take: 8,
        select: {
          id: true,
          ma_don_hang: true,
          ho_ten_nguoi_nhan: true,
          tong_tien: true,
          trang_thai: true,
          ngay_tao: true
        }
      })
    ]);

    // V2.15.1: doanh thu được ghi nhận theo thời điểm tiền thực sự được xác nhận.
    // - Đơn không COD: thanh toán được xác nhận ngay khi checkout => doanh thu vào ngay.
    // - COD: khi Admin chuyển đơn sang HOAN_TAT (đã giao), giao dịch được xác nhận đã thanh toán.
    // - Đơn HOAN_TAT cũ chưa có bản ghi thanh toán hợp lệ vẫn được giữ tương thích theo ngay_cap_nhat.
    const doanhThuDaGhiNhan = don_doanh_thu_30_ngay.map(d => {
      // Khong lay giao dich moi nhat mot cach mu quang: mot don co the co giao dich
      // THAT_BAI/CHO_THANH_TOAN moi hon giao dich DA_THANH_TOAN hop le.
      const tt = d.thanh_toan.find(x => x.trang_thai === TrangThaiThanhToan.DA_THANH_TOAN);
      const da_thanh_toan = Boolean(tt);
      const fallback_legacy = d.thanh_toan.length === 0 && d.trang_thai === TrangThaiDonHang.HOAN_TAT;
      const ngay_ghi_nhan = tt ? (tt.ngay_thanh_toan || d.ngay_cap_nhat) : (fallback_legacy ? d.ngay_cap_nhat : null);
      if (!ngay_ghi_nhan) return null;
      return { id: d.id, ngay_ghi_nhan, so_tien: tt ? Number(tt.so_tien) : Number(d.tong_tien) };
    }).filter((x): x is { id: string; ngay_ghi_nhan: Date; so_tien: number } => Boolean(x))
      .filter(x => x.ngay_ghi_nhan >= bat_dau_30_ngay);
    const trongKhoang = (date: Date, batDau: Date) => date >= batDau;
    const tongTienDoanhThu = (ds: typeof doanhThuDaGhiNhan) => ds.reduce((sum, item) => sum + item.so_tien, 0);
    const doanh_thu_hom_nay = tongTienDoanhThu(doanhThuDaGhiNhan.filter(d => trongKhoang(d.ngay_ghi_nhan, bat_dau_hom_nay)));
    const doanh_thu_7_ngay = tongTienDoanhThu(doanhThuDaGhiNhan.filter(d => trongKhoang(d.ngay_ghi_nhan, bat_dau_7_ngay)));
    const doanh_thu_30_ngay = tongTienDoanhThu(doanhThuDaGhiNhan);
    // V2.15.3: số đơn đi cùng doanh thu phải đếm theo ngày GHI NHẬN doanh thu,
    // không đếm theo ngày tạo đơn. Một đơn tạo hôm trước nhưng thu tiền hôm nay vẫn là
    // 1 đơn ghi nhận doanh thu hôm nay; nhờ vậy không còn hiển thị "0 đơn" cạnh doanh thu > 0.
    const don_ghi_nhan_doanh_thu_hom_nay = doanhThuDaGhiNhan.filter(d => trongKhoang(d.ngay_ghi_nhan, bat_dau_hom_nay)).length;
    const don_ghi_nhan_doanh_thu_7_ngay = doanhThuDaGhiNhan.filter(d => trongKhoang(d.ngay_ghi_nhan, bat_dau_7_ngay)).length;
    const don_ghi_nhan_doanh_thu_30_ngay = doanhThuDaGhiNhan.length;
    // v3.3.2: tách số đơn đã giao khỏi số đơn vừa phát sinh doanh thu.
    // Đơn online có thể đã ghi nhận doanh thu trước khi giao nên hai con số không bắt buộc bằng nhau.
    const donDaGiao30Ngay = don_doanh_thu_30_ngay.filter(d => d.trang_thai === TrangThaiDonHang.HOAN_TAT && d.ngay_cap_nhat >= bat_dau_30_ngay);
    const don_da_giao_hom_nay = donDaGiao30Ngay.filter(d => d.ngay_cap_nhat >= bat_dau_hom_nay).length;
    const don_da_giao_7_ngay = donDaGiao30Ngay.filter(d => d.ngay_cap_nhat >= bat_dau_7_ngay).length;
    const don_da_giao_30_ngay = donDaGiao30Ngay.length;
    const don_hom_nay = don_30_ngay.filter(d => trongKhoang(d.ngay_tao, bat_dau_hom_nay)).length;
    const don_7_ngay = don_30_ngay.filter(d => trongKhoang(d.ngay_tao, bat_dau_7_ngay)).length;
    const don_30_ngay_count = don_30_ngay.length;
    const gia_tri_don_trung_binh_30_ngay = doanhThuDaGhiNhan.length ? Math.round(doanh_thu_30_ngay / doanhThuDaGhiNhan.length) : 0;

    const doanh_thu_theo_ngay = Array.from({ length: 7 }, (_, index) => {
      const dateKey = truNgay(6 - index);
      const doanh_thu = doanhThuDaGhiNhan
        .filter(d => ngayVietNam(d.ngay_ghi_nhan) === dateKey)
        .reduce((sum, item) => sum + item.so_tien, 0);
      const so_don = doanhThuDaGhiNhan.filter(d => ngayVietNam(d.ngay_ghi_nhan) === dateKey).length;
      return { ngay: dateKey, doanh_thu, so_don };
    });

    const topMap = new Map<string, { ma_san_pham: string; ten_san_pham: string; so_luong: number; doanh_thu: number }>();
    for (const order of don_30_ngay) {
      if (order.trang_thai === TrangThaiDonHang.DA_HUY) continue;
      for (const ct of order.chi_tiet) {
        const current = topMap.get(ct.ma_san_pham) || { ma_san_pham: ct.ma_san_pham, ten_san_pham: ct.ten_san_pham, so_luong: 0, doanh_thu: 0 };
        current.so_luong += ct.so_luong;
        current.doanh_thu += Number(ct.thanh_tien);
        topMap.set(ct.ma_san_pham, current);
      }
    }
    const top_san_pham_30_ngay = Array.from(topMap.values()).sort((a, b) => b.so_luong - a.so_luong || b.doanh_thu - a.doanh_thu).slice(0, 5);

    const khach_hang_moi_hom_nay = khach_hang_30_ngay.filter(x => x.ngay_tao >= bat_dau_hom_nay).length;
    const khach_hang_moi_7_ngay = khach_hang_30_ngay.filter(x => x.ngay_tao >= bat_dau_7_ngay).length;
    const khach_hang_moi_30_ngay = khach_hang_30_ngay.length;

    const trang_thai = Object.fromEntries(Object.values(TrangThaiDonHang).map(status => [status, 0])) as Record<string, number>;
    for (const item of trang_thai_don) trang_thai[item.trang_thai] = item._count._all;

    return {
      nguoi_dung,
      khach_hang,
      nhan_vien,
      ca_lam_viec,
      phan_ca,
      don_hang,
      san_pham,
      ky_bao_cao: { hom_nay, tu_7_ngay, tu_30_ngay },
      doanh_thu: {
        hom_nay: doanh_thu_hom_nay,
        bay_ngay: doanh_thu_7_ngay,
        ba_muoi_ngay: doanh_thu_30_ngay,
        gia_tri_don_trung_binh_30_ngay
      },
      don_hang_theo_ky: { hom_nay: don_hom_nay, bay_ngay: don_7_ngay, ba_muoi_ngay: don_30_ngay_count },
      don_ghi_nhan_doanh_thu_theo_ky: {
        hom_nay: don_ghi_nhan_doanh_thu_hom_nay,
        bay_ngay: don_ghi_nhan_doanh_thu_7_ngay,
        ba_muoi_ngay: don_ghi_nhan_doanh_thu_30_ngay
      },
      don_da_giao_theo_ky: { hom_nay: don_da_giao_hom_nay, bay_ngay: don_da_giao_7_ngay, ba_muoi_ngay: don_da_giao_30_ngay },
      khach_hang_moi: { hom_nay: khach_hang_moi_hom_nay, bay_ngay: khach_hang_moi_7_ngay, ba_muoi_ngay: khach_hang_moi_30_ngay },
      trang_thai_don_hang: trang_thai,
      doanh_thu_theo_ngay,
      top_san_pham_30_ngay,
      canh_bao_kho: { nguong_sap_het, sap_het: sap_het_count, het_hang: het_hang_count, tong_canh_bao: sap_het_count + het_hang_count },
      ton_kho_thap: ton_kho_thap.map(item => ({
        id: item.id,
        ma_bien_the: item.ma_bien_the,
        so_luong_ton: item.so_luong_ton,
        ma_san_pham: item.san_pham.ma_san_pham,
        ten_san_pham: item.san_pham.ten_san_pham,
        mau_sac: item.mau_sac?.ten_mau || "Mặc định",
        vat_lieu: item.vat_lieu?.ten_vat_lieu || "Mặc định"
      })),
      don_gan_day: don_gan_day.map(item => ({ ...item, tong_tien: Number(item.tong_tien) }))
    };
  }

  async danh_sach_nguoi_dung() {
    const ds = await this.db.nguoiDung.findMany({
      select: {
        id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true,
        ngay_tao: true, lan_dang_nhap_cuoi: true,
        dia_chi: {
          where: { la_mac_dinh: true },
          orderBy: { ngay_cap_nhat: "desc" },
          take: 1,
          select: { dia_chi_cu_the: true }
        },
        nhan_vien: { select: { id: true, ma_nhan_vien: true, chuc_danh: true, bo_phan: true, trang_thai: true } }
      }
    });
    const thu_tu: Record<VaiTro, number> = {
      ADMIN: 0, NHAN_VIEN: 1, KHACH_HANG: 2
    };
    return ds
      .map(({ dia_chi, ...item }) => ({ ...item, dia_chi_mac_dinh: dia_chi[0]?.dia_chi_cu_the || "" }))
      .sort((a, b) => thu_tu[a.vai_tro] - thu_tu[b.vai_tro] || a.ho_ten.localeCompare(b.ho_ten, "vi"));
  }

  async cap_nhat_nguoi_dung(actor: NguoiDungXacThuc, id: string, dto: CapNhatNguoiDungDto) {
    const target = await this.db.nguoiDung.findUnique({ where: { id }, select: { id: true, vai_tro: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, da_kich_hoat: true, dia_chi: { where: { la_mac_dinh: true }, orderBy: { ngay_cap_nhat: "desc" }, take: 1, select: { dia_chi_cu_the: true } } } });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");

    // PATCH người dùng không còn được đổi vai trò; POST cập nhật cũng giữ nguyên quy tắc này.
    // Admin chỉ chỉnh thông tin tài khoản, không đổi khách hàng thành nhân viên hoặc Admin.
    if (actor.id === id && dto.da_kich_hoat === false) {
      throw new BadRequestException("Không thể tự khóa tài khoản Admin đang đăng nhập");
    }

    const data: {
      thu_dien_tu?: string;
      ho_ten?: string;
      so_dien_thoai?: string | null;
      da_kich_hoat?: boolean;
      so_lan_dang_nhap_that_bai?: number;
      khoa_den?: Date | null;
    } = {};
    if (dto.thu_dien_tu !== undefined) {
      const email = dto.thu_dien_tu.trim().toLowerCase();
      const da_co = await this.db.nguoiDung.findFirst({ where: { thu_dien_tu: email, id: { not: id } }, select: { id: true } });
      if (da_co) throw new ConflictException("Email này đã được sử dụng bởi tài khoản khác");
      data.thu_dien_tu = email;
    }
    if (dto.ho_ten !== undefined) data.ho_ten = dto.ho_ten.trim();
    if (dto.so_dien_thoai !== undefined) data.so_dien_thoai = dto.so_dien_thoai.trim() || null;
    if (dto.da_kich_hoat !== undefined) {
      data.da_kich_hoat = dto.da_kich_hoat;
      if (dto.da_kich_hoat) {
        data.so_lan_dang_nhap_that_bai = 0;
        data.khoa_den = null;
      }
    }
    const dia_chi = dto.dia_chi_mac_dinh !== undefined ? dto.dia_chi_mac_dinh.trim() : undefined;
    if (!Object.keys(data).length && dia_chi === undefined) throw new BadRequestException("Không có thông tin nào để cập nhật");

    await this.db.$transaction(async tx => {
      const updated = await tx.nguoiDung.update({ where: { id }, data });
      if (dto.da_kich_hoat === false) {
        await tx.phienDangNhap.updateMany({ where: { nguoi_dung_id: id, da_thu_hoi: false }, data: { da_thu_hoi: true } });
      }
      if (dia_chi !== undefined) {
        const hien_tai = await tx.diaChiNguoiDung.findFirst({
          where: { nguoi_dung_id: id, la_mac_dinh: true },
          orderBy: [{ ngay_cap_nhat: "desc" }, { ngay_tao: "desc" }]
        });
        if (hien_tai) {
          await tx.diaChiNguoiDung.update({
            where: { id: hien_tai.id },
            data: {
              dia_chi_cu_the: dia_chi,
              ten_nguoi_nhan: updated.ho_ten,
              so_dien_thoai: updated.so_dien_thoai || hien_tai.so_dien_thoai || "Chưa cập nhật",
              la_mac_dinh: true
            }
          });
          await tx.diaChiNguoiDung.updateMany({
            where: { nguoi_dung_id: id, id: { not: hien_tai.id }, la_mac_dinh: true },
            data: { la_mac_dinh: false }
          });
        } else if (dia_chi) {
          await tx.diaChiNguoiDung.create({
            data: {
              nguoi_dung_id: id,
              ten_nguoi_nhan: updated.ho_ten,
              so_dien_thoai: updated.so_dien_thoai || "Chưa cập nhật",
              tinh_thanh: "",
              quan_huyen: "",
              phuong_xa: "",
              dia_chi_cu_the: dia_chi,
              la_mac_dinh: true
            }
          });
        }
      }
    });

    const da_cap_nhat = await this.db.nguoiDung.findUniqueOrThrow({
      where: { id },
      select: {
        id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true,
        ngay_tao: true, lan_dang_nhap_cuoi: true,
        dia_chi: { where: { la_mac_dinh: true }, orderBy: { ngay_cap_nhat: "desc" }, take: 1, select: { dia_chi_cu_the: true } },
        nhan_vien: { select: { id: true, ma_nhan_vien: true, chuc_danh: true, bo_phan: true, trang_thai: true } }
      }
    });
    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: dto.da_kich_hoat === true ? "ADMIN_KICH_HOAT_NGUOI_DUNG" : dto.da_kich_hoat === false ? "ADMIN_KHOA_NGUOI_DUNG" : "ADMIN_CAP_NHAT_NGUOI_DUNG",
        nguoi_dung_id: actor.id,
        chi_tiet: (() => {
          const truoc = { thu_dien_tu: target.thu_dien_tu, ho_ten: target.ho_ten, so_dien_thoai: target.so_dien_thoai, da_kich_hoat: target.da_kich_hoat, dia_chi_mac_dinh: target.dia_chi[0]?.dia_chi_cu_the || "" };
          const sau = { thu_dien_tu: da_cap_nhat.thu_dien_tu, ho_ten: da_cap_nhat.ho_ten, so_dien_thoai: da_cap_nhat.so_dien_thoai, da_kich_hoat: da_cap_nhat.da_kich_hoat, dia_chi_mac_dinh: da_cap_nhat.dia_chi[0]?.dia_chi_cu_the || "" };
          return { muc_tieu_id: id, truoc, sau, thay_doi: this.tao_diff(truoc, sau) };
        })()
      }
    });
    const { dia_chi: dia_chi_ds, ...user } = da_cap_nhat;
    return { ...user, dia_chi_mac_dinh: dia_chi_ds[0]?.dia_chi_cu_the || "" };
  }

  async kich_hoat_nguoi_dung(actor: NguoiDungXacThuc, id: string) {
    const target = await this.db.nguoiDung.findUnique({
      where: { id },
      select: { id: true, thu_dien_tu: true, nhan_vien: { select: { id: true } } }
    });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");

    // Endpoint riêng để mở khóa dứt điểm: bật tài khoản + xóa lockout đăng nhập sai.
    // Nếu đây là nhân viên bán hàng, trạng thái hồ sơ cũng chuyển về ĐANG_LÀM để
    // khu người dùng, hồ sơ nhân sự và xếp ca không còn lệch trạng thái.
    const updated = await this.db.$transaction(async tx => {
      const user = await tx.nguoiDung.update({
        where: { id },
        data: { da_kich_hoat: true, so_lan_dang_nhap_that_bai: 0, khoa_den: null }
      });
      if (target.nhan_vien) {
        await tx.nhanVien.update({
          where: { id: target.nhan_vien.id },
          data: { trang_thai: TrangThaiNhanVien.DANG_LAM, chuc_danh: "Nhân viên bán hàng", bo_phan: "Bán hàng" }
        });
      }
      return user;
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "ADMIN_KICH_HOAT_NGUOI_DUNG", nguoi_dung_id: actor.id, chi_tiet: { muc_tieu_id: id, thu_dien_tu: target.thu_dien_tu, reset_lockout: true } }
    });
    return { id: updated.id, da_kich_hoat: updated.da_kich_hoat, khoa_den: updated.khoa_den, so_lan_dang_nhap_that_bai: updated.so_lan_dang_nhap_that_bai, thong_bao: `Đã kích hoạt tài khoản ${target.thu_dien_tu}` };
  }

  async khoa_nguoi_dung(actor: NguoiDungXacThuc, id: string) {
    if (actor.id === id) throw new BadRequestException("Không thể tự khóa tài khoản Admin đang đăng nhập");
    const target = await this.db.nguoiDung.findUnique({
      where: { id },
      select: { id: true, thu_dien_tu: true, nhan_vien: { select: { id: true, trang_thai: true } } }
    });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");

    await this.db.$transaction(async tx => {
      await tx.nguoiDung.update({ where: { id }, data: { da_kich_hoat: false } });
      await tx.phienDangNhap.updateMany({ where: { nguoi_dung_id: id, da_thu_hoi: false }, data: { da_thu_hoi: true } });
      if (target.nhan_vien && target.nhan_vien.trang_thai !== TrangThaiNhanVien.NGHI_VIEC) {
        await tx.nhanVien.update({ where: { id: target.nhan_vien.id }, data: { trang_thai: TrangThaiNhanVien.TAM_NGHI } });
      }
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "ADMIN_KHOA_NGUOI_DUNG", nguoi_dung_id: actor.id, chi_tiet: { muc_tieu_id: id, thu_dien_tu: target.thu_dien_tu, thu_hoi_phien: true } }
    });
    return { id, da_kich_hoat: false, thong_bao: `Đã khóa tài khoản ${target.thu_dien_tu}` };
  }

  async xoa_nguoi_dung(actor: NguoiDungXacThuc, id: string) {
    const target = await this.db.nguoiDung.findUnique({
      where: { id },
      select: { id: true, ho_ten: true, thu_dien_tu: true, vai_tro: true, nhan_vien: { select: { id: true } } }
    });
    if (!target) throw new NotFoundException("Không tìm thấy người dùng");
    if (actor.id === id) throw new BadRequestException("Không thể xóa chính tài khoản Admin đang đăng nhập");

    // Dọn quan hệ tường minh để xóa được cả database đã nâng cấp từ các bản cũ
    // có constraint chưa đồng nhất. Đơn hàng/giỏ hàng chỉ bỏ liên kết, không xóa lịch sử.
    await this.db.$transaction(async tx => {
      await tx.donHang.updateMany({ where: { nguoi_dung_id: id }, data: { nguoi_dung_id: null } });
      await tx.gioHang.updateMany({ where: { nguoi_dung_id: id }, data: { nguoi_dung_id: null } });
      await tx.phienDangNhap.deleteMany({ where: { nguoi_dung_id: id } });
      await tx.datLaiMatKhau.deleteMany({ where: { nguoi_dung_id: id } });
      await tx.diaChiNguoiDung.deleteMany({ where: { nguoi_dung_id: id } });
      if (target.nhan_vien) {
        await tx.phanCa.deleteMany({ where: { nhan_vien_id: target.nhan_vien.id } });
        await tx.nhanVien.deleteMany({ where: { id: target.nhan_vien.id } });
      }
      await tx.nguoiDung.delete({ where: { id } });
    });

    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: "ADMIN_XOA_NGUOI_DUNG",
        nguoi_dung_id: actor.id,
        chi_tiet: { muc_tieu_id: id, thu_dien_tu: target.thu_dien_tu, ho_ten: target.ho_ten, vai_tro: target.vai_tro, don_quan_he: true }
      }
    });
    return { thong_bao: `Đã xóa tài khoản ${target.thu_dien_tu}` };
  }

  async tao_nhan_vien(actor: NguoiDungXacThuc, dto: TaoNhanVienDto) {
    const email = dto.thu_dien_tu.trim().toLowerCase();
    const [email_da_co, ma_da_co] = await Promise.all([
      this.db.nguoiDung.findUnique({ where: { thu_dien_tu: email }, select: { id: true } }),
      this.db.nhanVien.findUnique({ where: { ma_nhan_vien: dto.ma_nhan_vien.trim().toUpperCase() }, select: { id: true } })
    ]);
    if (email_da_co) throw new ConflictException("Email đã tồn tại");
    if (ma_da_co) throw new ConflictException("Mã nhân viên đã tồn tại");

    const mat_khau_bam = await argon2.hash(dto.mat_khau, { type: argon2.argon2id });
    const ket_qua = await this.db.$transaction(async tx => {
      const nguoi_dung = await tx.nguoiDung.create({
        data: { thu_dien_tu: email, ho_ten: dto.ho_ten.trim(), so_dien_thoai: dto.so_dien_thoai?.trim() || null, mat_khau_bam, vai_tro: VaiTro.NHAN_VIEN, da_kich_hoat: true }
      });
      const nhan_vien = await tx.nhanVien.create({
        data: {
          nguoi_dung_id: nguoi_dung.id,
          ma_nhan_vien: dto.ma_nhan_vien.trim().toUpperCase(),
          chuc_danh: "Nhân viên bán hàng",
          bo_phan: "Bán hàng",
          ngay_vao_lam: new Date(`${dto.ngay_vao_lam}T00:00:00Z`),
          trang_thai: TrangThaiNhanVien.DANG_LAM,
          ghi_chu: "Nhân viên bán hàng do Admin quản lý."
        }
      });
      return { nguoi_dung, nhan_vien };
    });
    await this.db.nhatKyBaoMat.create({
      data: { loai_su_kien: "ADMIN_TAO_NHAN_VIEN", nguoi_dung_id: actor.id, chi_tiet: { nhan_vien_id: ket_qua.nhan_vien.id, ma_nhan_vien: ket_qua.nhan_vien.ma_nhan_vien } }
    });
    return { id: ket_qua.nhan_vien.id, ma_nhan_vien: ket_qua.nhan_vien.ma_nhan_vien, nguoi_dung_id: ket_qua.nguoi_dung.id };
  }

  danh_sach_nhan_vien() {
    return this.db.nhanVien.findMany({
      include: { nguoi_dung: { select: { id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true } } },
      orderBy: { ma_nhan_vien: "asc" }
    });
  }

  async cap_nhat_nhan_vien(actor: NguoiDungXacThuc, id: string, dto: CapNhatNhanVienDto) {
    const hien_tai = await this.db.nhanVien.findUnique({ where: { id }, select: { id: true, nguoi_dung_id: true, ma_nhan_vien: true } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy nhân viên");

    const data: { trang_thai?: TrangThaiNhanVien; ghi_chu?: string | null; chuc_danh: string; bo_phan: string } = {
      chuc_danh: "Nhân viên bán hàng",
      bo_phan: "Bán hàng"
    };
    if (dto.trang_thai !== undefined) data.trang_thai = dto.trang_thai as TrangThaiNhanVien;
    if (dto.ghi_chu !== undefined) data.ghi_chu = dto.ghi_chu.trim() || null;

    await this.db.$transaction(async tx => {
      await tx.nhanVien.update({ where: { id }, data });
      if (dto.trang_thai === TrangThaiNhanVien.DANG_LAM) {
        await tx.nguoiDung.update({
          where: { id: hien_tai.nguoi_dung_id },
          data: { vai_tro: VaiTro.NHAN_VIEN, da_kich_hoat: true, so_lan_dang_nhap_that_bai: 0, khoa_den: null }
        });
      } else if (dto.trang_thai === TrangThaiNhanVien.TAM_NGHI || dto.trang_thai === TrangThaiNhanVien.NGHI_VIEC) {
        await tx.nguoiDung.update({
          where: { id: hien_tai.nguoi_dung_id },
          data: { vai_tro: VaiTro.NHAN_VIEN, da_kich_hoat: false, khoa_den: null }
        });
        await tx.phienDangNhap.updateMany({
          where: { nguoi_dung_id: hien_tai.nguoi_dung_id, da_thu_hoi: false },
          data: { da_thu_hoi: true }
        });
      }
    });

    // Đọc lại trực tiếp từ PostgreSQL sau commit. Response này là source of truth
    // để frontend không thể giữ trạng thái select cục bộ rồi F5 quay về dữ liệu cũ.
    const kq = await this.db.nhanVien.findUniqueOrThrow({
      where: { id },
      include: {
        nguoi_dung: {
          select: { id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true, vai_tro: true, da_kich_hoat: true }
        }
      }
    });

    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: "ADMIN_CAP_NHAT_NHAN_VIEN",
        nguoi_dung_id: actor.id,
        chi_tiet: { nhan_vien_id: id, ma_nhan_vien: hien_tai.ma_nhan_vien, trang_thai: kq.trang_thai, dong_bo_tai_khoan: dto.trang_thai !== undefined, da_doc_lai_sau_commit: true }
      }
    });
    return kq;
  }

  danh_sach_ca() {
    return this.db.caLamViec.findMany({ orderBy: [{ gio_bat_dau: "asc" }, { ma_ca: "asc" }] });
  }

  private kiem_tra_khung_gio(gio_bat_dau: string, gio_ket_thuc: string) {
    if (gio_bat_dau >= gio_ket_thuc) {
      throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày");
    }
  }

  async tao_ca(actor: NguoiDungXacThuc, dto: TaoCaLamDto) {
    const ma_ca = dto.ma_ca.trim().toUpperCase();
    this.kiem_tra_khung_gio(dto.gio_bat_dau, dto.gio_ket_thuc);
    const da_co = await this.db.caLamViec.findUnique({ where: { ma_ca }, select: { id: true } });
    if (da_co) throw new ConflictException("Mã ca đã tồn tại");
    const da_tao = await this.db.caLamViec.create({
      data: {
        ma_ca,
        ten_ca: dto.ten_ca.trim(),
        gio_bat_dau: dto.gio_bat_dau,
        gio_ket_thuc: dto.gio_ket_thuc,
        mau_hien_thi: dto.mau_hien_thi || "#22C55E"
      }
    });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_CA_LAM", nguoi_dung_id: actor.id, chi_tiet: { ca_lam_id: da_tao.id, ma_ca: da_tao.ma_ca, ten_ca: da_tao.ten_ca } } });
    return da_tao;
  }

  async cap_nhat_ca(actor: NguoiDungXacThuc, id: string, dto: CapNhatCaLamDto) {
    const hien_tai = await this.db.caLamViec.findUnique({ where: { id } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy ca làm việc");

    const ma_ca = dto.ma_ca?.trim().toUpperCase() ?? hien_tai.ma_ca;
    const ten_ca = dto.ten_ca?.trim() ?? hien_tai.ten_ca;
    const gio_bat_dau = dto.gio_bat_dau ?? hien_tai.gio_bat_dau;
    const gio_ket_thuc = dto.gio_ket_thuc ?? hien_tai.gio_ket_thuc;
    this.kiem_tra_khung_gio(gio_bat_dau, gio_ket_thuc);

    if (ma_ca !== hien_tai.ma_ca) {
      const trung_ma = await this.db.caLamViec.findUnique({ where: { ma_ca }, select: { id: true } });
      if (trung_ma && trung_ma.id !== id) throw new ConflictException("Mã ca đã tồn tại");
    }

    // Không chặn chỉnh sửa mẫu ca khi đã có phân công. PhanCa giữ khóa ngoại tới
    // cùng ca_lam_viec_id nên tên/giờ/màu mới tự động áp dụng cho toàn bộ lịch đã xếp.
    const [, so_phan_ca_bi_anh_huong] = await this.db.$transaction([
      this.db.caLamViec.update({
        where: { id },
        data: {
          ma_ca,
          ten_ca,
          gio_bat_dau,
          gio_ket_thuc,
          mau_hien_thi: dto.mau_hien_thi ?? hien_tai.mau_hien_thi,
          dang_hoat_dong: dto.dang_hoat_dong ?? hien_tai.dang_hoat_dong
        }
      }),
      this.db.phanCa.count({ where: { ca_lam_viec_id: id } })
    ]);
    const da_cap_nhat = await this.db.caLamViec.findUniqueOrThrow({ where: { id } });
    const truoc = { ma_ca: hien_tai.ma_ca, ten_ca: hien_tai.ten_ca, gio_bat_dau: hien_tai.gio_bat_dau, gio_ket_thuc: hien_tai.gio_ket_thuc, mau_hien_thi: hien_tai.mau_hien_thi, dang_hoat_dong: hien_tai.dang_hoat_dong };
    const sau = { ma_ca: da_cap_nhat.ma_ca, ten_ca: da_cap_nhat.ten_ca, gio_bat_dau: da_cap_nhat.gio_bat_dau, gio_ket_thuc: da_cap_nhat.gio_ket_thuc, mau_hien_thi: da_cap_nhat.mau_hien_thi, dang_hoat_dong: da_cap_nhat.dang_hoat_dong };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_CA_LAM", nguoi_dung_id: actor.id, chi_tiet: { ca_lam_id: id, truoc, sau, thay_doi: this.tao_diff(truoc, sau), so_phan_ca_bi_anh_huong } } });
    return { ...da_cap_nhat, so_phan_ca_bi_anh_huong, da_doc_lai_sau_commit: true };
  }

  async xoa_ca(actor: NguoiDungXacThuc, id: string) {
    const hien_tai = await this.db.caLamViec.findUnique({
      where: { id },
      select: { id: true, ma_ca: true, ten_ca: true, _count: { select: { phan_ca: true } } }
    });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy ca làm việc");

    await this.db.$transaction(async tx => {
      await tx.phanCa.deleteMany({ where: { ca_lam_viec_id: id } });
      await tx.caLamViec.delete({ where: { id } });
    });

    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_CA_LAM", nguoi_dung_id: actor.id, chi_tiet: { ca_lam_id: id, ma_ca: hien_tai.ma_ca, ten_ca: hien_tai.ten_ca, so_phan_ca_da_xoa: hien_tai._count.phan_ca } } });
    return {
      thong_bao: `Đã xóa ca ${hien_tai.ma_ca} · ${hien_tai.ten_ca}`,
      so_phan_ca_da_xoa: hien_tai._count.phan_ca
    };
  }

  danh_sach_phan_ca() {
    return this.db.phanCa.findMany({
      include: {
        nhan_vien: { include: { nguoi_dung: { select: { ho_ten: true, thu_dien_tu: true } } } },
        ca_lam_viec: true
      },
      orderBy: [{ ngay_lam: "asc" }, { ngay_tao: "asc" }],
      take: 300
    });
  }

  async tao_phan_ca(actor: NguoiDungXacThuc, dto: TaoPhanCaDto) {
    const [nhan_vien, ca] = await Promise.all([
      this.db.nhanVien.findUnique({ where: { id: dto.nhan_vien_id }, include: { nguoi_dung: true } }),
      this.db.caLamViec.findUnique({ where: { id: dto.ca_lam_viec_id } })
    ]);
    if (!nhan_vien || !nhan_vien.nguoi_dung.da_kich_hoat) throw new BadRequestException("Nhân viên không tồn tại hoặc đã bị vô hiệu hóa");
    if (!ca || !ca.dang_hoat_dong) throw new BadRequestException("Ca làm việc không tồn tại hoặc đã ngừng hoạt động");

    try {
      const da_tao = await this.db.phanCa.create({
        data: { nhan_vien_id: dto.nhan_vien_id, ca_lam_viec_id: dto.ca_lam_viec_id, ngay_lam: new Date(`${dto.ngay_lam}T00:00:00Z`), ghi_chu: dto.ghi_chu?.trim() || null }
      });
      await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_PHAN_CA", nguoi_dung_id: actor.id, chi_tiet: { phan_ca_id: da_tao.id, nhan_vien_id: dto.nhan_vien_id, ca_lam_viec_id: dto.ca_lam_viec_id, ngay_lam: dto.ngay_lam } } });
      return da_tao;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new ConflictException("Nhân viên đã được xếp ca này trong ngày đã chọn");
    }
  }

  async cap_nhat_phan_ca(actor: NguoiDungXacThuc, id: string, dto: CapNhatPhanCaDto) {
    const hien_tai = await this.db.phanCa.findUnique({ where: { id } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy phân ca");

    const nhan_vien_id = dto.nhan_vien_id ?? hien_tai.nhan_vien_id;
    const ca_lam_viec_id = dto.ca_lam_viec_id ?? hien_tai.ca_lam_viec_id;
    const ngay_lam = dto.ngay_lam ? new Date(`${dto.ngay_lam}T00:00:00Z`) : hien_tai.ngay_lam;

    const [nhan_vien, ca] = await Promise.all([
      this.db.nhanVien.findUnique({ where: { id: nhan_vien_id }, include: { nguoi_dung: true } }),
      this.db.caLamViec.findUnique({ where: { id: ca_lam_viec_id } })
    ]);
    if (!nhan_vien) throw new BadRequestException("Nhân viên không tồn tại");
    if (nhan_vien_id !== hien_tai.nhan_vien_id && !nhan_vien.nguoi_dung.da_kich_hoat) {
      throw new BadRequestException("Không thể chuyển phân ca sang nhân viên đã bị vô hiệu hóa");
    }
    if (!ca) throw new BadRequestException("Ca làm việc không tồn tại");
    if (ca_lam_viec_id !== hien_tai.ca_lam_viec_id && !ca.dang_hoat_dong) {
      throw new BadRequestException("Không thể chuyển phân ca sang mẫu ca đã ngừng hoạt động");
    }

    const trung = await this.db.phanCa.findFirst({
      where: { id: { not: id }, nhan_vien_id, ca_lam_viec_id, ngay_lam },
      select: { id: true }
    });
    if (trung) throw new ConflictException("Nhân viên đã được xếp ca này trong ngày đã chọn");

    await this.db.phanCa.update({
      where: { id },
      data: {
        nhan_vien_id,
        ca_lam_viec_id,
        ngay_lam,
        trang_thai: dto.trang_thai as TrangThaiPhanCa | undefined,
        ghi_chu: dto.ghi_chu !== undefined ? dto.ghi_chu.trim() || null : undefined
      }
    });
    const da_cap_nhat = await this.db.phanCa.findUniqueOrThrow({
      where: { id },
      include: {
        nhan_vien: { include: { nguoi_dung: { select: { ho_ten: true, thu_dien_tu: true } } } },
        ca_lam_viec: true
      }
    });
    const truoc = { nhan_vien_id: hien_tai.nhan_vien_id, ca_lam_viec_id: hien_tai.ca_lam_viec_id, ngay_lam: hien_tai.ngay_lam.toISOString().slice(0, 10), trang_thai: hien_tai.trang_thai, ghi_chu: hien_tai.ghi_chu };
    const sau = { nhan_vien_id: da_cap_nhat.nhan_vien_id, ca_lam_viec_id: da_cap_nhat.ca_lam_viec_id, ngay_lam: da_cap_nhat.ngay_lam.toISOString().slice(0, 10), trang_thai: da_cap_nhat.trang_thai, ghi_chu: da_cap_nhat.ghi_chu };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_PHAN_CA", nguoi_dung_id: actor.id, chi_tiet: { phan_ca_id: id, truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } });
    return da_cap_nhat;
  }

  async xoa_phan_ca(actor: NguoiDungXacThuc, id: string) {
    const da_co = await this.db.phanCa.findUnique({ where: { id }, select: { id: true, nhan_vien_id: true, ca_lam_viec_id: true, ngay_lam: true } });
    if (!da_co) throw new NotFoundException("Không tìm thấy phân ca");
    await this.db.phanCa.delete({ where: { id } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_PHAN_CA", nguoi_dung_id: actor.id, chi_tiet: { phan_ca_id: id, nhan_vien_id: da_co.nhan_vien_id, ca_lam_viec_id: da_co.ca_lam_viec_id, ngay_lam: da_co.ngay_lam.toISOString().slice(0, 10) } } });
    return { thong_bao: "Đã xóa phân ca" };
  }

  async danh_sach_don_hang(trang_thai?: string, tim_kiem?: string) {
    const status = trang_thai?.trim();
    if (status && !Object.values(TrangThaiDonHang).includes(status as TrangThaiDonHang)) throw new BadRequestException("Trạng thái đơn hàng không hợp lệ");
    const q = tim_kiem?.trim();
    if (q && q.length > 120) throw new BadRequestException("Từ khóa tối đa 120 ký tự");
    const ds = await this.db.donHang.findMany({
      where: {
        ...(status ? { trang_thai: status as TrangThaiDonHang } : {}),
        ...(q ? { OR: [
          { ma_don_hang: { contains: q, mode: "insensitive" } },
          { ho_ten_nguoi_nhan: { contains: q, mode: "insensitive" } },
          { so_dien_thoai: { contains: q } },
          { nguoi_dung: { thu_dien_tu: { contains: q, mode: "insensitive" } } }
        ] } : {})
      },
      include: {
        nguoi_dung: { select: { id: true, thu_dien_tu: true, ho_ten: true } },
        chi_tiet: { select: { so_luong: true } },
        thanh_toan: { orderBy: { ngay_tao: "desc" }, select: { trang_thai: true, ma_giao_dich: true } }
      },
      orderBy: { ngay_tao: "desc" },
      take: 250
    });
    return ds.map(item => ({
      id: item.id,
      ma_don_hang: item.ma_don_hang,
      ho_ten_nguoi_nhan: item.ho_ten_nguoi_nhan,
      so_dien_thoai: item.so_dien_thoai,
      tong_tien: Number(item.tong_tien),
      trang_thai: item.trang_thai,
      ngay_tao: item.ngay_tao,
      ngay_cap_nhat: item.ngay_cap_nhat,
      khach_hang: item.nguoi_dung,
      so_mat_hang: item.chi_tiet.length,
      tong_so_luong: item.chi_tiet.reduce((sum, x) => sum + x.so_luong, 0),
      thanh_toan: item.thanh_toan.find(tt => tt.trang_thai === TrangThaiThanhToan.DA_THANH_TOAN) || item.thanh_toan[0] || null
    }));
  }

  async chi_tiet_don_hang(id: string) {
    const item = await this.db.donHang.findUnique({
      where: { id },
      include: {
        nguoi_dung: { select: { id: true, thu_dien_tu: true, ho_ten: true, so_dien_thoai: true } },
        chi_tiet: { orderBy: { id: "asc" } },
        thanh_toan: { include: { phuong_thuc: true }, orderBy: { ngay_tao: "desc" } },
        lich_su: { include: { nguoi_thuc_hien: { select: { id: true, ho_ten: true, thu_dien_tu: true, vai_tro: true } } }, orderBy: { ngay_tao: "desc" } }
      }
    });
    if (!item) throw new NotFoundException("Không tìm thấy đơn hàng");
    return {
      id: item.id, ma_don_hang: item.ma_don_hang, ho_ten_nguoi_nhan: item.ho_ten_nguoi_nhan, so_dien_thoai: item.so_dien_thoai,
      dia_chi_giao_hang: item.dia_chi_giao_hang, ghi_chu: item.ghi_chu, tong_tien: Number(item.tong_tien), trang_thai: item.trang_thai,
      ngay_tao: item.ngay_tao, ngay_cap_nhat: item.ngay_cap_nhat, khach_hang: item.nguoi_dung, so_mat_hang: item.chi_tiet.length, tong_so_luong: item.chi_tiet.reduce((sum, x) => sum + x.so_luong, 0),
      chi_tiet: item.chi_tiet.map(ct => ({ ...ct, don_gia: Number(ct.don_gia), thanh_tien: Number(ct.thanh_tien) })),
      thanh_toan: item.thanh_toan.map(tt => ({ ...tt, so_tien: Number(tt.so_tien) })),
      lich_su: item.lich_su.map(ls => ({ ...ls, id: ls.id.toString() }))
    };
  }

  async cap_nhat_trang_thai_don_hang(actor: NguoiDungXacThuc, id: string, dto: CapNhatTrangThaiDonHangDto) {
    const hien_tai = await this.db.donHang.findUnique({
      where: { id },
      include: {
        chi_tiet: true,
        thanh_toan: { include: { phuong_thuc: true }, orderBy: { ngay_tao: "desc" } }
      }
    });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy đơn hàng");
    const trang_thai_moi = dto.trang_thai as TrangThaiDonHang;
    const thanh_toan_hien_tai = hien_tai.thanh_toan[0] || null;
    const thanh_toan_da_ghi_nhan = hien_tai.thanh_toan.find(tt => tt.trang_thai === TrangThaiThanhToan.DA_THANH_TOAN) || null;
    // v3.3.2: không giả định giao dịch mới nhất là giao dịch cần chốt. Một đơn có thể
    // có lần thanh toán thất bại mới hơn nhưng vẫn còn giao dịch COD/CHO_THANH_TOAN hợp lệ.
    // Ưu tiên COD đang chờ, sau đó mới lấy bất kỳ giao dịch đang chờ nào.
    const thanh_toan_can_chot = hien_tai.thanh_toan.find(tt =>
      tt.trang_thai === TrangThaiThanhToan.CHO_THANH_TOAN && tt.phuong_thuc.ma_phuong_thuc === "COD"
    ) || hien_tai.thanh_toan.find(tt => tt.trang_thai === TrangThaiThanhToan.CHO_THANH_TOAN) || null;
    // Cho phép Admin bấm lưu lại đơn đã giao/hoàn tất cũ nếu vẫn còn giao dịch chờ thanh toán.
    // Trường hợp này không đổi trạng thái đơn, chỉ chốt thanh toán để doanh thu được ghi nhận.
    const chi_xac_nhan_doanh_thu = hien_tai.trang_thai === trang_thai_moi
      && trang_thai_moi === TrangThaiDonHang.HOAN_TAT
      && !thanh_toan_da_ghi_nhan
      && Boolean(thanh_toan_can_chot);
    if (hien_tai.trang_thai === trang_thai_moi && !chi_xac_nhan_doanh_thu) {
      const chi_tiet = await this.chi_tiet_don_hang(id);
      return {
        ...chi_tiet,
        cap_nhat_doanh_thu: {
          da_ghi_nhan_moi: false,
          da_co_tu_truoc: Boolean(thanh_toan_da_ghi_nhan),
          so_tien: Number(thanh_toan_da_ghi_nhan?.so_tien || thanh_toan_can_chot?.so_tien || thanh_toan_hien_tai?.so_tien || hien_tai.tong_tien),
          ngay_ghi_nhan: thanh_toan_da_ghi_nhan?.ngay_thanh_toan || null
        }
      };
    }

    const chuyenHopLe: Record<TrangThaiDonHang, TrangThaiDonHang[]> = {
      CHO_XAC_NHAN: [TrangThaiDonHang.DA_XAC_NHAN, TrangThaiDonHang.DA_HUY],
      DA_XAC_NHAN: [TrangThaiDonHang.DANG_SAN_XUAT, TrangThaiDonHang.DA_HUY],
      DANG_SAN_XUAT: [TrangThaiDonHang.DANG_GIAO, TrangThaiDonHang.DA_HUY],
      DANG_GIAO: [TrangThaiDonHang.HOAN_TAT],
      HOAN_TAT: [],
      DA_HUY: []
    };
    // v3.2.1: Admin có quyền xác nhận ĐÃ GIAO/HOÀN TẤT trực tiếp từ mọi trạng thái.
    // Các chuyển trạng thái khác vẫn tuân thủ quy trình tuyến tính để tránh thay đổi nhầm.
    const admin_xac_nhan_da_giao = trang_thai_moi === TrangThaiDonHang.HOAN_TAT && hien_tai.trang_thai !== TrangThaiDonHang.HOAN_TAT;
    if (!chi_xac_nhan_doanh_thu && !admin_xac_nhan_da_giao && !chuyenHopLe[hien_tai.trang_thai].includes(trang_thai_moi)) {
      throw new BadRequestException(`Không thể chuyển đơn từ ${hien_tai.trang_thai} sang ${trang_thai_moi}`);
    }

    let thanh_toan_duoc_ghi_nhan = false;
    await this.db.$transaction(async tx => {
      if (trang_thai_moi === TrangThaiDonHang.DA_HUY && hien_tai.trang_thai !== TrangThaiDonHang.DA_HUY) {
        for (const ct of hien_tai.chi_tiet) {
          const tuy_chon = ct.tuy_chon as Record<string, unknown>;
          const ma_bien_the = typeof tuy_chon?.ma_bien_the === "string" ? tuy_chon.ma_bien_the : undefined;
          if (ma_bien_the) {
            await tx.bienTheSanPham.updateMany({ where: { ma_bien_the }, data: { so_luong_ton: { increment: ct.so_luong } } });
          }
        }
      }
      // Nếu Admin khôi phục một đơn đã hủy rồi xác nhận đã giao, đơn đã từng hoàn tồn kho khi hủy.
      // Vì vậy cần trừ lại tồn kho trong cùng transaction; không cho âm kho.
      if (hien_tai.trang_thai === TrangThaiDonHang.DA_HUY && trang_thai_moi === TrangThaiDonHang.HOAN_TAT) {
        for (const ct of hien_tai.chi_tiet) {
          const tuy_chon = ct.tuy_chon as Record<string, unknown>;
          const ma_bien_the = typeof tuy_chon?.ma_bien_the === "string" ? tuy_chon.ma_bien_the : undefined;
          if (!ma_bien_the) continue;
          const cap_nhat = await tx.bienTheSanPham.updateMany({
            where: { ma_bien_the, so_luong_ton: { gte: ct.so_luong } },
            data: { so_luong_ton: { decrement: ct.so_luong } }
          });
          if (cap_nhat.count !== 1) throw new BadRequestException(`Không đủ tồn kho để khôi phục đơn đã hủy: ${ma_bien_the}`);
        }
      }
      // Khi Admin xác nhận đã giao/hoàn tất, chốt đúng một giao dịch đang chờ hợp lệ.
      // Ưu tiên COD; không để một giao dịch THAT_BAI mới hơn che khuất giao dịch cần thu tiền.
      if (trang_thai_moi === TrangThaiDonHang.HOAN_TAT && !thanh_toan_da_ghi_nhan && thanh_toan_can_chot) {
        await tx.thanhToan.update({
          where: { id: thanh_toan_can_chot.id },
          data: {
            trang_thai: TrangThaiThanhToan.DA_THANH_TOAN,
            ngay_thanh_toan: new Date(),
            noi_dung: `${thanh_toan_can_chot.noi_dung || hien_tai.ma_don_hang} · Admin xác nhận đã giao/hoàn tất`
          }
        });
        thanh_toan_duoc_ghi_nhan = true;
      }
      if (hien_tai.trang_thai !== trang_thai_moi) {
        await tx.donHang.update({ where: { id }, data: { trang_thai: trang_thai_moi } });
      }
      await tx.lichSuDonHang.create({
        data: {
          don_hang_id: id,
          nguoi_thuc_hien_id: actor.id,
          trang_thai_cu: hien_tai.trang_thai,
          trang_thai_moi,
          ghi_chu: dto.ghi_chu?.trim() || (thanh_toan_duoc_ghi_nhan
            ? (chi_xac_nhan_doanh_thu ? "Xác nhận thanh toán cho đơn đã giao; doanh thu được ghi nhận." : "Đã giao/hoàn tất; hệ thống xác nhận thanh toán và ghi nhận doanh thu.")
            : null)
        }
      });
    });
    const truoc = { trang_thai: hien_tai.trang_thai, thanh_toan: thanh_toan_da_ghi_nhan?.trang_thai || thanh_toan_hien_tai?.trang_thai || null };
    const sau = { trang_thai: trang_thai_moi, thanh_toan: thanh_toan_duoc_ghi_nhan || thanh_toan_da_ghi_nhan ? TrangThaiThanhToan.DA_THANH_TOAN : (thanh_toan_hien_tai?.trang_thai || null) };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_DON_HANG", nguoi_dung_id: actor.id, chi_tiet: { don_hang_id: id, ma_don_hang: hien_tai.ma_don_hang, truoc, sau, thay_doi: this.tao_diff(truoc, sau), ghi_chu: dto.ghi_chu?.trim() || null, thanh_toan_duoc_ghi_nhan, chi_xac_nhan_doanh_thu, phuong_thuc: (thanh_toan_da_ghi_nhan || thanh_toan_can_chot || thanh_toan_hien_tai)?.phuong_thuc.ma_phuong_thuc || null } } });
    const chi_tiet = await this.chi_tiet_don_hang(id);
    const fallback_legacy_moi = hien_tai.thanh_toan.length === 0 && hien_tai.trang_thai !== TrangThaiDonHang.HOAN_TAT && trang_thai_moi === TrangThaiDonHang.HOAN_TAT;
    const giao_dich_da_ghi_nhan_sau = chi_tiet.thanh_toan.find(tt => tt.trang_thai === TrangThaiThanhToan.DA_THANH_TOAN) || null;
    const giao_dich_hien_thi_sau = giao_dich_da_ghi_nhan_sau || chi_tiet.thanh_toan[0] || null;
    return {
      ...chi_tiet,
      cap_nhat_doanh_thu: {
        da_ghi_nhan_moi: thanh_toan_duoc_ghi_nhan || fallback_legacy_moi,
        da_co_tu_truoc: !thanh_toan_duoc_ghi_nhan && Boolean(thanh_toan_da_ghi_nhan),
        so_tien: Number((thanh_toan_da_ghi_nhan || giao_dich_da_ghi_nhan_sau || giao_dich_hien_thi_sau)?.so_tien || hien_tai.tong_tien),
        ngay_ghi_nhan: thanh_toan_da_ghi_nhan?.ngay_thanh_toan || giao_dich_da_ghi_nhan_sau?.ngay_thanh_toan || (fallback_legacy_moi ? chi_tiet.ngay_cap_nhat : null),
        nguon: thanh_toan_duoc_ghi_nhan ? "CHOT_KHI_GIAO" : thanh_toan_da_ghi_nhan ? "DA_THANH_TOAN_TRUOC" : fallback_legacy_moi ? "LEGACY_KHONG_GIAO_DICH" : "KHONG_PHAT_SINH"
      }
    };
  }


  async doi_soat_doanh_thu_don_da_giao(actor: NguoiDungXacThuc) {
    // v3.3.2: sửa dữ liệu vận hành đã tồn tại trước bản vá. Chỉ xét đơn đã giao
    // chưa có bất kỳ giao dịch DA_THANH_TOAN nào nhưng còn giao dịch CHO_THANH_TOAN.
    const ds = await this.db.donHang.findMany({
      where: {
        trang_thai: TrangThaiDonHang.HOAN_TAT,
        thanh_toan: {
          none: { trang_thai: TrangThaiThanhToan.DA_THANH_TOAN },
          some: { trang_thai: TrangThaiThanhToan.CHO_THANH_TOAN }
        }
      },
      include: {
        thanh_toan: { include: { phuong_thuc: true }, orderBy: { ngay_tao: "desc" } }
      },
      orderBy: { ngay_cap_nhat: "desc" },
      take: 500
    });

    const da_cap_nhat: Array<{ id: string; ma_don_hang: string; so_tien: number; ma_giao_dich: string; phuong_thuc: string }> = [];
    await this.db.$transaction(async tx => {
      for (const don of ds) {
        const giao_dich = don.thanh_toan.find(tt => tt.trang_thai === TrangThaiThanhToan.CHO_THANH_TOAN && tt.phuong_thuc.ma_phuong_thuc === "COD")
          || don.thanh_toan.find(tt => tt.trang_thai === TrangThaiThanhToan.CHO_THANH_TOAN)
          || null;
        if (!giao_dich) continue;
        const ngay = new Date();
        const cap_nhat = await tx.thanhToan.updateMany({
          where: { id: giao_dich.id, trang_thai: TrangThaiThanhToan.CHO_THANH_TOAN },
          data: {
            trang_thai: TrangThaiThanhToan.DA_THANH_TOAN,
            ngay_thanh_toan: ngay,
            noi_dung: `${giao_dich.noi_dung || don.ma_don_hang} · Admin đối soát doanh thu đơn đã giao`
          }
        });
        if (cap_nhat.count !== 1) continue;
        da_cap_nhat.push({ id: don.id, ma_don_hang: don.ma_don_hang, so_tien: Number(giao_dich.so_tien), ma_giao_dich: giao_dich.ma_giao_dich, phuong_thuc: giao_dich.phuong_thuc.ma_phuong_thuc });
        await tx.lichSuDonHang.create({
          data: {
            don_hang_id: don.id,
            nguoi_thuc_hien_id: actor.id,
            trang_thai_cu: TrangThaiDonHang.HOAN_TAT,
            trang_thai_moi: TrangThaiDonHang.HOAN_TAT,
            ghi_chu: "Đối soát: chốt giao dịch chờ thanh toán của đơn đã giao và ghi nhận doanh thu."
          }
        });
      }
    });

    const tong_doanh_thu_bo_sung = da_cap_nhat.reduce((tong, item) => tong + item.so_tien, 0);
    await this.db.nhatKyBaoMat.create({
      data: {
        loai_su_kien: "ADMIN_DOI_SOAT_DOANH_THU_DON_DA_GIAO",
        nguoi_dung_id: actor.id,
        chi_tiet: this.chuan_hoa_json_object({
          so_don_quet: ds.length,
          so_don_cap_nhat: da_cap_nhat.length,
          tong_doanh_thu_bo_sung,
          don_hang: da_cap_nhat.slice(0, 50).map(item => ({ ma_don_hang: item.ma_don_hang, so_tien: item.so_tien, ma_giao_dich: item.ma_giao_dich, phuong_thuc: item.phuong_thuc }))
        })
      }
    });
    return {
      so_don_quet: ds.length,
      so_don_cap_nhat: da_cap_nhat.length,
      tong_doanh_thu_bo_sung,
      don_hang: da_cap_nhat.map(item => ({ ma_don_hang: item.ma_don_hang, so_tien: item.so_tien, phuong_thuc: item.phuong_thuc }))
    };
  }


  async danh_sach_danh_muc_quan_tri() {
    const ds = await this.db.danhMuc.findMany({
      include: { _count: { select: { san_pham: true } } },
      orderBy: [{ thu_tu: "asc" }, { ten_danh_muc: "asc" }]
    });
    return ds.map(x => ({ ...x, so_san_pham: x._count.san_pham, _count: undefined }));
  }

  async tao_danh_muc(actor: NguoiDungXacThuc, dto: TaoDanhMucDto) {
    const ma = dto.ma_danh_muc.trim().toUpperCase();
    const ten = dto.ten_danh_muc.trim();
    const trung = await this.db.danhMuc.findUnique({ where: { ma_danh_muc: ma }, select: { id: true } });
    if (trung) throw new ConflictException("Mã danh mục đã tồn tại");
    const item = await this.db.danhMuc.create({ data: {
      ma_danh_muc: ma, ten_danh_muc: ten, duong_dan: this.tao_duong_dan_danh_muc(ten, ma),
      mo_ta: dto.mo_ta?.trim() || null, thu_tu: dto.thu_tu ?? 0, dang_hien_thi: dto.dang_hien_thi ?? true
    } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_DANH_MUC", nguoi_dung_id: actor.id, chi_tiet: { danh_muc_id: item.id, ma_danh_muc: ma, ten_danh_muc: ten } } });
    return { ...item, so_san_pham: 0 };
  }

  async cap_nhat_danh_muc(actor: NguoiDungXacThuc, id: string, dto: CapNhatDanhMucDto) {
    const hien_tai = await this.db.danhMuc.findUnique({ where: { id }, include: { _count: { select: { san_pham: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy danh mục");
    const ten = dto.ten_danh_muc?.trim();
    const data = {
      ...(ten !== undefined ? { ten_danh_muc: ten, duong_dan: this.tao_duong_dan_danh_muc(ten, hien_tai.ma_danh_muc) } : {}),
      ...(dto.mo_ta !== undefined ? { mo_ta: dto.mo_ta.trim() || null } : {}),
      ...(dto.thu_tu !== undefined ? { thu_tu: dto.thu_tu } : {}),
      ...(dto.dang_hien_thi !== undefined ? { dang_hien_thi: dto.dang_hien_thi } : {})
    };
    if (!Object.keys(data).length) throw new BadRequestException("Không có dữ liệu danh mục để cập nhật");
    const item = await this.db.danhMuc.update({ where: { id }, data });
    const truoc = { ten_danh_muc: hien_tai.ten_danh_muc, mo_ta: hien_tai.mo_ta, thu_tu: hien_tai.thu_tu, dang_hien_thi: hien_tai.dang_hien_thi };
    const sau = { ten_danh_muc: item.ten_danh_muc, mo_ta: item.mo_ta, thu_tu: item.thu_tu, dang_hien_thi: item.dang_hien_thi };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_DANH_MUC", nguoi_dung_id: actor.id, chi_tiet: { danh_muc_id: id, ma_danh_muc: hien_tai.ma_danh_muc, truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } });
    return { ...item, so_san_pham: hien_tai._count.san_pham };
  }

  async xoa_danh_muc(actor: NguoiDungXacThuc, id: string) {
    const hien_tai = await this.db.danhMuc.findUnique({ where: { id }, include: { _count: { select: { san_pham: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy danh mục");
    if (hien_tai._count.san_pham > 0) throw new BadRequestException(`Danh mục đang có ${hien_tai._count.san_pham} sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.`);
    await this.db.danhMuc.delete({ where: { id } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_DANH_MUC", nguoi_dung_id: actor.id, chi_tiet: { danh_muc_id: id, ma_danh_muc: hien_tai.ma_danh_muc, ten_danh_muc: hien_tai.ten_danh_muc } } });
    return { thong_bao: `Đã xóa danh mục ${hien_tai.ten_danh_muc}`, id };
  }

  async danh_sach_vat_lieu_quan_tri() {
    const ds = await this.db.vatLieu.findMany({ include: { _count: { select: { bien_the: true } } }, orderBy: { ten_vat_lieu: "asc" } });
    return ds.map(x => ({ id: x.id, ma_vat_lieu: x.ma_vat_lieu, ten_vat_lieu: x.ten_vat_lieu, mo_ta: x.mo_ta, he_so_gia: Number(x.he_so_gia), so_bien_the: x._count.bien_the }));
  }

  async tao_vat_lieu(actor: NguoiDungXacThuc, dto: TaoVatLieuDto) {
    const ma_vat_lieu = dto.ma_vat_lieu.trim().toUpperCase();
    const trung = await this.db.vatLieu.findUnique({ where: { ma_vat_lieu }, select: { id: true } });
    if (trung) throw new ConflictException("Mã vật liệu đã tồn tại");
    const item = await this.db.vatLieu.create({ data: { ma_vat_lieu, ten_vat_lieu: dto.ten_vat_lieu.trim(), mo_ta: dto.mo_ta?.trim() || null, he_so_gia: dto.he_so_gia ?? 1 } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_VAT_LIEU", nguoi_dung_id: actor.id, chi_tiet: { vat_lieu_id: item.id, ma_vat_lieu, ten_vat_lieu: item.ten_vat_lieu } } });
    return { ...item, he_so_gia: Number(item.he_so_gia), so_bien_the: 0 };
  }

  async cap_nhat_vat_lieu(actor: NguoiDungXacThuc, id: string, dto: CapNhatVatLieuDto) {
    const hien_tai = await this.db.vatLieu.findUnique({ where: { id }, include: { _count: { select: { bien_the: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy vật liệu");
    const data = {
      ...(dto.ten_vat_lieu !== undefined ? { ten_vat_lieu: dto.ten_vat_lieu.trim() } : {}),
      ...(dto.mo_ta !== undefined ? { mo_ta: dto.mo_ta.trim() || null } : {}),
      ...(dto.he_so_gia !== undefined ? { he_so_gia: dto.he_so_gia } : {})
    };
    if (!Object.keys(data).length) throw new BadRequestException("Không có dữ liệu vật liệu để cập nhật");
    const item = await this.db.vatLieu.update({ where: { id }, data });
    const truoc = { ten_vat_lieu: hien_tai.ten_vat_lieu, mo_ta: hien_tai.mo_ta, he_so_gia: Number(hien_tai.he_so_gia) };
    const sau = { ten_vat_lieu: item.ten_vat_lieu, mo_ta: item.mo_ta, he_so_gia: Number(item.he_so_gia) };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_VAT_LIEU", nguoi_dung_id: actor.id, chi_tiet: { vat_lieu_id: id, ma_vat_lieu: hien_tai.ma_vat_lieu, truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } });
    return { ...item, he_so_gia: Number(item.he_so_gia), so_bien_the: hien_tai._count.bien_the };
  }

  async xoa_vat_lieu(actor: NguoiDungXacThuc, id: string) {
    const hien_tai = await this.db.vatLieu.findUnique({ where: { id }, include: { _count: { select: { bien_the: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy vật liệu");
    if (hien_tai._count.bien_the > 0) throw new BadRequestException(`Vật liệu đang được ${hien_tai._count.bien_the} biến thể sử dụng. Hãy đổi vật liệu của các biến thể trước khi xóa.`);
    await this.db.vatLieu.delete({ where: { id } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_VAT_LIEU", nguoi_dung_id: actor.id, chi_tiet: { vat_lieu_id: id, ma_vat_lieu: hien_tai.ma_vat_lieu, ten_vat_lieu: hien_tai.ten_vat_lieu } } });
    return { thong_bao: `Đã xóa vật liệu ${hien_tai.ten_vat_lieu}`, id };
  }

  async danh_sach_mau_sac_quan_tri() {
    const ds = await this.db.mauSac.findMany({ include: { _count: { select: { bien_the: true } } }, orderBy: { ten_mau: "asc" } });
    return ds.map(x => ({ id: x.id, ma_mau: x.ma_mau, ten_mau: x.ten_mau, ma_hex: x.ma_hex, so_bien_the: x._count.bien_the }));
  }

  async tao_mau_sac(actor: NguoiDungXacThuc, dto: TaoMauSacDto) {
    const ma_mau = dto.ma_mau.trim().toUpperCase();
    const trung = await this.db.mauSac.findUnique({ where: { ma_mau }, select: { id: true } });
    if (trung) throw new ConflictException("Mã màu đã tồn tại");
    const item = await this.db.mauSac.create({ data: { ma_mau, ten_mau: dto.ten_mau.trim(), ma_hex: dto.ma_hex.trim().toUpperCase() } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_MAU_SAC", nguoi_dung_id: actor.id, chi_tiet: { mau_sac_id: item.id, ma_mau, ten_mau: item.ten_mau, ma_hex: item.ma_hex } } });
    return { ...item, so_bien_the: 0 };
  }

  async cap_nhat_mau_sac(actor: NguoiDungXacThuc, id: string, dto: CapNhatMauSacDto) {
    const hien_tai = await this.db.mauSac.findUnique({ where: { id }, include: { _count: { select: { bien_the: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy màu sắc");
    const data = {
      ...(dto.ten_mau !== undefined ? { ten_mau: dto.ten_mau.trim() } : {}),
      ...(dto.ma_hex !== undefined ? { ma_hex: dto.ma_hex.trim().toUpperCase() } : {})
    };
    if (!Object.keys(data).length) throw new BadRequestException("Không có dữ liệu màu sắc để cập nhật");
    const item = await this.db.mauSac.update({ where: { id }, data });
    const truoc = { ten_mau: hien_tai.ten_mau, ma_hex: hien_tai.ma_hex };
    const sau = { ten_mau: item.ten_mau, ma_hex: item.ma_hex };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_MAU_SAC", nguoi_dung_id: actor.id, chi_tiet: { mau_sac_id: id, ma_mau: hien_tai.ma_mau, truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } });
    return { ...item, so_bien_the: hien_tai._count.bien_the };
  }

  async xoa_mau_sac(actor: NguoiDungXacThuc, id: string) {
    const hien_tai = await this.db.mauSac.findUnique({ where: { id }, include: { _count: { select: { bien_the: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy màu sắc");
    if (hien_tai._count.bien_the > 0) throw new BadRequestException(`Màu đang được ${hien_tai._count.bien_the} biến thể sử dụng. Hãy đổi màu của các biến thể trước khi xóa.`);
    await this.db.mauSac.delete({ where: { id } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_MAU_SAC", nguoi_dung_id: actor.id, chi_tiet: { mau_sac_id: id, ma_mau: hien_tai.ma_mau, ten_mau: hien_tai.ten_mau } } });
    return { thong_bao: `Đã xóa màu ${hien_tai.ten_mau}`, id };
  }

  async lich_su_dieu_chinh_ton_kho(loai?: string) {
    const ds = await this.db.nhatKyBaoMat.findMany({
      where: { loai_su_kien: { in: ["ADMIN_CAP_NHAT_TON_KHO", "ADMIN_CAP_NHAT_BIEN_THE"] } },
      orderBy: { ngay_tao: "desc" },
      take: 240
    });
    const co_thay_doi_ton = ds.flatMap(item => {
      const ct = item.chi_tiet as Record<string, unknown> | null;
      if (!ct || typeof ct.ton_cu !== "number" || typeof ct.ton_moi !== "number" || ct.ton_cu === ct.ton_moi) return [];
      const ton_cu = Number(ct.ton_cu);
      const ton_moi = Number(ct.ton_moi);
      const loai_bien_dong = typeof ct.loai_bien_dong === "string" ? ct.loai_bien_dong : this.phan_loai_bien_dong_kho(ton_cu, ton_moi);
      if (loai && loai !== loai_bien_dong) return [];
      return [{ item, ct, ton_cu, ton_moi, loai_bien_dong }];
    });
    const actorIds = [...new Set(co_thay_doi_ton.map(x => x.item.nguoi_dung_id).filter((x): x is string => Boolean(x)))];
    const actors = actorIds.length ? await this.db.nguoiDung.findMany({ where: { id: { in: actorIds } }, select: { id: true, ho_ten: true, thu_dien_tu: true } }) : [];
    const actorMap = new Map(actors.map(x => [x.id, x]));
    return co_thay_doi_ton.slice(0, 80).map(({ item, ct, ton_cu, ton_moi, loai_bien_dong }) => ({
      id: item.id.toString(),
      loai_su_kien: item.loai_su_kien,
      loai_bien_dong,
      ton_cu,
      ton_moi,
      chenh_lech: ton_moi - ton_cu,
      ly_do: typeof ct.ly_do === "string" && ct.ly_do.trim() ? ct.ly_do : "Điều chỉnh tồn kho",
      ma_bien_the: String(ct.ma_bien_the_moi || ct.ma_bien_the || ""),
      ma_san_pham: String(ct.ma_san_pham || ""),
      nguoi_thuc_hien: item.nguoi_dung_id ? actorMap.get(item.nguoi_dung_id) || null : null,
      chi_tiet: item.chi_tiet,
      ngay_tao: item.ngay_tao
    }));
  }

  async danh_sach_san_pham_quan_tri() {
    const ds = await this.db.sanPham.findMany({
      include: {
        danh_muc: { select: { id: true, ma_danh_muc: true, ten_danh_muc: true } },
        bien_the: { include: { vat_lieu: { select: { id: true, ten_vat_lieu: true } }, mau_sac: { select: { id: true, ten_mau: true, ma_hex: true } } }, orderBy: { ma_bien_the: "asc" } },
        hinh_anh: { where: { la_anh_chinh: true }, take: 1, select: { duong_dan_anh: true } }
      },
      orderBy: { ma_san_pham: "asc" }
    });
    return ds
      .filter(item => !item.nguon_tham_khao?.startsWith("__ADMIN_DELETED__:"))
      .map(item => ({
        ...item,
        gia_ban: Number(item.gia_ban),
        gia_von: item.gia_von == null ? null : Number(item.gia_von),
        khoi_luong_gam: item.khoi_luong_gam == null ? null : Number(item.khoi_luong_gam),
        thoi_gian_in_gio: item.thoi_gian_in_gio == null ? null : Number(item.thoi_gian_in_gio)
      }));
  }

  async tao_san_pham_quan_tri(actor: NguoiDungXacThuc, dto: TaoSanPhamQuanTriDto) {
    const ma_san_pham = dto.ma_san_pham.trim().toUpperCase();
    const ten_san_pham = dto.ten_san_pham.trim();
    const anh = this.anh_data_url_hop_le(dto.anh_chinh_data_url);
    const [trung, danh_muc] = await Promise.all([
      this.db.sanPham.findUnique({ where: { ma_san_pham }, select: { id: true } }),
      this.db.danhMuc.findUnique({ where: { id: dto.danh_muc_id }, select: { id: true } })
    ]);
    if (trung) throw new ConflictException("Mã sản phẩm đã tồn tại");
    if (!danh_muc) throw new BadRequestException("Danh mục sản phẩm không hợp lệ");

    const duong_dan = this.tao_duong_dan_san_pham(ten_san_pham, ma_san_pham);
    const da_tao = await this.db.$transaction(async tx => {
      const sp = await tx.sanPham.create({
        data: {
          ma_san_pham, ten_san_pham, duong_dan,
          mo_ta_ngan: dto.mo_ta_ngan?.trim() || null,
          gia_ban: dto.gia_ban,
          kich_thuoc: dto.kich_thuoc?.trim() || null,
          khoi_luong_gam: dto.khoi_luong_gam ?? null,
          thoi_gian_in_gio: dto.thoi_gian_in_gio ?? null,
          danh_muc_id: dto.danh_muc_id,
          trang_thai: (dto.trang_thai || "DANG_BAN") as TrangThaiSanPham,
          trang_thai_nguon: TrangThaiNguon.DUOC_PHEP_KINH_DOANH,
          nguon_tham_khao: null,
          thong_so: { tao_boi_admin: true, anh_chuan_hoa: "1000x800" }
        }
      });
      await tx.hinhAnhSanPham.create({ data: { san_pham_id: sp.id, duong_dan_anh: anh, mo_ta_anh: `Ảnh chính ${ten_san_pham}`, la_anh_chinh: true } });
      await tx.bienTheSanPham.create({ data: { san_pham_id: sp.id, ma_bien_the: `${ma_san_pham}-BT01`, so_luong_ton: dto.so_luong_ton, dang_hien_thi: true } });
      return sp;
    });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_SAN_PHAM", nguoi_dung_id: actor.id, chi_tiet: { san_pham_id: da_tao.id, ma_san_pham, ten_san_pham, so_luong_ton: dto.so_luong_ton } } });
    return (await this.danh_sach_san_pham_quan_tri()).find(x => x.id === da_tao.id)!;
  }

  async cap_nhat_san_pham_quan_tri(actor: NguoiDungXacThuc, id: string, dto: CapNhatSanPhamQuanTriDto) {
    const hien_tai = await this.db.sanPham.findUnique({ where: { id }, select: { id: true, ma_san_pham: true, ten_san_pham: true, danh_muc_id: true, mo_ta_ngan: true, gia_ban: true, kich_thuoc: true, khoi_luong_gam: true, thoi_gian_in_gio: true, trang_thai: true, nguon_tham_khao: true } });
    if (!hien_tai || hien_tai.nguon_tham_khao?.startsWith("__ADMIN_DELETED__:")) throw new NotFoundException("Không tìm thấy sản phẩm");

    if (dto.danh_muc_id) {
      const dm = await this.db.danhMuc.findUnique({ where: { id: dto.danh_muc_id }, select: { id: true } });
      if (!dm) throw new BadRequestException("Danh mục sản phẩm không hợp lệ");
    }
    const anh = dto.anh_chinh_data_url ? this.anh_data_url_hop_le(dto.anh_chinh_data_url) : undefined;
    const data = {
      ...(dto.ten_san_pham !== undefined ? { ten_san_pham: dto.ten_san_pham.trim() } : {}),
      ...(dto.danh_muc_id !== undefined ? { danh_muc_id: dto.danh_muc_id } : {}),
      ...(dto.mo_ta_ngan !== undefined ? { mo_ta_ngan: dto.mo_ta_ngan.trim() || null } : {}),
      ...(dto.gia_ban !== undefined ? { gia_ban: dto.gia_ban } : {}),
      ...(dto.kich_thuoc !== undefined ? { kich_thuoc: dto.kich_thuoc.trim() || null } : {}),
      ...(dto.khoi_luong_gam !== undefined ? { khoi_luong_gam: dto.khoi_luong_gam } : {}),
      ...(dto.thoi_gian_in_gio !== undefined ? { thoi_gian_in_gio: dto.thoi_gian_in_gio } : {}),
      ...(dto.trang_thai !== undefined ? { trang_thai: dto.trang_thai as TrangThaiSanPham } : {})
    };
    if (!Object.keys(data).length && !anh) throw new BadRequestException("Không có dữ liệu sản phẩm để cập nhật");

    await this.db.$transaction(async tx => {
      if (Object.keys(data).length) await tx.sanPham.update({ where: { id }, data });
      if (anh) {
        await tx.hinhAnhSanPham.deleteMany({ where: { san_pham_id: id, la_anh_chinh: true } });
        await tx.hinhAnhSanPham.create({ data: { san_pham_id: id, duong_dan_anh: anh, mo_ta_anh: `Ảnh chính ${dto.ten_san_pham?.trim() || hien_tai.ten_san_pham}`, la_anh_chinh: true } });
      }
    });
    const da_cap_nhat = (await this.danh_sach_san_pham_quan_tri()).find(x => x.id === id)!;
    const truoc = { ten_san_pham: hien_tai.ten_san_pham, danh_muc_id: hien_tai.danh_muc_id, mo_ta_ngan: hien_tai.mo_ta_ngan, gia_ban: Number(hien_tai.gia_ban), kich_thuoc: hien_tai.kich_thuoc, khoi_luong_gam: hien_tai.khoi_luong_gam, thoi_gian_in_gio: hien_tai.thoi_gian_in_gio, trang_thai: hien_tai.trang_thai };
    const sau = { ten_san_pham: da_cap_nhat.ten_san_pham, danh_muc_id: da_cap_nhat.danh_muc.id, mo_ta_ngan: da_cap_nhat.mo_ta_ngan, gia_ban: da_cap_nhat.gia_ban, kich_thuoc: da_cap_nhat.kich_thuoc, khoi_luong_gam: da_cap_nhat.khoi_luong_gam, thoi_gian_in_gio: da_cap_nhat.thoi_gian_in_gio, trang_thai: da_cap_nhat.trang_thai };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_SAN_PHAM", nguoi_dung_id: actor.id, chi_tiet: { san_pham_id: id, ma_san_pham: hien_tai.ma_san_pham, truoc, sau, thay_doi: this.tao_diff(truoc, sau), da_doi_anh: Boolean(anh) } } });
    return da_cap_nhat;
  }

  async xoa_san_pham_quan_tri(actor: NguoiDungXacThuc, id: string) {
    const hien_tai = await this.db.sanPham.findUnique({ where: { id }, include: { bien_the: { select: { id: true } } } });
    if (!hien_tai || hien_tai.nguon_tham_khao?.startsWith("__ADMIN_DELETED__:")) throw new NotFoundException("Không tìm thấy sản phẩm");
    const bien_the_ids = hien_tai.bien_the.map(x => x.id);
    const la_du_lieu_mau = Boolean(hien_tai.nguon_tham_khao);
    await this.db.$transaction(async tx => {
      if (bien_the_ids.length) await tx.chiTietGioHang.deleteMany({ where: { bien_the_id: { in: bien_the_ids } } });
      if (la_du_lieu_mau) {
        await tx.sanPham.update({ where: { id }, data: { trang_thai: TrangThaiSanPham.NGUNG_BAN, nguon_tham_khao: `__ADMIN_DELETED__:${hien_tai.nguon_tham_khao}` } });
      } else {
        await tx.sanPham.delete({ where: { id } });
      }
    });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_SAN_PHAM", nguoi_dung_id: actor.id, chi_tiet: { san_pham_id: id, ma_san_pham: hien_tai.ma_san_pham, ten_san_pham: hien_tai.ten_san_pham, kieu_xoa: la_du_lieu_mau ? "an_vinh_vien_du_lieu_mau" : "xoa_vat_ly" } } });
    return { thong_bao: `Đã xóa sản phẩm ${hien_tai.ma_san_pham}`, id };
  }

  async cap_nhat_ton_kho(actor: NguoiDungXacThuc, id: string, dto: CapNhatTonKhoDto) {
    const hien_tai = await this.db.bienTheSanPham.findUnique({ where: { id }, include: { san_pham: { select: { ma_san_pham: true, ten_san_pham: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy biến thể sản phẩm");
    const da_cap_nhat = await this.db.bienTheSanPham.update({ where: { id }, data: { so_luong_ton: dto.so_luong_ton, dang_hien_thi: dto.dang_hien_thi ?? hien_tai.dang_hien_thi }, include: { vat_lieu: true, mau_sac: true } });
    const loai_bien_dong = this.phan_loai_bien_dong_kho(hien_tai.so_luong_ton, da_cap_nhat.so_luong_ton);
    const truoc = { so_luong_ton: hien_tai.so_luong_ton, dang_hien_thi: hien_tai.dang_hien_thi };
    const sau = { so_luong_ton: da_cap_nhat.so_luong_ton, dang_hien_thi: da_cap_nhat.dang_hien_thi };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_TON_KHO", nguoi_dung_id: actor.id, chi_tiet: { bien_the_id: id, ma_bien_the: hien_tai.ma_bien_the, ma_san_pham: hien_tai.san_pham.ma_san_pham, ton_cu: hien_tai.so_luong_ton, ton_moi: da_cap_nhat.so_luong_ton, hien_thi: da_cap_nhat.dang_hien_thi, truoc, sau, thay_doi: this.tao_diff(truoc, sau), chenh_lech: da_cap_nhat.so_luong_ton - hien_tai.so_luong_ton, loai_bien_dong, ly_do: dto.ly_do?.trim() || "Điều chỉnh tồn kho" } } });
    return da_cap_nhat;
  }


  async tao_bien_the(actor: NguoiDungXacThuc, san_pham_id: string, dto: TaoBienTheDto) {
    const ma = dto.ma_bien_the.trim().toUpperCase();
    const [sp, trung, vat_lieu, mau_sac] = await Promise.all([
      this.db.sanPham.findUnique({ where: { id: san_pham_id }, select: { id: true, ma_san_pham: true, nguon_tham_khao: true } }),
      this.db.bienTheSanPham.findUnique({ where: { ma_bien_the: ma }, select: { id: true } }),
      dto.vat_lieu_id ? this.db.vatLieu.findUnique({ where: { id: dto.vat_lieu_id }, select: { id: true } }) : Promise.resolve(null),
      dto.mau_sac_id ? this.db.mauSac.findUnique({ where: { id: dto.mau_sac_id }, select: { id: true } }) : Promise.resolve(null)
    ]);
    if (!sp || sp.nguon_tham_khao?.startsWith("__ADMIN_DELETED__:")) throw new NotFoundException("Không tìm thấy sản phẩm");
    if (trung) throw new ConflictException("Mã biến thể đã tồn tại");
    if (dto.vat_lieu_id && !vat_lieu) throw new BadRequestException("Vật liệu không hợp lệ");
    if (dto.mau_sac_id && !mau_sac) throw new BadRequestException("Màu sắc không hợp lệ");
    const item = await this.db.bienTheSanPham.create({ data: {
      san_pham_id, ma_bien_the: ma, vat_lieu_id: dto.vat_lieu_id || null, mau_sac_id: dto.mau_sac_id || null,
      gia_chenh_lech: dto.gia_chenh_lech ?? 0, so_luong_ton: dto.so_luong_ton, dang_hien_thi: dto.dang_hien_thi ?? true
    }, include: { vat_lieu: true, mau_sac: true } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_TAO_BIEN_THE", nguoi_dung_id: actor.id, chi_tiet: { san_pham_id, ma_san_pham: sp.ma_san_pham, bien_the_id: item.id, ma_bien_the: ma } } });
    return { ...item, gia_chenh_lech: Number(item.gia_chenh_lech) };
  }

  async cap_nhat_bien_the(actor: NguoiDungXacThuc, id: string, dto: CapNhatBienTheDto) {
    const hien_tai = await this.db.bienTheSanPham.findUnique({ where: { id }, include: { san_pham: { select: { id: true, ma_san_pham: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy biến thể");
    if (dto.ma_bien_the !== undefined) {
      const ma = dto.ma_bien_the.trim().toUpperCase();
      const trung = await this.db.bienTheSanPham.findFirst({ where: { ma_bien_the: ma, id: { not: id } }, select: { id: true } });
      if (trung) throw new ConflictException("Mã biến thể đã tồn tại");
    }
    if (dto.vat_lieu_id) {
      const x = await this.db.vatLieu.findUnique({ where: { id: dto.vat_lieu_id }, select: { id: true } });
      if (!x) throw new BadRequestException("Vật liệu không hợp lệ");
    }
    if (dto.mau_sac_id) {
      const x = await this.db.mauSac.findUnique({ where: { id: dto.mau_sac_id }, select: { id: true } });
      if (!x) throw new BadRequestException("Màu sắc không hợp lệ");
    }
    if (dto.ton_toi_thieu !== undefined || dto.ton_toi_da !== undefined) {
      const min = dto.ton_toi_thieu ?? hien_tai.ton_toi_thieu;
      const max = dto.ton_toi_da ?? hien_tai.ton_toi_da;
      if (max > 0 && max < min) throw new BadRequestException("Tồn tối đa phải bằng 0 (không cấu hình) hoặc lớn hơn hoặc bằng tồn tối thiểu");
    }
    const data = {
      ...(dto.ma_bien_the !== undefined ? { ma_bien_the: dto.ma_bien_the.trim().toUpperCase() } : {}),
      ...(dto.vat_lieu_id !== undefined ? { vat_lieu_id: dto.vat_lieu_id || null } : {}),
      ...(dto.mau_sac_id !== undefined ? { mau_sac_id: dto.mau_sac_id || null } : {}),
      ...(dto.gia_chenh_lech !== undefined ? { gia_chenh_lech: dto.gia_chenh_lech } : {}),
      ...(dto.so_luong_ton !== undefined ? { so_luong_ton: dto.so_luong_ton } : {}),
      ...(dto.ton_toi_thieu !== undefined ? { ton_toi_thieu: dto.ton_toi_thieu } : {}),
      ...(dto.ton_toi_da !== undefined ? { ton_toi_da: dto.ton_toi_da } : {}),
      ...(dto.dang_hien_thi !== undefined ? { dang_hien_thi: dto.dang_hien_thi } : {})
    };
    if (!Object.keys(data).length) throw new BadRequestException("Không có dữ liệu biến thể để cập nhật");
    const item = await this.db.bienTheSanPham.update({ where: { id }, data, include: { vat_lieu: true, mau_sac: true } });
    const loai_bien_dong = this.phan_loai_bien_dong_kho(hien_tai.so_luong_ton, item.so_luong_ton);
    const truoc = { ma_bien_the: hien_tai.ma_bien_the, vat_lieu_id: hien_tai.vat_lieu_id, mau_sac_id: hien_tai.mau_sac_id, gia_chenh_lech: Number(hien_tai.gia_chenh_lech), so_luong_ton: hien_tai.so_luong_ton, ton_toi_thieu: hien_tai.ton_toi_thieu, ton_toi_da: hien_tai.ton_toi_da, dang_hien_thi: hien_tai.dang_hien_thi };
    const sau = { ma_bien_the: item.ma_bien_the, vat_lieu_id: item.vat_lieu_id, mau_sac_id: item.mau_sac_id, gia_chenh_lech: Number(item.gia_chenh_lech), so_luong_ton: item.so_luong_ton, ton_toi_thieu: item.ton_toi_thieu, ton_toi_da: item.ton_toi_da, dang_hien_thi: item.dang_hien_thi };
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_BIEN_THE", nguoi_dung_id: actor.id, chi_tiet: { bien_the_id: id, san_pham_id: hien_tai.san_pham.id, ma_san_pham: hien_tai.san_pham.ma_san_pham, ma_bien_the_cu: hien_tai.ma_bien_the, ma_bien_the_moi: item.ma_bien_the, ton_cu: hien_tai.so_luong_ton, ton_moi: item.so_luong_ton, ton_toi_thieu_cu: hien_tai.ton_toi_thieu, ton_toi_thieu_moi: item.ton_toi_thieu, ton_toi_da_cu: hien_tai.ton_toi_da, ton_toi_da_moi: item.ton_toi_da, truoc, sau, thay_doi: this.tao_diff(truoc, sau), chenh_lech: item.so_luong_ton - hien_tai.so_luong_ton, loai_bien_dong, ly_do: dto.ly_do_ton_kho?.trim() || "Điều chỉnh biến thể" } } });
    return { ...item, gia_chenh_lech: Number(item.gia_chenh_lech) };
  }

  async xoa_bien_the(actor: NguoiDungXacThuc, id: string) {
    const hien_tai = await this.db.bienTheSanPham.findUnique({ where: { id }, include: { san_pham: { select: { id: true, ma_san_pham: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy biến thể");
    const so_bien_the = await this.db.bienTheSanPham.count({ where: { san_pham_id: hien_tai.san_pham_id } });
    if (so_bien_the <= 1) throw new BadRequestException("Sản phẩm phải còn ít nhất một biến thể. Hãy tạo biến thể mới trước khi xóa biến thể cuối cùng.");
    await this.db.$transaction(async tx => {
      await tx.chiTietGioHang.deleteMany({ where: { bien_the_id: id } });
      await tx.bienTheSanPham.delete({ where: { id } });
    });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_BIEN_THE", nguoi_dung_id: actor.id, chi_tiet: { bien_the_id: id, ma_bien_the: hien_tai.ma_bien_the, san_pham_id: hien_tai.san_pham.id, ma_san_pham: hien_tai.san_pham.ma_san_pham } } });
    return { thong_bao: `Đã xóa biến thể ${hien_tai.ma_bien_the}`, id };
  }

  async danh_sach_danh_gia_quan_tri(trang_thai?: string) {
    const where = trang_thai === "CHO_DUYET" ? { da_duyet: false } : trang_thai === "DA_DUYET" ? { da_duyet: true } : {};
    return this.db.danhGiaSanPham.findMany({
      where,
      include: { san_pham: { select: { id: true, ma_san_pham: true, ten_san_pham: true } } },
      orderBy: { ngay_tao: "desc" }, take: 300
    });
  }

  async cap_nhat_danh_gia(actor: NguoiDungXacThuc, id: string, dto: CapNhatDanhGiaDto) {
    const hien_tai = await this.db.danhGiaSanPham.findUnique({ where: { id }, include: { san_pham: { select: { ma_san_pham: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy đánh giá");
    const item = await this.db.danhGiaSanPham.update({ where: { id }, data: { da_duyet: dto.da_duyet }, include: { san_pham: { select: { id: true, ma_san_pham: true, ten_san_pham: true } } } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: dto.da_duyet ? "ADMIN_DUYET_DANH_GIA" : "ADMIN_AN_DANH_GIA", nguoi_dung_id: actor.id, chi_tiet: { danh_gia_id: id, ma_san_pham: hien_tai.san_pham.ma_san_pham, da_duyet: dto.da_duyet } } });
    return item;
  }

  async xoa_danh_gia(actor: NguoiDungXacThuc, id: string) {
    const hien_tai = await this.db.danhGiaSanPham.findUnique({ where: { id }, include: { san_pham: { select: { ma_san_pham: true } } } });
    if (!hien_tai) throw new NotFoundException("Không tìm thấy đánh giá");
    await this.db.danhGiaSanPham.delete({ where: { id } });
    await this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_XOA_DANH_GIA", nguoi_dung_id: actor.id, chi_tiet: { danh_gia_id: id, ma_san_pham: hien_tai.san_pham.ma_san_pham, ho_ten: hien_tai.ho_ten } } });
    return { thong_bao: "Đã xóa đánh giá", id };
  }

  private khoang_bao_cao(tu_ngay?: string, den_ngay?: string) {
    const hopLe = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));
    const nowVn = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const den = hopLe(den_ngay) ? den_ngay! : nowVn.toISOString().slice(0, 10);
    const d = new Date(`${den}T00:00:00+07:00`); d.setDate(d.getDate() - 29);
    const tu = hopLe(tu_ngay) ? tu_ngay! : new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (tu > den) throw new BadRequestException("Từ ngày không được lớn hơn đến ngày");
    const start = new Date(`${tu}T00:00:00+07:00`);
    const end = new Date(`${den}T00:00:00+07:00`); end.setDate(end.getDate() + 1);
    return { tu, den, start, end };
  }

  private async du_lieu_bao_cao(loai: string, tu_ngay?: string, den_ngay?: string) {
    const { tu, den, start, end } = this.khoang_bao_cao(tu_ngay, den_ngay);
    if (loai === "don-hang") {
      const ds = await this.db.donHang.findMany({ where: { ngay_tao: { gte: start, lt: end } }, orderBy: { ngay_tao: "asc" } });
      return {
        ten_goc: `don-hang_${tu}_${den}`,
        ten_sheet: "Đơn hàng",
        rows: [["Ngày", "Mã đơn", "Người nhận", "Số điện thoại", "Địa chỉ", "Trạng thái", "Tổng tiền"], ...ds.map(x => [x.ngay_tao.toISOString(), x.ma_don_hang, x.ho_ten_nguoi_nhan, x.so_dien_thoai, x.dia_chi_giao_hang, x.trang_thai, Number(x.tong_tien)])] as unknown[][]
      };
    }
    if (loai === "doanh-thu") {
      const ds = await this.db.donHang.findMany({
        where: {
          trang_thai: { not: TrangThaiDonHang.DA_HUY },
          OR: [
            { thanh_toan: { some: { trang_thai: TrangThaiThanhToan.DA_THANH_TOAN, ngay_thanh_toan: { gte: start, lt: end } } } },
            { trang_thai: TrangThaiDonHang.HOAN_TAT, ngay_cap_nhat: { gte: start, lt: end } }
          ]
        },
        orderBy: { ngay_tao: "asc" },
        select: {
          id: true, tong_tien: true, trang_thai: true, ngay_cap_nhat: true,
          thanh_toan: { orderBy: { ngay_tao: "desc" }, take: 1, select: { so_tien: true, ngay_thanh_toan: true, trang_thai: true } }
        }
      });
      const map = new Map<string, { so_don: number; doanh_thu: number }>();
      for (const x of ds) {
        const tt = x.thanh_toan[0];
        const daThanhToan = tt?.trang_thai === TrangThaiThanhToan.DA_THANH_TOAN;
        const fallbackLegacy = !tt && x.trang_thai === TrangThaiDonHang.HOAN_TAT;
        const ngayGhiNhan = daThanhToan ? (tt.ngay_thanh_toan || x.ngay_cap_nhat) : (fallbackLegacy ? x.ngay_cap_nhat : null);
        if (!ngayGhiNhan || ngayGhiNhan < start || ngayGhiNhan >= end) continue;
        const key = new Date(ngayGhiNhan.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const cur = map.get(key) || { so_don: 0, doanh_thu: 0 };
        cur.so_don++; cur.doanh_thu += daThanhToan ? Number(tt.so_tien) : Number(x.tong_tien); map.set(key, cur);
      }
      const rows = Array.from(map.entries()).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([ngay, x]) => [ngay, x.so_don, x.doanh_thu]);
      return { ten_goc: `doanh-thu_${tu}_${den}`, ten_sheet: "Doanh thu", rows: [["Ngày ghi nhận", "Số đơn ghi nhận doanh thu", "Doanh thu"], ...rows] as unknown[][] };
    }
    if (loai === "ton-kho") {
      const ds = await this.db.bienTheSanPham.findMany({ include: { san_pham: { select: { ma_san_pham: true, ten_san_pham: true } }, vat_lieu: { select: { ten_vat_lieu: true } }, mau_sac: { select: { ten_mau: true } } }, orderBy: { ma_bien_the: "asc" } });
      return {
        ten_goc: `ton-kho_${den}`,
        ten_sheet: "Tồn kho",
        rows: [["Mã sản phẩm", "Tên sản phẩm", "Mã biến thể", "Vật liệu", "Màu", "Tồn kho", "Tồn tối thiểu", "Tồn tối đa", "Gợi ý nhập", "Hiển thị", "Chênh lệch giá"], ...ds.map(x => [x.san_pham.ma_san_pham, x.san_pham.ten_san_pham, x.ma_bien_the, x.vat_lieu?.ten_vat_lieu || "Mặc định", x.mau_sac?.ten_mau || "Mặc định", x.so_luong_ton, x.ton_toi_thieu, x.ton_toi_da, (x.ton_toi_da > x.ton_toi_thieu && x.so_luong_ton <= x.ton_toi_thieu) ? Math.max(0, x.ton_toi_da - x.so_luong_ton) : 0, x.dang_hien_thi ? "Có" : "Không", Number(x.gia_chenh_lech)])] as unknown[][]
      };
    }
    throw new BadRequestException("Loại báo cáo không hợp lệ");
  }

  private tao_xlsx(rows: unknown[][], ten_sheet: string) {
    const xmlEsc = (v: unknown) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
    const colName = (index: number) => { let n = index + 1, out = ""; while (n > 0) { n--; out = String.fromCharCode(65 + (n % 26)) + out; n = Math.floor(n / 26); } return out; };
    const maxCols = Math.max(1, ...rows.map(r => r.length));
    const widths = Array.from({ length: maxCols }, (_, c) => Math.min(48, Math.max(12, ...rows.slice(0, 300).map(r => String(r[c] ?? "").length + 2))));
    const colsXml = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
    const bodyXml = rows.map((row, ri) => `<row r="${ri + 1}">${row.map((value, ci) => {
      const ref = `${colName(ci)}${ri + 1}`;
      const style = ri === 0 ? 1 : (typeof value === "number" ? 2 : 0);
      if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
      return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(value)}</t></is></c>`;
    }).join("")}</row>`).join("");
    const lastRef = `${colName(maxCols - 1)}${Math.max(1, rows.length)}`;
    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${colsXml}</cols><sheetData>${bodyXml}</sheetData><autoFilter ref="A1:${lastRef}"/></worksheet>`;
    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEsc(ten_sheet.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const files: Array<[string, string]> = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ["xl/workbook.xml", workbookXml],
      ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ["xl/styles.xml", stylesXml],
      ["xl/worksheets/sheet1.xml", sheetXml]
    ];
    const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); return c >>> 0; });
    const crc32 = (buf: Buffer) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const local: Buffer[] = [], central: Buffer[] = []; let offset = 0;
    for (const [name, text] of files) {
      const nameBuf = Buffer.from(name, "utf8"), data = Buffer.from(text, "utf8"), crc = crc32(data);
      const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(0, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
      local.push(lh, nameBuf, data);
      const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8); ch.writeUInt16LE(0, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
      central.push(ch, nameBuf); offset += lh.length + nameBuf.length + data.length;
    }
    const centralBuf = Buffer.concat(central); const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10); eocd.writeUInt32LE(centralBuf.length, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
    return Buffer.concat([...local, centralBuf, eocd]);
  }

  async xuat_bao_cao_csv(loai: string, tu_ngay?: string, den_ngay?: string) {
    const { ten_goc, rows } = await this.du_lieu_bao_cao(loai, tu_ngay, den_ngay);
    const esc = (v: unknown) => { const raw = String(v ?? ""); const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw; return `"${safe.replaceAll('"', '""')}"`; };
    const csv = rows.map(row => row.map(esc).join(",")).join("\r\n");
    return { ten_file: `${ten_goc}.csv`, csv };
  }

  async xuat_bao_cao_excel(loai: string, tu_ngay?: string, den_ngay?: string) {
    const { ten_goc, ten_sheet, rows } = await this.du_lieu_bao_cao(loai, tu_ngay, den_ngay);
    const buffer = this.tao_xlsx(rows, ten_sheet);
    return { ten_file: `${ten_goc}.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
  }

  async danh_sach_nhat_ky_admin(tim_kiem?: string, loai?: string, nguoi_dung_id?: string, tu_ngay?: string, den_ngay?: string, gioi_han?: string) {
    const q = tim_kiem?.trim().toLocaleLowerCase("vi") || "";
    const limitRaw = Number(gioi_han || 200);
    const limit = Number.isFinite(limitRaw) ? Math.max(20, Math.min(500, Math.floor(limitRaw))) : 200;
    const bat_dau = tu_ngay ? new Date(`${tu_ngay}T00:00:00.000Z`) : undefined;
    const ket_thuc = den_ngay ? new Date(`${den_ngay}T23:59:59.999Z`) : undefined;
    if (bat_dau && Number.isNaN(bat_dau.getTime())) throw new BadRequestException("Từ ngày không hợp lệ");
    if (ket_thuc && Number.isNaN(ket_thuc.getTime())) throw new BadRequestException("Đến ngày không hợp lệ");
    const ds = await this.db.nhatKyBaoMat.findMany({
      where: {
        OR: [{ loai_su_kien: { startsWith: "ADMIN_" } }, { loai_su_kien: { startsWith: "DANG_NHAP_" } }],
        ...(loai?.trim() ? { loai_su_kien: loai.trim() } : {}),
        ...(nguoi_dung_id?.trim() ? { nguoi_dung_id: nguoi_dung_id.trim() } : {}),
        ...((bat_dau || ket_thuc) ? { ngay_tao: { ...(bat_dau ? { gte: bat_dau } : {}), ...(ket_thuc ? { lte: ket_thuc } : {}) } } : {})
      },
      orderBy: { ngay_tao: "desc" },
      take: q ? 1000 : limit
    });
    const actorIds = [...new Set(ds.map(x => x.nguoi_dung_id).filter((x): x is string => Boolean(x)))];
    const actors = actorIds.length ? await this.db.nguoiDung.findMany({ where: { id: { in: actorIds } }, select: { id: true, ho_ten: true, thu_dien_tu: true } }) : [];
    const actorMap = new Map(actors.map(x => [x.id, x]));
    const mapped = ds.map(item => ({ id: item.id.toString(), loai_su_kien: item.loai_su_kien, nguoi_dung_id: item.nguoi_dung_id, nguoi_thuc_hien: item.nguoi_dung_id ? actorMap.get(item.nguoi_dung_id) || null : null, dia_chi_ip: item.dia_chi_ip, chi_tiet: item.chi_tiet, ngay_tao: item.ngay_tao }));
    if (!q) return mapped;
    return mapped.filter(item => `${item.loai_su_kien} ${item.nguoi_thuc_hien?.ho_ten || ""} ${item.nguoi_thuc_hien?.thu_dien_tu || ""} ${item.dia_chi_ip || ""} ${JSON.stringify(item.chi_tiet)}`.toLocaleLowerCase("vi").includes(q)).slice(0, limit);
  }

  async danh_sach_nhat_ky_admin_phan_trang(tim_kiem?: string, loai?: string, nguoi_dung_id?: string, tu_ngay?: string, den_ngay?: string, trangRaw?: string, kichThuocRaw?: string) {
    const q = tim_kiem?.trim().toLocaleLowerCase("vi") || "";
    const trang = Math.max(1, Number.parseInt(trangRaw || "1", 10) || 1);
    const kich_thuoc = Math.max(10, Math.min(100, Number.parseInt(kichThuocRaw || "25", 10) || 25));
    const bat_dau = tu_ngay ? new Date(`${tu_ngay}T00:00:00.000Z`) : undefined;
    const ket_thuc = den_ngay ? new Date(`${den_ngay}T23:59:59.999Z`) : undefined;
    if (bat_dau && Number.isNaN(bat_dau.getTime())) throw new BadRequestException("Từ ngày không hợp lệ");
    if (ket_thuc && Number.isNaN(ket_thuc.getTime())) throw new BadRequestException("Đến ngày không hợp lệ");
    const where = {
      OR: [{ loai_su_kien: { startsWith: "ADMIN_" } }, { loai_su_kien: { startsWith: "DANG_NHAP_" } }],
      ...(loai?.trim() ? { loai_su_kien: loai.trim() } : {}),
      ...(nguoi_dung_id?.trim() ? { nguoi_dung_id: nguoi_dung_id.trim() } : {}),
      ...((bat_dau || ket_thuc) ? { ngay_tao: { ...(bat_dau ? { gte: bat_dau } : {}), ...(ket_thuc ? { lte: ket_thuc } : {}) } } : {})
    };
    const ds = q
      ? await this.db.nhatKyBaoMat.findMany({ where, orderBy: { ngay_tao: "desc" }, take: 5000 })
      : await this.db.nhatKyBaoMat.findMany({ where, orderBy: { ngay_tao: "desc" }, skip: (trang - 1) * kich_thuoc, take: kich_thuoc });
    const actorIds = [...new Set(ds.map(x => x.nguoi_dung_id).filter((x): x is string => Boolean(x)))];
    const actors = actorIds.length ? await this.db.nguoiDung.findMany({ where: { id: { in: actorIds } }, select: { id: true, ho_ten: true, thu_dien_tu: true } }) : [];
    const actorMap = new Map(actors.map(x => [x.id, x]));
    const mapped = ds.map(item => ({ id: item.id.toString(), loai_su_kien: item.loai_su_kien, nguoi_dung_id: item.nguoi_dung_id, nguoi_thuc_hien: item.nguoi_dung_id ? actorMap.get(item.nguoi_dung_id) || null : null, dia_chi_ip: item.dia_chi_ip, chi_tiet: item.chi_tiet, ngay_tao: item.ngay_tao }));
    if (q) {
      const filtered = mapped.filter(item => `${item.loai_su_kien} ${item.nguoi_thuc_hien?.ho_ten || ""} ${item.nguoi_thuc_hien?.thu_dien_tu || ""} ${item.dia_chi_ip || ""} ${JSON.stringify(item.chi_tiet)}`.toLocaleLowerCase("vi").includes(q));
      const tong = filtered.length;
      return { du_lieu: filtered.slice((trang - 1) * kich_thuoc, trang * kich_thuoc), phan_trang: { trang, kich_thuoc, tong, tong_trang: Math.max(1, Math.ceil(tong / kich_thuoc)), gioi_han_tim_kiem: 5000 } };
    }
    const tong = await this.db.nhatKyBaoMat.count({ where });
    return { du_lieu: mapped, phan_trang: { trang, kich_thuoc, tong, tong_trang: Math.max(1, Math.ceil(tong / kich_thuoc)) } };
  }

  async danh_sach_nhat_ky_admin_cursor(tim_kiem?: string, loai?: string, nguoi_dung_id?: string, tu_ngay?: string, den_ngay?: string, cursorRaw?: string, kichThuocRaw?: string) {
    const q = tim_kiem?.trim().toLocaleLowerCase("vi") || "";
    const kich_thuoc = Math.max(10, Math.min(100, Number.parseInt(kichThuocRaw || "25", 10) || 25));
    const bat_dau = tu_ngay ? new Date(`${tu_ngay}T00:00:00.000Z`) : undefined;
    const ket_thuc = den_ngay ? new Date(`${den_ngay}T23:59:59.999Z`) : undefined;
    if (bat_dau && Number.isNaN(bat_dau.getTime())) throw new BadRequestException("Từ ngày không hợp lệ");
    if (ket_thuc && Number.isNaN(ket_thuc.getTime())) throw new BadRequestException("Đến ngày không hợp lệ");
    let cursor: bigint | undefined;
    if (cursorRaw?.trim()) { try { cursor = BigInt(cursorRaw.trim()); if (cursor <= 0n) throw new Error(); } catch { throw new BadRequestException("Cursor nhật ký không hợp lệ"); } }
    const where = {
      OR: [{ loai_su_kien: { startsWith: "ADMIN_" } }, { loai_su_kien: { startsWith: "DANG_NHAP_" } }],
      ...(loai?.trim() ? { loai_su_kien: loai.trim() } : {}),
      ...(nguoi_dung_id?.trim() ? { nguoi_dung_id: nguoi_dung_id.trim() } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
      ...((bat_dau || ket_thuc) ? { ngay_tao: { ...(bat_dau ? { gte: bat_dau } : {}), ...(ket_thuc ? { lte: ket_thuc } : {}) } } : {})
    };
    const takeRaw = q ? Math.min(2000, kich_thuoc * 20) : kich_thuoc + 1;
    const raw = await this.db.nhatKyBaoMat.findMany({ where, orderBy: { id: "desc" }, take: takeRaw });
    const actorIds = [...new Set(raw.map(x => x.nguoi_dung_id).filter((x): x is string => Boolean(x)))];
    const actors = actorIds.length ? await this.db.nguoiDung.findMany({ where: { id: { in: actorIds } }, select: { id: true, ho_ten: true, thu_dien_tu: true } }) : [];
    const actorMap = new Map(actors.map(x => [x.id, x]));
    const mapped = raw.map(item => ({ id: item.id.toString(), loai_su_kien: item.loai_su_kien, nguoi_dung_id: item.nguoi_dung_id, nguoi_thuc_hien: item.nguoi_dung_id ? actorMap.get(item.nguoi_dung_id) || null : null, dia_chi_ip: item.dia_chi_ip, chi_tiet: item.chi_tiet, ngay_tao: item.ngay_tao }));
    const filtered = q ? mapped.filter(item => `${item.loai_su_kien} ${item.nguoi_thuc_hien?.ho_ten || ""} ${item.nguoi_thuc_hien?.thu_dien_tu || ""} ${item.dia_chi_ip || ""} ${JSON.stringify(item.chi_tiet)}`.toLocaleLowerCase("vi").includes(q)) : mapped;
    const du_lieu = filtered.slice(0, kich_thuoc);
    const co_them = q ? raw.length === takeRaw : raw.length > kich_thuoc;
    const cursorBase = q ? raw[raw.length - 1] : raw[Math.min(kich_thuoc - 1, raw.length - 1)];
    return { du_lieu, cursor: { kich_thuoc, co_them, next_cursor: co_them && cursorBase ? cursorBase.id.toString() : null, che_do_tim_kiem: q ? "cursor-scan" : "cursor-index" } };
  }

  async xuat_nhat_ky_admin_excel(tim_kiem?: string, loai?: string, nguoi_dung_id?: string, tu_ngay?: string, den_ngay?: string) {
    const ds = await this.danh_sach_nhat_ky_admin(tim_kiem, loai, nguoi_dung_id, tu_ngay, den_ngay, "500");
    const rows: unknown[][] = [["Thời gian", "Sự kiện", "Người thực hiện", "Email", "IP", "Trước", "Sau", "Thay đổi", "Chi tiết đầy đủ"]];
    for (const item of ds) {
      const ct = item.chi_tiet && typeof item.chi_tiet === "object" && !Array.isArray(item.chi_tiet) ? item.chi_tiet as Record<string, unknown> : {};
      rows.push([
        new Date(item.ngay_tao).toISOString(), item.loai_su_kien, item.nguoi_thuc_hien?.ho_ten || "", item.nguoi_thuc_hien?.thu_dien_tu || "", item.dia_chi_ip || "",
        JSON.stringify(ct.truoc ?? ""), JSON.stringify(ct.sau ?? ""), JSON.stringify(ct.thay_doi ?? ""), JSON.stringify(ct)
      ]);
    }
    const buffer = this.tao_xlsx(rows, "Nhật ký Admin");
    return { ten_file: `nhat-ky-admin-${new Date().toISOString().slice(0, 10)}.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
  }

  async xuat_nhat_ky_admin_csv(tim_kiem?: string, loai?: string, nguoi_dung_id?: string, tu_ngay?: string, den_ngay?: string) {
    const ds = await this.danh_sach_nhat_ky_admin(tim_kiem, loai, nguoi_dung_id, tu_ngay, den_ngay, "500");
    const esc = (v: unknown) => { const raw = String(v ?? ""); const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw; return `"${safe.replaceAll('"', '""')}"`; };
    const rows = [["Thời gian", "Sự kiện", "Người thực hiện", "Email", "IP", "Chi tiết"], ...ds.map(item => [new Date(item.ngay_tao).toISOString(), item.loai_su_kien, item.nguoi_thuc_hien?.ho_ten || "", item.nguoi_thuc_hien?.thu_dien_tu || "", item.dia_chi_ip || "", JSON.stringify(item.chi_tiet)])];
    return { ten_file: `nhat-ky-admin-${new Date().toISOString().slice(0, 10)}.csv`, csv: rows.map(row => row.map(esc).join(",")).join("\r\n") };
  }

}
