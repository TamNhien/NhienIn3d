"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThanhDieuHuong } from "../../../components/thanh-dieu-huong";
import { API_URL, themBienTheVaoGio } from "../../../lib/gio-hang";
import { DU_LIEU_MAU, type SanPham } from "../../../lib/du-lieu-mau";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function ChiTietSanPhamPage() {
  const params = useParams<{ duong_dan: string }>();
  const duong_dan = decodeURIComponent(params.duong_dan);
  const fallback = DU_LIEU_MAU.find(x => x.duong_dan === duong_dan) ?? null;
  const [san_pham, setSanPham] = useState<SanPham | null>(fallback);
  const [ma_bien_the, setMaBienThe] = useState(fallback?.bien_the?.[0]?.ma_bien_the ?? "");
  const [so_luong, setSoLuong] = useState(1);
  const [dang_them, setDangThem] = useState(false);
  const [thong_bao, setThongBao] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/san-pham/${encodeURIComponent(duong_dan)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((du_lieu: SanPham) => {
        setSanPham(du_lieu);
        setMaBienThe(du_lieu.bien_the?.[0]?.ma_bien_the ?? "");
      })
      .catch(() => {});
  }, [duong_dan]);

  const bien_the = useMemo(() => san_pham?.bien_the?.find(x => x.ma_bien_the === ma_bien_the) ?? san_pham?.bien_the?.[0], [san_pham, ma_bien_the]);
  const gia = Number(san_pham?.gia_ban ?? 0) + Number(bien_the?.gia_chenh_lech ?? 0);
  const ton = bien_the?.so_luong_ton ?? 0;

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

  if (!san_pham) return <main><ThanhDieuHuong/><section className="page-shell"><div className="empty-state"><h1>Không tìm thấy sản phẩm</h1><Link className="primary" href="/#san-pham">Quay lại sản phẩm</Link></div></section></main>;

  return <main>
    <ThanhDieuHuong/>
    <section className="page-shell product-detail-page">
      <div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><Link href="/#san-pham">Sản phẩm</Link><span>/</span><b>{san_pham.ten_san_pham}</b></div>
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-main-image"><img src={san_pham.hinh_anh?.[0]?.duong_dan_anh} alt={san_pham.ten_san_pham} referrerPolicy="no-referrer"/></div>
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
          <p className="product-detail-description">{san_pham.mo_ta_ngan}</p>
          <div className="detail-price">{vnd.format(gia)}</div>

          {!!san_pham.bien_the?.length && <div className="variant-block">
            <label>Biến thể / vật liệu / màu sắc</label>
            <div className="variant-options">
              {san_pham.bien_the.map(bt => <button key={bt.ma_bien_the} className={bt.ma_bien_the === bien_the?.ma_bien_the ? "variant-option active" : "variant-option"} onClick={() => { setMaBienThe(bt.ma_bien_the); setSoLuong(1); }} disabled={bt.so_luong_ton <= 0}>
                <span>{bt.vat_lieu?.ten_vat_lieu || "Tiêu chuẩn"}</span>
                <small><i style={{background: bt.mau_sac?.ma_hex || "#fff"}}/>{bt.mau_sac?.ten_mau || "Màu tiêu chuẩn"} • còn {bt.so_luong_ton}</small>
              </button>)}
            </div>
          </div>}

          <div className="quantity-block">
            <label>Số lượng</label>
            <div className="quantity-control"><button onClick={() => setSoLuong(x => Math.max(1, x - 1))}>−</button><b>{so_luong}</b><button onClick={() => setSoLuong(x => Math.min(Math.max(1, ton), x + 1))}>+</button></div>
            <span>{ton > 0 ? `Còn ${ton} sản phẩm` : "Hết hàng"}</span>
          </div>

          {thong_bao && <div className="inline-message">{thong_bao}</div>}
          <div className="detail-actions">
            <button className="checkout-button" onClick={themVaoGio} disabled={dang_them || !bien_the || ton <= 0}>{dang_them ? "Đang thêm…" : `Thêm ${so_luong} vào giỏ`}</button>
            <Link className="secondary detail-cart-link" href="/gio-hang">Xem giỏ hàng</Link>
          </div>
          <div className="detail-assurances"><span>✓ Kiểm tra tồn kho tại server</span><span>✓ Dữ liệu giỏ lưu PostgreSQL</span><span>✓ Thanh toán giả lập chỉ dành cho local</span></div>
        </div>
      </div>
    </section>
  </main>;
}
