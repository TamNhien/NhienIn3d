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

test('v2.1.1 storefront co gio hang va route checkout rieng', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  assert.match(page, /themBienTheVaoGio/);
  assert.match(page, /Thêm vào giỏ|themVaoGio/u);
  assert.match(page, /gio-hang/);
  assert.match(page, /v2\.1\.1/);
});

test('hero bo noi dung quang ba V2 va typography da duoc thu gon', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  const css = readFileSync('app/globals.css', 'utf8');
  assert.doesNotMatch(page, /NHIENIN3D V2 • COMMERCE READY/);
  assert.doesNotMatch(page, /V2 bổ sung giỏ hàng thật/u);
  assert.match(css, /font-size:clamp\(44px,4\.8vw,68px\)/);
  assert.match(css, /Segoe UI Variable/);
});

test('web hien thi lich su phien ban theo thu tu tang dan', () => {
  const history = readFileSync('lib/lich-su-phien-ban.ts', 'utf8');
  const versions = [...history.matchAll(/phien_ban: "(v\d+\.\d+\.\d+)"/g)].map(x => x[1]);
  assert.deepEqual(versions, ['v1.0.0','v1.0.1','v1.0.2','v1.0.3','v1.0.4','v1.0.5','v1.0.6','v1.0.7','v2.0.0','v2.1.0','v2.1.1']);
});

test('web gan nhan phuong thuc thanh toan gia lap local', () => {
  const page = readFileSync('app/thanh-toan/page.tsx', 'utf8');
  assert.match(page, /la_gia_lap/);
  assert.match(page, /Giả lập local/u);
  assert.match(page, /Không gọi cổng thanh toán thật/u);
});

test('v2.1.1 co trang chi tiet san pham va click the san pham de mo chi tiet', () => {
  const card = readFileSync('components/the-san-pham.tsx', 'utf8');
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.match(card, /router\.push\(`\/san-pham\//);
  assert.match(card, /Xem chi tiết sản phẩm/u);
  assert.match(detail, /Biến thể \/ vật liệu \/ màu sắc/u);
  assert.match(detail, /Thêm \$\{so_luong\} vào giỏ/u);
});

test('v2.1.1 tach gio hang va thanh toan thanh hai route rieng', () => {
  const home = readFileSync('app/page.tsx', 'utf8');
  const cart = readFileSync('app/gio-hang/page.tsx', 'utf8');
  const checkout = readFileSync('app/thanh-toan/page.tsx', 'utf8');
  assert.doesNotMatch(home, /thanh-toan\/dat-hang/);
  assert.match(cart, /Tiến hành thanh toán/u);
  assert.match(cart, /capNhatSoLuong/);
  assert.match(cart, /xoaKhoiGio/);
  assert.match(checkout, /thanh-toan\/dat-hang/);
  assert.match(checkout, /Thông tin nhận hàng/u);
});
