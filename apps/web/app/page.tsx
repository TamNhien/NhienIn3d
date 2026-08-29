"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Hero3D } from "../components/hero-3d";
import { ThanhDieuHuong } from "../components/thanh-dieu-huong";
import { TheSanPham } from "../components/the-san-pham";
import { DU_LIEU_MAU, type SanPham } from "../lib/du-lieu-mau";
import { API_URL } from "../lib/gio-hang";

export default function TrangChu() {
  const [san_pham, setSanPham] = useState<SanPham[]>(DU_LIEU_MAU);
  const [tim, setTim] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/san-pham`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setSanPham)
      .catch(() => {});
  }, []);

  const hien_thi = useMemo(() => {
    const soThuTu = (ma: string) => Number(ma.match(/-(\d+)$/)?.[1] ?? 999999);
    return san_pham
      .filter(x => x.ten_san_pham.toLocaleLowerCase("vi").includes(tim.toLocaleLowerCase("vi")))
      .sort((a, b) => soThuTu(a.ma_san_pham) - soThuTu(b.ma_san_pham));
  }, [san_pham, tim]);

  return <main>
    <ThanhDieuHuong />

    <section className="hero">
      <div className="hero-copy">
        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.08}}>Thiết kế khác biệt.<br/><span>Đặt hàng thật nhanh.</span></motion.h1>
        <div className="hero-actions">
          <Link className="primary" href="/san-pham">Mua sản phẩm</Link>
          <Link className="secondary" href="/gio-hang">Mở giỏ hàng</Link>
        </div>
        <div className="stats">
          <div><b>10</b><span>Sản phẩm mẫu</span></div>
          <div><b>19+</b><span>Bảng nghiệp vụ</span></div>
          <div><b>Local</b><span>Thanh toán giả lập</span></div>
        </div>
      </div>
      <Hero3D/>
    </section>



    <section id="san-pham" className="products section">
      <div className="section-head">
        <div>
          <div className="eyebrow">BỘ SƯU TẬP</div>
          <h2>Sản phẩm nổi bật</h2>
          <p>Nhấp vào sản phẩm để xem đầy đủ thông tin, chọn màu sắc và số lượng trước khi thêm vào giỏ hàng.</p>
        </div>
        <div className="home-product-actions"><input value={tim} onChange={e=>setTim(e.target.value)} placeholder="Tìm sản phẩm…" /><Link className="secondary" href="/san-pham">Xem tất cả</Link></div>
      </div>
      <div className="grid">
        {hien_thi.map((sp,i)=><TheSanPham key={sp.ma_san_pham} sp={sp} i={i}/>)}
      </div>
    </section>

    <footer>
      <Link className="brand" href="/">Nhien<span>In3d</span></Link>
      <p>© 2026 NhienIn3d • Sản phẩm in 3D theo yêu cầu.</p>
    </footer>
  </main>;
}
