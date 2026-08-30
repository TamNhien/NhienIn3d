"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DanhGiaSanPham } from "../../../components/danh-gia-san-pham";
import { GoiYSanPham } from "../../../components/goi-y-san-pham";
import { API_URL, themBienTheVaoGio } from "../../../lib/gio-hang";
import { DU_LIEU_MAU, type SanPham } from "../../../lib/du-lieu-mau";
import { layDanhSachYeuThich, themYeuThich, xoaYeuThich } from "../../../lib/yeu-thich";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function ChiTietSanPhamPage() {
  const params = useParams<{ duong_dan: string }>();
  const duong_dan = decodeURIComponent(params.duong_dan);
  const fallback = DU_LIEU_MAU.find(x => x.duong_dan === duong_dan) ?? null;
  const [san_pham, setSanPham] = useState<SanPham | null>(fallback);
  const [so_luong, setSoLuong] = useState(1);
  const [dang_them, setDangThem] = useState(false);
  const [thong_bao, setThongBao] = useState("");
  const [da_yeu_thich, setDaYeuThich] = useState(false);

  useEffect(() => {
    layDanhSachYeuThich().then(ds => setDaYeuThich(ds.some(x => x.san_pham.duong_dan === duong_dan))).catch(() => {});
    fetch(`${API_URL}/san-pham/${encodeURIComponent(duong_dan)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((du_lieu: SanPham) => {
        setSanPham(du_lieu);
        setSoLuong(1);
      })
      .catch(() => {});
  }, [duong_dan]);

  // v2.9.1: màu/biến thể không còn do người dùng chọn trên giao diện.
  // Hệ thống tự lấy biến thể mặc định đầu tiên còn hàng, nếu tất cả hết thì lấy biến thể đầu tiên.
  const bien_the = useMemo(
    () => san_pham?.bien_the?.find(x => x.so_luong_ton > 0) ?? san_pham?.bien_the?.[0],
    [san_pham]
  );
  const gia = Number(san_pham?.gia_ban ?? 0) + Number(bien_the?.gia_chenh_lech ?? 0);
  const ton = bien_the?.so_luong_ton ?? 0;
  const anh_goc = san_pham?.hinh_anh?.[0]?.duong_dan_anh || "";

  async function themVaoGio() {
    if (!bien_the) return;
    try {
      setDangThem(true);
      setThongBao("");
      await themBienTheVaoGio(bien_the.ma_bien_the, so_luong);
      setThongBao(`Đã thêm ${so_luong} sản phẩm vào giỏ hàng.`);
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể thêm vào giỏ");
    } finally {
      setDangThem(false);
    }
  }

  async function doiYeuThich() {
    if (!san_pham) return;
    try {
      if (da_yeu_thich) await xoaYeuThich(san_pham.ma_san_pham); else await themYeuThich(san_pham.ma_san_pham);
      setDaYeuThich(x => !x);
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể cập nhật yêu thích");
    }
  }

  if (!san_pham) return <main><section className="page-shell"><div className="empty-state"><h1>Không tìm thấy sản phẩm</h1><Link className="primary" href="/san-pham">Quay lại sản phẩm</Link></div></section></main>;

  return <main>
    <section className="page-shell product-detail-page">
      <div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><Link href="/san-pham">Sản phẩm</Link><span>/</span><b>{san_pham.ten_san_pham}</b></div>
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-main-image product-detail-photo">
            {anh_goc ? <img className="product-photo-default" src={anh_goc} alt={san_pham.ten_san_pham} referrerPolicy="no-referrer"/> : <div className="product-image-empty">Chưa có ảnh sản phẩm</div>}
          </div>
          <div className="product-spec-strip">
            <div><span>Kích thước</span><b>{san_pham.kich_thuoc}</b></div>
            <div><span>Khối lượng</span><b>{san_pham.khoi_luong_gam} g</b></div>
            <div><span>Thời gian in</span><b>{san_pham.thoi_gian_in_gio} giờ</b></div>
          </div>
        </div>
        <div className="product-detail-info">
          <div className="eyebrow">{san_pham.danh_muc?.ten_danh_muc || "SẢN PHẨM IN 3D"}</div>
          <div className="sku">{san_pham.ma_san_pham}</div>
          <h1>{san_pham.ten_san_pham}</h1>
          {Number(san_pham.so_luong_danh_gia ?? 0) > 0 && <div className="detail-rating"><span>★ {Number(san_pham.diem_danh_gia ?? 0).toFixed(1)}</span><small>{san_pham.so_luong_danh_gia} đánh giá đã duyệt</small></div>}
          <p className="product-detail-description">{san_pham.mo_ta_ngan}</p>
          <div className="detail-price">{vnd.format(gia)}</div>

          <div className="default-product-config">
            <span>Cấu hình mặc định</span>
            <b>{bien_the?.vat_lieu?.ten_vat_lieu || "Tiêu chuẩn"}</b>
            <small>Hệ thống tự chọn cấu hình còn hàng để đặt mua.</small>
          </div>

          <div className="quantity-block">
            <label>Số lượng</label>
            <div className="quantity-control"><button onClick={() => setSoLuong(x => Math.max(1, x - 1))}>−</button><b>{so_luong}</b><button onClick={() => setSoLuong(x => Math.min(Math.max(1, ton), x + 1))}>+</button></div>
            <span>{ton > 0 ? `Còn ${ton} sản phẩm` : "Sản phẩm đang hết hàng"}</span>
          </div>

          {thong_bao && <div className="inline-message">{thong_bao}</div>}
          <div className="detail-actions detail-actions-v230">
            <button className="checkout-button" onClick={themVaoGio} disabled={dang_them || !bien_the || ton <= 0}>{dang_them ? "Đang thêm…" : `Thêm ${so_luong} vào giỏ`}</button>
            <Link className="secondary detail-cart-link" href="/gio-hang">Xem giỏ hàng</Link>
            <button className={da_yeu_thich ? "secondary favorite-detail active" : "secondary favorite-detail"} onClick={doiYeuThich}>{da_yeu_thich ? "♥ Đã yêu thích" : "♡ Yêu thích"}</button>
          </div>
          <div className="detail-assurances"><span>✓ Dùng cấu hình sản phẩm mặc định</span><span>✓ Tồn kho được kiểm tra tự động</span><span>✓ Giỏ hàng lưu đúng cấu hình sản phẩm</span></div>
        </div>
      </div>
      <DanhGiaSanPham duong_dan={san_pham.duong_dan}/>
      <GoiYSanPham san_pham={san_pham}/>
    </section>
  </main>;
}
