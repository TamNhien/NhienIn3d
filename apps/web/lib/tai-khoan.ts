import type { TaiKhoan } from "./xac-thuc";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

async function docLoi(res: Response) {
  try {
    const data = await res.json();
    return Array.isArray(data?.message) ? data.message.join(" · ") : data?.message || "Yêu cầu không thành công";
  } catch { return "Yêu cầu không thành công"; }
}

function taoHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function goi<T>(duong_dan: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${duong_dan}`, { ...init, credentials: "include", cache: init.cache ?? "no-store", headers: taoHeaders(init) });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json() as Promise<T>;
}

export type HoSoTaiKhoan = TaiKhoan & {
  ngay_cap_nhat?: string;
  dia_chi?: Array<{ id: string; dia_chi_cu_the: string; tinh_thanh: string; quan_huyen: string; phuong_xa: string; la_mac_dinh: boolean }>;
  nhan_vien?: { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; ngay_vao_lam?: string; trang_thai: string } | null;
};
export type PhienTaiKhoan = { id: string; dia_chi_ip?: string | null; trinh_duyet?: string | null; het_han_luc: string; ngay_tao: string };
export type DonHangTaiKhoan = { id: string; ma_don_hang: string; tong_tien: string | number; trang_thai: string; ngay_tao: string; ho_ten_nguoi_nhan: string; chi_tiet: Array<{ id: string; ten_san_pham: string; ma_san_pham: string; so_luong: number; don_gia: string | number; thanh_tien: string | number; tuy_chon: unknown }> };
export type LichLamViec = null | { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; trang_thai: string; phan_ca: Array<{ id: string; ngay_lam: string; trang_thai: string; ghi_chu?: string | null; ca_lam_viec: { ma_ca: string; ten_ca: string; gio_bat_dau: string; gio_ket_thuc: string; mau_hien_thi?: string | null } }> };

export const layHoSo = () => goi<HoSoTaiKhoan>("/tai-khoan/ho-so", { cache: "no-store" });
export const capNhatHoSo = (payload: { ho_ten: string; so_dien_thoai: string; thu_dien_tu: string; dia_chi: string }) => goi<HoSoTaiKhoan>("/tai-khoan/ho-so", { method: "PATCH", body: JSON.stringify(payload), cache: "no-store" });
export const doiMatKhau = (payload: { mat_khau_hien_tai: string; mat_khau_moi: string }) => goi<{ thong_bao: string; yeu_cau_dang_nhap_lai: boolean }>("/tai-khoan/doi-mat-khau", { method: "PATCH", body: JSON.stringify(payload), cache: "no-store" });
export const layPhien = () => goi<PhienTaiKhoan[]>("/tai-khoan/phien", { cache: "no-store" });
export const capNhatPhienHienTai = (trinh_duyet_hien_thi: string) => goi<{ da_cap_nhat: boolean }>("/tai-khoan/phien/hien-tai", { method: "PATCH", body: JSON.stringify({ trinh_duyet_hien_thi }), cache: "no-store" });
export const thuHoiPhien = (id: string) => goi<{ thong_bao: string }>(`/tai-khoan/phien/${encodeURIComponent(id)}`, { method: "DELETE" });
export const layDonHangCuaToi = () => goi<DonHangTaiKhoan[]>("/tai-khoan/don-hang", { cache: "no-store" });
export const layLichLamViec = () => goi<LichLamViec>("/tai-khoan/lich-lam-viec", { cache: "no-store" });
