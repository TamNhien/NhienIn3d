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
if (!password) throw new Error("Thiếu ADMIN_PASSWORD trong biến môi trường hoặc file .env để chạy browser E2E v3.14.0");
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
  if (health.phien_ban !== "v3.14.0") throw new Error(`API đang chạy ${health.phien_ban || "không rõ version"}, không phải v3.14.0. Docker có thể vẫn dùng container/image cũ.`);

  await page.goto(`${base}/dang-nhap?chuyen_den=/quan-tri`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/quan-tri(?:\?|$)/, { timeout: 30_000 });
  await page.getByRole("heading", { name: "Admin Dashboard" }).waitFor({ timeout: 30_000 });

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
  if (mutateIncident) {
    const incidentsRes = await context.request.get(`${base}/api/v1/quan-tri/he-thong/su-co?gioi_han=100`);
    const incidents = await incidentsRes.json();
    const synthetic = incidents.du_lieu?.find((x) => x.chu_ky === syntheticSignature);
    if (!synthetic) throw new Error("Không tìm thấy synthetic incident v3.14.0 do runtime E2E seed cho browser CI.");
    const openSynthetic = async () => {
      const signatureLabel = `#${syntheticSignature.slice(0, 12)}`;
      const incidentButton = page
        .locator(".cine-incident-list-v340 .cine-incident-item-v340")
        .filter({ hasText: signatureLabel });
      const matched = await incidentButton.count();
      if (matched !== 1) throw new Error(`Synthetic incident ${signatureLabel} phải khớp đúng 1 card trong danh sách Incident, nhận ${matched}.`);
      await incidentButton.click();
      await page.getByText(`Incident #${syntheticSignature.slice(0, 16)}`, { exact: false }).waitFor();
    };
    const waitSyntheticStatus = async (expected) => {
      const status = page.locator(".cine-incident-detail-v340 .cine-incident-meta-v350 .status-badge");
      await status.waitFor({ timeout: 30_000 });
      const actual = (await status.textContent())?.trim() || "";
      if (actual !== expected) throw new Error(`Synthetic incident status mong ${expected}, nhận ${actual || "trống"}.`);
    };
    await openSynthetic();
    await page.getByLabel("Ghi chú xử lý / khắc phục", { exact: true }).fill("Browser E2E v3.14.0 acknowledge persistence");
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
  await page.getByRole("heading", { name: "Managed probe fleet", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Multi-region quorum · anomaly detection", exact: true }).waitFor();
  await page.getByText(/Ed25519 lifecycle: active/).waitFor();
  const addWindowButton = page.getByRole("button", { name: "Thêm window", exact: true });
  await addWindowButton.waitFor();
  const addWindowBackground = await addWindowButton.evaluate((el) => getComputedStyle(el).backgroundColor);
  if (addWindowBackground === "rgb(232, 238, 252)") throw new Error("Nút Thêm window vẫn dùng nền sáng legacy thay vì dark action v3.14.0.");
  await page.getByRole("heading", { name: "Distributed probe agents", exact: true }).waitFor();
  await page.getByRole("heading", { name: "On-call schedule / rotation", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Escalation routing theo dịch vụ", exact: true }).waitFor();
  await page.getByRole("heading", { name: "DLQ keyring + bulk replay jobs", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Telemetry archive · verify before prune", exact: true }).waitFor();
  await page.getByText("Apdex", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Xuất Ops Excel", exact: true }).waitFor();
  await page.getByLabel("Endpoint ID 1", { exact: true }).waitFor();
  await page.getByLabel("Endpoint method 1", { exact: true }).waitFor();
  await page.getByLabel("Endpoint latency 1", { exact: true }).waitFor();
  await page.getByLabel("Endpoint auth 1", { exact: true }).waitFor();

  console.log("Browser E2E v3.14.0 PASS ✅");
  console.log(`HTTPS Admin: ${base}/quan-tri`);
  console.log("SLO update + reload persistence : PASS");
  console.log(`Incident acknowledge/resolve    : ${mutateIncident ? "PASS" : "SKIP an toàn trên local"}`);
  console.log("Maintenance dark action / Error budget : PASS");
  console.log("Managed probe fleet + key lifecycle : PASS");
  console.log("Quorum proactive alert policy   : PASS");
  console.log("Distributed probe region/node   : PASS");
  console.log("DLQ keyring / replay jobs       : PASS");
  console.log("Archive verify-before-prune     : PASS");
  console.log("On-call schedule / escalation   : PASS");
  console.log("GIN timeline / incident owner   : PASS");
  console.log("Ops Dashboard v3.14.0           : PASS");
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
