"use client";
import { motion } from "motion/react";
import type { SanPham } from "../lib/du-lieu-mau";
const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
export function TheSanPham({ sp, i }: { sp: SanPham; i: number }) {
  return <motion.article className="product-card" initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.15}} transition={{delay:Math.min(i*.04,.3)}} whileHover={{y:-8}}>
    <div className="image-wrap"><img src={sp.hinh_anh?.[0]?.duong_dan_anh} alt={sp.ten_san_pham} loading="lazy" referrerPolicy="no-referrer"/><span className="chip">In 3D</span></div>
    <div className="product-body"><div className="sku">{sp.ma_san_pham}</div><h3>{sp.ten_san_pham}</h3><p>{sp.mo_ta_ngan}</p><div className="meta"><span>⏱ {sp.thoi_gian_in_gio} giờ</span><span>⚖ {sp.khoi_luong_gam} g</span></div><div className="price-row"><strong>{vnd.format(Number(sp.gia_ban))}</strong><button>Chi tiết</button></div></div>
  </motion.article>;
}
