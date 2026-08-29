export const KHOA_GIO_HANG = "nhienin3d_ma_gio_hang_v2";
export const SU_KIEN_GIO_HANG = "nhienin3d:gio-hang-thay-doi";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export type ChiTietGio = {
  id: string;
  so_luong: number;
  don_gia: number | string;
  bien_the: {
    ma_bien_the: string;
    so_luong_ton?: number;
    san_pham: {
      ten_san_pham: string;
      ma_san_pham: string;
      duong_dan?: string;
      hinh_anh: { duong_dan_anh: string }[];
    };
    vat_lieu?: { ten_vat_lieu: string };
    mau_sac?: { ten_mau: string; ma_hex: string };
  };
};

export type GioHang = {
  ma_phien: string;
  tong_so_luong: number;
  tam_tinh: number;
  chi_tiet: ChiTietGio[];
};

export function phatSuKienGioHang() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SU_KIEN_GIO_HANG));
}

export async function layGioHangDaLuu(): Promise<GioHang | null> {
  if (typeof window === "undefined") return null;
  const ma_phien = window.localStorage.getItem(KHOA_GIO_HANG);
  if (!ma_phien) return null;
  const response = await fetch(`${API_URL}/gio-hang/${encodeURIComponent(ma_phien)}`);
  if (!response.ok) {
    window.localStorage.removeItem(KHOA_GIO_HANG);
    phatSuKienGioHang();
    return null;
  }
  return response.json();
}

export async function damBaoGioHang(): Promise<GioHang> {
  const da_co = await layGioHangDaLuu();
  if (da_co) return da_co;
  const response = await fetch(`${API_URL}/gio-hang`, { method: "POST" });
  if (!response.ok) throw new Error("Không thể tạo giỏ hàng");
  const gio = await response.json();
  window.localStorage.setItem(KHOA_GIO_HANG, gio.ma_phien);
  phatSuKienGioHang();
  return gio;
}

export async function themBienTheVaoGio(ma_bien_the: string, so_luong = 1): Promise<GioHang> {
  const gio = await damBaoGioHang();
  const response = await fetch(`${API_URL}/gio-hang/${encodeURIComponent(gio.ma_phien)}/them`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ma_bien_the, so_luong })
  });
  const du_lieu = await response.json();
  if (!response.ok) throw new Error(du_lieu.message || "Không thể thêm sản phẩm vào giỏ");
  phatSuKienGioHang();
  return du_lieu;
}

export async function capNhatSoLuong(ma_phien: string, id: string, so_luong: number): Promise<GioHang> {
  const response = await fetch(`${API_URL}/gio-hang/${encodeURIComponent(ma_phien)}/chi-tiet/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ so_luong })
  });
  const du_lieu = await response.json();
  if (!response.ok) throw new Error(du_lieu.message || "Không thể cập nhật số lượng");
  phatSuKienGioHang();
  return du_lieu;
}

export async function xoaKhoiGio(ma_phien: string, id: string): Promise<GioHang> {
  const response = await fetch(`${API_URL}/gio-hang/${encodeURIComponent(ma_phien)}/chi-tiet/${id}`, { method: "DELETE" });
  const du_lieu = await response.json();
  if (!response.ok) throw new Error(du_lieu.message || "Không thể xóa sản phẩm");
  phatSuKienGioHang();
  return du_lieu;
}
