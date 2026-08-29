"use client";
import { useEffect, useState } from "react";
import { guiDanhGia, layDanhGia } from "../lib/danh-gia";

type DanhGia = { id:string; ho_ten:string; so_sao:number; noi_dung:string; ngay_tao:string };
type DuLieu = { diem_trung_binh:number; so_luong:number; danh_gia:DanhGia[] };
const sao = (n:number) => "★".repeat(Math.max(0,n)) + "☆".repeat(Math.max(0,5-n));

export function DanhGiaSanPham({ duong_dan }: { duong_dan:string }) {
  const [du_lieu,setDuLieu]=useState<DuLieu>({diem_trung_binh:0,so_luong:0,danh_gia:[]});
  const [ho_ten,setHoTen]=useState(""); const [so_sao,setSoSao]=useState(5); const [noi_dung,setNoiDung]=useState("");
  const [dang_gui,setDangGui]=useState(false); const [thong_bao,setThongBao]=useState("");
  const tai=()=>layDanhGia(duong_dan).then(setDuLieu).catch(()=>{});
  useEffect(()=>{ tai(); },[duong_dan]);
  async function gui(){
    if(ho_ten.trim().length<2 || noi_dung.trim().length<10){setThongBao("Vui lòng nhập tên và nhận xét ít nhất 10 ký tự.");return;}
    try{setDangGui(true);setThongBao("");const kq=await guiDanhGia(duong_dan,ho_ten.trim(),so_sao,noi_dung.trim());setThongBao(kq.thong_bao);setNoiDung("");await tai();}
    catch(e){setThongBao(e instanceof Error?e.message:"Không thể gửi đánh giá");}finally{setDangGui(false);}
  }
  return <section className="review-section">
    <div className="review-heading"><div><div className="eyebrow">ĐÁNH GIÁ SẢN PHẨM</div><h2>Khách hàng nói gì?</h2></div><div className="rating-summary"><b>{du_lieu.diem_trung_binh.toFixed(1)}</b><span className="stars">{sao(Math.round(du_lieu.diem_trung_binh))}</span><small>{du_lieu.so_luong} đánh giá đã duyệt</small></div></div>
    <div className="review-layout">
      <div className="review-list">{du_lieu.danh_gia.length?du_lieu.danh_gia.map(x=><article className="review-card" key={x.id}><div className="review-card-head"><b>{x.ho_ten}</b><span className="stars">{sao(x.so_sao)}</span></div><p>{x.noi_dung}</p><small>{new Date(x.ngay_tao).toLocaleDateString("vi-VN")}</small></article>):<div className="empty-review">Chưa có đánh giá được duyệt.</div>}</div>
      <div className="review-form"><h3>Viết đánh giá</h3><label>Họ tên<input value={ho_ten} onChange={e=>setHoTen(e.target.value)} maxLength={120} placeholder="Tên hiển thị"/></label><label>Số sao<select value={so_sao} onChange={e=>setSoSao(Number(e.target.value))}>{[5,4,3,2,1].map(x=><option key={x} value={x}>{x} sao</option>)}</select></label><label>Nhận xét<textarea value={noi_dung} onChange={e=>setNoiDung(e.target.value)} maxLength={1500} rows={5} placeholder="Chia sẻ trải nghiệm của bạn…"/></label>{thong_bao&&<div className="inline-message">{thong_bao}</div>}<button className="checkout-button" onClick={gui} disabled={dang_gui}>{dang_gui?"Đang gửi…":"Gửi đánh giá"}</button><small>Local: tự duyệt để test. Production: đánh giá mới chờ duyệt.</small></div>
    </div>
  </section>;
}
