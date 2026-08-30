import Link from "next/link";

export function ChanTrang() {
  return <footer className="site-footer">
    <div className="site-footer-grid">
      <div>
        <Link className="site-brand footer-brand" href="/">Nhien<span>In3d</span></Link>
      </div>
      <div><h3>Mua sắm</h3><Link href="/san-pham">Sản phẩm</Link><Link href="/yeu-thich">Yêu thích</Link><Link href="/gio-hang">Giỏ hàng</Link></div>
      <div><h3>Tài khoản</h3><Link href="/dang-nhap">Đăng nhập</Link><Link href="/dang-ky">Đăng kí</Link><Link href="/tai-khoan">Thông tin tài khoản</Link></div>
    </div>
    <div className="site-footer-bottom">© 2026 NhienIn3d • Nền giao diện dùng ảnh 3D do người dùng cung cấp.</div>
  </footer>;
}
