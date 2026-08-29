"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "../lib/gio-hang";
import { DU_LIEU_MAU, type SanPham } from "../lib/du-lieu-mau";

const KHOA_DA_XEM = "nhienin3d_da_xem_gan_day";
type DaXem={duong_dan:string;ten_san_pham:string;ma_san_pham:string};
const vnd=new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"});
export function GoiYSanPham({ san_pham }: { san_pham:SanPham }) {
  const [lien_quan,setLienQuan]=useState<SanPham[]>([]); const [da_xem,setDaXem]=useState<DaXem[]>([]);
  useEffect(()=>{
    fetch(`${API_URL}/san-pham/${encodeURIComponent(san_pham.duong_dan)}/lien-quan`).then(r=>r.ok?r.json():Promise.reject()).then(setLienQuan).catch(()=>{});
    try{const cu:DaXem[]=JSON.parse(localStorage.getItem(KHOA_DA_XEM)||"[]");setDaXem(cu.filter(x=>x.duong_dan!==san_pham.duong_dan).slice(0,4));const moi=[{duong_dan:san_pham.duong_dan,ten_san_pham:san_pham.ten_san_pham,ma_san_pham:san_pham.ma_san_pham},...cu.filter(x=>x.duong_dan!==san_pham.duong_dan)].slice(0,5);localStorage.setItem(KHOA_DA_XEM,JSON.stringify(moi));}catch{}
  },[san_pham.duong_dan,san_pham.ma_san_pham,san_pham.ten_san_pham]);
  const fallback=DU_LIEU_MAU.filter(x=>x.duong_dan!==san_pham.duong_dan).slice(0,4); const ds=lien_quan.length?lien_quan:fallback;
  return <section className="recommendation-section"><div className="recommendation-block"><div className="eyebrow">CÓ THỂ BẠN QUAN TÂM</div><h2>Sản phẩm liên quan</h2><div className="recommendation-grid">{ds.map(sp=><Link key={sp.ma_san_pham} href={`/san-pham/${encodeURIComponent(sp.duong_dan)}`}><img src={sp.hinh_anh?.[0]?.duong_dan_anh} alt={sp.ten_san_pham}/><span>{sp.ma_san_pham}</span><b>{sp.ten_san_pham}</b><strong>{vnd.format(Number(sp.gia_ban))}</strong></Link>)}</div></div>{da_xem.length>0&&<div className="recent-viewed"><div className="eyebrow">ĐÃ XEM GẦN ĐÂY</div><div className="recent-links">{da_xem.map(x=><Link key={x.duong_dan} href={`/san-pham/${encodeURIComponent(x.duong_dan)}`}><span>{x.ma_san_pham}</span>{x.ten_san_pham}</Link>)}</div></div>}</section>;
}
