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
  ]) {
    assert.equal(existsSync(tep), true, `Thieu ${tep}`);
  }
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
