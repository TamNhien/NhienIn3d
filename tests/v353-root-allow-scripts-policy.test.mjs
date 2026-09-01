import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const json = (p) => JSON.parse(readFileSync(p, "utf8"));

test("v3.5.3 allowScripts chi khai bao o project root de npm workspace khong canh bao ignored", () => {
  const root = json("package.json");
  const api = json("apps/api/package.json");
  const web = json("apps/web/package.json");
  assert.ok(root.allowScripts && root.allowScripts["prisma@7.10.0"] === true);
  assert.equal(Object.hasOwn(api, "allowScripts"), false);
  assert.equal(Object.hasOwn(web, "allowScripts"), false);
  assert.equal(existsSync("apps/api/.npmrc"), false);
  assert.equal(existsSync("apps/web/.npmrc"), false);
  assert.match(readFileSync(".npmrc", "utf8"), /^strict-allow-scripts=true$/m);
});

test("v3.5.3 Docker Web doi context ve root va dung cung allowScripts voi local CI", () => {
  const compose = readFileSync("docker-compose.yml", "utf8");
  const composeHttps = readFileSync("docker-compose.https.yml", "utf8");
  const docker = readFileSync("apps/web/Dockerfile", "utf8");
  for (const source of [compose, composeHttps]) {
    assert.match(source, /web:\s+build:\s+context: \.\s+dockerfile: apps\/web\/Dockerfile/s);
  }
  assert.match(docker, /COPY package\.json \.npmrc \.\//);
  assert.match(docker, /COPY apps\/web\/package\.json \.\/apps\/web\/package\.json/);
  assert.match(docker, /npm install --workspace=@nhienin3d\/web --include-workspace-root=false/);
  assert.match(docker, /npm audit --workspace=@nhienin3d\/web --audit-level=high/);
});
