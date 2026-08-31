import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const docJson = (duongDan) => JSON.parse(readFileSync(duongDan, "utf8"));

test("root khai bao npm workspaces cho API va Web", () => {
  const pkg = docJson("package.json");
  assert.deepEqual(pkg.workspaces, ["apps/api", "apps/web"]);
});

test("root co day du lenh test, typecheck va build", () => {
  const pkg = docJson("package.json");
  for (const ten of ["test", "typecheck", "build", "check", "ci", "audit:security"]) {
    assert.equal(typeof pkg.scripts?.[ten], "string", `Thieu script ${ten}`);
  }
});

test("cac tep cot loi cua du an ton tai", () => {
  for (const tep of [
    "docker-compose.yml",
    ".env.example",
    "apps/api/prisma/schema.prisma",
    "apps/api/src/main.ts",
    "apps/web/app/page.tsx"
  ]) assert.equal(existsSync(tep), true, `Thieu ${tep}`);
});

test("root khoa deepmerge-ts da va lo hong CVE-2026-40345", () => {
  const pkg = docJson("package.json");
  assert.equal(pkg.overrides?.["deepmerge-ts"], "8.0.1");
});

test("Docker API dung root workspace de ap dung root overrides bao mat", () => {
  const docker = readFileSync("apps/api/Dockerfile", "utf8");
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(docker, /COPY package\.json/);
  assert.match(docker, /npm install --workspace=@nhienin3d\/api/);
  assert.match(docker, /npm audit --audit-level=high/);
  assert.match(compose, /context: \./);
  assert.match(compose, /dockerfile: apps\/api\/Dockerfile/);
});

test("PostgreSQL Docker dung cong host 5434 va cong noi bo 5432", () => {
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(compose, /POSTGRES_PORT:-5434/);
  assert.match(compose, /@postgres:5432\//);
});

test("PostgreSQL 18 mount volume dung thu muc /var/lib/postgresql", () => {
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(compose, /nhienin3d-postgres-data:\/var\/lib\/postgresql\b/);
  assert.doesNotMatch(compose, /nhienin3d-postgres-data:\/var\/lib\/postgresql\/data/);
});

test("v2.14.0 tach rieng khu vuc san pham va kho", () => {
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(admin, /\["san-pham", "Sản phẩm"\]/u);
  assert.match(admin, /\["kho", "Kho"\]/u);
  assert.match(admin, /Quản lý sản phẩm/u);
  assert.match(admin, /Kho hàng/u);
  assert.match(admin, /so_luong_ton: 0/);
  assert.doesNotMatch(admin, /Tồn kho ban đầu/u);
  assert.match(admin, /cine-inventory-row-v214/);
  assert.match(admin, /Lưu kho/u);
  assert.match(css, /cine-inventory-head-v214/);
  assert.match(css, /cine-inventory-row-v214/);
});



test("v2.15.0 co danh muc bien the danh gia va bao cao CSV", () => {
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  assert.match(controller, /@Post\("danh-muc"\)/);
  assert.match(controller, /@Post\("san-pham\/:id\/bien-the"\)/);
  assert.match(controller, /@Post\("danh-gia\/:id\/trang-thai"\)/);
  assert.match(controller, /@Get\("bao-cao\/:loai"\)/);
  assert.match(admin, /\["danh-muc", "Danh mục"\]/u);
  assert.match(admin, /\["danh-gia", "Đánh giá"\]/u);
  assert.match(admin, /\["bao-cao", "Báo cáo"\]/u);
});


test("v2.15.1 ghi nhan doanh thu theo thanh toan va COD khi da giao", () => {
  const checkout = readFileSync("apps/api/src/thanh-toan/thanh-toan.service.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  assert.match(checkout, /phuong_thuc\.ma_phuong_thuc !== "COD"/);
  assert.match(checkout, /da_thanh_toan \? TrangThaiThanhToan\.DA_THANH_TOAN/);
  assert.match(service, /trang_thai_moi === TrangThaiDonHang\.HOAN_TAT/);
  assert.match(service, /TrangThaiThanhToan\.DA_THANH_TOAN/);
  assert.match(service, /doanhThuDaGhiNhan/);
  assert.match(admin, /Xác nhận đã giao & ghi doanh thu/u);
  assert.match(admin, /Thanh toán & doanh thu/u);
});



test("v2.15.2 fix typecheck seed, xuat Excel va bo ghi chu nen footer", () => {
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const footer = readFileSync("apps/web/components/chan-trang.tsx", "utf8");
  assert.match(seed, /tong_tien: unknown; trang_thai: TrangThaiDonHang/);
  assert.match(controller, /@Get\("bao-cao\/:loai\/excel"\)/);
  assert.match(service, /xuat_bao_cao_excel/);
  assert.match(service, /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
  assert.match(admin, /Xuất Excel/u);
  assert.doesNotMatch(footer, /Nền giao diện dùng ảnh 3D do người dùng cung cấp/u);
});


test("v2.15.3 dong bo so don voi ngay ghi nhan doanh thu", () => {
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  assert.match(service, /const so_don = doanhThuDaGhiNhan\.filter\(d => ngayVietNam\(d\.ngay_ghi_nhan\) === dateKey\)\.length/);
  assert.match(service, /don_ghi_nhan_doanh_thu_theo_ky/);
  assert.match(admin, /đơn ghi nhận doanh thu/u);
  assert.match(admin, /đơn mới phát sinh/u);
  assert.match(admin, /Số đơn và doanh thu đều theo thời điểm thanh toán\/ghi nhận/u);
  assert.match(lib, /don_ghi_nhan_doanh_thu_theo_ky/);
});



test("v2.15.5 tab Admin tu gian kin tung hang khong trong ben phai", () => {
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(css, /v2\.15\.5 - tab Admin tự giãn kín chiều ngang từng hàng/u);
  assert.match(css, /\.cine-admin-tabs\{[\s\S]*flex-wrap:wrap/);
  assert.match(css, /justify-content:flex-start/);
  assert.match(css, /flex:1 1 150px/);
  assert.match(css, /min-width:130px/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*flex-basis:100%/);
});

test("v2.16.0 co CRUD vat lieu mau va lich su ton kho", () => {
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  assert.match(controller, /@Post\("vat-lieu"\)/);
  assert.match(controller, /@Post\("mau-sac"\)/);
  assert.match(controller, /@Get\("kho\/lich-su"\)/);
  assert.match(admin, /\["tham-chieu", "Vật liệu & màu"\]/u);
  assert.match(admin, /Lịch sử điều chỉnh tồn/u);
});

test("root co lenh kiem tra so dong du lieu database", () => {
  const pkg = docJson("package.json");
  assert.equal(typeof pkg.scripts?.["db:kiem-tra-du-lieu"], "string");
});

test("V2 co migration nang cap khong ghi de migration V1", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290001_v001_khoi_tao/migration.sql"), true);
  assert.equal(existsSync("apps/api/prisma/migrations/202608290002_v002_gio_hang_thanh_toan/migration.sql"), true);
});

test("version v2.16.0 dong bo root API va Web", () => {
  assert.equal(readFileSync("VERSION", "utf8").trim(), "2.16.0");
  assert.equal(docJson("package.json").version, "2.16.0");
  assert.equal(docJson("apps/api/package.json").version, "2.16.0");
  assert.equal(docJson("apps/web/package.json").version, "2.16.0");
});

test("README co lich su phien ban tang dan den v2.16.0", () => {
  const readme = readFileSync("README.md", "utf8");
  const viTri = ["## v1.0.0", "## v1.0.1", "## v1.0.2", "## v1.0.3", "## v1.0.4", "## v1.0.5", "## v1.0.6", "## v1.0.7", "## v2.0.0", "## v2.1.0", "## v2.1.1", "## v2.2.0", "## v2.2.1", "## v2.3.0", "## v2.4.0", "## v2.4.1", "## v2.5.0", "## v2.6.0", "## v2.6.1", "## v2.7.0", "## v2.8.0", "## v2.8.1", "## v2.8.2", "## v2.8.3", "## v2.8.4", "## v2.8.5", "## v2.8.6", "## v2.8.7", "## v2.8.8", "## v2.8.9", "## v2.9.0", "## v2.9.1", "## v2.9.2", "## v2.9.3", "## v2.9.4", "## v2.9.5", "## v2.9.6", "## v2.9.7", "## v2.9.8", "## v2.9.9", "## v2.10.0", "## v2.10.1", "## v2.10.2", "## v2.11.0", "## v2.12.0", "## v2.12.1", "## v2.12.2", "## v2.12.3", "## v2.13.0", "## v2.14.0", "## v2.15.0", "## v2.15.1", "## v2.15.2", "## v2.15.3", "## v2.15.4", "## v2.15.5", "## v2.16.0"].map(x => readme.indexOf(x));
  assert.ok(viTri.every(x => x >= 0));
  assert.deepEqual([...viTri].sort((a,b)=>a-b), viTri);
});

test("v2.2.1 bo lich su va nhan version khoi storefront", () => {
  const home = readFileSync("apps/web/app/page.tsx", "utf8");
  assert.doesNotMatch(home, /LỊCH SỬ PHÁT TRIỂN/u);
  assert.doesNotMatch(home, /lich-su-phien-ban/);
  assert.doesNotMatch(home, />v2\.2\.1</);
});

test("v2.2.1 co cleanup cho tep lich su storefront con sot khi chep source de", () => {
  const cleanup = readFileSync("scripts/don-dep-legacy.mjs", "utf8");
  assert.match(cleanup, /apps\/web\/lib\/lich-su-phien-ban\.ts/);
  assert.match(docJson("package.json").scripts.test, /don-dep-legacy\.mjs/);
});

test("v2.2.1 co ba route commerce tach biet", () => {
  for (const tep of [
    "apps/web/app/san-pham/[duong_dan]/page.tsx",
    "apps/web/app/gio-hang/page.tsx",
    "apps/web/app/thanh-toan/page.tsx"
  ]) assert.equal(existsSync(tep), true, `Thieu ${tep}`);
});

test("v2.6.1 bo trinh xem 3D san pham khong chinh xac nhung giu anh local", () => {
  assert.equal(existsSync("apps/web/components/trinh-xem-anh-3d.tsx"), false);
  assert.equal(existsSync("apps/web/public/images/khoi-lap-phuong-banh-rang.jpg"), true);
  const cleanup = readFileSync("scripts/don-dep-legacy.mjs", "utf8");
  assert.match(cleanup, /trinh-xem-anh-3d\.tsx/);
});


test("v2.3.0 co migration yeu_thich va khong ghi de migration cu", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290003_v230_yeu_thich_tim_kiem/migration.sql"), true);
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  assert.match(schema, /model\s+YeuThich\b/);
  assert.match(schema, /@@map\("yeu_thich"\)/);
});

test("v2.3.0 co route danh sach san pham va yeu thich", () => {
  assert.equal(existsSync("apps/web/app/san-pham/page.tsx"), true);
  assert.equal(existsSync("apps/web/app/yeu-thich/page.tsx"), true);
  assert.equal(existsSync("apps/web/lib/yeu-thich.ts"), true);
});


test("v2.3.0 release chi cho phep dung version cua source va bat buoc lockfile", () => {
  const release = readFileSync("scripts/release.ps1", "utf8");
  assert.match(release, /sourceVersion/);
  assert.match(release, /package-lock\.json/);
  assert.match(release, /git push origin \$Version/);
});


test("v2.4.1 bo dai strip trang tri khoi trang chu", () => {
  const home = readFileSync("apps/web/app/page.tsx", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.doesNotMatch(home, /className="strip"/);
  assert.doesNotMatch(home, /<span>PLA<\/span>/);
  assert.doesNotMatch(css, /\.strip\{/);
});

test("v2.9.1 chi tiet san pham dung anh that va cau hinh mac dinh", () => {
  const detail = readFileSync("apps/web/app/san-pham/[duong_dan]/page.tsx", "utf8");
  const card = readFileSync("apps/web/components/the-san-pham.tsx", "utf8");
  assert.match(detail, /product-detail-photo/);
  assert.match(detail, /Cấu hình mặc định/u);
  assert.match(detail, /ma_bien_the/);
  assert.doesNotMatch(detail, /Chọn màu sắc/u);
  assert.doesNotMatch(detail, /color-option/);
  assert.doesNotMatch(detail, /TrinhXemAnh3D/);
  assert.doesNotMatch(card, /Chọn màu/u);
});


test("v2.4.1 san pham hien thi mac dinh theo thu tu ma tang dan", () => {
  const api = readFileSync("apps/api/src/san-pham/san-pham.controller.ts", "utf8");
  const home = readFileSync("apps/web/app/page.tsx", "utf8");
  const catalog = readFileSync("apps/web/app/san-pham/page.tsx", "utf8");
  assert.match(api, /sap_xep = "ma_tang"/);
  assert.match(home, /soThuTu/);
  assert.match(catalog, /Mã sản phẩm tăng dần/u);
});


test("v2.5.0 co migration danh_gia_san_pham va giu migration cu", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290004_v250_danh_gia_san_pham/migration.sql"), true);
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  assert.match(schema, /model\s+DanhGiaSanPham\b/);
  assert.match(schema, /@@map\("danh_gia_san_pham"\)/);
});

test("v2.8.0 co API danh gia, san pham lien quan va 23 bang seed", () => {
  assert.equal(existsSync("apps/api/src/danh-gia/danh-gia.controller.ts"), true);
  const sanPham = readFileSync("apps/api/src/san-pham/san-pham.controller.ts", "utf8");
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  const check = readFileSync("apps/api/prisma/kiem-tra-du-lieu.ts", "utf8");
  assert.match(sanPham, /lien_quan/);
  assert.match(seed, /SEED_V250_DANH_GIA_SAN_PHAM/);
  assert.match(check, /dữ liệu mẫu tĩnh|Dữ liệu mẫu tĩnh/u);
});

test("v2.6.0 co migration tai khoan va phan quyen 5 vai tro", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290005_v260_tai_khoan_phan_quyen/migration.sql"), true);
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  assert.match(schema, /ADMIN/);
  assert.doesNotMatch(schema, /SIEU_QUAN_TRI|QUAN_TRI/);
  assert.match(schema, /so_lan_dang_nhap_that_bai/);
  assert.match(schema, /phien_ban_mat_khau/);
});

test("v2.6.0 co giao dien dang ky dang nhap va tai khoan", () => {
  for (const tep of ["apps/web/app/dang-ky/page.tsx", "apps/web/app/dang-nhap/page.tsx", "apps/web/app/tai-khoan/page.tsx", "apps/web/lib/xac-thuc.ts"]) {
    assert.equal(existsSync(tep), true, `Thieu ${tep}`);
  }
});

test("README v2.6.0 ghi ro roadmap xac thuc email dashboard", () => {
  const readme = readFileSync("README.md", "utf8");
  for (const muc of ["v2.6.0", "v2.7.0", "v2.8.0", "v2.9.0", "v3.0.0"]) assert.match(readme, new RegExp(muc.replaceAll(".", "\\.")));
});


test("v2.6.1 seed bo sung 3 mau moi san pham va khong can migration moi", () => {
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  assert.match(seed, /SEED_V261_CHON_MAU_SAN_PHAM/);
  assert.match(seed, /bo_mau_san_pham/);
  assert.match(seed, /String\(j \+ 1\)\.padStart\(2, "0"\)/);
  assert.equal(existsSync("apps/api/prisma/migrations/202608290006_v261_chon_mau/migration.sql"), false);
});


test("v2.7.0 co migration va backend quen mat khau qua email", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290006_v270_quen_mat_khau_email/migration.sql"), true);
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  const controller = readFileSync("apps/api/src/xac-thuc/xac-thuc.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/xac-thuc/xac-thuc.service.ts", "utf8");
  const mail = readFileSync("apps/api/src/thu-dien-tu/thu-dien-tu.service.ts", "utf8");
  assert.match(schema, /model\s+DatLaiMatKhau\b/);
  assert.match(schema, /@@map\("dat_lai_mat_khau"\)/);
  assert.match(controller, /quen-mat-khau/);
  assert.match(controller, /dat-lai-mat-khau/);
  assert.match(service, /randomBytes\(32\)/);
  assert.match(service, /createHash\("sha256"\)/);
  assert.match(service, /argon2\.hash/);
  assert.match(service, /phien_ban_mat_khau: \{ increment: 1 \}/);
  assert.match(service, /phienDangNhap\.updateMany/);
  assert.match(mail, /nodemailer\.createTransport/);
});

test("v2.7.0 Docker co Mailpit local va README lich su tang dan", () => {
  const compose = readFileSync("docker-compose.yml", "utf8");
  const readme = readFileSync("README.md", "utf8");
  assert.match(compose, /axllent\/mailpit:v1\.30\.6/);
  assert.match(compose, /profiles: \["mailpit"\]/);
  assert.match(compose, /MAILPIT_UI_PORT:-8025/);
  assert.match(readme, /v1\.0\.0[\s\S]*v2\.7\.0/u);
});


test("v2.8.0 co migration nhan vien ca lam phan ca", () => {
  assert.equal(existsSync("apps/api/prisma/migrations/202608290007_v280_tai_khoan_nhan_vien_phan_ca/migration.sql"), true);
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  for (const model of ["NhanVien", "CaLamViec", "PhanCa"]) assert.match(schema, new RegExp(`model\\s+${model}\\b`));
  assert.match(schema, /so_dien_thoai/);
});

test("v2.8.0 co backend ho so quan tri nhan vien va xep ca", () => {
  for (const tep of [
    "apps/api/src/tai-khoan/tai-khoan.controller.ts",
    "apps/api/src/quan-tri/quan-tri.controller.ts",
    "apps/api/src/quan-tri/quan-tri.service.ts",
    "apps/web/app/quan-tri/page.tsx",
    "apps/web/lib/tai-khoan.ts",
    "apps/web/lib/quan-tri.ts"
  ]) assert.equal(existsSync(tep), true, `Thieu ${tep}`);
  const guard = readFileSync("apps/api/src/xac-thuc/vai-tro.guard.ts", "utf8");
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  assert.match(guard, /KHOA_VAI_TRO/);
  assert.doesNotMatch(guard, /SIEU_QUAN_TRI/);
  assert.match(controller, /VaiTroChoPhep\(VaiTro\.ADMIN\)/);
});

test("v2.9.1 san pham mac dinh va account menu co dang xuat", () => {
  const detail = readFileSync("apps/web/app/san-pham/[duong_dan]/page.tsx", "utf8");
  const nav = readFileSync("apps/web/components/thanh-dieu-huong.tsx", "utf8");
  assert.match(detail, /Cấu hình mặc định/u);
  assert.match(detail, /product-photo-default/);
  assert.doesNotMatch(detail, /color-preview-badge/);
  assert.match(nav, /account-popover/);
  assert.match(nav, /Đăng xuất/u);
});


test("v2.8.2 ho tro Gmail SMTP bang bo bien MAIL_*", () => {
  const env = readFileSync(".env.example", "utf8");
  const compose = readFileSync("docker-compose.yml", "utf8");
  const mail = readFileSync("apps/api/src/thu-dien-tu/cau-hinh-smtp.ts", "utf8");
  const apiPkg = docJson("apps/api/package.json");
  for (const ten of ["MAIL_ENABLED", "MAIL_HOST", "MAIL_PORT", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_SMTP_AUTH", "MAIL_STARTTLS", "MAIL_STARTTLS_REQUIRED", "MAIL_FROM", "MAIL_CONNECTION_TIMEOUT", "MAIL_TIMEOUT", "MAIL_WRITE_TIMEOUT"]) {
    assert.match(env, new RegExp(`${ten}=`));
    assert.match(compose, new RegExp(`${ten}:`));
  }
  assert.match(mail, /requireTLS/);
  assert.match(mail, /ignoreTLS/);
  assert.match(mail, /connectionTimeout/);
  assert.equal(typeof apiPkg.scripts?.["mail:kiem-tra"], "string");
  assert.match(docJson("package.json").scripts["mail:kiem-tra"], /workspace=@nhienin3d\/api/);
});

test("v2.8.2 dung MAIL_USERNAME lam cau hinh chinh va khong con MAIL_USER trong env mau Docker", () => {
  const env = readFileSync(".env.example", "utf8");
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(env, /MAIL_USERNAME=/);
  assert.doesNotMatch(env, /^MAIL_USER=/m);
  assert.match(compose, /MAIL_USERNAME:/);
  assert.doesNotMatch(compose, /^\s*MAIL_USER:/m);
});

test("v2.8.2 README lich su tang dan va co password UX ghi nho tai khoan", () => {
  const readme = readFileSync("README.md", "utf8");
  const lich_su = readme.slice(readme.indexOf("# Lịch sử phiên bản"));
  const vi_tri_281 = lich_su.indexOf("## v2.8.1");
  const vi_tri_282 = lich_su.indexOf("## v2.8.2");
  assert.ok(vi_tri_281 >= 0 && vi_tri_282 > vi_tri_281);
  assert.match(readme, /độ mạnh mật khẩu/ui);
  assert.match(readme, /Ghi nhớ tài khoản/u);
});

test("v2.8.3 JwtGuard co JwtService trong TaiKhoanModule va QuanTriModule", () => {
  const authModule = readFileSync("apps/api/src/xac-thuc/xac-thuc.module.ts", "utf8");
  const taiKhoanModule = readFileSync("apps/api/src/tai-khoan/tai-khoan.module.ts", "utf8");
  const quanTriModule = readFileSync("apps/api/src/quan-tri/quan-tri.module.ts", "utf8");
  assert.match(authModule, /exports:\s*\[JwtModule,\s*XacThucService,\s*JwtGuard,\s*VaiTroGuard\]/);
  assert.match(taiKhoanModule, /imports:\s*\[XacThucModule\]/);
  assert.match(quanTriModule, /imports:\s*\[XacThucModule\]/);
});


test("v2.8.4 giao dien dang nhap dang ki duoc tinh gon", () => {
  const login = readFileSync("apps/web/app/dang-nhap/page.tsx", "utf8");
  const register = readFileSync("apps/web/app/dang-ky/page.tsx", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.doesNotMatch(login, /Phiên đăng nhập dùng cookie HttpOnly/u);
  assert.match(login, /cine-auth-options/);
  assert.match(login, /Ghi nhớ tài khoản/u);
  assert.match(login, /Quên mật khẩu\?/u);
  assert.match(login, /cine-auth-submit/);
  assert.match(register, /<h1>Tạo tài khoản<\/h1>/u);
  assert.match(css, /cine-auth-submit/);
});


test("v2.9.1 anh mac dinh du lieu mau ho so va logout", () => {
  const detail = readFileSync("apps/web/app/san-pham/[duong_dan]/page.tsx", "utf8");
  const account = readFileSync("apps/web/app/tai-khoan/page.tsx", "utf8");
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  const guard = readFileSync("apps/api/src/xac-thuc/jwt.guard.ts", "utf8");
  assert.match(detail, /product-photo-default/);
  assert.doesNotMatch(detail, /product-photo-colorized/);
  assert.match(account, /setThuDienTu/);
  assert.match(account, /da_dang_xuat=1/);
  assert.match(seed, /nguyen\.minh\.anh@example\.com/);
  assert.doesNotMatch(seed, /minh\.anh\.demo@nhienin3d\.local", "Nguyễn Minh Anh"/);
  assert.match(guard, /payload\.sid/);
});


test("v2.8.6 Brave ho so mat khau va seed admin ben vung", () => {
  const browser = readFileSync("apps/web/lib/trinh-duyet.ts", "utf8");
  const account = readFileSync("apps/web/app/tai-khoan/page.tsx", "utf8");
  const service = readFileSync("apps/api/src/tai-khoan/tai-khoan.service.ts", "utf8");
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  assert.match(browser, /isBrave/);
  assert.match(browser, /Brave/);
  assert.match(account, /Đổi mật khẩu/u);
  assert.match(account, /Đã lưu thông tin tài khoản vào PostgreSQL/u);
  assert.match(service, /argon2\.verify/);
  assert.match(service, /DOI_MAT_KHAU/);
  assert.match(seed, /admin_dang_hoat_dong/);
  const nhanhAdmin = seed.slice(seed.indexOf("if (admin_dang_hoat_dong)"), seed.indexOf("else if", seed.indexOf("if (admin_dang_hoat_dong)")));
  assert.doesNotMatch(nhanhAdmin, /ho_ten_quan_tri/);
  assert.doesNotMatch(nhanhAdmin, /mat_khau_bam/);
});


test("v2.9.1 anh mac dinh admin first kich hoat va logout ben vung", () => {
  const detail = readFileSync("apps/web/app/san-pham/[duong_dan]/page.tsx", "utf8");
  const imageRoute = readFileSync("apps/web/app/api/anh-bien-the/route.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const adminService = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const auth = readFileSync("apps/api/src/xac-thuc/xac-thuc.service.ts", "utf8");
  const guard = readFileSync("apps/api/src/xac-thuc/jwt.guard.ts", "utf8");
  const webAuth = readFileSync("apps/web/lib/xac-thuc.ts", "utf8");
  assert.match(detail, /src=\{anh_goc\}/);
  assert.doesNotMatch(detail, /anhBienTheUrl/);
  assert.match(imageRoute, /clipPath/);
  assert.match(imageRoute, /feFlood/);
  assert.match(admin, /Kích hoạt/u);
  assert.match(admin, /cine-customer-actions/u);
  assert.match(admin, />Xóa<\/button>/u);
  assert.match(adminService, /ADMIN:\s*0/);
  assert.match(auth, /thu_hoi_tat_ca_phien/);
  assert.match(guard, /if \(!payload\.sid\)/);
  assert.match(webAuth, /KHOA_DA_DANG_XUAT/);
});


test("v2.8.8 dang ky co so dien thoai dia chi va tao dia chi mac dinh", () => {
  const web = readFileSync("apps/web/app/dang-ky/page.tsx", "utf8");
  const dto = readFileSync("apps/api/src/xac-thuc/dto/dang-ky.dto.ts", "utf8");
  const service = readFileSync("apps/api/src/xac-thuc/xac-thuc.service.ts", "utf8");
  assert.match(web, /Số điện thoại/u);
  assert.match(web, /Địa chỉ/u);
  assert.match(dto, /so_dien_thoai/u);
  assert.match(dto, /dia_chi/u);
  assert.match(service, /diaChiNguoiDung\.create/u);
  assert.match(service, /la_mac_dinh:\s*true/u);
});

test("v2.8.9 bao ve super admin va polish bo cuc tai khoan", () => {
  const adminWeb = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const adminApi = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(adminWeb, /Tài khoản khách hàng/u);
  assert.doesNotMatch(adminWeb, /Bảo vệ/u);
  assert.match(adminApi, /Không thể tự khóa/u);
  assert.doesNotMatch(adminApi, /Siêu quản trị/u);
  assert.match(css, /account-panel-security/u);
  assert.match(css, /password-change-form/u);
});


test("v2.9.0 admin kich hoat lai va xoa tai khoan dung RBAC", () => {
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const adminWeb = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const adminLib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  assert.match(controller, /@Delete\("nguoi-dung\/:id"\)/);
  assert.match(controller, /nguoi-dung\/:id\/kich-hoat/);
  assert.match(controller, /nguoi-dung\/:id\/khoa/);
  assert.match(service, /data: \{ da_kich_hoat: true, so_lan_dang_nhap_that_bai: 0, khoa_den: null \}/);
  assert.match(service, /phienDangNhap\.updateMany/);
  assert.match(service, /xoa_nguoi_dung/);
  assert.match(service, /Không thể xóa chính tài khoản Admin đang đăng nhập/u);
  assert.doesNotMatch(service, /Siêu quản trị/u);
  assert.match(adminLib, /kichHoatNguoiDung/);
  assert.match(adminLib, /xoaNguoiDung[\s\S]*method: "POST"/);
  assert.match(adminWeb, /xoaNguoiDung/);
  assert.match(adminWeb, /Kích hoạt/u);
});

test("v2.9.0 bo cuc tai khoan va quan tri compact theo CineBooking", () => {
  const account = readFileSync("apps/web/app/tai-khoan/page.tsx", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const login = readFileSync("apps/web/app/dang-nhap/page.tsx", "utf8");
  const register = readFileSync("apps/web/app/dang-ky/page.tsx", "utf8");
  const reset = readFileSync("apps/web/app/dat-lai-mat-khau/page.tsx", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(account, /cine-profile-shell/);
  assert.match(account, /Tài khoản của tôi/u);
  assert.match(admin, /cine-admin-tabs/);
  assert.match(admin, /cine-customer-card/);
  assert.match(login, /cine-auth-card/);
  assert.match(register, /cine-auth-card-register/);
  assert.match(reset, /cine-auth-card/);
  assert.match(css, /\.cine-profile-shell/);
  assert.match(css, /\.cine-admin-shell/);
});


test("v2.9.1 bo giao dien chon mau va tu dung bien the mac dinh", () => {
  const detail = readFileSync("apps/web/app/san-pham/[duong_dan]/page.tsx", "utf8");
  const card = readFileSync("apps/web/components/the-san-pham.tsx", "utf8");
  const cart = readFileSync("apps/web/app/gio-hang/page.tsx", "utf8");
  assert.match(detail, /Cấu hình mặc định/u);
  assert.match(detail, /find\(x => x\.so_luong_ton > 0\)/);
  assert.match(detail, /themBienTheVaoGio\(bien_the\.ma_bien_the/);
  assert.doesNotMatch(detail, /Chọn màu sắc/u);
  assert.doesNotMatch(detail, /color-options/);
  assert.doesNotMatch(detail, /anhBienTheUrl/);
  assert.doesNotMatch(card, /Chọn màu/u);
  assert.doesNotMatch(cart, /mau_sac/);
});


test("v2.9.3 mot vai tro Admin va lich ca theo CineBooking Pro", () => {
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  const migration = readFileSync("apps/api/prisma/migrations/202608300001_v293_hop_nhat_admin/migration.sql", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(schema, /ADMIN/);
  assert.doesNotMatch(schema, /SIEU_QUAN_TRI|QUAN_TRI/);
  assert.match(migration, /IN \('QUAN_TRI', 'SIEU_QUAN_TRI'\) THEN 'ADMIN'/);
  assert.match(admin, /tk\.vai_tro !== "ADMIN"/);
  assert.match(admin, /kichHoatNguoiDung/);
  assert.match(admin, /cine-shift-management-grid/);
  assert.match(admin, /Xếp ca nhân viên/u);
  assert.match(admin, /phanCaTheoNgay/);
  assert.match(css, /\.cine-shift-management-grid/);
  assert.match(css, /\.cine-schedule-row/);
});


test("v2.9.4 khong reset profile activation khi seed", () => {
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  const adminLib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  const account = readFileSync("apps/web/app/tai-khoan/page.tsx", "utf8");
  assert.match(seed, /SEED_V294_PERSIST_TAI_KHOAN_HO_SO/);
  assert.match(seed, /Dữ liệu mẫu chỉ bootstrap lần đầu/u);
  assert.match(seed, /Không tạo lại địa chỉ mẫu/u);
  assert.match(seed, /bootstrap lần đầu|bootstrap bản ghi còn thiếu/u);
  assert.match(adminLib, /init\.body !== undefined && init\.body !== null/);
  assert.match(account, /const da_luu = await capNhatHoSo/);
});


test("v2.9.5 luu profile, xoa user, trang thai nhan vien ban hang va form lon", () => {
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  const migration = readFileSync("apps/api/prisma/migrations/202608300002_v295_nhan_vien_ban_hang/migration.sql", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const accountService = readFileSync("apps/api/src/tai-khoan/tai-khoan.service.ts", "utf8");
  const adminPage = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const accountPage = readFileSync("apps/web/app/tai-khoan/page.tsx", "utf8");
  const adminLib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.doesNotMatch(schema, /\bQUAN_LY\b/);
  assert.match(migration, /'QUAN_LY' THEN 'KHACH_HANG'/);
  assert.match(migration, /Nhân viên bán hàng/u);
  assert.match(controller, /@Post\("nguoi-dung\/:id\/xoa"\)/);
  assert.match(service, /tx\.donHang\.updateMany/);
  assert.match(service, /tx\.phienDangNhap\.deleteMany/);
  assert.match(service, /chuc_danh: "Nhân viên bán hàng"/u);
  assert.match(service, /TrangThaiNhanVien\.TAM_NGHI/);
  assert.match(accountService, /findUniqueOrThrow/);
  assert.doesNotMatch(accountPage, /xac_nhan = await layHoSo/);
  assert.match(adminLib, /nguoi-dung\/\$\{id\}\/xoa/);
  assert.match(adminLib, /body: JSON\.stringify\(\{ xac_nhan: true \}\)/);
  assert.match(adminPage, /Tạo nhân viên bán hàng/u);
  assert.doesNotMatch(adminPage, /Nhân viên chỉ tập trung bán hàng/u);
  assert.doesNotMatch(adminPage, /value="QUAN_LY"/);
  assert.match(css, /v2\.9\.5 - biểu mẫu lớn/u);
  assert.match(css, /cine-staff-create-layout/);
  assert.match(css, /font-size:15px/);
});


test("v2.9.6 nut gio hang dung nen toi dong bo CineBooking", () => {
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(css, /\.cart-button\{[^}]*background:linear-gradient\(135deg,rgba\(23,32,51,\.98\),rgba\(15,23,42,\.98\)\)/);
  assert.match(css, /\.cart-button:hover\{[^}]*border-color:rgba\(167,139,250,\.78\)/);
  assert.match(css, /\.cart-button b\{[^}]*background:linear-gradient\(135deg,#8b5cf6,#22d3ee\)/);
});


test("v2.9.7 trang thai nhan vien luu PostgreSQL va form bo panel phan quyen", () => {
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  assert.match(controller, /@Post\("nhan-vien\/:id\/trang-thai"\)/);
  assert.match(service, /findUniqueOrThrow/);
  assert.match(service, /da_doc_lai_sau_commit/);
  assert.match(lib, /nhan-vien\/\$\{id\}\/trang-thai/);
  assert.match(admin, /F5 vẫn giữ trạng thái này/u);
  assert.doesNotMatch(admin, /cine-staff-permissions/);
  assert.doesNotMatch(admin, /PHÂN QUYỀN/u);
});


test("v2.9.8 vai tro Admin va Nhan vien co dinh khong con mui ten dropdown", () => {
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const dto = readFileSync("apps/api/src/quan-tri/dto/cap-nhat-nguoi-dung.dto.ts", "utf8");
  assert.match(admin, /Nhân viên bán hàng/u);
  assert.match(admin, /Khách hàng/u);
  assert.doesNotMatch(admin, /<select value=\{u\.vai_tro\}/);
  assert.doesNotMatch(admin, /doiVaiTro/);
  assert.doesNotMatch(dto, /vai_tro/);
});


test("v2.9.9 bo kicker Admin, dung 2 ca 06-14 14-22 va cho sua xoa ca", () => {
  const migration = readFileSync("apps/api/prisma/migrations/202608300003_v299_hai_ca_lam_va_quan_ly_ca/migration.sql", "utf8");
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  assert.doesNotMatch(admin, /NHIENIN3D · ADMIN/u);
  assert.match(migration, /'CA01', 'Ca sáng', '06:00', '14:00'/u);
  assert.match(migration, /'CA02', 'Ca chiều', '14:00', '22:00'/u);
  assert.match(seed, /SEED_V299_HAI_CA_MAC_DINH/);
  assert.match(seed, /SEED_V299_PHAN_CA_MAU/);
  assert.match(controller, /@Patch\("ca-lam\/:id"\)/);
  assert.match(controller, /@Delete\("ca-lam\/:id"\)/);
  assert.match(service, /async cap_nhat_ca/);
  assert.match(service, /async xoa_ca/);
  assert.match(service, /tx\.phanCa\.deleteMany/);
  assert.match(lib, /capNhatCaLam/);
  assert.match(lib, /xoaCaLam/);
  assert.match(admin, /Chỉnh sửa/);
  assert.match(admin, /Lưu thay đổi/);
  assert.match(admin, /Các phân ca đang dùng mẫu ca này cũng sẽ bị xóa/u);
});


test("v2.10.0 cho sua xoa ca va phan ca da xep, bo STAFF OPERATIONS", () => {
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const dto = readFileSync("apps/api/src/quan-tri/dto/cap-nhat-phan-ca.dto.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  assert.doesNotMatch(admin, /STAFF OPERATIONS/);
  assert.match(controller, /@Post\("ca-lam\/:id\/xoa"\)/);
  assert.match(controller, /@Post\("phan-ca\/:id\/xoa"\)/);
  assert.match(service, /so_phan_ca_bi_anh_huong/);
  assert.match(service, /id: \{ not: id \}, nhan_vien_id, ca_lam_viec_id, ngay_lam/);
  assert.match(dto, /nhan_vien_id/);
  assert.match(dto, /ca_lam_viec_id/);
  assert.match(dto, /ngay_lam/);
  assert.match(admin, /batDauSuaPhanCa/);
  assert.match(admin, /pc_dang_sua_id/);
  assert.match(admin, /Hủy chỉnh sửa/u);
  assert.match(lib, /ca-lam\/\$\{id\}\/xoa[\s\S]*method: "POST"/);
  assert.match(lib, /phan-ca\/\$\{id\}\/xoa[\s\S]*method: "POST"/);
});


test("v2.10.1 tach khach hang, sua thong tin va luu ca phan ca bang POST", () => {
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const dto = readFileSync("apps/api/src/quan-tri/dto/cap-nhat-nguoi-dung.dto.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  const footer = readFileSync("apps/web/components/chan-trang.tsx", "utf8");
  assert.match(controller, /@Post\("nguoi-dung\/:id\/cap-nhat"\)/);
  assert.match(controller, /@Post\("ca-lam\/:id\/cap-nhat"\)/);
  assert.match(controller, /@Post\("phan-ca\/:id\/cap-nhat"\)/);
  assert.match(dto, /thu_dien_tu/);
  assert.match(dto, /dia_chi_mac_dinh/);
  assert.match(service, /Email này đã được sử dụng/u);
  assert.match(admin, /Tài khoản khách hàng/u);
  assert.match(admin, /suaKhachHangLocal/);
  assert.doesNotMatch(admin, /tab === "nguoi-dung"/);
  assert.match(lib, /nguoi-dung\/\$\{id\}\/cap-nhat[\s\S]*method: "POST"/);
  assert.match(lib, /ca-lam\/\$\{id\}\/cap-nhat[\s\S]*method: "POST"/);
  assert.match(lib, /phan-ca\/\$\{id\}\/cap-nhat[\s\S]*method: "POST"/);
  assert.doesNotMatch(footer, /Sản phẩm in 3D theo yêu cầu với cấu hình mua hàng mặc định/u);
});


test("v2.10.2 profile va doi mat khau dung POST, CORS mo day du method", () => {
  const main = readFileSync("apps/api/src/main.ts", "utf8");
  const controller = readFileSync("apps/api/src/tai-khoan/tai-khoan.controller.ts", "utf8");
  const lib = readFileSync("apps/web/lib/tai-khoan.ts", "utf8");
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  assert.match(main, /methods: \["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"\]/);
  assert.match(controller, /@Post\("ho-so"\)/);
  assert.match(controller, /@Post\("doi-mat-khau"\)/);
  assert.match(lib, /capNhatHoSo[\s\S]*method: "POST"/);
  assert.match(lib, /doiMatKhau[\s\S]*method: "POST"/);
  assert.match(seed, /ADMIN_PASSWORD chỉ dùng khi tạo tài khoản lần đầu/u);
  assert.doesNotMatch(seed, /update: \{ mat_khau_bam, ho_ten: ho_ten_quan_tri/);
});

test("v2.11.0 dashboard quan tri co doanh thu don hang top san pham ton kho", () => {
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(service, /doanh_thu_theo_ngay/);
  assert.match(service, /top_san_pham_30_ngay/);
  assert.match(service, /ton_kho_thap/);
  assert.match(service, /khach_hang_moi/);
  assert.match(service, /TrangThaiDonHang\.HOAN_TAT/);
  assert.match(admin, /\["tong-quan", "Tổng quan"\]/u);
  assert.match(admin, /Doanh thu 7 ngày/u);
  assert.match(admin, /Top sản phẩm 30 ngày/u);
  assert.match(admin, /Tồn kho thấp/u);
  assert.match(lib, /export type AdminTongQuan/);
  assert.match(css, /cine-dashboard-v211/);
});


test("v2.12.0 quan tri don hang san pham ton kho va audit Admin", () => {
  const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
  const migration = readFileSync("apps/api/prisma/migrations/202608300004_v212_quan_tri_don_hang_audit/migration.sql", "utf8");
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const checkout = readFileSync("apps/api/src/thanh-toan/thanh-toan.service.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(schema, /model LichSuDonHang/);
  assert.match(schema, /@@map\("lich_su_don_hang"\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "lich_su_don_hang"/);
  assert.match(controller, /@Get\("don-hang"\)/);
  assert.match(controller, /@Post\("don-hang\/:id\/trang-thai"\)/);
  assert.match(controller, /@Get\("san-pham"\)/);
  assert.match(controller, /@Post\("bien-the\/:id\/ton-kho"\)/);
  assert.match(controller, /@Get\("nhat-ky"\)/);
  assert.match(service, /ADMIN_CAP_NHAT_DON_HANG/);
  assert.match(service, /ADMIN_CAP_NHAT_SAN_PHAM/);
  assert.match(service, /ADMIN_CAP_NHAT_TON_KHO/);
  assert.match(service, /so_luong_ton: \{ increment: ct\.so_luong \}/);
  assert.match(checkout, /lichSuDonHang\.create/);
  assert.match(admin, /\["don-hang", "Đơn hàng"\]/u);
  assert.match(admin, /\["san-pham", "Sản phẩm"\]/u);
  assert.match(admin, /\["kho", "Kho"\]/u);
  assert.match(admin, /\["nhat-ky", "Nhật ký Admin"\]/u);
  assert.match(lib, /layDonHangAdmin/);
  assert.match(lib, /capNhatTrangThaiDonHangAdmin/);
  assert.match(lib, /capNhatTonKhoAdmin/);
  assert.match(css, /cine-order-admin-grid-v212/);
  assert.match(css, /cine-variant-table-v212/);
  assert.match(css, /cine-audit-list-v212/);
});


test("v2.12.1 san pham quan tri dung danh sach xo xuong mot san pham", () => {
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(admin, /san_pham_chon_id/);
  assert.match(admin, /sanPhamDangChon/);
  assert.match(admin, /<span>Chọn sản phẩm<\/span><select/u);
  assert.match(admin, /Chọn sản phẩm cần chỉnh/u);
  assert.match(admin, /Không có sản phẩm phù hợp bộ lọc/u);
  assert.match(css, /v2\.12\.1 - quản trị sản phẩm chọn bằng danh sách xổ xuống/u);
  assert.match(css, /cine-product-picker-v2121/);
});


test("v2.12.2 storefront co 12 san pham va 6 san pham moi hang desktop", () => {
  const home = readFileSync("apps/web/app/page.tsx", "utf8");
  const data = readFileSync("apps/web/lib/du-lieu-mau.ts", "utf8");
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  const css = readFileSync("apps/web/app/globals.css", "utf8");
  assert.match(home, /<b>12<\/b><span>Sản phẩm mẫu<\/span>/u);
  assert.match(data, /N3D-ORG-011/);
  assert.match(data, /N3D-MAKER-012/);
  assert.match(seed, /N3D-ORG-011/);
  assert.match(seed, /N3D-MAKER-012/);
  assert.match(css, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
});


test("v2.13.0 hai san pham moi dung anh san pham that", () => {
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  const data = readFileSync("apps/web/lib/du-lieu-mau.ts", "utf8");
  for (const noiDung of [seed, data]) {
    assert.match(noiDung, /makerworld\.bblmw\.com/);
    assert.match(noiDung, /USd15fedca5591f3/);
    assert.match(noiDung, /USd971c27ce7a1e3/);
  }
  assert.doesNotMatch(data, /gridfinity-2x3-pen-holder\.svg/);
  assert.doesNotMatch(data, /raspberry-pi-5-40mm-fan-case\.svg/);
});

test("v2.13.0 admin CRUD san pham va upload anh tu may", () => {
  const controller = readFileSync("apps/api/src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("apps/api/src/quan-tri/quan-tri.service.ts", "utf8");
  const dto = readFileSync("apps/api/src/quan-tri/dto/tao-san-pham-quan-tri.dto.ts", "utf8");
  const admin = readFileSync("apps/web/app/quan-tri/page.tsx", "utf8");
  const lib = readFileSync("apps/web/lib/quan-tri.ts", "utf8");
  const main = readFileSync("apps/api/src/main.ts", "utf8");
  const seed = readFileSync("apps/api/prisma/seed.ts", "utf8");
  assert.match(controller, /@Post\("san-pham"\)/);
  assert.match(controller, /@Post\("san-pham\/:id\/xoa"\)/);
  assert.match(service, /tao_san_pham_quan_tri/);
  assert.match(service, /xoa_san_pham_quan_tri/);
  assert.match(service, /ADMIN_TAO_SAN_PHAM/);
  assert.match(service, /ADMIN_XOA_SAN_PHAM/);
  assert.match(dto, /anh_chinh_data_url/);
  assert.match(admin, /chuanHoaAnhSanPham/);
  assert.match(admin, /canvas\.width = 1000/);
  assert.match(admin, /canvas\.height = 800/);
  assert.match(admin, /\+ Thêm sản phẩm/u);
  assert.match(lib, /taoSanPhamAdmin/);
  assert.match(lib, /xoaSanPhamAdmin/);
  assert.match(main, /bodyLimit: 3 \* 1024 \* 1024/);
  assert.match(seed, /SEED_V2130_QUAN_TRI_SAN_PHAM_ANH_LOCAL/);
  assert.match(seed, /update: \{\}/);
});
