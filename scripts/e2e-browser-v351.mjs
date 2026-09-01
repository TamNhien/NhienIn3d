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

const port = env("WEB_PORT", "3000");
const base = env("E2E_WEB_URL", `https://localhost:${port}`);
const email = env("ADMIN_EMAIL", "admin@nhienin3d.local");
const password = env("ADMIN_PASSWORD");
if (!password) throw new Error("Thiếu ADMIN_PASSWORD trong biến môi trường hoặc file .env để chạy browser E2E v3.5.1");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
try {
  const healthResponse = await context.request.get(`${base}/api/v1/suc-khoe`);
  if (!healthResponse.ok()) throw new Error(`Health API qua HTTPS trả ${healthResponse.status()}.`);
  const health = await healthResponse.json();
  if (health.phien_ban !== "v3.5.1") {
    throw new Error(`API đang chạy ${health.phien_ban || "không rõ version"}, không phải v3.5.1. Docker có thể vẫn dùng container/image cũ sau một lần build thất bại.`);
  }

  await page.goto(`${base}/dang-nhap?chuyen_den=/quan-tri`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/quan-tri(?:\?|$)/, { timeout: 30_000 });
  await page.getByRole("heading", { name: "Admin Dashboard" }).waitFor({ timeout: 30_000 });

  await page.getByRole("button", { name: "Hệ thống", exact: true }).click();
  await page.getByRole("heading", { name: "Mục tiêu SLO vận hành" }).waitFor({ timeout: 30_000 });
  await page.getByRole("heading", { name: "Incident vận hành" }).waitFor();
  await page.getByText("SLA mục tiêu (%)", { exact: true }).waitFor();
  await page.getByText("Uptime mục tiêu (%)", { exact: true }).waitFor();

  const body = await page.locator("body").innerText();
  if (!body.includes("SLA / Uptime theo ngày")) throw new Error("Không thấy khối SLA/Uptime trên UI Admin");
  console.log("Browser E2E v3.5.1 PASS ✅");
  console.log(`HTTPS Admin: ${base}/quan-tri`);
  console.log("Login / SLO / Incident UI: PASS");
} finally {
  await context.close();
  await browser.close();
}
