import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

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

test('v2.2.1 storefront co gio hang va route checkout rieng', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  assert.match(page, /themBienTheVaoGio/);
  assert.match(page, /Thêm vào giỏ|themVaoGio/u);
  assert.match(page, /gio-hang/);
  assert.doesNotMatch(page, />v2\.2\.1</);
});

test('hero bo noi dung quang ba phien ban va typography da duoc thu gon', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  const css = readFileSync('app/globals.css', 'utf8');
  assert.doesNotMatch(page, /NHIENIN3D V2 • COMMERCE READY/);
  assert.doesNotMatch(page, /V2 bổ sung giỏ hàng thật/u);
  assert.match(css, /font-size:clamp\(44px,4\.8vw,68px\)/);
  assert.match(css, /Segoe UI Variable/);
});

test('v2.2.1 bo cac khoi gioi thieu dai khoi storefront', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  for (const noi_dung of [
    'THƯƠNG MẠI ĐIỆN TỬ',
    'CÔNG NGHỆ',
    'LỊCH SỬ PHÁT TRIỂN',
    'SECURITY BY DEFAULT',
    'Hiện đại từ giao diện đến transaction',
    'Checkout không tin dữ liệu từ trình duyệt'
  ]) assert.doesNotMatch(page, new RegExp(noi_dung, 'u'));
  assert.doesNotMatch(page, /LICH_SU_PHIEN_BAN/);
});

test('thanh dieu huong khong con lien ket toi cong nghe va lich su storefront', () => {
  const nav = readFileSync('components/thanh-dieu-huong.tsx', 'utf8');
  assert.doesNotMatch(nav, /#cong-nghe/);
  assert.doesNotMatch(nav, /#lich-su/);
  assert.match(nav, /Sản phẩm/u);
  assert.match(nav, /Giỏ hàng/u);
});

test('web gan nhan phuong thuc thanh toan gia lap local', () => {
  const page = readFileSync('app/thanh-toan/page.tsx', 'utf8');
  assert.match(page, /la_gia_lap/);
  assert.match(page, /Giả lập local/u);
  assert.match(page, /Không gọi cổng thanh toán thật/u);
});

test('v2.2.1 co trang chi tiet san pham va click the san pham de mo chi tiet', () => {
  const card = readFileSync('components/the-san-pham.tsx', 'utf8');
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.match(card, /router\.push\(`\/san-pham\//);
  assert.match(card, /Xem chi tiết sản phẩm/u);
  assert.match(detail, /Biến thể \/ vật liệu \/ màu sắc/u);
  assert.match(detail, /Thêm \$\{so_luong\} vào giỏ/u);
});

test('v2.2.1 tach gio hang va thanh toan thanh hai route rieng', () => {
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

test('v2.2.1 co trinh xem anh 3D tuong tac tren trang chi tiet', () => {
  const viewer = readFileSync('components/trinh-xem-anh-3d.tsx', 'utf8');
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.match(viewer, /Xem 3D/u);
  assert.match(viewer, /onPointerMove/);
  assert.match(viewer, /onWheel/);
  assert.match(viewer, /rotateX/);
  assert.match(viewer, /rotateY/);
  assert.match(detail, /TrinhXemAnh3D/);
});

test('v2.2.1 dong goi anh local cho khoi lap phuong banh rang', () => {
  const data = readFileSync('lib/du-lieu-mau.ts', 'utf8');
  assert.match(data, /\/images\/khoi-lap-phuong-banh-rang\.jpg/);
  assert.equal(existsSync('public/images/khoi-lap-phuong-banh-rang.jpg'), true);
});
