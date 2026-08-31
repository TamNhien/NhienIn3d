import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BUOC_GIAY = 30;

function khoaMaHoa() {
  const nguon = process.env.MFA_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!nguon || nguon.length < 32) throw new Error("MFA_ENCRYPTION_KEY hoặc JWT_SECRET phải có ít nhất 32 ký tự");
  return createHash("sha256").update(nguon).digest();
}

export function taoBiMatTotp() {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += BASE32[parseInt(chunk, 2)];
  }
  return out;
}

function giaiMaBase32(secret: string) {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) throw new Error("Secret TOTP không hợp lệ");
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function maOtpTaiBuoc(secret: string, buoc: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(buoc));
  const digest = createHmac("sha1", giaiMaBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

export function xacThucTotp(secret: string, ma_otp: string, bay_gio = Date.now()) {
  const code = ma_otp.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return false;
  const buoc = Math.floor(bay_gio / 1000 / BUOC_GIAY);
  const nhap = Buffer.from(code);
  for (let lech = -1; lech <= 1; lech++) {
    const dung = Buffer.from(maOtpTaiBuoc(secret, buoc + lech));
    if (dung.length === nhap.length && timingSafeEqual(dung, nhap)) return true;
  }
  return false;
}

export function maHoaBiMatTotp(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", khoaMaHoa(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function giaiMaBiMatTotp(payload: string) {
  const [version, iv64, tag64, data64] = payload.split(".");
  if (version !== "v1" || !iv64 || !tag64 || !data64) throw new Error("Secret MFA lưu trữ không hợp lệ");
  const decipher = createDecipheriv("aes-256-gcm", khoaMaHoa(), Buffer.from(iv64, "base64url"));
  decipher.setAuthTag(Buffer.from(tag64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data64, "base64url")), decipher.final()]).toString("utf8");
}

export function taoUriTotp(secret: string, thu_dien_tu: string) {
  const issuer = "NhienIn3d";
  const label = `${issuer}:${thu_dien_tu}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${BUOC_GIAY}`;
}
