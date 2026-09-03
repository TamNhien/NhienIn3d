import type { TaiKhoan } from "./xac-thuc";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
async function docLoi(res: Response) { try { const d = await res.json(); return Array.isArray(d?.message) ? d.message.join(" · ") : d?.message || "Yêu cầu không thành công"; } catch { return "Yêu cầu không thành công"; } }
function taoHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  // Fastify 5 từ chối request body rỗng nếu vẫn gắn application/json.
  // Chỉ gắn Content-Type khi request thực sự có body JSON.
  if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function goi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, credentials: "include", cache: init.cache ?? "no-store", headers: taoHeaders(init) });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json() as Promise<T>;
}

export type AdminNguoiDung = TaiKhoan & { da_kich_hoat: boolean; dia_chi_mac_dinh?: string; nhan_vien?: { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; trang_thai: string } | null };
export type AdminNhanVien = { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; ngay_vao_lam: string; trang_thai: string; nguoi_dung: AdminNguoiDung };
export type CaLam = { id: string; ma_ca: string; ten_ca: string; gio_bat_dau: string; gio_ket_thuc: string; mau_hien_thi?: string | null; dang_hoat_dong: boolean };
export type PhanCa = { id: string; ngay_lam: string; trang_thai: string; ghi_chu?: string | null; nhan_vien: AdminNhanVien; ca_lam_viec: CaLam };


export type AdminThanhToanTomTat = { trang_thai: string; ma_giao_dich: string };
export type AdminThanhToanChiTiet = { id: string; ma_giao_dich: string; so_tien: number; trang_thai: string; ngay_tao: string; ngay_thanh_toan?: string | null; phuong_thuc: { ten_phuong_thuc: string; ma_phuong_thuc: string } };
export type AdminDonHang = {
  id: string; ma_don_hang: string; ho_ten_nguoi_nhan: string; so_dien_thoai: string; tong_tien: number; trang_thai: string; ngay_tao: string; ngay_cap_nhat: string;
  khach_hang?: { id: string; thu_dien_tu: string; ho_ten: string } | null; so_mat_hang: number; tong_so_luong: number; thanh_toan?: AdminThanhToanTomTat | null;
};
export type KetQuaDoiSoatDoanhThuDonDaGiao = { so_don_quet: number; so_don_cap_nhat: number; tong_doanh_thu_bo_sung: number; don_hang: Array<{ ma_don_hang: string; so_tien: number; phuong_thuc: string }> };
export type AdminDonHangChiTiet = Omit<AdminDonHang, "thanh_toan"> & {
  dia_chi_giao_hang: string; ghi_chu?: string | null;
  chi_tiet: Array<{ id: string; ten_san_pham: string; ma_san_pham: string; so_luong: number; don_gia: number; thanh_tien: number; tuy_chon: Record<string, unknown> }>;
  thanh_toan: AdminThanhToanChiTiet[];
  lich_su: Array<{ id: string; trang_thai_cu?: string | null; trang_thai_moi: string; ghi_chu?: string | null; ngay_tao: string; nguoi_thuc_hien?: { ho_ten: string; thu_dien_tu: string; vai_tro: string } | null }>;
  cap_nhat_doanh_thu?: { da_ghi_nhan_moi: boolean; da_co_tu_truoc: boolean; so_tien: number; ngay_ghi_nhan?: string | null; nguon?: "CHOT_KHI_GIAO" | "DA_THANH_TOAN_TRUOC" | "LEGACY_KHONG_GIAO_DICH" | "KHONG_PHAT_SINH" | string };
};
export type AdminBienThe = { id: string; ma_bien_the: string; so_luong_ton: number; ton_toi_thieu: number; ton_toi_da: number; dang_hien_thi: boolean; gia_chenh_lech: number | string; vat_lieu?: { id: string; ten_vat_lieu: string } | null; mau_sac?: { id: string; ten_mau: string; ma_hex: string } | null };
export type AdminDanhMuc = { id: string; ma_danh_muc: string; ten_danh_muc: string; duong_dan: string; mo_ta?: string | null; thu_tu: number; dang_hien_thi: boolean; so_san_pham: number };
export type AdminVatLieu = { id: string; ma_vat_lieu: string; ten_vat_lieu: string; mo_ta?: string | null; he_so_gia: number; so_bien_the: number };
export type AdminMauSac = { id: string; ma_mau: string; ten_mau: string; ma_hex: string; so_bien_the: number };
export type AdminDanhGia = { id: string; ho_ten: string; so_sao: number; noi_dung: string; da_duyet: boolean; ngay_tao: string; ngay_cap_nhat: string; san_pham: { id: string; ma_san_pham: string; ten_san_pham: string } };
export type AdminSanPham = { id: string; ma_san_pham: string; ten_san_pham: string; mo_ta_ngan?: string | null; gia_ban: number; gia_von?: number | null; kich_thuoc?: string | null; khoi_luong_gam?: number | null; thoi_gian_in_gio?: number | null; trang_thai: string; danh_muc: { id: string; ma_danh_muc: string; ten_danh_muc: string }; bien_the: AdminBienThe[]; hinh_anh: Array<{ duong_dan_anh: string }> };
export type NhatKyAdmin = { id: string; loai_su_kien: string; nguoi_dung_id?: string | null; nguoi_thuc_hien?: { id: string; ho_ten: string; thu_dien_tu: string } | null; dia_chi_ip?: string | null; chi_tiet: Record<string, unknown>; ngay_tao: string };
export type PhanTrang = { trang: number; kich_thuoc: number; tong: number; tong_trang: number; gioi_han_tim_kiem?: number };
export type KetQuaPhanTrang<T> = { du_lieu: T[]; phan_trang: PhanTrang };
export type CursorTrang = { kich_thuoc: number; co_them: boolean; next_cursor: string | null; che_do_tim_kiem?: string };
export type KetQuaCursor<T> = { du_lieu: T[]; cursor: CursorTrang };
export type LichSuVanHanhAdmin = { id: string; loai: "HEALTH" | "BACKUP" | "RESTORE" | "ALERT" | string; trang_thai: "TOT" | "CANH_BAO" | "LOI" | "THANH_CONG" | "THAT_BAI" | string; mo_ta?: string | null; chi_tiet: Record<string, unknown>; chu_ky_canh_bao?: string | null; ngay_bat_dau?: string | null; ngay_ket_thuc?: string | null; ngay_tao: string };
export type CauHinhCanhBaoHeThongAdmin = { bat: boolean; chu_ky_phut: number; backup_qua_han_gio: number; im_lang_phut: number; leo_thang_phut: number; nguoi_nhan: string; nguon_cau_hinh: "DATABASE" | "ENV" | string; ngay_cap_nhat?: string | null };
export type CauHinhSloVanHanhAdmin = { sla_muc_tieu_percent: number; uptime_muc_tieu_percent: number; canh_bao_xu_huong: boolean; nguon_cau_hinh: "DATABASE" | "ENV" | string; ngay_cap_nhat?: string | null };
export type BaoTriWindowAdmin = { id: string; ten: string; bat: boolean; bat_dau: string; ket_thuc: string; lap_lai: "KHONG" | "HANG_NGAY" | "HANG_TUAN"; ly_do: string; dang_bao_tri: boolean; sap_bao_tri: boolean; da_ket_thuc: boolean; lan_bat_dau: string | null; lan_ket_thuc: string | null; lan_tiep_theo: string | null };
export type BaoTriHeThongAdmin = { bat: boolean; bat_dau: string | null; ket_thuc: string | null; ly_do: string; dang_bao_tri: boolean; sap_bao_tri: boolean; da_ket_thuc: boolean; tong_cua_so?: number; cua_so_dang_hoat_dong?: BaoTriWindowAdmin | null; cua_so_tiep_theo?: BaoTriWindowAdmin | null; danh_sach?: BaoTriWindowAdmin[]; nguon_cau_hinh: string; ngay_cap_nhat?: string | null };
export type DanhSachBaoTriAdmin = { du_lieu: BaoTriWindowAdmin[]; nguon_cau_hinh: string; ngay_cap_nhat?: string | null };
export type SloEndpointCheckAdmin = { id: string; ten: string; path: string; method: "GET" | "HEAD"; headers: Record<string, string>; auth_template: "NONE" | "BEARER_ENV"; auth_env: string; muc_tieu_percent: number; latency_target_ms: number; timeout_ms: number };
export type CauHinhSloNangCaoAdmin = { burn_windows: Array<{ gio: number; nguong: number; muc_do: "CANH_BAO" | "CAO" | "NGHIEM_TRONG" | string }>; service_targets: { api: number; postgresql: number; backup: number; smtp: number }; endpoint_checks: SloEndpointCheckAdmin[]; maintenance_policy: { exclude_from_availability: boolean; exclude_from_error_budget: boolean; max_gap_multiplier: number }; nguon_cau_hinh: string; ngay_cap_nhat?: string | null };
export type WebhookDeliveryAdmin = LichSuVanHanhAdmin;
export type WebhookDeadLetterAdmin = LichSuVanHanhAdmin & { da_replay: boolean; da_ack: boolean; het_han: boolean; trang_thai_dlq: "CHO_RETRY" | "CHO_REPLAY" | "DA_REPLAY" | "DA_ACK" | "HET_HAN" | "RETRY_THAT_BAI" | string; idempotency_key: string; het_han_luc: string; payload_ref?: string; payload_encrypted?: boolean; retry_tiep_theo_luc?: string | null; so_lan_retry_tu_dong?: number; key_id?: string };
export type EndpointSloAdmin = SloEndpointCheckAdmin & { tong_mau: number; persistent_samples?: number; probe_agents?: string[]; by_region?: Array<{ key: string; samples: number; availability_percent: number | null; p95_ms: number | null; apdex: number | null }>; by_node?: Array<{ key: string; samples: number; availability_percent: number | null; p95_ms: number | null; apdex: number | null }>; tong_thoi_gian_phut: number; downtime_phut: number; budget_downtime_phut: number; excluded_maintenance_phut: { availability: number; error_budget: number }; availability_percent: number | null; dat_muc_tieu: boolean | null; error_budget_da_tieu_percent: number | null; error_budget_con_lai_percent: number | null; latency: { samples: number; sli_percent: number | null; avg_ms: number | null; p50_ms: number | null; p95_ms: number | null; p99_ms: number | null; target_ms: number; dat_p95: boolean | null; histogram: Record<string, number>; apdex?: { score: number | null; satisfied: number; tolerating: number; frustrated: number } } };


export type OpsAccessAdmin = { duoc_phep: boolean; admin: boolean; vai_tro_ops: "OPS_VIEWER" | "ON_CALL" | "SERVICE_OWNER" | string; dich_vu: string[]; cap_escalation?: number };
export type OpsProbeAgentHealth = { agent_id: string; region: string; node_name: string; phien_ban?: string | null; trang_thai: string; lan_heartbeat: string; lan_mau?: string | null; online: boolean; heartbeat_age_seconds: number };
export type OpsProbeFleetAgent = { agent_id: string; required: boolean; managed: boolean; source: "PROFILE" | "KEYRING" | "ENROLLED" | "UNMANAGED" | string; key_configured: boolean; per_agent_key: boolean; asymmetric_key?: boolean; asymmetric_key_count?: number; asymmetric_active_keys?: number; asymmetric_revoked_keys?: number; asymmetric_expired_keys?: number; asymmetric_expiring_soon?: number; enrolled_device_bound?: boolean; enrolled_rotation_due?: boolean; enrolled_rotation_due_at?: string | null; registered: boolean; status: "ONLINE" | "STALE" | "OFFLINE" | "MISSING" | string; heartbeat_age_seconds: number | null; expected_region?: string | null; expected_node_name?: string | null; region: string; node_name: string; phien_ban?: string | null; lan_heartbeat?: string | null; lan_mau?: string | null; warnings: string[] };
export type OpsProbeFleet = { phien_ban: string; mode: string; stale_after_seconds: number; offline_after_seconds: number; expected: number; configured_profiles: number; per_agent_keys: number; asymmetric_public_keys?: number; enrolled_public_keys?: number; enrolled_device_bound?: number; enrolled_rotation_due?: number; asymmetric_key_lifecycle?: { configured_keys: number; active_keys: number; revoked_keys: number; disabled_keys: number; expired_keys: number; not_yet_valid_keys: number; expiring_soon_keys: number; expiry_warn_days: number; secret_values_exposed: false }; shared_secret_enabled: boolean; registered: number; online: number; stale: number; offline: number; missing: number; unmanaged: number; registration_coverage_percent: number; online_coverage_percent: number; key_coverage_percent: number; ready: boolean; warnings: string[]; agents: OpsProbeFleetAgent[]; secret_values_exposed: false; loi?: string };
export type OpsQuorumRegion = { region: string; observed: boolean; healthy: boolean; status: string; agent_id: string | null; node_name: string | null; http_status: number | null; latency_ms: number | null; latency_target_ms: number | null; heartbeat_age_seconds: number | null; baseline_median_ms: number | null; latency_threshold_ms: number | null; latency_anomaly: boolean; status_anomaly: boolean };
export type OpsQuorumEndpoint = { endpoint_id: string; expected_regions: number; observed_regions: number; healthy_regions: number; quorum_required: number; quorum_met: boolean; consensus: "QUORUM_OK" | "DEGRADED" | "OUTAGE" | string; alert_level?: "OK" | "WARNING" | "CRITICAL" | string; disagreement: boolean; anomaly_regions: string[]; regions: OpsQuorumRegion[] };
export type OpsMultiRegionQuorum = { phien_ban: string; config: { window_seconds: number; min_regions: number; healthy_percent: number; anomaly_lookback_minutes: number; anomaly_min_samples: number; anomaly_latency_multiplier: number; alert_enabled: boolean }; expected_regions: string[]; summary: { endpoints: number; quorum_ok: number; degraded: number; outage: number; disagreements: number; anomalies: number }; ready: boolean; alert?: { enabled: boolean; active: boolean; level: string; issues: string[] }; endpoints: OpsQuorumEndpoint[]; loi?: string };
export type OpsServiceDependency = { phien_ban: string; configured: boolean; source: string; services: string[]; dependencies: Record<string, string[]>; endpoint_services: Record<string, string>; root_failures: string[]; impacted_services: string[]; blast_radius: number; severity: "OK" | "WARNING" | "CRITICAL" | string; ready: boolean; correlations: Array<{ endpoint_id: string; consensus: string; alert_level: string; root_service: string; impacted_services: string[] }> };
export type OpsOnCallScheduleAdmin = { id: string; dich_vu: string; nguoi_dung_id: string; thu_trong_tuan: number; bat_dau_phut: number; ket_thuc_phut: number; timezone: string; cap_escalation: number; dang_hoat_dong: boolean; nguoi_dung?: { id: string; ho_ten: string; thu_dien_tu: string; da_kich_hoat: boolean } };
export type OpsEscalationPolicyAdmin = { id: string; dich_vu: string; cap_escalation: number; sau_phut: number; kenh: "EMAIL" | "WEBHOOK" | "EMAIL_WEBHOOK" | string; dang_hoat_dong: boolean };
export type WebhookReplayJobAdmin = { id: string; trang_thai: string; tong: number; da_xu_ly: number; thanh_cong: number; that_bai: number; da_huy: boolean; progress_percent: number; ngay_tao: string; items?: Array<{ id: string; dead_letter_history_id: string; trang_thai: string; loi?: string | null }> };
export type DlqKeyringAdmin = { active_key_id: string | null; key_ids: string[]; configured_keys: number; requested_active_key_id?: string | null; theo_key: Array<{ key_id: string; so_luong: number }>; kms_friendly: boolean; secret_values_exposed: boolean };
export type OpsArchivePreviewAdmin = { bang_nguon: "lich_su_van_hanh" | "slo_endpoint_mau"; thang: string; eligible_count: number; min_id: string | null; max_id: string | null; sha256: string; retention: Record<string, number>; archived: boolean; existing_batch?: Record<string, unknown> | null; da_archive?: boolean; partition_name?: string };
export type OpsOnCallOverrideAdmin = { id: string; loai: "ABSENCE" | "OVERRIDE"; dich_vu: string; nguoi_dung_id: string; bat_dau: string; ket_thuc: string; ly_do: string; active: boolean; nguoi_dung?: { id: string; ho_ten: string; thu_dien_tu: string; da_kich_hoat: boolean } | null };
export type OpsOnCallHandoffAdmin = { generated_at: string; service: string; current: OpsOnCallScheduleAdmin[]; overrides: OpsOnCallOverrideAdmin[]; open_incidents: SuCoVanHanhTomTat[]; escalation_ack_24h: LichSuVanHanhAdmin[]; policies: OpsEscalationPolicyAdmin[] };
export type ProbeDesiredStateAdmin = {
  health_gate?: { status: string; active: boolean; healthy: boolean; in_grace: boolean; enabled: boolean; auto_rollback: boolean; min_online_percent: number; max_quorum_failures: number; online_percent: number; quorum_failures: number; grace_seconds: number };
  current: { revision: number; target_version: string; interval_seconds: number; rollout_percent: number; canary_agents: string[]; paused: boolean; note: string; updated_at: string; updated_by: string | null; rollback_of: number | null };
  previous?: ProbeDesiredStateAdmin["current"] | null; history: ProbeDesiredStateAdmin["current"][]; source: string; remote_code_execution: false; signed_delivery: boolean; signing?: { algorithm: string; configured: boolean; key_id: string; public_key_fingerprint: string | null; private_key_exposed: false };
};
export type IncidentPostmortemActionAdmin = { id: string; title: string; owner: string; status: "OPEN" | "IN_PROGRESS" | "DONE"; due_date: string | null };
export type IncidentPostmortemAdmin = { incident_id: string; status: "DRAFT" | "COMPLETE"; approval_status?: "NOT_READY" | "PENDING" | "APPROVED" | "CHANGES_REQUESTED"; approval_note?: string; approved_at?: string | null; approved_by?: string | null; summary: string; impact: string; root_cause: string; detection: string; resolution: string; runbook_url: string; lessons: string; action_items: IncidentPostmortemActionAdmin[]; timeline_snapshot: { generated_at?: string; events?: number; first_event_at?: string | null; last_event_at?: string | null; milestones?: Array<Record<string, unknown>> }; updated_at?: string | null; updated_by?: string | null };
export type DatabaseRecoveryAdmin = { pitr_target_time_supported?: boolean; pitr_target_time_report?: Record<string, unknown> | null; pitr_drill_opt_in?: boolean; pitr_drill_script?: string; rpo_target_minutes: number; rto_target_minutes: number; drill_max_age_days: number; method: string; pitr_ready: boolean; pitr_restore_exercised: boolean; wal_archive: { wal_level: string; archive_mode: string; archive_command_configured: boolean; archived_count: string; failed_count: string; last_archived_wal: string | null; last_archived_time: string | null }; observed_rpo_minutes: number | null; rpo_met: boolean | null; last_drill: Record<string, unknown> | null; drill_age_days: number | null; drill_fresh: boolean; observed_rto_seconds: number | null; rto_met: boolean | null; optional_compose_override: string };
export type OpsRuntimeAdmin = { phien_ban: string; probe_health_gate?: { phien_ban: string; status: string; active: boolean; healthy: boolean; in_grace: boolean; enabled: boolean; auto_rollback: boolean; min_online_percent: number; max_quorum_failures: number; grace_seconds: number; max_burn_rate?: number; burn_rate_max_observed?: number | null; burn_rate_blocked?: boolean; rollback_cooldown_minutes?: number; cooldown_remaining_minutes?: number; rollback_approval_required?: boolean; rollback_approved_for_revision?: boolean; online_percent: number; quorum_failures: number; revision: number; previous_available: boolean; remote_code_execution: false }; service_runbooks?: { configured: boolean; runbooks: Record<string, string>; https_only: boolean; secret_values_exposed: false }; probe_agent: { agent_id: string; region: string; node_name: string }; endpoint_samples: number; dlq: { chu_ky_phut: number; max_attempts: number; payload_encryption_ready: boolean; key_id?: string | null; key_source?: string | null }; ops_metrics: { refresh_phut: number; retention_days: number; cache?: Record<string, unknown> | null }; rbac: { active_assignments: number; roles: string[] }; distributed_probe?: { stale_after_seconds: number; online: number; offline: number; agents: OpsProbeAgentHealth[] }; probe_fleet?: OpsProbeFleet; multi_region_quorum?: OpsMultiRegionQuorum; asymmetric_probe_signing?: { algorithm: string; public_keyring_configured: boolean; hmac_backward_compatible: boolean; key_lifecycle?: { configured_keys: number; active_keys: number; revoked_keys: number; disabled_keys: number; expired_keys: number; not_yet_valid_keys: number; expiring_soon_keys: number; expiry_warn_days: number; secret_values_exposed: false }; secret_values_exposed: false }; quorum_alerting?: { enabled: boolean; active: boolean; level: string; issues: string[] }; service_dependency?: OpsServiceDependency; probe_enrollment?: { configured: boolean; ttl_minutes: number; enrolled_public_keys: number; token_visible_once: boolean; private_key_exposed: false; require_device_id?: boolean; rotation_days?: number; device_bound_agents?: number; rotation_due_agents?: number; raw_device_id_exposed?: false }; archive_portability?: { format: string; archived_batches: number; s3_presigned_upload: boolean; s3_allowed_hosts_configured: number; restore_replay_supported: boolean; retention_class: string; secret_values_exposed: false }; probe_desired_state?: ProbeDesiredStateAdmin; incident_postmortem?: { postmortems: number; complete: number; draft: number; open_actions: number; done_actions: number; approved?: number; pending_approval?: number; changes_requested?: number; overdue_actions?: number; due_soon_actions?: number; approval_required?: boolean; timeline_snapshot: boolean; https_runbook_only: boolean }; database_recovery?: DatabaseRecoveryAdmin & { evidence_export_supported?: boolean; evidence_history_count?: number; evidence_retention_runs?: number }; remediation_backlog?: { open_actions: number; overdue_actions: number; due_soon_actions: number; unowned_actions: number; owners: Record<string, number>; on_call_escalation_ready: boolean }; on_call_v3160?: { calendar_format: string; calendar_import_export: boolean; handoff_report: boolean; escalation_acknowledgment: boolean; active_overrides: number; current: OpsOnCallScheduleAdmin[] }; dlq_keyring?: DlqKeyringAdmin; replay_jobs?: { cho_xu_ly: number; dang_xu_ly: number }; on_call?: { at: string; service: string; current: OpsOnCallScheduleAdmin[]; policies: OpsEscalationPolicyAdmin[] }; archive?: { retention: Record<string, number>; partitioned_store: string; verify_before_prune: boolean } };
export type OpsPhanCongAdmin = { id: string; nguoi_dung_id: string; dich_vu: string; vai_tro_ops: "OPS_VIEWER" | "ON_CALL" | "SERVICE_OWNER" | string; cap_escalation: number; dang_hoat_dong: boolean; ngay_tao: string; ngay_cap_nhat: string; nguoi_dung?: { id: string; ho_ten: string; thu_dien_tu: string; vai_tro: string; da_kich_hoat: boolean } };
export type BurnRateWindowAdmin = { cua_so_gio: number; tong_mau: number; mau_xau: number; burn_rate: number | null; muc_do: "TOT" | "CANH_BAO" | "CAO" | "NGHIEM_TRONG" | "CHUA_CO_DU_LIEU" | string };
export type ErrorBudgetAdmin = { tong_mau: number; mau_xau: number; loi_cho_phep_percent: number; da_tieu_thu_percent: number | null; con_lai_percent: number | null };
export type SuCoVanHanhTomTat = { chu_ky: string; trang_thai_xu_ly: "MOI" | "DA_TIEP_NHAN" | "DA_KHAC_PHUC" | string; bat_dau: string; gan_nhat: string; so_su_kien: number; so_health: number; so_alert: number; trang_thai_gan_nhat: string; van_de: string[]; thoi_luong_phut: number; ghi_chu?: string | null; dich_vu?: string | null; chu_so_huu_id?: string | null; chu_so_huu_ten?: string | null; nguoi_tiep_nhan_ten?: string | null; tiep_nhan_luc?: string | null; nguoi_khac_phuc_ten?: string | null; khac_phuc_luc?: string | null };
export type ChiTietSuCoVanHanh = SuCoVanHanhTomTat & { su_kien: LichSuVanHanhAdmin[] };
export type SlaTongQuanAdmin = { tong: number; tot: number; canh_bao: number; loi: number; sla_percent: number | null; uptime_percent: number | null; dat_sla?: boolean | null; dat_uptime?: boolean | null };
export type SlaVanHanhAdmin = { so_ngay: number; tu_ngay: string; tao_luc: string; dinh_nghia: { sla: string; uptime: string; error_budget: string; endpoint_slo?: string }; muc_tieu: { sla_muc_tieu_percent: number; uptime_muc_tieu_percent: number; canh_bao_xu_huong: boolean; nguon_cau_hinh: string }; cau_hinh_nang_cao?: CauHinhSloNangCaoAdmin; tong_quan: SlaTongQuanAdmin; xu_huong: { bay_ngay: SlaTongQuanAdmin; ba_muoi_ngay: SlaTongQuanAdmin; chin_muoi_ngay?: SlaTongQuanAdmin }; comparison?: { bay_ngay: SlaTongQuanAdmin; ba_muoi_ngay: SlaTongQuanAdmin; chin_muoi_ngay: SlaTongQuanAdmin }; ngan_sach_loi: { sla: ErrorBudgetAdmin; uptime: ErrorBudgetAdmin }; ngan_sach_dich_vu?: Record<string, ErrorBudgetAdmin & { muc_tieu_percent: number }>; burn_rate: { sla: { mot_gio: BurnRateWindowAdmin; sau_gio: BurnRateWindowAdmin; hai_muoi_bon_gio: BurnRateWindowAdmin }; uptime: { mot_gio: BurnRateWindowAdmin; sau_gio: BurnRateWindowAdmin; hai_muoi_bon_gio: BurnRateWindowAdmin } }; burn_rate_policy?: Array<{ gio: number; nguong: number; muc_do: string; sla: BurnRateWindowAdmin & { vuot_nguong: boolean; muc_do_policy: string }; uptime: BurnRateWindowAdmin & { vuot_nguong: boolean; muc_do_policy: string } }>; burn_rate_series?: Array<{ ngay: string; sla_burn_rate: number | null; uptime_burn_rate: number | null }>; endpoint_slo?: { time_weighted: boolean; maintenance_aware?: boolean; endpoints: EndpointSloAdmin[] }; maintenance_policy_applied?: { exclude_from_availability: boolean; exclude_from_error_budget: boolean; max_gap_multiplier: number; availability_samples: number; error_budget_samples: number }; maintenance_annotations?: Array<{ ngay: string; id: string; ten: string; lap_lai: string }>; incident_metrics?: { tong_incident: number; dang_mo: number; da_khac_phuc: number; mtta_phut: number | null; mtta_p95_phut: number | null; mttr_phut: number | null; mttr_p95_phut: number | null; nguon?: string; refreshed_at?: string | null }; canh_bao: string[]; theo_ngay: Array<{ ngay: string; tong: number; tot: number; canh_bao: number; loi: number; sla_percent: number | null; uptime_percent: number | null }> };
export type ThongKeVanHanhAdmin = { tao_luc: string; bay_ngay: ThongKeVanHanhKy; ba_muoi_ngay: ThongKeVanHanhKy };
export type ThongKeVanHanhKy = { so_ngay: number; tu_ngay: string; health: { tong: number; tot: number; canh_bao: number; loi: number; ty_le_tot: number | null }; backup: { tong: number; thanh_cong: number; that_bai: number; ty_le_thanh_cong: number | null }; restore: { tong: number; thanh_cong: number; that_bai: number; ty_le_thanh_cong: number | null }; canh_bao_email: number };
export type LichSuKhoAdmin = { id: string; loai_su_kien: string; loai_bien_dong: "NHAP_KHO" | "XUAT_KHO" | "DIEU_CHINH" | string; ton_cu: number; ton_moi: number; chenh_lech: number; ly_do: string; ma_bien_the: string; ma_san_pham: string; nguoi_thuc_hien?: { id: string; ho_ten: string; thu_dien_tu?: string } | null; chi_tiet: Record<string, unknown>; ngay_tao: string };
export type AdminCauHinhKho = { nguong_sap_het: number; ngay_cap_nhat?: string | null };
export type DongImportKhoAdmin = { dong: number; ma_bien_the: string; so_luong_nhap: number; ly_do: string; hop_le: boolean; loi: string[]; bien_the_id?: string | null; ma_san_pham: string; ten_san_pham: string; ton_hien_tai: number | null; ton_sau_nhap: number | null };
export type KiemTraImportKhoAdmin = { ten_file: string; tong_dong: number; hop_le: number; khong_hop_le: number; dong: DongImportKhoAdmin[] };
export type NhaCungCapAdmin = { id: string; ma_nha_cung_cap: string; ten_nha_cung_cap: string; nguoi_lien_he?: string | null; so_dien_thoai?: string | null; thu_dien_tu?: string | null; dia_chi?: string | null; ghi_chu?: string | null; dang_hoat_dong: boolean; so_phieu_nhap: number; ngay_tao: string; ngay_cap_nhat: string };
export type PhieuNhapKhoAdmin = { id: string; ma_phieu: string; ma_lo?: string | null; nha_cung_cap?: string | null; nha_cung_cap_id?: string | null; nha_cung_cap_ref?: { id: string; ma_nha_cung_cap: string; ten_nha_cung_cap: string } | null; ghi_chu?: string | null; nguoi_tao_id?: string | null; so_dong: number; tong_so_luong: number; ngay_tao: string; chi_tiet: Array<{ id?: string; ma_bien_the: string; so_luong_nhap: number; ton_truoc: number; ton_sau: number; ly_do?: string | null; ma_san_pham?: string; ten_san_pham?: string; vat_lieu?: string; mau_sac?: string }> };
export type TrangThaiCanhBaoKhoEmailAdmin = { bat: boolean; chu_ky_phut: number; so_nguoi_nhan: number; lan_gui_cuoi?: string | null; tong_canh_bao_lan_cuoi: number; trang_thai_lan_cuoi: string };
export type AdminSucKhoeHeThong = {
  trang_thai: "TOT" | "CANH_BAO" | "LOI";
  phien_ban: string;
  thoi_gian: string;
  api: { uptime_giay: number; node: string; pid: number; rss_bytes: number; heap_used_bytes: number; heap_total_bytes: number };
  database: { ket_noi: boolean; do_tre_ms: number | null; dung_luong_bytes: number | null; migration_gan_nhat: { ten: string; hoan_tat_luc?: string | null } | null; loi?: string };
  smtp: { bat: boolean; san_sang: boolean; host?: string | null; port?: number | null; from: string; loi?: string };
  backup: { thu_muc: string; so_ban_sao: number; so_daily: number; so_weekly: number; tong_dung_luong_bytes: number; gan_nhat: { ten_file: string; kich_thuoc_bytes: number; ngay_sua: string; tuoi_gio: number } | null; loi?: string };
  canh_bao_kho: { bat: boolean; chu_ky_phut: number };
  bao_tri: BaoTriHeThongAdmin;
  webhook: { bat: boolean; san_sang: boolean; endpoint: string; timeout_ms: number; max_retries?: number; backoff_ms?: number; co_hmac?: boolean; adapter?: "GENERIC" | "SLACK" | "TEAMS" | "DISCORD" | string; dlq_retention_days?: number; replay_allow_duplicate?: boolean; dlq_encryption_ready?: boolean; dlq_scheduler?: { chu_ky_phut: number; max_attempts: number } };
  van_de?: string[];
  chu_ky_canh_bao?: string | null;
  canh_bao_he_thong: { bat: boolean; chu_ky_phut: number; backup_qua_han_gio: number; im_lang_phut: number; leo_thang_phut: number; nguon_cau_hinh?: string };
};

export type AdminTongQuan = {
  nguoi_dung: number;
  khach_hang: number;
  nhan_vien: number;
  ca_lam_viec: number;
  phan_ca: number;
  don_hang: number;
  san_pham: number;
  ky_bao_cao: { hom_nay: string; tu_7_ngay: string; tu_30_ngay: string };
  doanh_thu: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number; gia_tri_don_trung_binh_30_ngay: number };
  don_hang_theo_ky: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  don_ghi_nhan_doanh_thu_theo_ky: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  don_da_giao_theo_ky: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  khach_hang_moi: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  trang_thai_don_hang: Record<string, number>;
  doanh_thu_theo_ngay: Array<{ ngay: string; doanh_thu: number; so_don: number }>;
  top_san_pham_30_ngay: Array<{ ma_san_pham: string; ten_san_pham: string; so_luong: number; doanh_thu: number }>;
  canh_bao_kho: { nguong_sap_het: number; sap_het: number; het_hang: number; tong_canh_bao: number };
  ton_kho_thap: Array<{ id: string; ma_bien_the: string; so_luong_ton: number; ma_san_pham: string; ten_san_pham: string; mau_sac: string; vat_lieu: string }>;
  don_gan_day: Array<{ id: string; ma_don_hang: string; ho_ten_nguoi_nhan: string; tong_tien: number; trang_thai: string; ngay_tao: string }>;
};

export const layTongQuan = () => goi<AdminTongQuan>("/quan-tri/tong-quan");
export const laySucKhoeHeThongAdmin = () => goi<AdminSucKhoeHeThong>("/quan-tri/he-thong/suc-khoe");
export const layCauHinhCanhBaoHeThongAdmin = () => goi<CauHinhCanhBaoHeThongAdmin>("/quan-tri/he-thong/cau-hinh-canh-bao");
export const capNhatCauHinhCanhBaoHeThongAdmin = (payload: Omit<CauHinhCanhBaoHeThongAdmin, "nguon_cau_hinh" | "ngay_cap_nhat">) => goi<CauHinhCanhBaoHeThongAdmin>("/quan-tri/he-thong/cau-hinh-canh-bao", { method: "POST", body: JSON.stringify(payload) });
export const layCauHinhSloVanHanhAdmin = () => goi<CauHinhSloVanHanhAdmin>("/quan-tri/he-thong/cau-hinh-slo");
export const capNhatCauHinhSloVanHanhAdmin = (payload: Omit<CauHinhSloVanHanhAdmin, "nguon_cau_hinh" | "ngay_cap_nhat">) => goi<CauHinhSloVanHanhAdmin>("/quan-tri/he-thong/cau-hinh-slo", { method: "POST", body: JSON.stringify(payload) });
export const layBaoTriHeThongAdmin = () => goi<BaoTriHeThongAdmin>("/quan-tri/he-thong/bao-tri");
export const capNhatBaoTriHeThongAdmin = (payload: { bat: boolean; bat_dau?: string; ket_thuc?: string; ly_do?: string }) => goi<BaoTriHeThongAdmin>("/quan-tri/he-thong/bao-tri", { method: "POST", body: JSON.stringify(payload) });
export const layDanhSachBaoTriAdmin = () => goi<DanhSachBaoTriAdmin>("/quan-tri/he-thong/bao-tri/danh-sach");
export const taoBaoTriAdmin = (payload: { ten: string; bat: boolean; bat_dau: string; ket_thuc: string; lap_lai: "KHONG" | "HANG_NGAY" | "HANG_TUAN"; ly_do?: string }) => goi<DanhSachBaoTriAdmin>("/quan-tri/he-thong/bao-tri/danh-sach", { method: "POST", body: JSON.stringify(payload) });
export const capNhatBaoTriNangCaoAdmin = (id: string, payload: Partial<{ ten: string; bat: boolean; bat_dau: string; ket_thuc: string; lap_lai: "KHONG" | "HANG_NGAY" | "HANG_TUAN"; ly_do: string }>) => goi<DanhSachBaoTriAdmin>(`/quan-tri/he-thong/bao-tri/${encodeURIComponent(id)}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaBaoTriAdmin = (id: string) => goi<DanhSachBaoTriAdmin>(`/quan-tri/he-thong/bao-tri/${encodeURIComponent(id)}/xoa`, { method: "POST" });
export const layCauHinhSloNangCaoAdmin = () => goi<CauHinhSloNangCaoAdmin>("/quan-tri/he-thong/cau-hinh-slo-nang-cao");
export const capNhatCauHinhSloNangCaoAdmin = (payload: Pick<CauHinhSloNangCaoAdmin, "burn_windows" | "service_targets" | "endpoint_checks" | "maintenance_policy">) => goi<CauHinhSloNangCaoAdmin>("/quan-tri/he-thong/cau-hinh-slo-nang-cao", { method: "POST", body: JSON.stringify(payload) });
export const laySlaVanHanhAdmin = (so_ngay: 30 | 90 = 90) => goi<SlaVanHanhAdmin>(`/quan-tri/he-thong/sla?so_ngay=${so_ngay}`);
export const layDanhSachSuCoVanHanhAdmin = (gioi_han = 20, trang_thai_xu_ly = "", tu_ngay = "", den_ngay = "") => { const q = new URLSearchParams({ gioi_han: String(gioi_han) }); if (trang_thai_xu_ly) q.set("trang_thai_xu_ly", trang_thai_xu_ly); if (tu_ngay) q.set("tu_ngay", tu_ngay); if (den_ngay) q.set("den_ngay", den_ngay); return goi<{ du_lieu: SuCoVanHanhTomTat[]; gioi_han: number; nguon: string }>(`/quan-tri/he-thong/su-co?${q}`); };
export const layChiTietSuCoVanHanhAdmin = (chu_ky: string) => goi<ChiTietSuCoVanHanh>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}`);
export const xuatDanhSachSuCoExcelAdmin = (trang_thai_xu_ly = "", tu_ngay = "", den_ngay = "") => { const q = new URLSearchParams(); if (trang_thai_xu_ly) q.set("trang_thai_xu_ly", trang_thai_xu_ly); if (tu_ngay) q.set("tu_ngay", tu_ngay); if (den_ngay) q.set("den_ngay", den_ngay); return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/he-thong/su-co/excel${q.size ? `?${q}` : ""}`); };
export const xuatChiTietSuCoExcelAdmin = (chu_ky: string) => goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/excel`);
export const xuatOpsTongHopExcelAdmin = (trang_thai_xu_ly = "", tu_ngay = "", den_ngay = "") => { const q = new URLSearchParams(); if (trang_thai_xu_ly) q.set("trang_thai_xu_ly", trang_thai_xu_ly); if (tu_ngay) q.set("tu_ngay", tu_ngay); if (den_ngay) q.set("den_ngay", den_ngay); return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/he-thong/ops/excel${q.size ? `?${q}` : ""}`); };
export const layWebhookDeliveryAdmin = (gioi_han = 30, trang_thai = "") => { const q = new URLSearchParams({ gioi_han: String(gioi_han) }); if (trang_thai) q.set("trang_thai", trang_thai); return goi<{ du_lieu: WebhookDeliveryAdmin[]; gioi_han: number; cau_hinh: AdminSucKhoeHeThong["webhook"] }>(`/quan-tri/he-thong/webhook/delivery?${q}`); };
export const layOpsRuntimeAdmin = () => goi<OpsRuntimeAdmin>("/quan-tri/he-thong/ops/runtime");
export const layProbeDesiredStateAdmin = () => goi<ProbeDesiredStateAdmin>("/quan-tri/he-thong/ops/probe-desired-state");
export const capNhatProbeDesiredStateAdmin = (payload: { target_version: string; interval_seconds: number; rollout_percent: number; canary_agents: string[]; paused: boolean; note?: string }) => goi<ProbeDesiredStateAdmin>("/quan-tri/he-thong/ops/probe-desired-state", { method: "POST", body: JSON.stringify(payload) });
export const rollbackProbeDesiredStateAdmin = () => goi<ProbeDesiredStateAdmin>("/quan-tri/he-thong/ops/probe-desired-state/rollback", { method: "POST" });
export const approveProbeRollbackAdmin = (note = "") => goi<{revision:number;approved_at:string;approved_by:string;note:string}>("/quan-tri/he-thong/ops/probe-health-gate/approve-rollback", { method: "POST", body: JSON.stringify({ note }) });
export const layIncidentPostmortemAdmin = (chu_ky: string) => goi<IncidentPostmortemAdmin>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/postmortem`);
export const luuIncidentPostmortemAdmin = (chu_ky: string, payload: Omit<IncidentPostmortemAdmin, "incident_id" | "status" | "approval_status" | "approval_note" | "approved_at" | "approved_by" | "timeline_snapshot" | "updated_at" | "updated_by">) => goi<IncidentPostmortemAdmin>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/postmortem`, { method: "POST", body: JSON.stringify(payload) });
export const duyetIncidentPostmortemAdmin = (chu_ky: string, decision: "APPROVED" | "CHANGES_REQUESTED", note = "") => goi<IncidentPostmortemAdmin>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/postmortem/approval`, { method: "POST", body: JSON.stringify({ decision, note }) });
export const layOpsPhanCongAdmin = () => goi<{ du_lieu: OpsPhanCongAdmin[]; roles: string[]; services: string[] }>("/quan-tri/he-thong/ops/phan-cong");
export const taoOpsPhanCongAdmin = (payload: { nguoi_dung_id: string; dich_vu: string; vai_tro_ops: "OPS_VIEWER" | "ON_CALL" | "SERVICE_OWNER"; cap_escalation?: number; dang_hoat_dong?: boolean }) => goi<OpsPhanCongAdmin>("/quan-tri/he-thong/ops/phan-cong", { method: "POST", body: JSON.stringify(payload) });
export const capNhatOpsPhanCongAdmin = (id: string, payload: { cap_escalation?: number; dang_hoat_dong?: boolean }) => goi<OpsPhanCongAdmin>(`/quan-tri/he-thong/ops/phan-cong/${encodeURIComponent(id)}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaOpsPhanCongAdmin = (id: string) => goi<{ da_xoa: boolean; id: string }>(`/quan-tri/he-thong/ops/phan-cong/${encodeURIComponent(id)}/xoa`, { method: "POST" });
export const layOpsOnCallAdmin = () => goi<{ schedules: OpsOnCallScheduleAdmin[]; policies: OpsEscalationPolicyAdmin[]; current: { at: string; service: string; current: OpsOnCallScheduleAdmin[]; policies: OpsEscalationPolicyAdmin[] }; overrides?: OpsOnCallOverrideAdmin[]; calendar_format?: string; handoff_supported?: boolean }>("/quan-tri/he-thong/ops/on-call");
export const taoOpsOnCallAdmin = (payload: { dich_vu: string; nguoi_dung_id: string; thu_trong_tuan: number; bat_dau_phut: number; ket_thuc_phut: number; timezone?: string; cap_escalation?: number; dang_hoat_dong?: boolean }) => goi<OpsOnCallScheduleAdmin>("/quan-tri/he-thong/ops/on-call", { method: "POST", body: JSON.stringify(payload) });
export const xuatOpsOnCallCalendarAdmin = () => goi<{ ten_file: string; mime_type: string; base64: string; schedules: number }>("/quan-tri/he-thong/ops/on-call/calendar");
export const layOpsOnCallHandoffAdmin = (dich_vu = "") => goi<OpsOnCallHandoffAdmin>(`/quan-tri/he-thong/ops/on-call/handoff${dich_vu ? `?dich_vu=${encodeURIComponent(dich_vu)}` : ""}`);
export const layOpsOnCallOverridesAdmin = () => goi<{ du_lieu: OpsOnCallOverrideAdmin[] }>("/quan-tri/he-thong/ops/on-call/overrides");
export const xoaOpsOnCallAdmin = (id: string) => goi<{ da_xoa: boolean; id: string }>(`/quan-tri/he-thong/ops/on-call/${encodeURIComponent(id)}/xoa`, { method: "POST" });
export const capNhatOpsEscalationAdmin = (payload: { dich_vu: string; cap_escalation: number; sau_phut: number; kenh?: "EMAIL" | "WEBHOOK" | "EMAIL_WEBHOOK"; dang_hoat_dong?: boolean }) => goi<OpsEscalationPolicyAdmin>("/quan-tri/he-thong/ops/escalation", { method: "POST", body: JSON.stringify(payload) });
export const layOpsArchivePreviewAdmin = (bang_nguon: "lich_su_van_hanh" | "slo_endpoint_mau", thang: string) => { const q = new URLSearchParams({ bang_nguon, thang }); return goi<OpsArchivePreviewAdmin>(`/quan-tri/he-thong/ops/archive/preview?${q}`); };
export const xuatOpsArchiveBundleAdmin = (bang_nguon: "lich_su_van_hanh" | "slo_endpoint_mau", thang: string) => { const q = new URLSearchParams({ bang_nguon, thang }); return goi<{ ten_file: string; mime_type: string; base64: string; sha256: string; gzip_sha256: string; manifest: { records: number; retention_class: string } }>(`/quan-tri/he-thong/ops/archive/export?${q}`); };
export const archiveOpsAdmin = (bang_nguon: "lich_su_van_hanh" | "slo_endpoint_mau", thang: string) => goi<OpsArchivePreviewAdmin>("/quan-tri/he-thong/ops/archive", { method: "POST", body: JSON.stringify({ bang_nguon, thang }) });
export const layOpsAccess = () => goi<OpsAccessAdmin>("/ops/toi");
export const layOpsDashboardReadonly = (so_ngay = 90) => goi<{ access: OpsAccessAdmin; sla: SlaVanHanhAdmin; incidents: { du_lieu: SuCoVanHanhTomTat[]; nguon: string }; runtime: OpsRuntimeAdmin }>(`/ops/dashboard?so_ngay=${so_ngay}`);
export const layOpsTimelineReadonly = (chu_ky: string, bo_loc: { q?: string; cursor?: string | null; kich_thuoc?: number } = {}) => { const q = new URLSearchParams(); if (bo_loc.q) q.set("q", bo_loc.q); if (bo_loc.cursor) q.set("cursor", bo_loc.cursor); if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc)); return goi<KetQuaCursor<LichSuVanHanhAdmin>>(`/ops/su-co/${encodeURIComponent(chu_ky)}/timeline?${q}`); };

export const layWebhookDeadLetterAdmin = (gioi_han = 30, trang_thai = "") => { const q = new URLSearchParams({ gioi_han: String(gioi_han) }); if (trang_thai) q.set("trang_thai", trang_thai); return goi<{ du_lieu: WebhookDeadLetterAdmin[]; gioi_han: number; bo_loc: { trang_thai: string | null }; cau_hinh: AdminSucKhoeHeThong["webhook"] }>(`/quan-tri/he-thong/webhook/dead-letter?${q}`); };
export const replayWebhookDeadLetterAdmin = (id: string) => goi<{ dead_letter_id: string; da_gui: boolean; ly_do?: string; http_status?: number; so_lan_thu: number; adapter: string; bo_qua_idempotency?: boolean; idempotency_key?: string }>(`/quan-tri/he-thong/webhook/dead-letter/${encodeURIComponent(id)}/replay`, { method: "POST" });
export const acknowledgeWebhookDeadLetterAdmin = (id: string, ghi_chu = "") => goi<{ dead_letter_id: string; da_ack: boolean; lap_lai: boolean }>(`/quan-tri/he-thong/webhook/dead-letter/${encodeURIComponent(id)}/ack`, { method: "POST", body: JSON.stringify({ ghi_chu }) });
export const replayBulkWebhookDeadLetterAdmin = (ids: string[], bo_qua_idempotency = false) => goi<{ tong: number; thanh_cong: number; that_bai: number; ket_qua: Array<Record<string, unknown>> }>(`/quan-tri/he-thong/webhook/dead-letter/replay-bulk`, { method: "POST", body: JSON.stringify({ ids, bo_qua_idempotency }) });
export const layDlqKeyringAdmin = () => goi<DlqKeyringAdmin>("/quan-tri/he-thong/webhook/dead-letter/keyring");
export const rotateDlqKeyAdmin = (gioi_han = 100) => goi<{ active_key_id: string; requested: number; rotated: number; failed: Array<Record<string, unknown>> }>("/quan-tri/he-thong/webhook/dead-letter/keyring/rotate", { method: "POST", body: JSON.stringify({ gioi_han }) });
export const layWebhookReplayJobsAdmin = () => goi<{ du_lieu: WebhookReplayJobAdmin[] }>("/quan-tri/he-thong/webhook/dead-letter/replay-jobs");
export const taoWebhookReplayJobAdmin = (ids: string[], bo_qua_idempotency = false) => goi<WebhookReplayJobAdmin>("/quan-tri/he-thong/webhook/dead-letter/replay-jobs", { method: "POST", body: JSON.stringify({ ids, bo_qua_idempotency }) });
export const huyWebhookReplayJobAdmin = (id: string) => goi<WebhookReplayJobAdmin>(`/quan-tri/he-thong/webhook/dead-letter/replay-jobs/${encodeURIComponent(id)}/huy`, { method: "POST" });
export const ganChuSoHuuSuCoAdmin = (chu_ky: string, payload: { nguoi_dung_id?: string; dich_vu?: string } = {}) => goi<SuCoVanHanhTomTat>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/chu-so-huu`, { method: "POST", body: JSON.stringify(payload) });
export const layTimelineSuCoVanHanhAdmin = (chu_ky: string, bo_loc: { q?: string; cursor?: string | null; kich_thuoc?: number } = {}) => { const q = new URLSearchParams(); if (bo_loc.q?.trim()) q.set("q", bo_loc.q.trim()); if (bo_loc.cursor) q.set("cursor", bo_loc.cursor); if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc)); return goi<{ du_lieu: LichSuVanHanhAdmin[]; cursor: CursorTrang; q: string }>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/timeline${q.size ? `?${q}` : ""}`); };
export const tiepNhanSuCoVanHanhAdmin = (chu_ky: string, ghi_chu = "") => goi<ChiTietSuCoVanHanh>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/tiep-nhan`, { method: "POST", body: JSON.stringify({ ghi_chu }) });
export const khacPhucSuCoVanHanhAdmin = (chu_ky: string, ghi_chu = "") => goi<ChiTietSuCoVanHanh>(`/quan-tri/he-thong/su-co/${encodeURIComponent(chu_ky)}/khac-phuc`, { method: "POST", body: JSON.stringify({ ghi_chu }) });
export const layThongKeVanHanhAdmin = () => goi<ThongKeVanHanhAdmin>("/quan-tri/he-thong/thong-ke");
export const layLichSuVanHanhAdmin = (bo_loc: { loai?: string; trang_thai?: string; tu_ngay?: string; den_ngay?: string; trang?: number; kich_thuoc?: number } = {}) => { const q = new URLSearchParams(); if (bo_loc.loai) q.set("loai", bo_loc.loai); if (bo_loc.trang_thai) q.set("trang_thai", bo_loc.trang_thai); if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay); if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay); if (bo_loc.trang) q.set("trang", String(bo_loc.trang)); if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc)); return goi<KetQuaPhanTrang<LichSuVanHanhAdmin>>(`/quan-tri/he-thong/lich-su${q.size ? `?${q}` : ""}`); };
export const layLichSuVanHanhCursorAdmin = (bo_loc: { loai?: string; trang_thai?: string; tu_ngay?: string; den_ngay?: string; cursor?: string | null; kich_thuoc?: number } = {}) => { const q = new URLSearchParams(); if (bo_loc.loai) q.set("loai", bo_loc.loai); if (bo_loc.trang_thai) q.set("trang_thai", bo_loc.trang_thai); if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay); if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay); if (bo_loc.cursor) q.set("cursor", bo_loc.cursor); if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc)); return goi<KetQuaCursor<LichSuVanHanhAdmin>>(`/quan-tri/he-thong/lich-su/cursor${q.size ? `?${q}` : ""}`); };
export const xuatLichSuVanHanhExcelAdmin = (bo_loc: { loai?: string; trang_thai?: string; tu_ngay?: string; den_ngay?: string } = {}) => { const q = new URLSearchParams(); if (bo_loc.loai) q.set("loai", bo_loc.loai); if (bo_loc.trang_thai) q.set("trang_thai", bo_loc.trang_thai); if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay); if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay); return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/he-thong/lich-su/excel${q.size ? `?${q}` : ""}`); };
export const guiCanhBaoHeThongAdmin = () => goi<{ da_gui: boolean; ly_do?: string; van_de: string[]; so_nguoi_nhan?: number; cap_leo_thang?: number; ton_tai_phut?: number }>("/quan-tri/he-thong/canh-bao-email/gui", { method: "POST" });
export const layNguoiDung = () => goi<AdminNguoiDung[]>("/quan-tri/nguoi-dung");
export const capNhatNguoiDung = (id: string, payload: Partial<Pick<AdminNguoiDung, "thu_dien_tu" | "ho_ten" | "so_dien_thoai" | "dia_chi_mac_dinh" | "da_kich_hoat">>) => goi<AdminNguoiDung>(`/quan-tri/nguoi-dung/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const kichHoatNguoiDung = (id: string) => goi<{ id: string; da_kich_hoat: boolean; thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/kich-hoat`, { method: "POST" });
export const khoaNguoiDung = (id: string) => goi<{ id: string; da_kich_hoat: boolean; thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/khoa`, { method: "POST" });
export const xoaNguoiDung = (id: string) => goi<{ thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layNhanVien = () => goi<AdminNhanVien[]>("/quan-tri/nhan-vien");
export const taoNhanVien = (payload: Record<string, unknown>) => goi("/quan-tri/nhan-vien", { method: "POST", body: JSON.stringify(payload) });
export const capNhatNhanVien = (id: string, payload: { trang_thai?: string; ghi_chu?: string }) => goi<AdminNhanVien>(`/quan-tri/nhan-vien/${id}/trang-thai`, { method: "POST", body: JSON.stringify(payload) });
export const layCaLam = () => goi<CaLam[]>("/quan-tri/ca-lam");
export const taoCaLam = (payload: Record<string, unknown>) => goi<CaLam>("/quan-tri/ca-lam", { method: "POST", body: JSON.stringify(payload) });
export const capNhatCaLam = (id: string, payload: Record<string, unknown>) => goi<CaLam>(`/quan-tri/ca-lam/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaCaLam = (id: string) => goi<{ thong_bao: string; so_phan_ca_da_xoa: number }>(`/quan-tri/ca-lam/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layPhanCa = () => goi<PhanCa[]>("/quan-tri/phan-ca");
export const taoPhanCa = (payload: Record<string, unknown>) => goi("/quan-tri/phan-ca", { method: "POST", body: JSON.stringify(payload) });
export const capNhatPhanCa = (id: string, payload: Record<string, unknown>) => goi<PhanCa>(`/quan-tri/phan-ca/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaPhanCa = (id: string) => goi<{ thong_bao: string }>(`/quan-tri/phan-ca/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });

export const layDonHangAdmin = (trang_thai = "", tim_kiem = "") => {
  const q = new URLSearchParams();
  if (trang_thai) q.set("trang_thai", trang_thai);
  if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim());
  return goi<AdminDonHang[]>(`/quan-tri/don-hang${q.size ? `?${q}` : ""}`);
};
export const layChiTietDonHangAdmin = (id: string) => goi<AdminDonHangChiTiet>(`/quan-tri/don-hang/${id}`);
export const capNhatTrangThaiDonHangAdmin = (id: string, payload: { trang_thai: string; ghi_chu?: string }) => goi<AdminDonHangChiTiet>(`/quan-tri/don-hang/${id}/trang-thai`, { method: "POST", body: JSON.stringify(payload) });
export const doiSoatDoanhThuDonDaGiaoAdmin = () => goi<KetQuaDoiSoatDoanhThuDonDaGiao>("/quan-tri/don-hang/doi-soat-doanh-thu", { method: "POST" });
export const layDanhMucAdmin = () => goi<AdminDanhMuc[]>("/quan-tri/danh-muc");
export const laySanPhamAdmin = () => goi<AdminSanPham[]>("/quan-tri/san-pham");
export const taoSanPhamAdmin = (payload: { ma_san_pham: string; ten_san_pham: string; danh_muc_id: string; mo_ta_ngan?: string; gia_ban: number; kich_thuoc?: string; khoi_luong_gam?: number; thoi_gian_in_gio?: number; trang_thai?: string; so_luong_ton: number; anh_chinh_data_url: string }) => goi<AdminSanPham>("/quan-tri/san-pham", { method: "POST", body: JSON.stringify(payload) });
export const capNhatSanPhamAdmin = (id: string, payload: { ten_san_pham?: string; danh_muc_id?: string; mo_ta_ngan?: string; gia_ban?: number; kich_thuoc?: string; khoi_luong_gam?: number; thoi_gian_in_gio?: number; trang_thai?: string; anh_chinh_data_url?: string }) => goi<AdminSanPham>(`/quan-tri/san-pham/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaSanPhamAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/san-pham/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const capNhatTonKhoAdmin = (id: string, payload: { so_luong_ton: number; dang_hien_thi?: boolean; ly_do?: string }) => goi<AdminBienThe>(`/quan-tri/bien-the/${id}/ton-kho`, { method: "POST", body: JSON.stringify(payload) });
export const taoDanhMucAdmin = (payload: { ma_danh_muc: string; ten_danh_muc: string; mo_ta?: string; thu_tu?: number; dang_hien_thi?: boolean }) => goi<AdminDanhMuc>("/quan-tri/danh-muc", { method: "POST", body: JSON.stringify(payload) });
export const capNhatDanhMucAdmin = (id: string, payload: { ten_danh_muc?: string; mo_ta?: string; thu_tu?: number; dang_hien_thi?: boolean }) => goi<AdminDanhMuc>(`/quan-tri/danh-muc/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaDanhMucAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/danh-muc/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layVatLieuAdmin = () => goi<AdminVatLieu[]>("/quan-tri/vat-lieu");
export const taoVatLieuAdmin = (payload: { ma_vat_lieu: string; ten_vat_lieu: string; mo_ta?: string; he_so_gia?: number }) => goi<AdminVatLieu>("/quan-tri/vat-lieu", { method: "POST", body: JSON.stringify(payload) });
export const capNhatVatLieuAdmin = (id: string, payload: { ten_vat_lieu?: string; mo_ta?: string; he_so_gia?: number }) => goi<AdminVatLieu>(`/quan-tri/vat-lieu/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaVatLieuAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/vat-lieu/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layMauSacAdmin = () => goi<AdminMauSac[]>("/quan-tri/mau-sac");
export const taoMauSacAdmin = (payload: { ma_mau: string; ten_mau: string; ma_hex: string }) => goi<AdminMauSac>("/quan-tri/mau-sac", { method: "POST", body: JSON.stringify(payload) });
export const capNhatMauSacAdmin = (id: string, payload: { ten_mau?: string; ma_hex?: string }) => goi<AdminMauSac>(`/quan-tri/mau-sac/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaMauSacAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/mau-sac/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layNhaCungCapAdmin = (tim_kiem = "", dang_hoat_dong = "") => { const q = new URLSearchParams(); if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim()); if (dang_hoat_dong) q.set("dang_hoat_dong", dang_hoat_dong); return goi<NhaCungCapAdmin[]>(`/quan-tri/nha-cung-cap${q.size ? `?${q}` : ""}`); };
export const taoNhaCungCapAdmin = (payload: Omit<NhaCungCapAdmin, "id" | "so_phieu_nhap" | "ngay_tao" | "ngay_cap_nhat">) => goi<NhaCungCapAdmin>("/quan-tri/nha-cung-cap", { method: "POST", body: JSON.stringify(payload) });
export const capNhatNhaCungCapAdmin = (id: string, payload: Partial<Pick<NhaCungCapAdmin, "ten_nha_cung_cap" | "nguoi_lien_he" | "so_dien_thoai" | "thu_dien_tu" | "dia_chi" | "ghi_chu" | "dang_hoat_dong">>) => goi<NhaCungCapAdmin>(`/quan-tri/nha-cung-cap/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaNhaCungCapAdmin = (id: string) => goi<{ id: string; thong_bao: string }>(`/quan-tri/nha-cung-cap/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layCauHinhKhoAdmin = () => goi<AdminCauHinhKho>("/quan-tri/kho/cau-hinh");
export const capNhatCauHinhKhoAdmin = (nguong_sap_het: number) => goi<AdminCauHinhKho>("/quan-tri/kho/cau-hinh", { method: "POST", body: JSON.stringify({ nguong_sap_het }) });
export const layLichSuKhoAdmin = (loai = "") => goi<LichSuKhoAdmin[]>(`/quan-tri/kho/lich-su${loai ? `?loai=${encodeURIComponent(loai)}` : ""}`);
export const kiemTraTepNhapKhoAdmin = (ten_file: string, du_lieu_base64: string) => goi<KiemTraImportKhoAdmin>("/quan-tri/kho/import/kiem-tra", { method: "POST", body: JSON.stringify({ ten_file, du_lieu_base64 }) });
export const nhapKhoTheoLoAdmin = (payload: { ma_lo?: string; nha_cung_cap_id?: string; nha_cung_cap?: string; ghi_chu?: string; dong: Array<{ ma_bien_the: string; so_luong_nhap: number; ly_do?: string }> }) => goi<PhieuNhapKhoAdmin>("/quan-tri/kho/nhap-lo", { method: "POST", body: JSON.stringify(payload) });
export const layPhieuNhapKhoAdmin = (tim_kiem = "", nha_cung_cap_id = "", tu_ngay = "", den_ngay = "") => { const q = new URLSearchParams(); if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim()); if (nha_cung_cap_id) q.set("nha_cung_cap_id", nha_cung_cap_id); if (tu_ngay) q.set("tu_ngay", tu_ngay); if (den_ngay) q.set("den_ngay", den_ngay); return goi<PhieuNhapKhoAdmin[]>(`/quan-tri/kho/phieu-nhap${q.size ? `?${q}` : ""}`); };
export const layChiTietPhieuNhapKhoAdmin = (id: string) => goi<PhieuNhapKhoAdmin>(`/quan-tri/kho/phieu-nhap/${id}`);
export const xuatExcelPhieuNhapKhoAdmin = (tim_kiem = "", nha_cung_cap_id = "", tu_ngay = "", den_ngay = "") => { const q = new URLSearchParams(); if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim()); if (nha_cung_cap_id) q.set("nha_cung_cap_id", nha_cung_cap_id); if (tu_ngay) q.set("tu_ngay", tu_ngay); if (den_ngay) q.set("den_ngay", den_ngay); return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/kho/phieu-nhap/excel${q.size ? `?${q}` : ""}`); };
export const layTrangThaiCanhBaoKhoEmailAdmin = () => goi<TrangThaiCanhBaoKhoEmailAdmin>("/quan-tri/kho/canh-bao-email");
export const guiCanhBaoKhoEmailAdmin = () => goi<{ da_gui: boolean; ly_do?: string; tong_canh_bao: number; so_nguoi_nhan?: number; lan_gui?: string }>("/quan-tri/kho/canh-bao-email/gui", { method: "POST" });
export const taoBienTheAdmin = (san_pham_id: string, payload: { ma_bien_the: string; vat_lieu_id?: string; mau_sac_id?: string; gia_chenh_lech?: number; so_luong_ton: number; dang_hien_thi?: boolean }) => goi<AdminBienThe>(`/quan-tri/san-pham/${san_pham_id}/bien-the`, { method: "POST", body: JSON.stringify(payload) });
export const capNhatBienTheAdmin = (id: string, payload: { ma_bien_the?: string; vat_lieu_id?: string | null; mau_sac_id?: string | null; gia_chenh_lech?: number; so_luong_ton?: number; ton_toi_thieu?: number; ton_toi_da?: number; dang_hien_thi?: boolean; ly_do_ton_kho?: string }) => goi<AdminBienThe>(`/quan-tri/bien-the/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaBienTheAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/bien-the/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layDanhGiaAdmin = (trang_thai = "") => goi<AdminDanhGia[]>(`/quan-tri/danh-gia${trang_thai ? `?trang_thai=${encodeURIComponent(trang_thai)}` : ""}`);
export const capNhatDanhGiaAdmin = (id: string, da_duyet: boolean) => goi<AdminDanhGia>(`/quan-tri/danh-gia/${id}/trang-thai`, { method: "POST", body: JSON.stringify({ da_duyet }) });
export const xoaDanhGiaAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/danh-gia/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layBaoCaoCsvAdmin = (loai: "don-hang" | "doanh-thu" | "ton-kho", tu_ngay = "", den_ngay = "") => {
  const q = new URLSearchParams();
  if (tu_ngay) q.set("tu_ngay", tu_ngay);
  if (den_ngay) q.set("den_ngay", den_ngay);
  return goi<{ ten_file: string; csv: string }>(`/quan-tri/bao-cao/${loai}${q.size ? `?${q}` : ""}`);
};
export const layBaoCaoExcelAdmin = (loai: "don-hang" | "doanh-thu" | "ton-kho", tu_ngay = "", den_ngay = "") => {
  const q = new URLSearchParams();
  if (tu_ngay) q.set("tu_ngay", tu_ngay);
  if (den_ngay) q.set("den_ngay", den_ngay);
  return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/bao-cao/${loai}/excel${q.size ? `?${q}` : ""}`);
};
export const layNhatKyAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string; gioi_han?: number } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  if (bo_loc.gioi_han) q.set("gioi_han", String(bo_loc.gioi_han));
  return goi<NhatKyAdmin[]>(`/quan-tri/nhat-ky${q.size ? `?${q}` : ""}`);
};
export const layNhatKyPhanTrangAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string; trang?: number; kich_thuoc?: number } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  if (bo_loc.trang) q.set("trang", String(bo_loc.trang));
  if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc));
  return goi<KetQuaPhanTrang<NhatKyAdmin>>(`/quan-tri/nhat-ky/phan-trang${q.size ? `?${q}` : ""}`);
};
export const layNhatKyCursorAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string; cursor?: string | null; kich_thuoc?: number } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  if (bo_loc.cursor) q.set("cursor", bo_loc.cursor);
  if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc));
  return goi<KetQuaCursor<NhatKyAdmin>>(`/quan-tri/nhat-ky/cursor${q.size ? `?${q}` : ""}`);
};
export const xuatNhatKyExcelAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/nhat-ky/excel${q.size ? `?${q}` : ""}`);
};
export const xuatNhatKyCsvAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  return goi<{ ten_file: string; csv: string }>(`/quan-tri/nhat-ky/csv${q.size ? `?${q}` : ""}`);
};
