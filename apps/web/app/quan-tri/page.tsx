"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { danhGiaMatKhau, TruongMatKhau } from "../../components/truong-mat-khau";
import { layTaiKhoan, TaiKhoan } from "../../lib/xac-thuc";
import {
  AdminNhanVien,
  AdminNguoiDung,
  AdminTongQuan,
  AdminDonHang,
  AdminDonHangChiTiet,
  AdminSanPham,
  AdminDanhMuc,
  AdminVatLieu,
  AdminMauSac,
  AdminCauHinhKho,
  KiemTraImportKhoAdmin,
  PhieuNhapKhoAdmin,
  NhaCungCapAdmin,
  TrangThaiCanhBaoKhoEmailAdmin,
  AdminSucKhoeHeThong,
  LichSuVanHanhAdmin,
  ThongKeVanHanhAdmin,
  CauHinhCanhBaoHeThongAdmin,
  SuCoVanHanhTomTat,
  ChiTietSuCoVanHanh,
  SlaVanHanhAdmin,
  AdminDanhGia,
  NhatKyAdmin,
  LichSuKhoAdmin,
  CaLam,
  capNhatCaLam,
  capNhatNguoiDung,
  capNhatNhanVien,
  capNhatPhanCa,
  capNhatTrangThaiDonHangAdmin,
  doiSoatDoanhThuDonDaGiaoAdmin,
  capNhatSanPhamAdmin,
  kichHoatNguoiDung,
  khoaNguoiDung,
  layCaLam,
  layNhanVien,
  layNguoiDung,
  layPhanCa,
  layTongQuan,
  layDonHangAdmin,
  layChiTietDonHangAdmin,
  laySanPhamAdmin,
  layDanhMucAdmin,
  layVatLieuAdmin,
  layMauSacAdmin,
  layCauHinhKhoAdmin,
  capNhatCauHinhKhoAdmin,
  taoVatLieuAdmin,
  capNhatVatLieuAdmin,
  xoaVatLieuAdmin,
  taoMauSacAdmin,
  capNhatMauSacAdmin,
  xoaMauSacAdmin,
  layLichSuKhoAdmin,
  kiemTraTepNhapKhoAdmin,
  nhapKhoTheoLoAdmin,
  layPhieuNhapKhoAdmin,
  layChiTietPhieuNhapKhoAdmin,
  xuatExcelPhieuNhapKhoAdmin,
  layNhaCungCapAdmin,
  taoNhaCungCapAdmin,
  capNhatNhaCungCapAdmin,
  xoaNhaCungCapAdmin,
  layTrangThaiCanhBaoKhoEmailAdmin,
  guiCanhBaoKhoEmailAdmin,
  layDanhGiaAdmin,
  taoDanhMucAdmin,
  capNhatDanhMucAdmin,
  xoaDanhMucAdmin,
  taoBienTheAdmin,
  capNhatBienTheAdmin,
  xoaBienTheAdmin,
  capNhatDanhGiaAdmin,
  xoaDanhGiaAdmin,
  layBaoCaoCsvAdmin,
  layBaoCaoExcelAdmin,
  layNhatKyAdmin,
  layNhatKyCursorAdmin,
  xuatNhatKyCsvAdmin,
  xuatNhatKyExcelAdmin,
  laySucKhoeHeThongAdmin,
  layLichSuVanHanhCursorAdmin,
  layCauHinhCanhBaoHeThongAdmin,
  capNhatCauHinhCanhBaoHeThongAdmin,
  laySlaVanHanhAdmin,
  layDanhSachSuCoVanHanhAdmin,
  layChiTietSuCoVanHanhAdmin,
  layThongKeVanHanhAdmin,
  xuatLichSuVanHanhExcelAdmin,
  guiCanhBaoHeThongAdmin,
  PhanCa,
  taoCaLam,
  taoNhanVien,
  taoPhanCa,
  taoSanPhamAdmin,
  xoaSanPhamAdmin,
  xoaCaLam,
  xoaNguoiDung,
  xoaPhanCa
} from "../../lib/quan-tri";

const homNay = () => new Date().toISOString().slice(0, 10);
const sauNgay = (so_ngay: number) => {
  const d = new Date();
  d.setDate(d.getDate() + so_ngay);
  return d.toISOString().slice(0, 10);
};
const ngayTuIso = (gia_tri: string) => gia_tri.slice(0, 10);
const dinhDangNgay = (gia_tri: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(new Date(`${ngayTuIso(gia_tri)}T00:00:00`));
const dinhDangTien = (gia_tri: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(gia_tri || 0);
const dinhDangDungLuong = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const don_vi = ["B", "KB", "MB", "GB", "TB"];
  const bac = Math.min(don_vi.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / (1024 ** bac)).toFixed(bac === 0 ? 0 : 1)} ${don_vi[bac]}`;
};
const layThayDoiAudit = (chi_tiet: Record<string, unknown>) => {
  const raw = chi_tiet?.thay_doi;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, { truoc?: unknown; sau?: unknown }> : {};
};
const dinhDangGiaTriAudit = (gia_tri: unknown) => {
  if (gia_tri === null || gia_tri === undefined || gia_tri === "") return "—";
  if (typeof gia_tri === "boolean") return gia_tri ? "Có" : "Không";
  if (typeof gia_tri === "object") return JSON.stringify(gia_tri);
  return String(gia_tri);
};
const nhanTrangThaiDon = (trang_thai: string) => ({
  CHO_XAC_NHAN: "Chờ xác nhận",
  DA_XAC_NHAN: "Đã xác nhận",
  DANG_SAN_XUAT: "Đang sản xuất",
  DANG_GIAO: "Đang giao",
  HOAN_TAT: "Đã giao / hoàn tất",
  DA_HUY: "Đã hủy"
}[trang_thai] || trang_thai);
const TRANG_THAI_DON = ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DANG_SAN_XUAT", "DANG_GIAO", "HOAN_TAT", "DA_HUY"] as const;
const nhanTrangThaiThanhToan = (trang_thai: string) => ({ CHO_THANH_TOAN: "Chờ thanh toán", DA_THANH_TOAN: "Đã thanh toán", THAT_BAI: "Thất bại", DA_HOAN_TIEN: "Đã hoàn tiền" }[trang_thai] || trang_thai);
const TRANG_THAI_TIEP_THEO: Record<string, string[]> = { CHO_XAC_NHAN: ["DA_XAC_NHAN", "DA_HUY", "HOAN_TAT"], DA_XAC_NHAN: ["DANG_SAN_XUAT", "DA_HUY", "HOAN_TAT"], DANG_SAN_XUAT: ["DANG_GIAO", "DA_HUY", "HOAN_TAT"], DANG_GIAO: ["HOAN_TAT"], HOAN_TAT: [], DA_HUY: ["HOAN_TAT"] };
const thanhToanDaGhiNhan = (don: AdminDonHangChiTiet | null) => don?.thanh_toan.find(tt => tt.trang_thai === "DA_THANH_TOAN") || null;
const thanhToanChoGhiNhan = (don: AdminDonHangChiTiet | null) => don?.thanh_toan.find(tt => tt.trang_thai === "CHO_THANH_TOAN" && tt.phuong_thuc.ma_phuong_thuc === "COD") || don?.thanh_toan.find(tt => tt.trang_thai === "CHO_THANH_TOAN") || null;
const thanhToanHienThi = (don: AdminDonHangChiTiet | null) => thanhToanDaGhiNhan(don) || thanhToanChoGhiNhan(don) || don?.thanh_toan[0] || null;
const canGhiNhanDoanhThuDonDaGiao = (don: AdminDonHangChiTiet | null) => Boolean(don && don.trang_thai === "HOAN_TAT" && !thanhToanDaGhiNhan(don) && thanhToanChoGhiNhan(don));
const daGhiNhanDoanhThu = (don: AdminDonHangChiTiet | null) => Boolean(don && don.trang_thai !== "DA_HUY" && (thanhToanDaGhiNhan(don) || (don.thanh_toan.length === 0 && don.trang_thai === "HOAN_TAT")));
const ngayVietNamClient = (gia_tri: string | Date) => new Date(new Date(gia_tri).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const capNhatTongQuanSauDon = (tong_quan: AdminTongQuan, trang_thai_cu: string, trang_thai_moi: string, doanh_thu?: AdminDonHangChiTiet["cap_nhat_doanh_thu"]) => {
  let ket_qua = tong_quan;
  if (trang_thai_cu !== trang_thai_moi) {
    const trang_thai = { ...ket_qua.trang_thai_don_hang };
    trang_thai[trang_thai_cu] = Math.max(0, Number(trang_thai[trang_thai_cu] || 0) - 1);
    trang_thai[trang_thai_moi] = Number(trang_thai[trang_thai_moi] || 0) + 1;
    const tang_da_giao = trang_thai_moi === "HOAN_TAT" && trang_thai_cu !== "HOAN_TAT";
    ket_qua = {
      ...ket_qua,
      trang_thai_don_hang: trang_thai,
      don_da_giao_theo_ky: tang_da_giao ? {
        hom_nay: ket_qua.don_da_giao_theo_ky.hom_nay + 1,
        bay_ngay: ket_qua.don_da_giao_theo_ky.bay_ngay + 1,
        ba_muoi_ngay: ket_qua.don_da_giao_theo_ky.ba_muoi_ngay + 1
      } : ket_qua.don_da_giao_theo_ky
    };
  }
  if (!doanh_thu?.da_ghi_nhan_moi || doanh_thu.so_tien <= 0) return ket_qua;
  const ngay = ngayVietNamClient(doanh_thu.ngay_ghi_nhan || new Date());
  const trong_30 = ngay >= ket_qua.ky_bao_cao.tu_30_ngay && ngay <= ket_qua.ky_bao_cao.hom_nay;
  if (!trong_30) return ket_qua;
  const trong_7 = ngay >= ket_qua.ky_bao_cao.tu_7_ngay && ngay <= ket_qua.ky_bao_cao.hom_nay;
  const la_hom_nay = ngay === ket_qua.ky_bao_cao.hom_nay;
  const so_don_30 = ket_qua.don_ghi_nhan_doanh_thu_theo_ky.ba_muoi_ngay + 1;
  const doanh_thu_30 = ket_qua.doanh_thu.ba_muoi_ngay + doanh_thu.so_tien;
  return {
    ...ket_qua,
    doanh_thu: {
      ...ket_qua.doanh_thu,
      hom_nay: ket_qua.doanh_thu.hom_nay + (la_hom_nay ? doanh_thu.so_tien : 0),
      bay_ngay: ket_qua.doanh_thu.bay_ngay + (trong_7 ? doanh_thu.so_tien : 0),
      ba_muoi_ngay: doanh_thu_30,
      gia_tri_don_trung_binh_30_ngay: so_don_30 ? Math.round(doanh_thu_30 / so_don_30) : 0
    },
    don_ghi_nhan_doanh_thu_theo_ky: {
      hom_nay: ket_qua.don_ghi_nhan_doanh_thu_theo_ky.hom_nay + (la_hom_nay ? 1 : 0),
      bay_ngay: ket_qua.don_ghi_nhan_doanh_thu_theo_ky.bay_ngay + (trong_7 ? 1 : 0),
      ba_muoi_ngay: so_don_30
    },
    doanh_thu_theo_ngay: ket_qua.doanh_thu_theo_ngay.map(item => item.ngay === ngay ? { ...item, doanh_thu: item.doanh_thu + doanh_thu.so_tien, so_don: item.so_don + 1 } : item)
  };
};
const nhanSuKienAudit = (loai: string) => ({
  ADMIN_CAP_NHAT_NGUOI_DUNG: "Cập nhật khách hàng", ADMIN_KICH_HOAT_NGUOI_DUNG: "Kích hoạt tài khoản", ADMIN_KHOA_NGUOI_DUNG: "Khóa tài khoản", ADMIN_XOA_NGUOI_DUNG: "Xóa tài khoản",
  ADMIN_TAO_NHAN_VIEN: "Tạo nhân viên", ADMIN_CAP_NHAT_NHAN_VIEN: "Cập nhật nhân viên", ADMIN_TAO_CA_LAM: "Tạo ca", ADMIN_CAP_NHAT_CA_LAM: "Cập nhật ca", ADMIN_XOA_CA_LAM: "Xóa ca",
  ADMIN_TAO_PHAN_CA: "Tạo phân ca", ADMIN_CAP_NHAT_PHAN_CA: "Cập nhật phân ca", ADMIN_XOA_PHAN_CA: "Xóa phân ca", ADMIN_CAP_NHAT_DON_HANG: "Cập nhật đơn hàng",
  ADMIN_TAO_SAN_PHAM: "Tạo sản phẩm", ADMIN_CAP_NHAT_SAN_PHAM: "Cập nhật sản phẩm", ADMIN_XOA_SAN_PHAM: "Xóa sản phẩm", ADMIN_CAP_NHAT_TON_KHO: "Cập nhật tồn kho",
  ADMIN_TAO_DANH_MUC: "Tạo danh mục", ADMIN_CAP_NHAT_DANH_MUC: "Cập nhật danh mục", ADMIN_XOA_DANH_MUC: "Xóa danh mục",
  ADMIN_TAO_BIEN_THE: "Tạo biến thể", ADMIN_CAP_NHAT_BIEN_THE: "Cập nhật biến thể", ADMIN_XOA_BIEN_THE: "Xóa biến thể",
  ADMIN_TAO_VAT_LIEU: "Tạo vật liệu", ADMIN_CAP_NHAT_VAT_LIEU: "Cập nhật vật liệu", ADMIN_XOA_VAT_LIEU: "Xóa vật liệu",
  ADMIN_TAO_MAU_SAC: "Tạo màu", ADMIN_CAP_NHAT_MAU_SAC: "Cập nhật màu", ADMIN_XOA_MAU_SAC: "Xóa màu", ADMIN_TAO_NHA_CUNG_CAP: "Tạo nhà cung cấp", ADMIN_CAP_NHAT_NHA_CUNG_CAP: "Cập nhật nhà cung cấp", ADMIN_XOA_NHA_CUNG_CAP: "Xóa nhà cung cấp", ADMIN_NHAP_KHO_THEO_LO: "Nhập kho theo lô", ADMIN_CAP_NHAT_CAU_HINH_KHO: "Cập nhật cảnh báo kho",
  ADMIN_DUYET_DANH_GIA: "Duyệt đánh giá", ADMIN_AN_DANH_GIA: "Ẩn đánh giá", ADMIN_XOA_DANH_GIA: "Xóa đánh giá"
}[loai] || loai.replaceAll("_", " "));

async function chuanHoaAnhSanPham(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Vui lòng chọn tệp ảnh JPEG, PNG hoặc WebP.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Ảnh gốc phải nhỏ hơn 15 MB.");
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không đọc được ảnh từ máy."));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Tệp ảnh không hợp lệ."));
    element.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.fillStyle = "#eef2f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  let quality = 0.88;
  let data = canvas.toDataURL("image/jpeg", quality);
  while (data.length > 1500000 && quality > 0.58) { quality -= 0.08; data = canvas.toDataURL("image/jpeg", quality); }
  if (data.length > 1750000) throw new Error("Ảnh vẫn quá lớn sau khi chuẩn hóa. Hãy chọn ảnh khác.");
  return data;
}


type TabQuanTri = "tong-quan" | "don-hang" | "san-pham" | "kho" | "nha-cung-cap" | "tham-chieu" | "danh-muc" | "danh-gia" | "bao-cao" | "khach-hang" | "nhan-vien" | "tao-nhan-vien" | "ca-lam" | "xep-ca" | "nhat-ky" | "he-thong";

export default function QuanTriPage() {
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);
  const [loi_xac_thuc, setLoiXacThuc] = useState("");
  const [tong_quan, setTongQuan] = useState<AdminTongQuan | null>(null);
  const [nguoi_dung, setNguoiDung] = useState<AdminNguoiDung[]>([]);
  const [nhan_vien, setNhanVien] = useState<AdminNhanVien[]>([]);
  const [ca_lam, setCaLam] = useState<CaLam[]>([]);
  const [phan_ca, setPhanCa] = useState<PhanCa[]>([]);
  const [don_hang, setDonHang] = useState<AdminDonHang[]>([]);
  const [don_chon, setDonChon] = useState<AdminDonHangChiTiet | null>(null);
  const [san_pham_qt, setSanPhamQt] = useState<AdminSanPham[]>([]);
  const [danh_muc_qt, setDanhMucQt] = useState<AdminDanhMuc[]>([]);
  const [vat_lieu_qt, setVatLieuQt] = useState<AdminVatLieu[]>([]);
  const [mau_sac_qt, setMauSacQt] = useState<AdminMauSac[]>([]);
  const [lich_su_kho, setLichSuKho] = useState<LichSuKhoAdmin[]>([]);
  const [cau_hinh_kho, setCauHinhKho] = useState<AdminCauHinhKho>({ nguong_sap_het: 5 });
  const [import_kho, setImportKho] = useState<KiemTraImportKhoAdmin | null>(null);
  const [phieu_nhap_kho, setPhieuNhapKho] = useState<PhieuNhapKhoAdmin[]>([]);
  const [phieu_nhap_chi_tiet, setPhieuNhapChiTiet] = useState<PhieuNhapKhoAdmin | null>(null);
  const [nha_cung_cap_qt, setNhaCungCapQt] = useState<NhaCungCapAdmin[]>([]);
  const [canh_bao_kho_email, setCanhBaoKhoEmail] = useState<TrangThaiCanhBaoKhoEmailAdmin | null>(null);
  const [nhap_lo_meta, setNhapLoMeta] = useState({ ma_lo: "", nha_cung_cap_id: "", ghi_chu: "" });
  const [kho_ly_do, setKhoLyDo] = useState<Record<string, string>>({});
  const [lich_su_kho_loc_loai, setLichSuKhoLocLoai] = useState("");
  const [phieu_nhap_tim_kiem, setPhieuNhapTimKiem] = useState("");
  const [phieu_nhap_loc_ncc, setPhieuNhapLocNcc] = useState("");
  const [phieu_nhap_tu_ngay, setPhieuNhapTuNgay] = useState(sauNgay(-29));
  const [phieu_nhap_den_ngay, setPhieuNhapDenNgay] = useState(homNay());
  const [ncc_tim_kiem, setNccTimKiem] = useState("");
  const [ncc_loc_hoat_dong, setNccLocHoatDong] = useState("");
  const [ncc_moi, setNccMoi] = useState({ ma_nha_cung_cap: "", ten_nha_cung_cap: "", nguoi_lien_he: "", so_dien_thoai: "", thu_dien_tu: "", dia_chi: "", ghi_chu: "", dang_hoat_dong: true });
  const [danh_gia_qt, setDanhGiaQt] = useState<AdminDanhGia[]>([]);
  const [nhat_ky, setNhatKy] = useState<NhatKyAdmin[]>([]);
  const [thong_bao, setThongBao] = useState("");
  const [tab, setTab] = useState<TabQuanTri>("tong-quan");
  const [dang_xu_ly, setDangXuLy] = useState<string | null>(null);
  const [tu_ngay, setTuNgay] = useState(homNay());
  const [den_ngay, setDenNgay] = useState(sauNgay(14));
  const [don_tim_kiem, setDonTimKiem] = useState("");
  const [don_loc_trang_thai, setDonLocTrangThai] = useState("");
  const [don_trang_thai_moi, setDonTrangThaiMoi] = useState("");
  const [don_ghi_chu, setDonGhiChu] = useState("");
  const [san_pham_tim_kiem, setSanPhamTimKiem] = useState("");
  const [kho_tim_kiem, setKhoTimKiem] = useState("");
  const [kho_loc_ton, setKhoLocTon] = useState("");
  const [kho_loc_vat_lieu, setKhoLocVatLieu] = useState("");
  const [kho_loc_mau, setKhoLocMau] = useState("");
  const [kho_loc_hien_thi, setKhoLocHienThi] = useState("");
  const [san_pham_chon_id, setSanPhamChonId] = useState("");
  const [tao_san_pham_mo, setTaoSanPhamMo] = useState(false);
  const [anh_sp_cho_luu, setAnhSpChoLuu] = useState<Record<string, string>>({});
  const [anh_sp_moi, setAnhSpMoi] = useState("");
  const [sp_moi, setSpMoi] = useState({ ma_san_pham: "", ten_san_pham: "", danh_muc_id: "", mo_ta_ngan: "", gia_ban: 0, kich_thuoc: "", khoi_luong_gam: 0, thoi_gian_in_gio: 0, trang_thai: "DANG_BAN" });
  const [dm_moi, setDmMoi] = useState({ ma_danh_muc: "", ten_danh_muc: "", mo_ta: "", thu_tu: 0, dang_hien_thi: true });
  const [bt_moi, setBtMoi] = useState({ san_pham_id: "", ma_bien_the: "", vat_lieu_id: "", mau_sac_id: "", gia_chenh_lech: 0, so_luong_ton: 0, dang_hien_thi: true });
  const [vl_moi, setVlMoi] = useState({ ma_vat_lieu: "", ten_vat_lieu: "", mo_ta: "", he_so_gia: 1 });
  const [ms_moi, setMsMoi] = useState({ ma_mau: "", ten_mau: "", ma_hex: "#FFFFFF" });
  const [danh_gia_loc, setDanhGiaLoc] = useState("");
  const [bao_cao_tu_ngay, setBaoCaoTuNgay] = useState(sauNgay(-29));
  const [bao_cao_den_ngay, setBaoCaoDenNgay] = useState(homNay());
  const [nhat_ky_tim_kiem, setNhatKyTimKiem] = useState("");
  const [nhat_ky_loai, setNhatKyLoai] = useState("");
  const [nhat_ky_nguoi_dung_id, setNhatKyNguoiDungId] = useState("");
  const [nhat_ky_tu_ngay, setNhatKyTuNgay] = useState(sauNgay(-29));
  const [nhat_ky_den_ngay, setNhatKyDenNgay] = useState(homNay());
  const [suc_khoe_he_thong, setSucKhoeHeThong] = useState<AdminSucKhoeHeThong | null>(null);
  const [thong_ke_van_hanh, setThongKeVanHanh] = useState<ThongKeVanHanhAdmin | null>(null);
  const [nhat_ky_cursor, setNhatKyCursor] = useState({ kich_thuoc: 25, co_them: false, next_cursor: null as string | null });
  const [lich_su_van_hanh, setLichSuVanHanh] = useState<LichSuVanHanhAdmin[]>([]);
  const [van_hanh_cursor, setVanHanhCursor] = useState({ kich_thuoc: 20, co_them: false, next_cursor: null as string | null });
  const [van_hanh_loai, setVanHanhLoai] = useState("");
  const [van_hanh_trang_thai, setVanHanhTrangThai] = useState("");
  const [cau_hinh_canh_bao_he_thong, setCauHinhCanhBaoHeThong] = useState<CauHinhCanhBaoHeThongAdmin>({ bat: false, chu_ky_phut: 30, backup_qua_han_gio: 36, im_lang_phut: 180, leo_thang_phut: 720, nguoi_nhan: "", nguon_cau_hinh: "ENV" });
  const [sla_van_hanh, setSlaVanHanh] = useState<SlaVanHanhAdmin | null>(null);
  const [sla_so_ngay, setSlaSoNgay] = useState<30 | 90>(90);
  const [su_co_van_hanh, setSuCoVanHanh] = useState<SuCoVanHanhTomTat[]>([]);
  const [su_co_chon, setSuCoChon] = useState<ChiTietSuCoVanHanh | null>(null);

  const [nv, setNv] = useState({ thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", xac_nhan_mat_khau: "", ma_nhan_vien: "", ngay_vao_lam: homNay() });
  const [ca, setCa] = useState({ ma_ca: "", ten_ca: "", gio_bat_dau: "06:00", gio_ket_thuc: "14:00", mau_hien_thi: "#38BDF8" });
  const [ca_dang_sua_id, setCaDangSuaId] = useState<string | null>(null);
  const [pc, setPc] = useState({ nhan_vien_id: "", ca_lam_viec_id: "", ngay_lam: homNay(), ghi_chu: "" });
  const [pc_dang_sua_id, setPcDangSuaId] = useState<string | null>(null);

  const taiDuLieu = useCallback(async () => {
    let tk: TaiKhoan | null;
    try {
      tk = await layTaiKhoan();
      setLoiXacThuc("");
    } catch (e) {
      setLoiXacThuc(e instanceof Error ? e.message : "Không thể xác minh phiên đăng nhập lúc này");
      throw e;
    }
    setTaiKhoan(tk);
    if (!tk || tk.vai_tro !== "ADMIN") return;
    const [tq, nd, nvData, caData, pcData, donData, spData, dmData, vlData, msData, chKhoData, lsKhoData, phieuNhapData, nccData, emailKhoData, dgData, nkPage, heThongData, vanHanhPage, thongKeVanHanh, cauHinhCanhBao, slaVanHanh, suCoVanHanh] = await Promise.all([layTongQuan(), layNguoiDung(), layNhanVien(), layCaLam(), layPhanCa(), layDonHangAdmin(), laySanPhamAdmin(), layDanhMucAdmin(), layVatLieuAdmin(), layMauSacAdmin(), layCauHinhKhoAdmin(), layLichSuKhoAdmin(), layPhieuNhapKhoAdmin(), layNhaCungCapAdmin(), layTrangThaiCanhBaoKhoEmailAdmin(), layDanhGiaAdmin(), layNhatKyCursorAdmin({ kich_thuoc: 25 }), laySucKhoeHeThongAdmin(), layLichSuVanHanhCursorAdmin({ kich_thuoc: 20 }), layThongKeVanHanhAdmin(), layCauHinhCanhBaoHeThongAdmin(), laySlaVanHanhAdmin(90), layDanhSachSuCoVanHanhAdmin(20)]);
    setTongQuan(tq);
    setNguoiDung(nd);
    setNhanVien(nvData);
    setCaLam(caData);
    setPhanCa(pcData);
    setDonHang(donData);
    setSanPhamQt(spData);
    setDanhMucQt(dmData);
    setVatLieuQt(vlData);
    setMauSacQt(msData);
    setCauHinhKho(chKhoData);
    setLichSuKho(lsKhoData);
    setPhieuNhapKho(phieuNhapData);
    setNhaCungCapQt(nccData);
    setCanhBaoKhoEmail(emailKhoData);
    setDanhGiaQt(dgData);
    setSpMoi(x => ({ ...x, danh_muc_id: x.danh_muc_id || dmData[0]?.id || "" }));
    setBtMoi(x => ({ ...x, san_pham_id: x.san_pham_id || spData[0]?.id || "" }));
    setNhatKy(nkPage.du_lieu);
    setNhatKyCursor(nkPage.cursor);
    setSucKhoeHeThong(heThongData);
    setThongKeVanHanh(thongKeVanHanh);
    setLichSuVanHanh(vanHanhPage.du_lieu);
    setVanHanhCursor(vanHanhPage.cursor);
    setCauHinhCanhBaoHeThong(cauHinhCanhBao);
    setSlaVanHanh(slaVanHanh);
    setSuCoVanHanh(suCoVanHanh.du_lieu);
    setPc(x => ({ ...x, nhan_vien_id: x.nhan_vien_id || nvData[0]?.id || "", ca_lam_viec_id: x.ca_lam_viec_id || caData[0]?.id || "" }));
  }, []);

  useEffect(() => {
    let da_huy = false;
    let timer: number | undefined;
    const chay = async (lan = 0) => {
      try { await taiDuLieu(); }
      catch (e) {
        if (!da_huy) setThongBao(e instanceof Error ? e.message : "Không thể tải dữ liệu quản trị");
        if (!da_huy && lan < 2) timer = window.setTimeout(() => { void chay(lan + 1); }, 1200 * (lan + 1));
      }
    };
    void chay();
    return () => { da_huy = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [taiDuLieu]);

  function suaKhachHangLocal(id: string, patch: Partial<AdminNguoiDung>) {
    setNguoiDung(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function luuKhachHang(user: AdminNguoiDung) {
    setDangXuLy(`kh-${user.id}`);
    setThongBao("");
    try {
      const payload = {
        thu_dien_tu: user.thu_dien_tu.trim(),
        ho_ten: user.ho_ten.trim(),
        so_dien_thoai: user.so_dien_thoai?.trim() || "",
        dia_chi_mac_dinh: user.dia_chi_mac_dinh?.trim() || ""
      };
      const da_luu = await capNhatNguoiDung(user.id, payload);
      setNguoiDung(ds => ds.map(x => x.id === user.id ? { ...x, ...da_luu } : x));
      const ds_moi = await layNguoiDung();
      const xac_nhan = ds_moi.find(x => x.id === user.id);
      if (!xac_nhan || xac_nhan.thu_dien_tu !== payload.thu_dien_tu.toLowerCase() || xac_nhan.ho_ten !== payload.ho_ten || (xac_nhan.so_dien_thoai || "") !== payload.so_dien_thoai || (xac_nhan.dia_chi_mac_dinh || "") !== payload.dia_chi_mac_dinh) {
        throw new Error("PostgreSQL chưa xác nhận đầy đủ thông tin khách hàng vừa lưu.");
      }
      setNguoiDung(ds_moi);
      setThongBao(`Đã lưu thông tin khách hàng ${xac_nhan.ho_ten}. F5 vẫn giữ dữ liệu mới.`);
    } catch (e) {
      setThongBao(e instanceof Error ? e.message : "Không thể cập nhật khách hàng");
      await layNguoiDung().then(setNguoiDung).catch(() => undefined);
    } finally {
      setDangXuLy(null);
    }
  }

  async function doiTrangThai(user: AdminNguoiDung) {
    setDangXuLy(user.id); setThongBao("");
    try {
      const kq = user.da_kich_hoat ? await khoaNguoiDung(user.id) : await kichHoatNguoiDung(user.id);
      setThongBao(kq.thong_bao);
      await taiDuLieu();
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật tài khoản"); }
    finally { setDangXuLy(null); }
  }

  async function xoaTaiKhoan(user: AdminNguoiDung) {
    if (!window.confirm(`Xóa tài khoản ${user.thu_dien_tu}?\n\nĐơn hàng đã phát sinh vẫn được giữ lại nhưng không còn liên kết tới tài khoản này.`)) return;
    setDangXuLy(user.id); setThongBao("");
    try {
      const kq = await xoaNguoiDung(user.id);
      setThongBao(kq.thong_bao);
      await taiDuLieu();
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa tài khoản"); }
    finally { setDangXuLy(null); }
  }

  async function taoNV(e: FormEvent) {
    e.preventDefault();
    setThongBao("");
    if (!danhGiaMatKhau(nv.mat_khau).hop_le) {
      setThongBao("Mật khẩu nhân viên phải có ít nhất 12 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }
    if (nv.mat_khau !== nv.xac_nhan_mat_khau) {
      setThongBao("Mật khẩu và xác nhận mật khẩu chưa khớp.");
      return;
    }
    setDangXuLy("tao-nhan-vien");
    try {
      await taoNhanVien({
        thu_dien_tu: nv.thu_dien_tu.trim(),
        ho_ten: nv.ho_ten.trim(),
        so_dien_thoai: nv.so_dien_thoai.trim() || undefined,
        mat_khau: nv.mat_khau,
        ma_nhan_vien: nv.ma_nhan_vien.trim().toUpperCase(),
        ngay_vao_lam: nv.ngay_vao_lam,
      });
      setThongBao("Đã tạo nhân viên bán hàng và kích hoạt tài khoản.");
      setNv({ thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", xac_nhan_mat_khau: "", ma_nhan_vien: "", ngay_vao_lam: homNay() });
      await taiDuLieu();
      setTab("nhan-vien");
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : "Không thể tạo nhân viên bán hàng");
    } finally {
      setDangXuLy(null);
    }
  }

  function suaNhanVienLocal(id: string, patch: Partial<AdminNhanVien>) {
    setNhanVien(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function luuNhanVien(item: AdminNhanVien) {
    const trang_thai_can_luu = item.trang_thai;
    setDangXuLy(`nv-${item.id}`);
    setThongBao("");
    try {
      const da_luu = await capNhatNhanVien(item.id, { trang_thai: trang_thai_can_luu });
      setNhanVien(ds => ds.map(x => x.id === item.id ? da_luu : x));

      // Xác minh lại bằng GET no-store ngay sau commit. Chỉ báo thành công khi
      // PostgreSQL trả đúng trạng thái vừa lưu, nhờ vậy F5 sẽ giữ nguyên dữ liệu.
      const ds_moi = await layNhanVien();
      const xac_nhan = ds_moi.find(x => x.id === item.id);
      if (!xac_nhan || xac_nhan.trang_thai !== trang_thai_can_luu) {
        throw new Error("PostgreSQL chưa xác nhận trạng thái nhân viên vừa lưu. Vui lòng thử lại.");
      }
      setNhanVien(ds_moi);
      setNguoiDung(await layNguoiDung());
      setThongBao(`Đã lưu ${item.ma_nhan_vien}: ${trang_thai_can_luu === "DANG_LAM" ? "Đang làm" : trang_thai_can_luu === "TAM_NGHI" ? "Tạm nghỉ" : "Nghỉ việc"}. F5 vẫn giữ trạng thái này.`);
    } catch (e) {
      setThongBao(e instanceof Error ? e.message : "Không thể cập nhật nhân viên");
      await layNhanVien().then(setNhanVien).catch(() => undefined);
    } finally {
      setDangXuLy(null);
    }
  }

  function datLaiFormCa() {
    setCaDangSuaId(null);
    setCa({ ma_ca: "", ten_ca: "", gio_bat_dau: "06:00", gio_ket_thuc: "14:00", mau_hien_thi: "#38BDF8" });
  }

  function batDauSuaCa(item: CaLam) {
    setCaDangSuaId(item.id);
    setCa({
      ma_ca: item.ma_ca,
      ten_ca: item.ten_ca,
      gio_bat_dau: item.gio_bat_dau,
      gio_ket_thuc: item.gio_ket_thuc,
      mau_hien_thi: item.mau_hien_thi || "#38BDF8"
    });
    setThongBao(`Đang chỉnh sửa ${item.ma_ca} · ${item.ten_ca}.`);
  }

  async function luuCa(e: FormEvent) {
    e.preventDefault();
    setDangXuLy(ca_dang_sua_id ? `ca-${ca_dang_sua_id}` : "tao-ca");
    setThongBao("");
    try {
      if (ca_dang_sua_id) {
        const id_dang_sua = ca_dang_sua_id;
        await capNhatCaLam(id_dang_sua, ca);
        const ds_ca = await layCaLam();
        const xac_nhan = ds_ca.find(x => x.id === id_dang_sua);
        if (!xac_nhan || xac_nhan.ma_ca !== ca.ma_ca.trim().toUpperCase() || xac_nhan.ten_ca !== ca.ten_ca.trim() || xac_nhan.gio_bat_dau !== ca.gio_bat_dau || xac_nhan.gio_ket_thuc !== ca.gio_ket_thuc || (xac_nhan.mau_hien_thi || "").toUpperCase() !== ca.mau_hien_thi.toUpperCase()) {
          throw new Error("PostgreSQL chưa xác nhận thay đổi ca làm việc vừa lưu.");
        }
        setCaLam(ds_ca);
        setPhanCa(await layPhanCa());
        setThongBao(`Đã lưu ${xac_nhan.ma_ca} · ${xac_nhan.ten_ca} (${xac_nhan.gio_bat_dau}–${xac_nhan.gio_ket_thuc}).`);
      } else {
        await taoCaLam(ca);
        setThongBao("Đã tạo ca làm việc.");
        setCaLam(await layCaLam());
      }
      datLaiFormCa();
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : ca_dang_sua_id ? "Không thể cập nhật ca" : "Không thể tạo ca");
    } finally {
      setDangXuLy(null);
    }
  }

  async function xoaCa(item: CaLam) {
    if (!window.confirm(`Xóa ca ${item.ma_ca} · ${item.ten_ca}?\n\nCác phân ca đang dùng mẫu ca này cũng sẽ bị xóa.`)) return;
    setDangXuLy(`ca-${item.id}`);
    setThongBao("");
    try {
      const kq = await xoaCaLam(item.id);
      if (ca_dang_sua_id === item.id) datLaiFormCa();
      setThongBao(kq.so_phan_ca_da_xoa > 0 ? `${kq.thong_bao}. Đã xóa kèm ${kq.so_phan_ca_da_xoa} phân ca.` : kq.thong_bao);
      await taiDuLieu();
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : "Không thể xóa ca");
    } finally {
      setDangXuLy(null);
    }
  }

  function datLaiFormPhanCa() {
    setPcDangSuaId(null);
    setPc({
      nhan_vien_id: nhan_vien.find(n => n.nguoi_dung.da_kich_hoat && n.trang_thai === "DANG_LAM")?.id || "",
      ca_lam_viec_id: ca_lam.find(c => c.dang_hoat_dong)?.id || "",
      ngay_lam: homNay(),
      ghi_chu: ""
    });
  }

  function batDauSuaPhanCa(item: PhanCa) {
    setPcDangSuaId(item.id);
    setPc({
      nhan_vien_id: item.nhan_vien.id,
      ca_lam_viec_id: item.ca_lam_viec.id,
      ngay_lam: ngayTuIso(item.ngay_lam),
      ghi_chu: item.ghi_chu || ""
    });
    setThongBao(`Đang chỉnh sửa phân ca ${item.nhan_vien.ma_nhan_vien} · ${item.ca_lam_viec.ten_ca}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function luuPhanCa(e: FormEvent) {
    e.preventDefault();
    setDangXuLy(pc_dang_sua_id ? `pc-${pc_dang_sua_id}` : "tao-phan-ca");
    setThongBao("");
    try {
      if (pc_dang_sua_id) {
        const id_dang_sua = pc_dang_sua_id;
        await capNhatPhanCa(id_dang_sua, pc);
        const ds_pc = await layPhanCa();
        const xac_nhan = ds_pc.find(x => x.id === id_dang_sua);
        if (!xac_nhan || xac_nhan.nhan_vien.id !== pc.nhan_vien_id || xac_nhan.ca_lam_viec.id !== pc.ca_lam_viec_id || ngayTuIso(xac_nhan.ngay_lam) !== pc.ngay_lam || (xac_nhan.ghi_chu || "") !== pc.ghi_chu.trim()) {
          throw new Error("PostgreSQL chưa xác nhận thay đổi phân ca vừa lưu.");
        }
        setPhanCa(ds_pc);
        setThongBao(`Đã lưu phân ca ${xac_nhan.nhan_vien.ma_nhan_vien} · ${xac_nhan.ca_lam_viec.ten_ca} ngày ${new Date(`${pc.ngay_lam}T00:00:00`).toLocaleDateString("vi-VN")}.`);
      } else {
        await taoPhanCa(pc);
        setThongBao("Đã xếp ca cho nhân viên.");
        setPhanCa(await layPhanCa());
      }
      datLaiFormPhanCa();
    } catch (err) {
      setThongBao(err instanceof Error ? err.message : pc_dang_sua_id ? "Không thể cập nhật phân ca" : "Không thể xếp ca");
    } finally {
      setDangXuLy(null);
    }
  }

  async function huyPhanCa(item: PhanCa) {
    if (!window.confirm(`Xóa phân ca ${item.nhan_vien.ma_nhan_vien} · ${item.ca_lam_viec.ten_ca} ngày ${new Date(`${ngayTuIso(item.ngay_lam)}T00:00:00`).toLocaleDateString("vi-VN")}?`)) return;
    setDangXuLy(`pc-${item.id}`);
    setThongBao("");
    try {
      const kq = await xoaPhanCa(item.id);
      if (pc_dang_sua_id === item.id) datLaiFormPhanCa();
      setThongBao(kq.thong_bao);
      await taiDuLieu();
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa phân ca"); }
    finally { setDangXuLy(null); }
  }

  async function taiDonTheoBoLoc() {
    setDangXuLy("loc-don");
    setThongBao("");
    try {
      const ds = await layDonHangAdmin(don_loc_trang_thai, don_tim_kiem);
      setDonHang(ds);
      if (don_chon && !ds.some(x => x.id === don_chon.id)) setDonChon(null);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể lọc đơn hàng"); }
    finally { setDangXuLy(null); }
  }

  async function doiSoatDoanhThuDaGiao() {
    if (!window.confirm("Đối soát tất cả đơn đã giao nhưng còn giao dịch chờ thanh toán? Hệ thống sẽ chốt đúng một giao dịch hợp lệ cho mỗi đơn và cập nhật doanh thu.")) return;
    setDangXuLy("doi-soat-doanh-thu");
    setThongBao("Đang đối soát doanh thu các đơn đã giao...");
    try {
      const kq = await doiSoatDoanhThuDonDaGiaoAdmin();
      setThongBao(kq.so_don_cap_nhat > 0
        ? `Đã đối soát ${kq.so_don_cap_nhat} đơn, bổ sung ${dinhDangTien(kq.tong_doanh_thu_bo_sung)} doanh thu.`
        : "Đối soát hoàn tất: không còn đơn đã giao nào có giao dịch chờ thanh toán cần chốt.");
      const [tq, ds] = await Promise.all([layTongQuan(), layDonHangAdmin(don_loc_trang_thai, don_tim_kiem)]);
      setTongQuan(tq);
      setDonHang(ds);
      if (don_chon) {
        const ct = await layChiTietDonHangAdmin(don_chon.id).catch(() => null);
        if (ct) setDonChon(ct);
      }
    } catch (e) {
      setThongBao(e instanceof Error ? e.message : "Không thể đối soát doanh thu đơn đã giao");
    } finally {
      setDangXuLy(null);
    }
  }

  async function moChiTietDon(id: string) {
    setDangXuLy(`don-xem-${id}`);
    setThongBao("");
    try {
      const ct = await layChiTietDonHangAdmin(id);
      setDonChon(ct);
      setDonTrangThaiMoi(ct.trang_thai);
      setDonGhiChu("");
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tải chi tiết đơn hàng"); }
    finally { setDangXuLy(null); }
  }

  async function luuTrangThaiDon() {
    if (!don_chon || !don_trang_thai_moi) return;
    const don_truoc = don_chon;
    const id = don_truoc.id;
    const trang_thai_moi = don_trang_thai_moi;
    const ghi_chu = don_ghi_chu.trim() || undefined;
    const thanh_toan_can_chot_tam = trang_thai_moi === "HOAN_TAT" && !thanhToanDaGhiNhan(don_truoc) ? thanhToanChoGhiNhan(don_truoc) : null;
    const chot_thanh_toan_tam = Boolean(thanh_toan_can_chot_tam);
    const thoi_diem_tam = new Date().toISOString();

    setDangXuLy(`don-${id}`);
    setThongBao("\u0110ang c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i \u0111\u01a1n h\u00e0ng...");

    // v3.2.2: optimistic UI - cap nhat ngay badge/detail, rollback neu API that bai.
    setDonChon({
      ...don_truoc,
      trang_thai: trang_thai_moi,
      thanh_toan: chot_thanh_toan_tam
        ? don_truoc.thanh_toan.map(tt => tt.id === thanh_toan_can_chot_tam?.id ? { ...tt, trang_thai: "DA_THANH_TOAN", ngay_thanh_toan: thoi_diem_tam } : tt)
        : don_truoc.thanh_toan
    });
    setDonHang(ds => ds.map(item => item.id === id ? {
      ...item,
      trang_thai: trang_thai_moi,
      thanh_toan: chot_thanh_toan_tam && item.thanh_toan ? { ...item.thanh_toan, trang_thai: "DA_THANH_TOAN" } : item.thanh_toan
    } : item));

    try {
      const da_luu = await capNhatTrangThaiDonHangAdmin(id, { trang_thai: trang_thai_moi, ghi_chu });
      setDonChon(hien_tai => hien_tai?.id === id ? da_luu : hien_tai);
      setDonTrangThaiMoi(da_luu.trang_thai);
      setDonGhiChu("");
      const thanh_toan_hien_thi = da_luu.thanh_toan.find(tt => tt.trang_thai === "DA_THANH_TOAN") || da_luu.thanh_toan[0] || null;
      setDonHang(ds => ds.map(item => item.id === id ? { ...item, trang_thai: da_luu.trang_thai, ngay_cap_nhat: da_luu.ngay_cap_nhat, thanh_toan: thanh_toan_hien_thi ? { trang_thai: thanh_toan_hien_thi.trang_thai, ma_giao_dich: thanh_toan_hien_thi.ma_giao_dich } : item.thanh_toan } : item));

      // v3.3.1: dashboard phan hoi ngay sau khi server xac nhan doanh thu moi.
      // Sau do van doc lai /tong-quan de PostgreSQL la nguon su that cuoi cung.
      setTongQuan(tq => tq ? capNhatTongQuanSauDon(tq, don_truoc.trang_thai, da_luu.trang_thai, da_luu.cap_nhat_doanh_thu) : tq);
      if (da_luu.cap_nhat_doanh_thu?.da_ghi_nhan_moi) {
        setThongBao(`Đã giao ${da_luu.ma_don_hang}. Doanh thu +${dinhDangTien(da_luu.cap_nhat_doanh_thu.so_tien)} đã được ghi nhận.`);
      } else if (da_luu.trang_thai === "HOAN_TAT" && da_luu.cap_nhat_doanh_thu?.da_co_tu_truoc) {
        setThongBao(`Đã giao ${da_luu.ma_don_hang}. Đơn đã thanh toán trước đó nên doanh thu đã có trong Tổng quan, không cộng lần hai.`);
      } else {
        setThongBao(`Đã cập nhật ${da_luu.ma_don_hang} → ${nhanTrangThaiDon(da_luu.trang_thai)}.`);
      }

      const dongBoTongQuan = () => layTongQuan().then(setTongQuan).catch(() => undefined);
      void dongBoTongQuan().then(() => undefined);
      // Neu request dong bo trung luc API dang ban/bi gioi han tam thoi, thu lai mot lan.
      window.setTimeout(() => { void dongBoTongQuan(); }, 900);

      // Khong giu nut o trang thai "Dang luu" trong luc refresh danh sach/audit phia sau.
      void Promise.allSettled([
        layDonHangAdmin(don_loc_trang_thai, don_tim_kiem),
        laySanPhamAdmin(),
        layNhatKyAdmin()
      ]).then(([ds_kq, sp_kq, nk_kq]) => {
        if (ds_kq.status === "fulfilled") setDonHang(ds_kq.value);
        if (sp_kq.status === "fulfilled") setSanPhamQt(sp_kq.value);
        if (nk_kq.status === "fulfilled") setNhatKy(nk_kq.value);
      });
    } catch (e) {
      setDonChon(hien_tai => hien_tai?.id === id ? don_truoc : hien_tai);
      setDonTrangThaiMoi(don_truoc.trang_thai);
      setThongBao(e instanceof Error ? e.message : "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i \u0111\u01a1n h\u00e0ng");
      void layDonHangAdmin(don_loc_trang_thai, don_tim_kiem).then(setDonHang).catch(() => undefined);
    } finally {
      setDangXuLy(null);
    }
  }

  function suaSanPhamLocal(id: string, patch: Partial<AdminSanPham>) {
    setSanPhamQt(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  function suaBienTheLocal(san_pham_id: string, bien_the_id: string, patch: Partial<AdminSanPham["bien_the"][number]>) {
    setSanPhamQt(ds => ds.map(sp => sp.id === san_pham_id ? { ...sp, bien_the: sp.bien_the.map(bt => bt.id === bien_the_id ? { ...bt, ...patch } : bt) } : sp));
  }

  async function chonAnhSanPhamMoi(file?: File) {
    if (!file) return;
    setDangXuLy("anh-sp-moi"); setThongBao("");
    try { setAnhSpMoi(await chuanHoaAnhSanPham(file)); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xử lý ảnh"); }
    finally { setDangXuLy(null); }
  }

  async function chonAnhSanPhamCoSan(id: string, file?: File) {
    if (!file) return;
    setDangXuLy(`anh-${id}`); setThongBao("");
    try {
      const data = await chuanHoaAnhSanPham(file);
      setAnhSpChoLuu(x => ({ ...x, [id]: data }));
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xử lý ảnh"); }
    finally { setDangXuLy(null); }
  }

  async function taoSanPhamMoi(e: FormEvent) {
    e.preventDefault();
    if (!sp_moi.danh_muc_id) { setThongBao("Hãy chọn danh mục sản phẩm."); return; }
    if (!anh_sp_moi) { setThongBao("Hãy chọn một ảnh sản phẩm từ máy."); return; }
    setDangXuLy("tao-san-pham"); setThongBao("");
    try {
      const da_tao = await taoSanPhamAdmin({
        ma_san_pham: sp_moi.ma_san_pham.trim(), ten_san_pham: sp_moi.ten_san_pham.trim(), danh_muc_id: sp_moi.danh_muc_id,
        mo_ta_ngan: sp_moi.mo_ta_ngan.trim(), gia_ban: Number(sp_moi.gia_ban), kich_thuoc: sp_moi.kich_thuoc.trim(),
        khoi_luong_gam: Number(sp_moi.khoi_luong_gam) || 0, thoi_gian_in_gio: Number(sp_moi.thoi_gian_in_gio) || 0,
        trang_thai: sp_moi.trang_thai, so_luong_ton: 0, anh_chinh_data_url: anh_sp_moi
      });
      const [ds, dm, tq, nk] = await Promise.all([laySanPhamAdmin(), layDanhMucAdmin(), layTongQuan(), layNhatKyAdmin()]);
      setSanPhamQt(ds); setDanhMucQt(dm); setTongQuan(tq); setNhatKy(nk); setSanPhamChonId(da_tao.id);
      setSpMoi(x => ({ ma_san_pham: "", ten_san_pham: "", danh_muc_id: x.danh_muc_id || danh_muc_qt[0]?.id || "", mo_ta_ngan: "", gia_ban: 0, kich_thuoc: "", khoi_luong_gam: 0, thoi_gian_in_gio: 0, trang_thai: "DANG_BAN" }));
      setAnhSpMoi(""); setTaoSanPhamMo(false);
      setThongBao(`Đã tạo sản phẩm ${da_tao.ma_san_pham}. Ảnh đã được chuẩn hóa 1000×800. Tồn kho khởi tạo 0; cập nhật tại tab Kho.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tạo sản phẩm"); }
    finally { setDangXuLy(null); }
  }

  async function luuSanPham(item: AdminSanPham) {
    setDangXuLy(`sp-${item.id}`); setThongBao("");
    try {
      await capNhatSanPhamAdmin(item.id, {
        ten_san_pham: item.ten_san_pham.trim(), danh_muc_id: item.danh_muc.id, mo_ta_ngan: item.mo_ta_ngan?.trim() || "",
        gia_ban: Number(item.gia_ban), kich_thuoc: item.kich_thuoc?.trim() || "", khoi_luong_gam: Number(item.khoi_luong_gam) || 0,
        thoi_gian_in_gio: Number(item.thoi_gian_in_gio) || 0, trang_thai: item.trang_thai, anh_chinh_data_url: anh_sp_cho_luu[item.id]
      });
      const [ds, dm, tq, nk] = await Promise.all([laySanPhamAdmin(), layDanhMucAdmin(), layTongQuan(), layNhatKyAdmin()]);
      setSanPhamQt(ds); setDanhMucQt(dm); setTongQuan(tq); setNhatKy(nk);
      setAnhSpChoLuu(x => { const next = { ...x }; delete next[item.id]; return next; });
      setThongBao(`Đã lưu sản phẩm ${item.ma_san_pham}${anh_sp_cho_luu[item.id] ? " và ảnh mới" : ""}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật sản phẩm"); }
    finally { setDangXuLy(null); }
  }

  async function xoaSanPham(item: AdminSanPham) {
    if (!window.confirm(`Xóa sản phẩm ${item.ma_san_pham} · ${item.ten_san_pham}? Sản phẩm sẽ không còn hiển thị trên cửa hàng.`)) return;
    setDangXuLy(`xoa-sp-${item.id}`); setThongBao("");
    try {
      const kq = await xoaSanPhamAdmin(item.id);
      const [ds, dm, tq, nk] = await Promise.all([laySanPhamAdmin(), layDanhMucAdmin(), layTongQuan(), layNhatKyAdmin()]);
      setSanPhamQt(ds); setDanhMucQt(dm); setTongQuan(tq); setNhatKy(nk); setSanPhamChonId(ds[0]?.id || "");
      setThongBao(kq.thong_bao);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa sản phẩm"); }
    finally { setDangXuLy(null); }
  }

  async function luuTonKho(san_pham_id: string, bien_the_id: string) {
    const sp = san_pham_qt.find(x => x.id === san_pham_id);
    const bt = sp?.bien_the.find(x => x.id === bien_the_id);
    if (!bt) return;
    setDangXuLy(`kho-${bien_the_id}`); setThongBao("");
    try {
      await capNhatBienTheAdmin(bien_the_id, {
        ma_bien_the: bt.ma_bien_the.trim(), vat_lieu_id: bt.vat_lieu?.id || null, mau_sac_id: bt.mau_sac?.id || null,
        gia_chenh_lech: Number(bt.gia_chenh_lech) || 0, so_luong_ton: Number(bt.so_luong_ton), ton_toi_thieu: Math.max(0, Number(bt.ton_toi_thieu) || 0), ton_toi_da: Math.max(0, Number(bt.ton_toi_da) || 0), dang_hien_thi: bt.dang_hien_thi,
        ly_do_ton_kho: kho_ly_do[bien_the_id]?.trim() || "Điều chỉnh tồn kho"
      });
      const [ds, tq, nk, lsKho] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layNhatKyAdmin(), layLichSuKhoAdmin()]);
      setSanPhamQt(ds); setTongQuan(tq); setNhatKy(nk); setLichSuKho(lsKho);
      setKhoLyDo(x => ({ ...x, [bien_the_id]: "" }));
      const goiY = bt.ton_toi_da > bt.ton_toi_thieu && bt.so_luong_ton <= bt.ton_toi_thieu ? Math.max(0, bt.ton_toi_da - bt.so_luong_ton) : 0;
      setThongBao(`Đã lưu biến thể ${bt.ma_bien_the}: tồn ${bt.so_luong_ton}, định mức ${bt.ton_toi_thieu}–${bt.ton_toi_da || "∞"}${goiY ? ` · gợi ý nhập ${goiY}` : ""}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật biến thể/tồn kho"); }
    finally { setDangXuLy(null); }
  }

  async function luuCauHinhKho() {
    setDangXuLy("cau-hinh-kho"); setThongBao("");
    try {
      const da_luu = await capNhatCauHinhKhoAdmin(Math.max(1, Math.min(999, Number(cau_hinh_kho.nguong_sap_het) || 5)));
      const [tq, nk] = await Promise.all([layTongQuan(), layNhatKyAdmin()]);
      setCauHinhKho(da_luu); setTongQuan(tq); setNhatKy(nk);
      setThongBao(`Đã cập nhật ngưỡng sắp hết hàng: ≤ ${da_luu.nguong_sap_het}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật cấu hình kho"); }
    finally { setDangXuLy(null); }
  }

  async function docTepNhapKho(file?: File) {
    if (!file) return;
    setDangXuLy("kiem-tra-import-kho"); setThongBao(""); setImportKho(null);
    try {
      if (!/\.(csv|xlsx)$/i.test(file.name)) throw new Error("Chỉ chọn file CSV hoặc Excel .xlsx");
      if (file.size > 2 * 1024 * 1024) throw new Error("File nhập kho phải nhỏ hơn hoặc bằng 2 MB");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 32768, bytes.length)));
      const kq = await kiemTraTepNhapKhoAdmin(file.name, btoa(binary));
      setImportKho(kq);
      setThongBao(kq.khong_hop_le ? `Đã kiểm tra ${kq.tong_dong} dòng: ${kq.khong_hop_le} dòng cần sửa trước khi ghi.` : `Đã kiểm tra ${kq.tong_dong} dòng: tất cả hợp lệ, có thể nhập kho.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể kiểm tra file nhập kho"); }
    finally { setDangXuLy(null); }
  }

  function taiMauNhapKho() {
    const csv = ["ma_bien_the,so_luong_nhap,ly_do", "N3D-MAU-001,10,Nhập kho theo lô"].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "mau-nhap-kho-nhienin3d.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  async function xacNhanNhapKhoTheoLo() {
    if (!import_kho || !import_kho.dong.length) return;
    if (import_kho.khong_hop_le > 0) { setThongBao("File còn dòng không hợp lệ. Hãy sửa file và kiểm tra lại trước khi ghi kho."); return; }
    if (!window.confirm(`Xác nhận nhập ${import_kho.dong.reduce((s,x)=>s+x.so_luong_nhap,0)} sản phẩm cho ${import_kho.dong.length} biến thể?`)) return;
    setDangXuLy("nhap-kho-theo-lo"); setThongBao("");
    try {
      const phieu = await nhapKhoTheoLoAdmin({
        ma_lo: nhap_lo_meta.ma_lo.trim() || undefined,
        nha_cung_cap_id: nhap_lo_meta.nha_cung_cap_id || undefined,
        ghi_chu: nhap_lo_meta.ghi_chu.trim() || undefined,
        dong: import_kho.dong.map(x => ({ ma_bien_the: x.ma_bien_the, so_luong_nhap: x.so_luong_nhap, ly_do: x.ly_do || "Nhập kho theo lô" }))
      });
      const [sp, tq, ls, pn, ncc, nk, emailState] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layLichSuKhoAdmin(), layPhieuNhapKhoAdmin(), layNhaCungCapAdmin(), layNhatKyAdmin(), layTrangThaiCanhBaoKhoEmailAdmin()]);
      setSanPhamQt(sp); setTongQuan(tq); setLichSuKho(ls); setPhieuNhapKho(pn); setNhaCungCapQt(ncc); setNhatKy(nk); setCanhBaoKhoEmail(emailState);
      setImportKho(null); setNhapLoMeta({ ma_lo: "", nha_cung_cap_id: "", ghi_chu: "" });
      setThongBao(`Đã nhập kho theo phiếu ${phieu.ma_phieu}: ${phieu.so_dong} dòng · ${phieu.tong_so_luong} sản phẩm.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể nhập kho theo lô"); }
    finally { setDangXuLy(null); }
  }

  function suaNhaCungCapLocal(id: string, patch: Partial<NhaCungCapAdmin>) {
    setNhaCungCapQt(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function taoNhaCungCapMoi(e: FormEvent) {
    e.preventDefault(); setDangXuLy("tao-nha-cung-cap"); setThongBao("");
    try {
      const da_tao = await taoNhaCungCapAdmin({
        ma_nha_cung_cap: ncc_moi.ma_nha_cung_cap.trim().toUpperCase(), ten_nha_cung_cap: ncc_moi.ten_nha_cung_cap.trim(),
        nguoi_lien_he: ncc_moi.nguoi_lien_he.trim(), so_dien_thoai: ncc_moi.so_dien_thoai.trim(), thu_dien_tu: ncc_moi.thu_dien_tu.trim(),
        dia_chi: ncc_moi.dia_chi.trim(), ghi_chu: ncc_moi.ghi_chu.trim(), dang_hoat_dong: ncc_moi.dang_hoat_dong
      });
      const [ds, nk] = await Promise.all([layNhaCungCapAdmin(ncc_tim_kiem, ncc_loc_hoat_dong), layNhatKyAdmin()]);
      setNhaCungCapQt(ds); setNhatKy(nk); setNccMoi({ ma_nha_cung_cap: "", ten_nha_cung_cap: "", nguoi_lien_he: "", so_dien_thoai: "", thu_dien_tu: "", dia_chi: "", ghi_chu: "", dang_hoat_dong: true });
      setThongBao(`Đã tạo nhà cung cấp ${da_tao.ma_nha_cung_cap} · ${da_tao.ten_nha_cung_cap}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tạo nhà cung cấp"); }
    finally { setDangXuLy(null); }
  }

  async function luuNhaCungCap(item: NhaCungCapAdmin) {
    setDangXuLy(`ncc-${item.id}`); setThongBao("");
    try {
      const da_luu = await capNhatNhaCungCapAdmin(item.id, { ten_nha_cung_cap: item.ten_nha_cung_cap.trim(), nguoi_lien_he: item.nguoi_lien_he?.trim() || "", so_dien_thoai: item.so_dien_thoai?.trim() || "", thu_dien_tu: item.thu_dien_tu?.trim() || "", dia_chi: item.dia_chi?.trim() || "", ghi_chu: item.ghi_chu?.trim() || "", dang_hoat_dong: item.dang_hoat_dong });
      setNhaCungCapQt(ds => ds.map(x => x.id === item.id ? da_luu : x)); setNhatKy(await layNhatKyAdmin());
      setThongBao(`Đã lưu nhà cung cấp ${da_luu.ma_nha_cung_cap}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật nhà cung cấp"); }
    finally { setDangXuLy(null); }
  }

  async function xoaNhaCungCap(item: NhaCungCapAdmin) {
    if (!window.confirm(`Xóa nhà cung cấp ${item.ma_nha_cung_cap} · ${item.ten_nha_cung_cap}?`)) return;
    setDangXuLy(`ncc-${item.id}`); setThongBao("");
    try {
      const kq = await xoaNhaCungCapAdmin(item.id); const [ds, nk] = await Promise.all([layNhaCungCapAdmin(ncc_tim_kiem, ncc_loc_hoat_dong), layNhatKyAdmin()]); setNhaCungCapQt(ds); setNhatKy(nk); setThongBao(kq.thong_bao);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa nhà cung cấp"); }
    finally { setDangXuLy(null); }
  }

  async function locNhaCungCap() {
    setDangXuLy("loc-nha-cung-cap"); setThongBao("");
    try { setNhaCungCapQt(await layNhaCungCapAdmin(ncc_tim_kiem, ncc_loc_hoat_dong)); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể lọc nhà cung cấp"); }
    finally { setDangXuLy(null); }
  }

  async function locPhieuNhapKho() {
    setDangXuLy("loc-phieu-nhap"); setThongBao(""); setPhieuNhapChiTiet(null);
    try { setPhieuNhapKho(await layPhieuNhapKhoAdmin(phieu_nhap_tim_kiem, phieu_nhap_loc_ncc, phieu_nhap_tu_ngay, phieu_nhap_den_ngay)); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể lọc phiếu nhập kho"); }
    finally { setDangXuLy(null); }
  }

  async function xemChiTietPhieuNhapKho(id: string) {
    setDangXuLy(`phieu-nhap-${id}`); setThongBao("");
    try { setPhieuNhapChiTiet(await layChiTietPhieuNhapKhoAdmin(id)); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tải chi tiết phiếu nhập"); }
    finally { setDangXuLy(null); }
  }

  async function taiExcelPhieuNhapKho() {
    setDangXuLy("excel-phieu-nhap"); setThongBao("");
    try {
      const kq = await xuatExcelPhieuNhapKhoAdmin(phieu_nhap_tim_kiem, phieu_nhap_loc_ncc, phieu_nhap_tu_ngay, phieu_nhap_den_ngay);
      const binary = atob(kq.base64); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: kq.mime_type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = kq.ten_file; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setThongBao(`Đã xuất Excel lịch sử phiếu nhập: ${kq.ten_file}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xuất Excel phiếu nhập"); }
    finally { setDangXuLy(null); }
  }

  async function guiCanhBaoKhoNgay() {
    setDangXuLy("gui-canh-bao-kho-email"); setThongBao("");
    try {
      const kq = await guiCanhBaoKhoEmailAdmin();
      setCanhBaoKhoEmail(await layTrangThaiCanhBaoKhoEmailAdmin());
      setNhatKy(await layNhatKyAdmin());
      setThongBao(kq.da_gui ? `Đã gửi cảnh báo tồn kho tới ${kq.so_nguoi_nhan || 0} địa chỉ Admin.` : (kq.ly_do || "Không cần gửi cảnh báo tồn kho."));
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể gửi cảnh báo tồn kho qua email"); }
    finally { setDangXuLy(null); }
  }

  async function taoDanhMucMoi(e: FormEvent) {
    e.preventDefault(); setDangXuLy("tao-danh-muc"); setThongBao("");
    try {
      await taoDanhMucAdmin({ ...dm_moi, ma_danh_muc: dm_moi.ma_danh_muc.trim(), ten_danh_muc: dm_moi.ten_danh_muc.trim(), mo_ta: dm_moi.mo_ta.trim() });
      const [dm, nk] = await Promise.all([layDanhMucAdmin(), layNhatKyAdmin()]); setDanhMucQt(dm); setNhatKy(nk);
      setDmMoi({ ma_danh_muc: "", ten_danh_muc: "", mo_ta: "", thu_tu: 0, dang_hien_thi: true });
      setThongBao("Đã tạo danh mục mới.");
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tạo danh mục"); } finally { setDangXuLy(null); }
  }

  function suaDanhMucLocal(id: string, patch: Partial<AdminDanhMuc>) { setDanhMucQt(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x)); }

  async function luuDanhMuc(item: AdminDanhMuc) {
    setDangXuLy(`dm-${item.id}`); setThongBao("");
    try {
      await capNhatDanhMucAdmin(item.id, { ten_danh_muc: item.ten_danh_muc.trim(), mo_ta: item.mo_ta?.trim() || "", thu_tu: Number(item.thu_tu), dang_hien_thi: item.dang_hien_thi });
      const [dm, nk] = await Promise.all([layDanhMucAdmin(), layNhatKyAdmin()]); setDanhMucQt(dm); setNhatKy(nk); setThongBao(`Đã lưu danh mục ${item.ten_danh_muc}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật danh mục"); } finally { setDangXuLy(null); }
  }

  async function xoaDanhMuc(item: AdminDanhMuc) {
    if (!window.confirm(`Xóa danh mục ${item.ten_danh_muc}? Danh mục chỉ xóa được khi không còn sản phẩm.`)) return;
    setDangXuLy(`dm-${item.id}`); setThongBao("");
    try { const kq = await xoaDanhMucAdmin(item.id); setDanhMucQt(await layDanhMucAdmin()); setNhatKy(await layNhatKyAdmin()); setThongBao(kq.thong_bao); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa danh mục"); } finally { setDangXuLy(null); }
  }

  function suaVatLieuLocal(id: string, patch: Partial<AdminVatLieu>) { setVatLieuQt(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x)); }
  function suaMauSacLocal(id: string, patch: Partial<AdminMauSac>) { setMauSacQt(ds => ds.map(x => x.id === id ? { ...x, ...patch } : x)); }

  async function taiLaiDuLieuThamChieu() {
    const [vl, ms, sp, nk] = await Promise.all([layVatLieuAdmin(), layMauSacAdmin(), laySanPhamAdmin(), layNhatKyAdmin()]);
    setVatLieuQt(vl); setMauSacQt(ms); setSanPhamQt(sp); setNhatKy(nk);
  }

  async function taoVatLieuMoi(e: FormEvent) {
    e.preventDefault(); setDangXuLy("tao-vat-lieu"); setThongBao("");
    try { await taoVatLieuAdmin({ ...vl_moi, ma_vat_lieu: vl_moi.ma_vat_lieu.trim(), ten_vat_lieu: vl_moi.ten_vat_lieu.trim(), mo_ta: vl_moi.mo_ta.trim(), he_so_gia: Number(vl_moi.he_so_gia) }); await taiLaiDuLieuThamChieu(); setVlMoi({ ma_vat_lieu: "", ten_vat_lieu: "", mo_ta: "", he_so_gia: 1 }); setThongBao("Đã tạo vật liệu mới."); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tạo vật liệu"); } finally { setDangXuLy(null); }
  }

  async function luuVatLieu(item: AdminVatLieu) {
    setDangXuLy(`vl-${item.id}`); setThongBao("");
    try { await capNhatVatLieuAdmin(item.id, { ten_vat_lieu: item.ten_vat_lieu.trim(), mo_ta: item.mo_ta?.trim() || "", he_so_gia: Number(item.he_so_gia) }); await taiLaiDuLieuThamChieu(); setThongBao(`Đã lưu vật liệu ${item.ten_vat_lieu}.`); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật vật liệu"); } finally { setDangXuLy(null); }
  }

  async function xoaVatLieu(item: AdminVatLieu) {
    if (!window.confirm(`Xóa vật liệu ${item.ten_vat_lieu}? Chỉ xóa được khi không còn biến thể sử dụng.`)) return;
    setDangXuLy(`vl-${item.id}`); setThongBao("");
    try { const kq = await xoaVatLieuAdmin(item.id); await taiLaiDuLieuThamChieu(); setThongBao(kq.thong_bao); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa vật liệu"); } finally { setDangXuLy(null); }
  }

  async function taoMauMoi(e: FormEvent) {
    e.preventDefault(); setDangXuLy("tao-mau-sac"); setThongBao("");
    try { await taoMauSacAdmin({ ma_mau: ms_moi.ma_mau.trim(), ten_mau: ms_moi.ten_mau.trim(), ma_hex: ms_moi.ma_hex }); await taiLaiDuLieuThamChieu(); setMsMoi({ ma_mau: "", ten_mau: "", ma_hex: "#FFFFFF" }); setThongBao("Đã tạo màu mới."); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tạo màu"); } finally { setDangXuLy(null); }
  }

  async function luuMau(item: AdminMauSac) {
    setDangXuLy(`ms-${item.id}`); setThongBao("");
    try { await capNhatMauSacAdmin(item.id, { ten_mau: item.ten_mau.trim(), ma_hex: item.ma_hex }); await taiLaiDuLieuThamChieu(); setThongBao(`Đã lưu màu ${item.ten_mau}.`); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật màu"); } finally { setDangXuLy(null); }
  }

  async function xoaMau(item: AdminMauSac) {
    if (!window.confirm(`Xóa màu ${item.ten_mau}? Chỉ xóa được khi không còn biến thể sử dụng.`)) return;
    setDangXuLy(`ms-${item.id}`); setThongBao("");
    try { const kq = await xoaMauSacAdmin(item.id); await taiLaiDuLieuThamChieu(); setThongBao(kq.thong_bao); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa màu"); } finally { setDangXuLy(null); }
  }

  async function taoBienTheMoi(e: FormEvent) {
    e.preventDefault(); if (!bt_moi.san_pham_id) return; setDangXuLy("tao-bien-the"); setThongBao("");
    try {
      await taoBienTheAdmin(bt_moi.san_pham_id, { ma_bien_the: bt_moi.ma_bien_the.trim(), vat_lieu_id: bt_moi.vat_lieu_id || undefined, mau_sac_id: bt_moi.mau_sac_id || undefined, gia_chenh_lech: Number(bt_moi.gia_chenh_lech) || 0, so_luong_ton: Number(bt_moi.so_luong_ton) || 0, dang_hien_thi: bt_moi.dang_hien_thi });
      const [sp, tq, nk, lsKho] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layNhatKyAdmin(), layLichSuKhoAdmin()]); setSanPhamQt(sp); setTongQuan(tq); setNhatKy(nk); setLichSuKho(lsKho);
      setBtMoi(x => ({ ...x, ma_bien_the: "", gia_chenh_lech: 0, so_luong_ton: 0 })); setThongBao("Đã tạo biến thể mới.");
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tạo biến thể"); } finally { setDangXuLy(null); }
  }

  async function xoaBienThe(bt: AdminSanPham["bien_the"][number]) {
    if (!window.confirm(`Xóa biến thể ${bt.ma_bien_the}?`)) return; setDangXuLy(`kho-${bt.id}`); setThongBao("");
    try { const kq = await xoaBienTheAdmin(bt.id); const [sp, tq, nk, lsKho] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layNhatKyAdmin(), layLichSuKhoAdmin()]); setSanPhamQt(sp); setTongQuan(tq); setNhatKy(nk); setLichSuKho(lsKho); setThongBao(kq.thong_bao); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa biến thể"); } finally { setDangXuLy(null); }
  }

  async function doiDuyetDanhGia(item: AdminDanhGia, da_duyet: boolean) {
    setDangXuLy(`dg-${item.id}`); setThongBao("");
    try { await capNhatDanhGiaAdmin(item.id, da_duyet); const [dg, nk] = await Promise.all([layDanhGiaAdmin(), layNhatKyAdmin()]); setDanhGiaQt(dg); setNhatKy(nk); setThongBao(da_duyet ? "Đã duyệt đánh giá." : "Đã ẩn đánh giá khỏi storefront."); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật đánh giá"); } finally { setDangXuLy(null); }
  }

  async function xoaDanhGia(item: AdminDanhGia) {
    if (!window.confirm(`Xóa đánh giá của ${item.ho_ten} cho ${item.san_pham.ten_san_pham}?`)) return; setDangXuLy(`dg-${item.id}`); setThongBao("");
    try { const kq = await xoaDanhGiaAdmin(item.id); const [dg, nk] = await Promise.all([layDanhGiaAdmin(), layNhatKyAdmin()]); setDanhGiaQt(dg); setNhatKy(nk); setThongBao(kq.thong_bao); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xóa đánh giá"); } finally { setDangXuLy(null); }
  }

  async function taiBaoCao(loai: "don-hang" | "doanh-thu" | "ton-kho") {
    setDangXuLy(`bao-cao-${loai}`); setThongBao("");
    try {
      const kq = await layBaoCaoCsvAdmin(loai, bao_cao_tu_ngay, bao_cao_den_ngay);
      const blob = new Blob(["\uFEFF", kq.csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = kq.ten_file; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setThongBao(`Đã xuất ${kq.ten_file}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xuất báo cáo"); } finally { setDangXuLy(null); }
  }

  async function taiBaoCaoExcel(loai: "don-hang" | "doanh-thu" | "ton-kho") {
    setDangXuLy(`bao-cao-excel-${loai}`); setThongBao("");
    try {
      const kq = await layBaoCaoExcelAdmin(loai, bao_cao_tu_ngay, bao_cao_den_ngay);
      const binary = atob(kq.base64); const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: kq.mime_type }); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = kq.ten_file; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setThongBao(`Đã xuất Excel ${kq.ten_file}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xuất Excel"); } finally { setDangXuLy(null); }
  }

  async function taiNhatKyBoLoc(reset = true) {
    setDangXuLy("loc-nhat-ky"); setThongBao("");
    try {
      const kq = await layNhatKyCursorAdmin({
        tim_kiem: nhat_ky_tim_kiem, loai: nhat_ky_loai, nguoi_dung_id: nhat_ky_nguoi_dung_id,
        tu_ngay: nhat_ky_tu_ngay, den_ngay: nhat_ky_den_ngay,
        cursor: reset ? null : nhat_ky_cursor.next_cursor, kich_thuoc: nhat_ky_cursor.kich_thuoc
      });
      setNhatKy(ds => reset ? kq.du_lieu : [...ds, ...kq.du_lieu]);
      setNhatKyCursor(kq.cursor);
      setThongBao(reset ? `Đã tải ${kq.du_lieu.length} sự kiện mới nhất.` : `Đã tải thêm ${kq.du_lieu.length} sự kiện.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể lọc nhật ký"); }
    finally { setDangXuLy(null); }
  }

  async function taiNhatKyCsv() {
    setDangXuLy("xuat-nhat-ky"); setThongBao("");
    try {
      const kq = await xuatNhatKyCsvAdmin({ tim_kiem: nhat_ky_tim_kiem, loai: nhat_ky_loai, nguoi_dung_id: nhat_ky_nguoi_dung_id, tu_ngay: nhat_ky_tu_ngay, den_ngay: nhat_ky_den_ngay });
      const blob = new Blob(["\uFEFF", kq.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = kq.ten_file; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setThongBao(`Đã xuất ${kq.ten_file}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xuất nhật ký"); }
    finally { setDangXuLy(null); }
  }

  async function taiNhatKyExcel() {
    setDangXuLy("xuat-nhat-ky-excel"); setThongBao("");
    try {
      const kq = await xuatNhatKyExcelAdmin({ tim_kiem: nhat_ky_tim_kiem, loai: nhat_ky_loai, nguoi_dung_id: nhat_ky_nguoi_dung_id, tu_ngay: nhat_ky_tu_ngay, den_ngay: nhat_ky_den_ngay });
      const binary = atob(kq.base64); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: kq.mime_type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = kq.ten_file; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setThongBao(`Đã xuất Excel ${kq.ten_file}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xuất Excel nhật ký"); }
    finally { setDangXuLy(null); }
  }

  async function taiLichSuVanHanh(reset = true) {
    try {
      const kq = await layLichSuVanHanhCursorAdmin({
        loai: van_hanh_loai, trang_thai: van_hanh_trang_thai,
        cursor: reset ? null : van_hanh_cursor.next_cursor, kich_thuoc: van_hanh_cursor.kich_thuoc
      });
      setLichSuVanHanh(ds => reset ? kq.du_lieu : [...ds, ...kq.du_lieu]);
      setVanHanhCursor(kq.cursor);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tải lịch sử vận hành"); }
  }

  async function taiSlaVanHanh(so_ngay: 30 | 90 = sla_so_ngay) {
    setDangXuLy("sla-van-hanh");
    try {
      const kq = await laySlaVanHanhAdmin(so_ngay);
      setSlaSoNgay(so_ngay);
      setSlaVanHanh(kq);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tải SLA vận hành"); }
    finally { setDangXuLy(null); }
  }

  async function luuCauHinhCanhBaoHeThong() {
    setDangXuLy("luu-cau-hinh-canh-bao-he-thong"); setThongBao("");
    try {
      const kq = await capNhatCauHinhCanhBaoHeThongAdmin({
        bat: cau_hinh_canh_bao_he_thong.bat,
        chu_ky_phut: Number(cau_hinh_canh_bao_he_thong.chu_ky_phut),
        backup_qua_han_gio: Number(cau_hinh_canh_bao_he_thong.backup_qua_han_gio),
        im_lang_phut: Number(cau_hinh_canh_bao_he_thong.im_lang_phut),
        leo_thang_phut: Number(cau_hinh_canh_bao_he_thong.leo_thang_phut),
        nguoi_nhan: cau_hinh_canh_bao_he_thong.nguoi_nhan.trim()
      });
      setCauHinhCanhBaoHeThong(kq);
      const [health, suCo] = await Promise.all([laySucKhoeHeThongAdmin(), layDanhSachSuCoVanHanhAdmin(20)]);
      setSucKhoeHeThong(health); setSuCoVanHanh(suCo.du_lieu);
      setThongBao("Đã lưu cấu hình cảnh báo vận hành và áp dụng lại lịch chạy ngay.");
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể lưu cấu hình cảnh báo vận hành"); }
    finally { setDangXuLy(null); }
  }

  async function moChiTietSuCo(chu_ky: string) {
    setDangXuLy(`su-co-${chu_ky}`); setThongBao("");
    try { setSuCoChon(await layChiTietSuCoVanHanhAdmin(chu_ky)); }
    catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể tải chuỗi sự cố"); }
    finally { setDangXuLy(null); }
  }

  async function taiLichSuVanHanhExcel() {
    setDangXuLy("xuat-van-hanh-excel"); setThongBao("");
    try {
      const kq = await xuatLichSuVanHanhExcelAdmin({ loai: van_hanh_loai, trang_thai: van_hanh_trang_thai });
      const binary = atob(kq.base64); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: kq.mime_type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = kq.ten_file; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setThongBao(`Đã xuất Excel ${kq.ten_file}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể xuất lịch sử vận hành"); }
    finally { setDangXuLy(null); }
  }

  async function taiSucKhoeHeThong() {
    setDangXuLy("suc-khoe-he-thong"); setThongBao("");
    try {
      const [kq, thongKe, cauHinh, sla, suCo] = await Promise.all([laySucKhoeHeThongAdmin(), layThongKeVanHanhAdmin(), layCauHinhCanhBaoHeThongAdmin(), laySlaVanHanhAdmin(sla_so_ngay), layDanhSachSuCoVanHanhAdmin(20)]);
      setSucKhoeHeThong(kq);
      setThongKeVanHanh(thongKe);
      setCauHinhCanhBaoHeThong(cauHinh);
      setSlaVanHanh(sla);
      setSuCoVanHanh(suCo.du_lieu);
      await taiLichSuVanHanh(true);
      setThongBao(`Đã cập nhật sức khỏe hệ thống lúc ${new Date(kq.thoi_gian).toLocaleTimeString("vi-VN")}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể kiểm tra hệ thống"); }
    finally { setDangXuLy(null); }
  }

  async function guiCanhBaoHeThongNgay() {
    setDangXuLy("gui-canh-bao-he-thong"); setThongBao("");
    try {
      const kq = await guiCanhBaoHeThongAdmin();
      setThongBao(kq.da_gui ? `Đã gửi cảnh báo vận hành tới ${kq.so_nguoi_nhan || 0} người nhận.` : (kq.ly_do || "Không cần gửi cảnh báo."));
      await taiLichSuVanHanh(true);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể gửi cảnh báo hệ thống"); }
    finally { setDangXuLy(null); }
  }

  const soPhanCaCuaCa = useMemo(() => {
    const dem = new Map<string, number>();
    for (const item of phan_ca) dem.set(item.ca_lam_viec.id, (dem.get(item.ca_lam_viec.id) || 0) + 1);
    return dem;
  }, [phan_ca]);

  const khachHang = useMemo(() => nguoi_dung.filter(x => x.vai_tro === "KHACH_HANG"), [nguoi_dung]);
  const sanPhamDaLoc = useMemo(() => { const q = san_pham_tim_kiem.trim().toLocaleLowerCase("vi"); return q ? san_pham_qt.filter(x => `${x.ma_san_pham} ${x.ten_san_pham} ${x.danh_muc.ten_danh_muc}`.toLocaleLowerCase("vi").includes(q)) : san_pham_qt; }, [san_pham_qt, san_pham_tim_kiem]);
  const sanPhamDangChon = useMemo(() => sanPhamDaLoc.find(x => x.id === san_pham_chon_id) || sanPhamDaLoc[0] || null, [sanPhamDaLoc, san_pham_chon_id]);
  const nguongKho = Math.max(1, Number(cau_hinh_kho.nguong_sap_het) || 5);
  const danhSachKho = useMemo(() => {
    const q = kho_tim_kiem.trim().toLocaleLowerCase("vi");
    const ds = san_pham_qt.flatMap(sp => sp.bien_the.map(bt => ({ san_pham: sp, bien_the: bt })));
    return ds.filter(item => {
      const bt = item.bien_the;
      if (q && !`${item.san_pham.ma_san_pham} ${item.san_pham.ten_san_pham} ${bt.ma_bien_the} ${bt.vat_lieu?.ten_vat_lieu || ""} ${bt.mau_sac?.ten_mau || ""}`.toLocaleLowerCase("vi").includes(q)) return false;
      if (kho_loc_ton === "CON_HANG" && bt.so_luong_ton <= nguongKho) return false;
      if (kho_loc_ton === "SAP_HET" && !(bt.so_luong_ton > 0 && bt.so_luong_ton <= nguongKho)) return false;
      if (kho_loc_ton === "HET_HANG" && bt.so_luong_ton > 0) return false;
      if (kho_loc_ton === "CAN_NHAP" && !(bt.ton_toi_da > bt.ton_toi_thieu && bt.so_luong_ton <= bt.ton_toi_thieu)) return false;
      if (kho_loc_vat_lieu && bt.vat_lieu?.id !== kho_loc_vat_lieu) return false;
      if (kho_loc_mau && bt.mau_sac?.id !== kho_loc_mau) return false;
      if (kho_loc_hien_thi === "HIEN" && !bt.dang_hien_thi) return false;
      if (kho_loc_hien_thi === "AN" && bt.dang_hien_thi) return false;
      return true;
    }).sort((a, b) => `${a.san_pham.ma_san_pham}-${a.bien_the.ma_bien_the}`.localeCompare(`${b.san_pham.ma_san_pham}-${b.bien_the.ma_bien_the}`, "vi"));
  }, [san_pham_qt, kho_tim_kiem, kho_loc_ton, kho_loc_vat_lieu, kho_loc_mau, kho_loc_hien_thi, nguongKho]);
  const thongKeKho = useMemo(() => {
    const ds = san_pham_qt.flatMap(sp => sp.bien_the);
    return {
      bien_the: ds.length,
      tong_ton: ds.reduce((tong, bt) => tong + Number(bt.so_luong_ton || 0), 0),
      sap_het: ds.filter(bt => bt.so_luong_ton > 0 && bt.so_luong_ton <= nguongKho).length,
      het_hang: ds.filter(bt => bt.so_luong_ton <= 0).length,
      can_nhap: ds.filter(bt => bt.ton_toi_da > bt.ton_toi_thieu && bt.so_luong_ton <= bt.ton_toi_thieu).length,
      goi_y_nhap: ds.reduce((tong, bt) => tong + (bt.ton_toi_da > bt.ton_toi_thieu && bt.so_luong_ton <= bt.ton_toi_thieu ? Math.max(0, bt.ton_toi_da - bt.so_luong_ton) : 0), 0)
    };
  }, [san_pham_qt, nguongKho]);
  const lichSuKhoDaLoc = useMemo(() => lich_su_kho.filter(x => !lich_su_kho_loc_loai || x.loai_bien_dong === lich_su_kho_loc_loai), [lich_su_kho, lich_su_kho_loc_loai]);
  const danhGiaDaLoc = useMemo(() => danh_gia_qt.filter(x => !danh_gia_loc || (danh_gia_loc === "DA_DUYET" ? x.da_duyet : !x.da_duyet)), [danh_gia_qt, danh_gia_loc]);
  const nhatKyDaLoc = useMemo(() => nhat_ky, [nhat_ky]);

  const thongKe = useMemo(() => [
    ["Khách hàng", tong_quan?.khach_hang || 0],
    ["NV bán hàng", tong_quan?.nhan_vien || 0],
    ["Ca làm", tong_quan?.ca_lam_viec || 0],
    ["Phân ca", tong_quan?.phan_ca || 0],
    ["Đơn hàng", tong_quan?.don_hang || 0],
    ["Sản phẩm", tong_quan?.san_pham || 0]
  ] as const, [tong_quan]);

  const phanCaTrongKhoang = useMemo(() => phan_ca.filter(x => {
    const ngay = ngayTuIso(x.ngay_lam);
    return ngay >= tu_ngay && ngay <= den_ngay;
  }), [phan_ca, tu_ngay, den_ngay]);

  const phanCaTheoNgay = useMemo(() => {
    const nhom = new Map<string, PhanCa[]>();
    for (const item of phanCaTrongKhoang) {
      const ngay = ngayTuIso(item.ngay_lam);
      const ds = nhom.get(ngay) || [];
      ds.push(item);
      nhom.set(ngay, ds);
    }
    return Array.from(nhom.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [phanCaTrongKhoang]);

  const maxDoanhThu7Ngay = useMemo(() => Math.max(1, ...(tong_quan?.doanh_thu_theo_ngay.map(x => x.doanh_thu) || [1])), [tong_quan]);
  const giaoDichDonChon = thanhToanHienThi(don_chon);
  const donChonDaThuTienTruoc = Boolean(don_chon && thanhToanDaGhiNhan(don_chon));
  const donChonSeGhiNhanKhiGiao = Boolean(don_chon && !donChonDaThuTienTruoc && (thanhToanChoGhiNhan(don_chon) || don_chon.thanh_toan.length === 0));

  if (tai_khoan === undefined) return <main className="auth-shell"><div className="auth-card"><p>{loi_xac_thuc ? `Kết nối tạm thời gián đoạn: ${loi_xac_thuc}. Phiên đăng nhập vẫn được giữ, hệ thống sẽ tự thử lại.` : "Đang xác minh quyền Admin..."}</p>{loi_xac_thuc && <button type="button" className="primary" onClick={() => { setLoiXacThuc(""); void taiDuLieu().catch(e => setLoiXacThuc(e instanceof Error ? e.message : "Không thể xác minh phiên")); }}>Thử lại</button>}</div></main>;
  if (!tai_khoan) return <main className="auth-shell"><section className="auth-card"><h1>Cần đăng nhập</h1><Link className="primary auth-primary-link" href="/dang-nhap?chuyen_den=/quan-tri">Đăng nhập</Link></section></main>;
  if (tai_khoan.vai_tro !== "ADMIN") return <main className="auth-shell"><section className="auth-card"><h1>Không có quyền truy cập</h1><p>Khu vực này chỉ dành cho Admin.</p><Link className="primary auth-primary-link" href="/tai-khoan">Về tài khoản</Link></section></main>;

  const tabs: Array<[TabQuanTri, string]> = [
    ["tong-quan", "Tổng quan"],
    ["don-hang", "Đơn hàng"],
    ["san-pham", "Sản phẩm"],
    ["danh-muc", "Danh mục"],
    ["kho", "Kho"],
    ["nha-cung-cap", "Nhà cung cấp"],
    ["tham-chieu", "Vật liệu & màu"],
    ["danh-gia", "Đánh giá"],
    ["bao-cao", "Báo cáo"],
    ["khach-hang", "Khách hàng"],
    ["nhan-vien", "Nhân viên bán hàng"],
    ["tao-nhan-vien", "Tạo nhân viên bán hàng"],
    ["ca-lam", "Ca làm"],
    ["xep-ca", "Xếp ca"],
    ["nhat-ky", "Nhật ký Admin"],
    ["he-thong", "Hệ thống"]
  ];

  return <main className="cine-admin-shell page-shell">
    <div className="cine-admin-heading">
      <div><h1>Admin Dashboard</h1></div>
      <div className="cine-admin-heading-actions"><span>{tai_khoan.ho_ten} · Admin</span><Link className="cine-btn cine-btn-secondary" href="/tai-khoan">Tài khoản của tôi</Link></div>
    </div>

    {thong_bao && <div className="cine-admin-message" role="status">{thong_bao}</div>}

    <div className="cine-admin-stats">{thongKe.map(([ten, gia_tri]) => <div className="cine-card cine-stat-card" key={ten}><span>{ten}</span><b>{gia_tri}</b></div>)}</div>

    <nav className="cine-admin-tabs" aria-label="Chức năng quản trị">{tabs.map(([ma, ten]) => <button type="button" key={ma} className={`cine-btn ${tab === ma ? "cine-btn-primary" : "cine-btn-secondary"}`} onClick={() => setTab(ma)}>{ten}</button>)}</nav>

    {tab === "tong-quan" && <section className="cine-dashboard-v211">
      {!tong_quan ? <div className="cine-card cine-admin-section">Đang tải thống kê quản trị…</div> : <>
        {tong_quan.canh_bao_kho.tong_canh_bao > 0 && <div className="cine-card cine-stock-alert-v217" role="alert"><div><b>⚠️ Cảnh báo tồn kho</b><span>{tong_quan.canh_bao_kho.sap_het} biến thể sắp hết (≤ {tong_quan.canh_bao_kho.nguong_sap_het}) · {tong_quan.canh_bao_kho.het_hang} biến thể hết hàng.</span></div><button type="button" className="cine-btn cine-btn-primary" onClick={()=>setTab("kho")}>Mở kho xử lý</button></div>}
        <div className="cine-dashboard-period-cards">
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu hôm nay</span><strong>{dinhDangTien(tong_quan.doanh_thu.hom_nay)}</strong><small>{tong_quan.don_ghi_nhan_doanh_thu_theo_ky.hom_nay} đơn ghi nhận doanh thu · {tong_quan.don_da_giao_theo_ky.hom_nay} đơn đã giao · {tong_quan.don_hang_theo_ky.hom_nay} đơn mới phát sinh</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu 7 ngày</span><strong>{dinhDangTien(tong_quan.doanh_thu.bay_ngay)}</strong><small>{tong_quan.don_ghi_nhan_doanh_thu_theo_ky.bay_ngay} đơn ghi nhận doanh thu · {tong_quan.don_hang_theo_ky.bay_ngay} đơn mới</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu 30 ngày</span><strong>{dinhDangTien(tong_quan.doanh_thu.ba_muoi_ngay)}</strong><small>{tong_quan.don_ghi_nhan_doanh_thu_theo_ky.ba_muoi_ngay} đơn ghi nhận doanh thu · trung bình {dinhDangTien(tong_quan.doanh_thu.gia_tri_don_trung_binh_30_ngay)}/đơn</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Khách hàng mới</span><strong>{tong_quan.khach_hang_moi.ba_muoi_ngay}</strong><small>Hôm nay {tong_quan.khach_hang_moi.hom_nay} · 7 ngày {tong_quan.khach_hang_moi.bay_ngay}</small></article>
        </div>

        <div className="cine-card cine-revenue-explain-v332"><b>Đối soát giao hàng & doanh thu</b><span>Doanh thu tính một lần theo thời điểm thu tiền. Đơn online/chuyển khoản đã thanh toán được tính trước khi giao; vì vậy số đơn vừa chuyển “Đã giao” có thể lớn hơn số đơn vừa làm doanh thu tăng. COD chỉ tăng doanh thu khi Admin xác nhận giao và hệ thống chốt giao dịch chờ thanh toán.</span></div>
        <div className="cine-dashboard-grid">
          <article className="cine-card cine-dashboard-panel cine-dashboard-revenue">
            <div className="cine-dashboard-panel-head"><div><h2>Doanh thu 7 ngày</h2><p>Số đơn và doanh thu đều theo thời điểm thanh toán/ghi nhận, múi giờ Việt Nam.</p></div><strong>{dinhDangTien(tong_quan.doanh_thu.bay_ngay)}</strong></div>
            <div className="cine-revenue-bars">{tong_quan.doanh_thu_theo_ngay.map(item => <div className="cine-revenue-row" key={item.ngay}>
              <div><b>{new Date(`${item.ngay}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "short" })}</b><span>{new Date(`${item.ngay}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span></div>
              <div className="cine-revenue-track"><i style={{ width: `${Math.max(3, (item.doanh_thu / maxDoanhThu7Ngay) * 100)}%` }} /></div>
              <div><strong>{dinhDangTien(item.doanh_thu)}</strong><small>{item.so_don} đơn</small></div>
            </div>)}</div>
          </article>

          <article className="cine-card cine-dashboard-panel">
            <div className="cine-dashboard-panel-head"><div><h2>Trạng thái đơn hàng</h2><p>Toàn bộ đơn đang có trong hệ thống.</p></div><strong>{tong_quan.don_hang}</strong></div>
            <div className="cine-order-status-grid">{Object.entries(tong_quan.trang_thai_don_hang).map(([status, count]) => <div className="cine-order-status" key={status} data-status={status}><span>{nhanTrangThaiDon(status)}</span><b>{count}</b></div>)}</div>
          </article>
        </div>

        <div className="cine-dashboard-grid">
          <article className="cine-card cine-dashboard-panel">
            <div className="cine-dashboard-panel-head"><div><h2>Top sản phẩm 30 ngày</h2><p>Xếp theo số lượng bán, bỏ đơn đã hủy.</p></div></div>
            <div className="cine-dashboard-table">
              <div className="cine-dashboard-table-head"><span>Sản phẩm</span><span>Số lượng</span><span>Giá trị</span></div>
              {tong_quan.top_san_pham_30_ngay.map((item, index) => <div className="cine-dashboard-table-row" key={item.ma_san_pham}><span><b>#{index + 1} · {item.ten_san_pham}</b><small>{item.ma_san_pham}</small></span><strong>{item.so_luong}</strong><strong>{dinhDangTien(item.doanh_thu)}</strong></div>)}
              {tong_quan.top_san_pham_30_ngay.length === 0 && <div className="cine-dashboard-empty">Chưa có dữ liệu bán hàng trong 30 ngày.</div>}
            </div>
          </article>

          <article className="cine-card cine-dashboard-panel">
            <div className="cine-dashboard-panel-head"><div><h2>Tồn kho thấp</h2><p>Biến thể đang bán có tồn kho ≤ {tong_quan.canh_bao_kho.nguong_sap_het}.</p></div><strong>{tong_quan.canh_bao_kho.tong_canh_bao}</strong></div>
            <div className="cine-low-stock-list">{tong_quan.ton_kho_thap.map(item => <div className="cine-low-stock-row" key={item.id}><span><b>{item.ten_san_pham}</b><small>{item.ma_bien_the} · {item.vat_lieu} · {item.mau_sac}</small></span><strong className={item.so_luong_ton <= 1 ? "critical" : ""}>{item.so_luong_ton}</strong></div>)}
            {tong_quan.ton_kho_thap.length === 0 && <div className="cine-dashboard-empty">Không có biến thể tồn kho thấp.</div>}</div>
          </article>
        </div>

        <article className="cine-card cine-dashboard-panel">
          <div className="cine-dashboard-panel-head"><div><h2>Đơn hàng gần đây</h2><p>8 đơn mới nhất để Admin theo dõi nhanh.</p></div></div>
          <div className="cine-recent-orders">{tong_quan.don_gan_day.map(item => <div className="cine-recent-order" key={item.id}><span><b>{item.ma_don_hang}</b><small>{item.ho_ten_nguoi_nhan}</small></span><span><b>{dinhDangTien(item.tong_tien)}</b><small>{new Date(item.ngay_tao).toLocaleString("vi-VN")}</small></span><span className="cine-order-state" data-status={item.trang_thai}>{nhanTrangThaiDon(item.trang_thai)}</span></div>)}
          {tong_quan.don_gan_day.length === 0 && <div className="cine-dashboard-empty">Chưa có đơn hàng.</div>}</div>
        </article>
      </>}
    </section>}

    {tab === "don-hang" && <section className="cine-admin-operations cine-commerce-admin-v212">
      <div className="cine-operations-heading"><div><h2>Quản trị đơn hàng</h2><p>Tìm kiếm, xem chi tiết, cập nhật trạng thái và theo dõi lịch sử xử lý.</p></div><div className="cine-order-heading-actions-v332"><span className="cine-admin-count">{don_hang.length} đơn</span><button type="button" className="cine-btn cine-btn-secondary" onClick={doiSoatDoanhThuDaGiao} disabled={dang_xu_ly === "doi-soat-doanh-thu"}>{dang_xu_ly === "doi-soat-doanh-thu" ? "Đang đối soát…" : "Đối soát doanh thu"}</button></div></div>
      <div className="cine-card cine-admin-filterbar-v212">
        <label><span>Tìm đơn hàng</span><input value={don_tim_kiem} onChange={e => setDonTimKiem(e.target.value)} placeholder="Mã đơn, người nhận, SĐT, email..."/></label>
        <label><span>Trạng thái</span><select value={don_loc_trang_thai} onChange={e => setDonLocTrangThai(e.target.value)}><option value="">Tất cả trạng thái</option>{TRANG_THAI_DON.map(x => <option key={x} value={x}>{nhanTrangThaiDon(x)}</option>)}</select></label>
        <button type="button" className="cine-btn cine-btn-primary" onClick={taiDonTheoBoLoc} disabled={dang_xu_ly === "loc-don"}>{dang_xu_ly === "loc-don" ? "Đang lọc…" : "Lọc đơn"}</button>
      </div>
      <div className="cine-order-admin-grid-v212">
        <div className="cine-card cine-order-admin-list-v212">
          <div className="cine-section-heading"><div><h3>Danh sách đơn</h3><p>Đơn mới nhất hiển thị trước.</p></div></div>
          <div className="cine-order-admin-items-v212">{don_hang.map(item => <button type="button" key={item.id} className={`cine-order-admin-item-v212 ${don_chon?.id === item.id ? "is-active" : ""}`} onClick={() => moChiTietDon(item.id)}>
            <span><b>{item.ma_don_hang}</b><small>{item.ho_ten_nguoi_nhan} · {item.so_dien_thoai}</small></span>
            <span><b>{dinhDangTien(item.tong_tien)}</b><small>{item.tong_so_luong} SP · {new Date(item.ngay_tao).toLocaleString("vi-VN")}</small></span>
            <i className="cine-order-state" data-status={item.trang_thai}>{nhanTrangThaiDon(item.trang_thai)}</i>
          </button>)}{don_hang.length === 0 && <div className="cine-dashboard-empty">Không có đơn phù hợp bộ lọc.</div>}</div>
        </div>
        <div className="cine-card cine-order-detail-v212">
          {!don_chon ? <div className="cine-order-detail-empty-v212"><b>Chọn một đơn hàng</b><p>Chi tiết người nhận, sản phẩm, thanh toán và lịch sử trạng thái sẽ hiển thị tại đây.</p></div> : <>
            <div className="cine-order-detail-head-v212"><div><span>Mã đơn</span><h3>{don_chon.ma_don_hang}</h3><small>{new Date(don_chon.ngay_tao).toLocaleString("vi-VN")}</small></div><strong>{dinhDangTien(don_chon.tong_tien)}</strong></div>
            <div className="cine-order-recipient-v212"><div><span>Người nhận</span><b>{don_chon.ho_ten_nguoi_nhan}</b><small>{don_chon.so_dien_thoai}</small></div><div><span>Địa chỉ giao hàng</span><b>{don_chon.dia_chi_giao_hang}</b>{don_chon.khach_hang?.thu_dien_tu && <small>{don_chon.khach_hang.thu_dien_tu}</small>}</div></div>
            <div className="cine-order-lines-v212"><h4>Sản phẩm</h4>{don_chon.chi_tiet.map(ct => <div className="cine-order-line-v212" key={ct.id}><span><b>{ct.ten_san_pham}</b><small>{ct.ma_san_pham} · {String(ct.tuy_chon?.ma_bien_the || "Cấu hình mặc định")}</small></span><span>{ct.so_luong} × {dinhDangTien(ct.don_gia)}</span><strong>{dinhDangTien(ct.thanh_tien)}</strong></div>)}</div>
            <div className="cine-order-payment-v2151"><div><h4>Thanh toán & doanh thu</h4><p>Doanh thu chỉ tính một lần. Online/chuyển khoản đã trả tiền được ghi nhận trước khi giao; COD ghi nhận lúc Admin xác nhận đã giao.</p></div>{giaoDichDonChon ? <div className="cine-payment-grid-v2151"><span><small>Phương thức</small><b>{giaoDichDonChon.phuong_thuc.ten_phuong_thuc}</b></span><span><small>Trạng thái</small><b>{nhanTrangThaiThanhToan(giaoDichDonChon.trang_thai)}</b></span><span><small>Số tiền</small><b>{dinhDangTien(giaoDichDonChon.so_tien)}</b></span><span><small>Ghi nhận doanh thu</small><b className={daGhiNhanDoanhThu(don_chon) ? "revenue-ok-v2151" : "revenue-wait-v2151"}>{daGhiNhanDoanhThu(don_chon) ? "Đã ghi nhận" : "Chưa ghi nhận"}</b></span>{giaoDichDonChon.ngay_thanh_toan && <span><small>Thanh toán lúc</small><b>{new Date(giaoDichDonChon.ngay_thanh_toan).toLocaleString("vi-VN")}</b></span>}</div> : <small>Đơn chưa có giao dịch thanh toán. Khi xác nhận giao, hệ thống dùng giá trị đơn làm doanh thu tương thích dữ liệu cũ.</small>}{donChonDaThuTienTruoc && <small className="cine-terminal-note-v212 revenue-ok-v2151">Đơn này đã thu tiền trước. Chuyển sang Đã giao chỉ cập nhật giao hàng, không cộng doanh thu lần hai.</small>}</div>
            <div className="cine-order-update-v212"><h4>Cập nhật trạng thái</h4><p className="cine-order-admin-override-v321">Admin có thể xác nhận <b>Đã giao / hoàn tất</b> trực tiếp từ mọi trạng thái đơn hàng. Hệ thống chỉ cộng doanh thu nếu đơn chưa được ghi nhận trước đó.</p><div className="cine-order-update-fields-v212"><label><span>Trạng thái mới</span><select value={don_trang_thai_moi} onChange={e => setDonTrangThaiMoi(e.target.value)}><option value={don_chon.trang_thai}>{nhanTrangThaiDon(don_chon.trang_thai)} (hiện tại)</option>{(TRANG_THAI_TIEP_THEO[don_chon.trang_thai] || []).map(x => <option key={x} value={x}>{nhanTrangThaiDon(x)}{x === "HOAN_TAT" && donChonSeGhiNhanKhiGiao ? " · sẽ ghi doanh thu" : x === "HOAN_TAT" && donChonDaThuTienTruoc ? " · doanh thu đã có" : ""}</option>)}</select></label><label><span>Ghi chú xử lý</span><input value={don_ghi_chu} onChange={e => setDonGhiChu(e.target.value)} placeholder="VD: Đã giao hàng cho khách"/></label></div><button type="button" className="cine-btn cine-btn-primary" onClick={luuTrangThaiDon} disabled={dang_xu_ly === `don-${don_chon.id}` || (don_trang_thai_moi === don_chon.trang_thai && !canGhiNhanDoanhThuDonDaGiao(don_chon))}>{dang_xu_ly === `don-${don_chon.id}` ? "Đang lưu…" : canGhiNhanDoanhThuDonDaGiao(don_chon) && don_trang_thai_moi === don_chon.trang_thai ? "Ghi nhận thanh toán & doanh thu" : don_trang_thai_moi === "HOAN_TAT" && donChonSeGhiNhanKhiGiao ? "Xác nhận đã giao & ghi doanh thu" : don_trang_thai_moi === "HOAN_TAT" ? "Xác nhận đã giao" : "Lưu trạng thái"}</button>{canGhiNhanDoanhThuDonDaGiao(don_chon) ? <small className="cine-terminal-note-v212 revenue-wait-v2151">Đơn đã giao nhưng vẫn còn giao dịch chờ thanh toán hợp lệ. Bấm để chốt doanh thu.</small> : TRANG_THAI_TIEP_THEO[don_chon.trang_thai]?.length === 0 && <small className="cine-terminal-note-v212">Đơn đã ở trạng thái kết thúc, không chuyển tiếp.</small>}</div>
            <div className="cine-order-history-v212"><h4>Lịch sử xử lý</h4>{don_chon.lich_su.map(ls => <div key={ls.id} className="cine-order-history-item-v212"><i/><span><b>{nhanTrangThaiDon(ls.trang_thai_moi)}</b><small>{new Date(ls.ngay_tao).toLocaleString("vi-VN")} · {ls.nguoi_thuc_hien?.ho_ten || "Hệ thống/khách hàng"}</small>{ls.ghi_chu && <em>{ls.ghi_chu}</em>}</span></div>)}</div>
          </>}
        </div>
      </div>
    </section>}

    {tab === "san-pham" && <section className="cine-admin-operations cine-commerce-admin-v212">
      <div className="cine-operations-heading"><div><h2>Quản lý sản phẩm</h2><p>Thêm, sửa, xóa sản phẩm và ảnh hiển thị. Tồn kho được quản lý riêng trong tab Kho.</p></div><div className="cine-product-heading-actions-v213"><span className="cine-admin-count">{san_pham_qt.length} sản phẩm</span><button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("kho")}>Mở kho</button><button type="button" className="cine-btn cine-btn-primary" onClick={() => setTaoSanPhamMo(x => !x)}>{tao_san_pham_mo ? "Đóng form" : "+ Thêm sản phẩm"}</button></div></div>

      {tao_san_pham_mo && <form className="cine-card cine-product-create-v213" onSubmit={taoSanPhamMoi}>
        <div className="cine-product-create-title-v213"><div><h3>Thêm sản phẩm mới</h3><p>Tạo thông tin bán hàng và ảnh sản phẩm. Biến thể mặc định được tạo với tồn kho 0; nhập kho tại tab Kho.</p></div><span>Ảnh 1000×800</span></div>
        <div className="cine-product-create-layout-v213">
          <div className="cine-product-image-editor-v213">
            <div className="cine-product-image-preview-v213">{anh_sp_moi ? <img src={anh_sp_moi} alt="Ảnh sản phẩm mới"/> : <span>Chưa chọn ảnh</span>}</div>
            <label className="cine-file-picker-v213"><b>Chọn ảnh thật từ máy</b><small>JPEG / PNG / WebP · tối đa 15 MB. Hệ thống tự cắt và nén về 1000×800.</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void chonAnhSanPhamMoi(e.target.files?.[0])}/></label>
          </div>
          <div className="cine-product-create-fields-v213">
            <label><span>Mã sản phẩm</span><input required value={sp_moi.ma_san_pham} onChange={e => setSpMoi(x => ({ ...x, ma_san_pham: e.target.value }))} placeholder="VD: N3D-NEW-013"/></label>
            <label><span>Tên sản phẩm</span><input required value={sp_moi.ten_san_pham} onChange={e => setSpMoi(x => ({ ...x, ten_san_pham: e.target.value }))} placeholder="Tên sản phẩm"/></label>
            <label><span>Danh mục</span><select required value={sp_moi.danh_muc_id} onChange={e => setSpMoi(x => ({ ...x, danh_muc_id: e.target.value }))}>{danh_muc_qt.map(dm => <option key={dm.id} value={dm.id}>{dm.ten_danh_muc}</option>)}</select></label>
            <label><span>Giá bán</span><input required type="number" min="0" step="1000" value={sp_moi.gia_ban} onChange={e => setSpMoi(x => ({ ...x, gia_ban: Number(e.target.value) }))}/></label>
            <label><span>Trạng thái</span><select value={sp_moi.trang_thai} onChange={e => setSpMoi(x => ({ ...x, trang_thai: e.target.value }))}><option value="NHAP">Nháp</option><option value="DANG_BAN">Đang bán</option><option value="TAM_AN">Tạm ẩn</option><option value="NGUNG_BAN">Ngừng bán</option></select></label>
            <label><span>Kích thước</span><input value={sp_moi.kich_thuoc} onChange={e => setSpMoi(x => ({ ...x, kich_thuoc: e.target.value }))} placeholder="VD: 120 × 80 × 45 mm"/></label>
            <label><span>Khối lượng (g)</span><input type="number" min="0" step="1" value={sp_moi.khoi_luong_gam} onChange={e => setSpMoi(x => ({ ...x, khoi_luong_gam: Number(e.target.value) }))}/></label>
            <label><span>Thời gian in (giờ)</span><input type="number" min="0" step="0.1" value={sp_moi.thoi_gian_in_gio} onChange={e => setSpMoi(x => ({ ...x, thoi_gian_in_gio: Number(e.target.value) }))}/></label>
            <label className="wide"><span>Mô tả ngắn</span><textarea maxLength={700} value={sp_moi.mo_ta_ngan} onChange={e => setSpMoi(x => ({ ...x, mo_ta_ngan: e.target.value }))} placeholder="Mô tả ngắn hiển thị trên card sản phẩm"/></label>
          </div>
        </div>
        <div className="cine-product-create-actions-v213"><button type="submit" className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-san-pham" || dang_xu_ly === "anh-sp-moi"}>{dang_xu_ly === "tao-san-pham" ? "Đang tạo…" : "Tạo sản phẩm"}</button><button type="button" className="cine-btn cine-btn-secondary" onClick={() => { setTaoSanPhamMo(false); setAnhSpMoi(""); }}>Hủy</button></div>
      </form>}

      <div className="cine-card cine-product-filter-v212 cine-product-picker-v2121">
        <label><span>Tìm sản phẩm</span><input value={san_pham_tim_kiem} onChange={e => setSanPhamTimKiem(e.target.value)} placeholder="Mã, tên hoặc danh mục..."/></label>
        <label><span>Chọn sản phẩm</span><select value={sanPhamDangChon?.id || ""} onChange={e => setSanPhamChonId(e.target.value)} disabled={sanPhamDaLoc.length === 0}><option value="" disabled>{sanPhamDaLoc.length ? "Chọn sản phẩm cần chỉnh" : "Không có sản phẩm phù hợp"}</option>{sanPhamDaLoc.map(sp => <option key={sp.id} value={sp.id}>{sp.ma_san_pham} · {sp.ten_san_pham} · {sp.danh_muc.ten_danh_muc}</option>)}</select></label>
        <div><b>{sanPhamDaLoc.length}</b><span>kết quả</span></div>
      </div>

      {sanPhamDangChon ? <div className="cine-product-admin-list-v212 cine-product-single-v2121"><article className="cine-card cine-product-admin-card-v212" key={sanPhamDangChon.id}>
        <div className="cine-product-admin-head-v212"><div><span>{sanPhamDangChon.ma_san_pham} · {sanPhamDangChon.danh_muc.ten_danh_muc}</span><h3>{sanPhamDangChon.ten_san_pham}</h3></div><span className="cine-order-state" data-status={sanPhamDangChon.trang_thai}>{sanPhamDangChon.trang_thai.replaceAll("_", " ")}</span></div>
        <div className="cine-product-edit-layout-v213">
          <div className="cine-product-image-editor-v213">
            <div className="cine-product-image-preview-v213">{(anh_sp_cho_luu[sanPhamDangChon.id] || sanPhamDangChon.hinh_anh?.[0]?.duong_dan_anh) ? <img src={anh_sp_cho_luu[sanPhamDangChon.id] || sanPhamDangChon.hinh_anh[0].duong_dan_anh} alt={sanPhamDangChon.ten_san_pham} referrerPolicy="no-referrer"/> : <span>Chưa có ảnh</span>}</div>
            <label className="cine-file-picker-v213"><b>Thay ảnh từ máy</b><small>Ảnh mới chỉ được ghi khi bấm Lưu sản phẩm. Tự chuẩn hóa 1000×800.</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void chonAnhSanPhamCoSan(sanPhamDangChon.id, e.target.files?.[0])}/></label>
          </div>
          <div className="cine-product-form-v212 cine-product-form-v213">
            <label><span>Mã sản phẩm</span><input value={sanPhamDangChon.ma_san_pham} disabled/></label>
            <label><span>Tên sản phẩm</span><input value={sanPhamDangChon.ten_san_pham} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { ten_san_pham: e.target.value })}/></label>
            <label><span>Danh mục</span><select value={sanPhamDangChon.danh_muc.id} onChange={e => { const dm = danh_muc_qt.find(x => x.id === e.target.value); if (dm) suaSanPhamLocal(sanPhamDangChon.id, { danh_muc: { id: dm.id, ma_danh_muc: dm.ma_danh_muc, ten_danh_muc: dm.ten_danh_muc } }); }}>{danh_muc_qt.map(dm => <option key={dm.id} value={dm.id}>{dm.ten_danh_muc}</option>)}</select></label>
            <label><span>Giá bán</span><input type="number" min="0" step="1000" value={sanPhamDangChon.gia_ban} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { gia_ban: Number(e.target.value) })}/></label>
            <label><span>Trạng thái</span><select value={sanPhamDangChon.trang_thai} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { trang_thai: e.target.value })}><option value="NHAP">Nháp</option><option value="DANG_BAN">Đang bán</option><option value="TAM_AN">Tạm ẩn</option><option value="NGUNG_BAN">Ngừng bán</option></select></label>
            <label><span>Kích thước</span><input value={sanPhamDangChon.kich_thuoc || ""} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { kich_thuoc: e.target.value })}/></label>
            <label><span>Khối lượng (g)</span><input type="number" min="0" value={sanPhamDangChon.khoi_luong_gam || 0} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { khoi_luong_gam: Number(e.target.value) })}/></label>
            <label><span>Thời gian in (giờ)</span><input type="number" min="0" step="0.1" value={sanPhamDangChon.thoi_gian_in_gio || 0} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { thoi_gian_in_gio: Number(e.target.value) })}/></label>
            <label className="wide"><span>Mô tả ngắn</span><textarea value={sanPhamDangChon.mo_ta_ngan || ""} onChange={e => suaSanPhamLocal(sanPhamDangChon.id, { mo_ta_ngan: e.target.value })}/></label>
          </div>
        </div>
        <div className="cine-product-edit-actions-v213"><button type="button" className="cine-btn cine-btn-primary" onClick={() => luuSanPham(sanPhamDangChon)} disabled={dang_xu_ly === `sp-${sanPhamDangChon.id}` || dang_xu_ly === `anh-${sanPhamDangChon.id}`}>{dang_xu_ly === `sp-${sanPhamDangChon.id}` ? "Đang lưu…" : "Lưu sản phẩm"}</button><button type="button" className="cine-btn cine-btn-secondary" onClick={() => { setKhoTimKiem(sanPhamDangChon.ma_san_pham); setTab("kho"); }}>Mở tồn kho</button><button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaSanPham(sanPhamDangChon)} disabled={dang_xu_ly === `xoa-sp-${sanPhamDangChon.id}`}>{dang_xu_ly === `xoa-sp-${sanPhamDangChon.id}` ? "Đang xóa…" : "Xóa sản phẩm"}</button></div>
      </article></div> : <div className="cine-card cine-dashboard-empty cine-product-empty-v2121">Không có sản phẩm phù hợp bộ lọc.</div>}
    </section>}

    {tab === "danh-muc" && <section className="cine-admin-operations cine-commerce-admin-v212 cine-category-admin-v215">
      <div className="cine-operations-heading"><div><h2>Danh mục sản phẩm</h2><p>Tạo, chỉnh sửa, ẩn/hiện và xóa danh mục. Danh mục đang chứa sản phẩm phải được chuyển hết sản phẩm trước khi xóa.</p></div><span className="cine-admin-count">{danh_muc_qt.length} danh mục</span></div>
      <div className="cine-category-layout-v215">
        <form className="cine-card cine-category-create-v215" onSubmit={taoDanhMucMoi}>
          <h3>Thêm danh mục</h3>
          <label><span>Mã danh mục</span><input required value={dm_moi.ma_danh_muc} onChange={e => setDmMoi(x => ({...x, ma_danh_muc:e.target.value}))} placeholder="VD: PHU_KIEN"/></label>
          <label><span>Tên danh mục</span><input required value={dm_moi.ten_danh_muc} onChange={e => setDmMoi(x => ({...x, ten_danh_muc:e.target.value}))} placeholder="Phụ kiện in 3D"/></label>
          <label><span>Mô tả</span><textarea value={dm_moi.mo_ta} onChange={e => setDmMoi(x => ({...x, mo_ta:e.target.value}))}/></label>
          <div className="cine-two-fields-v215"><label><span>Thứ tự</span><input type="number" min="0" value={dm_moi.thu_tu} onChange={e => setDmMoi(x => ({...x, thu_tu:Number(e.target.value)}))}/></label><label className="cine-check-v215"><input type="checkbox" checked={dm_moi.dang_hien_thi} onChange={e => setDmMoi(x => ({...x, dang_hien_thi:e.target.checked}))}/><span>Hiển thị storefront</span></label></div>
          <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-danh-muc"}>{dang_xu_ly === "tao-danh-muc" ? "Đang tạo…" : "Tạo danh mục"}</button>
        </form>
        <div className="cine-category-list-v215">{danh_muc_qt.map(dm => <article className="cine-card cine-category-row-v215" key={dm.id}>
          <div className="cine-category-code-v215"><b>{dm.ma_danh_muc}</b><small>{dm.so_san_pham} sản phẩm</small></div>
          <label><span>Tên danh mục</span><input value={dm.ten_danh_muc} onChange={e => suaDanhMucLocal(dm.id,{ten_danh_muc:e.target.value})}/></label>
          <label><span>Mô tả</span><input value={dm.mo_ta || ""} onChange={e => suaDanhMucLocal(dm.id,{mo_ta:e.target.value})}/></label>
          <label><span>Thứ tự</span><input type="number" min="0" value={dm.thu_tu} onChange={e => suaDanhMucLocal(dm.id,{thu_tu:Number(e.target.value)})}/></label>
          <label className="cine-check-v215"><input type="checkbox" checked={dm.dang_hien_thi} onChange={e => suaDanhMucLocal(dm.id,{dang_hien_thi:e.target.checked})}/><span>{dm.dang_hien_thi ? "Đang hiện" : "Đang ẩn"}</span></label>
          <div className="cine-row-actions-v215"><button type="button" className="cine-btn cine-btn-secondary" onClick={() => luuDanhMuc(dm)} disabled={dang_xu_ly === `dm-${dm.id}`}>Lưu</button><button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaDanhMuc(dm)} disabled={dang_xu_ly === `dm-${dm.id}`}>Xóa</button></div>
        </article>)}</div>
      </div>
    </section>}

    {tab === "kho" && <section className="cine-admin-operations cine-commerce-admin-v212 cine-inventory-admin-v214 cine-variant-admin-v215">
      <div className="cine-operations-heading"><div><h2>Kho hàng</h2><p>Quản lý biến thể, định mức tồn tối thiểu/tối đa, gợi ý nhập hàng, phiếu nhập và nhà cung cấp.</p></div><div className="cine-product-heading-actions-v213"><span className="cine-admin-count">{thongKeKho.bien_the} biến thể</span><button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("nha-cung-cap")}>Nhà cung cấp</button><button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("san-pham")}>Quản lý sản phẩm</button></div></div>

      <div className="cine-inventory-stats-v214">
        <article className="cine-card cine-inventory-stat-v214"><span>Tổng biến thể</span><b>{thongKeKho.bien_the}</b><small>Đang theo dõi trong kho</small></article>
        <article className="cine-card cine-inventory-stat-v214"><span>Tổng tồn</span><b>{thongKeKho.tong_ton}</b><small>Tổng số lượng khả dụng</small></article>
        <article className="cine-card cine-inventory-stat-v214 warning"><span>Sắp hết</span><b>{thongKeKho.sap_het}</b><small>Từ 1 đến {nguongKho} sản phẩm</small></article>
        <article className="cine-card cine-inventory-stat-v214 critical"><span>Hết hàng</span><b>{thongKeKho.het_hang}</b><small>Tồn kho bằng 0</small></article>
        <article className="cine-card cine-inventory-stat-v214 reorder"><span>Cần nhập theo định mức</span><b>{thongKeKho.can_nhap}</b><small>Gợi ý nhập tổng +{thongKeKho.goi_y_nhap}</small></article>
      </div>

      <div className="cine-card cine-stock-config-v217"><div><h3>Ngưỡng cảnh báo sắp hết</h3><p>Dùng chung cho Dashboard, bộ lọc Kho và nhãn trạng thái. Giá trị từ 1–999.</p></div><label><span>Ngưỡng tồn</span><input type="number" min="1" max="999" value={cau_hinh_kho.nguong_sap_het} onChange={e=>setCauHinhKho(x=>({...x,nguong_sap_het:Math.max(1,Math.min(999,Number(e.target.value)||1))}))}/></label><button type="button" className="cine-btn cine-btn-primary" onClick={luuCauHinhKho} disabled={dang_xu_ly==="cau-hinh-kho"}>{dang_xu_ly==="cau-hinh-kho"?"Đang lưu…":"Lưu ngưỡng"}</button></div>

      <div className="cine-card cine-stock-email-v218">
        <div><h3>Cảnh báo tồn kho qua email</h3><p>{canh_bao_kho_email?.bat ? `Đang bật · kiểm tra mỗi ${canh_bao_kho_email.chu_ky_phut} phút · ${canh_bao_kho_email.so_nguoi_nhan} người nhận.` : "Đang tắt theo cấu hình môi trường LOW_STOCK_EMAIL_ENABLED."}</p><small>{canh_bao_kho_email?.lan_gui_cuoi ? `Lần gửi gần nhất: ${new Date(canh_bao_kho_email.lan_gui_cuoi).toLocaleString("vi-VN")} · ${canh_bao_kho_email.tong_canh_bao_lan_cuoi} cảnh báo` : "Chưa có lần gửi cảnh báo thành công."}</small></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={guiCanhBaoKhoNgay} disabled={dang_xu_ly==="gui-canh-bao-kho-email"}>{dang_xu_ly==="gui-canh-bao-kho-email"?"Đang kiểm tra…":"Kiểm tra & gửi ngay"}</button>
      </div>

      <div className="cine-card cine-batch-import-v218">
        <div className="cine-batch-head-v218"><div><h3>Nhập kho nhanh theo lô</h3><p>Import CSV/Excel, kiểm tra toàn bộ mã biến thể và số lượng trước khi ghi. Chỉ khi 100% dòng hợp lệ mới cho xác nhận nhập kho.</p></div><div className="cine-batch-actions-v218"><button type="button" className="cine-btn cine-btn-secondary" onClick={taiMauNhapKho}>Tải CSV mẫu</button><label className="cine-btn cine-btn-primary cine-file-btn-v218">{dang_xu_ly==="kiem-tra-import-kho"?"Đang kiểm tra…":"Chọn CSV / Excel"}<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e=>void docTepNhapKho(e.target.files?.[0])}/></label></div></div>
        <div className="cine-batch-meta-v218"><label><span>Mã lô</span><input value={nhap_lo_meta.ma_lo} maxLength={80} onChange={e=>setNhapLoMeta(x=>({...x,ma_lo:e.target.value}))} placeholder="VD: PLA-20260831-A"/></label><label><span>Nhà cung cấp</span><select className="cine-select-readable-v2182" value={nhap_lo_meta.nha_cung_cap_id} onChange={e=>setNhapLoMeta(x=>({...x,nha_cung_cap_id:e.target.value}))}><option value="">Không gắn nhà cung cấp</option>{nha_cung_cap_qt.filter(x=>x.dang_hoat_dong).map(x=><option key={x.id} value={x.id}>{x.ma_nha_cung_cap} · {x.ten_nha_cung_cap}</option>)}</select><button type="button" className="cine-inline-link-v219" onClick={()=>setTab("nha-cung-cap")}>Quản lý nhà cung cấp</button></label><label><span>Ghi chú phiếu</span><input value={nhap_lo_meta.ghi_chu} maxLength={1000} onChange={e=>setNhapLoMeta(x=>({...x,ghi_chu:e.target.value}))} placeholder="Thông tin chung của lô nhập"/></label></div>
        {import_kho ? <div className="cine-import-preview-v218">
          <div className="cine-import-summary-v218"><span><b>{import_kho.tong_dong}</b> dòng</span><span className="ok"><b>{import_kho.hop_le}</b> hợp lệ</span><span className={import_kho.khong_hop_le?"bad":"ok"}><b>{import_kho.khong_hop_le}</b> lỗi</span><span><b>{import_kho.dong.filter(x=>x.hop_le).reduce((sum,x)=>sum+x.so_luong_nhap,0)}</b> tổng SL nhập</span><button type="button" className="cine-btn cine-btn-primary" onClick={xacNhanNhapKhoTheoLo} disabled={import_kho.khong_hop_le>0 || import_kho.hop_le===0 || dang_xu_ly==="nhap-kho-theo-lo"}>{dang_xu_ly==="nhap-kho-theo-lo"?"Đang ghi kho…":"Xác nhận nhập kho"}</button></div>
          <div className="cine-import-table-wrap-v218"><div className="cine-import-table-v218"><div className="head"><span>Dòng</span><span>Mã biến thể</span><span>Sản phẩm</span><span>SL nhập</span><span>Tồn trước → sau</span><span>Kết quả</span></div>{import_kho.dong.slice(0,100).map(item=><div className={item.hop_le?"row ok":"row bad"} key={`${item.dong}-${item.ma_bien_the}`}><span>{item.dong}</span><span><b>{item.ma_bien_the||"—"}</b></span><span>{item.ten_san_pham||item.ma_san_pham||"—"}</span><span>+{Number.isFinite(item.so_luong_nhap)?item.so_luong_nhap:"?"}</span><span>{item.ton_hien_tai===null?"—":`${item.ton_hien_tai} → ${item.ton_sau_nhap}`}</span><span>{item.hop_le?"Hợp lệ":item.loi.join(" · ")}</span></div>)}</div></div>
        </div> : <div className="cine-import-empty-v218">Chưa chọn file. Cột bắt buộc: <b>ma_bien_the</b>, <b>so_luong_nhap</b>; cột tùy chọn: <b>ly_do</b>.</div>}
        {phieu_nhap_kho.length>0 && <div className="cine-receipt-list-v218"><h4>Phiếu nhập gần đây</h4>{phieu_nhap_kho.slice(0,6).map(p=><div key={p.id}><span><b>{p.ma_phieu}</b><small>{p.ma_lo?`Lô ${p.ma_lo}`:"Không mã lô"}{p.nha_cung_cap?` · ${p.nha_cung_cap}`:""}</small></span><strong>{p.so_dong} dòng · +{p.tong_so_luong}</strong><time>{new Date(p.ngay_tao).toLocaleString("vi-VN")}</time></div>)}</div>}
      </div>

      <div className="cine-card cine-receipt-history-v219">
        <div className="cine-receipt-history-head-v219"><div><h3>Lịch sử phiếu nhập kho</h3><p>Tìm theo mã phiếu/mã lô/nhà cung cấp, lọc theo thời gian, xem chi tiết và xuất Excel đối soát.</p></div><button type="button" className="cine-btn cine-btn-secondary" onClick={taiExcelPhieuNhapKho} disabled={dang_xu_ly==="excel-phieu-nhap"}>{dang_xu_ly==="excel-phieu-nhap"?"Đang xuất…":"Xuất Excel"}</button></div>
        <div className="cine-receipt-filters-v219">
          <label className="wide"><span>Tìm phiếu nhập</span><input value={phieu_nhap_tim_kiem} onChange={e=>setPhieuNhapTimKiem(e.target.value)} placeholder="Mã phiếu, mã lô, tên nhà cung cấp…"/></label>
          <label><span>Nhà cung cấp</span><select className="cine-select-readable-v2182" value={phieu_nhap_loc_ncc} onChange={e=>setPhieuNhapLocNcc(e.target.value)}><option value="">Tất cả nhà cung cấp</option>{nha_cung_cap_qt.map(x=><option key={x.id} value={x.id}>{x.ma_nha_cung_cap} · {x.ten_nha_cung_cap}</option>)}</select></label>
          <label><span>Từ ngày</span><input type="date" value={phieu_nhap_tu_ngay} onChange={e=>setPhieuNhapTuNgay(e.target.value)}/></label>
          <label><span>Đến ngày</span><input type="date" value={phieu_nhap_den_ngay} onChange={e=>setPhieuNhapDenNgay(e.target.value)}/></label>
          <button type="button" className="cine-btn cine-btn-primary" onClick={locPhieuNhapKho} disabled={dang_xu_ly==="loc-phieu-nhap"}>{dang_xu_ly==="loc-phieu-nhap"?"Đang lọc…":"Lọc phiếu"}</button>
        </div>
        <div className="cine-receipt-table-v219">
          <div className="head"><span>Phiếu / lô</span><span>Nhà cung cấp</span><span>Quy mô</span><span>Ngày tạo</span><span>Thao tác</span></div>
          {phieu_nhap_kho.slice(0,80).map(p=><div className="row" key={p.id}><span><b>{p.ma_phieu}</b><small>{p.ma_lo?`Lô ${p.ma_lo}`:"Không mã lô"}</small></span><span><b>{p.nha_cung_cap_ref?.ten_nha_cung_cap || p.nha_cung_cap || "—"}</b><small>{p.nha_cung_cap_ref?.ma_nha_cung_cap || ""}</small></span><span><b>{p.so_dong} dòng</b><small>+{p.tong_so_luong} sản phẩm</small></span><time>{new Date(p.ngay_tao).toLocaleString("vi-VN")}</time><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>xemChiTietPhieuNhapKho(p.id)} disabled={dang_xu_ly===`phieu-nhap-${p.id}`}>{dang_xu_ly===`phieu-nhap-${p.id}`?"Đang tải…":"Chi tiết"}</button></div>)}
          {phieu_nhap_kho.length===0&&<div className="cine-dashboard-empty">Không có phiếu nhập phù hợp bộ lọc.</div>}
        </div>
        {phieu_nhap_chi_tiet&&<div className="cine-receipt-detail-v219"><div className="cine-receipt-detail-head-v219"><div><h4>{phieu_nhap_chi_tiet.ma_phieu}</h4><p>{phieu_nhap_chi_tiet.ma_lo?`Lô ${phieu_nhap_chi_tiet.ma_lo} · `:""}{phieu_nhap_chi_tiet.nha_cung_cap_ref?.ten_nha_cung_cap || phieu_nhap_chi_tiet.nha_cung_cap || "Không nhà cung cấp"}</p></div><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>setPhieuNhapChiTiet(null)}>Đóng</button></div><div className="cine-receipt-detail-table-v219"><div className="head"><span>Biến thể</span><span>Sản phẩm</span><span>Vật liệu / màu</span><span>SL nhập</span><span>Tồn trước → sau</span><span>Lý do</span></div>{phieu_nhap_chi_tiet.chi_tiet.map((d,i)=><div className="row" key={d.id||`${d.ma_bien_the}-${i}`}><span><b>{d.ma_bien_the}</b></span><span>{d.ma_san_pham?`${d.ma_san_pham} · `:""}{d.ten_san_pham||"—"}</span><span>{d.vat_lieu||"—"} / {d.mau_sac||"—"}</span><strong>+{d.so_luong_nhap}</strong><span>{d.ton_truoc} → {d.ton_sau}</span><span>{d.ly_do||"Nhập kho"}</span></div>)}</div></div>}
      </div>

      <form className="cine-card cine-variant-create-v215" onSubmit={taoBienTheMoi}>
        <div><h3>Tạo biến thể mới</h3><p>Mỗi sản phẩm có thể có nhiều tổ hợp vật liệu/màu với mã và tồn kho riêng.</p></div>
        <label><span>Sản phẩm</span><select required value={bt_moi.san_pham_id} onChange={e => setBtMoi(x => ({...x, san_pham_id:e.target.value}))}><option value="">Chọn sản phẩm</option>{san_pham_qt.map(sp => <option key={sp.id} value={sp.id}>{sp.ma_san_pham} · {sp.ten_san_pham}</option>)}</select></label>
        <label><span>Mã biến thể</span><input required value={bt_moi.ma_bien_the} onChange={e => setBtMoi(x => ({...x, ma_bien_the:e.target.value}))} placeholder="VD: N3D-XXX-BT02"/></label>
        <label><span>Vật liệu</span><select className="cine-select-readable-v2182" value={bt_moi.vat_lieu_id} onChange={e => setBtMoi(x => ({...x, vat_lieu_id:e.target.value}))}><option value="">Mặc định / chưa chọn</option>{vat_lieu_qt.map(x => <option key={x.id} value={x.id}>{x.ma_vat_lieu} · {x.ten_vat_lieu}</option>)}</select></label>
        <label><span>Màu sắc</span><select className="cine-select-readable-v2182" value={bt_moi.mau_sac_id} onChange={e => setBtMoi(x => ({...x, mau_sac_id:e.target.value}))}><option value="">Mặc định / chưa chọn</option>{mau_sac_qt.map(x => <option key={x.id} value={x.id}>{x.ma_mau} · {x.ten_mau}</option>)}</select></label>
        <label><span>Chênh lệch giá</span><input type="number" step="1000" value={bt_moi.gia_chenh_lech} onChange={e => setBtMoi(x => ({...x, gia_chenh_lech:Number(e.target.value)}))}/></label>
        <label><span>Tồn ban đầu</span><input type="number" min="0" value={bt_moi.so_luong_ton} onChange={e => setBtMoi(x => ({...x, so_luong_ton:Number(e.target.value)}))}/></label>
        <label className="cine-check-v215"><input type="checkbox" checked={bt_moi.dang_hien_thi} onChange={e => setBtMoi(x => ({...x, dang_hien_thi:e.target.checked}))}/><span>Hiển thị</span></label>
        <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-bien-the"}>{dang_xu_ly === "tao-bien-the" ? "Đang tạo…" : "+ Thêm biến thể"}</button>
      </form>

      <div className="cine-card cine-stock-filters-v216">
        <label className="wide"><span>Tìm trong kho</span><input value={kho_tim_kiem} onChange={e => setKhoTimKiem(e.target.value)} placeholder="Mã sản phẩm, tên, biến thể, vật liệu, màu..."/></label>
        <label><span>Tình trạng tồn</span><select value={kho_loc_ton} onChange={e=>setKhoLocTon(e.target.value)}><option value="">Tất cả</option><option value="CON_HANG">Còn hàng &gt; {nguongKho}</option><option value="SAP_HET">Sắp hết 1–{nguongKho}</option><option value="HET_HANG">Hết hàng 0</option><option value="CAN_NHAP">Cần nhập theo định mức</option></select></label>
        <label><span>Vật liệu</span><select className="cine-select-readable-v2182" value={kho_loc_vat_lieu} onChange={e=>setKhoLocVatLieu(e.target.value)}><option value="">Tất cả vật liệu</option>{vat_lieu_qt.map(x=><option key={x.id} value={x.id}>{x.ma_vat_lieu} · {x.ten_vat_lieu}</option>)}</select></label>
        <label><span>Màu</span><select className="cine-select-readable-v2182" value={kho_loc_mau} onChange={e=>setKhoLocMau(e.target.value)}><option value="">Tất cả màu</option>{mau_sac_qt.map(x=><option key={x.id} value={x.id}>{x.ma_mau} · {x.ten_mau}</option>)}</select></label>
        <label><span>Hiển thị</span><select value={kho_loc_hien_thi} onChange={e=>setKhoLocHienThi(e.target.value)}><option value="">Tất cả</option><option value="HIEN">Đang hiện</option><option value="AN">Đang ẩn</option></select></label>
        <div className="cine-filter-result-v216"><b>{danhSachKho.length}</b><span>kết quả</span></div>
      </div>

      <div className="cine-card cine-inventory-table-card-v214 cine-variant-table-v215"><div className="cine-inventory-scroll-v214">
        <div className="cine-inventory-head-v214 cine-variant-head-v215"><span>Sản phẩm</span><span>Mã biến thể</span><span>Vật liệu</span><span>Màu</span><span>Chênh giá</span><span>Tồn</span><span>Tồn min</span><span>Tồn max</span><span>Gợi ý nhập</span><span>Tình trạng</span><span>Hiển thị</span><span>Lý do điều chỉnh</span><span>Thao tác</span></div>
        {danhSachKho.map(({ san_pham, bien_the }) => { const trang_thai_kho = bien_the.so_luong_ton <= 0 ? "HẾT HÀNG" : bien_the.so_luong_ton <= nguongKho ? "SẮP HẾT" : "CÒN HÀNG"; const stock_key = bien_the.so_luong_ton <= 0 ? "out" : bien_the.so_luong_ton <= nguongKho ? "low" : "ok"; const goi_y_nhap = bien_the.ton_toi_da > bien_the.ton_toi_thieu && bien_the.so_luong_ton <= bien_the.ton_toi_thieu ? Math.max(0,bien_the.ton_toi_da-bien_the.so_luong_ton) : 0; return <div className="cine-inventory-row-v214 cine-variant-row-v215" key={bien_the.id}>
          <span className="cine-inventory-product-v214"><b>{san_pham.ten_san_pham}</b><small>{san_pham.ma_san_pham}</small></span>
          <input value={bien_the.ma_bien_the} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{ma_bien_the:e.target.value})}/>
          <select className="cine-select-readable-v2182" value={bien_the.vat_lieu?.id || ""} onChange={e => { const x=vat_lieu_qt.find(v=>v.id===e.target.value); suaBienTheLocal(san_pham.id,bien_the.id,{vat_lieu:x?{id:x.id,ten_vat_lieu:x.ten_vat_lieu}:null}); }}><option value="">Mặc định / chưa chọn</option>{vat_lieu_qt.map(x => <option key={x.id} value={x.id}>{x.ma_vat_lieu} · {x.ten_vat_lieu}</option>)}</select>
          <select className="cine-select-readable-v2182" value={bien_the.mau_sac?.id || ""} onChange={e => { const x=mau_sac_qt.find(v=>v.id===e.target.value); suaBienTheLocal(san_pham.id,bien_the.id,{mau_sac:x?{id:x.id,ten_mau:x.ten_mau,ma_hex:x.ma_hex}:null}); }}><option value="">Mặc định / chưa chọn</option>{mau_sac_qt.map(x => <option key={x.id} value={x.id}>{x.ma_mau} · {x.ten_mau}</option>)}</select>
          <input type="number" step="1000" value={Number(bien_the.gia_chenh_lech)} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{gia_chenh_lech:Number(e.target.value)})}/>
          <input aria-label={`Tồn kho ${bien_the.ma_bien_the}`} type="number" min="0" max="1000000" value={bien_the.so_luong_ton} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{so_luong_ton:Math.max(0,Number(e.target.value))})}/>
          <input aria-label={`Tồn tối thiểu ${bien_the.ma_bien_the}`} type="number" min="0" max="1000000" value={bien_the.ton_toi_thieu} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{ton_toi_thieu:Math.max(0,Number(e.target.value))})}/>
          <input aria-label={`Tồn tối đa ${bien_the.ma_bien_the}`} type="number" min="0" max="1000000" value={bien_the.ton_toi_da} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{ton_toi_da:Math.max(0,Number(e.target.value))})}/>
          <span className={`cine-reorder-suggest-v219 ${goi_y_nhap>0?"active":""}`}>{goi_y_nhap>0?`+${goi_y_nhap}`:"—"}</span>
          <span className="cine-stock-state-v214" data-stock={stock_key}>{trang_thai_kho}</span>
          <label className="cine-stock-toggle-v212"><input type="checkbox" checked={bien_the.dang_hien_thi} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{dang_hien_thi:e.target.checked})}/><span>{bien_the.dang_hien_thi ? "Hiện" : "Ẩn"}</span></label>
          <input className="cine-stock-reason-v217" value={kho_ly_do[bien_the.id] || ""} onChange={e=>setKhoLyDo(x=>({...x,[bien_the.id]:e.target.value}))} maxLength={300} placeholder="Nhập kho, bán lẻ, kiểm kê…"/>
          <div className="cine-row-actions-v215"><button type="button" className="cine-btn cine-btn-secondary" onClick={() => luuTonKho(san_pham.id,bien_the.id)} disabled={dang_xu_ly === `kho-${bien_the.id}`}>Lưu kho</button><button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaBienThe(bien_the)} disabled={dang_xu_ly === `kho-${bien_the.id}`}>Xóa</button></div>
        </div>; })}
        {danhSachKho.length === 0 && <div className="cine-dashboard-empty">Không có biến thể phù hợp bộ lọc kho.</div>}
      </div></div>

      <div className="cine-card cine-stock-history-v216 cine-stock-history-v217">
        <div className="cine-stock-history-head-v216"><div><h3>Lịch sử nhập / xuất / điều chỉnh kho</h3><p>Ghi rõ nguyên nhân, chênh lệch, người thao tác và thời điểm.</p></div><label className="cine-history-filter-v217"><span>Loại biến động</span><select value={lich_su_kho_loc_loai} onChange={e=>setLichSuKhoLocLoai(e.target.value)}><option value="">Tất cả</option><option value="NHAP_KHO">Nhập kho</option><option value="XUAT_KHO">Xuất kho</option><option value="DIEU_CHINH">Điều chỉnh</option></select></label></div>
        <div className="cine-stock-history-list-v216">{lichSuKhoDaLoc.slice(0,24).map(item=> <div className="cine-stock-history-row-v216 cine-stock-history-row-v217" key={item.id}><span><b>{item.ma_bien_the || "Biến thể"}</b><small>{item.ma_san_pham} · {item.nguoi_thuc_hien?.ho_ten || "Admin"}</small><em>{item.ly_do}</em></span><span className="cine-stock-movement-v217" data-type={item.loai_bien_dong}>{item.loai_bien_dong === "NHAP_KHO" ? "Nhập kho" : item.loai_bien_dong === "XUAT_KHO" ? "Xuất kho" : "Điều chỉnh"}</span><strong className={item.chenh_lech >= 0 ? "plus" : "minus"}>{item.ton_cu} → {item.ton_moi} ({item.chenh_lech >= 0 ? "+" : ""}{item.chenh_lech})</strong><time>{new Date(item.ngay_tao).toLocaleString("vi-VN")}</time></div>)}{lichSuKhoDaLoc.length===0&&<div className="cine-dashboard-empty">Chưa có biến động kho phù hợp.</div>}</div>
      </div>
    </section>}

    {tab === "nha-cung-cap" && <section className="cine-admin-operations cine-supplier-admin-v219">
      <div className="cine-operations-heading"><div><h2>Nhà cung cấp</h2><p>Quản lý thông tin nhà cung cấp và liên kết trực tiếp với phiếu nhập kho. Nhà cung cấp đã có phiếu nhập chỉ được ngừng hoạt động, không xóa.</p></div><div className="cine-product-heading-actions-v213"><span className="cine-admin-count">{nha_cung_cap_qt.length} nhà cung cấp</span><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>setTab("kho")}>Mở kho</button></div></div>
      <div className="cine-supplier-layout-v219">
        <form className="cine-card cine-supplier-create-v219" onSubmit={taoNhaCungCapMoi}>
          <h3>Thêm nhà cung cấp</h3>
          <div className="cine-supplier-form-grid-v219"><label><span>Mã nhà cung cấp</span><input required value={ncc_moi.ma_nha_cung_cap} onChange={e=>setNccMoi(x=>({...x,ma_nha_cung_cap:e.target.value}))} placeholder="VD: NCC-PLA-01"/></label><label><span>Tên nhà cung cấp</span><input required value={ncc_moi.ten_nha_cung_cap} onChange={e=>setNccMoi(x=>({...x,ten_nha_cung_cap:e.target.value}))}/></label><label><span>Người liên hệ</span><input value={ncc_moi.nguoi_lien_he} onChange={e=>setNccMoi(x=>({...x,nguoi_lien_he:e.target.value}))}/></label><label><span>Số điện thoại</span><input value={ncc_moi.so_dien_thoai} onChange={e=>setNccMoi(x=>({...x,so_dien_thoai:e.target.value}))}/></label><label><span>Email</span><input type="email" value={ncc_moi.thu_dien_tu} onChange={e=>setNccMoi(x=>({...x,thu_dien_tu:e.target.value}))}/></label><label className="wide"><span>Địa chỉ</span><input value={ncc_moi.dia_chi} onChange={e=>setNccMoi(x=>({...x,dia_chi:e.target.value}))}/></label><label className="wide"><span>Ghi chú</span><textarea value={ncc_moi.ghi_chu} onChange={e=>setNccMoi(x=>({...x,ghi_chu:e.target.value}))}/></label><label className="cine-check-v215 cine-supplier-active-check-v320"><input type="checkbox" checked={ncc_moi.dang_hoat_dong} onChange={e=>setNccMoi(x=>({...x,dang_hoat_dong:e.target.checked}))}/><span>Đang hoạt động</span></label></div>
          <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly==="tao-nha-cung-cap"}>{dang_xu_ly==="tao-nha-cung-cap"?"Đang tạo…":"+ Thêm nhà cung cấp"}</button>
        </form>
        <div className="cine-supplier-main-v219">
          <div className="cine-card cine-supplier-filter-v219"><label><span>Tìm nhà cung cấp</span><input value={ncc_tim_kiem} onChange={e=>setNccTimKiem(e.target.value)} placeholder="Mã, tên, người liên hệ, điện thoại, email…"/></label><label><span>Trạng thái</span><select value={ncc_loc_hoat_dong} onChange={e=>setNccLocHoatDong(e.target.value)}><option value="">Tất cả</option><option value="true">Đang hoạt động</option><option value="false">Ngừng hoạt động</option></select></label><button type="button" className="cine-btn cine-btn-primary" onClick={locNhaCungCap} disabled={dang_xu_ly==="loc-nha-cung-cap"}>Lọc</button></div>
          <div className="cine-supplier-list-v219">{nha_cung_cap_qt.map(item=><article className="cine-card cine-supplier-row-v219" key={item.id}><div className="cine-supplier-code-v219"><b>{item.ma_nha_cung_cap}</b><small>{item.so_phieu_nhap} phiếu nhập</small><span className={`status-badge ${item.dang_hoat_dong?"active":"locked"}`}>{item.dang_hoat_dong?"Hoạt động":"Ngừng"}</span></div><div className="cine-supplier-fields-v219"><label><span>Tên nhà cung cấp</span><input value={item.ten_nha_cung_cap} onChange={e=>suaNhaCungCapLocal(item.id,{ten_nha_cung_cap:e.target.value})}/></label><label><span>Người liên hệ</span><input value={item.nguoi_lien_he||""} onChange={e=>suaNhaCungCapLocal(item.id,{nguoi_lien_he:e.target.value})}/></label><label><span>Điện thoại</span><input value={item.so_dien_thoai||""} onChange={e=>suaNhaCungCapLocal(item.id,{so_dien_thoai:e.target.value})}/></label><label><span>Email</span><input type="email" value={item.thu_dien_tu||""} onChange={e=>suaNhaCungCapLocal(item.id,{thu_dien_tu:e.target.value})}/></label><label className="wide"><span>Địa chỉ</span><input value={item.dia_chi||""} onChange={e=>suaNhaCungCapLocal(item.id,{dia_chi:e.target.value})}/></label><label className="wide"><span>Ghi chú</span><input value={item.ghi_chu||""} onChange={e=>suaNhaCungCapLocal(item.id,{ghi_chu:e.target.value})}/></label><label className="cine-check-v215 cine-supplier-active-check-v320"><input type="checkbox" checked={item.dang_hoat_dong} onChange={e=>suaNhaCungCapLocal(item.id,{dang_hoat_dong:e.target.checked})}/><span>{item.dang_hoat_dong?"Đang hoạt động":"Ngừng hoạt động"}</span></label></div><div className="cine-row-actions-v215"><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>luuNhaCungCap(item)} disabled={dang_xu_ly===`ncc-${item.id}`}>Lưu</button><button type="button" className="cine-btn cine-btn-danger-outline" onClick={()=>xoaNhaCungCap(item)} disabled={dang_xu_ly===`ncc-${item.id}`||item.so_phieu_nhap>0} title={item.so_phieu_nhap>0?"Đã có phiếu nhập: hãy chuyển sang Ngừng hoạt động":"Xóa nhà cung cấp"}>Xóa</button></div></article>)}{nha_cung_cap_qt.length===0&&<div className="cine-card cine-dashboard-empty">Không có nhà cung cấp phù hợp.</div>}</div>
        </div>
      </div>
    </section>}

    {tab === "tham-chieu" && <section className="cine-admin-operations cine-reference-admin-v216">
      <div className="cine-operations-heading"><div><h2>Vật liệu & màu sắc</h2><p>Quản lý dữ liệu tham chiếu dùng cho biến thể. Hệ thống chặn xóa khi vật liệu/màu vẫn đang được biến thể sử dụng.</p></div><span className="cine-admin-count">{vat_lieu_qt.length} vật liệu · {mau_sac_qt.length} màu</span></div>
      <div className="cine-reference-grid-v216">
        <div className="cine-reference-column-v216"><form className="cine-card cine-reference-create-v216" onSubmit={taoVatLieuMoi}><h3>Thêm vật liệu</h3><label><span>Mã</span><input required value={vl_moi.ma_vat_lieu} onChange={e=>setVlMoi(x=>({...x,ma_vat_lieu:e.target.value}))} placeholder="PLA_PLUS"/></label><label><span>Tên vật liệu</span><input required value={vl_moi.ten_vat_lieu} onChange={e=>setVlMoi(x=>({...x,ten_vat_lieu:e.target.value}))}/></label><label><span>Hệ số giá</span><input type="number" min="0.1" max="10" step="0.001" value={vl_moi.he_so_gia} onChange={e=>setVlMoi(x=>({...x,he_so_gia:Number(e.target.value)}))}/></label><label><span>Mô tả</span><textarea value={vl_moi.mo_ta} onChange={e=>setVlMoi(x=>({...x,mo_ta:e.target.value}))}/></label><button className="cine-btn cine-btn-primary" disabled={dang_xu_ly==="tao-vat-lieu"}>+ Thêm vật liệu</button></form><div className="cine-reference-list-v216">{vat_lieu_qt.map(item=><article className="cine-card cine-reference-row-v216" key={item.id}><div className="cine-reference-meta-v216"><b>{item.ma_vat_lieu}</b><small>{item.so_bien_the} biến thể đang dùng</small></div><label><span>Tên</span><input value={item.ten_vat_lieu} onChange={e=>suaVatLieuLocal(item.id,{ten_vat_lieu:e.target.value})}/></label><label><span>Hệ số giá</span><input type="number" min="0.1" max="10" step="0.001" value={item.he_so_gia} onChange={e=>suaVatLieuLocal(item.id,{he_so_gia:Number(e.target.value)})}/></label><label className="wide"><span>Mô tả</span><input value={item.mo_ta || ""} onChange={e=>suaVatLieuLocal(item.id,{mo_ta:e.target.value})}/></label><div className="cine-row-actions-v215"><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>luuVatLieu(item)} disabled={dang_xu_ly===`vl-${item.id}`}>Lưu</button><button type="button" className="cine-btn cine-btn-danger-outline" onClick={()=>xoaVatLieu(item)} disabled={dang_xu_ly===`vl-${item.id}` || item.so_bien_the>0}>Xóa</button></div></article>)}</div></div>
        <div className="cine-reference-column-v216"><form className="cine-card cine-reference-create-v216" onSubmit={taoMauMoi}><h3>Thêm màu</h3><label><span>Mã</span><input required value={ms_moi.ma_mau} onChange={e=>setMsMoi(x=>({...x,ma_mau:e.target.value}))} placeholder="XANH_NAVY"/></label><label><span>Tên màu</span><input required value={ms_moi.ten_mau} onChange={e=>setMsMoi(x=>({...x,ten_mau:e.target.value}))}/></label><label><span>Mã HEX</span><div className="cine-color-field-v216"><input type="color" value={ms_moi.ma_hex.slice(0,7)} onChange={e=>setMsMoi(x=>({...x,ma_hex:e.target.value.toUpperCase()}))}/><input required pattern="^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$" value={ms_moi.ma_hex} onChange={e=>setMsMoi(x=>({...x,ma_hex:e.target.value}))}/></div></label><button className="cine-btn cine-btn-primary" disabled={dang_xu_ly==="tao-mau-sac"}>+ Thêm màu</button></form><div className="cine-reference-list-v216">{mau_sac_qt.map(item=><article className="cine-card cine-reference-row-v216 cine-color-row-v216" key={item.id}><div className="cine-reference-meta-v216"><span className="cine-color-dot-v216" style={{background:item.ma_hex}}/><div><b>{item.ma_mau}</b><small>{item.so_bien_the} biến thể đang dùng</small></div></div><label><span>Tên</span><input value={item.ten_mau} onChange={e=>suaMauSacLocal(item.id,{ten_mau:e.target.value})}/></label><label><span>HEX</span><div className="cine-color-field-v216"><input type="color" value={item.ma_hex.slice(0,7)} onChange={e=>suaMauSacLocal(item.id,{ma_hex:e.target.value.toUpperCase()})}/><input value={item.ma_hex} onChange={e=>suaMauSacLocal(item.id,{ma_hex:e.target.value})}/></div></label><div className="cine-row-actions-v215"><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>luuMau(item)} disabled={dang_xu_ly===`ms-${item.id}`}>Lưu</button><button type="button" className="cine-btn cine-btn-danger-outline" onClick={()=>xoaMau(item)} disabled={dang_xu_ly===`ms-${item.id}` || item.so_bien_the>0}>Xóa</button></div></article>)}</div></div>
      </div>
    </section>}

    {tab === "danh-gia" && <section className="cine-admin-operations cine-review-admin-v215">
      <div className="cine-operations-heading"><div><h2>Duyệt đánh giá sản phẩm</h2><p>Đánh giá mới luôn chờ duyệt. Admin có thể duyệt để hiển thị, ẩn lại hoặc xóa.</p></div><span className="cine-admin-count">{danh_gia_qt.filter(x=>!x.da_duyet).length} chờ duyệt</span></div>
      <div className="cine-card cine-review-filter-v215"><label><span>Trạng thái</span><select value={danh_gia_loc} onChange={e=>setDanhGiaLoc(e.target.value)}><option value="">Tất cả</option><option value="CHO_DUYET">Chờ duyệt</option><option value="DA_DUYET">Đã duyệt</option></select></label><div><b>{danhGiaDaLoc.length}</b><span>đánh giá</span></div></div>
      <div className="cine-review-list-v215">{danhGiaDaLoc.map(item => <article className="cine-card cine-review-row-v215" key={item.id}>
        <div className="cine-review-product-v215"><b>{item.san_pham.ten_san_pham}</b><small>{item.san_pham.ma_san_pham}</small></div>
        <div className="cine-review-content-v215"><div><b>{item.ho_ten}</b><span>{"★".repeat(item.so_sao)}{"☆".repeat(5-item.so_sao)}</span></div><p>{item.noi_dung}</p><small>{new Date(item.ngay_tao).toLocaleString("vi-VN")}</small></div>
        <span className={`status-badge ${item.da_duyet ? "active" : "locked"}`}>{item.da_duyet ? "Đã duyệt" : "Chờ duyệt"}</span>
        <div className="cine-row-actions-v215"><button type="button" className={item.da_duyet?"cine-btn cine-btn-secondary":"cine-btn cine-btn-success"} onClick={()=>doiDuyetDanhGia(item,!item.da_duyet)} disabled={dang_xu_ly===`dg-${item.id}`}>{item.da_duyet?"Ẩn":"Duyệt"}</button><button type="button" className="cine-btn cine-btn-danger-outline" onClick={()=>xoaDanhGia(item)} disabled={dang_xu_ly===`dg-${item.id}`}>Xóa</button></div>
      </article>)}{danhGiaDaLoc.length===0&&<div className="cine-card cine-dashboard-empty">Không có đánh giá phù hợp.</div>}</div>
    </section>}

    {tab === "bao-cao" && <section className="cine-admin-operations cine-report-admin-v215">
      <div className="cine-operations-heading"><div><h2>Xuất báo cáo</h2><p>Hỗ trợ Excel (.xlsx) và CSV UTF-8: đơn hàng, doanh thu đã ghi nhận và tồn kho.</p></div></div>
      <div className="cine-card cine-report-period-v215"><label><span>Từ ngày</span><input type="date" value={bao_cao_tu_ngay} onChange={e=>setBaoCaoTuNgay(e.target.value)}/></label><label><span>Đến ngày</span><input type="date" value={bao_cao_den_ngay} onChange={e=>setBaoCaoDenNgay(e.target.value)}/></label></div>
      <div className="cine-report-grid-v215">
        <article className="cine-card"><h3>Đơn hàng</h3><p>Ngày, mã đơn, người nhận, địa chỉ, trạng thái và tổng tiền.</p><div className="cine-report-actions-v2152"><button type="button" className="cine-btn cine-btn-primary" onClick={()=>taiBaoCaoExcel("don-hang")} disabled={dang_xu_ly==="bao-cao-excel-don-hang"}>Xuất Excel</button><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>taiBaoCao("don-hang")} disabled={dang_xu_ly==="bao-cao-don-hang"}>Xuất CSV</button></div></article>
        <article className="cine-card"><h3>Doanh thu</h3><p>Tổng hợp theo ngày ghi nhận: non-COD đã thanh toán tính ngay; COD tính khi đã giao/hoàn tất.</p><div className="cine-report-actions-v2152"><button type="button" className="cine-btn cine-btn-primary" onClick={()=>taiBaoCaoExcel("doanh-thu")} disabled={dang_xu_ly==="bao-cao-excel-doanh-thu"}>Xuất Excel</button><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>taiBaoCao("doanh-thu")} disabled={dang_xu_ly==="bao-cao-doanh-thu"}>Xuất CSV</button></div></article>
        <article className="cine-card"><h3>Tồn kho</h3><p>Snapshot hiện tại của toàn bộ biến thể, vật liệu, màu và số lượng.</p><div className="cine-report-actions-v2152"><button type="button" className="cine-btn cine-btn-primary" onClick={()=>taiBaoCaoExcel("ton-kho")} disabled={dang_xu_ly==="bao-cao-excel-ton-kho"}>Xuất Excel</button><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>taiBaoCao("ton-kho")} disabled={dang_xu_ly==="bao-cao-ton-kho"}>Xuất CSV</button></div></article>
      </div>
    </section>}

    {tab === "nhat-ky" && <section className="cine-admin-operations cine-commerce-admin-v212">
      <div className="cine-operations-heading"><div><h2>Nhật ký thao tác Admin</h2><p>Cursor pagination cho dữ liệu lớn, vẫn giữ lọc phía server và xuất CSV/Excel để đối soát.</p></div><span className="cine-admin-count">{nhat_ky.length} sự kiện đã tải</span></div>
      <div className="cine-card cine-admin-filterbar-v212 cine-audit-filter-v300 cine-audit-filter-v320">
        <label><span>Tìm trong nhật ký</span><input value={nhat_ky_tim_kiem} onChange={e => setNhatKyTimKiem(e.target.value)} placeholder="Admin, email, IP, nội dung..."/></label>
        <label><span>Loại sự kiện</span><input value={nhat_ky_loai} onChange={e => setNhatKyLoai(e.target.value.toUpperCase())} placeholder="VD: ADMIN_CAP_NHAT_SAN_PHAM"/></label>
        <label><span>Người thao tác</span><select value={nhat_ky_nguoi_dung_id} onChange={e => setNhatKyNguoiDungId(e.target.value)}><option value="">Tất cả</option>{nguoi_dung.map(u => <option key={u.id} value={u.id}>{u.ho_ten} · {u.thu_dien_tu}</option>)}</select></label>
        <label><span>Từ ngày</span><input type="date" value={nhat_ky_tu_ngay} onChange={e => setNhatKyTuNgay(e.target.value)}/></label>
        <label><span>Đến ngày</span><input type="date" value={nhat_ky_den_ngay} onChange={e => setNhatKyDenNgay(e.target.value)}/></label>
        <button type="button" className="cine-btn cine-btn-primary" onClick={()=>taiNhatKyBoLoc(true)} disabled={dang_xu_ly === "loc-nhat-ky"}>{dang_xu_ly === "loc-nhat-ky" ? "Đang lọc…" : "Lọc nhật ký"}</button>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={taiNhatKyExcel} disabled={dang_xu_ly === "xuat-nhat-ky-excel"}>{dang_xu_ly === "xuat-nhat-ky-excel" ? "Đang xuất…" : "Xuất Excel"}</button>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={taiNhatKyCsv} disabled={dang_xu_ly === "xuat-nhat-ky"}>{dang_xu_ly === "xuat-nhat-ky" ? "Đang xuất…" : "Xuất CSV"}</button>
      </div>
      <div className="cine-card cine-audit-list-v212 cine-audit-list-v320">{nhatKyDaLoc.map(item => {
        const thayDoi = layThayDoiAudit(item.chi_tiet);
        return <article className="cine-audit-row-v212 cine-audit-row-v320" key={item.id}><i/><div><b>{nhanSuKienAudit(item.loai_su_kien)}</b><span>{item.nguoi_thuc_hien?.ho_ten || "Admin/hệ thống"} · {item.dia_chi_ip || "IP không ghi nhận"} · {new Date(item.ngay_tao).toLocaleString("vi-VN")}</span>{Object.keys(thayDoi).length > 0 ? <div className="cine-audit-diff-v320">{Object.entries(thayDoi).map(([key, value]) => <div key={key}><strong>{key.replaceAll("_", " ")}</strong><span>{dinhDangGiaTriAudit(value.truoc)}</span><em>→</em><span>{dinhDangGiaTriAudit(value.sau)}</span></div>)}</div> : <code>{JSON.stringify(item.chi_tiet)}</code>}</div></article>;
      })}{nhatKyDaLoc.length === 0 && <div className="cine-dashboard-empty">Không có sự kiện phù hợp.</div>}</div>
      <div className="cine-pagination-v320 cine-cursor-pagination-v340"><span>Đã tải <b>{nhat_ky.length}</b> sự kiện · cursor ổn định khi dữ liệu tiếp tục phát sinh.</span>{nhat_ky_cursor.co_them ? <button type="button" className="cine-btn cine-btn-secondary" disabled={dang_xu_ly === "loc-nhat-ky"} onClick={()=>taiNhatKyBoLoc(false)}>{dang_xu_ly === "loc-nhat-ky" ? "Đang tải…" : "Tải thêm sự kiện"}</button> : <small>Đã đến cuối danh sách.</small>}</div>
    </section>}

    {tab === "he-thong" && <section className="cine-admin-operations cine-system-admin-v310">
      <div className="cine-operations-heading"><div><h2>Sức khỏe hệ thống & vận hành</h2><p>v3.4.1 giữ bộ tính năng vận hành v3.4 và vá Runtime E2E cho cookie Secure khi CI gọi API loopback HTTP.</p></div><div className="cine-system-heading-actions-v310"><span className={`status-badge ${suc_khoe_he_thong?.trang_thai === "TOT" ? "active" : "locked"}`}>{suc_khoe_he_thong?.trang_thai === "TOT" ? "Hệ thống tốt" : suc_khoe_he_thong?.trang_thai === "LOI" ? "Có lỗi" : "Cần chú ý"}</span><button type="button" className="cine-btn cine-btn-primary" onClick={taiSucKhoeHeThong} disabled={dang_xu_ly === "suc-khoe-he-thong"}>{dang_xu_ly === "suc-khoe-he-thong" ? "Đang kiểm tra…" : "Kiểm tra lại"}</button></div></div>
      {suc_khoe_he_thong ? <>
        <div className="cine-system-grid-v310 cine-system-grid-v320">
          <article className="cine-card"><span>API</span><b>v{suc_khoe_he_thong.phien_ban}</b><p>Node {suc_khoe_he_thong.api.node} · uptime {Math.floor(suc_khoe_he_thong.api.uptime_giay / 3600)} giờ</p><small>RAM RSS {dinhDangDungLuong(suc_khoe_he_thong.api.rss_bytes)} · Heap {dinhDangDungLuong(suc_khoe_he_thong.api.heap_used_bytes)}</small></article>
          <article className="cine-card"><span>PostgreSQL</span><b>{suc_khoe_he_thong.database.ket_noi ? "Đã kết nối" : "Mất kết nối"}</b><p>Độ trễ {suc_khoe_he_thong.database.do_tre_ms ?? "—"} ms · DB {dinhDangDungLuong(suc_khoe_he_thong.database.dung_luong_bytes || 0)}</p><small>Migration: {suc_khoe_he_thong.database.migration_gan_nhat?.ten || "Chưa đọc được"}</small></article>
          <article className="cine-card"><span>SMTP</span><b>{!suc_khoe_he_thong.smtp.bat ? "Đang tắt" : suc_khoe_he_thong.smtp.san_sang ? "Sẵn sàng" : "Cấu hình lỗi"}</b><p>{suc_khoe_he_thong.smtp.host ? `${suc_khoe_he_thong.smtp.host}:${suc_khoe_he_thong.smtp.port}` : "MAIL_ENABLED=false"}</p><small>{suc_khoe_he_thong.smtp.from}</small></article>
          <article className="cine-card"><span>Backup PostgreSQL</span><b>{suc_khoe_he_thong.backup.gan_nhat ? `${suc_khoe_he_thong.backup.gan_nhat.tuoi_gio} giờ trước` : "Chưa có backup"}</b><p>{suc_khoe_he_thong.backup.so_daily} daily · {suc_khoe_he_thong.backup.so_weekly} weekly</p><small>{suc_khoe_he_thong.backup.so_ban_sao} file · {dinhDangDungLuong(suc_khoe_he_thong.backup.tong_dung_luong_bytes)}</small></article>
          <article className="cine-card"><span>Cảnh báo tồn kho</span><b>{suc_khoe_he_thong.canh_bao_kho.bat ? "Đang bật" : "Đang tắt"}</b><p>Chu kỳ {suc_khoe_he_thong.canh_bao_kho.chu_ky_phut} phút</p><small>Email chỉ gửi lại khi trạng thái cảnh báo thay đổi.</small></article>
          <article className="cine-card cine-system-alert-card-v320"><span>Cảnh báo vận hành</span><b>{suc_khoe_he_thong.canh_bao_he_thong.bat ? "Đang bật" : "Đang tắt"}</b><p>Chu kỳ {suc_khoe_he_thong.canh_bao_he_thong.chu_ky_phut} phút · backup quá {suc_khoe_he_thong.canh_bao_he_thong.backup_qua_han_gio} giờ sẽ cảnh báo</p><small>Nguồn: {suc_khoe_he_thong.canh_bao_he_thong.nguon_cau_hinh || "ENV"} · Im lặng {suc_khoe_he_thong.canh_bao_he_thong.im_lang_phut} phút · escalation {suc_khoe_he_thong.canh_bao_he_thong.leo_thang_phut} phút.</small><button type="button" className="cine-btn cine-btn-secondary" onClick={guiCanhBaoHeThongNgay} disabled={dang_xu_ly === "gui-canh-bao-he-thong"}>{dang_xu_ly === "gui-canh-bao-he-thong" ? "Đang kiểm tra…" : "Kiểm tra & gửi ngay"}</button></article>
        </div>

        <div className="cine-card cine-system-config-v340">
          <div className="cine-ops-history-head-v320"><div><h3>Cấu hình cảnh báo vận hành</h3><p>Lưu vào database, áp dụng lại timer ngay và ghi audit before/after. `.env` vẫn là fallback khi chưa có cấu hình runtime.</p></div><span className="cine-admin-count">{cau_hinh_canh_bao_he_thong.nguon_cau_hinh}</span></div>
          <div className="cine-system-config-grid-v340">
            <label className="cine-toggle-field-v340"><span>Bật cảnh báo</span><input type="checkbox" checked={cau_hinh_canh_bao_he_thong.bat} onChange={e=>setCauHinhCanhBaoHeThong(x=>({...x,bat:e.target.checked}))}/><b>{cau_hinh_canh_bao_he_thong.bat ? "Đang bật" : "Đang tắt"}</b></label>
            <label><span>Chu kỳ kiểm tra (phút)</span><input type="number" min="15" max="1440" value={cau_hinh_canh_bao_he_thong.chu_ky_phut} onChange={e=>setCauHinhCanhBaoHeThong(x=>({...x,chu_ky_phut:Number(e.target.value)}))}/></label>
            <label><span>Backup quá hạn (giờ)</span><input type="number" min="6" max="720" value={cau_hinh_canh_bao_he_thong.backup_qua_han_gio} onChange={e=>setCauHinhCanhBaoHeThong(x=>({...x,backup_qua_han_gio:Number(e.target.value)}))}/></label>
            <label><span>Silence (phút)</span><input type="number" min="15" max="10080" value={cau_hinh_canh_bao_he_thong.im_lang_phut} onChange={e=>setCauHinhCanhBaoHeThong(x=>({...x,im_lang_phut:Number(e.target.value)}))}/></label>
            <label><span>Escalation (phút)</span><input type="number" min="60" max="43200" value={cau_hinh_canh_bao_he_thong.leo_thang_phut} onChange={e=>setCauHinhCanhBaoHeThong(x=>({...x,leo_thang_phut:Number(e.target.value)}))}/></label>
            <label className="cine-system-recipients-v340"><span>Người nhận email</span><input value={cau_hinh_canh_bao_he_thong.nguoi_nhan} onChange={e=>setCauHinhCanhBaoHeThong(x=>({...x,nguoi_nhan:e.target.value}))} placeholder="ops@example.com, admin@example.com"/><small>Phân cách nhiều địa chỉ bằng dấu phẩy.</small></label>
          </div>
          <div className="cine-system-config-actions-v340"><small>{cau_hinh_canh_bao_he_thong.ngay_cap_nhat ? `Cập nhật gần nhất: ${new Date(cau_hinh_canh_bao_he_thong.ngay_cap_nhat).toLocaleString("vi-VN")}` : "Chưa có cấu hình lưu trong database."}</small><button type="button" className="cine-btn cine-btn-primary" onClick={luuCauHinhCanhBaoHeThong} disabled={dang_xu_ly === "luu-cau-hinh-canh-bao-he-thong"}>{dang_xu_ly === "luu-cau-hinh-canh-bao-he-thong" ? "Đang lưu…" : "Lưu & áp dụng"}</button></div>
        </div>

        {thong_ke_van_hanh && <div className="cine-ops-stats-v330">
          {[thong_ke_van_hanh.bay_ngay, thong_ke_van_hanh.ba_muoi_ngay].map(ky => <article key={ky.so_ngay} className="cine-card"><div><span>{ky.so_ngay} ngày gần nhất</span><b>Health {ky.health.ty_le_tot == null ? "—" : `${ky.health.ty_le_tot}%`} tốt</b></div><p>Health: {ky.health.tot}/{ky.health.tong} tốt · {ky.health.loi} lỗi · {ky.health.canh_bao} cảnh báo</p><p>Backup: {ky.backup.thanh_cong}/{ky.backup.tong} thành công ({ky.backup.ty_le_thanh_cong == null ? "—" : `${ky.backup.ty_le_thanh_cong}%`})</p><small>Restore {ky.restore.thanh_cong}/{ky.restore.tong} · {ky.canh_bao_email} email cảnh báo</small></article>)}
        </div>}

        {sla_van_hanh && <div className="cine-card cine-sla-v340">
          <div className="cine-ops-history-head-v320"><div><h3>SLA / Uptime theo ngày</h3><p>SLA = tỷ lệ HEALTH ở trạng thái TỐT; uptime = tỷ lệ HEALTH không ở trạng thái LỖI.</p></div><div className="cine-sla-actions-v340"><button type="button" className={`cine-btn ${sla_so_ngay===30?"cine-btn-primary":"cine-btn-secondary"}`} onClick={()=>void taiSlaVanHanh(30)} disabled={dang_xu_ly === "sla-van-hanh"}>30 ngày</button><button type="button" className={`cine-btn ${sla_so_ngay===90?"cine-btn-primary":"cine-btn-secondary"}`} onClick={()=>void taiSlaVanHanh(90)} disabled={dang_xu_ly === "sla-van-hanh"}>90 ngày</button></div></div>
          <div className="cine-sla-summary-v340"><article><span>SLA</span><b>{sla_van_hanh.tong_quan.sla_percent == null ? "—" : `${sla_van_hanh.tong_quan.sla_percent}%`}</b><small>{sla_van_hanh.tong_quan.tot}/{sla_van_hanh.tong_quan.tong} mẫu tốt</small></article><article><span>Uptime</span><b>{sla_van_hanh.tong_quan.uptime_percent == null ? "—" : `${sla_van_hanh.tong_quan.uptime_percent}%`}</b><small>{sla_van_hanh.tong_quan.loi} mẫu lỗi</small></article><article><span>Mẫu HEALTH</span><b>{sla_van_hanh.tong_quan.tong}</b><small>{sla_van_hanh.so_ngay} ngày</small></article></div>
          <div className="cine-sla-chart-v340" aria-label={`Biểu đồ uptime ${sla_van_hanh.so_ngay} ngày`}>{sla_van_hanh.theo_ngay.map(item=><span key={item.ngay} style={{height:`${Math.max(4,item.uptime_percent ?? 4)}%`}} title={`${item.ngay}: uptime ${item.uptime_percent ?? "—"}% · SLA ${item.sla_percent ?? "—"}%`}/>)}</div>
          <div className="cine-sla-legend-v340"><span>{new Date(sla_van_hanh.tu_ngay).toLocaleDateString("vi-VN")}</span><span>{sla_van_hanh.so_ngay} ngày</span><span>{new Date(sla_van_hanh.tao_luc).toLocaleDateString("vi-VN")}</span></div>
        </div>}

        <div className="cine-card cine-incidents-v340">
          <div className="cine-ops-history-head-v320"><div><h3>Chuỗi sự cố theo chữ ký</h3><p>Các HEALTH/ALERT có cùng tập vấn đề được gom thành một incident để xem timeline và thời lượng.</p></div><span>{su_co_van_hanh.length} chuỗi gần nhất</span></div>
          <div className="cine-incidents-layout-v340">
            <div className="cine-incident-list-v340">{su_co_van_hanh.map(item=><button type="button" key={item.chu_ky} className={`cine-incident-item-v340 ${su_co_chon?.chu_ky===item.chu_ky?"selected":""}`} onClick={()=>void moChiTietSuCo(item.chu_ky)} disabled={dang_xu_ly===`su-co-${item.chu_ky}`}><span className={`status-badge ${item.trang_thai_gan_nhat==="TOT"?"active":"locked"}`}>{item.trang_thai_gan_nhat.replaceAll("_"," ")}</span><b>{item.van_de.join(" · ") || "Không có mô tả"}</b><small>#{item.chu_ky.slice(0,12)} · {item.so_su_kien} sự kiện · {item.thoi_luong_phut} phút</small><em>{new Date(item.gan_nhat).toLocaleString("vi-VN")}</em></button>)}{su_co_van_hanh.length===0&&<div className="cine-dashboard-empty">Chưa ghi nhận chuỗi sự cố có chữ ký.</div>}</div>
            <div className="cine-incident-detail-v340">{su_co_chon ? <><div><b>Incident #{su_co_chon.chu_ky.slice(0,16)}</b><button type="button" className="cine-btn cine-btn-secondary" onClick={()=>setSuCoChon(null)}>Đóng</button></div><p>{su_co_chon.van_de.join(" · ") || "Không có mô tả vấn đề."}</p><small>{new Date(su_co_chon.bat_dau).toLocaleString("vi-VN")} → {new Date(su_co_chon.gan_nhat).toLocaleString("vi-VN")} · {su_co_chon.thoi_luong_phut} phút</small><div className="cine-incident-timeline-v340">{su_co_chon.su_kien.map(item=><article key={item.id}><i/><div><b>{item.loai} · {item.trang_thai.replaceAll("_"," ")}</b><span>{new Date(item.ngay_tao).toLocaleString("vi-VN")}</span><small>{item.mo_ta || JSON.stringify(item.chi_tiet)}</small></div></article>)}</div></> : <div className="cine-dashboard-empty">Chọn một chuỗi sự cố để xem timeline.</div>}</div>
          </div>
        </div>

        <div className="cine-card cine-backup-ops-v310"><div><h3>Backup tự động trên Windows</h3><p>Daily backup có SHA-256, mỗi Chủ nhật giữ thêm weekly snapshot. Mặc định giữ daily 14 ngày và weekly 8 tuần. Backup/restore được ghi vào lịch sử vận hành PostgreSQL.</p></div><div className="cine-backup-command-v310"><code>{String.raw`\.\scripts\backup-db.ps1`}</code><code>{String.raw`\.\scripts\backup-schedule.ps1 -At 02:00`}</code><code>{String.raw`\.\scripts\backup-verify.ps1`}</code><code>{String.raw`\.\scripts\restore-db.ps1 -File .\backups\<ten-file>.dump -XacNhan`}</code></div></div>
        <div className="cine-card cine-ops-history-v320">
          <div className="cine-ops-history-head-v320"><div><h3>Lịch sử vận hành</h3><p>Cursor pagination phù hợp lịch sử hàng trăm nghìn bản ghi mà không trượt trang khi có sự kiện mới.</p></div><div className="cine-ops-history-actions-v330"><span>{lich_su_van_hanh.length} bản ghi đã tải</span><button type="button" className="cine-btn cine-btn-secondary" onClick={taiLichSuVanHanhExcel} disabled={dang_xu_ly === "xuat-van-hanh-excel"}>{dang_xu_ly === "xuat-van-hanh-excel" ? "Đang xuất…" : "Xuất Excel"}</button></div></div>
          <div className="cine-ops-filter-v320"><label><span>Loại</span><select value={van_hanh_loai} onChange={e=>setVanHanhLoai(e.target.value)}><option value="">Tất cả</option><option value="HEALTH">Health</option><option value="BACKUP">Backup</option><option value="RESTORE">Restore</option><option value="ALERT">Cảnh báo</option></select></label><label><span>Trạng thái</span><select value={van_hanh_trang_thai} onChange={e=>setVanHanhTrangThai(e.target.value)}><option value="">Tất cả</option><option value="TOT">Tốt</option><option value="CANH_BAO">Cảnh báo</option><option value="LOI">Lỗi</option><option value="THANH_CONG">Thành công</option><option value="THAT_BAI">Thất bại</option></select></label><button type="button" className="cine-btn cine-btn-primary" onClick={()=>void taiLichSuVanHanh(true)}>Lọc lịch sử</button></div>
          <div className="cine-ops-list-v320">{lich_su_van_hanh.map(item=><article key={item.id}><span className={`status-badge ${["TOT","THANH_CONG"].includes(item.trang_thai)?"active":"locked"}`}>{item.trang_thai.replaceAll("_"," ")}</span><div><b>{item.loai} · {item.mo_ta || "Sự kiện vận hành"}</b><small>{new Date(item.ngay_tao).toLocaleString("vi-VN")}{item.chu_ky_canh_bao ? ` · #${item.chu_ky_canh_bao.slice(0,12)}` : ""}</small><code>{JSON.stringify(item.chi_tiet)}</code>{item.chu_ky_canh_bao&&<button type="button" className="cine-link-button-v340" onClick={()=>void moChiTietSuCo(item.chu_ky_canh_bao!)}>Xem chuỗi sự cố →</button>}</div></article>)}{lich_su_van_hanh.length===0&&<div className="cine-dashboard-empty">Chưa có lịch sử vận hành phù hợp.</div>}</div>
          <div className="cine-pagination-v320 cine-cursor-pagination-v340"><span>Đã tải <b>{lich_su_van_hanh.length}</b> bản ghi.</span>{van_hanh_cursor.co_them ? <button type="button" className="cine-btn cine-btn-secondary" onClick={()=>void taiLichSuVanHanh(false)}>Tải thêm lịch sử</button> : <small>Đã đến cuối danh sách.</small>}</div>
        </div>
      </> : <div className="cine-card cine-dashboard-empty">Chưa tải được trạng thái hệ thống.</div>}
    </section>}

    {tab === "khach-hang" && <section className="cine-card cine-admin-section">
      <div className="cine-section-heading"><div><h2>Tài khoản khách hàng</h2><p>Khách hàng được quản lý riêng với nhân viên. Admin có thể sửa họ tên, email, số điện thoại, địa chỉ, khóa/kích hoạt hoặc xóa tài khoản.</p></div><span>{khachHang.length} khách hàng</span></div>
      <div className="cine-customer-list">
        {khachHang.map(u => <article key={u.id} className="cine-customer-card">
          <div className="cine-customer-card-head">
            <div><b>{u.ho_ten}</b><span>{u.thu_dien_tu}</span></div>
            <span className={u.da_kich_hoat ? "status-badge active" : "status-badge locked"}>{u.da_kich_hoat ? "Đang hoạt động" : "Đã khóa"}</span>
          </div>
          <div className="cine-customer-form-grid">
            <label><span>Họ và tên</span><input value={u.ho_ten} onChange={e => suaKhachHangLocal(u.id, { ho_ten: e.target.value })}/></label>
            <label><span>Email đăng nhập</span><input type="email" value={u.thu_dien_tu} onChange={e => suaKhachHangLocal(u.id, { thu_dien_tu: e.target.value })}/></label>
            <label><span>Số điện thoại</span><input value={u.so_dien_thoai || ""} onChange={e => suaKhachHangLocal(u.id, { so_dien_thoai: e.target.value })}/></label>
            <label className="cine-customer-address"><span>Địa chỉ mặc định</span><input value={u.dia_chi_mac_dinh || ""} onChange={e => suaKhachHangLocal(u.id, { dia_chi_mac_dinh: e.target.value })}/></label>
          </div>
          <div className="cine-customer-actions">
            <button type="button" className="cine-btn cine-btn-primary" onClick={() => luuKhachHang(u)} disabled={dang_xu_ly === `kh-${u.id}`}>{dang_xu_ly === `kh-${u.id}` ? "Đang lưu…" : "Lưu thông tin"}</button>
            <button type="button" className={`cine-btn ${u.da_kich_hoat ? "cine-btn-danger" : "cine-btn-success"}`} onClick={() => doiTrangThai(u)} disabled={dang_xu_ly === u.id}>{dang_xu_ly === u.id ? "Đang xử lý…" : u.da_kich_hoat ? "Khóa" : "Kích hoạt"}</button>
            <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaTaiKhoan(u)} disabled={dang_xu_ly === u.id}>Xóa</button>
          </div>
        </article>)}
        {khachHang.length === 0 && <div className="cine-empty-state">Chưa có tài khoản khách hàng.</div>}
      </div>
    </section>}

    {tab === "nhan-vien" && <section className="cine-card cine-admin-section">
      <div className="cine-section-heading"><div><h2>Hồ sơ nhân viên bán hàng</h2><p>Admin quản lý trạng thái làm việc. Chức danh và bộ phận được chuẩn hóa cố định cho toàn bộ nhân viên bán hàng.</p></div><span>{nhan_vien.length} nhân viên</span></div>
      <div className="cine-staff-list cine-staff-list-v295">{nhan_vien.map(n => <article key={n.id} className="cine-staff-card cine-staff-card-v295">
        <div className="cine-staff-title"><b>{n.ma_nhan_vien} · {n.nguoi_dung.ho_ten}</b><span>{n.nguoi_dung.thu_dien_tu}</span><small>{n.nguoi_dung.so_dien_thoai || "Chưa có số điện thoại"}</small></div>
        <div className="cine-staff-static"><span>Chức danh</span><b>Nhân viên bán hàng</b></div>
        <div className="cine-staff-static"><span>Bộ phận</span><b>Bán hàng</b></div>
        <label className="cine-staff-status"><span>Trạng thái</span><select value={n.trang_thai} onChange={e => suaNhanVienLocal(n.id, { trang_thai: e.target.value })}><option value="DANG_LAM">Đang làm</option><option value="TAM_NGHI">Tạm nghỉ</option><option value="NGHI_VIEC">Nghỉ việc</option></select></label>
        <div className="cine-staff-row-actions">
          <button type="button" className="cine-btn cine-btn-secondary" onClick={() => luuNhanVien(n)} disabled={dang_xu_ly === `nv-${n.id}`}>{dang_xu_ly === `nv-${n.id}` ? "Đang lưu…" : "Lưu trạng thái"}</button>
          <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaTaiKhoan(n.nguoi_dung)} disabled={dang_xu_ly === n.nguoi_dung.id}>Xóa tài khoản</button>
        </div>
      </article>)}</div>
      <div className="cine-staff-status-note">Đang làm: tài khoản được kích hoạt. Tạm nghỉ/Nghỉ việc: tài khoản bị khóa và các phiên đăng nhập đang mở được thu hồi.</div>
    </section>}

    {tab === "tao-nhan-vien" && <section className="cine-admin-operations cine-staff-create-section">
      <div className="cine-operations-heading">
        <div><p className="cine-admin-kicker">STAFF · SALES</p><h2>Tạo nhân viên bán hàng</h2><p>Bố cục form theo CineBooking Pro. Admin là người quản lý toàn bộ nghiệp vụ quản trị hệ thống.</p></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("nhan-vien")}>Xem hồ sơ nhân sự</button>
      </div>
      <div className="cine-staff-create-layout">
        <form className="cine-card cine-staff-create-form" onSubmit={taoNV}>
          <div className="cine-form-card-heading"><h3>Thông tin nhân viên</h3><p>Tài khoản được kích hoạt ngay sau khi tạo.</p></div>
          <div className="cine-form-row">
            <label><span>Mã nhân viên</span><input placeholder="N3D-NV-011" value={nv.ma_nhan_vien} onChange={e => setNv({...nv, ma_nhan_vien:e.target.value})} required/></label>
            <label><span>Ngày vào làm</span><input type="date" value={nv.ngay_vao_lam} onChange={e => setNv({...nv, ngay_vao_lam:e.target.value})} required/></label>
          </div>
          <label><span>Họ và tên</span><input placeholder="Nguyễn Văn A" value={nv.ho_ten} onChange={e => setNv({...nv, ho_ten:e.target.value})} required/></label>
          <label><span>Email đăng nhập</span><input placeholder="nhanvien@example.com" type="email" value={nv.thu_dien_tu} onChange={e => setNv({...nv, thu_dien_tu:e.target.value})} required/></label>
          <label><span>Số điện thoại</span><input placeholder="09xxxxxxxx" value={nv.so_dien_thoai} onChange={e => setNv({...nv, so_dien_thoai:e.target.value})}/></label>
          <TruongMatKhau nhan="Mật khẩu ban đầu" gia_tri={nv.mat_khau} datGiaTri={mat_khau => setNv({...nv, mat_khau})} autoComplete="new-password" hien_do_manh/>
          <TruongMatKhau nhan="Xác nhận mật khẩu" gia_tri={nv.xac_nhan_mat_khau} datGiaTri={xac_nhan_mat_khau => setNv({...nv, xac_nhan_mat_khau})} autoComplete="new-password"/>
          <div className="cine-fixed-role-card"><span>Vai trò & hồ sơ cố định</span><b>Nhân viên bán hàng</b><small>Vai trò hệ thống: NHAN_VIEN · Bộ phận: Bán hàng</small></div>
          <button className="cine-btn cine-btn-primary cine-btn-block" type="submit" disabled={dang_xu_ly === "tao-nhan-vien"}>{dang_xu_ly === "tao-nhan-vien" ? "Đang tạo…" : "Tạo nhân viên bán hàng"}</button>
        </form>
      </div>
    </section>}

    {tab === "ca-lam" && <section className="cine-admin-operations">
      <div className="cine-operations-heading">
        <div><h2>Ca làm việc</h2><p>Tạo mẫu ca gọn như CineBooking Pro rồi dùng lại khi xếp lịch.</p></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("xep-ca")}>Mở Xếp ca →</button>
      </div>
      <div className="cine-shift-management-grid">
        <form className="cine-card cine-shift-editor" onSubmit={luuCa}>
          <div className="cine-shift-editor-title"><div><h3>{ca_dang_sua_id ? "Chỉnh sửa ca" : "Tạo ca mới"}</h3><p>{ca_dang_sua_id ? "Thay đổi mã, tên, giờ làm hoặc màu hiển thị." : "Mặc định bắt đầu theo khung ca sáng 06:00–14:00."}</p></div><span>{ca.gio_bat_dau}–{ca.gio_ket_thuc}</span></div>
          <label><span>Mã ca</span><input placeholder="VD: CA01" value={ca.ma_ca} onChange={e => setCa({...ca, ma_ca:e.target.value})} required/></label>
          <label><span>Tên ca</span><input placeholder="Ca sáng" value={ca.ten_ca} onChange={e => setCa({...ca, ten_ca:e.target.value})} required/></label>
          <div className="cine-time-grid"><label><span>Bắt đầu</span><input type="time" value={ca.gio_bat_dau} onChange={e => setCa({...ca, gio_bat_dau:e.target.value})} required/></label><label><span>Kết thúc</span><input type="time" value={ca.gio_ket_thuc} onChange={e => setCa({...ca, gio_ket_thuc:e.target.value})} required/></label></div>
          <label className="cine-color-field"><span>Màu lịch</span><div><input type="color" value={ca.mau_hien_thi} onChange={e => setCa({...ca, mau_hien_thi:e.target.value})}/><code>{ca.mau_hien_thi.toUpperCase()}</code></div></label>
          <div className="cine-shift-help">Ca mặc định của hệ thống: Ca sáng 06:00–14:00 và Ca chiều 14:00–22:00. Admin có thể chỉnh sửa hoặc xóa.</div>
          <div className="cine-shift-form-actions">
            <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-ca" || (ca_dang_sua_id ? dang_xu_ly === `ca-${ca_dang_sua_id}` : false)}>{ca_dang_sua_id ? "Lưu thay đổi" : "Tạo ca"}</button>
            {ca_dang_sua_id && <button type="button" className="cine-btn cine-btn-secondary" onClick={datLaiFormCa}>Hủy chỉnh sửa</button>}
          </div>
        </form>

        <div className="cine-shift-board">
          <div className="cine-card cine-shift-board-head"><div><span>Mẫu ca hiện có</span><b>{ca_lam.length} ca</b></div><small>Có thể sửa cả ca đã phân công; lịch đã xếp sẽ dùng ngay tên/giờ/màu mới. Xóa mẫu ca sẽ xóa luôn các phân ca liên quan.</small></div>
          {ca_lam.length === 0 && <div className="cine-card cine-empty-state">Chưa có mẫu ca làm việc.</div>}
          <div className="cine-shift-template-list cine-shift-template-list-v293">{ca_lam.map(c => <article key={c.id} className={`cine-card cine-shift-template-v293 ${ca_dang_sua_id === c.id ? "is-editing" : ""}`}>
            <i style={{background:c.mau_hien_thi || "#22C55E"}}/>
            <div className="cine-shift-template-main"><div><b>{c.ma_ca}</b><span>{c.ten_ca}</span></div><strong>{c.gio_bat_dau}–{c.gio_ket_thuc}</strong></div>
            <div className="cine-shift-template-meta"><span className={`status-badge ${c.dang_hoat_dong ? "active" : "locked"}`}>{c.dang_hoat_dong ? "Đang dùng" : "Ngừng dùng"}</span><small>{soPhanCaCuaCa.get(c.id) || 0} phân công</small></div>
            <div className="cine-shift-template-actions">
              <button type="button" className="cine-btn cine-btn-secondary" onClick={() => batDauSuaCa(c)} disabled={dang_xu_ly === `ca-${c.id}`}>Chỉnh sửa</button>
              <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => xoaCa(c)} disabled={dang_xu_ly === `ca-${c.id}`}>{dang_xu_ly === `ca-${c.id}` ? "Đang xử lý…" : "Xóa"}</button>
            </div>
          </article>)}</div>
        </div>
      </div>
    </section>}

    {tab === "xep-ca" && <section className="cine-admin-operations">
      <div className="cine-operations-heading">
        <div><h2>Xếp ca nhân viên</h2><p>Bố cục theo CineBooking Pro: form xếp ca bên trái, lịch theo ngày bên phải.</p></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("ca-lam")}>Quản lý mẫu ca</button>
      </div>
      <div className="cine-shift-management-grid">
        <form className="cine-card cine-shift-editor" onSubmit={luuPhanCa}>
          <div className="cine-shift-editor-title"><div><h3>{pc_dang_sua_id ? "Chỉnh sửa phân ca" : "Xếp ca mới"}</h3><p>{pc_dang_sua_id ? "Có thể đổi nhân viên, ngày làm, mẫu ca và ghi chú của phân công đã tạo." : "Chọn nhân viên, ngày làm và mẫu ca."}</p></div></div>
          <label><span>Nhân viên</span><select value={pc.nhan_vien_id} onChange={e => setPc({...pc, nhan_vien_id:e.target.value})} required><option value="">Chọn nhân viên</option>{nhan_vien.filter(n => (n.nguoi_dung.da_kich_hoat && n.trang_thai === "DANG_LAM") || n.id === pc.nhan_vien_id).map(n => <option key={n.id} value={n.id}>{n.ma_nhan_vien} · {n.nguoi_dung.ho_ten} · {n.bo_phan}</option>)}</select></label>
          <label><span>Ngày làm</span><input type="date" value={pc.ngay_lam} onChange={e => setPc({...pc, ngay_lam:e.target.value})} required/></label>
          <label><span>Ca làm</span><select value={pc.ca_lam_viec_id} onChange={e => setPc({...pc, ca_lam_viec_id:e.target.value})} required><option value="">Chọn ca</option>{ca_lam.filter(c => c.dang_hoat_dong || c.id === pc.ca_lam_viec_id).map(c => <option key={c.id} value={c.id}>{c.ma_ca} · {c.ten_ca} · {c.gio_bat_dau}–{c.gio_ket_thuc}</option>)}</select></label>
          <label><span>Ghi chú</span><textarea value={pc.ghi_chu} onChange={e => setPc({...pc, ghi_chu:e.target.value})} placeholder="Khu vực làm việc, công việc ưu tiên..."/></label>
          <div className="cine-shift-help">Một nhân viên không thể nhận trùng cùng một mẫu ca trong cùng ngày. Tài khoản đã khóa không xuất hiện trong danh sách xếp ca.</div>
          <div className="cine-shift-form-actions">
            <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-phan-ca" || (pc_dang_sua_id ? dang_xu_ly === `pc-${pc_dang_sua_id}` : false)}>{pc_dang_sua_id ? "Lưu thay đổi" : "Xếp ca"}</button>
            {pc_dang_sua_id && <button type="button" className="cine-btn cine-btn-secondary" onClick={datLaiFormPhanCa}>Hủy chỉnh sửa</button>}
          </div>
        </form>

        <div className="cine-shift-board">
          <div className="cine-card cine-schedule-filter">
            <label><span>Từ ngày</span><input type="date" value={tu_ngay} onChange={e => setTuNgay(e.target.value)}/></label>
            <label><span>Đến ngày</span><input type="date" value={den_ngay} onChange={e => setDenNgay(e.target.value)}/></label>
            <div><span>Trong khoảng</span><b>{phanCaTrongKhoang.length} phân ca</b></div>
          </div>

          {phanCaTheoNgay.length === 0 && <div className="cine-card cine-empty-state">Chưa có ca làm trong khoảng ngày này.</div>}
          <div className="cine-schedule-groups">{phanCaTheoNgay.map(([ngay, danh_sach]) => <section key={ngay} className="cine-schedule-day">
            <h3>📅 {dinhDangNgay(ngay)}</h3>
            <div className="cine-schedule-day-list">{danh_sach.map(x => <article key={x.id} className="cine-card cine-schedule-row">
              <i style={{background:x.ca_lam_viec.mau_hien_thi || "#8b5cf6"}}/>
              <div className="cine-schedule-person"><b>{x.nhan_vien.ma_nhan_vien} · {x.nhan_vien.nguoi_dung.ho_ten}</b><span>{x.nhan_vien.bo_phan} · {x.nhan_vien.chuc_danh}</span>{x.ghi_chu && <small>{x.ghi_chu}</small>}</div>
              <div className="cine-schedule-shift"><b>{x.ca_lam_viec.ten_ca}</b><span>{x.ca_lam_viec.gio_bat_dau}–{x.ca_lam_viec.gio_ket_thuc}</span></div>
              <span className="status-badge active">{x.trang_thai.replaceAll("_", " ")}</span>
              <div className="cine-schedule-actions">
                <button type="button" className="cine-btn cine-btn-secondary" onClick={() => batDauSuaPhanCa(x)} disabled={dang_xu_ly === `pc-${x.id}`}>Chỉnh sửa</button>
                <button type="button" className="cine-btn cine-btn-danger-outline" onClick={() => huyPhanCa(x)} disabled={dang_xu_ly === `pc-${x.id}`}>{dang_xu_ly === `pc-${x.id}` ? "Đang xử lý…" : "Xóa"}</button>
              </div>
            </article>)}</div>
          </section>)}</div>
        </div>
      </div>
    </section>}
  </main>;
}
