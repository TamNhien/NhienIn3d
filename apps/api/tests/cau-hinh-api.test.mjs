import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const docJson = (duongDan) => JSON.parse(readFileSync(duongDan, 'utf8'));

test('API dung ESM NodeNext phu hop NestJS 12', () => {
  const ts = docJson('tsconfig.json');
  const pkg = docJson('package.json');
  assert.equal(pkg.type, 'module');
  assert.equal(ts.compilerOptions.module, 'NodeNext');
  assert.equal(ts.compilerOptions.moduleResolution, 'NodeNext');
  assert.equal(ts.compilerOptions.resolvePackageJsonExports, true);
});

test('API dung PostgreSQL qua Prisma', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');
  assert.match(schema, /provider\s*=\s*"postgresql"/);
  assert.match(schema, /model\s+SanPham\b/);
  assert.match(schema, /@@map\("san_pham"\)/);
});

test('package API pin Prisma 7.10.0 va NestJS 12', () => {
  const pkg = docJson('package.json');
  assert.equal(pkg.dependencies['@prisma/client'], '7.10.0');
  assert.equal(pkg.dependencies['@nestjs/core'], '12.0.1');
});

test("Prisma config tu dung DATABASE_URL tu bien POSTGRES trong .env goc", () => {
  const noiDung = readFileSync(new URL("../prisma.config.ts", import.meta.url), "utf8");
  assert.match(noiDung, /POSTGRES_PASSWORD/);
  assert.match(noiDung, /POSTGRES_DB/);
  assert.match(noiDung, /POSTGRES_USER/);
  assert.match(noiDung, /encodeURIComponent/);
  assert.match(noiDung, /DATABASE_URL/);
});


test('import noi bo API co duoi .js de Node ESM resolve dung', () => {
  const main = readFileSync('src/main.ts', 'utf8');
  assert.match(main, /from \"\.\/app\.module\.js\"/);
});

test("Swagger Fastify co @fastify/static tuong thich Fastify 5", () => {
  const pkg = docJson('package.json');
  assert.equal(pkg.dependencies['@fastify/static'], '10.1.3');
});

test("seed v2.12.0 theo doi 24 bang va cho phep du lieu van hanh bi xoa", () => {
  const seed = readFileSync('prisma/seed.ts', 'utf8');
  for (const bang of [
    'nguoi_dung', 'danh_muc', 'san_pham', 'hinh_anh_san_pham',
    'vat_lieu', 'mau_sac', 'bien_the_san_pham', 'don_hang',
    'chi_tiet_don_hang', 'lich_su_don_hang', 'phien_dang_nhap', 'nhat_ky_bao_mat', 'phien_ban_seed',
    'gio_hang', 'chi_tiet_gio_hang', 'phuong_thuc_thanh_toan', 'thanh_toan', 'dia_chi_nguoi_dung', 'yeu_thich', 'danh_gia_san_pham', 'dat_lai_mat_khau', 'nhan_vien', 'ca_lam_viec', 'phan_ca'
  ]) {
    assert.match(seed, new RegExp(`${bang}: await db\\.`));
  }
  assert.match(seed, /so_luong < 10/);
  assert.match(seed, /PHIEN_BAN_HIEN_TAI = "SEED_V2151_DOANH_THU_THEO_THANH_TOAN"/);
  assert.match(seed, /bang_bien_dong/);
  assert.match(seed, /SEED_V286_TAI_KHOAN_MAT_KHAU_BRAVE/);
  assert.match(seed, /\/images\/khoi-lap-phuong-banh-rang\.jpg/);
});


test("API hien thi dung version v2.15.2 o health va OpenAPI", () => {
  const health = readFileSync("src/suc-khoe/suc-khoe.controller.ts", "utf8");
  const main = readFileSync("src/main.ts", "utf8");
  assert.match(health, /phien_ban: "v2\.15\.2"/);
  assert.match(main, /setVersion\("2\.15\.2"\)/);
});

test("V2 co migration gio hang, thanh toan va dia chi", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  for (const model of ["GioHang", "ChiTietGioHang", "PhuongThucThanhToan", "ThanhToan", "DiaChiNguoiDung"]) {
    assert.match(schema, new RegExp(`model\\s+${model}\\b`));
  }
});

test("V2 co API gio hang va checkout", () => {
  const app = readFileSync("src/app.module.ts", "utf8");
  const gio = readFileSync("src/gio-hang/gio-hang.controller.ts", "utf8");
  const thanhToan = readFileSync("src/thanh-toan/thanh-toan.controller.ts", "utf8");
  assert.match(app, /GioHangModule/);
  assert.match(app, /ThanhToanModule/);
  assert.match(gio, /Controller\("gio-hang"\)/);
  assert.match(thanhToan, /dat-hang/);
});


test("local cho phep gia lap gateway online nhung production van khoa", () => {
  const service = readFileSync("src/thanh-toan/thanh-toan.service.ts", "utf8");
  assert.match(service, /NODE_ENV/);
  assert.match(service, /la_gia_lap/);
  assert.match(service, /TrangThaiThanhToan\.DA_THANH_TOAN/);
  assert.match(service, /N3D-MOCK/);
  assert.match(service, /!phuong_thuc\.dang_hoat_dong && !la_gia_lap/);
});


test("v2.3.0 API san pham co tim kiem loc va sap xep", () => {
  const controller = readFileSync("src/san-pham/san-pham.controller.ts", "utf8");
  for (const tu of ["tim_kiem", "danh_muc", "con_hang", "gia_tu", "gia_den", "sap_xep"]) assert.match(controller, new RegExp(tu));
  assert.match(controller, /gia_tang/);
  assert.match(controller, /gia_giam/);
  assert.match(controller, /ten_az/);
});

test("v2.3.0 co API yeu thich luu PostgreSQL", () => {
  const app = readFileSync("src/app.module.ts", "utf8");
  const controller = readFileSync("src/yeu-thich/yeu-thich.controller.ts", "utf8");
  const service = readFileSync("src/yeu-thich/yeu-thich.service.ts", "utf8");
  assert.match(app, /YeuThichModule/);
  assert.match(controller, /Controller\("yeu-thich"\)/);
  assert.match(service, /db\.yeuThich/);
  assert.match(service, /ma_phien_san_pham_id/);
});


test("v2.5.0 mac dinh sap xep san pham tang dan theo so trong ma", () => {
  const controller = readFileSync("src/san-pham/san-pham.controller.ts", "utf8");
  assert.match(controller, /sap_xep = "ma_tang"/);
  assert.match(controller, /soThuTu/);
  assert.match(controller, /ma_san_pham/);
});


test("danh gia san pham chi hien thi noi dung da duyet", () => {
  const controller = readFileSync('src/danh-gia/danh-gia.controller.ts', 'utf8');
  const service = readFileSync('src/danh-gia/danh-gia.service.ts', 'utf8');
  assert.match(controller, /danh-gia/);
  assert.match(service, /da_duyet: true/);
  assert.match(service, /const da_duyet = false/);
});

test("v2.5.0 API san pham tra diem danh gia va goi y lien quan", () => {
  const controller = readFileSync('src/san-pham/san-pham.controller.ts', 'utf8');
  assert.match(controller, /diem_danh_gia/);
  assert.match(controller, /so_luong_danh_gia/);
  assert.match(controller, /lien-quan/);
});

test("v2.6.0 co dang ky dang nhap refresh va thong tin tai khoan", () => {
  const controller = readFileSync("src/xac-thuc/xac-thuc.controller.ts", "utf8");
  const service = readFileSync("src/xac-thuc/xac-thuc.service.ts", "utf8");
  for (const route of ["dang-ky", "dang-nhap", "lam-moi", "toi"]) assert.match(controller, new RegExp(route));
  assert.match(service, /argon2\.hash/);
  assert.match(service, /argon2\.verify/);
  assert.match(service, /randomBytes\(48\)/);
  assert.match(service, /ma_lam_moi_bam/);
});

test("v2.9.3 RBAC co mot vai tro ADMIN duy nhat", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const controller = readFileSync("src/xac-thuc/xac-thuc.controller.ts", "utf8");
  const jwt = readFileSync("src/xac-thuc/jwt.guard.ts", "utf8");
  const role = readFileSync("src/xac-thuc/vai-tro.guard.ts", "utf8");
  assert.match(schema, /ADMIN/);
  assert.doesNotMatch(schema, /SIEU_QUAN_TRI|QUAN_TRI/);
  assert.match(jwt, /phien_ban_mat_khau/);
  assert.match(role, /KHOA_VAI_TRO/);
  assert.doesNotMatch(role, /SIEU_QUAN_TRI/);
  assert.match(controller, /VaiTroChoPhep\(VaiTro\.ADMIN\)/);
});

test("v2.6.0 khoa tai khoan tam thoi sau dang nhap sai", () => {
  const service = readFileSync("src/xac-thuc/xac-thuc.service.ts", "utf8");
  assert.match(service, /SO_LAN_THAT_BAI_TOI_DA = 5/);
  assert.match(service, /THOI_GIAN_KHOA_MS/);
  assert.match(service, /DANG_NHAP_BI_KHOA/);
});


test("v2.6.1 seed tao 3 mau cho moi san pham va giu BT01 tuong thich", () => {
  const seed = readFileSync("prisma/seed.ts", "utf8");
  assert.match(seed, /bo_mau_san_pham/);
  assert.match(seed, /j < bo_mau_san_pham\[i\]\.length/);
  assert.match(seed, /BT\$\{String\(j \+ 1\)\.padStart\(2, "0"\)\}/);
  assert.match(seed, /if \(j === 0\) bien_the_map\.set/);
});


test("v2.7.0 backend quen mat khau dung token hash mot lan va Argon2id", () => {
  const controller = readFileSync("src/xac-thuc/xac-thuc.controller.ts", "utf8");
  const service = readFileSync("src/xac-thuc/xac-thuc.service.ts", "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const mail = readFileSync("src/thu-dien-tu/thu-dien-tu.service.ts", "utf8");
  for (const route of ["quen-mat-khau", "dat-lai-mat-khau"]) assert.match(controller, new RegExp(route));
  assert.match(schema, /model\s+DatLaiMatKhau\b/);
  assert.match(service, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.match(service, /ma_bi_mat_bam/);
  assert.match(service, /da_su_dung/);
  assert.match(service, /RESET_PASSWORD_EXPIRES_MINUTES/);
  assert.match(service, /phienDangNhap\.updateMany/);
  assert.match(service, /phien_ban_mat_khau: \{ increment: 1 \}/);
  assert.match(service, /argon2\.argon2id/);
  assert.match(mail, /sendMail/);
});

test("v2.7.0 Nodemailer va Mailpit duoc pin", () => {
  const pkg = docJson("package.json");
  assert.equal(pkg.dependencies.nodemailer, "9.0.6");
  assert.equal(pkg.devDependencies["@types/nodemailer"], "8.0.1");
});


test("v2.8.0 API ho so, session, don hang va lich lam viec", () => {
  const controller = readFileSync("src/tai-khoan/tai-khoan.controller.ts", "utf8");
  const service = readFileSync("src/tai-khoan/tai-khoan.service.ts", "utf8");
  for (const route of ["ho-so", "phien", "don-hang", "lich-lam-viec"]) assert.match(controller, new RegExp(route));
  assert.match(service, /cap_nhat_ho_so/);
  assert.match(service, /phienDangNhap/);
  assert.match(service, /nhanVien/);
});

test("v2.8.0 API admin quan ly nguoi dung nhan vien ca lam va phan ca", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  for (const route of ["nguoi-dung", "nhan-vien", "ca-lam", "phan-ca"]) assert.match(controller, new RegExp(route));
  assert.match(service, /argon2\.argon2id/);
  assert.match(service, /ADMIN/);
  assert.doesNotMatch(service, /SIEU_QUAN_TRI/);
  assert.match(controller, /Patch\("nhan-vien\/:id"\)/);
  assert.match(service, /cap_nhat_nhan_vien/);
  for (const model of ["NhanVien", "CaLamViec", "PhanCa"]) assert.match(schema, new RegExp(`model\\s+${model}\\b`));
});

test("v2.9.3 VaiTroGuard khong con super admin bypass", () => {
  const role = readFileSync("src/xac-thuc/vai-tro.guard.ts", "utf8");
  assert.match(role, /KHOA_VAI_TRO/);
  assert.doesNotMatch(role, /SIEU_QUAN_TRI/);
});


test("v2.8.2 cau hinh Gmail SMTP co STARTTLS va verify script", () => {
  const cfg = readFileSync("src/thu-dien-tu/cau-hinh-smtp.ts", "utf8");
  const service = readFileSync("src/thu-dien-tu/thu-dien-tu.service.ts", "utf8");
  const verify = readFileSync("scripts/kiem-tra-smtp.ts", "utf8");
  for (const ten of ["MAIL_ENABLED", "MAIL_USERNAME", "MAIL_SMTP_AUTH", "MAIL_STARTTLS", "MAIL_STARTTLS_REQUIRED", "MAIL_CONNECTION_TIMEOUT", "MAIL_TIMEOUT", "MAIL_WRITE_TIMEOUT"]) assert.match(cfg, new RegExp(ten));
  assert.match(cfg, /requireTLS/);
  assert.match(cfg, /ignoreTLS/);
  assert.match(service, /docCauHinhSmtp/);
  assert.match(verify, /truyen\.verify\(\)/);
});

test("v2.8.2 backend gui reset den dung email dang ky va van ho tro MAIL_USER legacy", () => {
  const auth = readFileSync("src/xac-thuc/xac-thuc.service.ts", "utf8");
  const smtp = readFileSync("src/thu-dien-tu/cau-hinh-smtp.ts", "utf8");
  assert.match(auth, /thu_dien_tu:\s*nguoi_dung\.thu_dien_tu/);
  assert.match(auth, /\/dat-lai-mat-khau\?ma=/);
  assert.match(smtp, /MAIL_USERNAME/);
  assert.match(smtp, /MAIL_USER/);
});

test("v2.8.3 XacThucModule re-export JwtModule cho JwtGuard o module tai khoan va quan tri", () => {
  const authModule = readFileSync("src/xac-thuc/xac-thuc.module.ts", "utf8");
  const taiKhoanModule = readFileSync("src/tai-khoan/tai-khoan.module.ts", "utf8");
  const quanTriModule = readFileSync("src/quan-tri/quan-tri.module.ts", "utf8");
  assert.match(authModule, /imports:\s*\[JwtModule\.register\(\{\}\),\s*ThuDienTuModule\]/);
  assert.match(authModule, /exports:\s*\[JwtModule,\s*XacThucService,\s*JwtGuard,\s*VaiTroGuard\]/);
  assert.match(taiKhoanModule, /imports:\s*\[XacThucModule\]/);
  assert.match(quanTriModule, /imports:\s*\[XacThucModule\]/);
});


test("v2.8.5 ho so sua email va logout thu hoi session access", () => {
  const dto = readFileSync("src/tai-khoan/dto/cap-nhat-ho-so.dto.ts", "utf8");
  const account = readFileSync("src/tai-khoan/tai-khoan.service.ts", "utf8");
  const auth = readFileSync("src/xac-thuc/xac-thuc.service.ts", "utf8");
  const guard = readFileSync("src/xac-thuc/jwt.guard.ts", "utf8");
  const controller = readFileSync("src/xac-thuc/xac-thuc.controller.ts", "utf8");
  assert.match(dto, /thu_dien_tu/);
  assert.match(dto, /IsEmail/);
  assert.match(account, /Email này đã được sử dụng/u);
  assert.match(auth, /sid: phien\.id/);
  assert.match(auth, /ignoreExpiration: true/);
  assert.match(guard, /phienDangNhap\.findFirst/);
  assert.match(controller, /Đã đăng xuất hoàn toàn/u);
});


test("v2.8.6 API doi mat khau giu phien hien tai va thu hoi phien khac", () => {
  const controller = readFileSync("src/tai-khoan/tai-khoan.controller.ts", "utf8");
  const service = readFileSync("src/tai-khoan/tai-khoan.service.ts", "utf8");
  const dto = readFileSync("src/tai-khoan/dto/doi-mat-khau.dto.ts", "utf8");
  const guard = readFileSync("src/xac-thuc/jwt.guard.ts", "utf8");
  assert.match(controller, /Patch\("doi-mat-khau"\)/);
  assert.match(controller, /setCookie\("nhienin3d_phien"/);
  assert.match(service, /argon2\.verify/);
  assert.match(service, /argon2\.argon2id/);
  assert.match(service, /id:\s*\{ not: phien_id \}/);
  assert.match(dto, /Mật khẩu mới tối thiểu 12 ký tự/u);
  assert.match(guard, /phien_id:\s*payload\.sid/);
});

test("v2.8.6 API cap nhat nhan trinh duyet hien tai", () => {
  const controller = readFileSync("src/tai-khoan/tai-khoan.controller.ts", "utf8");
  const service = readFileSync("src/tai-khoan/tai-khoan.service.ts", "utf8");
  const loginDto = readFileSync("src/xac-thuc/dto/dang-nhap.dto.ts", "utf8");
  assert.match(controller, /Patch\("phien\/hien-tai"\)/);
  assert.match(service, /cap_nhat_phien_hien_tai/);
  assert.match(service, /trinh_duyet:/);
  assert.match(loginDto, /trinh_duyet_hien_thi/);
});


test("v2.8.9 admin xep super admin dau va logout thu hoi tat ca phien", () => {
  const admin = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const auth = readFileSync("src/xac-thuc/xac-thuc.service.ts", "utf8");
  const guard = readFileSync("src/xac-thuc/jwt.guard.ts", "utf8");
  const controller = readFileSync("src/xac-thuc/xac-thuc.controller.ts", "utf8");
  assert.match(admin, /ADMIN:\s*0/);
  assert.match(admin, /localeCompare\(b\.ho_ten, "vi"\)/);
  assert.match(auth, /where:\s*\{ nguoi_dung_id, da_thu_hoi: false \}/);
  assert.match(auth, /thu_hoi_tat_ca_phien/);
  assert.match(guard, /Phiên cũ cần đăng nhập lại/u);
  assert.match(controller, /Dọn cookie refresh legacy/u);
});


test("v2.9.3 dang ky luu phone address va Admin khong tu khoa minh", () => {
  const dto = readFileSync("src/xac-thuc/dto/dang-ky.dto.ts", "utf8");
  const auth = readFileSync("src/xac-thuc/xac-thuc.service.ts", "utf8");
  const admin = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  assert.match(dto, /so_dien_thoai/u);
  assert.match(dto, /dia_chi/u);
  assert.match(auth, /diaChiNguoiDung\.create/u);
  assert.match(admin, /Không thể tự khóa tài khoản Admin đang đăng nhập/u);
  assert.doesNotMatch(admin, /Siêu quản trị/u);
});


test("v2.9.3 Admin kich hoat lai va xoa moi tai khoan khac", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  assert.match(controller, /@Post\("nguoi-dung\/:id\/kich-hoat"\)/);
  assert.match(controller, /@Post\("nguoi-dung\/:id\/khoa"\)/);
  assert.match(controller, /@Delete\("nguoi-dung\/:id"\)/);
  assert.match(service, /da_kich_hoat: true, so_lan_dang_nhap_that_bai: 0, khoa_den: null/);
  assert.match(service, /ADMIN_KICH_HOAT_NGUOI_DUNG/);
  assert.match(service, /ADMIN_XOA_NGUOI_DUNG/);
  assert.match(service, /Không thể xóa chính tài khoản Admin đang đăng nhập/u);
  assert.doesNotMatch(service, /Siêu quản trị/u);
});


test("v2.9.3 migration gom QUAN_TRI va SIEU_QUAN_TRI vao ADMIN", () => {
  const migration = readFileSync("prisma/migrations/202608300001_v293_hop_nhat_admin/migration.sql", "utf8");
  assert.match(migration, /CREATE TYPE "VaiTro_v293" AS ENUM \('KHACH_HANG', 'NHAN_VIEN', 'QUAN_LY', 'ADMIN'\)/);
  assert.match(migration, /IN \('QUAN_TRI', 'SIEU_QUAN_TRI'\) THEN 'ADMIN'/);
  assert.match(migration, /DROP TYPE "VaiTro"/);
});


test("v2.9.4 seed khong ghi de ho so va trang thai tai khoan da thay doi", () => {
  const seed = readFileSync("prisma/seed.ts", "utf8");
  const account = readFileSync("src/tai-khoan/tai-khoan.service.ts", "utf8");
  assert.match(seed, /admin_dang_hoat_dong/);
  assert.match(seed, /where:\s*\{ vai_tro: VaiTro\.ADMIN, da_kich_hoat: true \}/);
  assert.match(seed, /Dữ liệu mẫu chỉ bootstrap lần đầu/u);
  assert.match(seed, /Chỉ đổi miền email legacy một lần/u);
  assert.match(seed, /Không tạo lại địa chỉ mẫu/u);
  assert.match(seed, /id:\s*\{ not: id_mac_dinh \}/);
  assert.match(seed, /bootstrap lần đầu|bootstrap bản ghi còn thiếu/u);
  assert.match(seed, /const nhan_vien = ho_so_cu \?\? await db\.nhanVien\.create/);
  assert.doesNotMatch(seed, /nguoiDung\.upsert\(\{[\s\S]{0,220}update:\s*\{ ho_ten, vai_tro, da_kich_hoat: false \}/);
  assert.match(account, /id:\s*\{ not: hien_tai\.id \}, la_mac_dinh: true/);
  assert.match(account, /data:\s*\{ la_mac_dinh: false \}/);
});


test("v2.9.5 API chi con Admin va nhan vien ban hang, xoa tai khoan on dinh", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const taoDto = readFileSync("src/quan-tri/dto/tao-nhan-vien.dto.ts", "utf8");
  const capNhatDto = readFileSync("src/quan-tri/dto/cap-nhat-nhan-vien.dto.ts", "utf8");
  const account = readFileSync("src/tai-khoan/tai-khoan.service.ts", "utf8");
  const migration = readFileSync("prisma/migrations/202608300002_v295_nhan_vien_ban_hang/migration.sql", "utf8");
  assert.doesNotMatch(schema, /\bQUAN_LY\b/);
  assert.match(schema, /enum VaiTro[\s\S]*KHACH_HANG[\s\S]*NHAN_VIEN[\s\S]*ADMIN/);
  assert.match(controller, /@Post\("nguoi-dung\/:id\/xoa"\)/);
  assert.match(service, /tx\.donHang\.updateMany/);
  assert.match(service, /tx\.gioHang\.updateMany/);
  assert.match(service, /tx\.phienDangNhap\.deleteMany/);
  assert.match(service, /chuc_danh: "Nhân viên bán hàng"/u);
  assert.match(service, /bo_phan: "Bán hàng"/u);
  assert.match(service, /da_kich_hoat: false/);
  assert.doesNotMatch(taoDto, /vai_tro|chuc_danh|bo_phan/);
  assert.doesNotMatch(capNhatDto, /chuc_danh|bo_phan/);
  assert.match(account, /return tx\.nguoiDung\.findUniqueOrThrow/);
  assert.match(migration, /WHEN "vai_tro"::text = 'QUAN_LY' THEN 'KHACH_HANG'/);
});


test("v2.9.7 API luu trang thai nhan vien va doc lai sau commit", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  assert.match(controller, /@Post\("nhan-vien\/:id\/trang-thai"\)/);
  assert.match(service, /await this\.db\.\$transaction/);
  assert.match(service, /this\.db\.nhanVien\.findUniqueOrThrow/);
  assert.match(service, /da_doc_lai_sau_commit: true/);
  assert.match(service, /TrangThaiNhanVien\.TAM_NGHI/);
  assert.match(service, /TrangThaiNhanVien\.NGHI_VIEC/);
});


test("v2.9.8 vai tro he thong co dinh khong doi qua PATCH nguoi dung", () => {
  const dto = readFileSync("src/quan-tri/dto/cap-nhat-nguoi-dung.dto.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  assert.doesNotMatch(dto, /vai_tro/);
  assert.doesNotMatch(service, /dto\.vai_tro/);
  assert.match(service, /PATCH người dùng không còn được đổi vai trò/u);
});


test("v2.9.9 API co 2 ca mac dinh va endpoint sua xoa ca", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const dto = readFileSync("src/quan-tri/dto/cap-nhat-ca-lam.dto.ts", "utf8");
  const migration = readFileSync("prisma/migrations/202608300003_v299_hai_ca_lam_va_quan_ly_ca/migration.sql", "utf8");
  const seed = readFileSync("prisma/seed.ts", "utf8");
  assert.match(controller, /@Patch\("ca-lam\/:id"\)/);
  assert.match(controller, /@Delete\("ca-lam\/:id"\)/);
  assert.match(service, /kiem_tra_khung_gio/);
  assert.match(service, /async cap_nhat_ca/);
  assert.match(service, /async xoa_ca/);
  assert.match(service, /tx\.phanCa\.deleteMany/);
  assert.match(dto, /dang_hoat_dong/);
  assert.match(migration, /06:00/);
  assert.match(migration, /14:00/);
  assert.match(migration, /22:00/);
  assert.match(seed, /\["CA01", "Ca sáng", "06:00", "14:00"/u);
  assert.match(seed, /\["CA02", "Ca chiều", "14:00", "22:00"/u);
});


test("v2.10.0 API cho sua xoa phan ca da xep va xoa ca bang POST alias", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const dto = readFileSync("src/quan-tri/dto/cap-nhat-phan-ca.dto.ts", "utf8");
  assert.match(controller, /@Post\("ca-lam\/:id\/xoa"\)/);
  assert.match(controller, /@Post\("phan-ca\/:id\/xoa"\)/);
  assert.match(service, /Không chặn chỉnh sửa mẫu ca khi đã có phân công/u);
  assert.match(service, /nhan_vien_id = dto\.nhan_vien_id/);
  assert.match(service, /ca_lam_viec_id = dto\.ca_lam_viec_id/);
  assert.match(service, /ngay_lam = dto\.ngay_lam/);
  assert.match(dto, /@IsOptional\(\) @IsUUID\(\) nhan_vien_id/);
  assert.match(dto, /@IsOptional\(\) @IsUUID\(\) ca_lam_viec_id/);
});


test("v2.10.1 API cap nhat khach hang va POST alias cho ca phan ca", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const dto = readFileSync("src/quan-tri/dto/cap-nhat-nguoi-dung.dto.ts", "utf8");
  assert.match(controller, /@Post\("nguoi-dung\/:id\/cap-nhat"\)/);
  assert.match(controller, /@Post\("ca-lam\/:id\/cap-nhat"\)/);
  assert.match(controller, /@Post\("phan-ca\/:id\/cap-nhat"\)/);
  assert.match(dto, /@IsOptional\(\) @IsEmail\(\).*thu_dien_tu/);
  assert.match(dto, /dia_chi_mac_dinh/);
  assert.match(service, /diaChiNguoiDung\.update/);
  assert.match(service, /da_doc_lai_sau_commit: true/);
  assert.match(service, /phanCa\.findUniqueOrThrow/);
});


test("v2.10.2 API sua CORS profile va doi mat khau", () => {
  const main = readFileSync("src/main.ts", "utf8");
  const controller = readFileSync("src/tai-khoan/tai-khoan.controller.ts", "utf8");
  const seed = readFileSync("prisma/seed.ts", "utf8");
  assert.match(main, /methods: \["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"\]/);
  assert.match(main, /allowedHeaders/);
  assert.match(controller, /@Post\("ho-so"\)/);
  assert.match(controller, /cap_nhat_ho_so_post/);
  assert.match(controller, /@Post\("doi-mat-khau"\)/);
  assert.match(controller, /doi_mat_khau_post/);
  assert.match(controller, /xu_ly_doi_mat_khau/);
  assert.match(seed, /admin_theo_email/);
  assert.match(seed, /ADMIN_PASSWORD chỉ dùng khi tạo tài khoản lần đầu/u);
});

test("v2.11.0 API tong quan co dashboard kinh doanh chi danh cho Admin", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  assert.match(controller, /@VaiTroChoPhep\(VaiTro\.ADMIN\)/);
  assert.match(controller, /@Get\("tong-quan"\)/);
  assert.match(service, /MUI_GIO_VIET_NAM/);
  assert.match(service, /TrangThaiDonHang\.HOAN_TAT/);
  assert.match(service, /doanh_thu_hom_nay/);
  assert.match(service, /doanh_thu_7_ngay/);
  assert.match(service, /doanh_thu_30_ngay/);
  assert.match(service, /gia_tri_don_trung_binh_30_ngay/);
  assert.match(service, /top_san_pham_30_ngay/);
  assert.match(service, /so_luong_ton: \{ lte: 5 \}/);
});


test("v2.12.0 API co lich su don hang quan tri san pham ton kho va audit", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync("prisma/migrations/202608300004_v212_quan_tri_don_hang_audit/migration.sql", "utf8");
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const checkout = readFileSync("src/thanh-toan/thanh-toan.service.ts", "utf8");
  const seed = readFileSync("prisma/seed.ts", "utf8");
  assert.match(schema, /model LichSuDonHang/);
  assert.match(migration, /Khởi tạo lịch sử từ dữ liệu trước v2\.12\.0/u);
  assert.match(controller, /@Get\("don-hang"\)/);
  assert.match(controller, /@Get\("don-hang\/:id"\)/);
  assert.match(controller, /@Post\("don-hang\/:id\/trang-thai"\)/);
  assert.match(controller, /@Get\("san-pham"\)/);
  assert.match(controller, /@Post\("san-pham\/:id\/cap-nhat"\)/);
  assert.match(controller, /@Post\("bien-the\/:id\/ton-kho"\)/);
  assert.match(controller, /@Get\("nhat-ky"\)/);
  assert.match(service, /chuyenHopLe/);
  assert.match(service, /TrangThaiDonHang\.DA_HUY/);
  assert.match(service, /lichSuDonHang\.create/);
  assert.match(service, /startsWith: "ADMIN_"/);
  assert.match(checkout, /Khách hàng tạo đơn hàng/u);
  assert.match(seed, /Khởi tạo lịch sử đơn hàng mẫu v2\.12\.0/u);
});


test("v2.13.0 API cho Admin tao sua xoa san pham va luu anh local", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const dto = readFileSync("src/quan-tri/dto/tao-san-pham-quan-tri.dto.ts", "utf8");
  const seed = readFileSync("prisma/seed.ts", "utf8");
  const main = readFileSync("src/main.ts", "utf8");
  assert.match(controller, /@Post\("san-pham"\)/);
  assert.match(controller, /@Post\("san-pham\/:id\/cap-nhat"\)/);
  assert.match(controller, /@Post\("san-pham\/:id\/xoa"\)/);
  assert.match(dto, /anh_chinh_data_url/);
  assert.match(service, /data:image/);
  assert.match(service, /jpeg\|png\|webp/);
  assert.match(service, /ADMIN_TAO_SAN_PHAM/);
  assert.match(service, /ADMIN_XOA_SAN_PHAM/);
  assert.match(service, /__ADMIN_DELETED__:/);
  assert.match(seed, /update: \{\}/);
  assert.match(main, /bodyLimit: 3 \* 1024 \* 1024/);
});


test("v2.15.0 API CRUD danh muc bien the duyet danh gia va xuat CSV", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const reviews = readFileSync("src/danh-gia/danh-gia.service.ts", "utf8");
  for (const route of [
    '@Get("danh-muc")', '@Post("danh-muc")', '@Post("danh-muc/:id/cap-nhat")', '@Post("danh-muc/:id/xoa")',
    '@Post("san-pham/:id/bien-the")', '@Post("bien-the/:id/cap-nhat")', '@Post("bien-the/:id/xoa")',
    '@Get("danh-gia")', '@Post("danh-gia/:id/trang-thai")', '@Post("danh-gia/:id/xoa")', '@Get("bao-cao/:loai")'
  ]) assert.match(controller, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(service, /ADMIN_TAO_DANH_MUC/);
  assert.match(service, /ADMIN_TAO_BIEN_THE/);
  assert.match(service, /ADMIN_DUYET_DANH_GIA/);
  assert.match(service, /ten_goc: `don-hang_\$\{tu\}_\$\{den\}`/);
  assert.match(service, /ten_goc: `doanh-thu_\$\{tu\}_\$\{den\}`/);
  assert.match(service, /ten_goc: `ton-kho_\$\{den\}`/);
  assert.match(service, /ten_file: `\$\{ten_goc\}\.csv`/);
  assert.match(service, /\/\^\[=\+\\-@\]\//);
  assert.match(reviews, /const da_duyet = false/);
  assert.match(reviews, /đang chờ Admin duyệt/u);
});


test("v2.15.1 API ghi nhan non-COD ngay va COD khi Admin xac nhan da giao", () => {
  const checkout = readFileSync("src/thanh-toan/thanh-toan.service.ts", "utf8");
  const admin = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const seed = readFileSync("prisma/seed.ts", "utf8");
  assert.match(checkout, /const thanh_toan_ngay = phuong_thuc\.ma_phuong_thuc !== "COD"/);
  assert.match(checkout, /ngay_thanh_toan: da_thanh_toan \? new Date\(\) : null/);
  assert.match(admin, /thanh_toan_duoc_ghi_nhan/);
  assert.match(admin, /chi_xac_nhan_doanh_thu/);
  assert.match(admin, /trang_thai_moi === TrangThaiDonHang\.HOAN_TAT/);
  assert.match(admin, /doanhThuDaGhiNhan/);
  assert.match(admin, /Ngày ghi nhận/);
  assert.match(seed, /ma_phuong_thuc !== "COD" \|\| don\.trang_thai === TrangThaiDonHang\.HOAN_TAT/);
  assert.match(seed, /thanh_toan_truoc_can_chot/);
});


test("v2.15.2 API fix typecheck seed va xuat XLSX khong can thu vien ngoai", () => {
  const controller = readFileSync("src/quan-tri/quan-tri.controller.ts", "utf8");
  const service = readFileSync("src/quan-tri/quan-tri.service.ts", "utf8");
  const seed = readFileSync("prisma/seed.ts", "utf8");
  assert.match(controller, /@Get\("bao-cao\/:loai\/excel"\)/);
  assert.match(service, /private tao_xlsx/);
  assert.match(service, /0x04034b50/);
  assert.match(service, /xuat_bao_cao_excel/);
  assert.match(service, /\.xlsx/);
  assert.match(seed, /new Map<string, \{ id: string; tong_tien: unknown; trang_thai: TrangThaiDonHang \}>/);
});
