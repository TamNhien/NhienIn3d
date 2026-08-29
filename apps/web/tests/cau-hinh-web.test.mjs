import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const docJson = (duongDan) => JSON.parse(readFileSync(duongDan, 'utf8'));

test('Web dung Next.js 16.3.3 va React 19.2.8', () => {
  const pkg = docJson('package.json');
  assert.equal(pkg.dependencies.next, '16.3.3');
  assert.equal(pkg.dependencies.react, '19.2.8');
});

test('Web co Three.js va React Three Fiber cho giao dien 3D', () => {
  const pkg = docJson('package.json');
  assert.equal(pkg.dependencies.three, '0.185.1');
  assert.equal(pkg.dependencies['@react-three/fiber'], '9.7.0');
});

test('du lieu mau hien thi tieng Viet co dau', () => {
  const src = readFileSync('lib/du-lieu-mau.ts', 'utf8');
  assert.match(src, /sản phẩm|Sản phẩm|Đèn|Chậu|Giá/u);
});
