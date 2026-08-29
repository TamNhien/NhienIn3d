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

test("seed v2.2.0 dam bao 17 bang nghiep vu toi thieu 10 dong", () => {
  const seed = readFileSync('prisma/seed.ts', 'utf8');
  for (const bang of [
    'nguoi_dung', 'danh_muc', 'san_pham', 'hinh_anh_san_pham',
    'vat_lieu', 'mau_sac', 'bien_the_san_pham', 'don_hang',
    'chi_tiet_don_hang', 'phien_dang_nhap', 'nhat_ky_bao_mat', 'phien_ban_seed',
    'gio_hang', 'chi_tiet_gio_hang', 'phuong_thuc_thanh_toan', 'thanh_toan', 'dia_chi_nguoi_dung'
  ]) {
    assert.match(seed, new RegExp(`${bang}: await db\\.`));
  }
  assert.match(seed, /so_luong < 10/);
  assert.match(seed, /PHIEN_BAN_HIEN_TAI = "SEED_V220_GIAO_DIEN_3D_TINH_GON"/);
  assert.match(seed, /\/images\/khoi-lap-phuong-banh-rang\.jpg/);
});


test("API hien thi dung version v2.2.1 o health va OpenAPI", () => {
  const health = readFileSync("src/suc-khoe/suc-khoe.controller.ts", "utf8");
  const main = readFileSync("src/main.ts", "utf8");
  assert.match(health, /phien_ban: "v2\.2\.1"/);
  assert.match(main, /setVersion\("2\.2\.1"\)/);
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
