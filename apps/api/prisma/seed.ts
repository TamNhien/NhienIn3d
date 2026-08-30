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
  TrangThaiDonHang,
  TrangThaiGioHang,
  TrangThaiThanhToan,
  TrangThaiNhanVien,
  TrangThaiPhanCa
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

const PHIEN_BAN_HIEN_TAI = "SEED_V2100_QUAN_LY_CA";

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
    anh: "/images/khoi-lap-phuong-banh-rang.jpg",
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
  ["minh.anh.demo@nhienin3d.local", "nguyen.minh.anh@example.com", "Nguyễn Minh Anh", VaiTro.KHACH_HANG],
  ["hoang.nam.demo@nhienin3d.local", "tran.hoang.nam@example.com", "Trần Hoàng Nam", VaiTro.KHACH_HANG],
  ["thu.ha.demo@nhienin3d.local", "le.thu.ha@example.com", "Lê Thu Hà", VaiTro.KHACH_HANG],
  ["gia.huy.demo@nhienin3d.local", "pham.gia.huy@example.com", "Phạm Gia Huy", VaiTro.KHACH_HANG],
  ["ngoc.linh.demo@nhienin3d.local", "vo.ngoc.linh@example.com", "Võ Ngọc Linh", VaiTro.KHACH_HANG],
  ["quoc.bao.demo@nhienin3d.local", "dang.quoc.bao@example.com", "Đặng Quốc Bảo", VaiTro.KHACH_HANG],
  ["khanh.vy.demo@nhienin3d.local", "bui.khanh.vy@example.com", "Bùi Khánh Vy", VaiTro.KHACH_HANG],
  ["duc.anh.demo@nhienin3d.local", "hoang.duc.anh@example.com", "Hoàng Đức Anh", VaiTro.KHACH_HANG],
  ["mai.phuong.demo@nhienin3d.local", "do.mai.phuong@example.com", "Đỗ Mai Phương", VaiTro.KHACH_HANG]
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


const phuong_thuc_thanh_toan = [
  ["COD", "Thanh toán khi nhận hàng", "Thanh toán tiền mặt khi đơn hàng được giao.", true],
  ["CHUYEN_KHOAN", "Chuyển khoản ngân hàng", "Chuyển khoản theo nội dung đơn hàng do NhienIn3d cung cấp.", true],
  ["VNPAY", "VNPay", "Cổng thanh toán VNPay - giả lập được khi chạy local, chưa bật tích hợp production.", false],
  ["MOMO", "MoMo", "Ví điện tử MoMo - giả lập được khi chạy local, chưa bật tích hợp production.", false],
  ["ZALOPAY", "ZaloPay", "Ví điện tử ZaloPay - giả lập được khi chạy local, chưa bật tích hợp production.", false],
  ["SHOPEEPAY", "ShopeePay", "Ví điện tử ShopeePay - giả lập được khi chạy local, chưa bật tích hợp production.", false],
  ["NAPAS", "Thẻ nội địa NAPAS", "Thanh toán thẻ nội địa - giả lập local, chưa bật production.", false],
  ["THE_QUOC_TE", "Visa / Mastercard", "Thanh toán thẻ quốc tế - giả lập local, chưa bật production.", false],
  ["APPLE_PAY", "Apple Pay", "Thanh toán Apple Pay - giả lập local, chưa bật production.", false],
  ["GOOGLE_PAY", "Google Pay", "Thanh toán Google Pay - giả lập local, chưa bật production.", false]
] as const;

const dia_chi_mau = [
  ["Nguyễn Minh Anh", "0912001001", "Đà Nẵng", "Hải Châu", "Hòa Cường Bắc", "12 Nguyễn Văn Linh"],
  ["Trần Hoàng Nam", "0912001002", "TP. Hồ Chí Minh", "Quận 1", "Bến Nghé", "25 Lê Lợi"],
  ["Lê Thu Hà", "0912001003", "Hà Nội", "Hà Đông", "Mộ Lao", "18 Trần Phú"],
  ["Phạm Gia Huy", "0912001004", "Cần Thơ", "Ninh Kiều", "Tân An", "40 Hùng Vương"],
  ["Võ Ngọc Linh", "0912001005", "Huế", "Thuận Hóa", "Phú Hội", "09 Nguyễn Huệ"],
  ["Đặng Quốc Bảo", "0912001006", "Đồng Nai", "Biên Hòa", "Thống Nhất", "33 Võ Thị Sáu"],
  ["Bùi Khánh Vy", "0912001007", "Quảng Ninh", "Hạ Long", "Bạch Đằng", "15 Quang Trung"],
  ["Hoàng Đức Anh", "0912001008", "Đắk Lắk", "Buôn Ma Thuột", "Tân Lợi", "21 Phan Chu Trinh"],
  ["Đỗ Mai Phương", "0912001009", "Gia Lai", "Quy Nhơn", "Lê Lợi", "08 Lý Thường Kiệt"],
  ["Lê Minh Quân", "0912001010", "Khánh Hòa", "Nha Trang", "Lộc Thọ", "52 Trần Hưng Đạo"]
] as const;

const nhan_vien_mau = [
  ["N3D-NV-001", "nguyen.thanh.cong@example.com", "Nguyễn Thành Công", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-002", "tran.minh.khoa@example.com", "Trần Minh Khoa", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-003", "le.thao.nguyen@example.com", "Lê Thảo Nguyên", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-004", "pham.quoc.viet@example.com", "Phạm Quốc Việt", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-005", "vo.hoang.yen@example.com", "Võ Hoàng Yến", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-006", "dang.minh.tam@example.com", "Đặng Minh Tâm", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-007", "bui.gia.han@example.com", "Bùi Gia Hân", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-008", "hoang.tuan.kiet@example.com", "Hoàng Tuấn Kiệt", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-009", "do.ngoc.mai@example.com", "Đỗ Ngọc Mai", "Nhân viên bán hàng", "Bán hàng"],
  ["N3D-NV-010", "nguyen.hai.dang@example.com", "Nguyễn Hải Đăng", "Nhân viên bán hàng", "Bán hàng"]
] as const;

const ca_lam_mau = [
  ["CA01", "Ca sáng", "06:00", "14:00", "#38BDF8"],
  ["CA02", "Ca chiều", "14:00", "22:00", "#A855F7"]
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
  ["SEED_V200_GIO_HANG_10", "V2 tạo 10 giỏ hàng và 10 chi tiết giỏ hàng mẫu."],
  ["SEED_V200_PHUONG_THUC_THANH_TOAN_10", "V2 tạo 10 phương thức thanh toán mẫu, chỉ bật phương thức đã hỗ trợ."],
  ["SEED_V200_THANH_TOAN_10", "V2 tạo 10 giao dịch thanh toán mẫu liên kết đơn hàng."],
  ["SEED_V200_DIA_CHI_10", "V2 tạo 10 địa chỉ người dùng mẫu."],
  ["SEED_V200_GIO_HANG_THANH_TOAN", "NhienIn3d V2 bổ sung giỏ hàng, checkout và nền tảng thanh toán."],
  ["SEED_V210_THANH_TOAN_GIA_LAP_LOCAL", "NhienIn3d v2.1.0 cho phép giả lập cổng thanh toán online khi chạy local; production vẫn khóa phương thức chưa tích hợp thật."],
  ["SEED_V220_GIAO_DIEN_3D_TINH_GON", "NhienIn3d v2.2.0 tinh gọn storefront, bổ sung trình xem ảnh 3D tương tác và ảnh local cho sản phẩm khối lập phương bánh răng."],
  ["SEED_V230_YEU_THICH_TIM_KIEM", "NhienIn3d v2.3.0 bổ sung yêu thích lưu PostgreSQL, trang danh sách sản phẩm và bộ lọc/tìm kiếm nâng cao."],
  ["SEED_V241_SAP_XEP_SAN_PHAM_TANG_DAN", "NhienIn3d v2.4.1 chuẩn hóa thứ tự hiển thị sản phẩm tăng dần theo số thứ tự trong mã sản phẩm trên API và storefront."],
  ["SEED_V250_DANH_GIA_SAN_PHAM", "NhienIn3d v2.5.0 bổ sung đánh giá sản phẩm có duyệt, điểm sao, sản phẩm liên quan và lịch sử xem gần đây."],
  ["SEED_V260_TAI_KHOAN_PHAN_QUYEN", "NhienIn3d v2.6.0 bổ sung đăng ký, đăng nhập, refresh session, khóa đăng nhập và RBAC 5 vai trò."],
  ["SEED_V261_CHON_MAU_SAN_PHAM", "NhienIn3d v2.6.1 bỏ xem 3D sản phẩm không chính xác và bổ sung 3 lựa chọn màu cho mỗi sản phẩm mẫu."],
  ["SEED_V270_QUEN_MAT_KHAU_EMAIL", "NhienIn3d v2.7.0 bổ sung quên mật khẩu qua email, token dùng một lần và thu hồi toàn bộ phiên cũ sau khi đặt lại."],
  ["SEED_V281_GMAIL_SMTP", "NhienIn3d v2.8.1 bổ sung cấu hình Gmail/SMTP bằng biến MAIL_*, STARTTLS bắt buộc và công cụ kiểm tra SMTP."],
  ["SEED_V283_FIX_JWT_GUARD_DI", "NhienIn3d v2.8.3 sửa dependency injection JwtGuard/JwtService để API tài khoản và quản trị khởi động ổn định."],
  ["SEED_V284_DANG_NHAP_DANG_KI_GON", "NhienIn3d v2.8.4 tinh gọn giao diện đăng nhập/đăng kí, đặt Quên mật khẩu ngang hàng với Ghi nhớ tài khoản."],
  ["SEED_V285_DU_LIEU_NGUOI_DUNG_HO_SO_LOGOUT", "NhienIn3d v2.8.5 chuẩn hóa dữ liệu người dùng mẫu, cho sửa email hồ sơ, sửa logout session và đổi màu trực tiếp trên ảnh sản phẩm."],
  ["SEED_V286_TAI_KHOAN_MAT_KHAU_BRAVE", "NhienIn3d v2.8.6 nhận diện Brave, lưu hồ sơ bền vững và đổi mật khẩu ngay trong trang Tài khoản."],
  ["SEED_V294_PERSIST_TAI_KHOAN_HO_SO", "NhienIn3d v2.9.4 không reset hồ sơ/trạng thái kích hoạt/địa chỉ/nhân viên đã chỉnh khi chạy lại seed."],
  [PHIEN_BAN_HIEN_TAI, "NhienIn3d v2.10.0 cho phép chỉnh/xóa mẫu ca và phân ca đã xếp; seed không tái tạo dữ liệu vận hành bị Admin xóa."]
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

  // 10 người dùng: 1 Admin + 9 tài khoản mẫu bị vô hiệu hóa.
  // v2.8.6: ADMIN_EMAIL/ADMIN_NAME chỉ dùng bootstrap lần đầu.
  // Nếu đã có Admin đang hoạt động thì tuyệt đối không ghi đè họ tên/email/mật khẩu do chính Admin đã sửa trong trang Tài khoản.
  const nguoi_dung: { id: string; ho_ten: string; thu_dien_tu: string }[] = [];
  const thu_dien_tu_quan_tri = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const admin_password = process.env.ADMIN_PASSWORD;
  const ho_ten_quan_tri = process.env.ADMIN_NAME?.trim() || "Quản trị NhienIn3d";

  const admin_dang_hoat_dong = await db.nguoiDung.findFirst({
    where: { vai_tro: VaiTro.ADMIN, da_kich_hoat: true },
    orderBy: { ngay_tao: "asc" }
  });

  if (admin_dang_hoat_dong) {
    // Giữ nguyên dữ liệu người dùng đã chỉnh; seed chỉ bảo đảm quyền Admin và trạng thái hoạt động.
    const admin = await db.nguoiDung.update({
      where: { id: admin_dang_hoat_dong.id },
      data: { vai_tro: VaiTro.ADMIN, da_kich_hoat: true }
    });
    nguoi_dung.push(admin);
  } else if (thu_dien_tu_quan_tri && admin_password && admin_password.length >= 12) {
    // Nếu email bootstrap đã tồn tại thì giữ nguyên mật khẩu/hồ sơ người dùng đã chỉnh.
    // ADMIN_PASSWORD chỉ dùng khi tạo tài khoản lần đầu, không reset mật khẩu sau khi Admin đổi trên web.
    const admin_theo_email = await db.nguoiDung.findUnique({ where: { thu_dien_tu: thu_dien_tu_quan_tri } });
    if (admin_theo_email) {
      const admin = await db.nguoiDung.update({
        where: { id: admin_theo_email.id },
        data: { vai_tro: VaiTro.ADMIN, da_kich_hoat: true }
      });
      nguoi_dung.push(admin);
    } else {
      const mat_khau_bam = await argon2.hash(admin_password, { type: argon2.argon2id });
      const admin = await db.nguoiDung.create({
        data: { thu_dien_tu: thu_dien_tu_quan_tri, mat_khau_bam, ho_ten: ho_ten_quan_tri, vai_tro: VaiTro.ADMIN, da_kich_hoat: true }
      });
      nguoi_dung.push(admin);
    }
  } else {
    const mat_khau_bam = await argon2.hash(randomBytes(32).toString("base64url"), { type: argon2.argon2id });
    const admin_mau = await db.nguoiDung.upsert({
      where: { thu_dien_tu: "le.minh.quan@example.com" },
      update: { vai_tro: VaiTro.ADMIN, da_kich_hoat: false },
      create: { thu_dien_tu: "le.minh.quan@example.com", mat_khau_bam, ho_ten: "Lê Minh Quân", vai_tro: VaiTro.ADMIN, da_kich_hoat: false }
    });
    nguoi_dung.push(admin_mau);
    console.warn("⚠️ Chưa có ADMIN_EMAIL/ADMIN_PASSWORD hợp lệ: đã tạo Admin mẫu bị vô hiệu hóa.");
  }

  const mat_khau_mau_bam = await argon2.hash(randomBytes(32).toString("base64url"), { type: argon2.argon2id });
  for (const [thu_dien_tu_cu, thu_dien_tu, ho_ten, vai_tro] of nguoi_dung_mau) {
    // Dữ liệu mẫu chỉ bootstrap lần đầu. Nếu tài khoản đã tồn tại thì giữ nguyên
    // họ tên, email đã đổi, vai trò và trạng thái kích hoạt do người dùng/Admin chỉnh.
    let user = await db.nguoiDung.findUnique({ where: { thu_dien_tu } });
    if (!user) {
      const tai_khoan_cu = await db.nguoiDung.findUnique({ where: { thu_dien_tu: thu_dien_tu_cu } });
      if (tai_khoan_cu) {
        // Chỉ đổi miền email legacy một lần; tuyệt đối không reset hồ sơ/trạng thái.
        user = await db.nguoiDung.update({ where: { id: tai_khoan_cu.id }, data: { thu_dien_tu } });
      } else {
        user = await db.nguoiDung.create({
          data: { thu_dien_tu, ho_ten, vai_tro, mat_khau_bam: mat_khau_mau_bam, da_kich_hoat: false }
        });
      }
    }
    nguoi_dung.push(user);
  }

  // v2.6.1: mỗi sản phẩm có 3 lựa chọn màu thật trong PostgreSQL.
  // Giữ BT01 để không phá giỏ hàng/đơn mẫu cũ, bổ sung BT02 và BT03 idempotent.
  const ma_vat_lieu = ["PETG", "PLA", "PETG", "PETG", "PLA", "PLA", "PLA", "PETG", "PLA", "PETG"];
  const bo_mau_san_pham = [
    ["DEN", "CAM", "TRANG"],
    ["TRANG", "DEN", "XANH_DUONG"],
    ["CAM", "TRANG", "XANH_LA"],
    ["XAM", "DEN", "TRANG"],
    ["DO", "DEN", "XANH_DUONG"],
    ["VANG", "TRANG", "DEN"],
    ["TIM", "XANH_DUONG", "HONG"],
    ["XANH_DUONG", "DEN", "CAM"],
    ["TRANG", "VANG", "HONG"],
    ["DEN", "XAM", "DO"]
  ] as const;
  const bien_the_map = new Map<string, { id: string; ma_bien_the: string; so_luong_ton: number; gia_chenh_lech: unknown }>();
  for (let i = 0; i < san_pham.length; i++) {
    const sp = san_pham[i];
    for (let j = 0; j < bo_mau_san_pham[i].length; j++) {
      const ma_bien_the = `${sp.ma_san_pham}-BT${String(j + 1).padStart(2, "0")}`;
      const so_luong_ton = Math.max(3, 8 + i - j);
      const gia_chenh_lech = i % 3 === 0 ? 20000 : 0;
      const bien_the = await db.bienTheSanPham.upsert({
        where: { ma_bien_the },
        update: {
          san_pham_id: san_pham_map.get(sp.ma_san_pham)!.id,
          vat_lieu_id: vat_lieu_map.get(ma_vat_lieu[i])!,
          mau_sac_id: mau_sac_map.get(bo_mau_san_pham[i][j])!,
          gia_chenh_lech,
          so_luong_ton,
          dang_hien_thi: true
        },
        create: {
          ma_bien_the,
          san_pham_id: san_pham_map.get(sp.ma_san_pham)!.id,
          vat_lieu_id: vat_lieu_map.get(ma_vat_lieu[i])!,
          mau_sac_id: mau_sac_map.get(bo_mau_san_pham[i][j])!,
          gia_chenh_lech,
          so_luong_ton,
          dang_hien_thi: true
        }
      });
      if (j === 0) bien_the_map.set(sp.ma_san_pham, bien_the);
    }
  }

  // v2.3.0: 10 dòng yêu thích mẫu, mỗi phiên gắn với một sản phẩm khác nhau.
  for (let i = 0; i < 10; i++) {
    const sp = san_pham[i];
    const ma_phien = `N3D-YT-MAU-${String(i + 1).padStart(2, "0")}-PHIEN`;
    await db.yeuThich.upsert({
      where: { ma_phien_san_pham_id: { ma_phien, san_pham_id: san_pham_map.get(sp.ma_san_pham)!.id } },
      update: {},
      create: { ma_phien, san_pham_id: san_pham_map.get(sp.ma_san_pham)!.id }
    });
  }


  // v2.5.0: 10 đánh giá mẫu đã duyệt, mỗi sản phẩm một đánh giá để bảng mới luôn có dữ liệu thật dễ kiểm tra.
  const danh_gia_mau = [
    ["Nguyễn Minh Anh", 5, "Chi tiết in sắc nét, lắp ráp chắc chắn và đóng gói cẩn thận."],
    ["Trần Hoàng Nam", 4, "Thiết kế hữu ích, bề mặt đẹp và đúng mô tả sản phẩm."],
    ["Lê Thu Hà", 5, "Màu in đẹp, kích thước vừa vặn và hoàn thiện tốt."],
    ["Phạm Gia Huy", 4, "Cơ cấu hoạt động ổn, sản phẩm cầm chắc tay."],
    ["Võ Ngọc Linh", 5, "Dùng trên bàn làm việc rất gọn, chất lượng vượt mong đợi."],
    ["Đặng Quốc Bảo", 4, "Ánh sáng và bề mặt sản phẩm đẹp, đúng phong cách decor."],
    ["Bùi Khánh Vy", 5, "Bánh răng quay mượt, màu phối nổi bật và thú vị."],
    ["Hoàng Đức Anh", 4, "Khay chắc chắn, sắp xếp linh kiện rất tiện."],
    ["Đỗ Mai Phương", 5, "Ảnh lithophane lên rõ, phù hợp làm quà tặng cá nhân hóa."],
    ["Lê Minh Quân", 5, "Vỏ vừa Raspberry Pi 5, thoáng khí và bố trí cổng hợp lý."]
  ] as const;
  for (let i = 0; i < san_pham.length; i++) {
    const sp = san_pham[i];
    const [ho_ten, so_sao, noi_dung] = danh_gia_mau[i];
    const san_pham_id = san_pham_map.get(sp.ma_san_pham)!.id;
    const ma_phien = `N3D-DG-MAU-${String(i + 1).padStart(2, "0")}-PHIEN`;
    await db.danhGiaSanPham.upsert({
      where: { ma_phien_san_pham_id: { ma_phien, san_pham_id } },
      update: { ho_ten, so_sao, noi_dung, da_duyet: true },
      create: { ma_phien, san_pham_id, ho_ten, so_sao, noi_dung, da_duyet: true }
    });
  }

  // V2: 10 địa chỉ mẫu chỉ dùng để bootstrap. Không tạo lại địa chỉ mẫu theo
  // chuỗi địa chỉ cũ vì việc đó từng làm địa chỉ người dùng vừa sửa bị "quay về" sau mỗi seed.
  for (let i = 0; i < 10; i++) {
    const user = nguoi_dung[i];
    const [ten_nguoi_nhan, so_dien_thoai, tinh_thanh, quan_huyen, phuong_xa, dia_chi_cu_the] = dia_chi_mau[i];
    const dia_chi_hien_co = await db.diaChiNguoiDung.findMany({
      where: { nguoi_dung_id: user.id },
      orderBy: { ngay_tao: "asc" },
      select: { id: true, la_mac_dinh: true }
    });
    if (!dia_chi_hien_co.length) {
      await db.diaChiNguoiDung.create({
        data: { nguoi_dung_id: user.id, ten_nguoi_nhan, so_dien_thoai, tinh_thanh, quan_huyen, phuong_xa, dia_chi_cu_the, la_mac_dinh: true }
      });
      continue;
    }

    // Sửa dữ liệu cũ từng bị seed tạo nhiều địa chỉ mặc định: giữ bản ghi được tạo
    // đầu tiên (bản ghi người dùng đã chỉnh tại chỗ) và bỏ cờ mặc định ở các bản sao sau.
    const mac_dinh = dia_chi_hien_co.filter(x => x.la_mac_dinh);
    const id_mac_dinh = (mac_dinh[0] ?? dia_chi_hien_co[0]).id;
    await db.diaChiNguoiDung.update({ where: { id: id_mac_dinh }, data: { la_mac_dinh: true } });
    if (dia_chi_hien_co.length > 1) {
      await db.diaChiNguoiDung.updateMany({
        where: { nguoi_dung_id: user.id, id: { not: id_mac_dinh }, la_mac_dinh: true },
        data: { la_mac_dinh: false }
      });
    }
  }

  // V2: 10 phương thức thanh toán. Chỉ COD và chuyển khoản được bật mặc định.
  const phuong_thuc_map = new Map<string, string>();
  for (let i = 0; i < phuong_thuc_thanh_toan.length; i++) {
    const [ma_phuong_thuc, ten_phuong_thuc, mo_ta, dang_hoat_dong] = phuong_thuc_thanh_toan[i];
    const item = await db.phuongThucThanhToan.upsert({
      where: { ma_phuong_thuc },
      update: { ten_phuong_thuc, mo_ta, dang_hoat_dong, thu_tu: i + 1 },
      create: { ma_phuong_thuc, ten_phuong_thuc, mo_ta, dang_hoat_dong, thu_tu: i + 1 }
    });
    phuong_thuc_map.set(ma_phuong_thuc, item.id);
  }

  // V2: 10 giỏ hàng mẫu + 10 chi tiết, idempotent.
  for (let i = 0; i < 10; i++) {
    const sp = san_pham[i];
    const bien_the = bien_the_map.get(sp.ma_san_pham)!;
    const gio = await db.gioHang.upsert({
      where: { ma_phien: `N3D-GIO-MAU-${String(i + 1).padStart(2, "0")}` },
      update: {
        nguoi_dung_id: nguoi_dung[i].id,
        trang_thai: i < 8 ? TrangThaiGioHang.DANG_MO : TrangThaiGioHang.DA_DAT_HANG,
        ngay_het_han: new Date(Date.now() + (14 + i) * 24 * 60 * 60 * 1000)
      },
      create: {
        ma_phien: `N3D-GIO-MAU-${String(i + 1).padStart(2, "0")}`,
        nguoi_dung_id: nguoi_dung[i].id,
        trang_thai: i < 8 ? TrangThaiGioHang.DANG_MO : TrangThaiGioHang.DA_DAT_HANG,
        ngay_het_han: new Date(Date.now() + (14 + i) * 24 * 60 * 60 * 1000)
      }
    });
    await db.chiTietGioHang.upsert({
      where: { gio_hang_id_bien_the_id: { gio_hang_id: gio.id, bien_the_id: bien_the.id } },
      update: { so_luong: (i % 3) + 1, don_gia: Number(sp.gia_ban) + Number(bien_the.gia_chenh_lech) },
      create: { gio_hang_id: gio.id, bien_the_id: bien_the.id, so_luong: (i % 3) + 1, don_gia: Number(sp.gia_ban) + Number(bien_the.gia_chenh_lech) }
    });
  }

  // 10 đơn hàng + 10 chi tiết đơn hàng (mỗi đơn 1 dòng chi tiết để dữ liệu dễ quan sát).
  const don_hang_map = new Map<string, { id: string; tong_tien: unknown }>();
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

    don_hang_map.set(ma_don_hang, don);
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

  // V2: 10 giao dịch thanh toán mẫu, mỗi đơn hàng một giao dịch.
  for (let i = 0; i < don_hang_mau.length; i++) {
    const [ma_don_hang] = don_hang_mau[i];
    const don = don_hang_map.get(ma_don_hang)!;
    const ma_phuong_thuc = i % 2 === 0 ? "COD" : "CHUYEN_KHOAN";
    const trang_thai = i % 4 === 0 ? TrangThaiThanhToan.DA_THANH_TOAN : TrangThaiThanhToan.CHO_THANH_TOAN;
    await db.thanhToan.upsert({
      where: { ma_giao_dich: `N3D-TT-MAU-${String(i + 1).padStart(4, "0")}` },
      update: {
        don_hang_id: don.id,
        phuong_thuc_id: phuong_thuc_map.get(ma_phuong_thuc)!,
        so_tien: Number(don.tong_tien),
        trang_thai,
        noi_dung: `Giao dịch mẫu V2 cho ${ma_don_hang}`,
        ngay_thanh_toan: trang_thai === TrangThaiThanhToan.DA_THANH_TOAN ? new Date() : null
      },
      create: {
        don_hang_id: don.id,
        phuong_thuc_id: phuong_thuc_map.get(ma_phuong_thuc)!,
        ma_giao_dich: `N3D-TT-MAU-${String(i + 1).padStart(4, "0")}`,
        so_tien: Number(don.tong_tien),
        trang_thai,
        noi_dung: `Giao dịch mẫu V2 cho ${ma_don_hang}`,
        ngay_thanh_toan: trang_thai === TrangThaiThanhToan.DA_THANH_TOAN ? new Date() : null
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

  // v2.7.0: 10 bản ghi đặt lại mật khẩu lịch sử đã hết hạn/đã sử dụng.
  // Chỉ lưu SHA-256 của mã giả lập, tuyệt đối không seed token còn hiệu lực.
  for (let i = 0; i < 10; i++) {
    const ma_bi_mat_bam = createHash("sha256").update(`nhienin3d-reset-lich-su-${i + 1}`).digest("hex");
    const het_han_luc = new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000);
    const ngay_su_dung = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
    await db.datLaiMatKhau.upsert({
      where: { ma_bi_mat_bam },
      update: { nguoi_dung_id: nguoi_dung[i].id, het_han_luc, da_su_dung: true, ngay_su_dung },
      create: {
        nguoi_dung_id: nguoi_dung[i].id,
        ma_bi_mat_bam,
        het_han_luc,
        da_su_dung: true,
        ngay_su_dung,
        dia_chi_ip: `203.0.113.${30 + i}`
      }
    });
  }

  // v2.9.5: nhân sự của NhienIn3d chỉ còn Nhân viên bán hàng. Migration v2.9.5
  // chuẩn hóa dữ liệu cũ đúng một lần; seed sau đó chỉ bootstrap bản ghi còn thiếu
  // để trạng thái do Admin chỉnh không bị reset khi chạy Docker lại.
  const nhan_vien_ids: string[] = [];
  for (let i = 0; i < nhan_vien_mau.length; i++) {
    const [ma_nhan_vien, thu_dien_tu, ho_ten, chuc_danh, bo_phan] = nhan_vien_mau[i];
    const thu_dien_tu_cu = `nhanvien${String(i + 1).padStart(2, "0")}.demo@nhienin3d.local`;
    const so_dien_thoai = `0908${String(100000 + i).slice(-6)}`;
    const ho_so_cu = await db.nhanVien.findUnique({ where: { ma_nhan_vien } });
    let user = ho_so_cu ? await db.nguoiDung.findUnique({ where: { id: ho_so_cu.nguoi_dung_id } }) : null;

    if (!user) user = await db.nguoiDung.findUnique({ where: { thu_dien_tu } });
    if (!user) {
      const user_legacy = await db.nguoiDung.findUnique({ where: { thu_dien_tu: thu_dien_tu_cu } });
      if (user_legacy) {
        user = await db.nguoiDung.update({ where: { id: user_legacy.id }, data: { thu_dien_tu } });
      } else {
        user = await db.nguoiDung.create({
          data: { thu_dien_tu, ho_ten, so_dien_thoai, vai_tro: VaiTro.NHAN_VIEN, mat_khau_bam: mat_khau_mau_bam, da_kich_hoat: true }
        });
      }
    } else if (user.thu_dien_tu === thu_dien_tu_cu) {
      const user_email_moi = await db.nguoiDung.findUnique({ where: { thu_dien_tu } });
      if (!user_email_moi || user_email_moi.id === user.id) {
        user = await db.nguoiDung.update({ where: { id: user.id }, data: { thu_dien_tu } });
      }
    }

    if (!ho_so_cu) {
      // Hồ sơ mới ở trạng thái ĐANG_LÀM phải đồng bộ tài khoản ngay từ lần seed đầu.
      // Những lần seed sau không chạm trạng thái để giữ thay đổi của Admin.
      user = await db.nguoiDung.update({
        where: { id: user.id },
        data: { vai_tro: VaiTro.NHAN_VIEN, da_kich_hoat: true, so_lan_dang_nhap_that_bai: 0, khoa_den: null }
      });
    }

    const nhan_vien = ho_so_cu ?? await db.nhanVien.create({
      data: {
        nguoi_dung_id: user.id, ma_nhan_vien, chuc_danh, bo_phan,
        ngay_vao_lam: new Date(Date.UTC(2026, 0, 2 + i)), trang_thai: TrangThaiNhanVien.DANG_LAM,
        ghi_chu: "Nhân viên bán hàng mẫu phục vụ kiểm thử phân ca."
      }
    });
    nhan_vien_ids.push(nhan_vien.id);
  }

  // v2.9.9: chỉ bootstrap đúng 2 ca mặc định một lần. Migration v2.9.9 đã tạo
  // CA01 06:00-14:00 và CA02 14:00-22:00. Nếu seed chạy độc lập trên môi trường
  // đặc biệt, chỉ tạo khi marker chưa tồn tại. Sau đó tuyệt đối không ghi đè/khôi
  // phục ca mà Admin đã chỉnh sửa hoặc xóa.
  const marker_hai_ca = await db.phienBanSeed.findUnique({ where: { phien_ban: "SEED_V299_HAI_CA_MAC_DINH" } });
  if (!marker_hai_ca) {
    for (const [ma_ca, ten_ca, gio_bat_dau, gio_ket_thuc, mau_hien_thi] of ca_lam_mau) {
      await db.caLamViec.upsert({
        where: { ma_ca },
        update: {},
        create: { ma_ca, ten_ca, gio_bat_dau, gio_ket_thuc, mau_hien_thi, dang_hoat_dong: true }
      });
    }
    await db.phienBanSeed.create({
      data: { phien_ban: "SEED_V299_HAI_CA_MAC_DINH", mo_ta: "Khởi tạo 2 ca mặc định; từ đây Admin tự chỉnh sửa/xóa." }
    });
  }

  const ca_hien_tai = await db.caLamViec.findMany({
    where: { ma_ca: { in: ["CA01", "CA02"] } },
    orderBy: { gio_bat_dau: "asc" }
  });
  const ca_ids = ca_hien_tai.map(x => x.id);

  // Phân ca mẫu cũng chỉ bootstrap một lần. Sau khi Admin chỉnh/xóa ca hoặc phân ca,
  // seed về sau không tái tạo dữ liệu vận hành đã bị thay đổi có chủ đích.
  const marker_phan_ca = await db.phienBanSeed.findUnique({ where: { phien_ban: "SEED_V299_PHAN_CA_MAU" } });
  if (!marker_phan_ca && ca_ids.length > 0) {
    for (let i = 0; i < 10; i++) {
      const ngay_lam = new Date(Date.UTC(2026, 7, 30 + i));
      const ca_lam_viec_id = ca_ids[i % ca_ids.length];
      const da_co = await db.phanCa.findFirst({ where: { nhan_vien_id: nhan_vien_ids[i], ngay_lam } });
      if (da_co) {
        await db.phanCa.update({ where: { id: da_co.id }, data: { ca_lam_viec_id, trang_thai: TrangThaiPhanCa.DA_XEP, ghi_chu: `Phân ca mẫu số ${i + 1}` } });
      } else {
        await db.phanCa.create({ data: { nhan_vien_id: nhan_vien_ids[i], ca_lam_viec_id, ngay_lam, trang_thai: TrangThaiPhanCa.DA_XEP, ghi_chu: `Phân ca mẫu số ${i + 1}` } });
      }
    }
    await db.phienBanSeed.create({
      data: { phien_ban: "SEED_V299_PHAN_CA_MAU", mo_ta: "Bootstrap phân ca mẫu luân phiên trên 2 ca v2.9.9; không tái tạo sau chỉnh sửa/xóa." }
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

  // Tài khoản/nhân sự/ca/phân ca là dữ liệu vận hành có quyền xóa, vì vậy không
  // ép số lượng tối thiểu sau khi bootstrap. Các bảng dữ liệu mẫu còn lại vẫn >= 10.
  const bang_bien_dong = new Set(["nguoi_dung", "nhan_vien", "ca_lam_viec", "phan_ca"]);
  const thieu = Object.entries(dem).filter(([bang, so_luong]) => !bang_bien_dong.has(bang) && so_luong < 10);
  if (thieu.length) {
    throw new Error(`Seed chưa đủ dữ liệu mẫu: ${thieu.map(([bang, so]) => `${bang}=${so}`).join(", ")}`);
  }

  console.table(dem);
  console.log(`✅ ${PHIEN_BAN_HIEN_TAI}: dữ liệu mẫu tĩnh đạt yêu cầu; dữ liệu vận hành được phép chỉnh sửa/xóa.`);
}

main()
  .catch((loi) => {
    console.error(loi);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
