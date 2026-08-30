"use client";

import { useEffect, useMemo, useState } from "react";
import { TheSanPham } from "../../components/the-san-pham";
import { DU_LIEU_MAU, type SanPham } from "../../lib/du-lieu-mau";
import { API_URL } from "../../lib/gio-hang";
import { layDanhSachYeuThich, themYeuThich, xoaYeuThich } from "../../lib/yeu-thich";

type DanhMuc = { ma_danh_muc: string; ten_danh_muc: string; duong_dan: string };

export default function DanhSachSanPhamPage() {
  const [san_pham, setSanPham] = useState<SanPham[]>(DU_LIEU_MAU);
  const [danh_muc, setDanhMuc] = useState<DanhMuc[]>([]);
  const [tim, setTim] = useState("");
  const [loc_danh_muc, setLocDanhMuc] = useState("");
  const [sap_xep, setSapXep] = useState("ma_tang");
  const [gia_tu, setGiaTu] = useState("");
  const [gia_den, setGiaDen] = useState("");
  const [chi_con_hang, setChiConHang] = useState(false);
  const [dang_tai, setDangTai] = useState(false);
  const [api_san_sang, setApiSanSang] = useState(false);
  const [yeu_thich, setYeuThich] = useState<Set<string>>(new Set());
  const [thong_bao, setThongBao] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/danh-muc`).then(r => r.ok ? r.json() : []).then(setDanhMuc).catch(() => {});
    layDanhSachYeuThich().then(ds => setYeuThich(new Set(ds.map(x => x.san_pham.ma_san_pham)))).catch(() => {});
  }, []);

  useEffect(() => {
    const bo_dem = window.setTimeout(() => {
      const query = new URLSearchParams();
      if (tim.trim()) query.set("tim_kiem", tim.trim());
      if (loc_danh_muc) query.set("danh_muc", loc_danh_muc);
      if (chi_con_hang) query.set("con_hang", "true");
      if (gia_tu) query.set("gia_tu", gia_tu);
      if (gia_den) query.set("gia_den", gia_den);
      query.set("sap_xep", sap_xep);
      setDangTai(true);
      fetch(`${API_URL}/san-pham?${query.toString()}`, { credentials: "include", cache: "no-store" })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((du_lieu: SanPham[]) => { setSanPham(du_lieu); setApiSanSang(true); })
        .catch(() => setApiSanSang(false))
        .finally(() => setDangTai(false));
    }, 220);
    return () => window.clearTimeout(bo_dem);
  }, [tim, loc_danh_muc, sap_xep, chi_con_hang, gia_tu, gia_den]);

  const fallback = useMemo(() => {
    let ds = [...DU_LIEU_MAU];
    if (tim.trim()) ds = ds.filter(x => `${x.ten_san_pham} ${x.ma_san_pham} ${x.mo_ta_ngan}`.toLocaleLowerCase("vi").includes(tim.trim().toLocaleLowerCase("vi")));
    if (chi_con_hang) ds = ds.filter(x => x.bien_the?.some(bt => bt.so_luong_ton > 0));
    if (gia_tu) ds = ds.filter(x => Number(x.gia_ban) >= Number(gia_tu));
    if (gia_den) ds = ds.filter(x => Number(x.gia_ban) <= Number(gia_den));
    if (sap_xep === "ma_tang") ds.sort((a,b)=>Number(a.ma_san_pham.match(/-(\d+)$/)?.[1] ?? 999999)-Number(b.ma_san_pham.match(/-(\d+)$/)?.[1] ?? 999999));
    if (sap_xep === "gia_tang") ds.sort((a,b)=>Number(a.gia_ban)-Number(b.gia_ban));
    if (sap_xep === "gia_giam") ds.sort((a,b)=>Number(b.gia_ban)-Number(a.gia_ban));
    if (sap_xep === "ten_az") ds.sort((a,b)=>a.ten_san_pham.localeCompare(b.ten_san_pham, "vi"));
    return ds;
  }, [tim, chi_con_hang, sap_xep, gia_tu, gia_den]);
  const hien_thi = api_san_sang ? san_pham : fallback;

  async function doiYeuThich(sp: SanPham) {
    const dang_co = yeu_thich.has(sp.ma_san_pham);
    try {
      if (dang_co) await xoaYeuThich(sp.ma_san_pham); else await themYeuThich(sp.ma_san_pham);
      setYeuThich(cu => { const moi = new Set(cu); dang_co ? moi.delete(sp.ma_san_pham) : moi.add(sp.ma_san_pham); return moi; });
    } catch (loi) { setThongBao(loi instanceof Error ? loi.message : "Không thể cập nhật yêu thích"); }
  }

  return <main>
    <section className="page-shell catalog-page">
      <div className="catalog-heading">
        <div><div className="eyebrow">DANH MỤC SẢN PHẨM</div><h1>Khám phá sản phẩm in 3D</h1><p>Tìm theo tên/mã, lọc danh mục và tồn kho, rồi sắp xếp theo nhu cầu.</p></div>
        <div className="catalog-count">{dang_tai ? "Đang tải…" : `${hien_thi.length} sản phẩm`}</div>
      </div>

      <div className="catalog-toolbar">
        <input className="catalog-search" value={tim} onChange={e=>setTim(e.target.value)} placeholder="Tìm tên, mã hoặc mô tả…"/>
        <select value={loc_danh_muc} onChange={e=>setLocDanhMuc(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {danh_muc.map(dm=><option key={dm.ma_danh_muc} value={dm.duong_dan}>{dm.ten_danh_muc}</option>)}
        </select>
        <input className="price-filter" inputMode="numeric" value={gia_tu} onChange={e=>setGiaTu(e.target.value.replace(/\D/g, ""))} placeholder="Giá từ (đ)"/>
        <input className="price-filter" inputMode="numeric" value={gia_den} onChange={e=>setGiaDen(e.target.value.replace(/\D/g, ""))} placeholder="Giá đến (đ)"/>
        <select value={sap_xep} onChange={e=>setSapXep(e.target.value)}>
          <option value="ma_tang">Mã sản phẩm tăng dần</option>
          <option value="moi_nhat">Mới nhất</option>
          <option value="gia_tang">Giá thấp → cao</option>
          <option value="gia_giam">Giá cao → thấp</option>
          <option value="ten_az">Tên A → Z</option>
        </select>
        <label className="stock-filter"><input type="checkbox" checked={chi_con_hang} onChange={e=>setChiConHang(e.target.checked)}/><span>Chỉ còn hàng</span></label>
      </div>

      {thong_bao && <div className="inline-message catalog-message">{thong_bao}</div>}
      {hien_thi.length ? <div className="grid catalog-grid">
        {hien_thi.map((sp,i)=><TheSanPham key={sp.ma_san_pham} sp={sp} i={i} daYeuThich={yeu_thich.has(sp.ma_san_pham)} onYeuThich={doiYeuThich}/>) }
      </div> : <div className="empty-state catalog-empty"><h2>Không tìm thấy sản phẩm phù hợp</h2><p>Thử xóa bớt bộ lọc hoặc dùng từ khóa khác.</p><button className="secondary secondary-button" onClick={()=>{setTim("");setLocDanhMuc("");setChiConHang(false);setGiaTu("");setGiaDen("");setSapXep("ma_tang");}}>Xóa bộ lọc</button></div>}
    </section>
  </main>;
}
