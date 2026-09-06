import { generateKeyPairSync, createHash } from "node:crypto";
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
const fingerprint = createHash("sha256").update(publicPem).digest("hex");
console.log("# Lưu PRIVATE key trong secret manager/.env cục bộ, không commit vào Git");
console.log(`SYSTEM_RECOVERY_EVIDENCE_ED25519_PRIVATE_KEY_B64=${Buffer.from(privatePem).toString("base64")}`);
console.log("SYSTEM_RECOVERY_EVIDENCE_ED25519_KEY_ID=recovery-audit-v1");
console.log(`# Public fingerprint SHA-256: ${fingerprint}`);
