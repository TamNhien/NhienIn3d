"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Hero3D } from "../components/hero-3d";
import { ThanhDieuHuong } from "../components/thanh-dieu-huong";
import { TheSanPham } from "../components/the-san-pham";
import { DU_LIEU_MAU, type SanPham } from "../lib/du-lieu-mau";
import { API_URL, themBienTheVaoGio } from "../lib/gio-hang";

export default function TrangChu() {
  const [san_pham, setSanPham] = useState<SanPham[]>(DU_LIEU_MAU);
  const [tim, setTim] = useState("");
  const [dang_them, setDangThem] = useState<string | null>(null);
  const [thong_bao, setThongBao] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/san-pham`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setSanPham)
      .catch(() => {});
  }, []);

  const hien_thi = useMemo(
    () => san_pham.filter(x => x.ten_san_pham.toLocaleLowerCase("vi").includes(tim.toLocaleLowerCase("vi"))),
    [san_pham, tim]
  );

  async function themVaoGio(sp: SanPham) {
    const bien_the = sp.bien_the?.[0];
    if (!bien_the) {
      setThongBao("Sản phẩm chưa có biến thể để thêm vào giỏ.");
      return;
    }
    try {
      setDangThem(sp.ma_san_pham);
      setThongBao("");
      await themBienTheVaoGio(bien_the.ma_bien_the, 1);
      setThongBao(`Đã thêm “${sp.ten_san_pham}” vào giỏ. Bạn có thể tiếp tục mua hoặc mở giỏ hàng.`);
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Không thể thêm sản phẩm");
    } finally {
      setDangThem(null);
    }
  }

  return <main>
    <ThanhDieuHuong />

    <section className="hero">
      <div className="hero-copy">
        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.08}}>Thiết kế khác biệt.<br/><span>Đặt hàng thật nhanh.</span></motion.h1>
        <div className="hero-actions">
          <a className="primary" href="#san-pham">Mua sản phẩm</a>
          <Link className="secondary" href="/gio-hang">Mở giỏ hàng</Link>
        </div>
        <div className="stats">
          <div><b>10</b><span>Sản phẩm mẫu</span></div>
          <div><b>17+</b><span>Bảng nghiệp vụ</span></div>
          <div><b>Local</b><span>Thanh toán giả lập</span></div>
        </div>
      </div>
      <Hero3D/>
    </section>

    <section className="strip">
      <span>PLA</span><i>•</i><span>PETG</span><i>•</i><span>ABS</span><i>•</i><span>TPU</span><i>•</i>
      <span>Chi tiết sản phẩm</span><i>•</i><span>Giỏ hàng</span><i>•</i><span>Checkout</span><i>•</i><span>PostgreSQL</span>
    </section>

    {thong_bao && <div className="toast toast-with-action" role="status"><span>{thong_bao}</span><Link href="/gio-hang">Xem giỏ</Link></div>}

    <section id="san-pham" className="products section">
      <div className="section-head">
        <div>
          <div className="eyebrow">BỘ SƯU TẬP</div>
          <h2>Sản phẩm nổi bật</h2>
          <p>Nhấp vào sản phẩm để xem đầy đủ thông tin, chọn biến thể và số lượng trước khi thêm vào giỏ hàng.</p>
        </div>
        <input value={tim} onChange={e=>setTim(e.target.value)} placeholder="Tìm sản phẩm…" />
      </div>
      <div className="grid">
        {hien_thi.map((sp,i)=><TheSanPham key={sp.ma_san_pham} sp={sp} i={i} onThem={themVaoGio} dangThem={dang_them===sp.ma_san_pham}/>)}
      </div>
    </section>

    <footer>
      <Link className="brand" href="/">Nhien<span>In3d</span></Link>
      <p>© 2026 NhienIn3d • Sản phẩm in 3D theo yêu cầu.</p>
    </footer>
  </main>;
}
