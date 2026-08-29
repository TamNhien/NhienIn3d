import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "NhienIn3d | Sản phẩm in 3D", description: "Cửa hàng sản phẩm in 3D hiện đại, tùy biến vật liệu và màu sắc." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body>{children}</body></html>; }
