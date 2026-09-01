import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(name, "utf8");

test("v3.6.7 browser E2E scope incident status vao panel chi tiet dang chon", () => {
  const browser = read("scripts/e2e-browser-v367.mjs");
  assert.match(browser, /\.cine-incident-detail-v340 \.cine-incident-meta-v350 \.status-badge/);
  assert.match(browser, /waitSyntheticStatus\("DA TIEP NHAN"\)/);
  assert.match(browser, /waitSyntheticStatus\("DA KHAC PHUC"\)/);
  assert.doesNotMatch(browser, /getByText\("DA TIEP NHAN"/);
  assert.doesNotMatch(browser, /getByText\("DA KHAC PHUC"/);
});

test("v3.6.7 backport scoped status assertion cho browser E2E v3.6.0 den v3.6.6", () => {
  for (const version of [360, 361, 362, 363, 364, 365, 366]) {
    const browser = read(`scripts/e2e-browser-v${version}.mjs`);
    assert.match(browser, /\.cine-incident-detail-v340 \.cine-incident-meta-v350 \.status-badge/, `v${version}`);
    assert.doesNotMatch(browser, /getByText\("DA TIEP NHAN"/, `v${version}`);
    assert.doesNotMatch(browser, /getByText\("DA KHAC PHUC"/, `v${version}`);
  }
});

test("v3.6.7 scoped-status fix duoc giu khi nang v3.9.0", () => {
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  const runtime = read("scripts/e2e-runtime-v367.ps1");
  const browser = read("scripts/e2e-browser-v367.mjs");
  assert.equal(pkg.version, "3.9.0");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v390.mjs");
  assert.match(ci, /e2e-runtime-v390\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.9\.0/);
  assert.match(runtime, /v3\.6\.7/);
  assert.match(browser, /v3\.6\.7/);
});
