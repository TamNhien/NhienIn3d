const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const SU_KIEN_XAC_THUC = "nhienin3d:xac-thuc";

export type TaiKhoan = {
  id: string;
  thu_dien_tu: string;
  ho_ten: string;
  vai_tro: "KHACH_HANG" | "NHAN_VIEN" | "QUAN_LY" | "QUAN_TRI" | "SIEU_QUAN_TRI";
  da_kich_hoat?: boolean;
  ngay_tao?: string;
  lan_dang_nhap_cuoi?: string | null;
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

async function goi(duong_dan: string, init: RequestInit = {}) {
  return fetch(`${API}${duong_dan}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
}

export async function dangKy(payload: { thu_dien_tu: string; ho_ten: string; mat_khau: string }) {
  const res = await goi("/xac-thuc/dang-ky", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await docLoi(res));
  const data = await res.json() as { nguoi_dung: TaiKhoan };
  window.dispatchEvent(new Event(SU_KIEN_XAC_THUC));
  return data.nguoi_dung;
}

export async function dangNhap(payload: { thu_dien_tu: string; mat_khau: string }) {
  const res = await goi("/xac-thuc/dang-nhap", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await docLoi(res));
  const data = await res.json() as { nguoi_dung: TaiKhoan };
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
  await goi("/xac-thuc/dang-xuat", { method: "POST" });
  window.dispatchEvent(new Event(SU_KIEN_XAC_THUC));
}

export function tenVaiTro(vai_tro: TaiKhoan["vai_tro"]) {
  return ({
    KHACH_HANG: "Khách hàng",
    NHAN_VIEN: "Nhân viên",
    QUAN_LY: "Quản lý",
    QUAN_TRI: "Quản trị",
    SIEU_QUAN_TRI: "Siêu quản trị"
  } as const)[vai_tro] || vai_tro;
}
