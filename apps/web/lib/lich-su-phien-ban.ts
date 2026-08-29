export type PhienBanPhatTrien = {
  phien_ban: string;
  ngay: string;
  thay_doi: string[];
};

export const LICH_SU_PHIEN_BAN: PhienBanPhatTrien[] = [
  {
    phien_ban: "v1.0.0",
    ngay: "29/08/2026",
    thay_doi: ["Khởi tạo NhienIn3d.", "Next.js + Three.js, NestJS + PostgreSQL + Prisma.", "Docker Compose, migration, seed và 10 sản phẩm mẫu."]
  },
  {
    phien_ban: "v1.0.1",
    ngay: "29/08/2026",
    thay_doi: ["Sửa TypeScript build.", "Bổ sung OpenSSL cho Prisma trong Docker.", "Cải thiện kiểm tra dependency."]
  },
  {
    phien_ban: "v1.0.2",
    ngay: "29/08/2026",
    thay_doi: ["Thêm npm workspaces.", "Cho phép test, typecheck và build từ thư mục root."]
  },
  {
    phien_ban: "v1.0.3",
    ngay: "29/08/2026",
    thay_doi: ["Vá dependency deepmerge-ts.", "Đưa security overrides lên root workspace.", "npm audit sạch mức High."]
  },
  {
    phien_ban: "v1.0.4",
    ngay: "29/08/2026",
    thay_doi: ["Prisma tự dựng DATABASE_URL từ POSTGRES_*.", "Chuẩn hóa kết nối PostgreSQL local."]
  },
  {
    phien_ban: "v1.0.5",
    ngay: "29/08/2026",
    thay_doi: ["Chuyển API sang ESM/NodeNext cho NestJS 12.", "Sửa relative import .js."]
  },
  {
    phien_ban: "v1.0.6",
    ngay: "29/08/2026",
    thay_doi: ["PostgreSQL Windows dùng port 5434.", "PostgreSQL 18 mount volume đúng /var/lib/postgresql.", "Docker API dùng root security overrides."]
  },
  {
    phien_ban: "v1.0.7",
    ngay: "29/08/2026",
    thay_doi: ["Bổ sung @fastify/static cho Swagger.", "Chuẩn hóa mỗi bảng nghiệp vụ có tối thiểu 10 dòng seed.", "Thêm script kiểm tra dữ liệu."]
  },
  {
    phien_ban: "v2.0.0",
    ngay: "29/08/2026",
    thay_doi: ["Thêm giỏ hàng và chi tiết giỏ hàng.", "Checkout transaction, kiểm tra và trừ tồn kho ở server.", "Thêm thanh toán, địa chỉ người dùng và giao diện checkout."]
  },
  {
    phien_ban: "v2.1.0",
    ngay: "29/08/2026",
    thay_doi: ["Tinh chỉnh typography và kích thước chữ storefront.", "Loại bỏ nội dung quảng bá phiên bản khỏi hero và giỏ hàng.", "Hiển thị lịch sử phát triển theo thứ tự tăng dần.", "Cho phép giả lập các cổng thanh toán online khi chạy local; production vẫn khóa phương thức chưa tích hợp thật."]
  },
  {
    phien_ban: "v2.1.1",
    ngay: "29/08/2026",
    thay_doi: ["Thêm trang chi tiết cho từng sản phẩm.", "Tách giỏ hàng thành trang riêng, cho phép tăng giảm số lượng và xóa sản phẩm.", "Tách checkout thành bước riêng chỉ mở sau khi người dùng xác nhận giỏ hàng.", "Giữ thanh toán giả lập local và không thay đổi schema PostgreSQL."]
  }
];
