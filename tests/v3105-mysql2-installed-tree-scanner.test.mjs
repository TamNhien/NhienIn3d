import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const read = (p) => readFileSync(p, "utf8");

const makePackage = (dir, name, version) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version }, null, 2));
};

const runScanner = (cwd) => spawnSync(process.execPath, [join(process.cwd(), "scripts/kiem-tra-mysql2-security.mjs")], {
  cwd,
  encoding: "utf8",
});

test("v3.11.0 security checker scan installed node_modules thay vi resolve Prisma entrypoint", () => {
  const script = read("scripts/kiem-tra-mysql2-security.mjs");
  assert.match(script, /visitNodeModules/);
  assert.match(script, /pkg\?\.name === "mysql2"/);
  assert.match(script, /mysql2 installed tree/);
  assert.doesNotMatch(script, /createRequire/);
  assert.doesNotMatch(script, /requireFn\.resolve/);
  assert.doesNotMatch(script, /resolvePackage\(rootRequire, "prisma"\)/);
});

test("v3.11.0 scanner PASS voi mysql2 3.22.0 va FAIL voi nested mysql2 cu", () => {
  const base = join(tmpdir(), `nhienin3d-v3110-mysql2-${process.pid}-${Date.now()}`);
  try {
    makePackage(join(base, "node_modules", "mysql2"), "mysql2", "3.22.0");
    const pass = runScanner(base);
    assert.equal(pass.status, 0, pass.stderr || pass.stdout);
    assert.match(pass.stdout, /mysql2 3\.22\.0 >=3\.22\.0: PASS/);

    makePackage(join(base, "node_modules", "prisma", "node_modules", "mysql2"), "mysql2", "3.15.3");
    makePackage(join(base, "node_modules", "prisma"), "prisma", "7.10.0");
    const fail = runScanner(base);
    assert.notEqual(fail.status, 0);
    assert.match(`${fail.stdout}\n${fail.stderr}`, /mysql2 3\.15\.3 <3\.22\.0: FAIL/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("v3.11.0 CI verify va release dung security:mysql2 khong dung npm ls", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const verify = read("scripts/kiem-tra.ps1");
  const release = read(".github/workflows/release.yml");
  assert.equal(pkg.version, "3.12.0");
  assert.equal(pkg.devDependencies.mysql2, "3.22.0");
  assert.equal(pkg.overrides.mysql2, "$mysql2");
  assert.match(ci, /npm run security:mysql2/);
  assert.match(verify, /npm run security:mysql2/);
  assert.match(release, /npm run audit:security/);
  assert.doesNotMatch(ci, /npm ls mysql2/);
  assert.doesNotMatch(verify, /npm ls mysql2/);
});

test("v3.11.0 dong bo Runtime Browser CI Health OpenAPI", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const health = read("apps/api/src/suc-khoe/suc-khoe.controller.ts");
  const main = read("apps/api/src/main.ts");
  assert.equal(read("VERSION").trim(), "3.12.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3120.mjs");
  assert.equal(existsSync("scripts/e2e-runtime-v3110.ps1"), true);
  assert.equal(existsSync("scripts/e2e-browser-v3110.mjs"), true);
  assert.match(ci, /e2e-runtime-v3120\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.12\.0/);
  assert.match(health, /phien_ban: "v3\.12\.0"/);
  assert.match(main, /setVersion\("3\.12\.0"\)/);
});
