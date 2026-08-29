import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const docJson = (duongDan) => JSON.parse(readFileSync(duongDan, 'utf8'));

test('Web dung Next.js 16.3.3 va React 19.2.8', () => {
  const pkg = docJson('package.json');
  assert.equal(pkg.dependencies.next, '16.3.3');
  assert.equal(pkg.dependencies.react, '19.2.8');
});

test('Web co Three.js React Three Fiber va Drei cho giao dien 3D', () => {
  const pkg = docJson('package.json');
  assert.equal(pkg.dependencies.three, '0.185.1');
  assert.equal(pkg.dependencies['@react-three/fiber'], '9.7.0');
  assert.equal(pkg.dependencies['@react-three/drei'], '10.7.8');
});

test('du lieu mau hien thi tieng Viet co dau', () => {
  const src = readFileSync('lib/du-lieu-mau.ts', 'utf8');
  assert.match(src, /sản phẩm|Sản phẩm|Đèn|Chậu|Giá/u);
});

test('v2.5.0 storefront co gio hang va route checkout rieng', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  assert.match(page, /themBienTheVaoGio/);
  assert.match(page, /Thêm vào giỏ|themVaoGio/u);
  assert.match(page, /gio-hang/);
  assert.doesNotMatch(page, />v2\.4\.0</);
});

test('hero bo noi dung quang ba phien ban va typography da duoc thu gon', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  const css = readFileSync('app/globals.css', 'utf8');
  assert.doesNotMatch(page, /NHIENIN3D V2 • COMMERCE READY/);
  assert.doesNotMatch(page, /V2 bổ sung giỏ hàng thật/u);
  assert.match(css, /font-size:clamp\(44px,4\.8vw,68px\)/);
  assert.match(css, /Segoe UI Variable/);
});

test('storefront khong con cac khoi gioi thieu dai', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  for (const noi_dung of ['THƯƠNG MẠI ĐIỆN TỬ','CÔNG NGHỆ','LỊCH SỬ PHÁT TRIỂN','SECURITY BY DEFAULT']) {
    assert.doesNotMatch(page, new RegExp(noi_dung, 'u'));
  }
});

test('v2.5.0 bo dai chu trang tri PLA PETG ABS TPU khoi trang chu', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  const css = readFileSync('app/globals.css', 'utf8');
  assert.doesNotMatch(page, /className="strip"/);
  assert.doesNotMatch(page, /<span>PLA<\/span>/);
  assert.doesNotMatch(page, /<span>PETG<\/span>/);
  assert.doesNotMatch(page, /<span>Checkout<\/span>/);
  assert.doesNotMatch(css, /\.strip\{/);
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

test('co trang chi tiet san pham va click the san pham de mo chi tiet', () => {
  const card = readFileSync('components/the-san-pham.tsx', 'utf8');
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.match(card, /router\.push\(`\/san-pham\//);
  assert.match(card, /Xem chi tiết sản phẩm/u);
  assert.match(detail, /Biến thể \/ vật liệu \/ màu sắc/u);
  assert.match(detail, /Thêm \$\{so_luong\} vào giỏ/u);
});

test('gio hang va thanh toan la hai route rieng', () => {
  const home = readFileSync('app/page.tsx', 'utf8');
  const cart = readFileSync('app/gio-hang/page.tsx', 'utf8');
  const checkout = readFileSync('app/thanh-toan/page.tsx', 'utf8');
  assert.doesNotMatch(home, /thanh-toan\/dat-hang/);
  assert.match(cart, /Tiến hành thanh toán/u);
  assert.match(cart, /capNhatSoLuong/);
  assert.match(cart, /xoaKhoiGio/);
  assert.match(checkout, /thanh-toan\/dat-hang/);
});

test('v2.5.0 dung Canvas WebGL va OrbitControls thay cho xoay anh 2D gia lap', () => {
  const viewer = readFileSync('components/trinh-xem-anh-3d.tsx', 'utf8');
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.match(viewer, /from "@react-three\/fiber"/);
  assert.match(viewer, /<Canvas/);
  assert.match(viewer, /<OrbitControls/);
  assert.match(viewer, /<mesh/);
  assert.match(viewer, /3D thật/u);
  assert.doesNotMatch(viewer, /rotateX\(\$\{goc_x\}/);
  assert.doesNotMatch(viewer, /product-image-3d-layer/);
  assert.match(detail, /ma_san_pham=\{san_pham\.ma_san_pham\}/);
});

test('v2.5.0 co mo hinh 3D rieng cho 10 san pham mau', () => {
  const viewer = readFileSync('components/trinh-xem-anh-3d.tsx', 'utf8');
  for (const ma of ['N3D-RC-001','N3D-DESK-002','N3D-DECOR-003','N3D-DESK-004','N3D-GAME-005','N3D-LAMP-006','N3D-TOY-007','N3D-ORG-008','N3D-GIFT-009','N3D-MAKER-010']) {
    assert.match(viewer, new RegExp(ma));
  }
  assert.match(viewer, /KhoiLapPhuongBanhRang/);
  assert.match(viewer, /ContactShadows/);
});

test('dong goi anh local cho khoi lap phuong banh rang', () => {
  const data = readFileSync('lib/du-lieu-mau.ts', 'utf8');
  assert.match(data, /\/images\/khoi-lap-phuong-banh-rang\.jpg/);
  assert.equal(existsSync('public/images/khoi-lap-phuong-banh-rang.jpg'), true);
});

test('v2.3.0 co trang danh sach voi tim kiem loc va sap xep', () => {
  const page = readFileSync('app/san-pham/page.tsx', 'utf8');
  assert.match(page, /Tất cả danh mục/u);
  assert.match(page, /Chỉ còn hàng/u);
  assert.match(page, /gia_tang/);
  assert.match(page, /gia_giam/);
  assert.match(page, /ten_az/);
  assert.match(page, /tim_kiem/);
  assert.match(page, /gia_tu/);
  assert.match(page, /gia_den/);
});

test('v2.3.0 co wishlist PostgreSQL tren web', () => {
  const lib = readFileSync('lib/yeu-thich.ts', 'utf8');
  const nav = readFileSync('components/thanh-dieu-huong.tsx', 'utf8');
  const fav = readFileSync('app/yeu-thich/page.tsx', 'utf8');
  const card = readFileSync('components/the-san-pham.tsx', 'utf8');
  assert.match(lib, /yeu-thich/);
  assert.match(lib, /crypto\.randomUUID/);
  assert.match(nav, /Yêu thích/u);
  assert.match(fav, /Sản phẩm đã lưu/u);
  assert.match(card, /favorite-button/);
});


test('v2.5.0 hien thi san pham mac dinh theo ma tang dan', () => {
  const home = readFileSync('app/page.tsx', 'utf8');
  const catalog = readFileSync('app/san-pham/page.tsx', 'utf8');
  assert.match(home, /soThuTu/);
  assert.match(catalog, /useState\("ma_tang"\)/);
  assert.match(catalog, /Mã sản phẩm tăng dần/u);
  assert.match(catalog, /sap_xep === "ma_tang"/);
});


test('v2.5.0 web co danh gia san pham va diem sao', () => {
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  const component = readFileSync('components/danh-gia-san-pham.tsx', 'utf8');
  const card = readFileSync('components/the-san-pham.tsx', 'utf8');
  assert.match(detail, /DanhGiaSanPham/);
  assert.match(component, /Viết đánh giá/u);
  assert.match(card, /card-rating/);
});

test('v2.5.0 web co san pham lien quan va da xem gan day', () => {
  const goiY = readFileSync('components/goi-y-san-pham.tsx', 'utf8');
  assert.match(goiY, /lien-quan/);
  assert.match(goiY, /nhienin3d_da_xem_gan_day/);
  assert.match(goiY, /ĐÃ XEM GẦN ĐÂY/u);
});

test('v2.6.0 web co dang ky dang nhap va tai khoan', () => {
  for (const tep of ['app/dang-ky/page.tsx','app/dang-nhap/page.tsx','app/tai-khoan/page.tsx','lib/xac-thuc.ts']) assert.equal(existsSync(tep), true, `Thieu ${tep}`);
  const nav = readFileSync('components/thanh-dieu-huong.tsx','utf8');
  assert.match(nav, /Đăng nhập/u);
  assert.match(nav, /Tài khoản/u);
});

test('v2.6.0 web dung cookie HttpOnly qua credentials include va refresh session', () => {
  const auth = readFileSync('lib/xac-thuc.ts','utf8');
  assert.match(auth, /credentials: "include"/);
  assert.match(auth, /\/xac-thuc\/lam-moi/);
  assert.match(auth, /SU_KIEN_XAC_THUC/);
});
