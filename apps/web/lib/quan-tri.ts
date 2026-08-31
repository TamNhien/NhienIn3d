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
export type AdminBienThe = { id: string; ma_bien_the: string; so_luong_ton: number; dang_hien_thi: boolean; gia_chenh_lech: number | string; vat_lieu?: { id: string; ten_vat_lieu: string } | null; mau_sac?: { id: string; ten_mau: string; ma_hex: string } | null };
export type AdminDanhMuc = { id: string; ma_danh_muc: string; ten_danh_muc: string; duong_dan: string; mo_ta?: string | null; thu_tu: number; dang_hien_thi: boolean; so_san_pham: number };
export type AdminVatLieu = { id: string; ma_vat_lieu: string; ten_vat_lieu: string; mo_ta?: string | null; he_so_gia: number };
export type AdminMauSac = { id: string; ma_mau: string; ten_mau: string; ma_hex: string };
export type AdminDanhGia = { id: string; ho_ten: string; so_sao: number; noi_dung: string; da_duyet: boolean; ngay_tao: string; ngay_cap_nhat: string; san_pham: { id: string; ma_san_pham: string; ten_san_pham: string } };
export type AdminSanPham = { id: string; ma_san_pham: string; ten_san_pham: string; mo_ta_ngan?: string | null; gia_ban: number; gia_von?: number | null; kich_thuoc?: string | null; khoi_luong_gam?: number | null; thoi_gian_in_gio?: number | null; trang_thai: string; danh_muc: { id: string; ma_danh_muc: string; ten_danh_muc: string }; bien_the: AdminBienThe[]; hinh_anh: Array<{ duong_dan_anh: string }> };
export type NhatKyAdmin = { id: string; loai_su_kien: string; nguoi_dung_id?: string | null; nguoi_thuc_hien?: { id: string; ho_ten: string; thu_dien_tu: string } | null; chi_tiet: Record<string, unknown>; ngay_tao: string };

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
  khach_hang_moi: { hom_nay: number; bay_ngay: number; ba_muoi_ngay: number };
  trang_thai_don_hang: Record<string, number>;
  doanh_thu_theo_ngay: Array<{ ngay: string; doanh_thu: number; so_don: number }>;
  top_san_pham_30_ngay: Array<{ ma_san_pham: string; ten_san_pham: string; so_luong: number; doanh_thu: number }>;
  ton_kho_thap: Array<{ id: string; ma_bien_the: string; so_luong_ton: number; ma_san_pham: string; ten_san_pham: string; mau_sac: string; vat_lieu: string }>;
  don_gan_day: Array<{ id: string; ma_don_hang: string; ho_ten_nguoi_nhan: string; tong_tien: number; trang_thai: string; ngay_tao: string }>;
};

export const layTongQuan = () => goi<AdminTongQuan>("/quan-tri/tong-quan");
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
export const capNhatTonKhoAdmin = (id: string, payload: { so_luong_ton: number; dang_hien_thi?: boolean }) => goi<AdminBienThe>(`/quan-tri/bien-the/${id}/ton-kho`, { method: "POST", body: JSON.stringify(payload) });
export const taoDanhMucAdmin = (payload: { ma_danh_muc: string; ten_danh_muc: string; mo_ta?: string; thu_tu?: number; dang_hien_thi?: boolean }) => goi<AdminDanhMuc>("/quan-tri/danh-muc", { method: "POST", body: JSON.stringify(payload) });
export const capNhatDanhMucAdmin = (id: string, payload: { ten_danh_muc?: string; mo_ta?: string; thu_tu?: number; dang_hien_thi?: boolean }) => goi<AdminDanhMuc>(`/quan-tri/danh-muc/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
export const xoaDanhMucAdmin = (id: string) => goi<{ thong_bao: string; id: string }>(`/quan-tri/danh-muc/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layVatLieuAdmin = () => goi<AdminVatLieu[]>("/quan-tri/vat-lieu");
export const layMauSacAdmin = () => goi<AdminMauSac[]>("/quan-tri/mau-sac");
export const taoBienTheAdmin = (san_pham_id: string, payload: { ma_bien_the: string; vat_lieu_id?: string; mau_sac_id?: string; gia_chenh_lech?: number; so_luong_ton: number; dang_hien_thi?: boolean }) => goi<AdminBienThe>(`/quan-tri/san-pham/${san_pham_id}/bien-the`, { method: "POST", body: JSON.stringify(payload) });
export const capNhatBienTheAdmin = (id: string, payload: { ma_bien_the?: string; vat_lieu_id?: string | null; mau_sac_id?: string | null; gia_chenh_lech?: number; so_luong_ton?: number; dang_hien_thi?: boolean }) => goi<AdminBienThe>(`/quan-tri/bien-the/${id}/cap-nhat`, { method: "POST", body: JSON.stringify(payload) });
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
export const layNhatKyAdmin = () => goi<NhatKyAdmin[]>("/quan-tri/nhat-ky");
