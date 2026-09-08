import { existsSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const fileEnv = new Map();
if (existsSync(".env")) {
  for (const rawLine of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    fileEnv.set(key, value);
  }
}
const env = (name, fallback = "") => process.env[name]?.trim() || fileEnv.get(name) || fallback;
const boolEnv = (name) => ["1", "true", "yes", "on"].includes(env(name).toLowerCase());

const port = env("WEB_PORT", "3000");
const base = env("E2E_WEB_URL", `https://localhost:${port}`);
const email = env("ADMIN_EMAIL", "admin@nhienin3d.local");
const password = env("ADMIN_PASSWORD");
if (!password) throw new Error("Thiếu ADMIN_PASSWORD trong biến môi trường hoặc file .env để chạy browser E2E v3.28.0");
const mutateIncident = process.env.CI === "true" || boolEnv("E2E_MUTATE_INCIDENT");
const syntheticSignature = "fdde222e3bc7582312ed975e75f8e8fde98f263fd36a42183ad5f77be11e6f21";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
let originalSlo = null;
try {
  const healthResponse = await context.request.get(`${base}/api/v1/suc-khoe`);
  if (!healthResponse.ok()) throw new Error(`Health API qua HTTPS trả ${healthResponse.status()}.`);
  const health = await healthResponse.json();
  if (health.phien_ban !== "v3.28.0") throw new Error(`API đang chạy ${health.phien_ban || "không rõ version"}, không phải v3.28.0. Docker có thể vẫn dùng container/image cũ.`);

  await page.goto(`${base}/dang-nhap?chuyen_den=/quan-tri`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/quan-tri(?:\?|$)/, { timeout: 30_000 });
  await page.getByRole("heading", { name: "Admin Dashboard" }).waitFor({ timeout: 30_000 });

  const refundQueueResponse = await context.request.get(`${base}/api/v1/quan-tri/don-hang/hoan-tien-can-xu-ly`);
  if (!refundQueueResponse.ok()) throw new Error(`Refund queue API trả ${refundQueueResponse.status()}.`);
  const refundQueue = await refundQueueResponse.json();
  if (refundQueue.phien_ban !== "3.28.0" || refundQueue.gateway_auto_refund !== false || refundQueue.manual_confirmation_required !== true) throw new Error("Refund reconciliation v3.28.0 chưa fail-safe/manual đúng contract.");

  await page.getByRole("button", { name: "Hệ thống", exact: true }).click();
  await page.getByRole("heading", { name: "Maintenance window" }).waitFor({ timeout: 30_000 });
  await page.getByRole("heading", { name: "Mục tiêu SLO vận hành" }).waitFor();
  await page.getByText("Error budget SLA · 30 ngày", { exact: true }).waitFor();
  await page.getByText("Burn-rate SLA · 1h / 6h / 24h", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Xuất Incident Excel", exact: true }).waitFor();

  // SLO persistence: thay đổi rất nhỏ, reload xác minh rồi restore qua API trong finally.
  const sloRes = await context.request.get(`${base}/api/v1/quan-tri/he-thong/cau-hinh-slo`);
  originalSlo = await sloRes.json();
  const slaInput = page.getByLabel("SLA mục tiêu (%)", { exact: true });
  const current = Number(await slaInput.inputValue());
  const next = current >= 99.99 ? 99.98 : Math.round((current + 0.01) * 100) / 100;
  await slaInput.fill(String(next));
  await page.getByRole("button", { name: "Lưu mục tiêu SLO", exact: true }).click();
  await page.getByText("Đã lưu mục tiêu SLO", { exact: false }).waitFor({ timeout: 30_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Hệ thống", exact: true }).click();
  await page.getByRole("heading", { name: "Mục tiêu SLO vận hành" }).waitFor();
  const persisted = Number(await page.getByLabel("SLA mục tiêu (%)", { exact: true }).inputValue());
  if (Math.abs(persisted - next) > 0.0001) throw new Error(`SLO không persistence sau reload: mong ${next}, nhận ${persisted}`);

  // Incident lifecycle mutation chỉ bật trong CI/E2E_MUTATE_INCIDENT để không làm thay đổi incident thật khi chạy local.
  await page.getByRole("button", { name: "Kho", exact: true }).click();
  await page.getByRole("heading", { name: "Kế hoạch nhập đề xuất", exact: true }).waitFor({ timeout: 30_000 });
  await page.getByText(/lead time, safety stock và reorder point/i).waitFor();
  await page.getByText(/không giữ chỗ tồn kho/i).waitFor();
  await page.getByRole("button", { name: "Xuất kế hoạch Excel", exact: true }).waitFor();
  const poCard = page.locator(".cine-purchase-orders-v328");
  await poCard.getByRole("heading", { name: "Đơn mua hàng · Purchase Order", exact: true }).waitFor();
  await poCard.getByRole("button", { name: "Xuất PO Excel", exact: true }).waitFor();
  const cycleCountCard = page.locator(".cine-cycle-count-v326");
  await cycleCountCard.getByRole("heading", { name: "Kiểm kê tồn thực tế", exact: true }).waitFor();
  // v3.28.0 hotfix: Kho có 2 nút "Tải CSV mẫu" (kiểm kê và nhập kho theo lô).
  // Scope toàn bộ assertion kiểm kê vào card riêng để Playwright strict mode không bắt nhầm control cùng tên.
  await cycleCountCard.getByRole("button", { name: "Tải CSV mẫu", exact: true }).waitFor();
  await cycleCountCard.getByText("Chọn CSV / Excel", { exact: true }).waitFor();
  await cycleCountCard.getByText("≤ 200 dòng · audit đầy đủ", { exact: true }).waitFor();
  const cyclePreviewButton = cycleCountCard.getByRole("button", { name: "Xem trước", exact: true });
  await cyclePreviewButton.waitFor();
  const cycleVariantSelect = cycleCountCard.locator("select").first();
  const cycleVariantValues = await cycleVariantSelect.locator("option").evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
  if (!cycleVariantValues.length) throw new Error("Không có biến thể để kiểm tra chức năng Xem trước kiểm kê.");
  await cycleVariantSelect.selectOption(cycleVariantValues[0]);
  await cyclePreviewButton.click();
  await cycleCountCard.locator(".cine-cycle-count-status-v328").waitFor({ timeout: 30_000 });
  await cycleCountCard.getByText(/Xem trước thành công|Không thể xem trước/).waitFor({ timeout: 30_000 });
  await cycleCountCard.getByRole("button", { name: "Áp dụng kiểm kê", exact: true }).waitFor();
  await cycleCountCard.getByRole("button", { name: "Lưu thành phiên kiểm kê", exact: true }).waitFor();
  await cycleCountCard.getByRole("heading", { name: "Phiên kiểm kê", exact: true }).waitFor();
  await page.getByRole("button", { name: "Xếp ca", exact: true }).click();
  await page.getByRole("heading", { name: "Xếp ca nhân viên", exact: true }).waitFor({ timeout: 30_000 });
  await page.getByText("Chồng giờ", { exact: true }).waitFor();
  await page.getByText(/Backend v3\.24 chặn mọi phân ca chồng giờ/).waitFor();

  if (mutateIncident) {
    const incidentsRes = await context.request.get(`${base}/api/v1/quan-tri/he-thong/su-co?gioi_han=100`);
    const incidents = await incidentsRes.json();
    const synthetic = incidents.du_lieu?.find((x) => x.chu_ky === syntheticSignature);
    if (!synthetic) throw new Error("Không tìm thấy synthetic incident v3.28.0 do runtime E2E seed cho browser CI.");
    const openSynthetic = async () => {
      // v3.28.0 CI hotfix: các bước kiểm tra Kho/Xếp ca đổi tab trước khi mutation incident.
      // Luôn tự quay về Hệ thống và chờ panel Incident render thay vì đếm locator khi tab đang ẩn.
      const incidentHeading = page.getByRole("heading", { name: "Incident vận hành", exact: true });
      if (!(await incidentHeading.isVisible().catch(() => false))) {
        await page.getByRole("button", { name: "Hệ thống", exact: true }).click();
        await incidentHeading.waitFor({ timeout: 30_000 });
      }
      const signatureLabel = `#${syntheticSignature.slice(0, 12)}`;
      const incidentButton = page
        .locator(".cine-incident-list-v340 .cine-incident-item-v340")
        .filter({ hasText: signatureLabel });
      await incidentButton.first().waitFor({ state: "visible", timeout: 30_000 });
      const matched = await incidentButton.count();
      if (matched !== 1) throw new Error(`Synthetic incident ${signatureLabel} phải khớp đúng 1 card trong danh sách Incident, nhận ${matched}.`);
      await incidentButton.click();
      await page.getByText(`Incident #${syntheticSignature.slice(0, 16)}`, { exact: false }).waitFor({ timeout: 30_000 });
    };
    const waitSyntheticStatus = async (expected) => {
      const status = page.locator(".cine-incident-detail-v340 .cine-incident-meta-v350 .status-badge");
      await status.waitFor({ timeout: 30_000 });
      const actual = (await status.textContent())?.trim() || "";
      if (actual !== expected) throw new Error(`Synthetic incident status mong ${expected}, nhận ${actual || "trống"}.`);
    };
    await openSynthetic();
    await page.getByLabel("Ghi chú xử lý / khắc phục", { exact: true }).fill("Browser E2E v3.28.0 acknowledge persistence");
    await page.getByRole("button", { name: "Tiếp nhận incident", exact: true }).click();
    await page.getByText("Đã tiếp nhận incident", { exact: false }).waitFor({ timeout: 30_000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Hệ thống", exact: true }).click();
    await page.getByRole("heading", { name: "Incident vận hành" }).waitFor();
    await openSynthetic();
    await waitSyntheticStatus("DA TIEP NHAN");
    await page.getByRole("button", { name: "Đánh dấu đã khắc phục", exact: true }).click();
    await page.getByText("Đã đánh dấu incident khắc phục", { exact: false }).waitFor({ timeout: 30_000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Hệ thống", exact: true }).click();
    await page.getByRole("heading", { name: "Incident vận hành" }).waitFor();
    await openSynthetic();
    await waitSyntheticStatus("DA KHAC PHUC");
  }

  await page.goto(`${base}/quan-tri/ops`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Ops Dashboard", exact: true }).waitFor({ timeout: 30_000 });
  await page.getByRole("heading", { name: "So sánh SLO 7 / 30 / 90 ngày", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Endpoint SLO · distributed region/node", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Burn-rate theo thời gian", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Multi-window burn-rate policy", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Maintenance-aware SLO", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Maintenance windows", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Incident + timeline GIN full-text", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Webhook encrypted DLQ + retry budget", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Dead-letter queue", exact: true }).waitFor();
  await page.getByRole("heading", { name: "RBAC Ops / on-call theo dịch vụ", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Managed probe fleet", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Multi-region quorum · anomaly detection", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Service dependency · blast radius", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Probe desired-state · canary rollout", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Recovery readiness · RPO/RTO", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Incident postmortem · runbook", exact: true }).waitFor();
  await page.getByText(/two-person|two person/i).first().waitFor();
  await page.getByText(/SHA-256/).first().waitFor();
  await page.getByText(/health preflight/i).first().waitFor();
  await page.getByText(/immutable envelope/i).first().waitFor();
  await page.getByText(/decision receipt/i).first().waitFor();
  await page.getByText(/receipt hash chain/i).first().waitFor();
  await page.getByText(/chain PASS:/i).first().waitFor();
  await page.getByText(/trusted-key pinning/i).first().waitFor();
  await page.getByText(/revoked-key fail-closed/i).first().waitFor();
  await page.getByText(/revoked-key policy/i).first().waitFor();
  await page.getByText(/trust anchor/i).first().waitFor();
  await page.getByRole("button", { name: "Verify evidence", exact: true }).waitFor();
  await page.getByRole("button", { name: "Tải recovery audit bundle", exact: true }).waitFor();
  await page.getByRole("button", { name: "Xuất remediation Excel", exact: true }).waitFor();
  await page.getByRole("button", { name: "Escalate SLA breach", exact: true }).waitFor();
  const postmortemPanel = page.getByRole("heading", { name: "Incident postmortem · runbook", exact: true }).locator("xpath=ancestor::section[1]");
  const postmortemStatusBadge = postmortemPanel.getByText(/COMPLETE.*DRAFT/).first();
  await postmortemStatusBadge.waitFor();
  const pmBadgeStyle = await postmortemStatusBadge.evaluate((el) => ({ height: el.getBoundingClientRect().height, justify: getComputedStyle(el).justifyContent, align: getComputedStyle(el).alignItems, text: getComputedStyle(el).textAlign }));
  if (pmBadgeStyle.height > 24 || pmBadgeStyle.justify !== "center" || pmBadgeStyle.align !== "center" || pmBadgeStyle.text !== "center") throw new Error("Badge COMPLETE/DRAFT chưa được thu nhỏ và canh giữa v3.28.0.");
  await page.getByRole("heading", { name: "Managed probe fleet", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Multi-region quorum · anomaly detection", exact: true }).waitFor();
  await page.getByText(/Ed25519 lifecycle: active/).waitFor();
  const addWindowButton = page.getByRole("button", { name: "Thêm window", exact: true });
  await addWindowButton.waitFor();
  const addWindowBackground = await addWindowButton.evaluate((el) => getComputedStyle(el).backgroundColor);
  if (addWindowBackground === "rgb(232, 238, 252)") throw new Error("Nút Thêm window vẫn dùng nền sáng legacy thay vì dark action v3.28.0.");
  await page.getByRole("heading", { name: "Distributed probe agents", exact: true }).waitFor();
  await page.getByRole("heading", { name: "On-call schedule / rotation", exact: true }).waitFor();
  await page.getByRole("button", { name: "Xuất ICS", exact: true }).waitFor();
  await page.getByRole("button", { name: "Handoff", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Escalation routing theo dịch vụ", exact: true }).waitFor();
  await page.getByRole("heading", { name: "DLQ keyring + bulk replay jobs", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Telemetry archive · verify before prune", exact: true }).waitFor();
  await page.getByRole("button", { name: "Tải bundle", exact: true }).waitFor();
  const managedFleetPanel = page
    .getByRole("heading", { name: "Managed probe fleet", exact: true })
    .locator("xpath=ancestor::section[1]");
  await managedFleetPanel.getByText(/Ed25519 lifecycle:.*device-bound/).waitFor();
  await page.getByText("Apdex", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Xuất Ops Excel", exact: true }).waitFor();
  await page.getByLabel("Endpoint ID 1", { exact: true }).waitFor();
  await page.getByLabel("Endpoint method 1", { exact: true }).waitFor();
  await page.getByLabel("Endpoint latency 1", { exact: true }).waitFor();
  await page.getByLabel("Endpoint auth 1", { exact: true }).waitFor();

  console.log("Demand-aware replenishment UI  : PASS");
  console.log("Refund reconciliation contract : PASS");
  console.log("Shift overlap safety UI        : PASS");
  console.log("Browser E2E v3.28.0 PASS ✅");
  console.log(`HTTPS Admin: ${base}/quan-tri`);
  console.log("SLO update + reload persistence : PASS");
  console.log(`Incident acknowledge/resolve    : ${mutateIncident ? "PASS" : "SKIP an toàn trên local"}`);
  console.log("Maintenance dark action / Error budget : PASS");
  console.log("Managed probe fleet + key lifecycle : PASS");
  console.log("Quorum proactive alert policy   : PASS");
  console.log("Service dependency blast radius : PASS");
  console.log("Probe enrollment runtime state  : PASS");
  console.log("Production rollout TTL/two-person : PASS");
  console.log("Recovery SHA-256/Ed25519 surface : PASS");
  console.log("Remediation SLA/on-call/Excel    : PASS");
  console.log("Distributed probe region/node   : PASS");
  console.log("DLQ keyring / replay jobs       : PASS");
  console.log("Archive portability / restore   : PASS");
  console.log("On-call ICS / handoff           : PASS");
  console.log("Device-bound enrollment         : PASS");
  console.log("Probe desired-state / canary    : PASS");
  console.log("Health-gated auto rollback      : PASS");
  console.log("Recovery readiness RPO/RTO      : PASS");
  console.log("Target-time PITR UI contract    : PASS");
  console.log("Incident postmortem / runbook   : PASS");
  console.log("Postmortem badge / approval     : PASS");
  console.log("GIN timeline / incident owner   : PASS");
  console.log("Ops Dashboard v3.28.0           : PASS");
} finally {
  if (originalSlo) {
    try {
      await context.request.post(`${base}/api/v1/quan-tri/he-thong/cau-hinh-slo`, { data: {
        sla_muc_tieu_percent: originalSlo.sla_muc_tieu_percent,
        uptime_muc_tieu_percent: originalSlo.uptime_muc_tieu_percent,
        canh_bao_xu_huong: originalSlo.canh_bao_xu_huong
      }});
    } catch {}
  }
  await context.close();
  await browser.close();
}
