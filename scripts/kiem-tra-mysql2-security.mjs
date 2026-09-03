import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const minimum = [3, 23, 1];
const projectRoot = process.cwd();
const visitedNodeModules = new Set();
const visitedPackages = new Set();
const mysql2Packages = new Map();

const parseVersion = (value) => String(value)
  .split(".")
  .slice(0, 3)
  .map((part) => Number.parseInt(part, 10) || 0);

const gte = (actual, expected) => {
  for (let i = 0; i < 3; i += 1) {
    if (actual[i] > expected[i]) return true;
    if (actual[i] < expected[i]) return false;
  }
  return true;
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const isDirectoryLike = (path) => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

const inspectPackage = (packageDir) => {
  if (!isDirectoryLike(packageDir)) return;

  let realPackageDir;
  try {
    realPackageDir = realpathSync(packageDir);
  } catch {
    return;
  }
  if (visitedPackages.has(realPackageDir)) return;
  visitedPackages.add(realPackageDir);

  const packageJsonPath = join(realPackageDir, "package.json");
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = readJson(packageJsonPath);
      if (pkg?.name === "mysql2") {
        mysql2Packages.set(realPackageDir, {
          version: String(pkg.version || "0.0.0"),
          path: packageJsonPath,
        });
      }
    } catch (error) {
      console.error(`[security] Khong doc duoc ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
      return;
    }
  }

  visitNodeModules(join(realPackageDir, "node_modules"));
};

const inspectScope = (scopeDir) => {
  if (!isDirectoryLike(scopeDir)) return;
  for (const entry of readdirSync(scopeDir, { withFileTypes: true })) {
    if (entry.name === ".bin") continue;
    inspectPackage(join(scopeDir, entry.name));
  }
};

function visitNodeModules(nodeModulesDir) {
  if (!isDirectoryLike(nodeModulesDir)) return;

  let realNodeModules;
  try {
    realNodeModules = realpathSync(nodeModulesDir);
  } catch {
    return;
  }
  if (visitedNodeModules.has(realNodeModules)) return;
  visitedNodeModules.add(realNodeModules);

  for (const entry of readdirSync(realNodeModules, { withFileTypes: true })) {
    if (entry.name === ".bin") continue;
    const child = join(realNodeModules, entry.name);
    if (entry.name.startsWith("@")) inspectScope(child);
    else inspectPackage(child);
  }
}

visitNodeModules(join(projectRoot, "node_modules"));

if (process.exitCode) process.exit(process.exitCode);

if (mysql2Packages.size === 0) {
  console.error("[security] Khong tim thay mysql2 trong installed node_modules tree. Hay chay npm install truoc.");
  process.exit(1);
}

let failed = false;
for (const item of [...mysql2Packages.values()].sort((a, b) => a.path.localeCompare(b.path))) {
  const ok = gte(parseVersion(item.version), minimum);
  const relative = item.path.startsWith(projectRoot) ? item.path.slice(projectRoot.length + 1) : item.path;
  console.log(`[security] ${relative}: mysql2 ${item.version} ${ok ? ">=3.23.1: PASS" : "<3.23.1: FAIL"}`);
  if (!ok) failed = true;
}

if (failed) {
  console.error("[security] Installed dependency tree con mysql2 <3.23.1. Hay chay npm install de dong bo dependency tree.");
  process.exit(1);
}

console.log(`[security] mysql2 installed tree: ${mysql2Packages.size} package path(s), tat ca >=3.23.1: PASS`);
