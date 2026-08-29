import { config as docEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// Khi chạy qua npm workspace, cwd là apps/api nên cần nạp .env ở thư mục gốc.
// Trong Docker, DATABASE_URL được Docker Compose truyền trực tiếp và luôn được ưu tiên.
docEnv({ path: resolve(process.cwd(), "../../.env") });
docEnv({ path: resolve(process.cwd(), ".env") });

function taoDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const tenMayChu = process.env.POSTGRES_HOST?.trim() || "localhost";
  const cong = process.env.POSTGRES_PORT?.trim() || "5434";
  const tenCoSoDuLieu = process.env.POSTGRES_DB?.trim() || "nhienin3d";
  const tenNguoiDung = process.env.POSTGRES_USER?.trim() || "nhienin3d_app";
  const matKhau = process.env.POSTGRES_PASSWORD;

  if (!matKhau) {
    throw new Error(
      "Thieu POSTGRES_PASSWORD. Hay khai bao trong .env goc hoac truyen DATABASE_URL truc tiep."
    );
  }

  const nguoiDung = encodeURIComponent(tenNguoiDung);
  const matKhauMaHoa = encodeURIComponent(matKhau);
  const coSoDuLieu = encodeURIComponent(tenCoSoDuLieu);

  return `postgresql://${nguoiDung}:${matKhauMaHoa}@${tenMayChu}:${cong}/${coSoDuLieu}?schema=public`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: taoDatabaseUrl()
  }
});
