import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

async function taiAnh(src: string) {
  if (src.startsWith("/")) {
    const tep = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
    const buf = await readFile(tep);
    const ext = path.extname(tep).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { buf, mime };
  }
  const url = new URL(src);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Nguồn ảnh không hợp lệ");
  const res = await fetch(url, { headers: { "User-Agent": "NhienIn3d/2.9.4" }, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Không tải được ảnh gốc");
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return { buf: Buffer.from(await res.arrayBuffer()), mime };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const src = sp.get("src") || "";
    const mau = /^#[0-9a-fA-F]{6}$/.test(sp.get("mau") || "") ? sp.get("mau")! : "#64748B";
    const pointsRaw = sp.get("points") || "8,84 8,24 24,10 76,10 92,24 92,84 76,94 24,94";
    const points = /^[0-9., ]{10,240}$/.test(pointsRaw) ? pointsRaw : "8,84 8,24 24,10 76,10 92,24 92,84 76,94 24,94";
    const { buf, mime } = await taiAnh(src);
    const data = `data:${mime};base64,${buf.toString("base64")}`;
    // Ảnh biến thể là một SVG độc lập: ảnh gốc giữ nguyên làm nền, chỉ vùng sản phẩm được phủ màu.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><clipPath id="p"><polygon points="${points}"/></clipPath><filter id="c" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.08"/><feFuncG type="linear" slope="1.08"/><feFuncB type="linear" slope="1.08"/></feComponentTransfer><feFlood flood-color="${mau}" result="f"/><feBlend in="SourceGraphic" in2="f" mode="multiply"/></filter></defs><image href="${esc(data)}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/><g clip-path="url(#p)"><image href="${esc(data)}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" filter="url(#c)"/></g></svg>`;
    return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new NextResponse("Không tạo được ảnh biến thể", { status: 400 });
  }
}
