import { config as docEnv } from "dotenv";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  VaiTro,
  TrangThaiSanPham,
  TrangThaiNguon,
  TrangThaiDonHang
} from "../src/generated/prisma/client.js";

// Chạy được cả từ root workspace lẫn apps/api.
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

const adapter = new PrismaPg({ connectionString: taoDatabaseUrl() });
const db = new PrismaClient({ adapter });

const PHIEN_BAN_HIEN_TAI = "SEED_V002_MOI_BANG_TOI_THIEU_10_DONG";

const danh_muc = [
  ["HOBBY_RC", "Mô hình & RC", "mo-hinh-rc", "Mô hình cơ khí, xe điều khiển và sản phẩm lắp ráp."],
  ["BAN_LAM_VIEC", "Bàn làm việc", "ban-lam-viec", "Phụ kiện gọn gàng, tiện dụng cho góc làm việc."],
  ["TRANG_TRI", "Trang trí", "trang-tri", "Đồ decor và chậu cây in 3D."],
  ["GAMING", "Gaming", "gaming", "Phụ kiện cho góc máy và gaming setup."],
  ["DEN_QUA_TANG", "Đèn & quà tặng", "den-qua-tang", "Đèn trang trí và quà cá nhân hóa."],
  ["MAKER", "Maker & điện tử", "maker-dien-tu", "Vỏ mạch, hộp thiết bị và phụ kiện maker."],
  ["GIA_DUNG", "Đồ gia dụng", "do-gia-dung", "Phụ kiện gia đình và vật dụng tiện ích in 3D."],
  ["PHU_KIEN_XE", "Phụ kiện xe", "phu-kien-xe", "Giá đỡ và phụ kiện nhỏ cho ô tô, xe máy."],
  ["GIAO_DUC_STEM", "Giáo dục STEM", "giao-duc-stem", "Mô hình trực quan phục vụ học tập và thực hành STEM."],
  ["CA_NHAN_HOA", "Cá nhân hóa", "ca-nhan-hoa", "Sản phẩm khắc tên, ảnh, chữ hoặc thiết kế theo yêu cầu."]
] as const;

const vat_lieu = [
  ["PLA", "PLA", "Dễ in, bề mặt đẹp, phù hợp sản phẩm trang trí.", 1.0],
  ["PETG", "PETG", "Bền, dẻo hơn PLA, chịu ẩm tốt.", 1.15],
  ["ABS", "ABS", "Chịu nhiệt khá, phù hợp chi tiết kỹ thuật.", 1.25],
  ["TPU", "TPU dẻo", "Vật liệu đàn hồi cho chi tiết cần độ mềm.", 1.45],
  ["ASA", "ASA", "Kháng tia UV và thời tiết, phù hợp sản phẩm ngoài trời.", 1.35],
  ["PA", "Nylon PA", "Độ bền cơ học và khả năng chịu mài mòn cao.", 1.65],
  ["PC", "Polycarbonate", "Cứng, bền và chịu nhiệt cao.", 1.75],
  ["PLA_CF", "PLA sợi carbon", "PLA gia cường sợi carbon, bề mặt mờ và cứng.", 1.7],
  ["PETG_CF", "PETG sợi carbon", "PETG gia cường sợi carbon cho chi tiết kỹ thuật.", 1.85],
  ["PVA", "PVA hỗ trợ", "Vật liệu hỗ trợ hòa tan trong nước cho hình học phức tạp.", 2.0]
] as const;

const mau_sac = [
  ["DEN", "Đen", "#111827"],
  ["TRANG", "Trắng", "#F8FAFC"],
  ["CAM", "Cam", "#F97316"],
  ["XANH_DUONG", "Xanh dương", "#2563EB"],
  ["DO", "Đỏ", "#DC2626"],
  ["XANH_LA", "Xanh lá", "#16A34A"],
  ["VANG", "Vàng", "#EAB308"],
  ["TIM", "Tím", "#9333EA"],
  ["XAM", "Xám", "#6B7280"],
  ["HONG", "Hồng", "#EC4899"]
] as const;

const san_pham = [
  {
    ma_san_pham: "N3D-RC-001", ten_san_pham: "Xe RC Dragon R1 in 3D", duong_dan: "xe-rc-dragon-r1-in-3d",
    mo_ta_ngan: "Mẫu xe RC mã nguồn mở với nhiều chi tiết có thể in 3D và lắp ráp.", gia_ban: 1490000, gia_von: 920000, khoi_luong_gam: 780, thoi_gian_in_gio: 31, kich_thuoc: "Khoảng 330 × 180 × 120 mm", ma_danh_muc: "HOBBY_RC",
    anh: "https://media.printables.com/media/prints/240045/images/2175581_572d92ae-a3c7-42b1-afcb-ce10c328c366/cover-photo5.jpg",
    nguon: "https://www.printables.com/model/240045", thong_so: { vat_lieu_goi_y: "PETG/PLA+", do_day_lop_mm: 0.2, dau_phun_mm: 0.4 }
  },
  {
    ma_san_pham: "N3D-DESK-002", ten_san_pham: "Giá đỡ điện thoại bánh răng", duong_dan: "gia-do-dien-thoai-banh-rang",
    mo_ta_ngan: "Giá đỡ điện thoại cơ khí với cơ cấu bánh răng, phù hợp bàn làm việc.", gia_ban: 179000, gia_von: 78000, khoi_luong_gam: 95, thoi_gian_in_gio: 4.5, kich_thuoc: "110 × 85 × 105 mm", ma_danh_muc: "BAN_LAM_VIEC",
    anh: "https://media.printables.com/media/prints/1202776/rich_content/b35b7b3f-bd33-4b27-89f0-1619fb05ae3c/img20250222184203.jpg",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PLA", do_day_lop_mm: 0.2, dau_phun_mm: 0.4 }
  },
  {
    ma_san_pham: "N3D-DECOR-003", ten_san_pham: "Chậu cây xoắn ốc hiện đại", duong_dan: "chau-cay-xoan-oc-hien-dai",
    mo_ta_ngan: "Chậu cây decor với bề mặt xoắn, phù hợp cây nhỏ và bàn làm việc.", gia_ban: 299000, gia_von: 132000, khoi_luong_gam: 210, thoi_gian_in_gio: 8.2, kich_thuoc: "Ø140 × 125 mm", ma_danh_muc: "TRANG_TRI",
    anh: "https://media.printables.com/media/prints/225251/images/2056517_ec46c87c-5ed1-44ed-b8c6-64dcaed597cc/thumbs/cover/1200x630/jpg/dsc06287.jpg",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PLA/PETG", chong_nuoc: "Nên phủ bảo vệ nếu trồng trực tiếp" }
  },
  {
    ma_san_pham: "N3D-DESK-004", ten_san_pham: "Hộp cuộn cáp di động", duong_dan: "hop-cuon-cap-di-dong",
    mo_ta_ngan: "Phụ kiện quản lý cáp nhỏ gọn cho balo, bàn làm việc và bộ sạc.", gia_ban: 79000, gia_von: 31000, khoi_luong_gam: 42, thoi_gian_in_gio: 1.9, kich_thuoc: "72 × 72 × 20 mm", ma_danh_muc: "BAN_LAM_VIEC",
    anh: "https://media.printables.com/media/prints/564262/images/4519813_011a7764-e3f5-4b41-83f1-61dc9644ff2f/thumbs/inside/1280x960/jpg/20230826_083819.webp",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PETG", do_day_lop_mm: 0.2 }
  },
  {
    ma_san_pham: "N3D-GAME-005", ten_san_pham: "Giá treo tai nghe đôi", duong_dan: "gia-treo-tai-nghe-doi",
    mo_ta_ngan: "Giá đỡ hai tai nghe cho gaming setup, chân đế rộng và chắc chắn.", gia_ban: 399000, gia_von: 180000, khoi_luong_gam: 290, thoi_gian_in_gio: 10.5, kich_thuoc: "220 × 140 × 260 mm", ma_danh_muc: "GAMING",
    anh: "https://media.printables.com/media/prints/358656/images/3036990_1df0d722-47bc-4538-acb4-70a96dadd277/thumbs/inside/1280x960/jpeg/img_3710-2.webp",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PLA+", do_day_lop_mm: 0.2 }
  },
  {
    ma_san_pham: "N3D-LAMP-006", ten_san_pham: "Chụp đèn Radiant", duong_dan: "chup-den-radiant",
    mo_ta_ngan: "Chụp đèn in 3D tạo vân sáng mềm, phù hợp đèn ngủ và không gian decor.", gia_ban: 349000, gia_von: 155000, khoi_luong_gam: 175, thoi_gian_in_gio: 9.1, kich_thuoc: "Ø170 × 190 mm", ma_danh_muc: "DEN_QUA_TANG",
    anh: "https://media.printables.com/media/prints/891112/images/6822414_668058dc-1545-4fe5-afc2-536376ef1a25_b912f430-7e2a-4b14-a6cb-d7802c43fb1a/large_display_5fef9ca6-3f06-4bb7-90c1-9d610e21d1a0_891112.png",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PLA", luu_y: "Chỉ dùng bóng LED nhiệt thấp" }
  },
  {
    ma_san_pham: "N3D-TOY-007", ten_san_pham: "Khối lập phương bánh răng", duong_dan: "khoi-lap-phuong-banh-rang",
    mo_ta_ngan: "Mô hình cơ khí cầm tay với nhiều bánh răng chuyển động liên kết.", gia_ban: 199000, gia_von: 89000, khoi_luong_gam: 135, thoi_gian_in_gio: 6.4, kich_thuoc: "82 × 82 × 82 mm", ma_danh_muc: "HOBBY_RC",
    anh: "https://media.sketchfab.com/models/7f98240fd6d7462e9f57028b54e33bae/thumbnails/f9e86e9ff3204de59780f5fccc4ad401/b5f05db381004883a9a3b37d1437fcdd.jpeg",
    nguon: "https://sketchfab.com/", thong_so: { vat_lieu_goi_y: "PLA", can_lap_rap: true }
  },
  {
    ma_san_pham: "N3D-ORG-008", ten_san_pham: "Khay Gridfinity đa năng", duong_dan: "khay-gridfinity-da-nang",
    mo_ta_ngan: "Khay mô-đun Gridfinity để sắp xếp linh kiện, vít và dụng cụ nhỏ.", gia_ban: 129000, gia_von: 52000, khoi_luong_gam: 88, thoi_gian_in_gio: 3.4, kich_thuoc: "84 × 84 × 56 mm", ma_danh_muc: "BAN_LAM_VIEC",
    anh: "https://media.printables.com/media/prints/522794/images/4228859_4b44b288-f1e0-4da0-b6f8-ce4908f3836f/thumbs/inside/1280x960/jpg/20230708_102805.webp",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PLA/PETG", he_gridfinity: "2×2" }
  },
  {
    ma_san_pham: "N3D-GIFT-009", ten_san_pham: "Đèn Lithophane theo ảnh", duong_dan: "den-lithophane-theo-anh",
    mo_ta_ngan: "Đèn ảnh nổi cá nhân hóa từ ảnh khách hàng, phù hợp quà sinh nhật và kỷ niệm.", gia_ban: 449000, gia_von: 210000, khoi_luong_gam: 240, thoi_gian_in_gio: 12.8, kich_thuoc: "150 × 150 × 180 mm", ma_danh_muc: "DEN_QUA_TANG",
    anh: "https://media.printables.com/media/prints/884768/images/6779132_4696d008-34b2-401d-9c0b-321bff0f3ee9_25123318-9076-4c07-ae56-aa7fa0e01af1/2023-11-25_0b926c2790b63.webp",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PLA trắng", ca_nhan_hoa: true, dau_phun_mm: 0.4 }
  },
  {
    ma_san_pham: "N3D-MAKER-010", ten_san_pham: "Vỏ Raspberry Pi 5 thoáng khí", duong_dan: "vo-raspberry-pi-5-thoang-khi",
    mo_ta_ngan: "Vỏ bảo vệ Raspberry Pi 5 với khe thông gió và vị trí cổng kết nối đầy đủ.", gia_ban: 249000, gia_von: 105000, khoi_luong_gam: 105, thoi_gian_in_gio: 4.8, kich_thuoc: "100 × 72 × 40 mm", ma_danh_muc: "MAKER",
    anh: "https://media.printables.com/media/prints/742926/images/5800894_5fd750c3-9554-4676-904f-102be0b36c87_8d786ac5-674f-450b-bd34-081f4410b4c6/rpi-5-render-10.jpg",
    nguon: "https://www.printables.com/", thong_so: { vat_lieu_goi_y: "PETG", tuong_thich: "Raspberry Pi 5" }
  }
];

const nguoi_dung_mau = [
  ["minh.anh.demo@nhienin3d.local", "Nguyễn Minh Anh", VaiTro.KHACH_HANG],
  ["hoang.nam.demo@nhienin3d.local", "Trần Hoàng Nam", VaiTro.KHACH_HANG],
  ["thu.ha.demo@nhienin3d.local", "Lê Thu Hà", VaiTro.KHACH_HANG],
  ["gia.huy.demo@nhienin3d.local", "Phạm Gia Huy", VaiTro.KHACH_HANG],
  ["ngoc.linh.demo@nhienin3d.local", "Võ Ngọc Linh", VaiTro.KHACH_HANG],
  ["quoc.bao.demo@nhienin3d.local", "Đặng Quốc Bảo", VaiTro.KHACH_HANG],
  ["khanh.vy.demo@nhienin3d.local", "Bùi Khánh Vy", VaiTro.KHACH_HANG],
  ["duc.anh.demo@nhienin3d.local", "Hoàng Đức Anh", VaiTro.NHAN_VIEN],
  ["mai.phuong.demo@nhienin3d.local", "Đỗ Mai Phương", VaiTro.QUAN_LY]
] as const;

const don_hang_mau = [
  ["N3D-DH-0001", 0, 0, 1, "0912000001", "Số 12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng", TrangThaiDonHang.HOAN_TAT],
  ["N3D-DH-0002", 1, 1, 2, "0912000002", "Số 25 Lê Lợi, Quận 1, TP. Hồ Chí Minh", TrangThaiDonHang.DANG_GIAO],
  ["N3D-DH-0003", 2, 2, 1, "0912000003", "Số 18 Trần Phú, Hà Đông, Hà Nội", TrangThaiDonHang.DANG_SAN_XUAT],
  ["N3D-DH-0004", 3, 3, 3, "0912000004", "Số 40 Hùng Vương, Ninh Kiều, Cần Thơ", TrangThaiDonHang.DA_XAC_NHAN],
  ["N3D-DH-0005", 4, 4, 1, "0912000005", "Số 09 Nguyễn Huệ, Huế", TrangThaiDonHang.CHO_XAC_NHAN],
  ["N3D-DH-0006", 5, 5, 2, "0912000006", "Số 33 Võ Thị Sáu, Biên Hòa, Đồng Nai", TrangThaiDonHang.HOAN_TAT],
  ["N3D-DH-0007", 6, 6, 1, "0912000007", "Số 15 Quang Trung, Hạ Long, Quảng Ninh", TrangThaiDonHang.DA_HUY],
  ["N3D-DH-0008", 0, 7, 2, "0912000008", "Số 21 Phan Chu Trinh, Buôn Ma Thuột, Đắk Lắk", TrangThaiDonHang.DANG_GIAO],
  ["N3D-DH-0009", 1, 8, 1, "0912000009", "Số 08 Lý Thường Kiệt, Quy Nhơn, Gia Lai", TrangThaiDonHang.DANG_SAN_XUAT],
  ["N3D-DH-0010", 2, 9, 1, "0912000010", "Số 52 Trần Hưng Đạo, Nha Trang, Khánh Hòa", TrangThaiDonHang.HOAN_TAT]
] as const;

const phien_ban_seed = [
  ["SEED_V001_DU_LIEU_MAU", "Dữ liệu mẫu nền của NhienIn3d V1."],
  ["SEED_V002_DANH_MUC_10", "Bổ sung đủ 10 danh mục."],
  ["SEED_V002_VAT_LIEU_10", "Bổ sung đủ 10 vật liệu in 3D."],
  ["SEED_V002_MAU_SAC_10", "Bổ sung đủ 10 màu sắc."],
  ["SEED_V002_NGUOI_DUNG_10", "Bổ sung đủ 10 người dùng mẫu gồm quản trị."],
  ["SEED_V002_SAN_PHAM_10", "Chuẩn hóa 10 sản phẩm và 10 ảnh chính."],
  ["SEED_V002_BIEN_THE_10", "Tạo 10 biến thể sản phẩm."],
  ["SEED_V002_DON_HANG_10", "Tạo 10 đơn hàng và 10 chi tiết đơn hàng."],
  ["SEED_V002_NHAT_KY_10", "Tạo 10 phiên đăng nhập và 10 nhật ký bảo mật mẫu."],
  [PHIEN_BAN_HIEN_TAI, "Đảm bảo mỗi bảng nghiệp vụ NhienIn3d có tối thiểu 10 dòng dữ liệu mẫu."]
] as const;

async function main() {
  const danh_muc_map = new Map<string, string>();
  for (const [ma_danh_muc, ten_danh_muc, duong_dan, mo_ta] of danh_muc) {
    const item = await db.danhMuc.upsert({
      where: { ma_danh_muc },
      update: { ten_danh_muc, duong_dan, mo_ta },
      create: { ma_danh_muc, ten_danh_muc, duong_dan, mo_ta }
    });
    danh_muc_map.set(ma_danh_muc, item.id);
  }

  const vat_lieu_map = new Map<string, string>();
  for (const [ma_vat_lieu, ten_vat_lieu, mo_ta, he_so_gia] of vat_lieu) {
    const item = await db.vatLieu.upsert({
      where: { ma_vat_lieu },
      update: { ten_vat_lieu, mo_ta, he_so_gia },
      create: { ma_vat_lieu, ten_vat_lieu, mo_ta, he_so_gia }
    });
    vat_lieu_map.set(ma_vat_lieu, item.id);
  }

  const mau_sac_map = new Map<string, string>();
  for (const [ma_mau, ten_mau, ma_hex] of mau_sac) {
    const item = await db.mauSac.upsert({
      where: { ma_mau },
      update: { ten_mau, ma_hex },
      create: { ma_mau, ten_mau, ma_hex }
    });
    mau_sac_map.set(ma_mau, item.id);
  }

  const san_pham_map = new Map<string, { id: string; ten_san_pham: string; gia_ban: unknown }>();
  for (const item of san_pham) {
    const { ma_danh_muc, anh, nguon, ...du_lieu } = item;
    const da_tao = await db.sanPham.upsert({
      where: { ma_san_pham: item.ma_san_pham },
      update: {
        ...du_lieu,
        danh_muc_id: danh_muc_map.get(ma_danh_muc)!,
        trang_thai: TrangThaiSanPham.DANG_BAN,
        trang_thai_nguon: TrangThaiNguon.MAU_THAM_KHAO,
        nguon_tham_khao: nguon
      },
      create: {
        ...du_lieu,
        danh_muc_id: danh_muc_map.get(ma_danh_muc)!,
        trang_thai: TrangThaiSanPham.DANG_BAN,
        trang_thai_nguon: TrangThaiNguon.MAU_THAM_KHAO,
        nguon_tham_khao: nguon
      }
    });

    san_pham_map.set(item.ma_san_pham, da_tao);
    await db.hinhAnhSanPham.deleteMany({ where: { san_pham_id: da_tao.id } });
    await db.hinhAnhSanPham.create({
      data: {
        san_pham_id: da_tao.id,
        duong_dan_anh: anh,
        mo_ta_anh: `Ảnh tham khảo cho ${item.ten_san_pham}`,
        la_anh_chinh: true
      }
    });
  }

  // 10 người dùng: 1 quản trị + 9 tài khoản mẫu bị vô hiệu hóa.
  const nguoi_dung: { id: string; ho_ten: string; thu_dien_tu: string }[] = [];
  const thu_dien_tu_quan_tri = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const admin_password = process.env.ADMIN_PASSWORD;
  const ho_ten_quan_tri = process.env.ADMIN_NAME?.trim() || "Quản trị NhienIn3d";

  if (thu_dien_tu_quan_tri && admin_password && admin_password.length >= 12) {
    const mat_khau_bam = await argon2.hash(admin_password, { type: argon2.argon2id });
    const admin = await db.nguoiDung.upsert({
      where: { thu_dien_tu: thu_dien_tu_quan_tri },
      update: { ho_ten: ho_ten_quan_tri, vai_tro: VaiTro.QUAN_TRI, da_kich_hoat: true },
      create: { thu_dien_tu: thu_dien_tu_quan_tri, mat_khau_bam, ho_ten: ho_ten_quan_tri, vai_tro: VaiTro.QUAN_TRI, da_kich_hoat: true }
    });
    nguoi_dung.push(admin);
  } else {
    const mat_khau_bam = await argon2.hash(randomBytes(32).toString("base64url"), { type: argon2.argon2id });
    const admin_mau = await db.nguoiDung.upsert({
      where: { thu_dien_tu: "quantri.mau@nhienin3d.local" },
      update: { ho_ten: "Quản trị mẫu NhienIn3d", vai_tro: VaiTro.QUAN_TRI, da_kich_hoat: false },
      create: { thu_dien_tu: "quantri.mau@nhienin3d.local", mat_khau_bam, ho_ten: "Quản trị mẫu NhienIn3d", vai_tro: VaiTro.QUAN_TRI, da_kich_hoat: false }
    });
    nguoi_dung.push(admin_mau);
    console.warn("⚠️ Chưa có ADMIN_EMAIL/ADMIN_PASSWORD hợp lệ: đã tạo quản trị mẫu bị vô hiệu hóa.");
  }

  const mat_khau_mau_bam = await argon2.hash(randomBytes(32).toString("base64url"), { type: argon2.argon2id });
  for (const [thu_dien_tu, ho_ten, vai_tro] of nguoi_dung_mau) {
    const user = await db.nguoiDung.upsert({
      where: { thu_dien_tu },
      update: { ho_ten, vai_tro, da_kich_hoat: false },
      create: { thu_dien_tu, ho_ten, vai_tro, mat_khau_bam: mat_khau_mau_bam, da_kich_hoat: false }
    });
    nguoi_dung.push(user);
  }

  // 10 biến thể: mỗi sản phẩm có một biến thể mẫu.
  const ma_vat_lieu = ["PETG", "PLA", "PETG", "PETG", "PLA", "PLA", "PLA", "PETG", "PLA", "PETG"];
  const ma_mau = ["DEN", "TRANG", "CAM", "XAM", "DO", "VANG", "TIM", "XANH_DUONG", "TRANG", "DEN"];
  for (let i = 0; i < san_pham.length; i++) {
    const sp = san_pham[i];
    await db.bienTheSanPham.upsert({
      where: { ma_bien_the: `${sp.ma_san_pham}-BT01` },
      update: {
        san_pham_id: san_pham_map.get(sp.ma_san_pham)!.id,
        vat_lieu_id: vat_lieu_map.get(ma_vat_lieu[i])!,
        mau_sac_id: mau_sac_map.get(ma_mau[i])!,
        gia_chenh_lech: i % 3 === 0 ? 20000 : 0,
        so_luong_ton: 8 + i,
        dang_hien_thi: true
      },
      create: {
        ma_bien_the: `${sp.ma_san_pham}-BT01`,
        san_pham_id: san_pham_map.get(sp.ma_san_pham)!.id,
        vat_lieu_id: vat_lieu_map.get(ma_vat_lieu[i])!,
        mau_sac_id: mau_sac_map.get(ma_mau[i])!,
        gia_chenh_lech: i % 3 === 0 ? 20000 : 0,
        so_luong_ton: 8 + i,
        dang_hien_thi: true
      }
    });
  }

  // 10 đơn hàng + 10 chi tiết đơn hàng (mỗi đơn 1 dòng chi tiết để dữ liệu dễ quan sát).
  for (let i = 0; i < don_hang_mau.length; i++) {
    const [ma_don_hang, chi_so_user, chi_so_sp, so_luong, so_dien_thoai, dia_chi_giao_hang, trang_thai] = don_hang_mau[i];
    const sp = san_pham[chi_so_sp];
    const sp_db = san_pham_map.get(sp.ma_san_pham)!;
    const don_gia = Number(sp.gia_ban);
    const thanh_tien = don_gia * so_luong;
    const user = nguoi_dung[1 + (chi_so_user % 9)] ?? nguoi_dung[0];

    const don = await db.donHang.upsert({
      where: { ma_don_hang },
      update: {
        nguoi_dung_id: user.id,
        ho_ten_nguoi_nhan: user.ho_ten,
        so_dien_thoai,
        dia_chi_giao_hang,
        ghi_chu: `Đơn hàng mẫu số ${i + 1} của NhienIn3d`,
        tong_tien: thanh_tien,
        trang_thai
      },
      create: {
        ma_don_hang,
        nguoi_dung_id: user.id,
        ho_ten_nguoi_nhan: user.ho_ten,
        so_dien_thoai,
        dia_chi_giao_hang,
        ghi_chu: `Đơn hàng mẫu số ${i + 1} của NhienIn3d`,
        tong_tien: thanh_tien,
        trang_thai
      }
    });

    await db.chiTietDonHang.deleteMany({ where: { don_hang_id: don.id } });
    await db.chiTietDonHang.create({
      data: {
        don_hang_id: don.id,
        san_pham_id: sp_db.id,
        ten_san_pham: sp.ten_san_pham,
        ma_san_pham: sp.ma_san_pham,
        so_luong,
        don_gia,
        thanh_tien,
        tuy_chon: { du_lieu_mau: true, ghi_chu: "Thông số tùy chọn minh họa" }
      }
    });
  }

  // 10 phiên đăng nhập. Chỉ lưu hash mẫu, không có refresh token thật để sử dụng.
  for (let i = 0; i < 10; i++) {
    const user = nguoi_dung[i];
    const ma_lam_moi_bam = createHash("sha256").update(`nhienin3d-phien-mau-${i + 1}`).digest("hex");
    await db.phienDangNhap.upsert({
      where: { ma_lam_moi_bam },
      update: {
        nguoi_dung_id: user.id,
        dia_chi_ip: `192.0.2.${10 + i}`,
        trinh_duyet: `NhienIn3d Demo Browser ${i + 1}`,
        het_han_luc: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        da_thu_hoi: i % 4 === 0
      },
      create: {
        nguoi_dung_id: user.id,
        ma_lam_moi_bam,
        dia_chi_ip: `192.0.2.${10 + i}`,
        trinh_duyet: `NhienIn3d Demo Browser ${i + 1}`,
        het_han_luc: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        da_thu_hoi: i % 4 === 0
      }
    });
  }

  // 10 nhật ký bảo mật mẫu, tách biệt bằng tiền tố DU_LIEU_MAU_.
  await db.nhatKyBaoMat.deleteMany({ where: { loai_su_kien: { startsWith: "DU_LIEU_MAU_" } } });
  await db.nhatKyBaoMat.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      loai_su_kien: `DU_LIEU_MAU_${String(i + 1).padStart(2, "0")}`,
      nguoi_dung_id: nguoi_dung[i].id,
      dia_chi_ip: `198.51.100.${20 + i}`,
      chi_tiet: { mo_ta: `Sự kiện bảo mật mẫu số ${i + 1}`, muc_do: i % 3 === 0 ? "CAN_CHU_Y" : "THONG_TIN" }
    }))
  });

  // Bảng lịch sử seed cũng có 10 dòng trên database mới; trên DB đã dùng lâu có thể nhiều hơn 10.
  for (const [phien_ban, mo_ta] of phien_ban_seed) {
    await db.phienBanSeed.upsert({
      where: { phien_ban },
      update: { mo_ta },
      create: { phien_ban, mo_ta }
    });
  }

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
    phien_ban_seed: await db.phienBanSeed.count()
  };

  const thieu = Object.entries(dem).filter(([, so_luong]) => so_luong < 10);
  if (thieu.length) {
    throw new Error(`Seed chưa đủ 10 dòng: ${thieu.map(([bang, so]) => `${bang}=${so}`).join(", ")}`);
  }

  console.table(dem);
  console.log(`✅ ${PHIEN_BAN_HIEN_TAI}: mọi bảng nghiệp vụ có tối thiểu 10 dòng dữ liệu.`);
}

main()
  .catch((loi) => {
    console.error(loi);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
