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

test("v3.7.2 dong bo runtime browser CI va package", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const runtime = read("scripts/e2e-runtime-v372.ps1");
  const browser = read("scripts/e2e-browser-v372.mjs");
  assert.equal(pkg.version, "3.7.2");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v372.mjs");
  assert.match(ci, /e2e-runtime-v372\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.7\.2/);
  assert.match(runtime, /publicHealth\.phien_ban -eq "v3\.7\.2"/);
  assert.match(runtime, /health\.phien_ban -eq "3\.7\.2"/);
  assert.match(browser, /health\.phien_ban !== "v3\.7\.2"/);
});
