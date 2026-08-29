"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import type { SanPham } from "../lib/du-lieu-mau";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export function TheSanPham({
  sp,
  i,
  onThem,
  dangThem
}: {
  sp: SanPham;
  i: number;
  onThem: (sp: SanPham) => void;
  dangThem?: boolean;
}) {
  const router = useRouter();
  const bien_the = sp.bien_the?.[0];
  const gia = Number(sp.gia_ban) + Number(bien_the?.gia_chenh_lech ?? 0);
  const con_hang = !bien_the || bien_the.so_luong_ton > 0;
  const moChiTiet = () => router.push(`/san-pham/${encodeURIComponent(sp.duong_dan)}`);
  const them = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onThem(sp);
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
      {bien_the?.mau_sac && <span className="color-chip"><i style={{ background: bien_the.mau_sac.ma_hex }}/>{bien_the.mau_sac.ten_mau}</span>}
    </div>
    <div className="product-body">
      <div className="sku">{sp.ma_san_pham}</div>
      <h3>{sp.ten_san_pham}</h3>
      <p>{sp.mo_ta_ngan}</p>
      <div className="meta">
        <span>⏱ {sp.thoi_gian_in_gio} giờ</span>
        <span>⚖ {sp.khoi_luong_gam} g</span>
        {bien_the?.vat_lieu && <span>◈ {bien_the.vat_lieu.ten_vat_lieu}</span>}
      </div>
      <div className="product-detail-hint">Xem chi tiết sản phẩm →</div>
      <div className="price-row">
        <strong>{vnd.format(gia)}</strong>
        <button className="add-cart" onClick={them} disabled={dangThem || !con_hang}>
          {dangThem ? "Đang thêm…" : con_hang ? "Thêm vào giỏ +" : "Hết hàng"}
        </button>
      </div>
    </div>
  </motion.article>;
}
