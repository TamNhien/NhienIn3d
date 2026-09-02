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
  OpsPhanCongAdmin,
  OpsRuntimeAdmin,
  SlaVanHanhAdmin,
  SuCoVanHanhTomTat,
  WebhookDeadLetterAdmin,
  capNhatBaoTriNangCaoAdmin,
  capNhatCauHinhSloNangCaoAdmin,
  layCauHinhSloNangCaoAdmin,
  layDanhSachBaoTriAdmin,
  layNguoiDung,
  layOpsDashboardReadonly,
  layOpsPhanCongAdmin,
  layOpsRuntimeAdmin,
  layOpsTimelineReadonly,
  layDanhSachSuCoVanHanhAdmin,
  laySlaVanHanhAdmin,
  layTimelineSuCoVanHanhAdmin,
  layWebhookDeadLetterAdmin,
  layWebhookDeliveryAdmin,
  replayWebhookDeadLetterAdmin,
  acknowledgeWebhookDeadLetterAdmin,
  replayBulkWebhookDeadLetterAdmin,
  taoBaoTriAdmin,
  taoOpsPhanCongAdmin,
  xoaBaoTriAdmin,
  xoaOpsPhanCongAdmin,
  xuatOpsTongHopExcelAdmin
} from "../../../lib/quan-tri";
import styles from "./page.module.css";

const homNay = () => new Date().toISOString().slice(0, 10);
const truocNgay = (soNgay: number) => { const d = new Date(); d.setDate(d.getDate() - soNgay); return d.toISOString().slice(0, 10); };
const fmt = (value?: string | null) => value ? new Date(value).toLocaleString("vi-VN") : "—";
const ms = (value?: number | null) => value == null ? "—" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ms`;
const pct = (value?: number | null) => value == null ? "—" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 3 })}%`;
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

  const taiDuLieu = useCallback(async () => {
    setDangXuLy("load"); setLoi("");
    try {
      const taiKhoan = await layTaiKhoan();
      if (!taiKhoan) throw new Error("Bạn cần đăng nhập để truy cập Ops Dashboard.");
      if (taiKhoan.vai_tro === "ADMIN") {
        const [sloData, incidentData, maintenanceData, policyData, webhookData, dlqData, runtimeData, assignmentData, users] = await Promise.all([
          laySlaVanHanhAdmin(90),
          layDanhSachSuCoVanHanhAdmin(100, trangThai, tuNgay, denNgay),
          layDanhSachBaoTriAdmin(),
          layCauHinhSloNangCaoAdmin(),
          layWebhookDeliveryAdmin(30),
          layWebhookDeadLetterAdmin(30),
          layOpsRuntimeAdmin(),
          layOpsPhanCongAdmin(),
          layNguoiDung()
        ]);
        setAccess({ duoc_phep: true, admin: true, vai_tro_ops: "SERVICE_OWNER", dich_vu: ["*"] });
        setSla(sloData); setIncidents(incidentData.du_lieu); setMaintenance(maintenanceData.du_lieu); setPolicy(policyData); setWebhook(webhookData.du_lieu); setDeadLetters(dlqData.du_lieu); setWebhookAdapter(webhookData.cau_hinh.adapter || "GENERIC"); setRuntime(runtimeData); setAssignments(assignmentData.du_lieu); setStaff(users.filter(x => x.vai_tro !== "KHACH_HANG" && x.da_kich_hoat !== false));
      } else {
        const data = await layOpsDashboardReadonly(90);
        const filtered = data.incidents.du_lieu.filter(item => {
          if (trangThai && item.trang_thai_xu_ly !== trangThai) return false;
          const day = item.bat_dau.slice(0, 10);
          return (!tuNgay || day >= tuNgay) && (!denNgay || day <= denNgay);
        });
        setAccess(data.access); setSla(data.sla); setIncidents(filtered); setPolicy(data.sla.cau_hinh_nang_cao || null); setRuntime(data.runtime); setMaintenance([]); setWebhook([]); setDeadLetters([]); setAssignments([]); setStaff([]);
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
      setSelectedIncident(chuKy); setTimeline(current => reset ? kq.du_lieu : [...current, ...kq.du_lieu]); setTimelineCursor(kq.cursor.next_cursor); setTimelineHasMore(kq.cursor.co_them);
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
    try { await acknowledgeWebhookDeadLetterAdmin(item.id, "Đã xác nhận xử lý từ Ops Dashboard v3.10.5"); setThongBao(`Đã acknowledge dead-letter #${item.id}.`); await taiDuLieu(); }
    catch (error) { setLoi(error instanceof Error ? error.message : String(error)); }
    finally { setDangXuLy(""); }
  }

  async function replayBulkDeadLetters() {
    const ids = deadLetters.filter(x => ["CHO_REPLAY", "CHO_RETRY"].includes(x.trang_thai_dlq)).slice(0, 20).map(x => x.id);
    if (!ids.length) { setThongBao("Không có dead-letter đang chờ replay."); return; }
    if (!confirm(`Replay bulk ${ids.length} dead-letter đang chờ?`)) return;
    setDangXuLy("replay-bulk"); setLoi("");
    try { const kq = await replayBulkWebhookDeadLetterAdmin(ids); setThongBao(`Bulk replay: ${kq.thanh_cong}/${kq.tong} thành công.`); await taiDuLieu(); }
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

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><span className={styles.kicker}>NHIENIN3D · OPS v3.10.5</span><h1>Ops Dashboard</h1><p>Persistent endpoint SLI + Apdex đa agent/region, encrypted DLQ scheduled retry, cached Ops metrics và RBAC on-call theo dịch vụ.</p>{access && <small className={styles.accessBadge}>{access.admin ? "ADMIN · SERVICE OWNER" : `${access.vai_tro_ops} · ${access.dich_vu.join(", ")}`}</small>}</div>
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
      <article className={styles.panel}><h2>Endpoint SLO · time-weighted + latency</h2><p>Availability time-weighted; latency có SLI, P50/P95/P99 và histogram. Maintenance được loại trừ theo policy.</p><div className={styles.tableWrap}><table><thead><tr><th>Endpoint</th><th>Availability</th><th>Latency SLI</th><th>P95 / Target</th><th>Apdex</th><th>Agent/region</th><th>Maintenance loại</th><th>Budget còn</th></tr></thead><tbody>{(sla?.endpoint_slo?.endpoints || []).map(item => <tr key={item.id}><td><b>{item.ten}</b><small className={styles.blockSmall}>{item.method} · {item.path}</small></td><td>{pct(item.availability_percent)}</td><td>{pct(item.latency.sli_percent)}</td><td>{ms(item.latency.p95_ms)} / {ms(item.latency.target_ms)}</td><td>{item.latency.apdex?.score ?? "—"}</td><td>{item.probe_agents?.join(", ") || "legacy"}<small className={styles.blockSmall}>{item.persistent_samples ?? 0} persistent samples</small></td><td>{item.excluded_maintenance_phut.availability} phút</td><td>{pct(item.error_budget_con_lai_percent)}</td></tr>)}</tbody></table></div></article>
    </section>

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
      <div className={styles.maintenanceForm}><input placeholder="Tên maintenance" value={form.ten} onChange={e => setForm(x => ({ ...x, ten: e.target.value }))}/><input type="datetime-local" value={form.bat_dau} onChange={e => setForm(x => ({ ...x, bat_dau: e.target.value }))}/><input type="datetime-local" value={form.ket_thuc} onChange={e => setForm(x => ({ ...x, ket_thuc: e.target.value }))}/><select value={form.lap_lai} onChange={e => setForm(x => ({ ...x, lap_lai: e.target.value as typeof x.lap_lai }))}><option value="KHONG">Không lặp</option><option value="HANG_NGAY">Hằng ngày</option><option value="HANG_TUAN">Hằng tuần</option></select><input placeholder="Lý do" value={form.ly_do} onChange={e => setForm(x => ({ ...x, ly_do: e.target.value }))}/><button onClick={() => void taoMaintenance()} disabled={dangXuLy === "maintenance-create"}>Thêm window</button></div>
      <div className={styles.maintenanceList}>{maintenance.map(item => <article key={item.id} className={item.dang_bao_tri ? styles.activeWindow : ""}><div><b>{item.ten}</b><span>{item.lap_lai.replaceAll("_", " ")} · {item.dang_bao_tri ? "ĐANG BẢO TRÌ" : item.bat ? "Đang bật" : "Đã tắt"}</span><small>{fmt(item.bat_dau)} → {fmt(item.ket_thuc)}{item.lan_tiep_theo ? ` · Lần tiếp: ${fmt(item.lan_tiep_theo)}` : ""}</small><em>{item.ly_do || "Không có lý do"}</em></div><div><button onClick={() => void toggleMaintenance(item)} disabled={dangXuLy === `maintenance-${item.id}`}>{item.bat ? "Tắt" : "Bật"}</button><button className={styles.danger} onClick={() => void deleteMaintenance(item)} disabled={dangXuLy === `maintenance-${item.id}`}>Xóa</button></div></article>)}</div>
    </section>}

    {access?.admin && <section className={styles.panel}><div className={styles.panelHead}><div><h2>RBAC Ops / on-call theo dịch vụ</h2><p>Gán quyền đọc, on-call xử lý incident hoặc service owner; escalation 1-5.</p></div></div><div className={styles.assignmentForm}><select value={assignmentForm.nguoi_dung_id} onChange={e => setAssignmentForm(x => ({ ...x, nguoi_dung_id: e.target.value }))}><option value="">Chọn nhân viên</option>{staff.map(x => <option key={x.id} value={x.id}>{x.ho_ten} · {x.thu_dien_tu}</option>)}</select><select value={assignmentForm.dich_vu} onChange={e => setAssignmentForm(x => ({ ...x, dich_vu: e.target.value }))}><option>api</option><option>postgresql</option><option>backup</option><option>smtp</option><option>webhook</option><option>storefront</option></select><select value={assignmentForm.vai_tro_ops} onChange={e => setAssignmentForm(x => ({ ...x, vai_tro_ops: e.target.value as typeof x.vai_tro_ops }))}><option>OPS_VIEWER</option><option>ON_CALL</option><option>SERVICE_OWNER</option></select><input type="number" min={1} max={5} value={assignmentForm.cap_escalation} onChange={e => setAssignmentForm(x => ({ ...x, cap_escalation: Number(e.target.value) }))}/><button onClick={() => void addAssignment()} disabled={dangXuLy === "ops-assignment"}>Gán quyền</button></div><div className={styles.assignmentList}>{assignments.map(item => <div key={item.id}><span>{item.vai_tro_ops} · {item.dich_vu} · L{item.cap_escalation}</span><b>{item.nguoi_dung?.ho_ten || item.nguoi_dung_id}</b><small>{item.nguoi_dung?.thu_dien_tu || ""}</small><button className={styles.danger} onClick={() => void removeAssignment(item)} disabled={dangXuLy === `ops-assignment-${item.id}`}>Xóa</button></div>)}{!assignments.length && <p>Chưa có phân quyền Ops/on-call.</p>}</div></section>}

    <section className={styles.grid2}>
      <article className={styles.panel}><h2>Incident + timeline GIN full-text</h2><div className={styles.incidents}>{incidents.map(item => <button key={item.chu_ky} className={`${styles.incidentButton} ${selectedIncident === item.chu_ky ? styles.selectedIncident : ""}`} onClick={() => void loadTimeline(item.chu_ky, true)}><span>{item.trang_thai_xu_ly.replaceAll("_", " ")}</span><b>{item.van_de.join(" · ") || "Incident"}</b><small>#{item.chu_ky.slice(0, 12)} · {fmt(item.bat_dau)} · {item.so_su_kien} sự kiện</small></button>)}{!incidents.length && <p>Không có incident phù hợp.</p>}</div>
        {selectedIncident && <div className={styles.timeline}><div className={styles.timelineSearch}><input placeholder="Tìm full-text trong mô tả / JSON timeline" value={timelineQuery} onChange={e => setTimelineQuery(e.target.value)}/><button onClick={() => void loadTimeline(selectedIncident, true, timelineQuery)}>Tìm</button></div>{timeline.map(item => <div key={item.id}><span>{item.loai} · {item.trang_thai}</span><b>{item.mo_ta || "Sự kiện vận hành"}</b><small>{fmt(item.ngay_tao)} · #{item.id}</small></div>)}{timelineHasMore && <button onClick={() => void loadTimeline(selectedIncident, false, timelineQuery)} disabled={dangXuLy === "timeline"}>Tải thêm timeline</button>}</div>}
      </article>
      {access?.admin ? <article className={styles.panel}><h2>Webhook encrypted DLQ + scheduled retry</h2><p>Adapter: <b>{webhookAdapter}</b>. Payload lưu AES-256-GCM reference, có retention, scheduled retry và idempotency.</p><div className={styles.incidents}>{webhook.slice(0, 12).map(item => <div key={item.id}><span>{item.trang_thai}</span><b>{item.mo_ta || "Webhook delivery"}</b><small>{fmt(item.ngay_tao)} · {JSON.stringify(item.chi_tiet)}</small></div>)}</div><div className={styles.panelHead}><h3>Dead-letter queue</h3><button onClick={() => void replayBulkDeadLetters()} disabled={dangXuLy === "replay-bulk"}>Replay bulk chờ</button></div><div className={styles.incidents}>{deadLetters.map(item => <div key={item.id}><span>{item.trang_thai_dlq.replaceAll("_", " ")}</span><b>{item.mo_ta || `Dead-letter #${item.id}`}</b><small>{fmt(item.ngay_tao)} · hết hạn {fmt(item.het_han_luc)} · retry {fmt(item.retry_tiep_theo_luc)} · {item.payload_encrypted ? "encrypted" : "legacy"}</small><div className={styles.inlineActions}><button onClick={() => void replayDeadLetter(item)} disabled={!['CHO_REPLAY','CHO_RETRY','RETRY_THAT_BAI'].includes(item.trang_thai_dlq) || dangXuLy === `replay-${item.id}`}>Replay</button><button className={styles.secondary} onClick={() => void ackDeadLetter(item)} disabled={!['CHO_REPLAY','CHO_RETRY','RETRY_THAT_BAI'].includes(item.trang_thai_dlq) || dangXuLy === `ack-${item.id}`}>Acknowledge</button></div></div>)}{!deadLetters.length && <p>Không có webhook dead-letter.</p>}</div></article> : <article className={styles.panel}><h2>Ops runtime / on-call</h2><p>Quyền hiện tại: <b>{access?.vai_tro_ops || "—"}</b></p><div className={styles.runtimeGrid}><div><span>Probe agent</span><b>{runtime?.probe_agent.agent_id || "—"}</b><small>{runtime?.probe_agent.region} · {runtime?.probe_agent.node_name}</small></div><div><span>Persistent samples</span><b>{runtime?.endpoint_samples ?? 0}</b></div><div><span>Metrics cache</span><b>{runtime?.ops_metrics.refresh_phut ?? "—"} phút</b><small>retention {runtime?.ops_metrics.retention_days ?? "—"} ngày</small></div><div><span>RBAC assignments</span><b>{runtime?.rbac.active_assignments ?? 0}</b></div></div></article>}
    </section>
  </main>;
}
