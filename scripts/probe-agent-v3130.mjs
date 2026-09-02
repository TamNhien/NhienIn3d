import { createHmac, randomBytes, sign as signPayload } from "node:crypto";
import { readFileSync } from "node:fs";
import os from "node:os";

const API = (process.env.NH3D_PROBE_API_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");
const agentId = process.env.NH3D_PROBE_AGENT_ID || process.env.SYSTEM_SLO_PROBE_AGENT_ID || "agent-local";
const region = process.env.NH3D_PROBE_REGION || process.env.SYSTEM_SLO_PROBE_REGION || "local";
const nodeName = process.env.NH3D_PROBE_NODE || process.env.SYSTEM_SLO_PROBE_NODE || os.hostname();
const version = "3.13.0";
const secret = process.env.NH3D_PROBE_AGENT_SECRET || process.env.SYSTEM_SLO_AGENT_SHARED_SECRET || "";
const privateKeyInline = process.env.NH3D_PROBE_AGENT_PRIVATE_KEY?.trim() || "";
const privateKeyFile = process.env.NH3D_PROBE_AGENT_PRIVATE_KEY_FILE?.trim() || "";
const intervalSeconds = Math.max(30, Number.parseInt(process.env.NH3D_PROBE_INTERVAL_SECONDS || "300", 10) || 300);

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
}

function privateKey() {
  if (privateKeyInline) return privateKeyInline.replace(/\\n/g, "\n");
  if (privateKeyFile) return readFileSync(privateKeyFile, "utf8");
  return "";
}

function signedHeaders(body) {
  const timestamp = String(Date.now());
  const nonce = randomBytes(16).toString("hex");
  const canonical = `${agentId}\n${timestamp}\n${nonce}\n${stableJson(body)}`;
  const key = privateKey();
  if (key) {
    const signature = signPayload(null, Buffer.from(canonical, "utf8"), key).toString("base64");
    return {
      "content-type": "application/json",
      "x-nhienin3d-agent": agentId,
      "x-nhienin3d-timestamp": timestamp,
      "x-nhienin3d-nonce": nonce,
      "x-nhienin3d-signature": signature,
      "x-nhienin3d-signature-alg": "ED25519",
    };
  }
  if (secret.length < 16) throw new Error("Cần NH3D_PROBE_AGENT_SECRET >=16 ký tự hoặc NH3D_PROBE_AGENT_PRIVATE_KEY[_FILE] cho Ed25519.");
  const signature = createHmac("sha256", secret).update(canonical).digest("hex");
  return {
    "content-type": "application/json",
    "x-nhienin3d-agent": agentId,
    "x-nhienin3d-timestamp": timestamp,
    "x-nhienin3d-nonce": nonce,
    "x-nhienin3d-signature": signature,
    "x-nhienin3d-signature-alg": "HMAC-SHA256",
  };
}

async function post(path, body) {
  const response = await fetch(`${API}${path}`, { method: "POST", headers: signedHeaders(body), body: JSON.stringify(body) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} HTTP ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

function endpoints() {
  const raw = process.env.NH3D_PROBE_ENDPOINTS_JSON?.trim();
  if (!raw) return [{ endpoint_id: "public-health", url: `${API}/suc-khoe`, method: "GET", latency_target_ms: 1000, timeout_ms: 5000 }];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.length) throw new Error("NH3D_PROBE_ENDPOINTS_JSON phải là JSON array không rỗng.");
  return parsed.map((item, index) => ({
    endpoint_id: String(item.endpoint_id || `endpoint-${index + 1}`),
    url: String(item.url || ""),
    method: String(item.method || "GET").toUpperCase() === "HEAD" ? "HEAD" : "GET",
    latency_target_ms: Math.max(1, Number(item.latency_target_ms || 1000)),
    timeout_ms: Math.max(100, Number(item.timeout_ms || 5000)),
  }));
}

async function probe(item) {
  const started = performance.now();
  let status = 0;
  let state = "LOI";
  try {
    const timeoutMs = Math.max(100, Number(item.timeout_ms || 5000));
    const response = await fetch(item.url, { method: item.method, signal: AbortSignal.timeout(timeoutMs) });
    status = response.status;
    state = response.ok ? "TOT" : response.status >= 500 ? "LOI" : "CANH_BAO";
  } catch (error) {
    state = "LOI";
    console.error(`[probe-agent] probe ${item.endpoint_id} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  return {
    endpoint_id: item.endpoint_id,
    trang_thai: state,
    ...(status ? { http_status: status } : {}),
    do_tre_ms: Math.round((performance.now() - started) * 10) / 10,
    latency_target_ms: item.latency_target_ms,
    observed_at: new Date().toISOString(),
  };
}

async function cycle() {
  const key = privateKey();
  const auth = key ? "ED25519" : "HMAC-SHA256";
  const base = { agent_id: agentId, region, node_name: nodeName, phien_ban: version, metadata: { hostname: os.hostname(), platform: process.platform, node: process.version, auth } };
  await post("/probe-agent/heartbeat", base);
  const samples = await Promise.all(endpoints().map(probe));
  const result = await post("/probe-agent/ingest", { ...base, samples });
  console.log(`[probe-agent] ${new Date().toISOString()} ${agentId}@${region}/${nodeName} ${auth}: ${result.so_mau ?? samples.length} sample(s) accepted`);
}

await cycle();
if (!process.argv.includes("--once")) setInterval(() => void cycle().catch(error => console.error(`[probe-agent] ${error instanceof Error ? error.message : String(error)}`)), intervalSeconds * 1000);
