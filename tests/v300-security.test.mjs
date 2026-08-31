import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const doc = p => readFileSync(p, "utf8");

test("v3.0.0 co migration MFA Admin va secret ma hoa", () => {
  assert.ok(existsSync("apps/api/prisma/migrations/202608310004_v300_mfa_admin/migration.sql"));
  const schema = doc("apps/api/prisma/schema.prisma");
  assert.match(schema, /mfa_totp_bat\s+Boolean/);
  assert.match(schema, /mfa_totp_secret_ma_hoa\s+String\?/);
  assert.match(doc("apps/api/src/xac-thuc/mfa-totp.ts"), /aes-256-gcm/);
});

test("v3.0.0 co MFA login challenge va route cau hinh Admin", () => {
  const ctl = doc("apps/api/src/xac-thuc/xac-thuc.controller.ts");
  const svc = doc("apps/api/src/xac-thuc/xac-thuc.service.ts");
  assert.match(ctl, /dang-nhap\/mfa/);
  assert.match(ctl, /mfa\/khoi-tao/);
  assert.match(ctl, /mfa\/xac-nhan/);
  assert.match(ctl, /mfa\/tat/);
  assert.match(svc, /DANG_NHAP_MFA_THANH_CONG/);
  assert.match(svc, /SO_LAN_MFA_THAT_BAI_TOI_DA/);
  assert.match(svc, /if \(nguoi_dung\.mfa_totp_bat\) throw new BadRequestException/, "không được ghi đè secret khi MFA đang bật");
});

test("v3.0.0 co backup restore PostgreSQL co xac nhan", () => {
  assert.ok(existsSync("scripts/backup-db.ps1"));
  assert.ok(existsSync("scripts/restore-db.ps1"));
  assert.match(doc("scripts/backup-db.ps1"), /pg_dump/);
  assert.match(doc("scripts/restore-db.ps1"), /pg_restore/);
  assert.match(doc("scripts/restore-db.ps1"), /\$XacNhan/);
  assert.match(doc(".gitignore"), /backups\//);
});

test("v3.0.0 audit Admin co bo loc server va xuat CSV", () => {
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(ctl, /nhat-ky\/csv/);
  assert.match(ctl, /@Query\("tu_ngay"\)/);
  assert.match(svc, /xuat_nhat_ky_admin_csv/);
  assert.match(svc, /dia_chi_ip/);
});

