import { createHash, createPublicKey, timingSafeEqual, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const defaultFile = resolve(process.env.SYSTEM_BACKUP_DIR || join(root, "backups"), "recovery-evidence-bundle-v3210.json");
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
let signatureValid = true;
let fingerprintValid = true;
if (sig.configured === true) {
  const publicPem = String(sig.public_key_pem || "");
  const signatureB64 = String(sig.signature_base64 || "");
  const storedFingerprint = String(sig.public_key_fingerprint_sha256 || "").trim().toLowerCase();
  const calculatedFingerprint = createHash("sha256").update(publicPem, "utf8").digest("hex");
  fingerprintValid = /^[a-f0-9]{64}$/.test(storedFingerprint) && timingSafeEqual(Buffer.from(calculatedFingerprint, "hex"), Buffer.from(storedFingerprint, "hex"));
  if (!fingerprintValid) throw new Error(`Public key fingerprint mismatch: stored=${storedFingerprint || "missing"} calculated=${calculatedFingerprint}`);
  const publicKey = createPublicKey(publicPem);
  signatureValid = verify(null, Buffer.from(evidenceRaw, "utf8"), publicKey, Buffer.from(signatureB64, "base64"));
  if (!signatureValid) throw new Error("Ed25519 signature invalid.");
}

console.log(`Recovery evidence file : ${file}`);
console.log(`SHA-256                : PASS ✅ ${calculatedSha}`);
console.log(`Ed25519                : ${sig.configured === true ? "VERIFIED ✅" : "OPTIONAL (not configured)"}`);
console.log(`Public fingerprint     : ${sig.configured === true ? "PASS ✅" : "N/A"}`);
console.log("Recovery evidence v3.21.0 verification PASS ✅");
