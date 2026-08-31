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
  TrangThaiCanhBaoKhoEmailAdmin,
  AdminDanhGia,
  NhatKyAdmin,
  LichSuKhoAdmin,
  CaLam,
  capNhatCaLam,
  capNhatNguoiDung,
  capNhatNhanVien,
  capNhatPhanCa,
  capNhatTrangThaiDonHangAdmin,
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
const TRANG_THAI_TIEP_THEO: Record<string, string[]> = { CHO_XAC_NHAN: ["DA_XAC_NHAN", "DA_HUY"], DA_XAC_NHAN: ["DANG_SAN_XUAT", "DA_HUY"], DANG_SAN_XUAT: ["DANG_GIAO", "DA_HUY"], DANG_GIAO: ["HOAN_TAT"], HOAN_TAT: [], DA_HUY: [] };
const canGhiNhanDoanhThuDonDaGiao = (don: AdminDonHangChiTiet | null) => Boolean(don && don.trang_thai === "HOAN_TAT" && don.thanh_toan[0]?.trang_thai === "CHO_THANH_TOAN");
const daGhiNhanDoanhThu = (don: AdminDonHangChiTiet | null) => Boolean(don && don.trang_thai !== "DA_HUY" && (don.thanh_toan[0]?.trang_thai === "DA_THANH_TOAN" || (!don.thanh_toan[0] && don.trang_thai === "HOAN_TAT")));
const nhanSuKienAudit = (loai: string) => ({
  ADMIN_CAP_NHAT_NGUOI_DUNG: "Cập nhật khách hàng", ADMIN_KICH_HOAT_NGUOI_DUNG: "Kích hoạt tài khoản", ADMIN_KHOA_NGUOI_DUNG: "Khóa tài khoản", ADMIN_XOA_NGUOI_DUNG: "Xóa tài khoản",
  ADMIN_TAO_NHAN_VIEN: "Tạo nhân viên", ADMIN_CAP_NHAT_NHAN_VIEN: "Cập nhật nhân viên", ADMIN_TAO_CA_LAM: "Tạo ca", ADMIN_CAP_NHAT_CA_LAM: "Cập nhật ca", ADMIN_XOA_CA_LAM: "Xóa ca",
  ADMIN_TAO_PHAN_CA: "Tạo phân ca", ADMIN_CAP_NHAT_PHAN_CA: "Cập nhật phân ca", ADMIN_XOA_PHAN_CA: "Xóa phân ca", ADMIN_CAP_NHAT_DON_HANG: "Cập nhật đơn hàng",
  ADMIN_TAO_SAN_PHAM: "Tạo sản phẩm", ADMIN_CAP_NHAT_SAN_PHAM: "Cập nhật sản phẩm", ADMIN_XOA_SAN_PHAM: "Xóa sản phẩm", ADMIN_CAP_NHAT_TON_KHO: "Cập nhật tồn kho",
  ADMIN_TAO_DANH_MUC: "Tạo danh mục", ADMIN_CAP_NHAT_DANH_MUC: "Cập nhật danh mục", ADMIN_XOA_DANH_MUC: "Xóa danh mục",
  ADMIN_TAO_BIEN_THE: "Tạo biến thể", ADMIN_CAP_NHAT_BIEN_THE: "Cập nhật biến thể", ADMIN_XOA_BIEN_THE: "Xóa biến thể",
  ADMIN_TAO_VAT_LIEU: "Tạo vật liệu", ADMIN_CAP_NHAT_VAT_LIEU: "Cập nhật vật liệu", ADMIN_XOA_VAT_LIEU: "Xóa vật liệu",
  ADMIN_TAO_MAU_SAC: "Tạo màu", ADMIN_CAP_NHAT_MAU_SAC: "Cập nhật màu", ADMIN_XOA_MAU_SAC: "Xóa màu", ADMIN_CAP_NHAT_CAU_HINH_KHO: "Cập nhật cảnh báo kho",
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


type TabQuanTri = "tong-quan" | "don-hang" | "san-pham" | "kho" | "tham-chieu" | "danh-muc" | "danh-gia" | "bao-cao" | "khach-hang" | "nhan-vien" | "tao-nhan-vien" | "ca-lam" | "xep-ca" | "nhat-ky";

export default function QuanTriPage() {
  const [tai_khoan, setTaiKhoan] = useState<TaiKhoan | null | undefined>(undefined);
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
  const [canh_bao_kho_email, setCanhBaoKhoEmail] = useState<TrangThaiCanhBaoKhoEmailAdmin | null>(null);
  const [nhap_lo_meta, setNhapLoMeta] = useState({ ma_lo: "", nha_cung_cap: "", ghi_chu: "" });
  const [kho_ly_do, setKhoLyDo] = useState<Record<string, string>>({});
  const [lich_su_kho_loc_loai, setLichSuKhoLocLoai] = useState("");
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

  const [nv, setNv] = useState({ thu_dien_tu: "", ho_ten: "", so_dien_thoai: "", mat_khau: "", xac_nhan_mat_khau: "", ma_nhan_vien: "", ngay_vao_lam: homNay() });
  const [ca, setCa] = useState({ ma_ca: "", ten_ca: "", gio_bat_dau: "06:00", gio_ket_thuc: "14:00", mau_hien_thi: "#38BDF8" });
  const [ca_dang_sua_id, setCaDangSuaId] = useState<string | null>(null);
  const [pc, setPc] = useState({ nhan_vien_id: "", ca_lam_viec_id: "", ngay_lam: homNay(), ghi_chu: "" });
  const [pc_dang_sua_id, setPcDangSuaId] = useState<string | null>(null);

  const taiDuLieu = useCallback(async () => {
    const tk = await layTaiKhoan();
    setTaiKhoan(tk);
    if (!tk || tk.vai_tro !== "ADMIN") return;
    const [tq, nd, nvData, caData, pcData, donData, spData, dmData, vlData, msData, chKhoData, lsKhoData, phieuNhapData, emailKhoData, dgData, nkData] = await Promise.all([layTongQuan(), layNguoiDung(), layNhanVien(), layCaLam(), layPhanCa(), layDonHangAdmin(), laySanPhamAdmin(), layDanhMucAdmin(), layVatLieuAdmin(), layMauSacAdmin(), layCauHinhKhoAdmin(), layLichSuKhoAdmin(), layPhieuNhapKhoAdmin(), layTrangThaiCanhBaoKhoEmailAdmin(), layDanhGiaAdmin(), layNhatKyAdmin()]);
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
    setCanhBaoKhoEmail(emailKhoData);
    setDanhGiaQt(dgData);
    setSpMoi(x => ({ ...x, danh_muc_id: x.danh_muc_id || dmData[0]?.id || "" }));
    setBtMoi(x => ({ ...x, san_pham_id: x.san_pham_id || spData[0]?.id || "" }));
    setNhatKy(nkData);
    setPc(x => ({ ...x, nhan_vien_id: x.nhan_vien_id || nvData[0]?.id || "", ca_lam_viec_id: x.ca_lam_viec_id || caData[0]?.id || "" }));
  }, []);

  useEffect(() => { taiDuLieu().catch(e => setThongBao(e instanceof Error ? e.message : "Không thể tải dữ liệu quản trị")); }, [taiDuLieu]);

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
    setDangXuLy(`don-${don_chon.id}`);
    setThongBao("");
    try {
      const da_luu = await capNhatTrangThaiDonHangAdmin(don_chon.id, { trang_thai: don_trang_thai_moi, ghi_chu: don_ghi_chu.trim() || undefined });
      setDonChon(da_luu);
      setDonTrangThaiMoi(da_luu.trang_thai);
      setDonGhiChu("");
      const [ds, tq, sp, nk] = await Promise.all([layDonHangAdmin(don_loc_trang_thai, don_tim_kiem), layTongQuan(), laySanPhamAdmin(), layNhatKyAdmin()]);
      setDonHang(ds); setTongQuan(tq); setSanPhamQt(sp); setNhatKy(nk);
      setThongBao(`Đã cập nhật ${da_luu.ma_don_hang} → ${nhanTrangThaiDon(da_luu.trang_thai)}.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể cập nhật trạng thái đơn hàng"); }
    finally { setDangXuLy(null); }
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
        gia_chenh_lech: Number(bt.gia_chenh_lech) || 0, so_luong_ton: Number(bt.so_luong_ton), dang_hien_thi: bt.dang_hien_thi,
        ly_do_ton_kho: kho_ly_do[bien_the_id]?.trim() || "Điều chỉnh tồn kho"
      });
      const [ds, tq, nk, lsKho] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layNhatKyAdmin(), layLichSuKhoAdmin()]);
      setSanPhamQt(ds); setTongQuan(tq); setNhatKy(nk); setLichSuKho(lsKho);
      setKhoLyDo(x => ({ ...x, [bien_the_id]: "" }));
      setThongBao(`Đã lưu biến thể ${bt.ma_bien_the}: tồn ${bt.so_luong_ton}.`);
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
        nha_cung_cap: nhap_lo_meta.nha_cung_cap.trim() || undefined,
        ghi_chu: nhap_lo_meta.ghi_chu.trim() || undefined,
        dong: import_kho.dong.map(x => ({ ma_bien_the: x.ma_bien_the, so_luong_nhap: x.so_luong_nhap, ly_do: x.ly_do || "Nhập kho theo lô" }))
      });
      const [sp, tq, ls, pn, nk, emailState] = await Promise.all([laySanPhamAdmin(), layTongQuan(), layLichSuKhoAdmin(), layPhieuNhapKhoAdmin(), layNhatKyAdmin(), layTrangThaiCanhBaoKhoEmailAdmin()]);
      setSanPhamQt(sp); setTongQuan(tq); setLichSuKho(ls); setPhieuNhapKho(pn); setNhatKy(nk); setCanhBaoKhoEmail(emailState);
      setImportKho(null); setNhapLoMeta({ ma_lo: "", nha_cung_cap: "", ghi_chu: "" });
      setThongBao(`Đã nhập kho theo phiếu ${phieu.ma_phieu}: ${phieu.so_dong} dòng · ${phieu.tong_so_luong} sản phẩm.`);
    } catch (e) { setThongBao(e instanceof Error ? e.message : "Không thể nhập kho theo lô"); }
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
      het_hang: ds.filter(bt => bt.so_luong_ton <= 0).length
    };
  }, [san_pham_qt, nguongKho]);
  const lichSuKhoDaLoc = useMemo(() => lich_su_kho.filter(x => !lich_su_kho_loc_loai || x.loai_bien_dong === lich_su_kho_loc_loai), [lich_su_kho, lich_su_kho_loc_loai]);
  const danhGiaDaLoc = useMemo(() => danh_gia_qt.filter(x => !danh_gia_loc || (danh_gia_loc === "DA_DUYET" ? x.da_duyet : !x.da_duyet)), [danh_gia_qt, danh_gia_loc]);
  const nhatKyDaLoc = useMemo(() => { const q = nhat_ky_tim_kiem.trim().toLocaleLowerCase("vi"); return q ? nhat_ky.filter(x => `${x.loai_su_kien} ${x.nguoi_thuc_hien?.ho_ten || ""} ${x.nguoi_thuc_hien?.thu_dien_tu || ""} ${JSON.stringify(x.chi_tiet)}`.toLocaleLowerCase("vi").includes(q)) : nhat_ky; }, [nhat_ky, nhat_ky_tim_kiem]);

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

  if (tai_khoan === undefined) return <main className="auth-shell"><div className="auth-card"><p>Đang xác minh quyền Admin...</p></div></main>;
  if (!tai_khoan) return <main className="auth-shell"><section className="auth-card"><h1>Cần đăng nhập</h1><Link className="primary auth-primary-link" href="/dang-nhap?chuyen_den=/quan-tri">Đăng nhập</Link></section></main>;
  if (tai_khoan.vai_tro !== "ADMIN") return <main className="auth-shell"><section className="auth-card"><h1>Không có quyền truy cập</h1><p>Khu vực này chỉ dành cho Admin.</p><Link className="primary auth-primary-link" href="/tai-khoan">Về tài khoản</Link></section></main>;

  const tabs: Array<[TabQuanTri, string]> = [
    ["tong-quan", "Tổng quan"],
    ["don-hang", "Đơn hàng"],
    ["san-pham", "Sản phẩm"],
    ["danh-muc", "Danh mục"],
    ["kho", "Kho"],
    ["tham-chieu", "Vật liệu & màu"],
    ["danh-gia", "Đánh giá"],
    ["bao-cao", "Báo cáo"],
    ["khach-hang", "Khách hàng"],
    ["nhan-vien", "Nhân viên bán hàng"],
    ["tao-nhan-vien", "Tạo nhân viên bán hàng"],
    ["ca-lam", "Ca làm"],
    ["xep-ca", "Xếp ca"],
    ["nhat-ky", "Nhật ký Admin"]
  ];

  return <main className="cine-admin-shell page-shell">
    <div className="cine-admin-heading">
      <div><h1>Admin Dashboard</h1><p>Admin có toàn quyền hệ thống: catalog, danh mục, vật liệu/màu, biến thể, kho, đánh giá, đơn hàng, báo cáo và nhân sự.</p></div>
      <div className="cine-admin-heading-actions"><span>{tai_khoan.ho_ten} · Admin</span><Link className="cine-btn cine-btn-secondary" href="/tai-khoan">Tài khoản của tôi</Link></div>
    </div>

    {thong_bao && <div className="cine-admin-message" role="status">{thong_bao}</div>}

    <div className="cine-admin-stats">{thongKe.map(([ten, gia_tri]) => <div className="cine-card cine-stat-card" key={ten}><span>{ten}</span><b>{gia_tri}</b></div>)}</div>

    <nav className="cine-admin-tabs" aria-label="Chức năng quản trị">{tabs.map(([ma, ten]) => <button type="button" key={ma} className={`cine-btn ${tab === ma ? "cine-btn-primary" : "cine-btn-secondary"}`} onClick={() => setTab(ma)}>{ten}</button>)}</nav>

    {tab === "tong-quan" && <section className="cine-dashboard-v211">
      {!tong_quan ? <div className="cine-card cine-admin-section">Đang tải thống kê quản trị…</div> : <>
        {tong_quan.canh_bao_kho.tong_canh_bao > 0 && <div className="cine-card cine-stock-alert-v217" role="alert"><div><b>⚠️ Cảnh báo tồn kho</b><span>{tong_quan.canh_bao_kho.sap_het} biến thể sắp hết (≤ {tong_quan.canh_bao_kho.nguong_sap_het}) · {tong_quan.canh_bao_kho.het_hang} biến thể hết hàng.</span></div><button type="button" className="cine-btn cine-btn-primary" onClick={()=>setTab("kho")}>Mở kho xử lý</button></div>}
        <div className="cine-dashboard-period-cards">
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu hôm nay</span><strong>{dinhDangTien(tong_quan.doanh_thu.hom_nay)}</strong><small>{tong_quan.don_ghi_nhan_doanh_thu_theo_ky.hom_nay} đơn ghi nhận doanh thu · {tong_quan.don_hang_theo_ky.hom_nay} đơn mới phát sinh</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu 7 ngày</span><strong>{dinhDangTien(tong_quan.doanh_thu.bay_ngay)}</strong><small>{tong_quan.don_ghi_nhan_doanh_thu_theo_ky.bay_ngay} đơn ghi nhận doanh thu · {tong_quan.don_hang_theo_ky.bay_ngay} đơn mới</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Doanh thu 30 ngày</span><strong>{dinhDangTien(tong_quan.doanh_thu.ba_muoi_ngay)}</strong><small>{tong_quan.don_ghi_nhan_doanh_thu_theo_ky.ba_muoi_ngay} đơn ghi nhận doanh thu · trung bình {dinhDangTien(tong_quan.doanh_thu.gia_tri_don_trung_binh_30_ngay)}/đơn</small></article>
          <article className="cine-card cine-dashboard-kpi"><span>Khách hàng mới</span><strong>{tong_quan.khach_hang_moi.ba_muoi_ngay}</strong><small>Hôm nay {tong_quan.khach_hang_moi.hom_nay} · 7 ngày {tong_quan.khach_hang_moi.bay_ngay}</small></article>
        </div>

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
      <div className="cine-operations-heading"><div><h2>Quản trị đơn hàng</h2><p>Tìm kiếm, xem chi tiết, cập nhật trạng thái và theo dõi lịch sử xử lý.</p></div><span className="cine-admin-count">{don_hang.length} đơn</span></div>
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
            <div className="cine-order-payment-v2151"><div><h4>Thanh toán & doanh thu</h4><p>Non-COD đã thanh toán được ghi nhận doanh thu ngay. COD ghi nhận khi Admin xác nhận đơn đã giao / hoàn tất.</p></div>{don_chon.thanh_toan[0] ? <div className="cine-payment-grid-v2151"><span><small>Phương thức</small><b>{don_chon.thanh_toan[0].phuong_thuc.ten_phuong_thuc}</b></span><span><small>Trạng thái</small><b>{nhanTrangThaiThanhToan(don_chon.thanh_toan[0].trang_thai)}</b></span><span><small>Số tiền</small><b>{dinhDangTien(don_chon.thanh_toan[0].so_tien)}</b></span><span><small>Ghi nhận doanh thu</small><b className={daGhiNhanDoanhThu(don_chon) ? "revenue-ok-v2151" : "revenue-wait-v2151"}>{daGhiNhanDoanhThu(don_chon) ? "Đã ghi nhận" : "Chưa ghi nhận"}</b></span>{don_chon.thanh_toan[0].ngay_thanh_toan && <span><small>Thanh toán lúc</small><b>{new Date(don_chon.thanh_toan[0].ngay_thanh_toan!).toLocaleString("vi-VN")}</b></span>}</div> : <small>Đơn chưa có giao dịch thanh toán.</small>}</div>
            <div className="cine-order-update-v212"><h4>Cập nhật trạng thái</h4><div className="cine-order-update-fields-v212"><label><span>Trạng thái mới</span><select value={don_trang_thai_moi} onChange={e => setDonTrangThaiMoi(e.target.value)}><option value={don_chon.trang_thai}>{nhanTrangThaiDon(don_chon.trang_thai)} (hiện tại)</option>{(TRANG_THAI_TIEP_THEO[don_chon.trang_thai] || []).map(x => <option key={x} value={x}>{nhanTrangThaiDon(x)}{x === "HOAN_TAT" ? " · ghi doanh thu COD" : ""}</option>)}</select></label><label><span>Ghi chú xử lý</span><input value={don_ghi_chu} onChange={e => setDonGhiChu(e.target.value)} placeholder="VD: Đã giao hàng cho khách"/></label></div><button type="button" className="cine-btn cine-btn-primary" onClick={luuTrangThaiDon} disabled={dang_xu_ly === `don-${don_chon.id}` || (don_trang_thai_moi === don_chon.trang_thai && !canGhiNhanDoanhThuDonDaGiao(don_chon))}>{dang_xu_ly === `don-${don_chon.id}` ? "Đang lưu…" : canGhiNhanDoanhThuDonDaGiao(don_chon) && don_trang_thai_moi === don_chon.trang_thai ? "Ghi nhận thanh toán & doanh thu" : don_trang_thai_moi === "HOAN_TAT" ? "Xác nhận đã giao & ghi doanh thu" : "Lưu trạng thái"}</button>{canGhiNhanDoanhThuDonDaGiao(don_chon) ? <small className="cine-terminal-note-v212 revenue-wait-v2151">Đơn đã giao nhưng giao dịch vẫn chờ thanh toán. Bấm Ghi nhận thanh toán & doanh thu để chốt doanh thu.</small> : TRANG_THAI_TIEP_THEO[don_chon.trang_thai]?.length === 0 && <small className="cine-terminal-note-v212">Đơn đã ở trạng thái kết thúc, không chuyển tiếp.</small>}</div>
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
      <div className="cine-operations-heading"><div><h2>Kho hàng</h2><p>Quản lý biến thể nâng cao: mã biến thể, vật liệu, màu, chênh lệch giá, tồn kho và trạng thái hiển thị.</p></div><div className="cine-product-heading-actions-v213"><span className="cine-admin-count">{thongKeKho.bien_the} biến thể</span><button type="button" className="cine-btn cine-btn-secondary" onClick={() => setTab("san-pham")}>Quản lý sản phẩm</button></div></div>

      <div className="cine-inventory-stats-v214">
        <article className="cine-card cine-inventory-stat-v214"><span>Tổng biến thể</span><b>{thongKeKho.bien_the}</b><small>Đang theo dõi trong kho</small></article>
        <article className="cine-card cine-inventory-stat-v214"><span>Tổng tồn</span><b>{thongKeKho.tong_ton}</b><small>Tổng số lượng khả dụng</small></article>
        <article className="cine-card cine-inventory-stat-v214 warning"><span>Sắp hết</span><b>{thongKeKho.sap_het}</b><small>Từ 1 đến {nguongKho} sản phẩm</small></article>
        <article className="cine-card cine-inventory-stat-v214 critical"><span>Hết hàng</span><b>{thongKeKho.het_hang}</b><small>Tồn kho bằng 0</small></article>
      </div>

      <div className="cine-card cine-stock-config-v217"><div><h3>Ngưỡng cảnh báo sắp hết</h3><p>Dùng chung cho Dashboard, bộ lọc Kho và nhãn trạng thái. Giá trị từ 1–999.</p></div><label><span>Ngưỡng tồn</span><input type="number" min="1" max="999" value={cau_hinh_kho.nguong_sap_het} onChange={e=>setCauHinhKho(x=>({...x,nguong_sap_het:Math.max(1,Math.min(999,Number(e.target.value)||1))}))}/></label><button type="button" className="cine-btn cine-btn-primary" onClick={luuCauHinhKho} disabled={dang_xu_ly==="cau-hinh-kho"}>{dang_xu_ly==="cau-hinh-kho"?"Đang lưu…":"Lưu ngưỡng"}</button></div>

      <div className="cine-card cine-stock-email-v218">
        <div><h3>Cảnh báo tồn kho qua email</h3><p>{canh_bao_kho_email?.bat ? `Đang bật · kiểm tra mỗi ${canh_bao_kho_email.chu_ky_phut} phút · ${canh_bao_kho_email.so_nguoi_nhan} người nhận.` : "Đang tắt theo cấu hình môi trường LOW_STOCK_EMAIL_ENABLED."}</p><small>{canh_bao_kho_email?.lan_gui_cuoi ? `Lần gửi gần nhất: ${new Date(canh_bao_kho_email.lan_gui_cuoi).toLocaleString("vi-VN")} · ${canh_bao_kho_email.tong_canh_bao_lan_cuoi} cảnh báo` : "Chưa có lần gửi cảnh báo thành công."}</small></div>
        <button type="button" className="cine-btn cine-btn-secondary" onClick={guiCanhBaoKhoNgay} disabled={dang_xu_ly==="gui-canh-bao-kho-email"}>{dang_xu_ly==="gui-canh-bao-kho-email"?"Đang kiểm tra…":"Kiểm tra & gửi ngay"}</button>
      </div>

      <div className="cine-card cine-batch-import-v218">
        <div className="cine-batch-head-v218"><div><h3>Nhập kho nhanh theo lô</h3><p>Import CSV/Excel, kiểm tra toàn bộ mã biến thể và số lượng trước khi ghi. Chỉ khi 100% dòng hợp lệ mới cho xác nhận nhập kho.</p></div><div className="cine-batch-actions-v218"><button type="button" className="cine-btn cine-btn-secondary" onClick={taiMauNhapKho}>Tải CSV mẫu</button><label className="cine-btn cine-btn-primary cine-file-btn-v218">{dang_xu_ly==="kiem-tra-import-kho"?"Đang kiểm tra…":"Chọn CSV / Excel"}<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e=>void docTepNhapKho(e.target.files?.[0])}/></label></div></div>
        <div className="cine-batch-meta-v218"><label><span>Mã lô</span><input value={nhap_lo_meta.ma_lo} maxLength={80} onChange={e=>setNhapLoMeta(x=>({...x,ma_lo:e.target.value}))} placeholder="VD: PLA-20260831-A"/></label><label><span>Nhà cung cấp</span><input value={nhap_lo_meta.nha_cung_cap} maxLength={180} onChange={e=>setNhapLoMeta(x=>({...x,nha_cung_cap:e.target.value}))} placeholder="Tên nhà cung cấp"/></label><label><span>Ghi chú phiếu</span><input value={nhap_lo_meta.ghi_chu} maxLength={1000} onChange={e=>setNhapLoMeta(x=>({...x,ghi_chu:e.target.value}))} placeholder="Thông tin chung của lô nhập"/></label></div>
        {import_kho ? <div className="cine-import-preview-v218">
          <div className="cine-import-summary-v218"><span><b>{import_kho.tong_dong}</b> dòng</span><span className="ok"><b>{import_kho.hop_le}</b> hợp lệ</span><span className={import_kho.khong_hop_le?"bad":"ok"}><b>{import_kho.khong_hop_le}</b> lỗi</span><span><b>{import_kho.dong.filter(x=>x.hop_le).reduce((sum,x)=>sum+x.so_luong_nhap,0)}</b> tổng SL nhập</span><button type="button" className="cine-btn cine-btn-primary" onClick={xacNhanNhapKhoTheoLo} disabled={import_kho.khong_hop_le>0 || import_kho.hop_le===0 || dang_xu_ly==="nhap-kho-theo-lo"}>{dang_xu_ly==="nhap-kho-theo-lo"?"Đang ghi kho…":"Xác nhận nhập kho"}</button></div>
          <div className="cine-import-table-wrap-v218"><div className="cine-import-table-v218"><div className="head"><span>Dòng</span><span>Mã biến thể</span><span>Sản phẩm</span><span>SL nhập</span><span>Tồn trước → sau</span><span>Kết quả</span></div>{import_kho.dong.slice(0,100).map(item=><div className={item.hop_le?"row ok":"row bad"} key={`${item.dong}-${item.ma_bien_the}`}><span>{item.dong}</span><span><b>{item.ma_bien_the||"—"}</b></span><span>{item.ten_san_pham||item.ma_san_pham||"—"}</span><span>+{Number.isFinite(item.so_luong_nhap)?item.so_luong_nhap:"?"}</span><span>{item.ton_hien_tai===null?"—":`${item.ton_hien_tai} → ${item.ton_sau_nhap}`}</span><span>{item.hop_le?"Hợp lệ":item.loi.join(" · ")}</span></div>)}</div></div>
        </div> : <div className="cine-import-empty-v218">Chưa chọn file. Cột bắt buộc: <b>ma_bien_the</b>, <b>so_luong_nhap</b>; cột tùy chọn: <b>ly_do</b>.</div>}
        {phieu_nhap_kho.length>0 && <div className="cine-receipt-list-v218"><h4>Phiếu nhập gần đây</h4>{phieu_nhap_kho.slice(0,6).map(p=><div key={p.id}><span><b>{p.ma_phieu}</b><small>{p.ma_lo?`Lô ${p.ma_lo}`:"Không mã lô"}{p.nha_cung_cap?` · ${p.nha_cung_cap}`:""}</small></span><strong>{p.so_dong} dòng · +{p.tong_so_luong}</strong><time>{new Date(p.ngay_tao).toLocaleString("vi-VN")}</time></div>)}</div>}
      </div>

      <form className="cine-card cine-variant-create-v215" onSubmit={taoBienTheMoi}>
        <div><h3>Tạo biến thể mới</h3><p>Mỗi sản phẩm có thể có nhiều tổ hợp vật liệu/màu với mã và tồn kho riêng.</p></div>
        <label><span>Sản phẩm</span><select required value={bt_moi.san_pham_id} onChange={e => setBtMoi(x => ({...x, san_pham_id:e.target.value}))}><option value="">Chọn sản phẩm</option>{san_pham_qt.map(sp => <option key={sp.id} value={sp.id}>{sp.ma_san_pham} · {sp.ten_san_pham}</option>)}</select></label>
        <label><span>Mã biến thể</span><input required value={bt_moi.ma_bien_the} onChange={e => setBtMoi(x => ({...x, ma_bien_the:e.target.value}))} placeholder="VD: N3D-XXX-BT02"/></label>
        <label><span>Vật liệu</span><select value={bt_moi.vat_lieu_id} onChange={e => setBtMoi(x => ({...x, vat_lieu_id:e.target.value}))}><option value="">Mặc định</option>{vat_lieu_qt.map(x => <option key={x.id} value={x.id}>{x.ten_vat_lieu}</option>)}</select></label>
        <label><span>Màu sắc</span><select value={bt_moi.mau_sac_id} onChange={e => setBtMoi(x => ({...x, mau_sac_id:e.target.value}))}><option value="">Mặc định</option>{mau_sac_qt.map(x => <option key={x.id} value={x.id}>{x.ten_mau}</option>)}</select></label>
        <label><span>Chênh lệch giá</span><input type="number" step="1000" value={bt_moi.gia_chenh_lech} onChange={e => setBtMoi(x => ({...x, gia_chenh_lech:Number(e.target.value)}))}/></label>
        <label><span>Tồn ban đầu</span><input type="number" min="0" value={bt_moi.so_luong_ton} onChange={e => setBtMoi(x => ({...x, so_luong_ton:Number(e.target.value)}))}/></label>
        <label className="cine-check-v215"><input type="checkbox" checked={bt_moi.dang_hien_thi} onChange={e => setBtMoi(x => ({...x, dang_hien_thi:e.target.checked}))}/><span>Hiển thị</span></label>
        <button className="cine-btn cine-btn-primary" disabled={dang_xu_ly === "tao-bien-the"}>{dang_xu_ly === "tao-bien-the" ? "Đang tạo…" : "+ Thêm biến thể"}</button>
      </form>

      <div className="cine-card cine-stock-filters-v216">
        <label className="wide"><span>Tìm trong kho</span><input value={kho_tim_kiem} onChange={e => setKhoTimKiem(e.target.value)} placeholder="Mã sản phẩm, tên, biến thể, vật liệu, màu..."/></label>
        <label><span>Tình trạng tồn</span><select value={kho_loc_ton} onChange={e=>setKhoLocTon(e.target.value)}><option value="">Tất cả</option><option value="CON_HANG">Còn hàng &gt; {nguongKho}</option><option value="SAP_HET">Sắp hết 1–{nguongKho}</option><option value="HET_HANG">Hết hàng 0</option></select></label>
        <label><span>Vật liệu</span><select value={kho_loc_vat_lieu} onChange={e=>setKhoLocVatLieu(e.target.value)}><option value="">Tất cả</option>{vat_lieu_qt.map(x=><option key={x.id} value={x.id}>{x.ten_vat_lieu}</option>)}</select></label>
        <label><span>Màu</span><select value={kho_loc_mau} onChange={e=>setKhoLocMau(e.target.value)}><option value="">Tất cả</option>{mau_sac_qt.map(x=><option key={x.id} value={x.id}>{x.ten_mau}</option>)}</select></label>
        <label><span>Hiển thị</span><select value={kho_loc_hien_thi} onChange={e=>setKhoLocHienThi(e.target.value)}><option value="">Tất cả</option><option value="HIEN">Đang hiện</option><option value="AN">Đang ẩn</option></select></label>
        <div className="cine-filter-result-v216"><b>{danhSachKho.length}</b><span>kết quả</span></div>
      </div>

      <div className="cine-card cine-inventory-table-card-v214 cine-variant-table-v215"><div className="cine-inventory-scroll-v214">
        <div className="cine-inventory-head-v214 cine-variant-head-v215"><span>Sản phẩm</span><span>Mã biến thể</span><span>Vật liệu</span><span>Màu</span><span>Chênh giá</span><span>Tồn</span><span>Tình trạng</span><span>Hiển thị</span><span>Lý do điều chỉnh</span><span>Thao tác</span></div>
        {danhSachKho.map(({ san_pham, bien_the }) => { const trang_thai_kho = bien_the.so_luong_ton <= 0 ? "HẾT HÀNG" : bien_the.so_luong_ton <= nguongKho ? "SẮP HẾT" : "CÒN HÀNG"; const stock_key = bien_the.so_luong_ton <= 0 ? "out" : bien_the.so_luong_ton <= nguongKho ? "low" : "ok"; return <div className="cine-inventory-row-v214 cine-variant-row-v215" key={bien_the.id}>
          <span className="cine-inventory-product-v214"><b>{san_pham.ten_san_pham}</b><small>{san_pham.ma_san_pham}</small></span>
          <input value={bien_the.ma_bien_the} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{ma_bien_the:e.target.value})}/>
          <select value={bien_the.vat_lieu?.id || ""} onChange={e => { const x=vat_lieu_qt.find(v=>v.id===e.target.value); suaBienTheLocal(san_pham.id,bien_the.id,{vat_lieu:x?{id:x.id,ten_vat_lieu:x.ten_vat_lieu}:null}); }}><option value="">Mặc định</option>{vat_lieu_qt.map(x => <option key={x.id} value={x.id}>{x.ten_vat_lieu}</option>)}</select>
          <select value={bien_the.mau_sac?.id || ""} onChange={e => { const x=mau_sac_qt.find(v=>v.id===e.target.value); suaBienTheLocal(san_pham.id,bien_the.id,{mau_sac:x?{id:x.id,ten_mau:x.ten_mau,ma_hex:x.ma_hex}:null}); }}><option value="">Mặc định</option>{mau_sac_qt.map(x => <option key={x.id} value={x.id}>{x.ten_mau}</option>)}</select>
          <input type="number" step="1000" value={Number(bien_the.gia_chenh_lech)} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{gia_chenh_lech:Number(e.target.value)})}/>
          <input aria-label={`Tồn kho ${bien_the.ma_bien_the}`} type="number" min="0" max="1000000" value={bien_the.so_luong_ton} onChange={e => suaBienTheLocal(san_pham.id,bien_the.id,{so_luong_ton:Math.max(0,Number(e.target.value))})}/>
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
      <div className="cine-operations-heading"><div><h2>Nhật ký thao tác Admin</h2><p>200 sự kiện quản trị gần nhất trên khách hàng, nhân viên, ca làm, phân ca, đơn hàng, sản phẩm và tồn kho.</p></div><span className="cine-admin-count">{nhat_ky.length} sự kiện</span></div>
      <div className="cine-card cine-product-filter-v212"><label><span>Tìm trong nhật ký</span><input value={nhat_ky_tim_kiem} onChange={e => setNhatKyTimKiem(e.target.value)} placeholder="Loại thao tác, Admin hoặc nội dung..."/></label><div><b>{nhatKyDaLoc.length}</b><span>kết quả</span></div></div>
      <div className="cine-card cine-audit-list-v212">{nhatKyDaLoc.map(item => <article className="cine-audit-row-v212" key={item.id}><i/><div><b>{nhanSuKienAudit(item.loai_su_kien)}</b><span>{item.nguoi_thuc_hien?.ho_ten || "Admin/hệ thống"} · {new Date(item.ngay_tao).toLocaleString("vi-VN")}</span><code>{JSON.stringify(item.chi_tiet)}</code></div></article>)}{nhatKyDaLoc.length === 0 && <div className="cine-dashboard-empty">Không có sự kiện phù hợp.</div>}</div>
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
