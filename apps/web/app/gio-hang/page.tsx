"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { capNhatSoLuong, type GioHang, layGioHangDaLuu, xoaKhoiGio } from "../../lib/gio-hang";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function GioHangPage() {
  const [gio_hang, setGioHang] = useState<GioHang | null>(null);
  const [dang_tai, setDangTai] = useState(true);
  const [dang_cap_nhat, setDangCapNhat] = useState<string | null>(null);
  const [thong_bao, setThongBao] = useState("");

  useEffect(() => {
    layGioHangDaLuu().then(setGioHang).finally(() => setDangTai(false));
  }, []);

  async function doiSoLuong(id: string, so_luong: number) {
    if (!gio_hang || so_luong < 1) return;
    try {
      setDangCapNhat(id);
      setThongBao("");
      setGioHang(await capNhatSoLuong(gio_hang.ma_phien, id, so_luong));
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể cập nhật giỏ hàng");
    } finally {
      setDangCapNhat(null);
    }
  }

  async function xoa(id: string) {
    if (!gio_hang) return;
    try {
      setDangCapNhat(id);
      setThongBao("");
      setGioHang(await xoaKhoiGio(gio_hang.ma_phien, id));
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể xóa sản phẩm");
    } finally {
      setDangCapNhat(null);
    }
  }

  return <main>
    <ThanhDieuHuong/>
    <section className="page-shell cart-page">
      <div className="page-title-row">
        <div><div className="eyebrow">GIỎ HÀNG</div><h1>Kiểm tra đơn hàng trước khi thanh toán.</h1><p>Bạn có thể tăng giảm số lượng, xóa sản phẩm hoặc quay lại mua thêm.</p></div>
        <Link className="secondary" href="/#san-pham">← Tiếp tục mua hàng</Link>
      </div>

      {dang_tai ? <div className="loading-panel">Đang tải giỏ hàng…</div> : !gio_hang?.chi_tiet.length ? <div className="empty-state cart-empty">
        <div className="empty-icon">◌</div><h2>Giỏ hàng đang trống</h2><p>Hãy chọn sản phẩm trước khi tiến hành thanh toán.</p><Link className="primary" href="/#san-pham">Xem sản phẩm</Link>
      </div> : <div className="cart-layout">
        <div className="cart-list-card">
          {gio_hang.chi_tiet.map(item => <article className="cart-page-item" key={item.id}>
            <Link href={item.bien_the.san_pham.duong_dan ? `/san-pham/${encodeURIComponent(item.bien_the.san_pham.duong_dan)}` : "/#san-pham"} className="cart-image-link">
              <img src={item.bien_the.san_pham.hinh_anh?.[0]?.duong_dan_anh} alt={item.bien_the.san_pham.ten_san_pham} referrerPolicy="no-referrer"/>
            </Link>
            <div className="cart-page-info">
              <span className="sku">{item.bien_the.san_pham.ma_san_pham}</span>
              <strong>{item.bien_the.san_pham.ten_san_pham}</strong>
              <small>{item.bien_the.vat_lieu?.ten_vat_lieu || "Vật liệu tiêu chuẩn"} • {item.bien_the.mau_sac?.ten_mau || "Màu tiêu chuẩn"}</small>
              <div className="cart-quantity-row">
                <div className="quantity-control compact"><button onClick={() => doiSoLuong(item.id, item.so_luong - 1)} disabled={dang_cap_nhat === item.id || item.so_luong <= 1}>−</button><b>{item.so_luong}</b><button onClick={() => doiSoLuong(item.id, item.so_luong + 1)} disabled={dang_cap_nhat === item.id}>+</button></div>
                <button className="remove-link" onClick={() => xoa(item.id)} disabled={dang_cap_nhat === item.id}>Xóa</button>
              </div>
            </div>
            <div className="cart-page-price"><small>{vnd.format(Number(item.don_gia))} / sản phẩm</small><b>{vnd.format(Number(item.don_gia) * item.so_luong)}</b></div>
          </article>)}
          {thong_bao && <div className="inline-message error-message">{thong_bao}</div>}
        </div>

        <aside className="cart-summary">
          <div className="eyebrow">TÓM TẮT</div>
          <div className="summary-line"><span>Số lượng</span><b>{gio_hang.tong_so_luong} sản phẩm</b></div>
          <div className="summary-line total"><span>Tạm tính</span><strong>{vnd.format(Number(gio_hang.tam_tinh))}</strong></div>
          <p>Phí giao hàng và phương thức thanh toán sẽ được xác nhận ở bước tiếp theo.</p>
          <Link className="checkout-button checkout-link" href="/thanh-toan">Tiến hành thanh toán →</Link>
          <Link className="secondary back-shopping" href="/#san-pham">Mua thêm sản phẩm</Link>
        </aside>
      </div>}
    </section>
  </main>;
}
