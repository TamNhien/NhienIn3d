import { API_URL } from "./gio-hang";

const KHOA_PHIEN_DANH_GIA = "nhienin3d_phien_danh_gia";
export function layMaPhienDanhGia() {
  if (typeof window === "undefined") return "";
  let ma = localStorage.getItem(KHOA_PHIEN_DANH_GIA);
  if (!ma) { ma = crypto.randomUUID(); localStorage.setItem(KHOA_PHIEN_DANH_GIA, ma); }
  return ma;
}
export async function layDanhGia(duong_dan: string) {
  const r = await fetch(`${API_URL}/danh-gia/san-pham/${encodeURIComponent(duong_dan)}`, { credentials: "include" });
  if (!r.ok) throw new Error("Không thể tải đánh giá");
  return r.json();
}
export async function guiDanhGia(duong_dan: string, ho_ten: string, so_sao: number, noi_dung: string) {
  const r = await fetch(`${API_URL}/danh-gia/san-pham/${encodeURIComponent(duong_dan)}`, {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ma_phien: layMaPhienDanhGia(), ho_ten, so_sao, noi_dung })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.message || "Không thể gửi đánh giá");
  return data;
}
