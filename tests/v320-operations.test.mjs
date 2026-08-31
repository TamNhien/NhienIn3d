import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const doc = p => readFileSync(p, "utf8");

test("v3.2.0 cleanup file MFA legacy va checkbox nha cung cap gon", () => {
  const cleanup = doc("scripts/don-dep-legacy.mjs");
  const page = doc("apps/web/app/quan-tri/page.tsx");
  const css = doc("apps/web/app/globals.css");
  assert.match(cleanup, /apps\/api\/src\/xac-thuc\/mfa-totp\.ts/);
  assert.match(cleanup, /apps\/api\/src\/xac-thuc\/dto\/xac-nhan-mfa\.dto\.ts/);
  assert.match(page, /cine-supplier-active-check-v320/);
  assert.match(css, /cine-supplier-active-check-v320 input\{[^}]*width:15px/i);
});

test("v3.2.0 co migration va model lich su van hanh", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608310006_v320_audit_ops_history/migration.sql"), true);
  const schema = doc("apps/api/prisma/schema.prisma");
  const migration = doc("apps/api/prisma/migrations/202608310006_v320_audit_ops_history/migration.sql");
  assert.match(schema, /model LichSuVanHanh/);
  assert.match(schema, /@@map\("lich_su_van_hanh"\)/);
  assert.match(migration, /CREATE TABLE "lich_su_van_hanh"/);
});

test("v3.2.0 backup restore ghi history va runtime E2E dung database co lap", () => {
  const backup = doc("scripts/backup-db.ps1");
  const restore = doc("scripts/restore-db.ps1");
  const e2e = doc("scripts/e2e-runtime-v320.ps1");
  for (const src of [backup, restore]) assert.match(src, /Write-OpsHistory/);
  assert.match(backup, /-Type "BACKUP"/);
  assert.match(restore, /-Type "RESTORE"/);
  assert.match(e2e, /createdb/);
  assert.match(e2e, /dropdb/);
  assert.match(e2e, /pg_dump/);
  assert.match(e2e, /pg_restore/);
  assert.match(e2e, /Get-FileHash -Algorithm SHA256/);
  assert.match(e2e, /nhienin3d_e2e_/);
});

test("v3.2.0 audit co diff phan trang va Excel", () => {
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(ctl, /nhat-ky\/phan-trang/);
  assert.match(ctl, /nhat-ky\/excel/);
  assert.match(svc, /tao_diff/);
  assert.match(svc, /xuat_nhat_ky_admin_excel/);
  assert.match(svc, /thay_doi/);
});

test("v3.2.0 canh bao van hanh email co env Docker va chong gui lap", () => {
  const env = doc(".env.example");
  const compose = doc("docker-compose.yml");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  const mail = doc("apps/api/src/thu-dien-tu/thu-dien-tu.service.ts");
  for (const key of ["SYSTEM_HEALTH_EMAIL_ENABLED", "SYSTEM_HEALTH_EMAIL_INTERVAL_MINUTES", "SYSTEM_HEALTH_EMAIL_TO", "SYSTEM_HEALTH_BACKUP_MAX_AGE_HOURS"]) {
    assert.match(env, new RegExp(key)); assert.match(compose, new RegExp(key));
  }
  assert.match(svc, /chu_ky_canh_bao_he_thong/);
  assert.match(svc, /createHash\("sha256"\)/);
  assert.match(svc, /CANH_BAO_HE_THONG_EMAIL/);
  assert.match(mail, /guiCanhBaoHeThong/);
});
