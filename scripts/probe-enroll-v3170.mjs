import { readFileSync } from "node:fs";
import os from "node:os";

const API = (process.env.NH3D_PROBE_API_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");
const token = process.env.NH3D_PROBE_ENROLLMENT_TOKEN?.trim() || "";
const agentId = process.env.NH3D_PROBE_AGENT_ID?.trim() || "agent-local";
const region = process.env.NH3D_PROBE_REGION?.trim() || "local";
const nodeName = process.env.NH3D_PROBE_NODE?.trim() || os.hostname();
const keyId = process.env.NH3D_PROBE_AGENT_KEY_ID?.trim() || `${agentId}-ed25519`;
const publicKeyFile = process.env.NH3D_PROBE_AGENT_PUBLIC_KEY_FILE?.trim() || `./.probe-keys/${agentId}.public.pem`;
const deviceId = process.env.NH3D_PROBE_DEVICE_ID?.trim() || "";
if (!token) throw new Error("Thiếu NH3D_PROBE_ENROLLMENT_TOKEN.");
if (!/^[A-Za-z0-9._-]{2,80}$/.test(agentId)) throw new Error("NH3D_PROBE_AGENT_ID không hợp lệ.");
if (!/^[A-Za-z0-9._-]{1,80}$/.test(keyId)) throw new Error("NH3D_PROBE_AGENT_KEY_ID không hợp lệ.");
const publicKey = readFileSync(publicKeyFile, "utf8").trim();
if (!publicKey.includes("BEGIN PUBLIC KEY")) throw new Error("Public key file không phải PEM public key.");

const response = await fetch(`${API}/probe-agent/enroll`, {
  method: "POST",
  headers: { "content-type": "application/json", ...(deviceId ? { "x-nhienin3d-device-id": deviceId } : {}) },
  body: JSON.stringify({ token, agent_id: agentId, region, node_name: nodeName, key_id: keyId, public_key: publicKey }),
});
const text = await response.text();
if (!response.ok) throw new Error(`Enroll HTTP ${response.status}: ${text.slice(0, 600)}`);
const result = text ? JSON.parse(text) : {};
console.log(`[probe-enroll v3.17.0] ${agentId}@${region}/${nodeName}: enrolled`);
console.log(`Key ID   : ${result.key_id || keyId}`);
console.log(`Protocol : ${result.protocol || "ED25519-ENROLL-v3170"}`);
console.log(`Device   : ${result.device_bound ? "BOUND" : "OPTIONAL"}`);
console.log("Enrollment token đã dùng xong; không ghi token/private key ra log.");
