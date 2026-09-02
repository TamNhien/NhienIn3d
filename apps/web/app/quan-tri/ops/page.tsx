"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { layTaiKhoan } from "../../../lib/xac-thuc";
import {
  AdminNguoiDung,
  BaoTriWindowAdmin,
  CauHinhSloNangCaoAdmin,
  LichSuVanHanhAdmin,
  OpsAccessAdmin,
  OpsArchivePreviewAdmin,
  OpsOnCallScheduleAdmin,
  OpsPhanCongAdmin,
  OpsRuntimeAdmin,
  ProbeDesiredStateAdmin,
  IncidentPostmortemAdmin,
  OpsEscalationPolicyAdmin,
  WebhookReplayJobAdmin,
  DlqKeyringAdmin,
  SlaVanHanhAdmin,
  SuCoVanHanhTomTat,
  WebhookDeadLetterAdmin,
  capNhatBaoTriNangCaoAdmin,
  capNhatCauHinhSloNangCaoAdmin,
  layCauHinhSloNangCaoAdmin,
  layDanhSachBaoTriAdmin,
  layNguoiDung,
  layOpsDashboardReadonly,
  layOpsArchivePreviewAdmin,
  layOpsOnCallAdmin,
  layOpsOnCallHandoffAdmin,
  layOpsPhanCongAdmin,
  layOpsRuntimeAdmin,
  layProbeDesiredStateAdmin,
  capNhatProbeDesiredStateAdmin,
  rollbackProbeDesiredStateAdmin,
  layIncidentPostmortemAdmin,
  luuIncidentPostmortemAdmin,
  layDlqKeyringAdmin,
  layWebhookReplayJobsAdmin,
  layOpsTimelineReadonly,
  layDanhSachSuCoVanHanhAdmin,
  laySlaVanHanhAdmin,
  layTimelineSuCoVanHanhAdmin,
  layWebhookDeadLetterAdmin,
  layWebhookDeliveryAdmin,
  replayWebhookDeadLetterAdmin,
  acknowledgeWebhookDeadLetterAdmin,
  taoWebhookReplayJobAdmin,
  huyWebhookReplayJobAdmin,
  rotateDlqKeyAdmin,
  archiveOpsAdmin,
  xuatOpsArchiveBundleAdmin,
  xuatOpsOnCallCalendarAdmin,
  taoBaoTriAdmin,
  taoOpsOnCallAdmin,
  xoaOpsOnCallAdmin,
  capNhatOpsEscalationAdmin,
  taoOpsPhanCongAdmin,
  xoaBaoTriAdmin,
  xoaOpsPhanCongAdmin,
  ganChuSoHuuSuCoAdmin,
  xuatOpsTongHopExcelAdmin
} from "../../../lib/quan-tri";
import styles from "./page.module.css";

const homNay = () => new Date().toISOString().slice(0, 10);
const truocNgay = (soNgay: number) => { const d = new Date(); d.setDate(d.getDate() - soNgay); return d.toISOString().slice(0, 10); };
const fmt = (value?: string | null) => value ? new Date(value).toLocaleString("vi-VN") : "—";
const ms = (value?: number | null) => value == null ? "—" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ms`;
const pct = (value?: number | null) => value == null ? "—" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 3 })}%`;
const phutThanhGio = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const taiTep = (kq: { base64: string; mime_type: string; ten_file: string }) => {
  const binary = atob(kq.base64); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: kq.mime_type })); const a = document.createElement("a"); a.href = url; a.download = kq.ten_file; a.click(); URL.revokeObjectURL(url);
};

export default function OpsDashboardPage() {
  const [sla, setSla] = useState<SlaVanHanhAdmin | null>(null);
  const [incidents, setIncidents] = useState<SuCoVanHanhTomTat[]>([]);
  const [maintenance, setMaintenance] = useState<BaoTriWindowAdmin[]>([]);
  const [policy, setPolicy] = useState<CauHinhSloNangCaoAdmin | null>(null);
  const [webhook, setWebhook] = useState<LichSuVanHanhAdmin[]>([]);
  const [deadLetters, setDeadLetters] = useState<WebhookDeadLetterAdmin[]>([]);
  const [webhookAdapter, setWebhookAdapter] = useState("GENERIC");
  const [trangThai, setTrangThai] = useState("");
  const [tuNgay, setTuNgay] = useState(truocNgay(30));
  const [denNgay, setDenNgay] = useState(homNay());
  const [dangXuLy, setDangXuLy] = useState("");
  const [thongBao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");
  const [form, setForm] = useState({ ten: "Bảo trì định kỳ", bat: true, bat_dau: "", ket_thuc: "", lap_lai: "KHONG" as "KHONG" | "HANG_NGAY" | "HANG_TUAN", ly_do: "" });
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<LichSuVanHanhAdmin[]>([]);
  const [timelineQuery, setTimelineQuery] = useState("");
  const [timelineCursor, setTimelineCursor] = useState<string | null>(null);
  const [timelineHasMore, setTimelineHasMore] = useState(false);
  const [access, setAccess] = useState<OpsAccessAdmin | null>(null);
  const [runtime, setRuntime] = useState<OpsRuntimeAdmin | null>(null);
  const [assignments, setAssignments] = useState<OpsPhanCongAdmin[]>([]);
  const [staff, setStaff] = useState<AdminNguoiDung[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({ nguoi_dung_id: "", dich_vu: "api", vai_tro_ops: "ON_CALL" as "OPS_VIEWER" | "ON_CALL" | "SERVICE_OWNER", cap_escalation: 1 });
  const [onCallSchedules, setOnCallSchedules] = useState<OpsOnCallScheduleAdmin[]>([]);
  const [escalationPolicies, setEscalationPolicies] = useState<OpsEscalationPolicyAdmin[]>([]);
  const [onCallForm, setOnCallForm] = useState({ nguoi_dung_id: "", dich_vu: "api", thu_trong_tuan: 1, bat_dau_phut: 8 * 60, ket_thuc_phut: 17 * 60, timezone: "Asia/Ho_Chi_Minh", cap_escalation: 1 });
  const [escalationForm, setEscalationForm] = useState({ dich_vu: "api", cap_escalation: 1, sau_phut: 0, kenh: "EMAIL_WEBHOOK" as "EMAIL" | "WEBHOOK" | "EMAIL_WEBHOOK" });
  const [replayJobs, setReplayJobs] = useState<WebhookReplayJobAdmin[]>([]);
  const [keyring, setKeyring] = useState<DlqKeyringAdmin | null>(null);
  const [archivePreview, setArchivePreview] = useState<OpsArchivePreviewAdmin | null>(null);
  const [archiveForm, setArchiveForm] = useState({ bang_nguon: "slo_endpoint_mau" as "lich_su_van_hanh" | "slo_endpoint_mau", thang: truocNgay(120).slice(0, 7) });
  const [desiredState, setDesiredState] = useState<ProbeDesiredStateAdmin | null>(null);
  const [desiredForm, setDesiredForm] = useState({ target_version: "3.17.0", interval_seconds: 300, rollout_percent: 0, canary_agents: "", paused: true, note: "" });
  const [postmortem, setPostmortem] = useState<IncidentPostmortemAdmin | null>(null);
  const [postmortemForm, setPostmortemForm] = useState({ summary: "", impact: "", root_cause: "", detection: "", resolution: "", runbook_url: "", lessons: "", action_item: "" });

  const taiDuLieu = useCallback(async () => {
    setDangXuLy("load"); setLoi("");
    try {
      const taiKhoan = await layTaiKhoan();
      if (!taiKhoan) throw new Error("Bạn cần đăng nhập để truy cập Ops Dashboard.");
      if (taiKhoan.vai_tro === "ADMIN") {
        const [sloData, incidentData, maintenanceData, policyData, webhookData, dlqData, runtimeData, assignmentData, users, onCallData, keyringData, replayData, desiredData] = await Promise.all([
          laySlaVanHanhAdmin(90),
          layDanhSachSuCoVanHanhAdmin(100, trangThai, tuNgay, denNgay),
          layDanhSachBaoTriAdmin(),
          layCauHinhSloNangCaoAdmin(),
          layWebhookDeliveryAdmin(30),
          layWebhookDeadLetterAdmin(30),
          layOpsRuntimeAdmin(),
          layOpsPhanCongAdmin(),
          layNguoiDung(),
          layOpsOnCallAdmin(),
          layDlqKeyringAdmin(),
          layWebhookReplayJobsAdmin(),
          layProbeDesiredStateAdmin()
        ]);
        setAccess({ duoc_phep: true, admin: true, vai_tro_ops: "SERVICE_OWNER", dich_vu: ["*"] });
        setSla(sloData); setIncidents(incidentData.du_lieu); setMaintenance(maintenanceData.du_lieu); setPolicy(policyData); setWebhook(webhookData.du_lieu); setDeadLetters(dlqData.du_lieu); setWebhookAdapter(webhookData.cau_hinh.adapter || "GENERIC"); setRuntime(runtimeData); setAssignments(assignmentData.du_lieu); setStaff(users.filter(x => x.vai_tro !== "KHACH_HANG" && x.da_kich_hoat !== false)); setOnCallSchedules(onCallData.schedules); setEscalationPolicies(onCallData.policies); setKeyring(keyringData); setReplayJobs(replayData.du_lieu); setDesiredState(desiredData); setDesiredForm({ target_version: desiredData.current.target_version, interval_seconds: desiredData.current.interval_seconds, rollout_percent: desiredData.current.rollout_percent, canary_agents: desiredData.current.canary_agents.join(","), paused: desiredData.current.paused, note: desiredData.current.note || "" });
      } else {
        const data = await layOpsDashboardReadonly(90);
        const filtered = data.incidents.du_lieu.filter(item => {
          if (trangThai && item.trang_thai_xu_ly !== trangThai) return false;
          const day = item.bat_dau.slice(0, 10);
          return (!tuNgay || day >= tuNgay) && (!denNgay || day <= denNgay);
        });
        setAccess(data.access); setSla(data.sla); setIncidents(filtered); setPolicy(data.sla.cau_hinh_nang_cao || null); setRuntime(data.runtime); setMaintenance([]); setWebhook([]); setDeadLetters([]); setAssignments([]); setStaff([]); setOnCallSchedules(data.runtime.on_call?.current || []); setEscalationPolicies(data.runtime.on_call?.policies || []); setKeyring(data.runtime.dlq_keyring || null); setReplayJobs([]); setDesiredState(data.runtime.probe_desired_state || null);
      }
    } catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }, [trangThai, tuNgay, denNgay]);

  useEffect(() => { void taiDuLieu(); }, [taiDuLieu]);

  const incidentMetrics = sla?.incident_metrics;
  const activeMaintenance = useMemo(() => maintenance.filter(x => x.dang_bao_tri), [maintenance]);
  const burnSeries = useMemo(() => (sla?.burn_rate_series || []).slice(-30), [sla]);
  const maxBurn = useMemo(() => Math.max(1, ...burnSeries.flatMap(x => [x.sla_burn_rate || 0, x.uptime_burn_rate || 0])), [burnSeries]);
  const maintenanceDates = useMemo(() => new Map((sla?.maintenance_annotations || []).map(x => [x.ngay, x.ten])), [sla]);
  const comparisonRows = sla?.comparison ? [
    { label: "7 ngày", value: sla.comparison.bay_ngay },
    { label: "30 ngày", value: sla.comparison.ba_muoi_ngay },
    { label: "90 ngày", value: sla.comparison.chin_muoi_ngay }
  ] : [];

  async function taoMaintenance() {
    if (!form.bat_dau || !form.ket_thuc) { setLoi("Hãy chọn thời gian bắt đầu và kết thúc maintenance."); return; }
    setDangXuLy("maintenance-create"); setLoi("");
    try {
      const kq = await taoBaoTriAdmin({ ...form, bat_dau: new Date(form.bat_dau).toISOString(), ket_thuc: new Date(form.ket_thuc).toISOString() });
      setMaintenance(kq.du_lieu); setThongBao("Đã tạo maintenance window.");
    } catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function toggleMaintenance(item: BaoTriWindowAdmin) {
    setDangXuLy(`maintenance-${item.id}`); setLoi("");
    try { const kq = await capNhatBaoTriNangCaoAdmin(item.id, { bat: !item.bat }); setMaintenance(kq.du_lieu); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function deleteMaintenance(item: BaoTriWindowAdmin) {
    if (!confirm(`Xóa maintenance window “${item.ten}”?`)) return;
    setDangXuLy(`maintenance-${item.id}`); setLoi("");
    try { const kq = await xoaBaoTriAdmin(item.id); setMaintenance(kq.du_lieu); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function savePolicy() {
    if (!policy) return;
    setDangXuLy("policy"); setLoi("");
    try {
      const kq = await capNhatCauHinhSloNangCaoAdmin({ burn_windows: policy.burn_windows, service_targets: policy.service_targets, endpoint_checks: policy.endpoint_checks, maintenance_policy: policy.maintenance_policy });
      setPolicy(kq); setThongBao("Đã lưu burn-rate, service budget và endpoint SLO policy."); await taiDuLieu();
    } catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  function addEndpoint() {
    setPolicy(current => current ? ({ ...current, endpoint_checks: [...current.endpoint_checks, { id: `endpoint-${current.endpoint_checks.length + 1}`, ten: "Endpoint mới", path: "/api/v1/suc-khoe", method: "GET", headers: {}, auth_template: "NONE", auth_env: "", muc_tieu_percent: 99.9, latency_target_ms: 1000, timeout_ms: 3000 }] }) : current);
  }

  function removeEndpoint(index: number) {
    setPolicy(current => current ? ({ ...current, endpoint_checks: current.endpoint_checks.filter((_, i) => i !== index) }) : current);
  }

  async function exportOps() {
    setDangXuLy("export"); setLoi("");
    try { const kq = await xuatOpsTongHopExcelAdmin(trangThai, tuNgay, denNgay); taiTep(kq); setThongBao(`Đã xuất ${kq.ten_file}.`); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function loadTimeline(chuKy: string, reset = true, query = timelineQuery) {
    setDangXuLy("timeline"); setLoi("");
    try {
      const kq = access?.admin
        ? await layTimelineSuCoVanHanhAdmin(chuKy, { q: query, cursor: reset ? null : timelineCursor, kich_thuoc: 20 })
        : await layOpsTimelineReadonly(chuKy, { q: query, cursor: reset ? null : timelineCursor, kich_thuoc: 20 });
      setSelectedIncident(chuKy); setTimeline(current => reset ? kq.du_lieu : [...current, ...kq.du_lieu]); setTimelineCursor(kq.cursor.next_cursor); setTimelineHasMore(kq.cursor.co_them); if (reset && access?.admin) void loadPostmortem(chuKy);
    } catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function replayDeadLetter(item: WebhookDeadLetterAdmin) {
    if (item.da_replay || !confirm(`Replay webhook dead-letter #${item.id}?`)) return;
    setDangXuLy(`replay-${item.id}`); setLoi("");
    try {
      const kq = await replayWebhookDeadLetterAdmin(item.id);
      if (!kq.da_gui) throw new Error(kq.ly_do || "Replay webhook thất bại.");
      setThongBao(`Replay dead-letter #${item.id} thành công qua ${kq.adapter}.`); await taiDuLieu();
    } catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function ackDeadLetter(item: WebhookDeadLetterAdmin) {
    if (item.da_ack || item.da_replay || !confirm(`Acknowledge dead-letter #${item.id}?`)) return;
    setDangXuLy(`ack-${item.id}`); setLoi("");
    try { await acknowledgeWebhookDeadLetterAdmin(item.id, "Đã xác nhận xử lý từ Ops Dashboard v3.16.0"); setThongBao(`Đã acknowledge dead-letter #${item.id}.`); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function replayBulkDeadLetters() {
    const ids = deadLetters.filter(x => ["CHO_REPLAY", "CHO_RETRY", "RETRY_THAT_BAI"].includes(x.trang_thai_dlq)).slice(0, 100).map(x => x.id);
    if (!ids.length) { setThongBao("Không có dead-letter đang chờ replay."); return; }
    if (!confirm(`Tạo replay job bất đồng bộ cho ${ids.length} dead-letter?`)) return;
    setDangXuLy("replay-bulk"); setLoi("");
    try { const job = await taoWebhookReplayJobAdmin(ids); setThongBao(`Đã tạo replay job #${job.id.slice(0, 8)} cho ${job.tong} dead-letter.`); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function addAssignment() {
    if (!assignmentForm.nguoi_dung_id) { setLoi("Hãy chọn nhân viên/on-call."); return; }
    setDangXuLy("ops-assignment"); setLoi("");
    try { await taoOpsPhanCongAdmin(assignmentForm); setThongBao("Đã cập nhật phân quyền Ops/on-call."); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function removeAssignment(item: OpsPhanCongAdmin) {
    if (!confirm(`Xóa phân quyền ${item.vai_tro_ops} / ${item.dich_vu}?`)) return;
    setDangXuLy(`ops-assignment-${item.id}`); setLoi("");
    try { await xoaOpsPhanCongAdmin(item.id); setThongBao("Đã xóa phân quyền Ops."); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function exportOnCallCalendar() {
    setDangXuLy("on-call-calendar"); setLoi("");
    try { const kq = await xuatOpsOnCallCalendarAdmin(); taiTep(kq); setThongBao(`Đã xuất ${kq.schedules} ca trực ra ICS.`); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function exportOnCallHandoff() {
    setDangXuLy("on-call-handoff"); setLoi("");
    try {
      const kq = await layOpsOnCallHandoffAdmin();
      const url = URL.createObjectURL(new Blob([JSON.stringify(kq, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `nhienin3d-on-call-handoff-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
      setThongBao(`Đã tạo handoff report: ${kq.current.length} người trực · ${kq.open_incidents.length} incident mở.`);
    } catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function addOnCallSchedule() {
    if (!onCallForm.nguoi_dung_id) { setLoi("Hãy chọn nhân viên trực on-call."); return; }
    setDangXuLy("on-call-create"); setLoi("");
    try { await taoOpsOnCallAdmin(onCallForm); setThongBao("Đã thêm ca trực on-call."); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function removeOnCallSchedule(item: OpsOnCallScheduleAdmin) {
    if (!confirm(`Xóa ca trực ${item.dich_vu} của ${item.nguoi_dung?.ho_ten || item.nguoi_dung_id}?`)) return;
    setDangXuLy(`on-call-${item.id}`); setLoi("");
    try { await xoaOpsOnCallAdmin(item.id); setThongBao("Đã xóa ca trực on-call."); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function saveEscalationPolicy() {
    setDangXuLy("escalation-policy"); setLoi("");
    try { await capNhatOpsEscalationAdmin(escalationForm); setThongBao("Đã cập nhật escalation policy theo dịch vụ."); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function rotateDlqKey() {
    if (!confirm("Re-encrypt tối đa 100 payload DLQ cũ sang active key hiện tại?")) return;
    setDangXuLy("dlq-rotate"); setLoi("");
    try { const kq = await rotateDlqKeyAdmin(100); setThongBao(`DLQ key rotation: ${kq.rotated}/${kq.requested} payload đã đổi khóa.`); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function cancelReplayJob(item: WebhookReplayJobAdmin) {
    if (!confirm(`Hủy replay job #${item.id.slice(0, 8)}?`)) return;
    setDangXuLy(`replay-job-${item.id}`); setLoi("");
    try { await huyWebhookReplayJobAdmin(item.id); setThongBao("Đã yêu cầu hủy replay job."); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function previewArchive() {
    if (!/^\d{4}-\d{2}$/.test(archiveForm.thang)) { setLoi("Tháng archive phải có dạng YYYY-MM."); return; }
    setDangXuLy("archive-preview"); setLoi("");
    try { setArchivePreview(await layOpsArchivePreviewAdmin(archiveForm.bang_nguon, archiveForm.thang)); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function exportArchiveBundle() {
    if (!archivePreview?.archived && !archivePreview?.da_archive) { setLoi("Batch phải archive trước khi tải portable bundle."); return; }
    setDangXuLy("archive-export"); setLoi("");
    try { const kq = await xuatOpsArchiveBundleAdmin(archiveForm.bang_nguon, archiveForm.thang); taiTep(kq); setThongBao(`Đã tải archive bundle ${kq.manifest.records} dòng · ${kq.manifest.retention_class}.`); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function runArchive() {
    if (!archivePreview || archivePreview.bang_nguon !== archiveForm.bang_nguon || archivePreview.thang !== archiveForm.thang) { setLoi("Hãy Preview đúng batch trước khi archive/prune."); return; }
    if (!confirm(`Archive + verify + prune ${archivePreview.eligible_count} dòng ${archivePreview.bang_nguon} tháng ${archivePreview.thang}?`)) return;
    setDangXuLy("archive-run"); setLoi("");
    try { const kq = await archiveOpsAdmin(archiveForm.bang_nguon, archiveForm.thang); setArchivePreview(kq); setThongBao(`Archive ${kq.thang}: ${kq.eligible_count} dòng đã verify trước prune.`); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function saveDesiredState() {
    setDangXuLy("desired-state-save"); setLoi("");
    try {
      const kq = await capNhatProbeDesiredStateAdmin({ ...desiredForm, canary_agents: desiredForm.canary_agents.split(",").map(x => x.trim()).filter(Boolean) });
      setDesiredState(kq); setRuntime(x => x ? { ...x, probe_desired_state: kq } : x); setThongBao("Đã lưu probe desired-state; rollout không thực thi remote command.");
    } catch (error) { setLoi(error instanceof Error ? error.message : String(error)); } finally { setDangXuLy(""); }
  }

  async function rollbackDesiredState() {
    setDangXuLy("desired-state-rollback"); setLoi("");
    try { const kq = await rollbackProbeDesiredStateAdmin(); setDesiredState(kq); setRuntime(x => x ? { ...x, probe_desired_state: kq } : x); setDesiredForm({ target_version: kq.current.target_version, interval_seconds: kq.current.interval_seconds, rollout_percent: kq.current.rollout_percent, canary_agents: kq.current.canary_agents.join(","), paused: kq.current.paused, note: kq.current.note || "" }); setThongBao("Đã rollback probe desired-state."); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); } finally { setDangXuLy(""); }
  }

  async function loadPostmortem(chuKy: string) {
    if (!access?.admin) return;
    try { const kq = await layIncidentPostmortemAdmin(chuKy); setPostmortem(kq); setPostmortemForm({ summary: kq.summary || "", impact: kq.impact || "", root_cause: kq.root_cause || "", detection: kq.detection || "", resolution: kq.resolution || "", runbook_url: kq.runbook_url || "", lessons: kq.lessons || "", action_item: kq.action_items.find(x => x.status !== "DONE")?.title || "" }); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
  }

  async function savePostmortem() {
    if (!selectedIncident) return;
    setDangXuLy("postmortem-save"); setLoi("");
    try { const existing = postmortem?.action_items || []; const actions = postmortemForm.action_item.trim() ? [...existing.filter(x => x.title !== postmortemForm.action_item.trim()), { id: "ui-action", title: postmortemForm.action_item.trim(), owner: "", status: "OPEN" as const, due_date: null }] : existing; const kq = await luuIncidentPostmortemAdmin(selectedIncident, { summary: postmortemForm.summary, impact: postmortemForm.impact, root_cause: postmortemForm.root_cause, detection: postmortemForm.detection, resolution: postmortemForm.resolution, runbook_url: postmortemForm.runbook_url, lessons: postmortemForm.lessons, action_items: actions }); setPostmortem(kq); setThongBao(`Đã lưu postmortem ${kq.status}.`); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); } finally { setDangXuLy(""); }
  }

  async function assignIncidentOwner(item: SuCoVanHanhTomTat) {
    setDangXuLy(`incident-owner-${item.chu_ky}`); setLoi("");
    try { await ganChuSoHuuSuCoAdmin(item.chu_ky, { dich_vu: item.dich_vu || undefined }); setThongBao(`Đã gán owner on-call cho incident #${item.chu_ky.slice(0, 12)}.`); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><span className={styles.kicker}>NHIENIN3D · OPS v3.17.0</span><h1>Ops Dashboard</h1><p>Recovery readiness RPO/RTO, probe desired-state canary/rollback và incident postmortem/runbook; giữ archive portability, on-call, quorum, managed fleet và DLQ replay.</p>{access && <small className={styles.accessBadge}>{access.admin ? "ADMIN · SERVICE OWNER" : `${access.vai_tro_ops} · ${access.dich_vu.join(", ")}`}</small>}</div>
      <div className={styles.actions}>{access?.admin && <Link href="/quan-tri" className={styles.secondary}>← Quản trị</Link>}<button onClick={() => void taiDuLieu()} disabled={!!dangXuLy}>Làm mới</button>{access?.admin && <button onClick={() => void exportOps()} disabled={!!dangXuLy}>Xuất Ops Excel</button>}</div>
    </header>

    {(loi || thongBao) && <div className={loi ? styles.error : styles.notice}>{loi || thongBao}</div>}

    <section className={styles.filters}>
      <label>Trạng thái incident<select value={trangThai} onChange={e => setTrangThai(e.target.value)}><option value="">Tất cả</option><option value="MOI">Mới</option><option value="DA_TIEP_NHAN">Đã tiếp nhận</option><option value="DA_KHAC_PHUC">Đã khắc phục</option></select></label>
      <label>Từ ngày<input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)}/></label>
      <label>Đến ngày<input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)}/></label>
      <button onClick={() => void taiDuLieu()} disabled={dangXuLy === "load"}>{dangXuLy === "load" ? "Đang lọc…" : "Áp dụng bộ lọc"}</button>
    </section>

    <section className={styles.cards}>
      <article><span>SLA 30 ngày</span><strong>{pct(sla?.xu_huong.ba_muoi_ngay.sla_percent)}</strong><small>Mục tiêu {pct(sla?.muc_tieu.sla_muc_tieu_percent)}</small></article>
      <article><span>Uptime 30 ngày</span><strong>{pct(sla?.xu_huong.ba_muoi_ngay.uptime_percent)}</strong><small>Mục tiêu {pct(sla?.muc_tieu.uptime_muc_tieu_percent)}</small></article>
      <article><span>Error budget SLA còn</span><strong>{pct(sla?.ngan_sach_loi.sla.con_lai_percent)}</strong><small>Đã tiêu {pct(sla?.ngan_sach_loi.sla.da_tieu_thu_percent)}</small></article>
      <article><span>MTTA / MTTR</span><strong>{incidentMetrics?.mtta_phut ?? "—"} / {incidentMetrics?.mttr_phut ?? "—"} phút</strong><small>P95 {incidentMetrics?.mtta_p95_phut ?? "—"} / {incidentMetrics?.mttr_p95_phut ?? "—"}</small></article>
      <article><span>Incident đang mở</span><strong>{incidentMetrics?.dang_mo ?? incidents.filter(x => x.trang_thai_xu_ly !== "DA_KHAC_PHUC").length}</strong><small>{incidents.length} incident theo bộ lọc</small></article>
      <article><span>Maintenance active</span><strong>{activeMaintenance.length}</strong><small>{maintenance.length} window cấu hình</small></article>
    </section>

    <section className={styles.grid2}>
      <article className={styles.panel}><h2>So sánh SLO 7 / 30 / 90 ngày</h2><p>Giữ cùng định nghĩa để nhìn xu hướng dài hạn.</p><div className={styles.tableWrap}><table><thead><tr><th>Cửa sổ</th><th>SLA</th><th>Uptime</th><th>Mẫu</th></tr></thead><tbody>{comparisonRows.map(({ label, value }) => <tr key={label}><td>{label}</td><td>{pct(value.sla_percent)}</td><td>{pct(value.uptime_percent)}</td><td>{value.tong}</td></tr>)}</tbody></table></div></article>
      <article className={styles.panel}><h2>Endpoint SLO · distributed region/node</h2><p>Availability time-weighted + latency SLI/P95/Apdex từ persistent samples; so sánh theo region và node của probe agent.</p><div className={styles.tableWrap}><table><thead><tr><th>Endpoint</th><th>Availability</th><th>Latency SLI</th><th>P95 / Target</th><th>Apdex</th><th>Agent / region / node</th><th>Maintenance loại</th><th>Budget còn</th></tr></thead><tbody>{(sla?.endpoint_slo?.endpoints || []).map(item => <tr key={item.id}><td><b>{item.ten}</b><small className={styles.blockSmall}>{item.method} · {item.path}</small></td><td>{pct(item.availability_percent)}</td><td>{pct(item.latency.sli_percent)}</td><td>{ms(item.latency.p95_ms)} / {ms(item.latency.target_ms)}</td><td>{item.latency.apdex?.score ?? "—"}</td><td>{item.probe_agents?.join(", ") || "legacy"}<small className={styles.blockSmall}>Region: {(item.by_region || []).map(x => `${x.key} ${pct(x.availability_percent)}`).join(" · ") || "—"}</small><small className={styles.blockSmall}>Node: {(item.by_node || []).map(x => `${x.key} ${ms(x.p95_ms)}`).join(" · ") || "—"}</small></td><td>{item.excluded_maintenance_phut.availability} phút</td><td>{pct(item.error_budget_con_lai_percent)}</td></tr>)}</tbody></table></div></article>
    </section>

    <section className={`${styles.panel} ${styles.compactPanel}`}><div className={styles.panelHead}><div><h2>Managed probe fleet</h2><p>Đối chiếu keyring, agent đã đăng ký và heartbeat; không hiển thị secret.</p></div><small className={`${styles.accessBadge} ${styles.fleetStateBadge} ${runtime?.probe_fleet?.ready ? styles.fleetReady : styles.fleetWarn}`}>{runtime?.probe_fleet?.ready ? "READY" : "ATTENTION"}</small></div><div className={styles.fleetStats}><div><span>Expected</span><b>{runtime?.probe_fleet?.expected ?? 0}</b></div><div><span>Online</span><b>{runtime?.probe_fleet?.online ?? 0}</b></div><div><span>Key coverage</span><b>{runtime?.probe_fleet?.key_coverage_percent ?? 0}%</b></div><div><span>Registered</span><b>{runtime?.probe_fleet?.registration_coverage_percent ?? 0}%</b></div></div><div className={styles.fleetList}>{(runtime?.probe_fleet?.agents || []).map(agent => <div key={agent.agent_id}><span className={styles.fleetStatus}>{agent.status}</span><b>{agent.agent_id}</b><small>{agent.region}/{agent.node_name}</small><small>{agent.asymmetric_key ? "Ed25519 public key" : agent.per_agent_key ? "per-agent HMAC" : agent.key_configured ? "shared fallback" : "missing key"}{agent.heartbeat_age_seconds == null ? " · chưa heartbeat" : ` · ${agent.heartbeat_age_seconds}s`}</small></div>)}{!(runtime?.probe_fleet?.agents || []).length && <p>Chưa cấu hình managed probe fleet.</p>}</div><p className={styles.quorumHint}>Ed25519 lifecycle: active {runtime?.probe_fleet?.asymmetric_key_lifecycle?.active_keys ?? 0}/{runtime?.probe_fleet?.asymmetric_key_lifecycle?.configured_keys ?? 0} · enrolled {runtime?.probe_fleet?.enrolled_public_keys ?? 0} · device-bound {runtime?.probe_enrollment?.device_bound_agents ?? 0} · rotation due {runtime?.probe_enrollment?.rotation_due_agents ?? 0}. Enrollment {runtime?.probe_enrollment?.configured ? "READY" : "OFF"} · device ID {runtime?.probe_enrollment?.require_device_id ? "REQUIRED" : "OPTIONAL"} · rotate {runtime?.probe_enrollment?.rotation_days ?? 90}d.</p></section>
    <section className={`${styles.panel} ${styles.compactPanel}`}><div className={styles.panelHead}><div><h2>Multi-region quorum · anomaly detection</h2><p>Consensus theo region trong cửa sổ gần nhất; cảnh báo khi không đủ quorum hoặc latency lệch khỏi baseline.</p></div><small className={`${styles.accessBadge} ${styles.fleetStateBadge} ${runtime?.multi_region_quorum?.ready ? styles.fleetReady : styles.fleetWarn}`}>{runtime?.multi_region_quorum?.ready ? "QUORUM OK" : "DEGRADED"}</small></div><div className={styles.fleetStats}><div><span>Endpoints</span><b>{runtime?.multi_region_quorum?.summary.endpoints ?? 0}</b></div><div><span>Quorum OK</span><b>{runtime?.multi_region_quorum?.summary.quorum_ok ?? 0}</b></div><div><span>Disagreement</span><b>{runtime?.multi_region_quorum?.summary.disagreements ?? 0}</b></div><div><span>Anomalies</span><b>{runtime?.multi_region_quorum?.summary.anomalies ?? 0}</b></div></div><div className={styles.quorumList}>{(runtime?.multi_region_quorum?.endpoints || []).map(item => <div key={item.endpoint_id}><span className={`${styles.fleetStatus} ${item.quorum_met ? styles.quorumOk : styles.quorumBad}`}>{item.consensus}</span><b>{item.endpoint_id}</b><small>{item.healthy_regions}/{item.quorum_required} region khỏe · observed {item.observed_regions}/{item.expected_regions}</small><small>{item.disagreement ? "region đang bất đồng" : "consensus ổn định"}{item.anomaly_regions.length ? ` · anomaly ${item.anomaly_regions.join(", ")}` : " · không anomaly"}</small></div>)}{!(runtime?.multi_region_quorum?.endpoints || []).length && <p>Chưa có đủ sample gần đây để tính quorum.</p>}</div><p className={styles.quorumHint}>Signing: {runtime?.asymmetric_probe_signing?.public_keyring_configured ? "Ed25519 keyring sẵn sàng" : "HMAC tương thích ngược"} · quorum {runtime?.multi_region_quorum?.config.min_regions ?? 2} region / {runtime?.multi_region_quorum?.config.healthy_percent ?? 67}% · alert {runtime?.quorum_alerting?.enabled ? runtime?.quorum_alerting?.active ? `ON (${runtime.quorum_alerting.level})` : "ON" : "OFF"}.</p></section>
    <section className={`${styles.panel} ${styles.compactPanel}`}><div className={styles.panelHead}><div><h2>Service dependency · blast radius</h2><p>Tương quan quorum endpoint với dependency graph để ước lượng dịch vụ bị ảnh hưởng dây chuyền.</p></div><small className={`${styles.accessBadge} ${styles.fleetStateBadge} ${runtime?.service_dependency?.ready ? styles.fleetReady : styles.fleetWarn}`}>{runtime?.service_dependency?.ready ? "CLEAR" : runtime?.service_dependency?.severity || "UNKNOWN"}</small></div><div className={styles.fleetStats}><div><span>Services</span><b>{runtime?.service_dependency?.services.length ?? 0}</b></div><div><span>Root failures</span><b>{runtime?.service_dependency?.root_failures.length ?? 0}</b></div><div><span>Blast radius</span><b>{runtime?.service_dependency?.blast_radius ?? 0}</b></div><div><span>Source</span><b>{runtime?.service_dependency?.source ?? "—"}</b></div></div><div className={styles.quorumList}>{(runtime?.service_dependency?.correlations || []).map(item => <div key={`${item.endpoint_id}-${item.root_service}`}><span className={`${styles.fleetStatus} ${item.alert_level === "CRITICAL" ? styles.quorumBad : styles.fleetWarn}`}>{item.alert_level}</span><b>{item.root_service}</b><small>{item.endpoint_id} · {item.consensus}</small><small>Ảnh hưởng: {item.impacted_services.join(" → ") || item.root_service}</small></div>)}{!(runtime?.service_dependency?.correlations || []).length && <p>Không có quorum failure để tính blast radius.</p>}</div><p className={styles.quorumHint}>Dependency graph: {Object.entries(runtime?.service_dependency?.dependencies || {}).map(([service, deps]) => `${service}→${deps.join("+")}`).join(" · ") || "chưa cấu hình"}.</p></section>
    <section className={`${styles.panel} ${styles.compactPanel}`}><div className={styles.panelHead}><div><h2>Probe desired-state · canary rollout</h2><p>Ed25519-signed desired-state, fail-closed khi chưa cấu hình key; deterministic canary/percentage rollout và rollback. Remote code execution luôn OFF.</p></div><small className={`${styles.accessBadge} ${styles.fleetStateBadge} ${desiredState?.current.paused || !desiredState?.signed_delivery ? styles.fleetWarn : styles.fleetReady}`}>{desiredState?.current.paused ? "PAUSED" : desiredState?.signed_delivery ? "ACTIVE" : "SIGNING REQUIRED"}</small></div><div className={styles.fleetStats}><div><span>Revision</span><b>{desiredState?.current.revision ?? 0}</b></div><div><span>Target</span><b>{desiredState?.current.target_version ?? "3.17.0"}</b></div><div><span>Rollout</span><b>{desiredState?.current.rollout_percent ?? 0}%</b></div><div><span>Interval</span><b>{desiredState?.current.interval_seconds ?? 300}s</b></div></div>{access?.admin && <div className={styles.assignmentForm}><input aria-label="Desired target version" value={desiredForm.target_version} onChange={e => setDesiredForm(x => ({ ...x, target_version: e.target.value }))}/><input aria-label="Desired interval seconds" type="number" min={30} max={3600} value={desiredForm.interval_seconds} onChange={e => setDesiredForm(x => ({ ...x, interval_seconds: Number(e.target.value) }))}/><input aria-label="Desired rollout percent" type="number" min={0} max={100} value={desiredForm.rollout_percent} onChange={e => setDesiredForm(x => ({ ...x, rollout_percent: Number(e.target.value) }))}/><input aria-label="Desired canary agents" placeholder="agent-hcm-01,agent-local" value={desiredForm.canary_agents} onChange={e => setDesiredForm(x => ({ ...x, canary_agents: e.target.value }))}/><label className={styles.quorumHint}><input type="checkbox" checked={desiredForm.paused} onChange={e => setDesiredForm(x => ({ ...x, paused: e.target.checked }))}/> Paused</label><button onClick={() => void saveDesiredState()} disabled={dangXuLy === "desired-state-save"}>Lưu rollout</button><button className={styles.secondary} onClick={() => void rollbackDesiredState()} disabled={!desiredState?.previous || dangXuLy === "desired-state-rollback"}>Rollback</button></div>}<p className={styles.quorumHint}>Canary: {desiredState?.current.canary_agents.join(", ") || "—"} · signed delivery {desiredState?.signed_delivery ? "ON" : "OFF"} · key {desiredState?.signing?.key_id || "—"} · remote code execution: OFF.</p></section>
    <section className={`${styles.panel} ${styles.compactPanel}`}><div className={styles.panelHead}><div><h2>Recovery readiness · RPO/RTO</h2><p>Đọc trạng thái PostgreSQL/WAL thực tế và report recovery drill; PITR override là opt-in, không overclaim target-time restore.</p></div><small className={`${styles.accessBadge} ${styles.fleetStateBadge} ${runtime?.database_recovery?.pitr_ready && runtime?.database_recovery?.drill_fresh ? styles.fleetReady : styles.fleetWarn}`}>{runtime?.database_recovery?.pitr_ready ? "PITR READY" : "LOGICAL READY"}</small></div><div className={styles.fleetStats}><div><span>RPO</span><b>{runtime?.database_recovery?.observed_rpo_minutes ?? "—"}m</b><small>target {runtime?.database_recovery?.rpo_target_minutes ?? 60}m</small></div><div><span>RTO drill</span><b>{runtime?.database_recovery?.observed_rto_seconds ?? "—"}s</b><small>target {runtime?.database_recovery?.rto_target_minutes ?? 30}m</small></div><div><span>WAL archive</span><b>{runtime?.database_recovery?.wal_archive.archive_mode ?? "unknown"}</b><small>{runtime?.database_recovery?.wal_archive.wal_level ?? "—"}</small></div><div><span>Drill</span><b>{runtime?.database_recovery?.drill_fresh ? "FRESH" : "DUE"}</b><small>{runtime?.database_recovery?.drill_age_days ?? "—"} day(s)</small></div></div><p className={styles.quorumHint}>Method: {runtime?.database_recovery?.method ?? "—"} · RPO {runtime?.database_recovery?.rpo_met === true ? "PASS" : runtime?.database_recovery?.rpo_met === false ? "MISS" : "N/A"} · RTO {runtime?.database_recovery?.rto_met === true ? "PASS" : runtime?.database_recovery?.rto_met === false ? "MISS" : "N/A"} · target-time PITR exercised: {runtime?.database_recovery?.pitr_restore_exercised ? "YES" : "NO"}.</p></section>
    <section className={`${styles.panel} ${styles.compactPanel}`}><div className={styles.panelHead}><div><h2>Incident postmortem · runbook</h2><p>Chọn incident để tạo draft từ timeline snapshot; lưu root cause, resolution, HTTPS runbook và action item.</p></div><small className={styles.accessBadge}>{runtime?.incident_postmortem?.complete ?? 0} COMPLETE · {runtime?.incident_postmortem?.draft ?? 0} DRAFT</small></div>{selectedIncident && access?.admin ? <div className={styles.assignmentForm}><input aria-label="Postmortem summary" placeholder="Summary" value={postmortemForm.summary} onChange={e => setPostmortemForm(x => ({ ...x, summary: e.target.value }))}/><input aria-label="Postmortem root cause" placeholder="Root cause" value={postmortemForm.root_cause} onChange={e => setPostmortemForm(x => ({ ...x, root_cause: e.target.value }))}/><input aria-label="Postmortem resolution" placeholder="Resolution" value={postmortemForm.resolution} onChange={e => setPostmortemForm(x => ({ ...x, resolution: e.target.value }))}/><input aria-label="Postmortem runbook" placeholder="https://..." value={postmortemForm.runbook_url} onChange={e => setPostmortemForm(x => ({ ...x, runbook_url: e.target.value }))}/><input aria-label="Postmortem action item" placeholder="Action item" value={postmortemForm.action_item} onChange={e => setPostmortemForm(x => ({ ...x, action_item: e.target.value }))}/><button onClick={() => void savePostmortem()} disabled={dangXuLy === "postmortem-save"}>Lưu postmortem</button></div> : <p>Chọn một incident trong danh sách phía dưới để mở postmortem.</p>}<p className={styles.quorumHint}>Timeline snapshot {postmortem?.timeline_snapshot?.events ?? "—"} event(s) · open actions {runtime?.incident_postmortem?.open_actions ?? 0} · runbook HTTPS only.</p></section>
    <section className={styles.panel}><div className={styles.panelHead}><div><h2>Distributed probe agents</h2><p>Heartbeat ký Ed25519 hoặc HMAC, chống replay bằng nonce; agent health và SLO được phân tách theo region/node.</p></div><small className={`${styles.accessBadge} ${styles.probeCountBadge}`}>{runtime?.distributed_probe?.online ?? 0} online · {runtime?.distributed_probe?.offline ?? 0} offline</small></div><div className={styles.assignmentList}>{(runtime?.distributed_probe?.agents || []).map(agent => <div key={agent.agent_id}><span>{agent.online ? "ONLINE" : "OFFLINE"} · {agent.region}</span><b>{agent.agent_id}</b><small>{agent.node_name} · heartbeat {agent.heartbeat_age_seconds}s trước · {agent.phien_ban || "version —"}</small><small>{agent.lan_mau ? `Mẫu cuối ${fmt(agent.lan_mau)}` : "Chưa có sample"}</small></div>)}{!(runtime?.distributed_probe?.agents || []).length && <p>Chưa có distributed probe agent heartbeat. Local scheduler vẫn tiếp tục probe như fallback.</p>}</div></section>

    <section className={styles.panel}><h2>Burn-rate theo thời gian</h2><p>30 ngày gần nhất; dấu bảo trì được annotation trực tiếp theo ngày.</p><div className={styles.burnChart}>{burnSeries.map(item => <div className={styles.burnDay} key={item.ngay}><div className={styles.burnDate}>{item.ngay.slice(5)}{maintenanceDates.has(item.ngay) && <span title={maintenanceDates.get(item.ngay)}>M</span>}</div><div className={styles.burnTracks}><div className={styles.burnTrack}><i style={{ width: `${Math.min(100, ((item.sla_burn_rate || 0) / maxBurn) * 100)}%` }}/><b>SLA {item.sla_burn_rate ?? "—"}x</b></div><div className={styles.burnTrack}><i style={{ width: `${Math.min(100, ((item.uptime_burn_rate || 0) / maxBurn) * 100)}%` }}/><b>Uptime {item.uptime_burn_rate ?? "—"}x</b></div></div></div>)}</div></section>

    <section className={styles.grid2}>
      <article className={styles.panel}><h2>Multi-window burn-rate policy</h2><p>Ngưỡng cảnh báo và endpoint probe có thể đổi mà không cần deploy.</p>{!access?.admin && <p className={styles.readOnly}>Chế độ read-only theo RBAC Ops/on-call. Chỉ Admin được thay đổi policy.</p>}{policy && access?.admin && <>
        <div className={styles.policyRows}>{policy.burn_windows.map((w, index) => <div key={`${w.gio}-${index}`} className={styles.policyRow}>
          <label>Cửa sổ (h)<input type="number" min={1} max={168} value={w.gio} onChange={e => setPolicy(p => p ? ({ ...p, burn_windows: p.burn_windows.map((x, i) => i === index ? { ...x, gio: Number(e.target.value) } : x) }) : p)}/></label>
          <label>Ngưỡng (x)<input type="number" min={0.1} max={100} step={0.1} value={w.nguong} onChange={e => setPolicy(p => p ? ({ ...p, burn_windows: p.burn_windows.map((x, i) => i === index ? { ...x, nguong: Number(e.target.value) } : x) }) : p)}/></label>
          <label>Mức độ<select value={w.muc_do} onChange={e => setPolicy(p => p ? ({ ...p, burn_windows: p.burn_windows.map((x, i) => i === index ? { ...x, muc_do: e.target.value } : x) }) : p)}><option>CANH_BAO</option><option>CAO</option><option>NGHIEM_TRONG</option></select></label>
        </div>)}</div>
        <div className={styles.serviceTargets}>{Object.entries(policy.service_targets).map(([key, value]) => <label key={key}>{key}<input type="number" min={90} max={100} step={0.01} value={value} onChange={e => setPolicy(p => p ? ({ ...p, service_targets: { ...p.service_targets, [key]: Number(e.target.value) } as CauHinhSloNangCaoAdmin["service_targets"] }) : p)}/></label>)}</div>
        <h3>Maintenance-aware SLO</h3><div className={styles.policyRows}><div className={styles.policyRow}><label><input type="checkbox" checked={policy.maintenance_policy.exclude_from_availability} onChange={e => setPolicy(p => p ? ({ ...p, maintenance_policy: { ...p.maintenance_policy, exclude_from_availability: e.target.checked } }) : p)}/> Loại maintenance khỏi availability</label><label><input type="checkbox" checked={policy.maintenance_policy.exclude_from_error_budget} onChange={e => setPolicy(p => p ? ({ ...p, maintenance_policy: { ...p.maintenance_policy, exclude_from_error_budget: e.target.checked } }) : p)}/> Loại maintenance khỏi error budget</label><label>Max gap multiplier<input type="number" min={1} max={6} step={0.5} value={policy.maintenance_policy.max_gap_multiplier} onChange={e => setPolicy(p => p ? ({ ...p, maintenance_policy: { ...p.maintenance_policy, max_gap_multiplier: Number(e.target.value) } }) : p)}/></label></div></div>
        <h3>Endpoint probes</h3><div className={styles.endpointEditor}>{policy.endpoint_checks.map((ep, index) => <div key={`${ep.id}-${index}`} className={styles.endpointRow}><input aria-label={`Endpoint ID ${index + 1}`} value={ep.id} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, id: e.target.value } : x) }) : p)}/><input aria-label={`Endpoint tên ${index + 1}`} value={ep.ten} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, ten: e.target.value } : x) }) : p)}/><input aria-label={`Endpoint path ${index + 1}`} value={ep.path} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, path: e.target.value } : x) }) : p)}/><select aria-label={`Endpoint method ${index + 1}`} value={ep.method} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, method: e.target.value as "GET" | "HEAD" } : x) }) : p)}><option>GET</option><option>HEAD</option></select><input aria-label={`Endpoint SLO ${index + 1}`} type="number" min={90} max={100} step={0.01} value={ep.muc_tieu_percent} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, muc_tieu_percent: Number(e.target.value) } : x) }) : p)}/><input aria-label={`Endpoint latency ${index + 1}`} type="number" min={50} max={10000} value={ep.latency_target_ms} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, latency_target_ms: Number(e.target.value) } : x) }) : p)}/><select aria-label={`Endpoint auth ${index + 1}`} value={ep.auth_template} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, auth_template: e.target.value as "NONE" | "BEARER_ENV" } : x) }) : p)}><option value="NONE">Không auth</option><option value="BEARER_ENV">Bearer từ ENV</option></select><input aria-label={`Endpoint auth env ${index + 1}`} placeholder="ENV token (nếu có)" value={ep.auth_env} onChange={e => setPolicy(p => p ? ({ ...p, endpoint_checks: p.endpoint_checks.map((x, i) => i === index ? { ...x, auth_env: e.target.value } : x) }) : p)}/><small className={styles.blockSmall}>Header template API: {Object.keys(ep.headers || {}).join(", ") || "chưa cấu hình"}</small><button className={styles.danger} onClick={() => removeEndpoint(index)} disabled={policy.endpoint_checks.length <= 1}>Xóa</button></div>)}</div>
        <div className={styles.inlineActions}><button onClick={addEndpoint} disabled={policy.endpoint_checks.length >= 10}>Thêm endpoint</button><button onClick={() => void savePolicy()} disabled={dangXuLy === "policy"}>{dangXuLy === "policy" ? "Đang lưu…" : "Lưu SLO policy"}</button></div>
      </>}</article>

      <article className={styles.panel}><h2>Error budget theo dịch vụ</h2><p>Health snapshot legacy vẫn giữ để đối chiếu với endpoint time-weighted.</p><div className={styles.tableWrap}><table><thead><tr><th>Dịch vụ</th><th>Mục tiêu</th><th>Mẫu xấu</th><th>Đã tiêu</th><th>Còn lại</th></tr></thead><tbody>{Object.entries(sla?.ngan_sach_dich_vu || {}).map(([key, value]) => <tr key={key}><td>{key}</td><td>{pct(value.muc_tieu_percent)}</td><td>{value.mau_xau}/{value.tong_mau}</td><td>{pct(value.da_tieu_thu_percent)}</td><td>{pct(value.con_lai_percent)}</td></tr>)}</tbody></table></div>
      <h3>Burn-rate hiện tại</h3><div className={styles.burnList}>{(sla?.burn_rate_policy || []).map(item => <div key={item.gio}><b>{item.gio}h · policy {item.nguong}x</b><span>SLA {item.sla.burn_rate ?? "—"}x · Uptime {item.uptime.burn_rate ?? "—"}x</span></div>)}</div></article>
    </section>

    {access?.admin && <section className={styles.panel}><div className={styles.panelHead}><div><h2>Maintenance windows</h2><p>Hỗ trợ nhiều cửa sổ, lặp hằng ngày/hằng tuần; chart burn-rate hiển thị annotation maintenance.</p></div></div>
      <div className={styles.maintenanceForm}><input placeholder="Tên maintenance" value={form.ten} onChange={e => setForm(x => ({ ...x, ten: e.target.value }))}/><input type="datetime-local" value={form.bat_dau} onChange={e => setForm(x => ({ ...x, bat_dau: e.target.value }))}/><input type="datetime-local" value={form.ket_thuc} onChange={e => setForm(x => ({ ...x, ket_thuc: e.target.value }))}/><select value={form.lap_lai} onChange={e => setForm(x => ({ ...x, lap_lai: e.target.value as typeof x.lap_lai }))}><option value="KHONG">Không lặp</option><option value="HANG_NGAY">Hằng ngày</option><option value="HANG_TUAN">Hằng tuần</option></select><input placeholder="Lý do" value={form.ly_do} onChange={e => setForm(x => ({ ...x, ly_do: e.target.value }))}/><button className={styles.maintenanceAddButton} onClick={() => void taoMaintenance()} disabled={dangXuLy === "maintenance-create"}>Thêm window</button></div>
      <div className={styles.maintenanceList}>{maintenance.map(item => <article key={item.id} className={item.dang_bao_tri ? styles.activeWindow : ""}><div><b>{item.ten}</b><span>{item.lap_lai.replaceAll("_", " ")} · {item.dang_bao_tri ? "ĐANG BẢO TRÌ" : item.bat ? "Đang bật" : "Đã tắt"}</span><small>{fmt(item.bat_dau)} → {fmt(item.ket_thuc)}{item.lan_tiep_theo ? ` · Lần tiếp: ${fmt(item.lan_tiep_theo)}` : ""}</small><em>{item.ly_do || "Không có lý do"}</em></div><div><button onClick={() => void toggleMaintenance(item)} disabled={dangXuLy === `maintenance-${item.id}`}>{item.bat ? "Tắt" : "Bật"}</button><button className={styles.danger} onClick={() => void deleteMaintenance(item)} disabled={dangXuLy === `maintenance-${item.id}`}>Xóa</button></div></article>)}</div>
    </section>}

    {access?.admin && <section className={styles.panel}><div className={styles.panelHead}><div><h2>RBAC Ops / on-call theo dịch vụ</h2><p>Gán quyền đọc, on-call xử lý incident hoặc service owner; escalation 1-5.</p></div></div><div className={styles.assignmentForm}><select value={assignmentForm.nguoi_dung_id} onChange={e => setAssignmentForm(x => ({ ...x, nguoi_dung_id: e.target.value }))}><option value="">Chọn nhân viên</option>{staff.map(x => <option key={x.id} value={x.id}>{x.ho_ten} · {x.thu_dien_tu}</option>)}</select><select value={assignmentForm.dich_vu} onChange={e => setAssignmentForm(x => ({ ...x, dich_vu: e.target.value }))}><option>api</option><option>postgresql</option><option>backup</option><option>smtp</option><option>webhook</option><option>storefront</option></select><select value={assignmentForm.vai_tro_ops} onChange={e => setAssignmentForm(x => ({ ...x, vai_tro_ops: e.target.value as typeof x.vai_tro_ops }))}><option>OPS_VIEWER</option><option>ON_CALL</option><option>SERVICE_OWNER</option></select><input type="number" min={1} max={5} value={assignmentForm.cap_escalation} onChange={e => setAssignmentForm(x => ({ ...x, cap_escalation: Number(e.target.value) }))}/><button onClick={() => void addAssignment()} disabled={dangXuLy === "ops-assignment"}>Gán quyền</button></div><div className={styles.assignmentList}>{assignments.map(item => <div key={item.id}><span>{item.vai_tro_ops} · {item.dich_vu} · L{item.cap_escalation}</span><b>{item.nguoi_dung?.ho_ten || item.nguoi_dung_id}</b><small>{item.nguoi_dung?.thu_dien_tu || ""}</small><button className={styles.danger} onClick={() => void removeAssignment(item)} disabled={dangXuLy === `ops-assignment-${item.id}`}>Xóa</button></div>)}{!assignments.length && <p>Chưa có phân quyền Ops/on-call.</p>}</div></section>}

    {access?.admin && <section className={styles.grid2}>
      <article className={styles.panel}><div className={styles.panelHead}><div><h2>On-call schedule / rotation</h2><p>Ca trực theo thứ/timezone, ICS calendar, handoff report và override/absence; incident vẫn auto-assign theo roster hiện hành.</p></div><div className={styles.inlineActions}><button className={styles.secondary} onClick={() => void exportOnCallCalendar()} disabled={dangXuLy === "on-call-calendar"}>Xuất ICS</button><button className={styles.secondary} onClick={() => void exportOnCallHandoff()} disabled={dangXuLy === "on-call-handoff"}>Handoff</button></div></div><div className={styles.assignmentForm}><select value={onCallForm.nguoi_dung_id} onChange={e => setOnCallForm(x => ({ ...x, nguoi_dung_id: e.target.value }))}><option value="">Chọn nhân viên trực</option>{staff.map(x => <option key={x.id} value={x.id}>{x.ho_ten} · {x.thu_dien_tu}</option>)}</select><select value={onCallForm.dich_vu} onChange={e => setOnCallForm(x => ({ ...x, dich_vu: e.target.value }))}><option>api</option><option>postgresql</option><option>backup</option><option>smtp</option><option>webhook</option><option>storefront</option></select><select value={onCallForm.thu_trong_tuan} onChange={e => setOnCallForm(x => ({ ...x, thu_trong_tuan: Number(e.target.value) }))}><option value={0}>CN</option><option value={1}>T2</option><option value={2}>T3</option><option value={3}>T4</option><option value={4}>T5</option><option value={5}>T6</option><option value={6}>T7</option></select><input aria-label="On-call bắt đầu phút" type="number" min={0} max={1439} value={onCallForm.bat_dau_phut} onChange={e => setOnCallForm(x => ({ ...x, bat_dau_phut: Number(e.target.value) }))}/><input aria-label="On-call kết thúc phút" type="number" min={0} max={1439} value={onCallForm.ket_thuc_phut} onChange={e => setOnCallForm(x => ({ ...x, ket_thuc_phut: Number(e.target.value) }))}/><input aria-label="On-call escalation level" type="number" min={1} max={5} value={onCallForm.cap_escalation} onChange={e => setOnCallForm(x => ({ ...x, cap_escalation: Number(e.target.value) }))}/><button onClick={() => void addOnCallSchedule()} disabled={dangXuLy === "on-call-create"}>Thêm ca</button></div><div className={styles.assignmentList}>{onCallSchedules.map(item => <div key={item.id}><span>{item.dich_vu} · L{item.cap_escalation} · thứ {item.thu_trong_tuan}</span><b>{item.nguoi_dung?.ho_ten || item.nguoi_dung_id}</b><small>{phutThanhGio(item.bat_dau_phut)} → {phutThanhGio(item.ket_thuc_phut)} · {item.timezone}</small><button className={styles.danger} onClick={() => void removeOnCallSchedule(item)} disabled={dangXuLy === `on-call-${item.id}`}>Xóa</button></div>)}{!onCallSchedules.length && <p>Chưa cấu hình ca on-call.</p>}</div></article>
      <article className={styles.panel}><h2>Escalation routing theo dịch vụ</h2><p>Policy chọn level theo thời gian tồn tại và route on-call qua EMAIL / WEBHOOK / cả hai.</p><div className={styles.assignmentForm}><select value={escalationForm.dich_vu} onChange={e => setEscalationForm(x => ({ ...x, dich_vu: e.target.value }))}><option>api</option><option>postgresql</option><option>backup</option><option>smtp</option><option>webhook</option><option>storefront</option></select><input aria-label="Escalation level" type="number" min={1} max={5} value={escalationForm.cap_escalation} onChange={e => setEscalationForm(x => ({ ...x, cap_escalation: Number(e.target.value) }))}/><input aria-label="Escalation sau phút" type="number" min={0} max={10080} value={escalationForm.sau_phut} onChange={e => setEscalationForm(x => ({ ...x, sau_phut: Number(e.target.value) }))}/><select value={escalationForm.kenh} onChange={e => setEscalationForm(x => ({ ...x, kenh: e.target.value as typeof x.kenh }))}><option>EMAIL_WEBHOOK</option><option>EMAIL</option><option>WEBHOOK</option></select><button onClick={() => void saveEscalationPolicy()} disabled={dangXuLy === "escalation-policy"}>Lưu policy</button></div><div className={styles.assignmentList}>{escalationPolicies.map(item => <div key={item.id}><span>{item.dich_vu} · L{item.cap_escalation}</span><b>Sau {item.sau_phut} phút</b><small>{item.kenh} · {item.dang_hoat_dong ? "ACTIVE" : "OFF"}</small></div>)}{!escalationPolicies.length && <p>Chưa có escalation policy; hệ thống dùng escalation mặc định.</p>}</div></article>
    </section>}

    {access?.admin && <section className={styles.grid2}>
      <article className={styles.panel}><div className={styles.panelHead}><div><h2>DLQ keyring + bulk replay jobs</h2><p>Keyring hỗ trợ rotate key mà vẫn giải mã payload cũ; replay job có progress/cancel và per-item audit.</p></div><button onClick={() => void rotateDlqKey()} disabled={dangXuLy === "dlq-rotate"}>Rotate 100 payload</button></div><div className={styles.runtimeGrid}><div><span>Active key</span><b>{keyring?.active_key_id || "—"}</b><small>{keyring?.configured_keys ?? 0} key cấu hình</small></div><div><span>Key IDs</span><b>{keyring?.key_ids.join(", ") || "—"}</b><small>KMS-friendly references</small></div><div><span>Replay queue</span><b>{runtime?.replay_jobs?.cho_xu_ly ?? 0} chờ</b><small>{runtime?.replay_jobs?.dang_xu_ly ?? 0} đang xử lý</small></div><div><span>Secrets exposed</span><b>{keyring?.secret_values_exposed ? "CÓ" : "KHÔNG"}</b></div></div><div className={styles.assignmentList}>{replayJobs.map(job => <div key={job.id}><span>{job.trang_thai} · {job.progress_percent}%</span><b>#{job.id.slice(0, 8)} · {job.da_xu_ly}/{job.tong}</b><small>{job.thanh_cong} thành công · {job.that_bai} thất bại · {fmt(job.ngay_tao)}</small>{!["HOAN_TAT", "DA_HUY"].includes(job.trang_thai) && <button className={styles.danger} onClick={() => void cancelReplayJob(job)} disabled={dangXuLy === `replay-job-${job.id}`}>Hủy</button>}</div>)}{!replayJobs.length && <p>Chưa có bulk replay job.</p>}</div></article>
      <article className={styles.panel}><h2>Telemetry archive · verify before prune</h2><p>Archive theo partition, verify-before-prune; v3.16 thêm JSONL+GZIP portable bundle, S3-compatible presigned upload và restore/replay có dry-run.</p><div className={styles.assignmentForm}><select value={archiveForm.bang_nguon} onChange={e => { setArchiveForm(x => ({ ...x, bang_nguon: e.target.value as typeof x.bang_nguon })); setArchivePreview(null); }}><option value="slo_endpoint_mau">slo_endpoint_mau</option><option value="lich_su_van_hanh">lich_su_van_hanh</option></select><input type="month" value={archiveForm.thang} onChange={e => { setArchiveForm(x => ({ ...x, thang: e.target.value })); setArchivePreview(null); }}/><button onClick={() => void previewArchive()} disabled={dangXuLy === "archive-preview"}>Preview</button><button onClick={() => void runArchive()} disabled={!archivePreview || archivePreview.archived || dangXuLy === "archive-run"}>Archive + prune</button><button className={styles.secondary} onClick={() => void exportArchiveBundle()} disabled={!archivePreview || (!archivePreview.archived && !archivePreview.da_archive) || dangXuLy === "archive-export"}>Tải bundle</button></div>{archivePreview && <div className={styles.runtimeGrid}><div><span>Eligible</span><b>{archivePreview.eligible_count}</b><small>{archivePreview.bang_nguon} · {archivePreview.thang}</small></div><div><span>SHA-256 verify</span><b>{archivePreview.sha256.slice(0, 16)}…</b><small>{archivePreview.archived || archivePreview.da_archive ? "Đã archive" : "Chưa archive"}</small></div></div>}</article>
    </section>}

    <section className={styles.grid2}>
      <article className={styles.panel}><h2>Incident + timeline GIN full-text</h2><div className={styles.incidents}>{incidents.map(item => <div key={item.chu_ky} className={`${styles.incidentButton} ${selectedIncident === item.chu_ky ? styles.selectedIncident : ""}`}><button className={styles.incidentOpen} onClick={() => void loadTimeline(item.chu_ky, true)}><span>{item.trang_thai_xu_ly.replaceAll("_", " ")} · {item.dich_vu || "api"}</span><b>{item.van_de.join(" · ") || "Incident"}</b><small>#{item.chu_ky.slice(0, 12)} · {fmt(item.bat_dau)} · {item.so_su_kien} sự kiện · owner {item.chu_so_huu_ten || "chưa gán"}</small></button>{access?.admin && !item.chu_so_huu_id && <button className={styles.secondary} onClick={() => void assignIncidentOwner(item)} disabled={dangXuLy === `incident-owner-${item.chu_ky}`}>Gán on-call</button>}</div>)}{!incidents.length && <p>Không có incident phù hợp.</p>}</div>
        {selectedIncident && <div className={styles.timeline}><div className={styles.timelineSearch}><input placeholder="Tìm full-text trong mô tả / JSON timeline" value={timelineQuery} onChange={e => setTimelineQuery(e.target.value)}/><button onClick={() => void loadTimeline(selectedIncident, true, timelineQuery)}>Tìm</button></div>{timeline.map(item => <div key={item.id}><span>{item.loai} · {item.trang_thai}</span><b>{item.mo_ta || "Sự kiện vận hành"}</b><small>{fmt(item.ngay_tao)} · #{item.id}</small></div>)}{timelineHasMore && <button onClick={() => void loadTimeline(selectedIncident, false, timelineQuery)} disabled={dangXuLy === "timeline"}>Tải thêm timeline</button>}</div>}
      </article>
      {access?.admin ? <article className={styles.panel}><h2>Webhook encrypted DLQ + retry budget</h2><p>Adapter: <b>{webhookAdapter}</b>. AES-256-GCM keyring, per-destination retry budget, scheduled retry và async bulk replay jobs.</p><div className={styles.incidents}>{webhook.slice(0, 12).map(item => <div key={item.id}><span>{item.trang_thai}</span><b>{item.mo_ta || "Webhook delivery"}</b><small>{fmt(item.ngay_tao)} · {JSON.stringify(item.chi_tiet)}</small></div>)}</div><div className={styles.panelHead}><h3>Dead-letter queue</h3><button onClick={() => void replayBulkDeadLetters()} disabled={dangXuLy === "replay-bulk"}>Tạo bulk replay job</button></div><div className={styles.incidents}>{deadLetters.map(item => <div key={item.id}><span>{item.trang_thai_dlq.replaceAll("_", " ")}</span><b>{item.mo_ta || `Dead-letter #${item.id}`}</b><small>{fmt(item.ngay_tao)} · hết hạn {fmt(item.het_han_luc)} · retry {fmt(item.retry_tiep_theo_luc)} · {item.payload_encrypted ? "encrypted" : "legacy"}</small><div className={styles.inlineActions}><button onClick={() => void replayDeadLetter(item)} disabled={!['CHO_REPLAY','CHO_RETRY','RETRY_THAT_BAI'].includes(item.trang_thai_dlq) || dangXuLy === `replay-${item.id}`}>Replay</button><button className={styles.secondary} onClick={() => void ackDeadLetter(item)} disabled={!['CHO_REPLAY','CHO_RETRY','RETRY_THAT_BAI'].includes(item.trang_thai_dlq) || dangXuLy === `ack-${item.id}`}>Acknowledge</button></div></div>)}{!deadLetters.length && <p>Không có webhook dead-letter.</p>}</div></article> : <article className={styles.panel}><h2>Ops runtime / on-call</h2><p>Quyền hiện tại: <b>{access?.vai_tro_ops || "—"}</b></p><div className={styles.runtimeGrid}><div><span>Probe agent</span><b>{runtime?.probe_agent.agent_id || "—"}</b><small>{runtime?.probe_agent.region} · {runtime?.probe_agent.node_name}</small></div><div><span>Persistent samples</span><b>{runtime?.endpoint_samples ?? 0}</b></div><div><span>Metrics cache</span><b>{runtime?.ops_metrics.refresh_phut ?? "—"} phút</b><small>retention {runtime?.ops_metrics.retention_days ?? "—"} ngày</small></div><div><span>RBAC assignments</span><b>{runtime?.rbac.active_assignments ?? 0}</b></div></div></article>}
    </section>
  </main>;
}
