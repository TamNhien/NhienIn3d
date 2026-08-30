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

export type AdminNguoiDung = TaiKhoan & { da_kich_hoat: boolean; nhan_vien?: { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; trang_thai: string } | null };
export type AdminNhanVien = { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; ngay_vao_lam: string; trang_thai: string; nguoi_dung: AdminNguoiDung };
export type CaLam = { id: string; ma_ca: string; ten_ca: string; gio_bat_dau: string; gio_ket_thuc: string; mau_hien_thi?: string | null; dang_hoat_dong: boolean };
export type PhanCa = { id: string; ngay_lam: string; trang_thai: string; ghi_chu?: string | null; nhan_vien: AdminNhanVien; ca_lam_viec: CaLam };

export const layTongQuan = () => goi<Record<string, number>>("/quan-tri/tong-quan");
export const layNguoiDung = () => goi<AdminNguoiDung[]>("/quan-tri/nguoi-dung");
export const capNhatNguoiDung = (id: string, payload: Partial<Pick<AdminNguoiDung, "ho_ten" | "so_dien_thoai" | "da_kich_hoat">>) => goi(`/quan-tri/nguoi-dung/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const kichHoatNguoiDung = (id: string) => goi<{ id: string; da_kich_hoat: boolean; thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/kich-hoat`, { method: "POST" });
export const khoaNguoiDung = (id: string) => goi<{ id: string; da_kich_hoat: boolean; thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/khoa`, { method: "POST" });
export const xoaNguoiDung = (id: string) => goi<{ thong_bao: string }>(`/quan-tri/nguoi-dung/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layNhanVien = () => goi<AdminNhanVien[]>("/quan-tri/nhan-vien");
export const taoNhanVien = (payload: Record<string, unknown>) => goi("/quan-tri/nhan-vien", { method: "POST", body: JSON.stringify(payload) });
export const capNhatNhanVien = (id: string, payload: { trang_thai?: string; ghi_chu?: string }) => goi<AdminNhanVien>(`/quan-tri/nhan-vien/${id}/trang-thai`, { method: "POST", body: JSON.stringify(payload) });
export const layCaLam = () => goi<CaLam[]>("/quan-tri/ca-lam");
export const taoCaLam = (payload: Record<string, unknown>) => goi<CaLam>("/quan-tri/ca-lam", { method: "POST", body: JSON.stringify(payload) });
export const capNhatCaLam = (id: string, payload: Record<string, unknown>) => goi<CaLam>(`/quan-tri/ca-lam/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const xoaCaLam = (id: string) => goi<{ thong_bao: string; so_phan_ca_da_xoa: number }>(`/quan-tri/ca-lam/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
export const layPhanCa = () => goi<PhanCa[]>("/quan-tri/phan-ca");
export const taoPhanCa = (payload: Record<string, unknown>) => goi("/quan-tri/phan-ca", { method: "POST", body: JSON.stringify(payload) });
export const capNhatPhanCa = (id: string, payload: Record<string, unknown>) => goi<PhanCa>(`/quan-tri/phan-ca/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const xoaPhanCa = (id: string) => goi<{ thong_bao: string }>(`/quan-tri/phan-ca/${id}/xoa`, { method: "POST", body: JSON.stringify({ xac_nhan: true }) });
