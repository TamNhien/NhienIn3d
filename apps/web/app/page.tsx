"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Hero3D } from "../components/hero-3d";
import { TheSanPham } from "../components/the-san-pham";
import { DU_LIEU_MAU, type SanPham } from "../lib/du-lieu-mau";

export default function TrangChu() {
  const [san_pham, setSanPham] = useState<SanPham[]>(DU_LIEU_MAU);
  const [tim, setTim] = useState("");
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    fetch(`${api}/san-pham`, { credentials: "include" }).then(r => r.ok ? r.json() : Promise.reject()).then(setSanPham).catch(() => {});
  }, []);
  const hien_thi = useMemo(() => san_pham.filter(x => x.ten_san_pham.toLocaleLowerCase("vi").includes(tim.toLocaleLowerCase("vi"))), [san_pham, tim]);
  return <main>
    <nav className="nav"><a className="brand" href="#">Nhien<span>In3d</span></a><div className="navlinks"><a href="#san-pham">Sản phẩm</a><a href="#cong-nghe">Công nghệ</a><a href="#bao-mat">Bảo mật</a></div><button className="navbtn">In theo yêu cầu ↗</button></nav>
    <section className="hero"><div className="hero-copy"><motion.div className="eyebrow" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>✦ Từ ý tưởng đến vật thể thật</motion.div><motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.08}}>Thiết kế khác biệt.<br/><span>In 3D thật chất.</span></motion.h1><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.2}}>NhienIn3d biến ý tưởng thành sản phẩm có thể cầm trên tay — tùy chọn vật liệu, màu sắc và kích thước theo nhu cầu.</motion.p><div className="hero-actions"><a className="primary" href="#san-pham">Khám phá sản phẩm</a><a className="secondary" href="#cong-nghe">Xem công nghệ 3D</a></div><div className="stats"><div><b>10+</b><span>Mẫu V1</span></div><div><b>4</b><span>Vật liệu</span></div><div><b>360°</b><span>Tương tác 3D</span></div></div></div><Hero3D/></section>
    <section className="strip"><span>PLA</span><i>•</i><span>PETG</span><i>•</i><span>ABS</span><i>•</i><span>TPU</span><i>•</i><span>Thiết kế tùy chỉnh</span><i>•</i><span>In theo yêu cầu</span></section>
    <section id="san-pham" className="products section"><div className="section-head"><div><div className="eyebrow">BỘ SƯU TẬP V1</div><h2>Sản phẩm nổi bật</h2><p>10 sản phẩm mẫu có thông số, ảnh tham khảo và dữ liệu tiếng Việt đầy đủ.</p></div><input value={tim} onChange={e=>setTim(e.target.value)} placeholder="Tìm sản phẩm…" /></div><div className="grid">{hien_thi.map((sp,i)=><TheSanPham key={sp.ma_san_pham} sp={sp} i={i}/>)}</div></section>
    <section id="cong-nghe" className="section tech"><div><div className="eyebrow">CÔNG NGHỆ</div><h2>Web hiện đại từ lõi đến trải nghiệm.</h2><p>Next.js, React, Three.js và Motion tạo trải nghiệm mượt, còn NestJS + Fastify + PostgreSQL phụ trách API và dữ liệu.</p></div><div className="tech-grid"><div><b>Next.js 16</b><span>Storefront tốc độ cao</span></div><div><b>Three.js</b><span>Trải nghiệm 3D tương tác</span></div><div><b>NestJS 12</b><span>API TypeScript có cấu trúc</span></div><div><b>PostgreSQL 18</b><span>Dữ liệu UTF-8 bền vững</span></div></div></section>
    <section id="bao-mat" className="security section"><div className="lock">⌾</div><div><div className="eyebrow">SECURITY BY DEFAULT</div><h2>Bảo mật được xây từ V1.</h2><p>Argon2id, cookie HttpOnly, CORS giới hạn, rate limiting, security headers, audit log và tài khoản database riêng cho ứng dụng.</p></div></section>
    <footer><a className="brand">Nhien<span>In3d</span></a><p>© 2026 NhienIn3d • Sản phẩm in 3D theo yêu cầu.</p><span>V1.0.7</span></footer>
  </main>;
}
