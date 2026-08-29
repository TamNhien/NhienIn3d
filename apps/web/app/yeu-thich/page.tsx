"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThanhDieuHuong } from "../../components/thanh-dieu-huong";
import { TheSanPham } from "../../components/the-san-pham";
import type { SanPham } from "../../lib/du-lieu-mau";
import { themBienTheVaoGio } from "../../lib/gio-hang";
import { layDanhSachYeuThich, xoaYeuThich } from "../../lib/yeu-thich";

export default function YeuThichPage() {
  const [san_pham, setSanPham] = useState<SanPham[]>([]);
  const [dang_tai, setDangTai] = useState(true);
  const [dang_them, setDangThem] = useState<string | null>(null);
  const [thong_bao, setThongBao] = useState("");

  async function tai() {
    try { const ds = await layDanhSachYeuThich(); setSanPham(ds.map(x => x.san_pham)); }
    catch { setSanPham([]); }
    finally { setDangTai(false); }
  }
  useEffect(() => { void tai(); }, []);

  async function themVaoGio(sp: SanPham) {
    const bt = sp.bien_the?.find(x => x.so_luong_ton > 0);
    if (!bt) return setThongBao("Sản phẩm hiện đã hết hàng.");
    try { setDangThem(sp.ma_san_pham); await themBienTheVaoGio(bt.ma_bien_the, 1); setThongBao(`Đã thêm “${sp.ten_san_pham}” vào giỏ.`); }
    catch (loi) { setThongBao(loi instanceof Error ? loi.message : "Không thể thêm vào giỏ"); }
    finally { setDangThem(null); }
  }

  async function boYeuThich(sp: SanPham) {
    await xoaYeuThich(sp.ma_san_pham);
    setSanPham(ds => ds.filter(x => x.ma_san_pham !== sp.ma_san_pham));
  }

  return <main><ThanhDieuHuong/><section className="page-shell favorites-page">
    <div className="page-title-row"><div><div className="eyebrow">YÊU THÍCH</div><h1>Sản phẩm đã lưu</h1><p>Lưu sản phẩm bằng mã phiên ngẫu nhiên; dữ liệu được giữ trong PostgreSQL.</p></div><Link className="secondary" href="/san-pham">Khám phá sản phẩm</Link></div>
    {thong_bao && <div className="inline-message">{thong_bao}</div>}
    {dang_tai ? <div className="empty-state"><p>Đang tải danh sách yêu thích…</p></div> : san_pham.length ? <div className="grid catalog-grid">{san_pham.map((sp,i)=><TheSanPham key={sp.ma_san_pham} sp={sp} i={i} onThem={themVaoGio} dangThem={dang_them===sp.ma_san_pham} daYeuThich onYeuThich={boYeuThich}/>)}</div> : <div className="empty-state"><h2>Chưa có sản phẩm yêu thích</h2><p>Nhấn biểu tượng trái tim trên sản phẩm để lưu lại.</p><Link className="primary" href="/san-pham">Xem sản phẩm</Link></div>}
  </section></main>;
}
