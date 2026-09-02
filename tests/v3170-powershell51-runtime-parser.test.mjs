import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("v3.17.0 PowerShell entrypoints co UTF-8 BOM cho Windows PowerShell 5.1", () => {
  const scripts = fs.readdirSync(path.join(root, "scripts"))
    .filter((name) => name.includes("v3170") && name.endsWith(".ps1"));
  assert.ok(scripts.length >= 4);
  for (const name of scripts) {
    const buf = fs.readFileSync(path.join(root, "scripts", name));
    assert.deepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf], `${name} thieu UTF-8 BOM`);
  }
});

test("v3.17.0 Runtime E2E tranh parser cascade ampersand va SQL here-string tren PowerShell 5.1", () => {
  const ps = read("scripts/e2e-runtime-v3170.ps1");
  assert.match(ps, /\[char\]38/);
  assert.doesNotMatch(ps, /archive\/preview\?bang_nguon=slo_endpoint_mau&thang=/);
  assert.doesNotMatch(ps, /\$sql\s*=\s*@"/);
  assert.match(ps, /\$sql\s*=\s*@\(/);
  assert.match(ps, /\)\s*-join\s+"`n"/);
  assert.match(ps, /docker compose exec -T postgres psql -v ON_ERROR_STOP=1/);
});
