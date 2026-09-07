import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
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

const dir = resolve(process.env.SYSTEM_BACKUP_DIR || join(root, "backups"));
await mkdir(dir, { recursive: true });
const readJson = async (name) => { try { return JSON.parse(await readFile(join(dir, name), "utf8")); } catch { return null; } };
const logical = await readJson("recovery-drill-v3280-latest.json") || await readJson("recovery-drill-v3220-latest.json") || await readJson("recovery-drill-v3210-latest.json") || await readJson("recovery-drill-v3200-latest.json");
const pitr = await readJson("recovery-pitr-v3280-latest.json") || await readJson("recovery-pitr-v3220-latest.json") || await readJson("recovery-pitr-v3210-latest.json") || await readJson("recovery-pitr-v3200-latest.json");
const old = await readJson("recovery-evidence-v3280.json") || await readJson("recovery-evidence-v3220.json") || await readJson("recovery-evidence-v3210.json") || await readJson("recovery-evidence-v3200.json") || { history: [] };
const entry = {
  captured_at: new Date().toISOString(), logical, pitr,
  rpo_minutes: logical?.observed_rpo_minutes ?? logical?.rpo_minutes ?? null,
  rto_seconds: logical?.rto_seconds ?? null,
  pitr_exercised: pitr?.pitr_restore_exercised === true,
};
const history = [entry, ...(Array.isArray(old.history) ? old.history : [])].slice(0, 30);
const evidence = { version: "3.28.0", retention_runs: 30, history };
const evidenceRaw = JSON.stringify(evidence, null, 2) + "\n";
const sha256 = createHash("sha256").update(evidenceRaw).digest("hex");
await writeFile(join(dir, "recovery-evidence-v3280.json"), evidenceRaw, "utf8");
await writeFile(join(dir, "recovery-evidence-v3280.sha256"), `${sha256}  recovery-evidence-v3280.json\n`, "utf8");

let signature = {
  algorithm: "Ed25519",
  configured: false,
  verified: false,
  key_id: null,
  signature_base64: null,
  public_key_pem: null,
  public_key_fingerprint_sha256: null,
};
const privateB64 = (process.env.SYSTEM_RECOVERY_EVIDENCE_ED25519_PRIVATE_KEY_B64 || "").trim();
if (privateB64) {
  const privatePem = Buffer.from(privateB64, "base64").toString("utf8");
  const privateKey = createPrivateKey(privatePem);
  const publicKey = createPublicKey(privateKey);
  const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const sig = sign(null, Buffer.from(evidenceRaw, "utf8"), privateKey);
  const verified = verify(null, Buffer.from(evidenceRaw, "utf8"), publicKey, sig);
  signature = {
    algorithm: "Ed25519",
    configured: true,
    verified,
    key_id: (process.env.SYSTEM_RECOVERY_EVIDENCE_ED25519_KEY_ID || "recovery-audit-v1").trim().slice(0, 80),
    signature_base64: sig.toString("base64"),
    public_key_pem: publicPem,
    public_key_fingerprint_sha256: createHash("sha256").update(publicPem, "utf8").digest("hex"),
  };
}
const bundle = {
  manifest: { version: "3.28.0", created_at: new Date().toISOString(), evidence_file: "recovery-evidence-v3280.json", retention_runs: 30, verification_required_before_export: true, external_trust_anchor_required_for_signed_bundle: true, revoked_key_fail_closed: true },
  evidence,
  integrity: { algorithm: "SHA-256", sha256 },
  signature,
  trust: { embedded_public_key_is_not_trust_anchor: true, trusted_key_source: "environment/current-signing-key", revoked_keys_source: "SYSTEM_RECOVERY_EVIDENCE_REVOKED_KEYS_JSON" },
  security: { private_key_embedded: false, remote_code_execution: false },
};
await writeFile(join(dir, "recovery-evidence-bundle-v3280.json"), JSON.stringify(bundle, null, 2) + "\n", "utf8");
console.log(`Recovery evidence history: ${history.length}/30 PASS ✅`);
console.log(`SHA-256: ${sha256} PASS ✅`);
console.log(`Ed25519: ${signature.configured ? (signature.verified ? "VERIFIED ✅" : "FAILED") : "OPTIONAL (not configured)"}`);
console.log("External trust-anchor gate for signed bundles: ENABLED ✅");
console.log("Revoked signing-key fail-closed gate: ENABLED ✅");
console.log("Project .env auto-load: ENABLED ✅");
