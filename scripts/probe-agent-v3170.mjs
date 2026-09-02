import { createHash, createHmac, createPublicKey, randomBytes, sign as signPayload, verify as verifyPayload } from "node:crypto";
import { readFileSync } from "node:fs";
import os from "node:os";

const API = (process.env.NH3D_PROBE_API_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");
const agentId = process.env.NH3D_PROBE_AGENT_ID || process.env.SYSTEM_SLO_PROBE_AGENT_ID || "agent-local";
const region = process.env.NH3D_PROBE_REGION || process.env.SYSTEM_SLO_PROBE_REGION || "local";
const nodeName = process.env.NH3D_PROBE_NODE || process.env.SYSTEM_SLO_PROBE_NODE || os.hostname();
const version = "3.17.0";
const secret = process.env.NH3D_PROBE_AGENT_SECRET || process.env.SYSTEM_SLO_AGENT_SHARED_SECRET || "";
const privateKeyInline = process.env.NH3D_PROBE_AGENT_PRIVATE_KEY?.trim() || "";
const privateKeyFile = process.env.NH3D_PROBE_AGENT_PRIVATE_KEY_FILE?.trim() || "";
const deviceId = process.env.NH3D_PROBE_DEVICE_ID?.trim() || "";
const desiredPublicKeyInline = process.env.NH3D_PROBE_DESIRED_STATE_PUBLIC_KEY?.trim() || "";
const desiredPublicKeyFile = process.env.NH3D_PROBE_DESIRED_STATE_PUBLIC_KEY_FILE?.trim() || "";
const desiredMaxAgeSeconds = Math.max(60, Math.min(3600, Number.parseInt(process.env.NH3D_PROBE_DESIRED_STATE_MAX_AGE_SECONDS || "600", 10) || 600));
let intervalSeconds = Math.max(30, Number.parseInt(process.env.NH3D_PROBE_INTERVAL_SECONDS || "300", 10) || 300);
let appliedDesiredStateRevision = 0;

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

function desiredStatePublicKey() {
  if (desiredPublicKeyInline) return desiredPublicKeyInline.replace(/\\n/g, "\n");
  if (desiredPublicKeyFile) return readFileSync(desiredPublicKeyFile, "utf8");
  return "";
}

function verifyDesiredState(desired) {
  const integrity = desired?.integrity;
  if (!integrity || integrity.algorithm !== "ED25519" || !integrity.signature_base64 || !integrity.signed_at) return { ok: false, reason: "unsigned" };
  const publicKeyPem = desiredStatePublicKey();
  if (!publicKeyPem) return { ok: false, reason: "missing-public-key" };
  const signedAtMs = Date.parse(String(integrity.signed_at));
  if (!Number.isFinite(signedAtMs) || Math.abs(Date.now() - signedAtMs) > desiredMaxAgeSeconds * 1000) return { ok: false, reason: "stale-signature" };
  try {
    const publicKey = createPublicKey(publicKeyPem);
    const fingerprint = createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
    if (integrity.public_key_fingerprint && integrity.public_key_fingerprint !== fingerprint) return { ok: false, reason: "fingerprint-mismatch" };
    const { integrity: _integrity, ...payload } = desired;
    const canonical = stableJson({ agent_id: agentId, signed_at: integrity.signed_at, desired_state: payload });
    const ok = verifyPayload(null, Buffer.from(canonical, "utf8"), publicKey, Buffer.from(String(integrity.signature_base64), "base64"));
    return { ok, reason: ok ? "verified" : "bad-signature" };
  } catch (error) {
    return { ok: false, reason: `verify-error:${error instanceof Error ? error.message : String(error)}` };
  }
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
      ...(deviceId ? { "x-nhienin3d-device-id": deviceId } : {}),
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
    ...(deviceId ? { "x-nhienin3d-device-id": deviceId } : {}),
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
  const base = { agent_id: agentId, region, node_name: nodeName, phien_ban: version, metadata: { hostname: os.hostname(), platform: process.platform, node: process.version, auth, device_bound: !!deviceId } };
  const heartbeat = await post("/probe-agent/heartbeat", base);
  const desired = heartbeat?.desired_state;
  if (desired?.apply === true && Number.isFinite(Number(desired.interval_seconds))) {
    const verified = verifyDesiredState(desired);
    const revision = Number(desired.revision || 0);
    if (!verified.ok) {
      console.warn(`[probe-agent] desired-state HOLD: signature ${verified.reason}; remote-code-execution=OFF`);
    } else if (revision < appliedDesiredStateRevision) {
      console.warn(`[probe-agent] desired-state HOLD: stale revision ${revision} < ${appliedDesiredStateRevision}; remote-code-execution=OFF`);
    } else {
      intervalSeconds = Math.max(30, Math.min(3600, Math.floor(Number(desired.interval_seconds))));
      appliedDesiredStateRevision = revision;
      console.log(`[probe-agent] desired-state revision ${appliedDesiredStateRevision} signature=VERIFIED action=${desired.action || "SYNC_CONFIG"} target=${desired.target_version || version} interval=${intervalSeconds}s; remote-code-execution=OFF`);
    }
  } else if (desired?.action === "SIGNING_REQUIRED") {
    console.warn("[probe-agent] desired-state HOLD: server signing key chưa được cấu hình; remote-code-execution=OFF");
  }
  const samples = await Promise.all(endpoints().map(probe));
  const result = await post("/probe-agent/ingest", { ...base, metadata: { ...base.metadata, desired_state_revision: appliedDesiredStateRevision }, samples });
  console.log(`[probe-agent] ${new Date().toISOString()} ${agentId}@${region}/${nodeName} ${auth}: ${result.so_mau ?? samples.length} sample(s) accepted`);
}

await cycle();
if (!process.argv.includes("--once")) {
  for (;;) {
    await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
    await cycle().catch(error => console.error(`[probe-agent] ${error instanceof Error ? error.message : String(error)}`));
  }
}
