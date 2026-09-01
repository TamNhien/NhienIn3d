import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const json = (p) => JSON.parse(readFileSync(p, "utf8"));

test("v3.5.2 khoa install-script theo allowlist pin version va chan Scarf telemetry", () => {
  const root = json("package.json");
  assert.equal(root.engines.npm, ">=11.17.0");
  assert.deepEqual(root.allowScripts, {
    "@prisma/engines@7.10.0": true,
    "@scarf/scarf": false,
    "argon2@0.45.1": true,
    "esbuild@0.28.2": true,
    "prisma@7.10.0": true,
  });
  const npmrc = readFileSync(".npmrc", "utf8");
  assert.match(npmrc, /^strict-allow-scripts=true$/m);
});

test("v3.5.2 Docker cai dependency qua root workspace de ap dung allowScripts", () => {
  const apiDocker = readFileSync("apps/api/Dockerfile", "utf8");
  const webDocker = readFileSync("apps/web/Dockerfile", "utf8");
  assert.match(apiDocker, /COPY package\.json \.npmrc \.\//);
  assert.match(apiDocker, /npm install --workspace=@nhienin3d\/api --include-workspace-root=false/);
  assert.match(webDocker, /COPY package\.json \.npmrc \.\//);
  assert.match(webDocker, /npm install --workspace=@nhienin3d\/web --include-workspace-root=false/);
});
