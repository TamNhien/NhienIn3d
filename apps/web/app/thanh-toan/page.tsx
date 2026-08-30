"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { API_URL, type GioHang, KHOA_GIO_HANG, layGioHangDaLuu, phatSuKienGioHang } from "../../lib/gio-hang";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

type PhuongThucThanhToan = {
  ma_phuong_thuc: string;
  ten_phuong_thuc: string;
  mo_ta?: string;
  la_gia_lap?: boolean;
};

export default function ThanhToanPage() {
  const [gio_hang, setGioHang] = useState<GioHang | null>(null);
  const [phuong_thuc, setPhuongThuc] = useState<PhuongThucThanhToan[]>([]);
  const [dang_tai, setDangTai] = useState(true);
  const [dang_dat_hang, setDangDatHang] = useState(false);
  const [thong_bao, setThongBao] = useState("");
  const [ma_don_moi, setMaDonMoi] = useState("");
  const [thanh_toan_gia_lap, setThanhToanGiaLap] = useState(false);
  const [form, setForm] = useState({
    ho_ten_nguoi_nhan: "",
    so_dien_thoai: "",
    dia_chi_giao_hang: "",
    ma_phuong_thuc: "COD",
    ghi_chu: ""
  });

  useEffect(() => {
    Promise.all([
      layGioHangDaLuu(),
      fetch(`${API_URL}/thanh-toan/phuong-thuc`).then(r => r.ok ? r.json() : [])
    ]).then(([gio, cac_phuong_thuc]) => {
      setGioHang(gio);
      setPhuongThuc(cac_phuong_thuc);
      if (cac_phuong_thuc[0]) setForm(x => ({ ...x, ma_phuong_thuc: cac_phuong_thuc[0].ma_phuong_thuc }));
    }).finally(() => setDangTai(false));
  }, []);

  async function datHang(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gio_hang?.chi_tiet.length) return;
    try {
      setDangDatHang(true);
      setThongBao("");
      const response = await fetch(`${API_URL}/thanh-toan/dat-hang`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ma_gio_hang: gio_hang.ma_phien, ...form })
      });
      const du_lieu = await response.json();
      if (!response.ok) throw new Error(du_lieu.message || "Đặt hàng chưa thành công");
      setMaDonMoi(du_lieu.don_hang.ma_don_hang);
      setThanhToanGiaLap(Boolean(du_lieu.thanh_toan.la_gia_lap));
      setThongBao(du_lieu.thanh_toan.huong_dan || "Đặt hàng thành công.");
      setGioHang(null);
      window.localStorage.removeItem(KHOA_GIO_HANG);
      phatSuKienGioHang();
    } catch (loi) {
      setThongBao(loi instanceof Error ? loi.message : "Đặt hàng chưa thành công");
    } finally {
      setDangDatHang(false);
    }
  }

  return <main>
    <section className="page-shell checkout-page">
      {ma_don_moi ? <div className="order-success standalone-success">
        <div className="success-icon">✓</div>
        <h1>Đặt hàng thành công</h1>
        <p>Mã đơn hàng</p><strong>{ma_don_moi}</strong>
        {thanh_toan_gia_lap && <span className="mock-paid">✓ Thanh toán giả lập local đã thành công</span>}
        {thong_bao && <div className="inline-message">{thong_bao}</div>}
        <Link className="primary" href="/#san-pham">Tiếp tục mua hàng</Link>
      </div> : dang_tai ? <div className="loading-panel">Đang chuẩn bị thanh toán…</div> : !gio_hang?.chi_tiet.length ? <div className="empty-state">
        <h1>Chưa có sản phẩm để thanh toán</h1><p>Giỏ hàng đang trống hoặc đã hết hạn.</p><Link className="primary" href="/gio-hang">Quay lại giỏ hàng</Link>
      </div> : <>
        <div className="page-title-row checkout-title"><div><div className="eyebrow">THANH TOÁN</div><h1>Thông tin nhận hàng và thanh toán.</h1><p>Bạn đã kiểm tra giỏ hàng. Đây là bước cuối trước khi tạo đơn.</p></div><Link className="secondary" href="/gio-hang">← Quay lại giỏ hàng</Link></div>
        <div className="checkout-layout">
          <form className="checkout-form checkout-form-page" onSubmit={datHang}>
            <section className="form-panel">
              <div className="form-section-title"><span>01</span><div><h2>Thông tin nhận hàng</h2><p>Thông tin dùng để giao đơn hàng.</p></div></div>
              <div className="form-grid">
                <label><span>Họ và tên</span><input required minLength={2} maxLength={150} placeholder="Nguyễn Văn A" value={form.ho_ten_nguoi_nhan} onChange={e=>setForm({...form,ho_ten_nguoi_nhan:e.target.value})}/></label>
                <label><span>Số điện thoại</span><input required minLength={8} maxLength={30} placeholder="09xxxxxxxx" value={form.so_dien_thoai} onChange={e=>setForm({...form,so_dien_thoai:e.target.value})}/></label>
              </div>
              <label><span>Địa chỉ giao hàng</span><textarea required minLength={8} maxLength={500} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" value={form.dia_chi_giao_hang} onChange={e=>setForm({...form,dia_chi_giao_hang:e.target.value})}/></label>
              <label><span>Ghi chú</span><textarea maxLength={1000} placeholder="Ghi chú cho đơn hàng (không bắt buộc)" value={form.ghi_chu} onChange={e=>setForm({...form,ghi_chu:e.target.value})}/></label>
            </section>

            <section className="form-panel">
              <div className="form-section-title"><span>02</span><div><h2>Phương thức thanh toán</h2><p>Local cho phép giả lập gateway; production chỉ bật gateway đã tích hợp thật.</p></div></div>
              <div className="payment-options">
                {(phuong_thuc.length ? phuong_thuc : [{ma_phuong_thuc:"COD",ten_phuong_thuc:"Thanh toán khi nhận hàng",mo_ta:"Thanh toán khi nhận sản phẩm",la_gia_lap:false},{ma_phuong_thuc:"CHUYEN_KHOAN",ten_phuong_thuc:"Chuyển khoản ngân hàng",mo_ta:"Chuyển khoản theo hướng dẫn của cửa hàng",la_gia_lap:false}]).map(pt => <label className={form.ma_phuong_thuc === pt.ma_phuong_thuc ? "payment-option active" : "payment-option"} key={pt.ma_phuong_thuc}>
                  <input type="radio" name="phuong-thuc" value={pt.ma_phuong_thuc} checked={form.ma_phuong_thuc === pt.ma_phuong_thuc} onChange={e=>setForm({...form,ma_phuong_thuc:e.target.value})}/>
                  <div><strong>{pt.ten_phuong_thuc}</strong><span>{pt.la_gia_lap ? "Giả lập local • Không phát sinh giao dịch thật" : pt.mo_ta || "Thanh toán theo quy trình nội bộ"}</span></div>
                  {pt.la_gia_lap && <b className="mock-badge">LOCAL</b>}
                </label>)}
              </div>
            </section>

            {thong_bao && <div className="inline-message error-message">{thong_bao}</div>}
            <button className="checkout-button checkout-submit" disabled={dang_dat_hang}>{dang_dat_hang ? "Đang tạo đơn…" : `Đặt hàng • ${vnd.format(Number(gio_hang.tam_tinh))}`}</button>
            <small className="checkout-note">{phuong_thuc.find(pt => pt.ma_phuong_thuc === form.ma_phuong_thuc)?.la_gia_lap ? "Chế độ local: giao dịch online được mô phỏng và đánh dấu đã thanh toán. Không gọi cổng thanh toán thật." : "Server sẽ đọc lại đơn giá, kiểm tra tồn kho và tạo đơn trong transaction."}</small>
          </form>

          <aside className="checkout-summary">
            <h3>Đơn hàng của bạn</h3>
            {gio_hang.chi_tiet.map(item => <div className="checkout-summary-item" key={item.id}><img src={item.bien_the.san_pham.hinh_anh?.[0]?.duong_dan_anh} alt="" referrerPolicy="no-referrer"/><div><strong>{item.bien_the.san_pham.ten_san_pham}</strong><span>{item.so_luong} × {vnd.format(Number(item.don_gia))}</span></div><b>{vnd.format(Number(item.don_gia) * item.so_luong)}</b></div>)}
            <div className="summary-line total"><span>Tổng tạm tính</span><strong>{vnd.format(Number(gio_hang.tam_tinh))}</strong></div>
          </aside>
        </div>
      </>}
    </section>
  </main>;
}
