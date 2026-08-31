import type { TaiKhoan } from "./xac-thuc";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
async function docLoi(res: Response) { try { const d = await res.json(); return Array.isArray(d?.message) ? d.message.join(" · ") : d?.message || "Yêu cầu không thành công"; } catch { return "Yêu cầu không thành công"; } }
function taoHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  // Fastify 5 từ chối request body rỗng nếu vẫn gắn application/json.
  // Chỉ gắn Content-Type khi request thực sự có body JSON.
  if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function goi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, credentials: "include", cache: init.cache ?? "no-store", headers: taoHeaders(init) });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json() as Promise<T>;
}

export type AdminNguoiDung = TaiKhoan & { da_kich_hoat: boolean; dia_chi_mac_dinh?: string; nhan_vien?: { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; trang_thai: string } | null };
export type AdminNhanVien = { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; ngay_vao_lam: string; trang_thai: string; nguoi_dung: AdminNguoiDung };
export type CaLam = { id: string; ma_ca: string; ten_ca: string; gio_bat_dau: string; gio_ket_thuc: string; mau_hien_thi?: string | null; dang_hoat_dong: boolean };
export type PhanCa = { id: string; ngay_lam: string; trang_thai: string; ghi_chu?: string | null; nhan_vien: AdminNhanVien; ca_lam_viec: CaLam };


export type AdminDonHang = {
  id: string; ma_don_hang: string; ho_ten_nguoi_nhan: string; so_dien_thoai: string; tong_tien: number; trang_thai: string; ngay_tao: string; ngay_cap_nhat: string;
  khach_hang?: { id: string; thu_dien_tu: string; ho_ten: string } | null; so_mat_hang: number; tong_so_luong: number; thanh_toan?: { trang_thai: string; ma_giao_dich: string } | null;
};
export type AdminDonHangChiTiet = AdminDonHang & {
  dia_chi_giao_hang: string; ghi_chu?: string | null;
  chi_tiet: Array<{ id: string; ten_san_pham: string; ma_san_pham: string; so_luong: number; don_gia: number; thanh_tien: number; tuy_chon: Record<string, unknown> }>;
  thanh_toan: Array<{ id: string; ma_giao_dich: string; so_tien: number; trang_thai: string; ngay_tao: string; ngay_thanh_toan?: string | null; phuong_thuc: { ten_phuong_thuc: string; ma_phuong_thuc: string } }>;
  lich_su: Array<{ id: string; trang_thai_cu?: string | null; trang_thai_moi: string; ghi_chu?: string | null; ngay_tao: string; nguoi_thuc_hien?: { ho_ten: string; thu_dien_tu: string; vai_tro: string } | null }>;
};
export type AdminBienThe = { id: string; ma_bien_the: string; so_luong_ton: number; ton_toi_thieu: number; ton_toi_da: number; dang_hien_thi: boolean; gia_chenh_lech: number | string; vat_lieu?: { id: string; ten_vat_lieu: string } | null; mau_sac?: { id: string; ten_mau: string; ma_hex: string } | null };
export type AdminDanhMuc = { id: string; ma_danh_muc: string; ten_danh_muc: string; duong_dan: string; mo_ta?: string | null; thu_tu: number; dang_hien_thi: boolean; so_san_pham: number };
export type AdminVatLieu = { id: string; ma_vat_lieu: string; ten_vat_lieu: string; mo_ta?: string | null; he_so_gia: number; so_bien_the: number };
export type AdminMauSac = { id: string; ma_mau: string; ten_mau: string; ma_hex: string; so_bien_the: number };
export type AdminDanhGia = { id: string; ho_ten: string; so_sao: number; noi_dung: string; da_duyet: boolean; ngay_tao: string; ngay_cap_nhat: string; san_pham: { id: string; ma_san_pham: string; ten_san_pham: string } };
export type AdminSanPham = { id: string; ma_san_pham: string; ten_san_pham: string; mo_ta_ngan?: string | null; gia_ban: number; gia_von?: number | null; kich_thuoc?: string | null; khoi_luong_gam?: number | null; thoi_gian_in_gio?: number | null; trang_thai: string; danh_muc: { id: string; ma_danh_muc: string; ten_danh_muc: string }; bien_the: AdminBienThe[]; hinh_anh: Array<{ duong_dan_anh: string }> };
export type NhatKyAdmin = { id: string; loai_su_kien: string; nguoi_dung_id?: string | null; nguoi_thuc_hien?: { id: string; ho_ten: string; thu_dien_tu: string } | null; dia_chi_ip?: string | null; chi_tiet: Record<string, unknown>; ngay_tao: string };
export type PhanTrang = { trang: number; kich_thuoc: number; tong: number; tong_trang: number; gioi_han_tim_kiem?: number };
export type KetQuaPhanTrang<T> = { du_lieu: T[]; phan_trang: PhanTrang };
export type LichSuVanHanhAdmin = { id: string; loai: "HEALTH" | "BACKUP" | "RESTORE" | "ALERT" | string; trang_thai: "TOT" | "CANH_BAO" | "LOI" | "THANH_CONG" | "THAT_BAI" | string; mo_ta?: string | null; chi_tiet: Record<string, unknown>; ngay_bat_dau?: string | null; ngay_ket_thuc?: string | null; ngay_tao: string };
export type LichSuKhoAdmin = { id: string; loai_su_kien: string; loai_bien_dong: "NHAP_KHO" | "XUAT_KHO" | "DIEU_CHINH" | string; ton_cu: number; ton_moi: number; chenh_lech: number; ly_do: string; ma_bien_the: string; ma_san_pham: string; nguoi_thuc_hien?: { id: string; ho_ten: string; thu_dien_tu?: string } | null; chi_tiet: Record<string, unknown>; ngay_tao: string };
export type AdminCauHinhKho = { nguong_sap_het: number; ngay_cap_nhat?: string | null };
export type DongImportKhoAdmin = { dong: number; ma_bien_the: string; so_luong_nhap: number; ly_do: string; hop_le: boolean; loi: string[]; bien_the_id?: string | null; ma_san_pham: string; ten_san_pham: string; ton_hien_tai: number | null; ton_sau_nhap: number | null };
export type KiemTraImportKhoAdmin = { ten_file: string; tong_dong: number; hop_le: number; khong_hop_le: number; dong: DongImportKhoAdmin[] };
export type NhaCungCapAdmin = { id: string; ma_nha_cung_cap: string; ten_nha_cung_cap: string; nguoi_lien_he?: string | null; so_dien_thoai?: string | null; thu_dien_tu?: string | null; dia_chi?: string | null; ghi_chu?: string | null; dang_hoat_dong: boolean; so_phieu_nhap: number; ngay_tao: string; ngay_cap_nhat: string };
export type PhieuNhapKhoAdmin = { id: string; ma_phieu: string; ma_lo?: string | null; nha_cung_cap?: string | null; nha_cung_cap_id?: string | null; nha_cung_cap_ref?: { id: string; ma_nha_cung_cap: string; ten_nha_cung_cap: string } | null; ghi_chu?: string | null; nguoi_tao_id?: string | null; so_dong: number; tong_so_luong: number; ngay_tao: string; chi_tiet: Array<{ id?: string; ma_bien_the: string; so_luong_nhap: number; ton_truoc: number; ton_sau: number; ly_do?: string | null; ma_san_pham?: string; ten_san_pham?: string; vat_lieu?: string; mau_sac?: string }> };
export type TrangThaiCanhBaoKhoEmailAdmin = { bat: boolean; chu_ky_phut: number; so_nguoi_nhan: number; lan_gui_cuoi?: string | null; tong_canh_bao_lan_cuoi: number; trang_thai_lan_cuoi: string };
export type AdminSucKhoeHeThong = {
  trang_thai: "TOT" | "CANH_BAO" | "LOI";
  phien_ban: string;
  thoi_gian: string;
  api: { uptime_giay: number; node: string; pid: number; rss_bytes: number; heap_used_bytes: number; heap_total_bytes: number };
  database: { ket_noi: boolean; do_tre_ms: number | null; dung_luong_bytes: number | null; migration_gan_nhat: { ten: string; hoan_tat_luc?: string | null } | null; loi?: string };
  smtp: { bat: boolean; san_sang: boolean; host?: string | null; port?: number | null; from: string; loi?: string };
  backup: { thu_muc: string; so_ban_sao: number; so_daily: number; so_weekly: number; tong_dung_luong_bytes: number; gan_nhat: { ten_file: string; kich_thuoc_bytes: number; ngay_sua: string; tuoi_gio: number } | null; loi?: string };
  canh_bao_kho: { bat: boolean; chu_ky_phut: number };
  canh_bao_he_thong: { bat: boolean; chu_ky_phut: number; backup_qua_han_gio: number };
};

export type AdminTongQuan = {
  nguoi_dung: number;
  khach_hang: number;
  nhan_vien: number;
  ca_lam_viec: number;
  phan_ca: number;
  don_hang: number;
  san_pham: number;
  ky_bao_cao: { hom_nay: string; tu_7_ngay: string; tu_30_ngay: string };
  doanh_thu: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number; gia_tri_don_trung_binh_30_ngay: number };
  don_hang_theo_ky: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  don_ghi_nhan_doanh_thu_theo_ky: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  khach_hang_moi: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  trang_thai_don_hang: Record<string, number>;
  doanh_thu_theo_ngay: Array<{ ngay: string; doanh_thu: number; so_don: number }>;
  top_san_pham_30_ngay: Array<{ ma_san_pham: string; ten_san_pham: string; so_luong: number; doanh_thu: number }>;
  canh_bao_kho: { nguong_sap_het: number; sap_het: number; het_hang: number; tong_canh_bao: number };
  ton_kho_thap: Array<{ id: string; ma_bien_the: string; so_luong_ton: number; ma_san_pham: string; ten_san_pham: string; mau_sac: string; vat_lieu: string }>;
  don_gan_day: Array<{ id: string; ma_don_hang: string; ho_ten_nguoi_nhan: string; tong_tien: number; trang_thai: string; ngay_tao: string }>;
};

export const layTongQuan = () => goi<AdminTongQuan>("/quan-tri/tong-quan");
export const laySucKhoeHeThongAdmin = () => goi<AdminSucKhoeHeThong>("/quan-tri/he-thong/suc-khoe");
export const layLichSuVanHanhAdmin = (bo_loc: { loai?: string; trang_thai?: string; tu_ngay?: string; den_ngay?: string; trang?: number; kich_thuoc?: number } = {}) => { const q = new URLSearchParams(); if (bo_loc.loai) q.set("loai", bo_loc.loai); if (bo_loc.trang_thai) q.set("trang_thai", bo_loc.trang_thai); if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay); if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay); if (bo_loc.trang) q.set("trang", String(bo_loc.trang)); if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc)); return goi<KetQuaPhanTrang<LichSuVanHanhAdmin>>(`/quan-tri/he-thong/lich-su${q.size ? `?${q}` : ""}`); };
export const guiCanhBaoHeThongAdmin = () => goi<{ da_gui: boolean; ly_do?: string; van_de: string[]; so_nguoi_nhan?: number }>("/quan-tri/he-thong/canh-bao-email/gui", { method: "POST" });
export const layNguoiDung = () => goi<AdminNguoiDung[]>("/quan-tri/nguoi-dung");
export const capNhatNguoiDung = (id: string, payload: Partial<Pick<AdminNguoiDung, "thu_dien_tu" | "ho_ten" | "so_dien_thoai" | "dia_chi_mac_dinh" | "da_kich_hoat">>) => goi<AdminNguoiDung>(`/quan-tri/nguoi-dung/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const kichHoatNguoiDung = (id: string) => goi<{ id: string; da_kich_hoat: boolean; thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/kich-hoat`, { method: "POST" });
export const khoaNguoiDung = (id: string) => goi<{ id: string; da_kich_hoat: boolean; thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/khoa`, { method: "POST" });
export const xoaNguoiDung = (id: string) => goi<{ thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layNhanVien = () => goi<AdminNhanVien[]>("/quan-tri/nhan-vien");
export const taoNhanVien = (payload: Record<string, unknown>) => goi("/quan-tri/nhan-vien", { method: "POST", body: JSON.stringify(payload) });
export const capNhatNhanVien = (id: string, payload: { trang_thai?: string; ghi_chu?: string }) => goi<AdminNhanVien>(`/quan-tri/nhan-vien/${id}/trang-thai`, { method: "POST", body: JSON.stringify(payload) });
export const layCaLam = () => goi<CaLam[]>("/quan-tri/ca-lam");
export const taoCaLam = (payload: Record<string, unknown>) => goi<CaLam>("/quan-tri/ca-lam", { method: "POST", body: JSON.stringify(payload) });
export const capNhatCaLam = (id: string, payload: Record<string, unknown>) => goi<CaLam>(`/quan-tri/ca-lam/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaCaLam = (id: string) => goi<{ thong_bao: string; so_phan_ca_da_xoa: number }>(`/quan-tri/ca-lam/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layPhanCa = () => goi<PhanCa[]>("/quan-tri/phan-ca");
export const taoPhanCa = (payload: Record<string, unknown>) => goi("/quan-tri/phan-ca", { method: "POST", body: JSON.stringify(payload) });
export const capNhatPhanCa = (id: string, payload: Record<string, unknown>) => goi<PhanCa>(`/quan-tri/phan-ca/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaPhanCa = (id: string) => goi<{ thong_bao: string }>(`/quan-tri/phan-ca/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });

export const layDonHangAdmin = (trang_thai = "", tim_kiem = "") => {
  const q = new URLSearchParams();
  if (trang_thai) q.set("trang_thai", trang_thai);
  if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim());
  return goi<AdminDonHang[]>(`/quan-tri/don-hang${q.size ? `?${q}` : ""}`);
};
export const layChiTietDonHangAdmin = (id: string) => goi<AdminDonHangChiTiet>(`/quan-tri/don-hang/${id}`);
export const capNhatTrangThaiDonHangAdmin = (id: string, payload: { trang_thai: string; ghi_chu?: string }) => goi<AdminDonHangChiTiet>(`/quan-tri/don-hang/${id}/trang-thai`, { method: "POST", body: JSON.stringify(payload) });
export const layDanhMucAdmin = () => goi<AdminDanhMuc[]>("/quan-tri/danh-muc");
export const laySanPhamAdmin = () => goi<AdminSanPham[]>("/quan-tri/san-pham");
export const taoSanPhamAdmin = (payload: { ma_san_pham: string; ten_san_pham: string; danh_muc_id: string; mo_ta_ngan?: string; gia_ban: number; kich_thuoc?: string; khoi_luong_gam?: number; thoi_gian_in_gio?: number; trang_thai?: string; so_luong_ton: number; anh_chinh_data_url: string }) => goi<AdminSanPham>("/quan-tri/san-pham", { method: "POST", body: JSON.stringify(payload) });
export const capNhatSanPhamAdmin = (id: string, payload: { ten_san_pham?: string; danh_muc_id?: string; mo_ta_ngan?: string; gia_ban?: number; kich_thuoc?: string; khoi_luong_gam?: number; thoi_gian_in_gio?: number; trang_thai?: string; anh_chinh_data_url?: string }) => goi<AdminSanPham>(`/quan-tri/san-pham/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaSanPhamAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/san-pham/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const capNhatTonKhoAdmin = (id: string, payload: { so_luong_ton: number; dang_hien_thi?: boolean; ly_do?: string }) => goi<AdminBienThe>(`/quan-tri/bien-the/${id}/ton-kho`, { method: "POST", body: JSON.stringify(payload) });
export const taoDanhMucAdmin = (payload: { ma_danh_muc: string; ten_danh_muc: string; mo_ta?: string; thu_tu?: number; dang_hien_thi?: boolean }) => goi<AdminDanhMuc>("/quan-tri/danh-muc", { method: "POST", body: JSON.stringify(payload) });
export const capNhatDanhMucAdmin = (id: string, payload: { ten_danh_muc?: string; mo_ta?: string; thu_tu?: number; dang_hien_thi?: boolean }) => goi<AdminDanhMuc>(`/quan-tri/danh-muc/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaDanhMucAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/danh-muc/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layVatLieuAdmin = () => goi<AdminVatLieu[]>("/quan-tri/vat-lieu");
export const taoVatLieuAdmin = (payload: { ma_vat_lieu: string; ten_vat_lieu: string; mo_ta?: string; he_so_gia?: number }) => goi<AdminVatLieu>("/quan-tri/vat-lieu", { method: "POST", body: JSON.stringify(payload) });
export const capNhatVatLieuAdmin = (id: string, payload: { ten_vat_lieu?: string; mo_ta?: string; he_so_gia?: number }) => goi<AdminVatLieu>(`/quan-tri/vat-lieu/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaVatLieuAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/vat-lieu/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layMauSacAdmin = () => goi<AdminMauSac[]>("/quan-tri/mau-sac");
export const taoMauSacAdmin = (payload: { ma_mau: string; ten_mau: string; ma_hex: string }) => goi<AdminMauSac>("/quan-tri/mau-sac", { method: "POST", body: JSON.stringify(payload) });
export const capNhatMauSacAdmin = (id: string, payload: { ten_mau?: string; ma_hex?: string }) => goi<AdminMauSac>(`/quan-tri/mau-sac/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaMauSacAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/mau-sac/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layNhaCungCapAdmin = (tim_kiem = "", dang_hoat_dong = "") => { const q = new URLSearchParams(); if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim()); if (dang_hoat_dong) q.set("dang_hoat_dong", dang_hoat_dong); return goi<NhaCungCapAdmin[]>(`/quan-tri/nha-cung-cap${q.size ? `?${q}` : ""}`); };
export const taoNhaCungCapAdmin = (payload: Omit<NhaCungCapAdmin, "id" | "so_phieu_nhap" | "ngay_tao" | "ngay_cap_nhat">) => goi<NhaCungCapAdmin>("/quan-tri/nha-cung-cap", { method: "POST", body: JSON.stringify(payload) });
export const capNhatNhaCungCapAdmin = (id: string, payload: Partial<Pick<NhaCungCapAdmin, "ten_nha_cung_cap" | "nguoi_lien_he" | "so_dien_thoai" | "thu_dien_tu" | "dia_chi" | "ghi_chu" | "dang_hoat_dong">>) => goi<NhaCungCapAdmin>(`/quan-tri/nha-cung-cap/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaNhaCungCapAdmin = (id: string) => goi<{ id: string; thong_bao: string }>(`/quan-tri/nha-cung-cap/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layCauHinhKhoAdmin = () => goi<AdminCauHinhKho>("/quan-tri/kho/cau-hinh");
export const capNhatCauHinhKhoAdmin = (nguong_sap_het: number) => goi<AdminCauHinhKho>("/quan-tri/kho/cau-hinh", { method: "POST", body: JSON.stringify({ nguong_sap_het }) });
export const layLichSuKhoAdmin = (loai = "") => goi<LichSuKhoAdmin[]>(`/quan-tri/kho/lich-su${loai ? `?loai=${encodeURIComponent(loai)}` : ""}`);
export const kiemTraTepNhapKhoAdmin = (ten_file: string, du_lieu_base64: string) => goi<KiemTraImportKhoAdmin>("/quan-tri/kho/import/kiem-tra", { method: "POST", body: JSON.stringify({ ten_file, du_lieu_base64 }) });
export const nhapKhoTheoLoAdmin = (payload: { ma_lo?: string; nha_cung_cap_id?: string; nha_cung_cap?: string; ghi_chu?: string; dong: Array<{ ma_bien_the: string; so_luong_nhap: number; ly_do?: string }> }) => goi<PhieuNhapKhoAdmin>("/quan-tri/kho/nhap-lo", { method: "POST", body: JSON.stringify(payload) });
export const layPhieuNhapKhoAdmin = (tim_kiem = "", nha_cung_cap_id = "", tu_ngay = "", den_ngay = "") => { const q = new URLSearchParams(); if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim()); if (nha_cung_cap_id) q.set("nha_cung_cap_id", nha_cung_cap_id); if (tu_ngay) q.set("tu_ngay", tu_ngay); if (den_ngay) q.set("den_ngay", den_ngay); return goi<PhieuNhapKhoAdmin[]>(`/quan-tri/kho/phieu-nhap${q.size ? `?${q}` : ""}`); };
export const layChiTietPhieuNhapKhoAdmin = (id: string) => goi<PhieuNhapKhoAdmin>(`/quan-tri/kho/phieu-nhap/${id}`);
export const xuatExcelPhieuNhapKhoAdmin = (tim_kiem = "", nha_cung_cap_id = "", tu_ngay = "", den_ngay = "") => { const q = new URLSearchParams(); if (tim_kiem.trim()) q.set("tim_kiem", tim_kiem.trim()); if (nha_cung_cap_id) q.set("nha_cung_cap_id", nha_cung_cap_id); if (tu_ngay) q.set("tu_ngay", tu_ngay); if (den_ngay) q.set("den_ngay", den_ngay); return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/kho/phieu-nhap/excel${q.size ? `?${q}` : ""}`); };
export const layTrangThaiCanhBaoKhoEmailAdmin = () => goi<TrangThaiCanhBaoKhoEmailAdmin>("/quan-tri/kho/canh-bao-email");
export const guiCanhBaoKhoEmailAdmin = () => goi<{ da_gui: boolean; ly_do?: string; tong_canh_bao: number; so_nguoi_nhan?: number; lan_gui?: string }>("/quan-tri/kho/canh-bao-email/gui", { method: "POST" });
export const taoBienTheAdmin = (san_pham_id: string, payload: { ma_bien_the: string; vat_lieu_id?: string; mau_sac_id?: string; gia_chenh_lech?: number; so_luong_ton: number; dang_hien_thi?: boolean }) => goi<AdminBienThe>(`/quan-tri/san-pham/${san_pham_id}/bien-the`, { method: "POST", body: JSON.stringify(payload) });
export const capNhatBienTheAdmin = (id: string, payload: { ma_bien_the?: string; vat_lieu_id?: string | null; mau_sac_id?: string | null; gia_chenh_lech?: number; so_luong_ton?: number; ton_toi_thieu?: number; ton_toi_da?: number; dang_hien_thi?: boolean; ly_do_ton_kho?: string }) => goi<AdminBienThe>(`/quan-tri/bien-the/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaBienTheAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/bien-the/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layDanhGiaAdmin = (trang_thai = "") => goi<AdminDanhGia[]>(`/quan-tri/danh-gia${trang_thai ? `?trang_thai=${encodeURIComponent(trang_thai)}` : ""}`);
export const capNhatDanhGiaAdmin = (id: string, da_duyet: boolean) => goi<AdminDanhGia>(`/quan-tri/danh-gia/${id}/trang-thai`, { method: "POST", body: JSON.stringify({ da_duyet }) });
export const xoaDanhGiaAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/danh-gia/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layBaoCaoCsvAdmin = (loai: "don-hang" | "doanh-thu" | "ton-kho", tu_ngay = "", den_ngay = "") => {
  const q = new URLSearchParams();
  if (tu_ngay) q.set("tu_ngay", tu_ngay);
  if (den_ngay) q.set("den_ngay", den_ngay);
  return goi<{ ten_file: string; csv: string }>(`/quan-tri/bao-cao/${loai}${q.size ? `?${q}` : ""}`);
};
export const layBaoCaoExcelAdmin = (loai: "don-hang" | "doanh-thu" | "ton-kho", tu_ngay = "", den_ngay = "") => {
  const q = new URLSearchParams();
  if (tu_ngay) q.set("tu_ngay", tu_ngay);
  if (den_ngay) q.set("den_ngay", den_ngay);
  return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/bao-cao/${loai}/excel${q.size ? `?${q}` : ""}`);
};
export const layNhatKyAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string; gioi_han?: number } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  if (bo_loc.gioi_han) q.set("gioi_han", String(bo_loc.gioi_han));
  return goi<NhatKyAdmin[]>(`/quan-tri/nhat-ky${q.size ? `?${q}` : ""}`);
};
export const layNhatKyPhanTrangAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string; trang?: number; kich_thuoc?: number } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  if (bo_loc.trang) q.set("trang", String(bo_loc.trang));
  if (bo_loc.kich_thuoc) q.set("kich_thuoc", String(bo_loc.kich_thuoc));
  return goi<KetQuaPhanTrang<NhatKyAdmin>>(`/quan-tri/nhat-ky/phan-trang${q.size ? `?${q}` : ""}`);
};
export const xuatNhatKyExcelAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  return goi<{ ten_file: string; mime_type: string; base64: string }>(`/quan-tri/nhat-ky/excel${q.size ? `?${q}` : ""}`);
};
export const xuatNhatKyCsvAdmin = (bo_loc: { tim_kiem?: string; loai?: string; nguoi_dung_id?: string; tu_ngay?: string; den_ngay?: string } = {}) => {
  const q = new URLSearchParams();
  if (bo_loc.tim_kiem?.trim()) q.set("tim_kiem", bo_loc.tim_kiem.trim());
  if (bo_loc.loai) q.set("loai", bo_loc.loai);
  if (bo_loc.nguoi_dung_id) q.set("nguoi_dung_id", bo_loc.nguoi_dung_id);
  if (bo_loc.tu_ngay) q.set("tu_ngay", bo_loc.tu_ngay);
  if (bo_loc.den_ngay) q.set("den_ngay", bo_loc.den_ngay);
  return goi<{ ten_file: string; csv: string }>(`/quan-tri/nhat-ky/csv${q.size ? `?${q}` : ""}`);
};
