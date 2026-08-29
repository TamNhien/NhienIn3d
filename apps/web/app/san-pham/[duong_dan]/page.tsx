"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ThanhDieuHuong } from "../../../components/thanh-dieu-huong";
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
  const [ma_bien_the, setMaBienThe] = useState(fallback?.bien_the?.[0]?.ma_bien_the ?? "");
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
        const dau_tien_con_hang = du_lieu.bien_the?.find(x => x.so_luong_ton > 0) ?? du_lieu.bien_the?.[0];
        setMaBienThe(dau_tien_con_hang?.ma_bien_the ?? "");
      })
      .catch(() => {});
  }, [duong_dan]);

  const bien_the = useMemo(() => san_pham?.bien_the?.find(x => x.ma_bien_the === ma_bien_the) ?? san_pham?.bien_the?.[0], [san_pham, ma_bien_the]);
  const gia = Number(san_pham?.gia_ban ?? 0) + Number(bien_the?.gia_chenh_lech ?? 0);
  const ton = bien_the?.so_luong_ton ?? 0;
  const mau_xem_truoc = bien_the?.mau_sac?.ma_hex || "#FFFFFF";
  const ma_mau = mau_xem_truoc.toUpperCase();
  const che_do_hoa_mau: CSSProperties["mixBlendMode"] = ma_mau === "#111827" ? "multiply" : ma_mau === "#F8FAFC" ? "screen" : "color";
  const do_mo_mau = ma_mau === "#111827" ? 0.64 : ma_mau === "#F8FAFC" ? 0.28 : 0.58;

  async function themVaoGio() {
    if (!bien_the) return;
    try {
      setDangThem(true);
      setThongBao("");
      await themBienTheVaoGio(bien_the.ma_bien_the, so_luong);
      setThongBao(`Đã thêm ${so_luong} sản phẩm màu ${bien_the.mau_sac?.ten_mau || "đã chọn"} vào giỏ hàng.`);
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

  if (!san_pham) return <main><ThanhDieuHuong/><section className="page-shell"><div className="empty-state"><h1>Không tìm thấy sản phẩm</h1><Link className="primary" href="/san-pham">Quay lại sản phẩm</Link></div></section></main>;

  return <main>
    <ThanhDieuHuong/>
    <section className="page-shell product-detail-page">
      <div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><Link href="/san-pham">Sản phẩm</Link><span>/</span><b>{san_pham.ten_san_pham}</b></div>
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-main-image product-detail-photo colorized-product-preview">
            {san_pham.hinh_anh?.[0]?.duong_dan_anh ? <>
              <img src={san_pham.hinh_anh[0].duong_dan_anh} alt={`${san_pham.ten_san_pham} - ${bien_the?.mau_sac?.ten_mau || "màu tiêu chuẩn"}`} referrerPolicy="no-referrer"/>
              {bien_the?.mau_sac && <span className="product-color-tint" aria-hidden="true" style={{ backgroundColor: mau_xem_truoc, mixBlendMode: che_do_hoa_mau, opacity: do_mo_mau }}/>}
              {bien_the?.mau_sac && <span className="color-preview-badge"><i style={{ background: mau_xem_truoc }}/>{bien_the.mau_sac.ten_mau} · xem trước màu</span>}
            </> : <div className="product-image-empty">Chưa có ảnh sản phẩm</div>}
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

          {!!san_pham.bien_the?.length && <div className="variant-block color-variant-block">
            <label>Chọn màu sắc</label>
            <div className="color-options" role="list" aria-label="Màu sắc sản phẩm">
              {san_pham.bien_the.map(bt => <button
                key={bt.ma_bien_the}
                type="button"
                className={bt.ma_bien_the === bien_the?.ma_bien_the ? "color-option active" : "color-option"}
                onClick={() => { setMaBienThe(bt.ma_bien_the); setSoLuong(1); setThongBao(""); }}
                disabled={bt.so_luong_ton <= 0}
                aria-pressed={bt.ma_bien_the === bien_the?.ma_bien_the}
                title={`${bt.mau_sac?.ten_mau || "Màu tiêu chuẩn"} - còn ${bt.so_luong_ton}`}
              >
                <i className="color-swatch" style={{ background: bt.mau_sac?.ma_hex || "#ffffff" }}/>
                <span>{bt.mau_sac?.ten_mau || "Màu tiêu chuẩn"}</span>
                <small>{bt.so_luong_ton > 0 ? `Còn ${bt.so_luong_ton}` : "Hết"}</small>
              </button>)}
            </div>
            {bien_the && <div className="selected-variant-meta">
              <span>Màu đã chọn: <b>{bien_the.mau_sac?.ten_mau || "Màu tiêu chuẩn"}</b></span>
              <span>Vật liệu: <b>{bien_the.vat_lieu?.ten_vat_lieu || "Tiêu chuẩn"}</b></span>
              <span>Mã biến thể: <b>{bien_the.ma_bien_the}</b></span>
            </div>}
          </div>}

          <div className="quantity-block">
            <label>Số lượng</label>
            <div className="quantity-control"><button onClick={() => setSoLuong(x => Math.max(1, x - 1))}>−</button><b>{so_luong}</b><button onClick={() => setSoLuong(x => Math.min(Math.max(1, ton), x + 1))}>+</button></div>
            <span>{ton > 0 ? `Còn ${ton} sản phẩm với màu đã chọn` : "Màu này đang hết hàng"}</span>
          </div>

          {thong_bao && <div className="inline-message">{thong_bao}</div>}
          <div className="detail-actions detail-actions-v230">
            <button className="checkout-button" onClick={themVaoGio} disabled={dang_them || !bien_the || ton <= 0}>{dang_them ? "Đang thêm…" : `Thêm ${so_luong} vào giỏ`}</button>
            <Link className="secondary detail-cart-link" href="/gio-hang">Xem giỏ hàng</Link>
            <button className={da_yeu_thich ? "secondary favorite-detail active" : "secondary favorite-detail"} onClick={doiYeuThich}>{da_yeu_thich ? "♥ Đã yêu thích" : "♡ Yêu thích"}</button>
          </div>
          <div className="detail-assurances"><span>✓ Chọn đúng màu trước khi thêm vào giỏ</span><span>✓ Tồn kho được kiểm tra theo từng biến thể</span><span>✓ Giỏ hàng lưu đúng màu và vật liệu đã chọn</span></div>
        </div>
      </div>
      <DanhGiaSanPham duong_dan={san_pham.duong_dan}/>
      <GoiYSanPham san_pham={san_pham}/>
    </section>
  </main>;
}
