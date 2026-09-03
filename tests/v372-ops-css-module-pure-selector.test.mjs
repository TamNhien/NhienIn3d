import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(name, "utf8");

test("v3.7.2 Ops CSS Module scope table selectors bang local class", () => {
  const css = read("apps/web/app/quan-tri/ops/page.module.css");
  assert.match(css, /\.tableWrap table\{/);
  assert.match(css, /\.tableWrap th,\.tableWrap td\{/);
  assert.match(css, /\.tableWrap th\{/);
  assert.doesNotMatch(css, /(?:^|})table\{/);
  assert.doesNotMatch(css, /(?:^|})th,td\{/);
  assert.doesNotMatch(css, /(?:^|})th\{/);
});

test("v3.7.2 CSS fix duoc giu khi nang v3.11.0", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const runtime = read("scripts/e2e-runtime-v3100.ps1");
  const browser = read("scripts/e2e-browser-v3100.mjs");
  assert.equal(pkg.version, "3.18.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v3180.mjs");
  assert.match(ci, /e2e-runtime-v3180\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.18\.0/);
  assert.match(runtime, /publicHealth\.phien_ban -eq "v3\.10\.0"/);
  assert.match(runtime, /health\.phien_ban -eq "3\.10\.0"/);
  assert.match(browser, /health\.phien_ban !== "v3\.10\.0"/);
});
