import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThanhDieuHuong } from "../components/thanh-dieu-huong";
import { ChanTrang } from "../components/chan-trang";

export const metadata: Metadata = {
  title: "NhienIn3d | Sản phẩm in 3D",
  description: "Cửa hàng sản phẩm in 3D hiện đại với quy trình đặt hàng tinh gọn.",
  applicationName: "NhienIn3d",
  icons: {
    icon: [{ url: "/brand/nhienin3d-logo.svg", type: "image/svg+xml" }],
    shortcut: "/brand/nhienin3d-logo.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080a10"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi">
    <body>
      <ThanhDieuHuong />
      <div className="app-main relative z-10 mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-7 md:px-6">{children}</div>
      <ChanTrang />
    </body>
  </html>;
}
