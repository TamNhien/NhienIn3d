import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const doc = p => readFileSync(p, "utf8");

test("v3.1.0 giu migration lich su v3.0.0 nhung loai bo hoan toan MFA khoi runtime", () => {
  assert.ok(existsSync("apps/api/prisma/migrations/202608310004_v300_mfa_admin/migration.sql"));
  assert.ok(existsSync("apps/api/prisma/migrations/202608310005_v310_remove_mfa_system_health/migration.sql"));
  const migration = doc("apps/api/prisma/migrations/202608310005_v310_remove_mfa_system_health/migration.sql");
  const schema = doc("apps/api/prisma/schema.prisma");
  const ctl = doc("apps/api/src/xac-thuc/xac-thuc.controller.ts");
  const svc = doc("apps/api/src/xac-thuc/xac-thuc.service.ts");
  assert.match(migration, /DROP COLUMN IF EXISTS "mfa_totp_bat"/);
  assert.doesNotMatch(schema, /mfa_totp_/);
  assert.doesNotMatch(ctl, /mfa\//i);
  assert.doesNotMatch(svc, /mfa_totp_|MFA_DANG_NHAP|dang_nhap_mfa/);
  assert.equal(existsSync("apps/api/src/xac-thuc/mfa-totp.ts"), false);
  assert.equal(existsSync("apps/api/src/xac-thuc/dto/xac-nhan-mfa.dto.ts"), false);
  const cleanup = doc("scripts/don-dep-legacy.mjs");
  assert.match(cleanup, /apps\/api\/src\/xac-thuc\/mfa-totp\.ts/);
  assert.match(cleanup, /apps\/api\/src\/xac-thuc\/dto\/xac-nhan-mfa\.dto\.ts/);
  assert.doesNotMatch(doc(".env.example"), /MFA_ENCRYPTION_KEY/);
});

test("v3.1.0 co backup daily weekly retention verify va Windows Scheduled Task", () => {
  for (const file of ["scripts/backup-db.ps1", "scripts/restore-db.ps1", "scripts/backup-schedule.ps1", "scripts/backup-schedule-remove.ps1", "scripts/backup-verify.ps1"]) assert.ok(existsSync(file), file);
  const backup = doc("scripts/backup-db.ps1");
  const schedule = doc("scripts/backup-schedule.ps1");
  assert.match(backup, /pg_dump/);
  assert.match(backup, /nhienin3d-daily-/);
  assert.match(backup, /nhienin3d-weekly-/);
  assert.match(backup, /DailyRetentionDays/);
  assert.match(backup, /WeeklyRetentionWeeks/);
  assert.match(schedule, /Register-ScheduledTask/);
  assert.match(doc("scripts/backup-verify.ps1"), /Get-FileHash -Algorithm SHA256/);
  assert.match(doc("scripts/restore-db.ps1"), /pg_restore/);
});

test("v3.1.0 dashboard suc khoe co DB API SMTP backup va volume read-only", () => {
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  const compose = doc("docker-compose.yml");
  assert.match(ctl, /he-thong\/suc-khoe/);
  assert.match(svc, /pg_database_size\(current_database\(\)\)/);
  assert.match(svc, /_prisma_migrations/);
  assert.match(svc, /thong_tin_backup/);
  assert.match(svc, /trangThaiCauHinh/);
  assert.match(compose, /\.\/backups:\/app\/backups:ro/);
});

test("v3.0.0 audit Admin van co bo loc server va xuat CSV sau nang cap", () => {
  const ctl = doc("apps/api/src/quan-tri/quan-tri.controller.ts");
  const svc = doc("apps/api/src/quan-tri/quan-tri.service.ts");
  assert.match(ctl, /nhat-ky\/csv/);
  assert.match(ctl, /@Query\("tu_ngay"\)/);
  assert.match(svc, /xuat_nhat_ky_admin_csv/);
  assert.match(svc, /dia_chi_ip/);
});
