import { API_URL } from "./gio-hang";
import type { SanPham } from "./du-lieu-mau";

const KHOA_PHIEN = "nhienin3d_yeu_thich_phien";
export const SU_KIEN_YEU_THICH = "nhienin3d:yeu-thich-thay-doi";

export type DongYeuThich = { id: string; ngay_tao: string; san_pham: SanPham };

export function layMaPhienYeuThich() {
  if (typeof window === "undefined") return "";
  let ma = localStorage.getItem(KHOA_PHIEN);
  if (!ma) {
    ma = `yt_${crypto.randomUUID().replaceAll("-", "")}`;
    localStorage.setItem(KHOA_PHIEN, ma);
  }
  return ma;
}

function phatSuKien() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SU_KIEN_YEU_THICH));
}

export async function layDanhSachYeuThich(): Promise<DongYeuThich[]> {
  const ma = layMaPhienYeuThich();
  if (!ma) return [];
  const res = await fetch(`${API_URL}/yeu-thich/${encodeURIComponent(ma)}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải danh sách yêu thích");
  return res.json();
}

export async function themYeuThich(ma_san_pham: string) {
  const ma = layMaPhienYeuThich();
  const res = await fetch(`${API_URL}/yeu-thich/${encodeURIComponent(ma)}/${encodeURIComponent(ma_san_pham)}`, {
    method: "POST", credentials: "include"
  });
  if (!res.ok) throw new Error("Không thể thêm sản phẩm yêu thích");
  phatSuKien();
  return res.json();
}

export async function xoaYeuThich(ma_san_pham: string) {
  const ma = layMaPhienYeuThich();
  const res = await fetch(`${API_URL}/yeu-thich/${encodeURIComponent(ma)}/${encodeURIComponent(ma_san_pham)}`, {
    method: "DELETE", credentials: "include"
  });
  if (!res.ok) throw new Error("Không thể xóa sản phẩm yêu thích");
  phatSuKien();
  return res.json();
}
