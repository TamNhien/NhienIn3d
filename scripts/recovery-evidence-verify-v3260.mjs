import { createHash, createPrivateKey, createPublicKey, timingSafeEqual, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const loadProjectEnv = async () => {
  try {
    const raw = await readFile(join(root, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index <= 0) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch {}
};
await loadProjectEnv();

const parseBool = (value, fallback = true) => value == null || value === "" ? fallback : !["0", "false", "no", "off"].includes(String(value).trim().toLowerCase());
const trusted = new Map();
const addTrusted = (keyIdRaw, fingerprintRaw, source) => {
  const keyId = String(keyIdRaw || "").trim().slice(0, 80);
  const fingerprint = String(fingerprintRaw || "").trim().toLowerCase();
  if (!keyId || !/^[a-f0-9]{64}$/.test(fingerprint)) return;
  if (!trusted.has(keyId)) trusted.set(keyId, new Map());
  trusted.get(keyId).set(fingerprint, source);
};
try {
  const parsed = JSON.parse((process.env.SYSTEM_RECOVERY_EVIDENCE_TRUSTED_KEYS_JSON || "{}").trim() || "{}");
  for (const [keyId, value] of Object.entries(parsed)) {
    if (Array.isArray(value)) for (const fp of value) addTrusted(keyId, fp, "TRUST_STORE");
    else addTrusted(keyId, value, "TRUST_STORE");
  }
} catch { throw new Error("SYSTEM_RECOVERY_EVIDENCE_TRUSTED_KEYS_JSON không phải JSON hợp lệ."); }
const privateB64 = (process.env.SYSTEM_RECOVERY_EVIDENCE_ED25519_PRIVATE_KEY_B64 || "").trim();
if (privateB64) {
  const privateKey = createPrivateKey(Buffer.from(privateB64, "base64").toString("utf8"));
  const publicPem = createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
  const fingerprint = createHash("sha256").update(publicPem, "utf8").digest("hex");
  addTrusted(process.env.SYSTEM_RECOVERY_EVIDENCE_ED25519_KEY_ID || "recovery-audit-v1", fingerprint, "CURRENT_SIGNING_KEY");
}
const revoked = new Map();
const addRevoked = (keyIdRaw, fingerprintRaw) => {
  const keyId = String(keyIdRaw || "").trim().slice(0, 80);
  const fingerprint = String(fingerprintRaw || "").trim().toLowerCase();
  if (!keyId || !/^[a-f0-9]{64}$/.test(fingerprint)) return;
  if (!revoked.has(keyId)) revoked.set(keyId, new Set());
  revoked.get(keyId).add(fingerprint);
};
try {
  const parsed = JSON.parse((process.env.SYSTEM_RECOVERY_EVIDENCE_REVOKED_KEYS_JSON || "{}").trim() || "{}");
  for (const [keyId, value] of Object.entries(parsed)) {
    if (Array.isArray(value)) for (const fp of value) addRevoked(keyId, fp);
    else addRevoked(keyId, value);
  }
} catch { throw new Error("SYSTEM_RECOVERY_EVIDENCE_REVOKED_KEYS_JSON không phải JSON hợp lệ."); }
const requireTrusted = parseBool(process.env.SYSTEM_RECOVERY_EVIDENCE_REQUIRE_TRUSTED_KEY, true);

const defaultFile = resolve(process.env.SYSTEM_BACKUP_DIR || join(root, "backups"), "recovery-evidence-bundle-v3260.json");
const file = process.argv[2] ? resolve(process.argv[2]) : defaultFile;
const bundle = JSON.parse(await readFile(file, "utf8"));
const evidence = bundle?.evidence;
if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) throw new Error("Bundle thiếu evidence object.");
const evidenceRaw = JSON.stringify(evidence, null, 2) + "\n";
const calculatedSha = createHash("sha256").update(evidenceRaw, "utf8").digest("hex");
const storedSha = String(bundle?.integrity?.sha256 || "").trim().toLowerCase();
const shaValid = /^[a-f0-9]{64}$/.test(storedSha) && timingSafeEqual(Buffer.from(calculatedSha, "hex"), Buffer.from(storedSha, "hex"));
if (!shaValid) throw new Error(`SHA-256 mismatch: stored=${storedSha || "missing"} calculated=${calculatedSha}`);

const sig = bundle?.signature || {};
let trustSource = "N/A";
if (sig.configured === true) {
  const publicPem = String(sig.public_key_pem || "");
  const signatureB64 = String(sig.signature_base64 || "");
  const keyId = String(sig.key_id || "").trim().slice(0, 80);
  const storedFingerprint = String(sig.public_key_fingerprint_sha256 || "").trim().toLowerCase();
  const calculatedFingerprint = createHash("sha256").update(publicPem, "utf8").digest("hex");
  const fingerprintValid = /^[a-f0-9]{64}$/.test(storedFingerprint) && timingSafeEqual(Buffer.from(calculatedFingerprint, "hex"), Buffer.from(storedFingerprint, "hex"));
  if (!fingerprintValid) throw new Error(`Public key fingerprint mismatch: stored=${storedFingerprint || "missing"} calculated=${calculatedFingerprint}`);
  const publicKey = createPublicKey(publicPem);
  const signatureValid = verify(null, Buffer.from(evidenceRaw, "utf8"), publicKey, Buffer.from(signatureB64, "base64"));
  if (!signatureValid) throw new Error("Ed25519 signature invalid.");
  const keyRevoked = revoked.get(keyId)?.has(storedFingerprint) || revoked.get("*")?.has(storedFingerprint) || false;
  if (keyRevoked) throw new Error(`Revoked signing key: key_id=${keyId || "missing"} fingerprint=${storedFingerprint || "missing"}. Hãy rotate sang key mới và chỉ giữ key cũ trong trust store khi chưa bị revoke.`);
  const source = trusted.get(keyId)?.get(storedFingerprint) || null;
  if (requireTrusted && !source) throw new Error(`Untrusted signing key: key_id=${keyId || "missing"} fingerprint=${storedFingerprint || "missing"}. Hãy giữ private key hiện tại hoặc thêm fingerprint public vào SYSTEM_RECOVERY_EVIDENCE_TRUSTED_KEYS_JSON khi rotate key.`);
  trustSource = source || "NOT_REQUIRED";
}

console.log(`Recovery evidence file : ${file}`);
console.log(`SHA-256                : PASS ✅ ${calculatedSha}`);
console.log(`Ed25519                : ${sig.configured === true ? "VERIFIED ✅" : "OPTIONAL (not configured)"}`);
console.log(`Public fingerprint     : ${sig.configured === true ? "PASS ✅" : "N/A"}`);
console.log(`Trust anchor           : ${sig.configured === true ? `${trustSource} ✅` : "N/A"}`);
console.log(`Trusted-key required   : ${requireTrusted ? "YES" : "NO"}`);
console.log(`Revoked-key policy     : PASS ✅ (${[...revoked.values()].reduce((n, set) => n + set.size, 0)} fingerprint(s))`);
console.log("Recovery evidence v3.26.0 verification PASS ✅");
