import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import * as argon2 from "argon2";
import { createHash } from "node:crypto";
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

@Injectable()
export class QuanTriService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QuanTriService.name);
  private bo_hen_canh_bao_kho: NodeJS.Timeout | null = null;
  private bo_hen_canh_bao_he_thong: NodeJS.Timeout | null = null;
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
  }

  onModuleDestroy() {
    if (this.bo_hen_canh_bao_kho) clearInterval(this.bo_hen_canh_bao_kho);
    if (this.bo_hen_canh_bao_he_thong) clearInterval(this.bo_hen_canh_bao_he_thong);
  }

  private cau_hinh_canh_bao_kho_runtime() {
    const bat = ["1", "true", "yes", "on"].includes((process.env.LOW_STOCK_EMAIL_ENABLED || "false").trim().toLowerCase());
    const raw = Number(process.env.LOW_STOCK_EMAIL_INTERVAL_MINUTES || 60);
    const chu_ky_phut = Number.isFinite(raw) ? Math.max(15, Math.min(1440, Math.floor(raw))) : 60;
    return { bat, chu_ky_phut };
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

  private async bao_tri_he_thong_runtime() {
    const mac_dinh = { bat: false, bat_dau: null as string | null, ket_thuc: null as string | null, ly_do: "", nguon_cau_hinh: "MAC_DINH" as const };
    try {
      const item = await this.db.cauHinhHeThong.findUnique({ where: { khoa: "BAO_TRI_HE_THONG_CAU_HINH" } });
      const raw = item?.gia_tri;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...mac_dinh, dang_bao_tri: false, sap_bao_tri: false, da_ket_thuc: false };
      const x = raw as Record<string, unknown>;
      const bat_dau_date = this.doc_moc_thoi_gian(x.bat_dau);
      const ket_thuc_date = this.doc_moc_thoi_gian(x.ket_thuc);
      const now = new Date();
      const bat = x.bat === true;
      const hop_le = !!bat_dau_date && !!ket_thuc_date && ket_thuc_date.getTime() > bat_dau_date.getTime();
      return {
        bat,
        bat_dau: bat_dau_date?.toISOString() || null,
        ket_thuc: ket_thuc_date?.toISOString() || null,
        ly_do: typeof x.ly_do === "string" ? x.ly_do : "",
        dang_bao_tri: bat && hop_le && now >= bat_dau_date! && now <= ket_thuc_date!,
        sap_bao_tri: bat && hop_le && now < bat_dau_date!,
        da_ket_thuc: bat && hop_le && now > ket_thuc_date!,
        nguon_cau_hinh: "DATABASE" as const,
        ngay_cap_nhat: item.ngay_cap_nhat
      };
    } catch (error) {
      this.logger.debug(`Không đọc được maintenance window: ${error instanceof Error ? error.message : String(error)}`);
      return { ...mac_dinh, dang_bao_tri: false, sap_bao_tri: false, da_ket_thuc: false };
    }
  }

  async lay_bao_tri_he_thong() {
    return this.bao_tri_he_thong_runtime();
  }

  async cap_nhat_bao_tri_he_thong(actor: NguoiDungXacThuc, dto: CapNhatBaoTriHeThongDto) {
    const truocRuntime = await this.bao_tri_he_thong_runtime();
    const truoc = { bat: truocRuntime.bat, bat_dau: truocRuntime.bat_dau, ket_thuc: truocRuntime.ket_thuc, ly_do: truocRuntime.ly_do };
    let bat_dau: Date | null = null;
    let ket_thuc: Date | null = null;
    if (dto.bat) {
      bat_dau = this.doc_moc_thoi_gian(dto.bat_dau);
      ket_thuc = this.doc_moc_thoi_gian(dto.ket_thuc);
      if (!bat_dau || !ket_thuc) throw new BadRequestException("Bảo trì đang bật thì phải có thời gian bắt đầu và kết thúc hợp lệ");
      if (ket_thuc <= bat_dau) throw new BadRequestException("Thời gian kết thúc bảo trì phải sau thời gian bắt đầu");
      if (ket_thuc.getTime() - bat_dau.getTime() > 30 * 86_400_000) throw new BadRequestException("Một maintenance window không được dài quá 30 ngày");
    }
    const sau = { bat: dto.bat, bat_dau: bat_dau?.toISOString() || null, ket_thuc: ket_thuc?.toISOString() || null, ly_do: dto.ly_do?.trim() || "" };
    await this.db.$transaction([
      this.db.cauHinhHeThong.upsert({ where: { khoa: "BAO_TRI_HE_THONG_CAU_HINH" }, create: { khoa: "BAO_TRI_HE_THONG_CAU_HINH", gia_tri: sau, nguoi_cap_nhat_id: actor.id }, update: { gia_tri: sau, nguoi_cap_nhat_id: actor.id } }),
      this.db.nhatKyBaoMat.create({ data: { loai_su_kien: "ADMIN_CAP_NHAT_BAO_TRI_HE_THONG", nguoi_dung_id: actor.id, chi_tiet: { truoc, sau, thay_doi: this.tao_diff(truoc, sau) } } })
    ]);
    await this.ghi_lich_su_van_hanh("MAINTENANCE", dto.bat ? "DA_LEN_LICH" : "DA_TAT", dto.bat ? "Admin cập nhật maintenance window" : "Admin tắt maintenance window", { ...sau, nguoi_cap_nhat: actor.ho_ten });
    return this.bao_tri_he_thong_runtime();
  }

  private cau_hinh_webhook_canh_bao() {
    const bat = ["1", "true", "yes", "on"].includes((process.env.SYSTEM_ALERT_WEBHOOK_ENABLED || "false").trim().toLowerCase());
    const rawUrl = process.env.SYSTEM_ALERT_WEBHOOK_URL?.trim() || "";
    let hop_le = false;
    let endpoint = "";
    if (rawUrl) {
      try {
        const url = new URL(rawUrl);
        hop_le = url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:");
        endpoint = hop_le ? `${url.protocol}//${url.host}${url.pathname}` : "";
      } catch { hop_le = false; }
    }
    return { bat, san_sang: bat && hop_le, endpoint, timeout_ms: 5000 };
  }

  private async gui_webhook_canh_bao(payload: Record<string, unknown>) {
    const cau_hinh = this.cau_hinh_webhook_canh_bao();
    if (!cau_hinh.san_sang) return { da_gui: false, ly_do: cau_hinh.bat ? "Webhook chưa có URL hợp lệ" : "Webhook đang tắt" };
    const token = process.env.SYSTEM_ALERT_WEBHOOK_BEARER_TOKEN?.trim();
    const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "NhienIn3d-Ops/3.6.4" };
    if (token) headers.authorization = `Bearer ${token}`;
    try {
      const response = await fetch(process.env.SYSTEM_ALERT_WEBHOOK_URL!.trim(), { method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(cau_hinh.timeout_ms) });
      if (!response.ok) return { da_gui: false, ly_do: `Webhook trả HTTP ${response.status}`, http_status: response.status };
      return { da_gui: true, http_status: response.status };
    } catch (error) {
      return { da_gui: false, ly_do: error instanceof Error ? error.message : String(error) };
    }
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
    const tong_hop = await this.db.suCoVanHanh.upsert({
      where: { chu_ky },
      create: {
        chu_ky, trang_thai_xu_ly: "MOI", van_de, bat_dau: ngay_tao, gan_nhat: ngay_tao,
        so_su_kien: 1, so_health: loai === "HEALTH" ? 1 : 0, so_alert: loai === "ALERT" ? 1 : 0, trang_thai_gan_nhat: trang_thai
      },
      update: {
        gan_nhat: ngay_tao,
        so_su_kien: { increment: 1 },
        ...(loai === "HEALTH" ? { so_health: { increment: 1 } } : {}),
        ...(loai === "ALERT" ? { so_alert: { increment: 1 } } : {}),
        trang_thai_gan_nhat: trang_thai,
        ...(van_de.length ? { van_de } : {})
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
    } catch (error) {
      this.logger.debug(`Không ghi được lịch sử vận hành ${loai}: ${error instanceof Error ? error.message : String(error)}`);
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
      phien_ban: "3.6.4",
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
        van_de
      }, luc_bat_dau, chu_ky_canh_bao);
    }
    return ket_qua;
  }

  async kiem_tra_gui_canh_bao_he_thong_email(kiem_tra_thu_cong = false) {
    const cau_hinh = await this.cau_hinh_canh_bao_he_thong_runtime();
    const bao_tri = await this.bao_tri_he_thong_runtime();
    if (bao_tri.dang_bao_tri && !kiem_tra_thu_cong) return { da_gui: false, ly_do: `Đang trong maintenance window${bao_tri.ly_do ? `: ${bao_tri.ly_do}` : ""}`, van_de: [] as string[], cap_leo_thang: 0, bao_tri };
    if (!cau_hinh.bat && !kiem_tra_thu_cong) return { da_gui: false, ly_do: "Cảnh báo hệ thống qua email đang tắt", van_de: [] as string[], cap_leo_thang: 0, bao_tri };
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

    let nguoi_nhan = cau_hinh.nguoi_nhan_co_dinh;
    if (!nguoi_nhan.length && health.database.ket_noi) {
      try {
        const admins = await this.db.nguoiDung.findMany({ where: { vai_tro: VaiTro.ADMIN, da_kich_hoat: true }, select: { thu_dien_tu: true } });
        nguoi_nhan = admins.map(x => x.thu_dien_tu).filter(Boolean);
      } catch { nguoi_nhan = []; }
    }
    if (!nguoi_nhan.length) return { da_gui: false, ly_do: "Không có SYSTEM_HEALTH_EMAIL_TO hoặc Admin khả dụng để nhận cảnh báo", van_de, cap_leo_thang, ton_tai_phut };
    if (!health.smtp.san_sang) return { da_gui: false, ly_do: "SMTP chưa sẵn sàng nên không thể gửi cảnh báo vận hành", van_de, cap_leo_thang, ton_tai_phut };

    await this.thu_dien_tu.guiCanhBaoHeThong({ thu_dien_tu: nguoi_nhan, trang_thai: trang_thai_canh_bao, van_de, thoi_gian: health.thoi_gian, cap_leo_thang, ton_tai_phut });
    const webhook = await this.gui_webhook_canh_bao({
      event: "nhienin3d.system.alert", version: "3.6.4", trang_thai: trang_thai_canh_bao, chu_ky, van_de, thoi_gian: health.thoi_gian, cap_leo_thang, ton_tai_phut
    });
    this.chu_ky_canh_bao_he_thong = chu_ky;
    if (health.database.ket_noi) {
      try { await this.db.cauHinhHeThong.upsert({ where: { khoa: "CANH_BAO_HE_THONG_EMAIL" }, create: { khoa: "CANH_BAO_HE_THONG_EMAIL", gia_tri: { chu_ky, trang_thai: trang_thai_canh_bao, van_de, phat_hien_luc: phat_hien_luc.toISOString(), lan_gui: health.thoi_gian, cap_leo_thang } }, update: { gia_tri: { chu_ky, trang_thai: trang_thai_canh_bao, van_de, phat_hien_luc: phat_hien_luc.toISOString(), lan_gui: health.thoi_gian, cap_leo_thang } } }); } catch {}
      await this.ghi_lich_su_van_hanh("ALERT", "THANH_CONG", cap_leo_thang > 0 ? `Đã gửi escalation cảnh báo vận hành cấp ${cap_leo_thang}` : "Đã gửi cảnh báo vận hành", { van_de, so_nguoi_nhan: nguoi_nhan.length, cap_leo_thang, ton_tai_phut, chu_ky, webhook }, undefined, chu_ky);
    }
    return { da_gui: true, van_de, so_nguoi_nhan: nguoi_nhan.length, cap_leo_thang, ton_tai_phut, webhook, bao_tri };
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

  async danh_sach_su_co_van_hanh(gioiHanRaw?: string, trangThaiXuLyRaw?: string) {
    const gioi_han = Math.max(5, Math.min(100, Number.parseInt(gioiHanRaw || "20", 10) || 20));
    const trang_thai_xu_ly = trangThaiXuLyRaw?.trim().toUpperCase();
    if (trang_thai_xu_ly && !["MOI", "DA_TIEP_NHAN", "DA_KHAC_PHUC"].includes(trang_thai_xu_ly)) throw new BadRequestException("Trạng thái xử lý sự cố không hợp lệ");
    const ds = await this.db.suCoVanHanh.findMany({
      where: trang_thai_xu_ly ? { trang_thai_xu_ly } : undefined,
      orderBy: { gan_nhat: "desc" },
      take: gioi_han
    });
    return {
      du_lieu: ds.map(x => ({ ...x, van_de: this.van_de_su_co(x.van_de), thoi_luong_phut: Math.max(0, Math.round((x.gan_nhat.getTime() - x.bat_dau.getTime()) / 60_000)) })),
      gioi_han,
      nguon: "BANG_TONG_HOP" as const
    };
  }

  async xuat_excel_danh_sach_su_co_van_hanh(trangThaiXuLyRaw?: string) {
    const trang_thai_xu_ly = trangThaiXuLyRaw?.trim().toUpperCase();
    if (trang_thai_xu_ly && !["MOI", "DA_TIEP_NHAN", "DA_KHAC_PHUC"].includes(trang_thai_xu_ly)) throw new BadRequestException("Trạng thái xử lý sự cố không hợp lệ");
    const ds = await this.db.suCoVanHanh.findMany({ where: trang_thai_xu_ly ? { trang_thai_xu_ly } : undefined, orderBy: { gan_nhat: "desc" }, take: 5000 });
    const rows: unknown[][] = [["Chữ ký", "Trạng thái", "Vấn đề", "Bắt đầu", "Gần nhất", "Sự kiện", "Health", "Alert", "Người tiếp nhận", "Tiếp nhận lúc", "Người khắc phục", "Khắc phục lúc", "Ghi chú"]];
    for (const x of ds) rows.push([x.chu_ky, x.trang_thai_xu_ly, this.van_de_su_co(x.van_de).join(" | "), x.bat_dau.toISOString(), x.gan_nhat.toISOString(), x.so_su_kien, x.so_health, x.so_alert, x.nguoi_tiep_nhan_ten || "", x.tiep_nhan_luc?.toISOString() || "", x.nguoi_khac_phuc_ten || "", x.khac_phuc_luc?.toISOString() || "", x.ghi_chu || ""]);
    const buffer = this.tao_xlsx(rows, "Incident vận hành");
    return { ten_file: `incident-van-hanh-${new Date().toISOString().slice(0, 10)}.xlsx`, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") };
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
      this.db.suCoVanHanh.update({ where: { chu_ky }, data: { trang_thai_xu_ly: "DA_TIEP_NHAN", ghi_chu, nguoi_tiep_nhan_id: actor.id, nguoi_tiep_nhan_ten: actor.ho_ten, tiep_nhan_luc } }),
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

  async thong_ke_sla_van_hanh(soNgayRaw?: string) {
    const raw = Number.parseInt(soNgayRaw || "90", 10) || 90;
    const so_ngay = raw <= 30 ? 30 : 90;
    const tu = new Date(); tu.setUTCDate(tu.getUTCDate() - (so_ngay - 1)); tu.setUTCHours(0, 0, 0, 0);
    const [ds, muc_tieu] = await Promise.all([
      this.db.lichSuVanHanh.findMany({ where: { loai: "HEALTH", ngay_tao: { gte: tu } }, orderBy: { ngay_tao: "asc" }, select: { trang_thai: true, ngay_tao: true } }),
      this.cau_hinh_slo_van_hanh_runtime()
    ]);
    const map = new Map<string, { tong: number; tot: number; canh_bao: number; loi: number }>();
    for (const item of ds) {
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
    const tinh_burn = (gio: number, kieu: "sla" | "uptime", muc_tieu_percent: number) => {
      const moc = Date.now() - gio * 3_600_000;
      const rows = ds.filter(x => x.ngay_tao.getTime() >= moc);
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
    const ngan_sach_loi = {
      sla: tinh_ngan_sach(ba_muoi_ngay.tong, ba_muoi_ngay.tong - ba_muoi_ngay.tot, muc_tieu.sla_muc_tieu_percent),
      uptime: tinh_ngan_sach(ba_muoi_ngay.tong, ba_muoi_ngay.loi, muc_tieu.uptime_muc_tieu_percent)
    };
    const burn_rate = {
      sla: { mot_gio: tinh_burn(1, "sla", muc_tieu.sla_muc_tieu_percent), sau_gio: tinh_burn(6, "sla", muc_tieu.sla_muc_tieu_percent), hai_muoi_bon_gio: tinh_burn(24, "sla", muc_tieu.sla_muc_tieu_percent) },
      uptime: { mot_gio: tinh_burn(1, "uptime", muc_tieu.uptime_muc_tieu_percent), sau_gio: tinh_burn(6, "uptime", muc_tieu.uptime_muc_tieu_percent), hai_muoi_bon_gio: tinh_burn(24, "uptime", muc_tieu.uptime_muc_tieu_percent) }
    };
    const canh_bao: string[] = [];
    if (muc_tieu.canh_bao_xu_huong) {
      if (bay_ngay.dat_sla === false) canh_bao.push(`SLA 7 ngày ${bay_ngay.sla_percent}% dưới mục tiêu ${muc_tieu.sla_muc_tieu_percent}%`);
      if (bay_ngay.dat_uptime === false) canh_bao.push(`Uptime 7 ngày ${bay_ngay.uptime_percent}% dưới mục tiêu ${muc_tieu.uptime_muc_tieu_percent}%`);
      if (ba_muoi_ngay.dat_sla === false) canh_bao.push(`SLA 30 ngày ${ba_muoi_ngay.sla_percent}% dưới mục tiêu ${muc_tieu.sla_muc_tieu_percent}%`);
      if (ba_muoi_ngay.dat_uptime === false) canh_bao.push(`Uptime 30 ngày ${ba_muoi_ngay.uptime_percent}% dưới mục tiêu ${muc_tieu.uptime_muc_tieu_percent}%`);
      for (const [nhan, item] of [["SLA 1h", burn_rate.sla.mot_gio], ["SLA 6h", burn_rate.sla.sau_gio], ["SLA 24h", burn_rate.sla.hai_muoi_bon_gio], ["Uptime 1h", burn_rate.uptime.mot_gio], ["Uptime 6h", burn_rate.uptime.sau_gio], ["Uptime 24h", burn_rate.uptime.hai_muoi_bon_gio]] as const) {
        if (item.burn_rate != null && item.burn_rate >= 1) canh_bao.push(`Burn-rate ${nhan} ${item.burn_rate}x đang tiêu ngân sách lỗi nhanh hơn mức cho phép`);
      }
    }
    return {
      so_ngay, tu_ngay: tu.toISOString(), tao_luc: new Date().toISOString(),
      dinh_nghia: { sla: "Tỷ lệ mẫu health ở trạng thái TỐT", uptime: "Tỷ lệ mẫu health không ở trạng thái LỖI", error_budget: "Ngân sách lỗi 30 ngày theo mục tiêu SLO; burn-rate > 1x nghĩa là đang tiêu ngân sách nhanh hơn tốc độ bền vững" },
      muc_tieu: { sla_muc_tieu_percent: muc_tieu.sla_muc_tieu_percent, uptime_muc_tieu_percent: muc_tieu.uptime_muc_tieu_percent, canh_bao_xu_huong: muc_tieu.canh_bao_xu_huong, nguon_cau_hinh: muc_tieu.nguon_cau_hinh },
      tong_quan,
      xu_huong: { bay_ngay, ba_muoi_ngay },
      ngan_sach_loi,
      burn_rate,
      canh_bao,
      theo_ngay
    };
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
      const rows = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([ngay, x]) => [ngay, x.so_don, x.doanh_thu]);
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
