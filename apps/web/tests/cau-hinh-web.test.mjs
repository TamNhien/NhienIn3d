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

test('storefront co gio hang va them vao gio tu chi tiet sau khi chon mau', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.match(detail, /themBienTheVaoGio/);
  assert.match(detail, /Thêm \$\{so_luong\} vào giỏ/u);
  assert.match(page, /gio-hang/);
  assert.match(page, /chọn màu sắc/u);
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
  assert.match(detail, /Chọn màu sắc/u);
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

test('v2.6.1 bo xem 3D san pham va chi hien thi anh tham khao', () => {
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.equal(existsSync('components/trinh-xem-anh-3d.tsx'), false);
  assert.match(detail, /product-detail-photo/);
  assert.doesNotMatch(detail, /TrinhXemAnh3D/);
  assert.doesNotMatch(detail, /3D thật/u);
});

test('v2.6.1 chi tiet cho chon mau va card khong them thang bien the mac dinh', () => {
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  const card = readFileSync('components/the-san-pham.tsx', 'utf8');
  const data = readFileSync('lib/du-lieu-mau.ts', 'utf8');
  assert.match(detail, /Chọn màu sắc/u);
  assert.match(detail, /color-options/);
  assert.match(detail, /Màu đã chọn/u);
  assert.match(detail, /themBienTheVaoGio\(bien_the\.ma_bien_the/);
  assert.match(card, /Chọn màu/u);
  assert.doesNotMatch(card, /onThem/);
  assert.match(data, /BO_MAU_FALLBACK/);
  assert.match(data, /BT\$\{String\(mau_index \+ 1\)/);
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


test("v2.7.0 web co quen mat khau va trang dat lai tu link email", () => {
  for (const tep of ["app/quen-mat-khau/page.tsx", "app/dat-lai-mat-khau/page.tsx"]) assert.equal(existsSync(tep), true, `Thieu ${tep}`);
  const login = readFileSync("app/dang-nhap/page.tsx", "utf8");
  const auth = readFileSync("lib/xac-thuc.ts", "utf8");
  const reset = readFileSync("app/dat-lai-mat-khau/page.tsx", "utf8");
  assert.match(login, /Quên mật khẩu\?/u);
  assert.match(auth, /\/xac-thuc\/quen-mat-khau/);
  assert.match(auth, /\/xac-thuc\/dat-lai-mat-khau/);
  assert.match(reset, /search\.get\("ma"\)/);
  assert.match(reset, /Mật khẩu mới/u);
  assert.match(reset, /dat_lai=thanh_cong/);
});


test("v2.8.2 chon mau lam anh preview doi mau", () => {
  const detail = readFileSync("app/san-pham/[duong_dan]/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(detail, /mau_xem_truoc/);
  assert.match(detail, /product-color-tint/);
  assert.match(detail, /color-preview-badge/);
  assert.match(css, /\.product-color-tint/);
});

test("v2.8.2 nut tai khoan hien thong tin va dang xuat", () => {
  const nav = readFileSync("components/thanh-dieu-huong.tsx", "utf8");
  const page = readFileSync("app/tai-khoan/page.tsx", "utf8");
  const auth = readFileSync("lib/xac-thuc.ts", "utf8");
  assert.match(nav, /account-popover/);
  assert.match(nav, /Thông tin tài khoản/u);
  assert.match(nav, /Đăng xuất/u);
  assert.match(page, /Lưu thay đổi/u);
  assert.match(page, /Phiên đăng nhập/u);
  assert.match(auth, /finally/);
});

test("v2.8.2 co giao dien admin tao nhan vien va xep ca", () => {
  const page = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  assert.match(page, /Tạo tài khoản nhân viên/u);
  assert.match(page, /XẾP CA/u);
  assert.match(page, /Quản trị hệ thống/ui);
  assert.match(page, /Hồ sơ nhân sự/u);
  assert.match(lib, /capNhatNhanVien/);
  assert.match(lib, /\/quan-tri\/nhan-vien/);
  assert.match(lib, /\/quan-tri\/phan-ca/);
});

test("v2.8.2 dang ky va dat lai mat khau co do manh checklist va an hien", () => {
  const comp = readFileSync("components/truong-mat-khau.tsx", "utf8");
  const register = readFileSync("app/dang-ky/page.tsx", "utf8");
  const reset = readFileSync("app/dat-lai-mat-khau/page.tsx", "utf8");
  assert.match(comp, /danhGiaMatKhau/);
  assert.match(comp, /Tối thiểu 12 ký tự/u);
  assert.match(comp, /Có chữ hoa A–Z/u);
  assert.match(comp, /Có chữ thường a–z/u);
  assert.match(comp, /Có chữ số 0–9/u);
  assert.match(comp, /Có ký tự đặc biệt/u);
  assert.match(comp, /hien \? "text" : "password"/);
  assert.match(register, /hien_do_manh/);
  assert.match(reset, /hien_do_manh/);
});

test("v2.8.2 dang nhap co ghi nho tai khoan chi luu email", () => {
  const login = readFileSync("app/dang-nhap/page.tsx", "utf8");
  assert.match(login, /nhienin3d_ghi_nho_email/);
  assert.match(login, /localStorage\.setItem/);
  assert.match(login, /localStorage\.removeItem/);
  assert.match(login, /Ghi nhớ tài khoản/u);
  assert.doesNotMatch(login, /localStorage\.setItem\([^,]+,\s*mat_khau/);
});

test("v2.8.2 quen mat khau noi ro gui vao email dang ky", () => {
  const forgot = readFileSync("app/quen-mat-khau/page.tsx", "utf8");
  assert.match(forgot, /email đã dùng để đăng ký/u);
  assert.match(forgot, /gửi liên kết đặt lại mật khẩu vào chính địa chỉ email đó/u);
  assert.match(forgot, /Xác nhận và gửi email đặt lại/u);
});


test("v2.8.4 login bo dong mo ta, quen mat khau ngang hang ghi nho va nut dang nhap gon", () => {
  const login = readFileSync("app/dang-nhap/page.tsx", "utf8");
  const register = readFileSync("app/dang-ky/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.doesNotMatch(login, /Phiên đăng nhập dùng cookie HttpOnly/u);
  assert.match(login, /auth-options-row/);
  assert.match(login, /remember-account/);
  assert.match(login, /forgot-inline/);
  assert.match(login, /auth-login-button/);
  assert.match(login, /href="\/dang-ky">Đăng kí<\/Link>/u);
  assert.match(register, />Đăng kí<\/h1>/u);
  assert.match(register, /"Đăng kí"/u);
  assert.match(css, /min-width:132px/);
});
