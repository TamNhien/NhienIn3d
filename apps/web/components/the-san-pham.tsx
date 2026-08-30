"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import type { SanPham } from "../lib/du-lieu-mau";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export function TheSanPham({
  sp,
  i,
  daYeuThich = false,
  onYeuThich
}: {
  sp: SanPham;
  i: number;
  daYeuThich?: boolean;
  onYeuThich?: (sp: SanPham) => void;
}) {
  const router = useRouter();
  const bien_the = sp.bien_the?.find(x => x.so_luong_ton > 0) ?? sp.bien_the?.[0];
  const gia = Number(sp.gia_ban) + Number(bien_the?.gia_chenh_lech ?? 0);
  const tong_ton = sp.bien_the?.reduce((tong, bt) => tong + Math.max(0, bt.so_luong_ton), 0) ?? 0;
  const con_hang = tong_ton > 0;
  const moChiTiet = () => router.push(`/san-pham/${encodeURIComponent(sp.duong_dan)}`);
  const xemChiTiet = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    moChiTiet();
  };
  const yeuThich = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onYeuThich?.(sp);
  };

  return <motion.article
    className="product-card product-card-clickable"
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: .15 }}
    transition={{ delay: Math.min(i * .04, .3) }}
    whileHover={{ y: -8 }}
    onClick={moChiTiet}
    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") moChiTiet(); }}
    role="link"
    tabIndex={0}
    aria-label={`Xem chi tiết ${sp.ten_san_pham}`}
  >
    <div className="image-wrap">
      <img src={sp.hinh_anh?.[0]?.duong_dan_anh} alt={sp.ten_san_pham} loading="lazy" referrerPolicy="no-referrer"/>
      <span className="chip">In 3D</span>
      {onYeuThich && <button className={daYeuThich ? "favorite-button active" : "favorite-button"} onClick={yeuThich} aria-label={daYeuThich ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}>{daYeuThich ? "♥" : "♡"}</button>}
    </div>
    <div className="product-body">
      <div className="sku">{sp.ma_san_pham}</div>
      {Number(sp.so_luong_danh_gia ?? 0) > 0 && <div className="card-rating"><span>★ {Number(sp.diem_danh_gia ?? 0).toFixed(1)}</span><small>({sp.so_luong_danh_gia})</small></div>}
      <h3>{sp.ten_san_pham}</h3>
      <p>{sp.mo_ta_ngan}</p>
      <div className="meta">
        <span>⏱ {sp.thoi_gian_in_gio} giờ</span>
        <span>⚖ {sp.khoi_luong_gam} g</span>
        {bien_the?.vat_lieu && <span>◈ {bien_the.vat_lieu.ten_vat_lieu}</span>}
      </div>
      <div className="stock-row"><span className={con_hang ? "stock-ok" : "stock-out"}>{con_hang ? `Còn ${tong_ton}` : "Hết hàng"}</span><span>Xem chi tiết sản phẩm →</span></div>
      <div className="price-row">
        <strong>{vnd.format(gia)}</strong>
        <button className="add-cart" onClick={xemChiTiet}>Xem chi tiết →</button>
      </div>
    </div>
  </motion.article>;
}
