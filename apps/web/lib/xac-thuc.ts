import { nhanDangTrinhDuyet } from "./trinh-duyet";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const SU_KIEN_XAC_THUC = "nhienin3d:xac-thuc";
const KHOA_DA_DANG_XUAT = "nhienin3d_da_dang_xuat";

export type TaiKhoan = {
  id: string;
  thu_dien_tu: string;
  ho_ten: string;
  so_dien_thoai?: string | null;
  vai_tro: "KHACH_HANG" | "NHAN_VIEN" | "ADMIN";
  da_kich_hoat?: boolean;
  ngay_tao?: string;
  lan_dang_nhap_cuoi?: string | null;
  ngay_cap_nhat?: string;
  nhan_vien?: { id: string; ma_nhan_vien: string; chuc_danh: string; bo_phan: string; trang_thai: string } | null;
};

async function docLoi(res: Response) {
  try {
    const data = await res.json();
    const message = Array.isArray(data?.message) ? data.message.join(" · ") : data?.message;
    return message || "Yêu cầu không thành công";
  } catch {
    return "Yêu cầu không thành công";
  }
}

function taoHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function goi(duong_dan: string, init: RequestInit = {}) {
  return fetch(`${API}${duong_dan}`, { ...init, credentials: "include", cache: init.cache ?? "no-store", headers: taoHeaders(init) });
}

export async function dangKy(payload: { thu_dien_tu: string; ho_ten: string; so_dien_thoai: string; dia_chi: string; mat_khau: string }) {
  const trinh_duyet_hien_thi = await nhanDangTrinhDuyet();
  const res = await goi("/xac-thuc/dang-ky", { method: "POST", body: JSON.stringify({ ...payload, trinh_duyet_hien_thi }) });
  if (!res.ok) throw new Error(await docLoi(res));
  const data = await res.json() as { nguoi_dung: TaiKhoan };
  localStorage.removeItem(KHOA_DA_DANG_XUAT);
  window.dispatchEvent(new Event(SU_KIEN_XAC_THUC));
  return data.nguoi_dung;
}

export async function dangNhap(payload: { thu_dien_tu: string; mat_khau: string }) {
  const trinh_duyet_hien_thi = await nhanDangTrinhDuyet();
  const res = await goi("/xac-thuc/dang-nhap", { method: "POST", body: JSON.stringify({ ...payload, trinh_duyet_hien_thi }) });
  if (!res.ok) throw new Error(await docLoi(res));
  const data = await res.json() as { nguoi_dung: TaiKhoan };
  localStorage.removeItem(KHOA_DA_DANG_XUAT);
  window.dispatchEvent(new Event(SU_KIEN_XAC_THUC));
  return data.nguoi_dung;
}

export async function lamMoiPhien() {
  const res = await goi("/xac-thuc/lam-moi", { method: "POST" });
  if (!res.ok) return null;
  const data = await res.json() as { nguoi_dung: TaiKhoan };
  return data.nguoi_dung;
}

export async function layTaiKhoan(): Promise<TaiKhoan | null> {
  if (typeof window !== "undefined" && localStorage.getItem(KHOA_DA_DANG_XUAT) === "1") return null;
  let res = await goi("/xac-thuc/toi");
  if (res.status === 401) {
    const da_lam_moi = await lamMoiPhien();
    if (!da_lam_moi) return null;
    res = await goi("/xac-thuc/toi");
  }
  if (!res.ok) return null;
  return res.json() as Promise<TaiKhoan>;
}

export async function dangXuat() {
  // Đặt marker trước request để mọi component ngừng tự refresh session ngay lập tức.
  localStorage.setItem(KHOA_DA_DANG_XUAT, "1");
  try {
    const res = await goi("/xac-thuc/dang-xuat", { method: "POST", cache: "no-store" });
    if (!res.ok) throw new Error(await docLoi(res));
  } finally {
    window.dispatchEvent(new CustomEvent(SU_KIEN_XAC_THUC, { detail: { da_dang_xuat: true } }));
  }
}

export function tenVaiTro(vai_tro: TaiKhoan["vai_tro"]) {
  return ({
    KHACH_HANG: "Khách hàng",
    NHAN_VIEN: "Nhân viên bán hàng",
    ADMIN: "Admin"
  } as const)[vai_tro] || vai_tro;
}
export async function quenMatKhau(thu_dien_tu: string) {
  const res = await goi("/xac-thuc/quen-mat-khau", { method: "POST", body: JSON.stringify({ thu_dien_tu }) });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json() as Promise<{ thong_bao: string }>;
}

export async function datLaiMatKhau(payload: { ma: string; mat_khau_moi: string }) {
  const res = await goi("/xac-thuc/dat-lai-mat-khau", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json() as Promise<{ thong_bao: string }>;
}
