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

test('storefront co gio hang va them vao gio bang cau hinh mac dinh', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  assert.match(detail, /themBienTheVaoGio/);
  assert.match(detail, /Thêm \$\{so_luong\} vào giỏ/u);
  assert.match(detail, /Cấu hình mặc định/u);
  assert.doesNotMatch(detail, /Chọn màu sắc/u);
  assert.match(page, /cấu hình mặc định/u);
  assert.doesNotMatch(page, /chọn màu sắc/u);
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
  assert.doesNotMatch(card, /Chọn màu/u);
  assert.match(detail, /Cấu hình mặc định/u);
  assert.doesNotMatch(detail, /Chọn màu sắc/u);
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

test('v2.9.1 chi tiet tu chon bien the mac dinh va an lua chon mau', () => {
  const detail = readFileSync('app/san-pham/[duong_dan]/page.tsx', 'utf8');
  const card = readFileSync('components/the-san-pham.tsx', 'utf8');
  const data = readFileSync('lib/du-lieu-mau.ts', 'utf8');
  assert.match(detail, /find\(x => x\.so_luong_ton > 0\) \?\? san_pham\?\.bien_the\?\.\[0\]/);
  assert.match(detail, /Cấu hình mặc định/u);
  assert.match(detail, /themBienTheVaoGio\(bien_the\.ma_bien_the/);
  assert.doesNotMatch(detail, /color-options/);
  assert.doesNotMatch(detail, /Màu đã chọn/u);
  assert.doesNotMatch(card, /Chọn màu/u);
  assert.match(card, /Xem chi tiết →/u);
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


test("v2.9.1 anh chi tiet dung anh goc mac dinh, khong doi mau", () => {
  const detail = readFileSync("app/san-pham/[duong_dan]/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(detail, /product-photo-default/);
  assert.match(detail, /src=\{anh_goc\}/);
  assert.doesNotMatch(detail, /product-photo-colorized/);
  assert.doesNotMatch(detail, /anhBienTheUrl/);
  assert.match(css, /\.product-photo-default/);
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
  assert.match(page, /Tạo nhân viên bán hàng/u);
  assert.match(page, /Xếp ca/u);
  assert.match(page, /Admin Dashboard/u);
  assert.match(page, /Hồ sơ nhân viên bán hàng/u);
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
  assert.match(forgot, /liên kết đặt lại mật khẩu sẽ được gửi vào email đó/u);
  assert.match(forgot, /Gửi liên kết đặt lại/u);
});


test("v2.8.4 login van giu ghi nho va quen mat khau sau khi nang layout", () => {
  const login = readFileSync("app/dang-nhap/page.tsx", "utf8");
  const register = readFileSync("app/dang-ky/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.doesNotMatch(login, /Phiên đăng nhập dùng cookie HttpOnly/u);
  assert.match(login, /cine-auth-options/);
  assert.match(login, /Ghi nhớ tài khoản/u);
  assert.match(login, /Quên mật khẩu\?/u);
  assert.match(login, /cine-auth-submit/);
  assert.match(login, /href="\/dang-ky">Đăng ký<\/Link>/u);
  assert.match(register, />Tạo tài khoản<\/h1>/u);
  assert.match(register, /"Đăng ký"/u);
  assert.match(css, /\.cine-auth-options/);
});


test("v2.8.5 auth canh giua ho so sua email va logout ro rang", () => {
  const login = readFileSync("app/dang-nhap/page.tsx", "utf8");
  const register = readFileSync("app/dang-ky/page.tsx", "utf8");
  const account = readFileSync("app/tai-khoan/page.tsx", "utf8");
  const nav = readFileSync("components/thanh-dieu-huong.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(login, /da_dang_xuat/);
  assert.match(register, /cine-auth-card-register/);
  assert.match(register, /cine-auth-submit/);
  assert.match(account, /type="email" value=\{thu_dien_tu\}/);
  assert.match(nav, /window\.location\.replace\("\/dang-nhap\?da_dang_xuat=1"\)/);
  assert.match(css, /\.cine-auth-shell/);
  assert.match(css, /\.cine-auth-submit/);
});


test("v2.8.6 nhan dang Brave va cap nhat nhan phien", () => {
  const browser = readFileSync("lib/trinh-duyet.ts", "utf8");
  const auth = readFileSync("lib/xac-thuc.ts", "utf8");
  const account = readFileSync("app/tai-khoan/page.tsx", "utf8");
  assert.match(browser, /navigator/);
  assert.match(browser, /isBrave/);
  assert.match(browser, /Brave/);
  assert.match(auth, /nhanDangTrinhDuyet/);
  assert.match(account, /capNhatPhienHienTai/);
  assert.match(account, /hienThiNhanTrinhDuyet/);
  assert.match(browser, /phiên cũ chưa phân biệt Brave\/Chrome/u);
});

test("v2.8.6 ho so doc lai PostgreSQL va co doi mat khau", () => {
  const account = readFileSync("app/tai-khoan/page.tsx", "utf8");
  const lib = readFileSync("lib/tai-khoan.ts", "utf8");
  assert.match(account, /await capNhatHoSo/);
  assert.doesNotMatch(account, /xac_nhan = await layHoSo/);
  assert.match(account, /Đã lưu thông tin tài khoản vào PostgreSQL/u);
  assert.match(account, /Đổi mật khẩu/u);
  assert.match(account, /Mật khẩu hiện tại/u);
  assert.match(account, /hien_do_manh/);
  assert.match(lib, /doiMatKhau/);
  assert.match(lib, /\/tai-khoan\/doi-mat-khau/);
});


test("v2.9.1 bo doi mau anh, giu admin kich hoat va logout khong tu refresh", () => {
  const detail = readFileSync("app/san-pham/[duong_dan]/page.tsx", "utf8");
  const route = readFileSync("app/api/anh-bien-the/route.ts", "utf8");
  const helper = readFileSync("lib/anh-bien-the.ts", "utf8");
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const auth = readFileSync("lib/xac-thuc.ts", "utf8");
  assert.match(detail, /src=\{anh_goc\}/);
  assert.doesNotMatch(detail, /anh_bien_the/);
  assert.doesNotMatch(detail, /anhBienTheUrl/);
  assert.match(helper, /\/api\/anh-bien-the/);
  assert.match(route, /polygon points/);
  assert.match(admin, /Kích hoạt/u);
  assert.match(admin, /status-badge/);
  assert.match(auth, /localStorage\.setItem\(KHOA_DA_DANG_XUAT, "1"\)/);
  assert.match(auth, /localStorage\.removeItem\(KHOA_DA_DANG_XUAT\)/);
});


test("v2.9.3 register phone address va mot vai tro Admin", () => {
  const register = readFileSync("app/dang-ky/page.tsx", "utf8");
  const account = readFileSync("app/tai-khoan/page.tsx", "utf8");
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const auth = readFileSync("lib/xac-thuc.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(register, /Số điện thoại/u);
  assert.match(register, /Địa chỉ/u);
  assert.match(account, /Địa chỉ mặc định/u);
  assert.match(admin, /Admin Dashboard/u);
  assert.doesNotMatch(admin, /Admin có toàn quyền hệ thống/u);
  assert.doesNotMatch(admin, /Bảo vệ/u);
  assert.doesNotMatch(auth, /SIEU_QUAN_TRI|QUAN_TRI/);
  assert.match(css, /account-panel-security/u);
  assert.match(css, /admin-protected-badge/u);
});

test('v2.8.9 dung bo cuc CineBooking Pro va nen 3D duoc cung cap', () => {
  const pkg = docJson('package.json');
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const css = readFileSync('app/globals.css', 'utf8');
  assert.equal(pkg.devDependencies.tailwindcss, '^4.1.0');
  assert.equal(pkg.devDependencies['@tailwindcss/postcss'], '^4.1.0');
  assert.equal(existsSync('postcss.config.mjs'), true);
  assert.equal(existsSync('public/backgrounds/nhienin3d-main.jpg'), true);
  assert.match(layout, /ThanhDieuHuong/);
  assert.match(layout, /ChanTrang/);
  assert.match(layout, /max-w-7xl/);
  assert.match(css, /@import "tailwindcss"/);
  assert.match(css, /url\("\/backgrounds\/nhienin3d-main\.jpg"\)/);
  assert.match(css, /menu-drawer-backdrop/);
});


test("v2.9.0 web theo CineBooking va admin co kich hoat xoa tai khoan", () => {
  const account = readFileSync("app/tai-khoan/page.tsx", "utf8");
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const login = readFileSync("app/dang-nhap/page.tsx", "utf8");
  const register = readFileSync("app/dang-ky/page.tsx", "utf8");
  const reset = readFileSync("app/dat-lai-mat-khau/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(account, /cine-profile-shell/);
  assert.match(account, /Tài khoản của tôi/u);
  assert.match(admin, /cine-admin-tabs/);
  assert.match(admin, /cine-customer-card/);
  assert.match(admin, /xoaTaiKhoan/);
  assert.match(admin, /Kích hoạt/u);
  assert.match(admin, />Xóa<\/button>/u);
  assert.match(lib, /xoaNguoiDung/);
  assert.match(lib, /xoaNguoiDung[\s\S]*method: "POST"/);
  assert.match(login, /cine-auth-card-login/);
  assert.match(register, /cine-auth-card-register/);
  assert.match(reset, /cine-auth-card/);
  assert.match(css, /\.cine-profile-shell/);
  assert.match(css, /\.cine-admin-shell/);
});


test("v2.9.1 bo chon mau san pham va dung bien the mac dinh", () => {
  const detail = readFileSync("app/san-pham/[duong_dan]/page.tsx", "utf8");
  const card = readFileSync("components/the-san-pham.tsx", "utf8");
  const cart = readFileSync("app/gio-hang/page.tsx", "utf8");
  assert.match(detail, /Cấu hình mặc định/u);
  assert.match(detail, /find\(x => x\.so_luong_ton > 0\)/);
  assert.doesNotMatch(detail, /Chọn màu sắc/u);
  assert.doesNotMatch(detail, /color-options/);
  assert.doesNotMatch(card, /Chọn màu/u);
  assert.doesNotMatch(card, /color-chip/);
  assert.doesNotMatch(cart, /mau_sac/);
});


test("v2.9.3 Admin hard-unlock va Ca lam/Xep ca theo CineBooking Pro", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const auth = readFileSync("lib/xac-thuc.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(lib, /kichHoatNguoiDung/);
  assert.match(lib, /\/quan-tri\/nguoi-dung\/\$\{id\}\/kich-hoat/);
  assert.match(lib, /khoaNguoiDung/);
  assert.match(admin, /await kichHoatNguoiDung\(user\.id\)/);
  assert.match(admin, /await khoaNguoiDung\(user\.id\)/);
  assert.match(admin, /cine-shift-management-grid/);
  assert.doesNotMatch(admin, /STAFF OPERATIONS/);
  assert.match(admin, /Xếp ca nhân viên/u);
  assert.match(admin, /phanCaTheoNgay/);
  assert.match(css, /\.cine-shift-management-grid/);
  assert.match(css, /\.cine-schedule-groups/);
  assert.match(auth, /ADMIN: "Admin"/);
  assert.doesNotMatch(admin, /SIEU_QUAN_TRI|QUAN_TRI/);
});


test("v2.9.4 request rong khong gan application json va ho so giu ket qua da luu", () => {
  const adminLib = readFileSync("lib/quan-tri.ts", "utf8");
  const accountLib = readFileSync("lib/tai-khoan.ts", "utf8");
  const authLib = readFileSync("lib/xac-thuc.ts", "utf8");
  const accountPage = readFileSync("app/tai-khoan/page.tsx", "utf8");
  for (const source of [adminLib, accountLib, authLib]) {
    assert.match(source, /init\.body !== undefined && init\.body !== null/);
    assert.match(source, /headers\.set\("Content-Type", "application\/json"\)/);
    assert.match(source, /cache: init\.cache \?\? "no-store"/);
  }
  assert.match(adminLib, /kichHoatNguoiDung[\s\S]*method: "POST"/);
  assert.match(adminLib, /xoaNguoiDung[\s\S]*method: "POST"/);
  assert.match(accountPage, /const da_luu = await capNhatHoSo/);
  assert.doesNotMatch(accountPage, /let xac_nhan = da_luu/);
  assert.match(accountPage, /Không GET lại ngay sau khi/u);
});


test("v2.9.5 form lon, tao nhan vien ban hang va xoa user bang POST", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const account = readFileSync("app/tai-khoan/page.tsx", "utf8");
  const adminLib = readFileSync("lib/quan-tri.ts", "utf8");
  const auth = readFileSync("lib/xac-thuc.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /Tạo nhân viên bán hàng/u);
  assert.match(admin, /Xác nhận mật khẩu/u);
  assert.doesNotMatch(admin, /Nhân viên chỉ tập trung bán hàng/u);
  assert.match(admin, /Lưu trạng thái/u);
  assert.doesNotMatch(admin, /value="QUAN_LY"/);
  assert.doesNotMatch(admin, /placeholder="Chức danh"/u);
  assert.match(adminLib, /nguoi-dung\/\$\{id\}\/xoa/);
  assert.match(adminLib, /body: JSON\.stringify\(\{ xac_nhan: true \}\)/);
  assert.match(auth, /NHAN_VIEN: "Nhân viên bán hàng"/u);
  assert.match(account, /setHoSo\(da_luu\)/);
  assert.doesNotMatch(account, /xac_nhan = await layHoSo/);
  assert.match(css, /cine-staff-create-layout/);
  assert.match(css, /cine-staff-card-v295/);
  assert.match(css, /min-height:48px/);
  assert.match(css, /font-size:15px/);
});


test("v2.9.6 doi nen nut gio hang sang dark glass", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /\.cart-button\{[^}]*background:linear-gradient\(135deg,rgba\(23,32,51,\.98\),rgba\(15,23,42,\.98\)\)/);
  assert.match(css, /\.cart-button b\{[^}]*background:linear-gradient\(135deg,#8b5cf6,#22d3ee\)/);
});


test("v2.9.7 ho so nhan vien luu trang thai qua POST va bo panel phan quyen", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(lib, /capNhatNhanVien[\s\S]*\/nhan-vien\/\$\{id\}\/trang-thai[\s\S]*method: "POST"/);
  assert.match(admin, /const da_luu = await capNhatNhanVien/);
  assert.match(admin, /const ds_moi = await layNhanVien\(\)/);
  assert.match(admin, /F5 vẫn giữ trạng thái này/u);
  assert.doesNotMatch(admin, /cine-staff-permissions/);
  assert.doesNotMatch(admin, /PHÂN QUYỀN/u);
  assert.match(css, /cine-staff-create-layout\{display:block;max-width:760px/);
  assert.doesNotMatch(css, /\.cine-staff-permissions\{/);
});


test("v2.9.8 vai tro Admin va Nhan vien la nhan co dinh khong co dropdown", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /Tài khoản khách hàng/u);
  assert.match(admin, /Nhân viên bán hàng/u);
  assert.match(admin, /Admin Dashboard/u);
  assert.doesNotMatch(admin, /Admin có toàn quyền hệ thống/u);
  assert.doesNotMatch(admin, /<select value=\{u\.vai_tro\}/);
  assert.doesNotMatch(admin, /doiVaiTro/);
  assert.doesNotMatch(lib, /ho_ten" \| "so_dien_thoai" \| "vai_tro"/);
  assert.match(css, /\.cine-customer-card\{/);
});


test("v2.9.9 admin bo kicker va quan ly ca co chinh sua xoa", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.doesNotMatch(admin, /NHIENIN3D · ADMIN/u);
  assert.match(admin, /06:00–14:00/u);
  assert.match(admin, /14:00–22:00/u);
  assert.match(admin, /batDauSuaCa/);
  assert.match(admin, /xoaCa\(c\)/);
  assert.match(admin, /Hủy chỉnh sửa/u);
  assert.match(lib, /xoaCaLam[\s\S]*method: "POST"/);
  assert.match(css, /cine-shift-template-actions/);
  assert.match(css, /cine-shift-form-actions/);
});


test("v2.10.0 xep ca cho sua xoa va bo STAFF OPERATIONS", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.doesNotMatch(admin, /STAFF OPERATIONS/);
  assert.match(admin, /batDauSuaPhanCa/);
  assert.match(admin, /Chỉnh sửa phân ca/u);
  assert.match(admin, /soPhanCaCuaCa/);
  assert.match(lib, /xoaCaLam[\s\S]*ca-lam\/\$\{id\}\/xoa[\s\S]*method: "POST"/);
  assert.match(lib, /xoaPhanCa[\s\S]*phan-ca\/\$\{id\}\/xoa[\s\S]*method: "POST"/);
  assert.match(css, /cine-schedule-actions/);
});


test("v2.10.1 tach khach hang va luu cap nhat bang POST", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const footer = readFileSync("components/chan-trang.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /Tài khoản khách hàng/u);
  assert.match(admin, /khachHang = useMemo/);
  assert.match(admin, /Lưu thông tin/u);
  assert.match(admin, /PostgreSQL chưa xác nhận thay đổi ca làm việc/u);
  assert.match(admin, /PostgreSQL chưa xác nhận thay đổi phân ca/u);
  assert.match(lib, /capNhatNguoiDung[\s\S]*method: "POST"/);
  assert.match(lib, /capNhatCaLam[\s\S]*method: "POST"/);
  assert.match(lib, /capNhatPhanCa[\s\S]*method: "POST"/);
  assert.doesNotMatch(footer, /Sản phẩm in 3D theo yêu cầu với cấu hình mua hàng mặc định/u);
  assert.match(css, /cine-customer-form-grid/);
});


test("v2.10.2 ho so va doi mat khau gui POST on dinh", () => {
  const lib = readFileSync("lib/tai-khoan.ts", "utf8");
  const account = readFileSync("app/tai-khoan/page.tsx", "utf8");
  assert.match(lib, /capNhatHoSo[\s\S]*method: "POST"/);
  assert.match(lib, /doiMatKhau[\s\S]*method: "POST"/);
  assert.match(lib, /cache: "no-store"/);
  assert.match(account, /setDiaChi\(da_luu\.dia_chi\?\.\[0\]\?\.dia_chi_cu_the \|\| ""\)/);
  assert.match(account, /window\.location\.replace\("\/dang-nhap\?doi_mat_khau=thanh_cong"\)/);
});

test("v2.11.0 web co tab tong quan va dashboard CineBooking", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /type TabQuanTri = "tong-quan"/);
  assert.match(admin, /useState<TabQuanTri>\("tong-quan"\)/);
  assert.match(admin, /Doanh thu hôm nay/u);
  assert.match(admin, /Trạng thái đơn hàng/u);
  assert.match(admin, /Đơn hàng gần đây/u);
  assert.match(lib, /doanh_thu_theo_ngay/);
  assert.match(lib, /top_san_pham_30_ngay/);
  assert.match(lib, /ton_kho_thap/);
  assert.match(css, /cine-dashboard-period-cards/);
  assert.match(css, /cine-revenue-track/);
});


test("v2.12.0 web co quan tri don hang san pham ton kho va nhat ky Admin", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /\["don-hang", "Đơn hàng"\]/u);
  assert.match(admin, /\["san-pham", "Sản phẩm"\]/u);
  assert.match(admin, /\["kho", "Kho"\]/u);
  assert.match(admin, /\["nhat-ky", "Nhật ký Admin"\]/u);
  assert.match(admin, /Quản trị đơn hàng/u);
  assert.match(admin, /Quản lý sản phẩm/u);
  assert.match(admin, /Kho hàng/u);
  assert.match(admin, /Lịch sử xử lý/u);
  assert.match(lib, /export type AdminDonHang/);
  assert.match(lib, /layChiTietDonHangAdmin/);
  assert.match(lib, /capNhatSanPhamAdmin/);
  assert.match(lib, /layNhatKyAdmin/);
  assert.match(css, /v2\.12\.0 - quản trị đơn hàng/u);
  assert.match(css, /cine-order-detail-v212/);
  assert.match(css, /cine-product-admin-card-v212/);
  assert.match(css, /cine-audit-row-v212/);
});


test("v2.12.1 san pham ton kho chon bang dropdown va chi mo mot san pham", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /san_pham_chon_id/);
  assert.match(admin, /sanPhamDangChon/);
  assert.match(admin, /Chọn sản phẩm cần chỉnh/u);
  assert.match(admin, /sanPhamDaLoc\.map\(sp => <option/);
  assert.match(admin, /cine-product-single-v2121/);
  assert.match(css, /cine-product-picker-v2121/);
});


test("v2.12.2 storefront hien thi 6 san pham moi hang va co du 12 san pham mau", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  const data = readFileSync("lib/du-lieu-mau.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(home, /<b>12<\/b><span>Sản phẩm mẫu<\/span>/u);
  assert.match(data, /N3D-ORG-011/);
  assert.match(data, /N3D-MAKER-012/);
  assert.match(css, /v2\.12\.2 - storefront 6 sản phẩm mỗi hàng/u);
  assert.match(css, /repeat\(6,minmax\(0,1fr\)\)/);
});


test("v2.13.0 hai san pham bo sung dung anh san pham that", () => {
  const data = readFileSync("lib/du-lieu-mau.ts", "utf8");
  assert.match(data, /N3D-ORG-011[\s\S]*USd15fedca5591f3/u);
  assert.match(data, /N3D-MAKER-012[\s\S]*USd971c27ce7a1e3/u);
  assert.doesNotMatch(data, /gridfinity-2x3-pen-holder\.svg/u);
  assert.doesNotMatch(data, /raspberry-pi-5-40mm-fan-case\.svg/u);
});

test("v2.13.0 web CRUD san pham va chuan hoa anh 1000x800", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const anh = readFileSync("lib/anh-bien-the.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /chuanHoaAnhSanPham/);
  assert.match(admin, /canvas\.width = 1000/);
  assert.match(admin, /canvas\.height = 800/);
  assert.match(admin, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(admin, /Thêm sản phẩm mới/u);
  assert.match(admin, /Xóa sản phẩm/u);
  assert.match(lib, /taoSanPhamAdmin/);
  assert.match(lib, /xoaSanPhamAdmin/);
  assert.match(anh, /startsWith\("data:image\/"\)/);
  assert.match(css, /cine-product-image-preview-v213/);
});


test("v2.14.0 tach rieng san pham va kho trong Admin", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /type TabQuanTri = [^;]*"san-pham" \| "kho"/);
  assert.match(admin, /\["san-pham", "Sản phẩm"\]/u);
  assert.match(admin, /\["kho", "Kho"\]/u);
  assert.match(admin, /<h2>Quản lý sản phẩm<\/h2>/u);
  assert.match(admin, /<h2>Kho hàng<\/h2>/u);
  assert.match(admin, /Tồn kho khởi tạo 0; cập nhật tại tab Kho/u);
  assert.doesNotMatch(admin, /<span>Tồn kho ban đầu<\/span>/u);
  assert.match(admin, /danhSachKho/);
  assert.match(admin, /thongKeKho/);
  assert.match(admin, /cine-inventory-table-card-v214/);
  assert.match(css, /v2\.14\.0 - tách quản lý sản phẩm và kho/u);
  assert.match(css, /cine-inventory-stats-v214/);
  assert.match(css, /cine-stock-state-v214/);
});


test("v2.15.0 web co danh muc bien the nang cao duyet danh gia va bao cao CSV", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /\["danh-muc", "Danh mục"\]/u);
  assert.match(admin, /\["danh-gia", "Đánh giá"\]/u);
  assert.match(admin, /\["bao-cao", "Báo cáo"\]/u);
  assert.match(admin, /Tạo biến thể mới/u);
  assert.match(admin, /Duyệt đánh giá sản phẩm/u);
  assert.match(admin, /Xuất báo cáo/u);
  assert.match(lib, /taoDanhMucAdmin/);
  assert.match(lib, /taoBienTheAdmin/);
  assert.match(lib, /capNhatDanhGiaAdmin/);
  assert.match(lib, /layBaoCaoCsvAdmin/);
  assert.match(css, /v2\.15\.0 - danh mục, biến thể nâng cao, duyệt đánh giá và báo cáo CSV/u);
});


test("v2.15.1 web hien thi thanh toan doanh thu va xac nhan da giao", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /Đã giao \/ hoàn tất/u);
  assert.match(admin, /Thanh toán & doanh thu/u);
  assert.match(admin, /Xác nhận đã giao & ghi doanh thu/u);
  assert.match(admin, /Ghi nhận thanh toán & doanh thu/u);
  assert.match(admin, /canGhiNhanDoanhThuDonDaGiao/);
  assert.match(admin, /Đã ghi nhận/u);
  assert.match(admin, /non-COD|Non-COD/u);
  assert.match(css, /v2\.15\.1 - thanh toán và ghi nhận doanh thu/u);
  assert.match(css, /cine-order-payment-v2151/);
});


test("v2.15.2 web co xuat Excel va footer khong con ghi chu nen", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const footer = readFileSync("components/chan-trang.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /taiBaoCaoExcel/);
  assert.match(admin, /Xuất Excel/u);
  assert.match(lib, /layBaoCaoExcelAdmin/);
  assert.match(lib, /\/bao-cao\/\$\{loai\}\/excel/);
  assert.doesNotMatch(footer, /Nền giao diện dùng ảnh 3D do người dùng cung cấp/u);
  assert.match(css, /v2\.15\.2 - xuất Excel và tinh gọn footer/u);
});


test("v2.15.3 dashboard ghi ro don ghi nhan doanh thu va don moi", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  assert.match(admin, /don_ghi_nhan_doanh_thu_theo_ky\.hom_nay/);
  assert.match(admin, /đơn ghi nhận doanh thu/u);
  assert.match(admin, /đơn mới phát sinh/u);
  assert.match(admin, /Số đơn và doanh thu đều theo thời điểm thanh toán\/ghi nhận/u);
  assert.match(lib, /don_ghi_nhan_doanh_thu_theo_ky/);
});

test("v2.15.5 tab Admin tu gian kin chieu ngang tung hang", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  assert.match(admin, /className="cine-admin-tabs"/);
  assert.match(css, /v2\.15\.5 - tab Admin tự giãn kín chiều ngang từng hàng/u);
  assert.match(css, /\.cine-admin-tabs\{[\s\S]*flex-wrap:wrap/);
  assert.match(css, /justify-content:flex-start/);
  assert.match(css, /width:100%/);
  assert.match(css, /flex:1 1 150px/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*flex-basis:100%/);
});


test("v2.16.0 web co tab CRUD vat lieu va mau sac", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /\["tham-chieu", "Vật liệu & màu"\]/u);
  assert.match(admin, /Thêm vật liệu/u);
  assert.match(admin, /Thêm màu/u);
  assert.match(admin, /so_bien_the/);
  assert.match(lib, /taoVatLieuAdmin/);
  assert.match(lib, /xoaMauSacAdmin/);
  assert.match(css, /cine-reference-grid-v216/);
});

test("v2.16.0 web loc kho nang cao va hien lich su dieu chinh ton", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(admin, /kho_loc_ton/);
  assert.match(admin, /kho_loc_vat_lieu/);
  assert.match(admin, /kho_loc_mau/);
  assert.match(admin, /kho_loc_hien_thi/);
  assert.match(admin, /Lịch sử (?:điều chỉnh tồn|nhập \/ xuất \/ điều chỉnh kho)/u);
  assert.match(lib, /layLichSuKhoAdmin/);
  assert.match(css, /cine-stock-filters-v216/);
  assert.match(css, /cine-stock-history-v216/);
});


test("v2.17.0 web co canh bao ton kho theo nguong cau hinh", () => {
  const page = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  assert.match(page, /Cảnh báo tồn kho/u);
  assert.match(page, /Ngưỡng cảnh báo sắp hết/u);
  assert.match(page, /nguongKho/);
  assert.match(lib, /layCauHinhKhoAdmin/);
  assert.match(lib, /capNhatCauHinhKhoAdmin/);
});

test("v2.17.0 web lich su kho co loai nguyen nhan va nguoi thao tac", () => {
  const page = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  assert.match(page, /Nhập kho/);
  assert.match(page, /Xuất kho/);
  assert.match(page, /Lý do điều chỉnh/u);
  assert.match(lib, /loai_bien_dong/);
  assert.match(lib, /chenh_lech/);
});


test("v2.17.1 form tao bien the khong chong o nhap va khong che nhan", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /v2\.17\.1 - sửa form Tạo biến thể/u);
  assert.match(css, /grid-template-columns:minmax\(0,1\.4fr\) minmax\(0,1\.15fr\) minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(css, /cine-variant-create-v215 label\{[\s\S]*min-width:0/);
  assert.match(css, /cine-variant-create-v215 input:not\(\[type="checkbox"\]\),[\s\S]*box-sizing:border-box/);
  assert.match(css, /white-space:normal/);
  assert.match(css, /@media\(max-width:980px\)[\s\S]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:620px\)[\s\S]*grid-template-columns:1fr/);
});


test("v2.18.0 web import CSV Excel co preview xac nhan va phieu nhap", () => {
  const page = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(page, /Nhập kho nhanh theo lô/u);
  assert.match(page, /Chọn CSV \/ Excel/u);
  assert.match(page, /Tải CSV mẫu/u);
  assert.match(page, /Xác nhận nhập kho/u);
  assert.match(page, /Phiếu nhập gần đây/u);
  assert.match(lib, /kiemTraTepNhapKhoAdmin/);
  assert.match(lib, /nhapKhoTheoLoAdmin/);
  assert.match(lib, /layPhieuNhapKhoAdmin/);
  assert.match(css, /v2\.18\.0 - nhập kho theo lô/u);
  assert.match(css, /cine-batch-import-v218/);
});

test("v2.18.0 web hien trang thai va gui canh bao kho email thu cong", () => {
  const page = readFileSync("app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("lib/quan-tri.ts", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(page, /Cảnh báo tồn kho qua email/u);
  assert.match(page, /LOW_STOCK_EMAIL_ENABLED/);
  assert.match(page, /Kiểm tra & gửi ngay/u);
  assert.match(lib, /TrangThaiCanhBaoKhoEmailAdmin/);
  assert.match(lib, /layTrangThaiCanhBaoKhoEmailAdmin/);
  assert.match(lib, /guiCanhBaoKhoEmailAdmin/);
  assert.match(css, /cine-stock-email-v218/);
});

test("v2.18.2 dropdown vat lieu mau Admin de doc va tuong phan cao", () => {
  const page = readFileSync("app/quan-tri/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(page, /cine-select-readable-v2182/);
  assert.match(page, /Mặc định \/ chưa chọn/u);
  assert.match(page, /x\.ma_vat_lieu[^\n]*x\.ten_vat_lieu/);
  assert.match(page, /x\.ma_mau[^\n]*x\.ten_mau/);
  assert.match(css, /v2\.18\.2 - tăng độ tương phản/u);
  assert.match(css, /color-scheme:dark/);
  assert.match(css, /cine-select-readable-v2182 option\{/);
  assert.match(css, /font-size:16px/);
  assert.match(css, /option:checked/);
});


test("v2.18.3 Next dev co lenh HTTPS local", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.version, "3.9.0");
  assert.match(pkg.scripts["dev:https"], /next dev --experimental-https/);
});

test("v2.19.2 Admin Dashboard bo dong mo ta quyen dai", () => {
  const admin = readFileSync("app/quan-tri/page.tsx", "utf8");
  assert.match(admin, /<h1>Admin Dashboard<\/h1>/u);
  assert.doesNotMatch(admin, /Admin có toàn quyền hệ thống/u);
});
