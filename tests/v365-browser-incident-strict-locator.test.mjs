import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("v3.6.5 Browser E2E scope synthetic incident vao danh sach Incident de tranh strict locator trung", () => {
  const browser = readFileSync("scripts/e2e-browser-v365.mjs", "utf8");
  assert.match(browser, /locator\("\.cine-incident-list-v340 \.cine-incident-item-v340"\)/);
  assert.match(browser, /filter\(\{ hasText: signatureLabel \}\)/);
  assert.match(browser, /matched !== 1/);
  assert.doesNotMatch(browser, /page\.getByText\(`#\$\{syntheticSignature\.slice\(0, 12\)\}`/);
});

test("v3.6.5 patch ca browser E2E versioned v3.6.0-v3.6.4 de khong lap loi strict mode", () => {
  for (const ver of ["360", "361", "362", "363", "364"]) {
    const src = readFileSync(`scripts/e2e-browser-v${ver}.mjs`, "utf8");
    assert.match(src, /\.cine-incident-list-v340 \.cine-incident-item-v340/);
    assert.doesNotMatch(src, /page\.getByText\(`#\$\{syntheticSignature\.slice\(0, 12\)\}`/);
  }
});

test("v3.6.5 CI va version dung runtime browser patch moi", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const runtime = readFileSync("scripts/e2e-runtime-v365.ps1", "utf8");
  const browser = readFileSync("scripts/e2e-browser-v365.mjs", "utf8");
  assert.equal(pkg.version, "3.6.5");
  assert.equal(pkg.scripts["e2e:browser"], "node scripts/e2e-browser-v365.mjs");
  assert.match(ci, /e2e-runtime-v365\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v3\.6\.5/);
  assert.match(runtime, /publicHealth\.phien_ban -eq "v3\.6\.5"/);
  assert.match(runtime, /health\.phien_ban -eq "3\.6\.5"/);
  assert.match(browser, /health\.phien_ban !== "v3\.6\.5"/);
});
