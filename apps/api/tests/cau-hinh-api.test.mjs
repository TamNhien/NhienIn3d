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

test("seed v2.8.0 dam bao 23 bang nghiep vu toi thieu 10 dong", () => {
  const seed = readFileSync('prisma/seed.ts', 'utf8');
  for (const bang of [
    'nguoi_dung', 'danh_muc', 'san_pham', 'hinh_anh_san_pham',
    'vat_lieu', 'mau_sac', 'bien_the_san_pham', 'don_hang',
    'chi_tiet_don_hang', 'phien_dang_nhap', 'nhat_ky_bao_mat', 'phien_ban_seed',
    'gio_hang', 'chi_tiet_gio_hang', 'phuong_thuc_thanh_toan', 'thanh_toan', 'dia_chi_nguoi_dung', 'yeu_thich', 'danh_gia_san_pham', 'dat_lai_mat_khau', 'nhan_vien', 'ca_lam_viec', 'phan_ca'
  ]) {
    assert.match(seed, new RegExp(`${bang}: await db\\.`));
  }
  assert.match(seed, /so_luong < 10/);
  assert.match(seed, /PHIEN_BAN_HIEN_TAI = "SEED_V284_DANG_NHAP_DANG_KI_GON"/);
  assert.match(seed, /\/images\/khoi-lap-phuong-banh-rang\.jpg/);
});


test("API hien thi dung version v2.8.4 o health va OpenAPI", () => {
  const health = readFileSync("src/suc-khoe/suc-khoe.controller.ts", "utf8");
  const main = readFileSync("src/main.ts", "utf8");
  assert.match(health, /phien_ban: "v2\.8\.4"/);
  assert.match(main, /setVersion\("2\.8\.4"\)/);
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


test("v2.5.0 co danh gia san pham va che do duyet production", () => {
  const controller = readFileSync('src/danh-gia/danh-gia.controller.ts', 'utf8');
  const service = readFileSync('src/danh-gia/danh-gia.service.ts', 'utf8');
  assert.match(controller, /danh-gia/);
  assert.match(service, /NODE_ENV !== "production"/);
  assert.match(service, /da_duyet/);
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

test("v2.6.0 RBAC co JwtGuard VaiTroGuard va 5 vai tro", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const controller = readFileSync("src/xac-thuc/xac-thuc.controller.ts", "utf8");
  const jwt = readFileSync("src/xac-thuc/jwt.guard.ts", "utf8");
  const role = readFileSync("src/xac-thuc/vai-tro.guard.ts", "utf8");
  assert.match(schema, /SIEU_QUAN_TRI/);
  assert.match(jwt, /phien_ban_mat_khau/);
  assert.match(role, /KHOA_VAI_TRO/);
  assert.match(controller, /VaiTroChoPhep\(VaiTro\.QUAN_TRI, VaiTro\.SIEU_QUAN_TRI\)/);
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
  assert.match(service, /SIEU_QUAN_TRI/);
  assert.match(controller, /Patch\("nhan-vien\/:id"\)/);
  assert.match(service, /cap_nhat_nhan_vien/);
  for (const model of ["NhanVien", "CaLamViec", "PhanCa"]) assert.match(schema, new RegExp(`model\\s+${model}\\b`));
});

test("v2.8.0 VaiTroGuard cho SIEU_QUAN_TRI bypass", () => {
  const role = readFileSync("src/xac-thuc/vai-tro.guard.ts", "utf8");
  assert.match(role, /vai_tro === VaiTro\.SIEU_QUAN_TRI/);
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
