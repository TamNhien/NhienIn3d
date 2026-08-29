import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const docJson = (duongDan) => JSON.parse(readFileSync(duongDan, "utf8"));

test("root khai bao npm workspaces cho API va Web", () => {
  const pkg = docJson("package.json");
  assert.deepEqual(pkg.workspaces, ["apps/api", "apps/web"]);
});

test("root co day du lenh test, typecheck va build", () => {
  const pkg = docJson("package.json");
  for (const ten of ["test", "typecheck", "build", "check", "ci", "audit:security"]) {
    assert.equal(typeof pkg.scripts?.[ten], "string", `Thieu script ${ten}`);
  }
});

test("cac tep cot loi cua du an ton tai", () => {
  for (const tep of [
    "docker-compose.yml",
    ".env.example",
    "apps/api/prisma/schema.prisma",
    "apps/api/src/main.ts",
    "apps/web/app/page.tsx"
  ]) assert.equal(existsSync(tep), true, `Thieu ${tep}`);
});

test("root khoa deepmerge-ts da va lo hong CVE-2026-40345", () => {
  const pkg = docJson("package.json");
  assert.equal(pkg.overrides?.["deepmerge-ts"], "8.0.1");
});

test("Docker API dung root workspace de ap dung root overrides bao mat", () => {
  const docker = readFileSync("apps/api/Dockerfile", "utf8");
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(docker, /COPY package\.json/);
  assert.match(docker, /npm install --workspace=@nhienin3d\/api/);
  assert.match(docker, /npm audit --audit-level=high/);
  assert.match(compose, /context: \./);
  assert.match(compose, /dockerfile: apps\/api\/Dockerfile/);
});

test("PostgreSQL Docker dung cong host 5434 va cong noi bo 5432", () => {
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(compose, /POSTGRES_PORT:-5434/);
  assert.match(compose, /@postgres:5432\//);
});

test("PostgreSQL 18 mount volume dung thu muc /var/lib/postgresql", () => {
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(compose, /nhienin3d-postgres-data:\/var\/lib\/postgresql\b/);
  assert.doesNotMatch(compose, /nhienin3d-postgres-data:\/var\/lib\/postgresql\/data/);
});

test("root co lenh kiem tra so dong du lieu database", () => {
  const pkg = docJson("package.json");
  assert.equal(typeof pkg.scripts?.["db:kiem-tra-du-lieu"], "string");
});

test("V2 co migration nang cap khong ghi de migration V1", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290001_v001_khoi_tao/migration.sql"), true);
  assert.equal(existsSync("apps/api/prisma/migrations/202608290002_v002_gio_hang_thanh_toan/migration.sql"), true);
});

test("version v2.4.0 dong bo root API va Web", () => {
  assert.equal(readFileSync("VERSION", "utf8").trim(), "2.4.0");
  assert.equal(docJson("package.json").version, "2.4.0");
  assert.equal(docJson("apps/api/package.json").version, "2.4.0");
  assert.equal(docJson("apps/web/package.json").version, "2.4.0");
});

test("README co lich su phien ban tang dan den v2.4.0", () => {
  const readme = readFileSync("README.md", "utf8");
  const viTri = ["## v1.0.0", "## v1.0.1", "## v1.0.2", "## v1.0.3", "## v1.0.4", "## v1.0.5", "## v1.0.6", "## v1.0.7", "## v2.0.0", "## v2.1.0", "## v2.1.1", "## v2.2.0", "## v2.2.1", "## v2.3.0", "## v2.4.0"].map(x => readme.indexOf(x));
  assert.ok(viTri.every(x => x >= 0));
  assert.deepEqual([...viTri].sort((a,b)=>a-b), viTri);
});

test("v2.2.1 bo lich su va nhan version khoi storefront", () => {
  const home = readFileSync("apps/web/app/page.tsx", "utf8");
  assert.doesNotMatch(home, /LỊCH SỬ PHÁT TRIỂN/u);
  assert.doesNotMatch(home, /lich-su-phien-ban/);
  assert.doesNotMatch(home, />v2\.2\.1</);
});

test("v2.2.1 co cleanup cho tep lich su storefront con sot khi chep source de", () => {
  const cleanup = readFileSync("scripts/don-dep-legacy.mjs", "utf8");
  assert.match(cleanup, /apps\/web\/lib\/lich-su-phien-ban\.ts/);
  assert.match(docJson("package.json").scripts.test, /don-dep-legacy\.mjs/);
});

test("v2.2.1 co ba route commerce tach biet", () => {
  for (const tep of [
    "apps/web/app/san-pham/[duong_dan]/page.tsx",
    "apps/web/app/gio-hang/page.tsx",
    "apps/web/app/thanh-toan/page.tsx"
  ]) assert.equal(existsSync(tep), true, `Thieu ${tep}`);
});

test("v2.2.1 co trinh xem anh 3D va anh local mau", () => {
  assert.equal(existsSync("apps/web/components/trinh-xem-anh-3d.tsx"), true);
  assert.equal(existsSync("apps/web/public/images/khoi-lap-phuong-banh-rang.jpg"), true);
});


test("v2.3.0 co migration yeu_thich va khong ghi de migration cu", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290003_v230_yeu_thich_tim_kiem/migration.sql"), true);
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  assert.match(schema, /model\s+YeuThich\b/);
  assert.match(schema, /@@map\("yeu_thich"\)/);
});

test("v2.3.0 co route danh sach san pham va yeu thich", () => {
  assert.equal(existsSync("apps/web/app/san-pham/page.tsx"), true);
  assert.equal(existsSync("apps/web/app/yeu-thich/page.tsx"), true);
  assert.equal(existsSync("apps/web/lib/yeu-thich.ts"), true);
});


test("v2.3.0 release chi cho phep dung version cua source va bat buoc lockfile", () => {
  const release = readFileSync("scripts/release.ps1", "utf8");
  assert.match(release, /sourceVersion/);
  assert.match(release, /package-lock\.json/);
  assert.match(release, /git push origin \$Version/);
});


test("v2.4.0 bo dai strip trang tri khoi trang chu", () => {
  const home = readFileSync("apps/web/app/page.tsx", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.doesNotMatch(home, /className="strip"/);
  assert.doesNotMatch(home, /<span>PLA<\/span>/);
  assert.doesNotMatch(css, /\.strip\{/);
});

test("v2.4.0 viewer san pham dung WebGL mesh 3D that", () => {
  const viewer = readFileSync("apps/web/components/trinh-xem-anh-3d.tsx", "utf8");
  assert.match(viewer, /<Canvas/);
  assert.match(viewer, /<OrbitControls/);
  assert.match(viewer, /KhoiLapPhuongBanhRang/);
  assert.match(viewer, /3D WebGL/u);
  assert.doesNotMatch(viewer, /product-image-3d-layer/);
});
