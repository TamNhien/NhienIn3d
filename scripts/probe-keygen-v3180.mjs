import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const agentId = process.argv[2] || "agent-local";
if (!/^[A-Za-z0-9._-]{2,80}$/.test(agentId)) throw new Error("agent_id không hợp lệ");
const outDir = resolve(process.argv[3] || "./.probe-keys");
mkdirSync(outDir, { recursive: true });
const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const privatePath = resolve(outDir, `${agentId}.private.pem`);
const publicPath = resolve(outDir, `${agentId}.public.pem`);
writeFileSync(privatePath, privateKey, { mode: 0o600 });
writeFileSync(publicPath, publicKey, { mode: 0o644 });
const envName = `NH3D_PROBE_PUBLIC_KEY_${agentId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
console.log(`[probe-keygen v3.18.0] ${agentId}`);
console.log(`Private key: ${privatePath}`);
console.log(`Public key : ${publicPath}`);
console.log(`Agent env  : NH3D_PROBE_AGENT_PRIVATE_KEY_FILE=${privatePath}`);
console.log(`Server env : ${envName}=<nội dung PEM public key>`);
console.log(`Keyring ref: SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON={\"${agentId}\":\"\${ENV:${envName}}\"}`);
console.log("Không commit private key vào Git.");
