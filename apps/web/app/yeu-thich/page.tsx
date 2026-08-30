"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TheSanPham } from "../../components/the-san-pham";
import type { SanPham } from "../../lib/du-lieu-mau";
import { layDanhSachYeuThich, xoaYeuThich } from "../../lib/yeu-thich";

export default function YeuThichPage() {
  const [san_pham, setSanPham] = useState<SanPham[]>([]);
  const [dang_tai, setDangTai] = useState(true);
  const [thong_bao, setThongBao] = useState("");

  async function tai() {
    try { const ds = await layDanhSachYeuThich(); setSanPham(ds.map(x => x.san_pham)); }
    catch { setSanPham([]); }
    finally { setDangTai(false); }
  }
  useEffect(() => { void tai(); }, []);

  async function boYeuThich(sp: SanPham) {
    await xoaYeuThich(sp.ma_san_pham);
    setSanPham(ds => ds.filter(x => x.ma_san_pham !== sp.ma_san_pham));
  }

  const san_pham_tang_dan = [...san_pham].sort((a,b) => Number(a.ma_san_pham.match(/-(\d+)$/)?.[1] ?? 999999) - Number(b.ma_san_pham.match(/-(\d+)$/)?.[1] ?? 999999));

  return <main><section className="page-shell favorites-page">
    <div className="page-title-row"><div><div className="eyebrow">YÊU THÍCH</div><h1>Sản phẩm đã lưu</h1><p>Lưu sản phẩm bằng mã phiên ngẫu nhiên; dữ liệu được giữ trong PostgreSQL.</p></div><Link className="secondary" href="/san-pham">Khám phá sản phẩm</Link></div>
    {thong_bao && <div className="inline-message">{thong_bao}</div>}
    {dang_tai ? <div className="empty-state"><p>Đang tải danh sách yêu thích…</p></div> : san_pham_tang_dan.length ? <div className="grid catalog-grid">{san_pham_tang_dan.map((sp,i)=><TheSanPham key={sp.ma_san_pham} sp={sp} i={i} daYeuThich onYeuThich={boYeuThich}/>)}</div> : <div className="empty-state"><h2>Chưa có sản phẩm yêu thích</h2><p>Nhấn biểu tượng trái tim trên sản phẩm để lưu lại.</p><Link className="primary" href="/san-pham">Xem sản phẩm</Link></div>}
  </section></main>;
}
