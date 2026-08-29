import type { TaiKhoan } from "./xac-thuc";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

async function docLoi(res: Response) {
  try {
    const data = await res.json();
    return Array.isArray(data?.message) ? data.message.join(" · ") : data?.message || "Yêu cầu không thành công";
  } catch { return "Yêu cầu không thành công"; }
}

async function goi<T>(duong_dan: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${duong_dan}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json() as Promise<T>;
}

export type HoSoTaiKhoan = TaiKhoan & {
  ngay_cap_nhat?: string;
  nhan_vien?: { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; ngay_vao_lam?: string; trang_thai: string } | null;
};
export type PhienTaiKhoan = { id: string; dia_chi_ip?: string | null; trinh_duyet?: string | null; het_han_luc: string; ngay_tao: string };
export type DonHangTaiKhoan = { id: string; ma_don_hang: string; tong_tien: string | number; trang_thai: string; ngay_tao: string; ho_ten_nguoi_nhan: string; chi_tiet: Array<{ id: string; ten_san_pham: string; ma_san_pham: string; so_luong: number; don_gia: string | number; thanh_tien: string | number; tuy_chon: unknown }> };
export type LichLamViec = null | { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; trang_thai: string; phan_ca: Array<{ id: string; ngay_lam: string; trang_thai: string; ghi_chu?: string | null; ca_lam_viec: { ma_ca: string; ten_ca: string; gio_bat_dau: string; gio_ket_thuc: string; mau_hien_thi?: string | null } }> };

export const layHoSo = () => goi<HoSoTaiKhoan>("/tai-khoan/ho-so");
export const capNhatHoSo = (payload: { ho_ten: string; so_dien_thoai: string }) => goi<HoSoTaiKhoan>("/tai-khoan/ho-so", { method: "PATCH", body: JSON.stringify(payload) });
export const layPhien = () => goi<PhienTaiKhoan[]>("/tai-khoan/phien");
export const thuHoiPhien = (id: string) => goi<{ thong_bao: string }>(`/tai-khoan/phien/${encodeURIComponent(id)}`, { method: "DELETE" });
export const layDonHangCuaToi = () => goi<DonHangTaiKhoan[]>("/tai-khoan/don-hang");
export const layLichLamViec = () => goi<LichLamViec>("/tai-khoan/lich-lam-viec");
