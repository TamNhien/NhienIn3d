import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function runtime(ver) {
  return readFileSync(`scripts/e2e-runtime-v${ver.replaceAll(".", "")}.ps1`, "utf8");
}

test("v3.6.4 Runtime E2E doi chieu dung public health va Admin health version", () => {
  const src = runtime("3.6.4");
  assert.match(src, /publicHealth\.phien_ban -eq "v3\.6\.4"/);
  assert.match(src, /health\.phien_ban -eq "3\.6\.4"/);
  assert.doesNotMatch(src, /health\.phien_ban -eq "3\.6\.1"/);
});

test("v3.6.4 sua ca assertion version bi ke thua trong runtime v3.6.2 va v3.6.3", () => {
  assert.match(runtime("3.6.2"), /health\.phien_ban -eq "3\.6\.2"/);
  assert.match(runtime("3.6.3"), /health\.phien_ban -eq "3\.6\.3"/);
});

test("v3.6.4 health-version fix duoc giu khi nang patch tiep theo", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const browser = readFileSync("scripts/e2e-browser-v364.mjs", "utf8");
  assert.match(pkg.version, /^(?:3\.6\.[4567]|3\.7\.[012]|3\.8\.0|3\.9\.0|3\.10\.[012345]|3\.11\.0)$/);
  assert.match(pkg.scripts["e2e:browser"], /^node scripts\/e2e-browser-v(?:36[4567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110)\.mjs$/);
  assert.match(ci, /e2e-runtime-v(?:36[4567]|37[012]|380|390|3100|3101|3102|3103|3104|3105|3110)\.ps1/);
  assert.match(ci, /Browser E2E Admin HTTPS v(?:3\.6\.[4567]|3\.7\.[012]|3\.8\.0|3\.9\.0|3\.10\.[012345]|3\.11\.0)/);
  assert.match(browser, /v3\.6\.4/);
});
