import { readFileSync } from "node:fs";

const min = [3, 22, 0];
const parse = (value) => value.split(".").slice(0, 3).map((part) => Number.parseInt(part, 10) || 0);
const gte = (actual, expected) => {
  for (let i = 0; i < 3; i += 1) {
    if (actual[i] > expected[i]) return true;
    if (actual[i] < expected[i]) return false;
  }
  return true;
};

let installed;
try {
  installed = JSON.parse(readFileSync("node_modules/mysql2/package.json", "utf8")).version;
} catch {
  console.error("[security] mysql2 chua duoc cai tai root. Hay chay npm install tu thu muc goc.");
  process.exit(1);
}

if (!gte(parse(installed), min)) {
  console.error(`[security] mysql2 ${installed} khong dat yeu cau >=3.22.0. Hay chay npm install de dong bo dependency tree.`);
  process.exit(1);
}

console.log(`[security] mysql2 ${installed} >=3.22.0: PASS`);
