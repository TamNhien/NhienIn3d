import { config as docEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

docEnv({ path: resolve(process.cwd(), ".env") });
docEnv({ path: resolve(process.cwd(), "../../.env") });

function taoDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const host = process.env.POSTGRES_HOST?.trim() || "localhost";
  const port = process.env.POSTGRES_PORT?.trim() || "5434";
  const database = process.env.POSTGRES_DB?.trim() || "nhienin3d";
  const user = process.env.POSTGRES_USER?.trim() || "nhienin3d_app";
  const password = process.env.POSTGRES_PASSWORD;
  if (!password) throw new Error("Thiếu POSTGRES_PASSWORD hoặc DATABASE_URL.");
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?schema=public`;
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: taoDatabaseUrl() }) });

const dem = {
  nguoi_dung: await db.nguoiDung.count(),
  danh_muc: await db.danhMuc.count(),
  san_pham: await db.sanPham.count(),
  hinh_anh_san_pham: await db.hinhAnhSanPham.count(),
  vat_lieu: await db.vatLieu.count(),
  mau_sac: await db.mauSac.count(),
  bien_the_san_pham: await db.bienTheSanPham.count(),
  don_hang: await db.donHang.count(),
  chi_tiet_don_hang: await db.chiTietDonHang.count(),
  phien_dang_nhap: await db.phienDangNhap.count(),
  nhat_ky_bao_mat: await db.nhatKyBaoMat.count(),
  phien_ban_seed: await db.phienBanSeed.count(),
  gio_hang: await db.gioHang.count(),
  chi_tiet_gio_hang: await db.chiTietGioHang.count(),
  phuong_thuc_thanh_toan: await db.phuongThucThanhToan.count(),
  thanh_toan: await db.thanhToan.count(),
  dia_chi_nguoi_dung: await db.diaChiNguoiDung.count(),
  yeu_thich: await db.yeuThich.count(),
  danh_gia_san_pham: await db.danhGiaSanPham.count(),
  dat_lai_mat_khau: await db.datLaiMatKhau.count(),
  nhan_vien: await db.nhanVien.count(),
  ca_lam_viec: await db.caLamViec.count(),
  phan_ca: await db.phanCa.count()
};

console.table(dem);
// Dữ liệu vận hành được Admin phép xóa/chỉnh nên không thể ép số lượng tối thiểu.
// Các bảng dữ liệu mẫu tĩnh vẫn phải có ít nhất 10 dòng như thiết kế ban đầu.
const bang_bien_dong = new Set(["nguoi_dung", "nhan_vien", "ca_lam_viec", "phan_ca"]);
const thieu = Object.entries(dem).filter(([bang, so_luong]) => !bang_bien_dong.has(bang) && so_luong < 10);
if (thieu.length) {
  console.error(`❌ Chưa đủ dữ liệu mẫu: ${thieu.map(([bang, so]) => `${bang}=${so}`).join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("✅ Dữ liệu mẫu tĩnh đạt yêu cầu; tài khoản/nhân sự/ca/phân ca được phép chỉnh sửa hoặc xóa.");
}

await db.$disconnect();
