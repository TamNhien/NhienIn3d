# NhienIn3d

> Cửa hàng sản phẩm in 3D hiện đại — Next.js + Three.js + NestJS + PostgreSQL + Docker  
> Phiên bản hiện tại: **v2.1.1** — 29/08/2026

## Công nghệ

- Web: Next.js 16.3.3, React 19.2.8, TypeScript 7.0.2.
- 3D: Three.js, React Three Fiber, Drei.
- Animation: Motion.
- API: NestJS 12 + Fastify 5.
- Database: PostgreSQL 18.6.
- ORM / migration / seed: Prisma 7.10.0.
- Password: Argon2id.
- Hạ tầng local: Docker Compose.
- PostgreSQL từ Windows/pgAdmin: `127.0.0.1:5434`.
- PostgreSQL nội bộ Docker: `postgres:5432`.

> Prisma 8 RC/preview không được dùng cho production. NhienIn3d vẫn giữ Prisma 7.10 stable.

---

# v2.0.0 — Commerce nền tảng

v2.0.0 biến storefront V1 thành luồng commerce có thể thao tác thật:

- Giỏ hàng lưu trong PostgreSQL.
- Mã phiên giỏ hàng ngẫu nhiên, lưu phía browser bằng `localStorage`.
- Thêm/xóa sản phẩm khỏi giỏ.
- Lưu đúng biến thể, vật liệu, màu, đơn giá và số lượng.
- Kiểm tra tồn kho ở server.
- Checkout tạo đơn hàng bằng database transaction.
- Trừ tồn kho chỉ khi transaction đặt hàng thành công.
- Tạo bản ghi thanh toán cho mỗi đơn.
- Hai phương thức hoạt động mặc định: COD và chuyển khoản.
- 8 phương thức thanh toán khác được seed ở trạng thái chưa bật để sẵn sàng tích hợp.
- Thêm bảng địa chỉ người dùng.
- Mỗi bảng nghiệp vụ mới của V2 cũng có tối thiểu 10 dòng dữ liệu mẫu.
- Web có giỏ hàng dạng drawer, form nhận hàng và checkout.
- Swagger có endpoint giỏ hàng + thanh toán.


---

# v2.1.0 — Giao diện tinh gọn + thanh toán giả lập local

- Thu gọn typography hero và kích thước chữ toàn storefront để cân đối hơn trên desktop/mobile.
- Dùng font stack hiện đại dựa trên Segoe UI Variable/System UI, không phụ thuộc tải font ngoài khi build Docker.
- Bỏ dòng quảng bá `NHIENIN3D V2 • COMMERCE READY` khỏi hero.
- Bỏ đoạn `V2 bổ sung giỏ hàng thật...` khỏi hero.
- Loại bỏ nhãn phiên bản khỏi các nội dung marketing/giỏ hàng; version chỉ còn ở khu vực lịch sử và footer kỹ thuật.
- Thêm mục **Lịch sử phát triển** ngay trên web, liệt kê `v1.0.0 -> v2.1.1` theo thứ tự tăng dần.
- Khi `NODE_ENV=development`, API trả thêm các gateway online chưa tích hợp dưới trạng thái `la_gia_lap=true`.
- Thanh toán giả lập local tạo giao dịch `N3D-MOCK-*`, đánh dấu `DA_THANH_TOAN` và ghi `ngay_thanh_toan`.
- Không gọi VNPay/MoMo/ZaloPay/... thật và không phát sinh tiền thật.
- Khi `NODE_ENV=production`, gateway chưa tích hợp vẫn bị khóa; chỉ phương thức `dang_hoat_dong=true` được sử dụng.
- Không đổi schema database; seed chỉ cập nhật mô tả phương thức và thêm lịch sử seed v2.1.0.

---

# v2.1.1 — Chi tiết sản phẩm + tách giỏ hàng và checkout

- Nhấp vào bất kỳ thẻ sản phẩm nào sẽ mở trang `/san-pham/[duong_dan]`.
- Trang chi tiết hiển thị ảnh, kích thước, khối lượng, thời gian in, giá, biến thể, vật liệu, màu sắc và tồn kho.
- Cho phép chọn biến thể và số lượng trước khi thêm vào giỏ.
- `Thêm vào giỏ` không còn tự mở form thanh toán.
- Tạo trang `/gio-hang` riêng để xem toàn bộ sản phẩm, tăng/giảm số lượng và xóa dòng giỏ hàng.
- Chỉ khi bấm **Tiến hành thanh toán** từ giỏ mới chuyển sang `/thanh-toan`.
- Trang `/thanh-toan` chứa riêng thông tin nhận hàng và phương thức thanh toán.
- Thanh toán giả lập local từ v2.1.0 được giữ nguyên.
- Không đổi schema PostgreSQL và không cần migration mới.

## Endpoint commerce

```text
GET    /api/v1/san-pham
GET    /api/v1/san-pham/:duong_dan

POST   /api/v1/gio-hang
GET    /api/v1/gio-hang/:ma_phien
POST   /api/v1/gio-hang/:ma_phien/them
PATCH  /api/v1/gio-hang/:ma_phien/chi-tiet/:id
DELETE /api/v1/gio-hang/:ma_phien/chi-tiet/:id

GET    /api/v1/thanh-toan/phuong-thuc
POST   /api/v1/thanh-toan/dat-hang

POST   /api/v1/xac-thuc/dang-nhap
POST   /api/v1/xac-thuc/dang-xuat
GET    /api/v1/suc-khoe
```

## Database commerce

Tên bảng/cột vẫn theo quy ước **tiếng Việt không dấu**. Dữ liệu hiển thị dùng **tiếng Việt có dấu UTF-8**.

Các bảng nghiệp vụ hiện có:

```text
nguoi_dung
danh_muc
san_pham
hinh_anh_san_pham
vat_lieu
mau_sac
bien_the_san_pham
don_hang
chi_tiet_don_hang
phien_dang_nhap
nhat_ky_bao_mat
phien_ban_seed

gio_hang                    <-- V2
chi_tiet_gio_hang           <-- V2
phuong_thuc_thanh_toan      <-- V2
thanh_toan                  <-- V2
dia_chi_nguoi_dung          <-- V2
```

Bảng `_prisma_migrations` là bảng hệ thống của Prisma và không được chèn dữ liệu giả để đạt 10 dòng.

---

# Thư mục chạy mặc định

Tất cả lệnh test/build/update/release được hướng dẫn từ:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
```

---

# Cấu hình `.env`

Tạo từ mẫu:

```powershell
Copy-Item .env.example .env
notepad .env
```

Ví dụ:

```env
POSTGRES_DB=nhienin3d
POSTGRES_USER=nhienin3d_app
POSTGRES_PASSWORD=DOI_MAT_KHAU_DB
POSTGRES_PORT=5434

API_PORT=3001
WEB_PORT=3000

JWT_SECRET=DOI_CHUOI_NGAU_NHIEN_IT_NHAT_32_KY_TU
COOKIE_SECRET=DOI_CHUOI_NGAU_NHIEN_IT_NHAT_32_KY_TU

ADMIN_EMAIL=admin@nhienin3d.local
ADMIN_PASSWORD=DOI_MAT_KHAU_ADMIN
ADMIN_NAME="System Admin"

NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Không commit `.env`.

---

# Test và build

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d

npm install
npm audit
npm test
npm run typecheck
npm run build
npm run audit:security
```

Lệnh kiểm tra gọn:

```powershell
.\scripts\kiem-tra.ps1
```

---

# Chạy Docker

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d

docker compose up -d --build
docker compose ps
```

Truy cập:

```text
Web:        http://localhost:3000
API:        http://localhost:3001/api/v1
Health:     http://localhost:3001/api/v1/suc-khoe
Swagger:    http://localhost:3001/tai-lieu
PostgreSQL: 127.0.0.1:5434
```

## pgAdmin

```text
Host:                 127.0.0.1
Port:                 5434
Maintenance database: nhienin3d
Username:             nhienin3d_app
Password:             POSTGRES_PASSWORD trong .env
```

Docker nội bộ vẫn dùng `postgres:5432`; không đổi API/migrate sang 5434.

---

# Nâng cấp V1.0.7 -> V2.0.0

**Không dùng `docker compose down -v` khi muốn giữ dữ liệu hiện tại.**

Giữ nguyên `.env`, chép source V2 đè vào:

```text
D:\LienThongDH\DoAn\NhienIn3d
```

Sau đó:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d

npm install
npm test
npm run typecheck
npm run build

docker compose up -d --build
```

Container `migrate` sẽ tự chạy:

```text
202608290001_v001_khoi_tao          đã có -> bỏ qua
202608290002_v002_gio_hang_thanh_toan       -> chạy

seed V1                              -> upsert / giữ dữ liệu
seed V2                              -> thêm dữ liệu mới
```

Hoặc dùng script:

```powershell
.\scripts\cap-nhat.ps1
```

## Kiểm tra dữ liệu

```powershell
docker compose run --rm migrate npm run db:kiem-tra-du-lieu
```

Kết quả hợp lệ:

```text
17 bảng nghiệp vụ đều có tối thiểu 10 dòng dữ liệu.
```

## Nâng cấp v2.1.0 -> v2.1.1

Không có migration schema mới. Giữ nguyên `.env` và volume PostgreSQL hiện tại, sau đó chạy:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d

npm install
npm audit
npm test
npm run typecheck
npm run build

docker compose up -d --build
```

V2.1.1 không thêm migration database. Container `migrate` vẫn chạy migration/seed idempotent hiện có. **Không chạy `docker compose down -v`** nếu muốn giữ dữ liệu.

---

# Luồng checkout

```text
Danh sách sản phẩm
   | nhấp sản phẩm
   v
/san-pham/[duong_dan]
   | chọn biến thể + số lượng
   v
Thêm vào giỏ
   |
   v
/gio-hang
   | xem / tăng / giảm / xóa
   | bấm Tiến hành thanh toán
   v
/thanh-toan
   | nhập thông tin nhận hàng
   | chọn phương thức thanh toán
   v
PostgreSQL transaction
   +--> kiểm tra tồn kho
   +--> tạo đơn + chi tiết đơn
   +--> tạo thanh toán / giả lập local nếu được chọn
```

Giá và tồn kho không được tin từ browser. Server đọc lại dữ liệu database trước khi tạo đơn.

## Thanh toán

Đang bật:

```text
COD
CHUYEN_KHOAN
```

Có dữ liệu mẫu nhưng mặc định tắt:

```text
VNPAY
MOMO
ZALOPAY
SHOPEEPAY
NAPAS
THE_QUOC_TE
APPLE_PAY
GOOGLE_PAY
```

### Giả lập thanh toán khi chạy local

Với `.env`:

```env
NODE_ENV=development
```

API `/api/v1/thanh-toan/phuong-thuc` trả cả 10 phương thức. COD và chuyển khoản là phương thức nội bộ đang bật; 8 gateway online sẽ có `la_gia_lap=true`. Trên web chúng được ghi rõ **Giả lập local**.

Khi chọn VNPay/MoMo/ZaloPay/ShopeePay/NAPAS/Visa-Mastercard/Apple Pay/Google Pay trong local:

```text
Không gọi gateway thật
      |
      v
Tạo don_hang trong transaction
      |
      v
Tạo thanh_toan N3D-MOCK-*
      |
      v
trang_thai = DA_THANH_TOAN
ngay_thanh_toan = thời điểm hiện tại
```

Khi chạy production:

```env
NODE_ENV=production
```

các gateway chưa tích hợp thật không được trả về danh sách checkout và API từ chối sử dụng chúng. Việc tích hợp production vẫn cần API key/merchant credentials chính thức của từng nhà cung cấp.

---

# Dữ liệu mẫu

V2 giữ 10 sản phẩm thật đã dùng ở V1, gồm:

1. Xe RC Dragon R1 in 3D
2. Giá đỡ điện thoại bánh răng
3. Chậu cây xoắn ốc hiện đại
4. Hộp cuộn cáp di động
5. Giá treo tai nghe đôi
6. Chụp đèn Radiant
7. Khối lập phương bánh răng
8. Khay Gridfinity đa năng
9. Đèn Lithophane theo ảnh
10. Vỏ Raspberry Pi 5 thoáng khí

Nguồn model/ảnh vẫn được lưu dưới dạng tham khảo. Trạng thái mặc định không tự coi mọi model là được phép kinh doanh.

V2 bổ sung thêm:

- 10 giỏ hàng mẫu.
- 10 chi tiết giỏ hàng.
- 10 phương thức thanh toán.
- 10 giao dịch thanh toán.
- 10 địa chỉ người dùng.

Seed là idempotent: chạy lại không tạo trùng dữ liệu có khóa tự nhiên.

---

# GitHub / Release

Repository mục tiêu:

```text
TamNhien/NhienIn3d
```

Lần đầu:

```powershell
gh auth login
.\scripts\khoi-tao-github.ps1
```

Release phiên bản hiện tại:

```powershell
.\scripts\release.ps1 v2.1.1
```

GitHub Actions sẽ build/test/audit và tạo GitHub Release theo tag.

---

# Lệnh chẩn đoán

```powershell
docker compose ps
docker compose logs postgres --tail 100
docker compose logs migrate --tail 150
docker compose logs api --tail 150
docker compose logs web --tail 100
```

Kiểm tra PostgreSQL:

```powershell
Test-NetConnection 127.0.0.1 -Port 5434
docker exec nhienin3d-postgres pg_isready -U nhienin3d_app -d nhienin3d
```

---

# Lịch sử phiên bản

## v1.0.0 — 29/08/2026

- Khởi tạo NhienIn3d.
- Next.js + Three.js.
- NestJS + PostgreSQL + Prisma.
- Docker Compose.
- 10 sản phẩm mẫu.
- Migration + seed.

## v1.0.1 — 29/08/2026

- Sửa TypeScript build.
- Bổ sung OpenSSL cho Prisma trong Docker.
- Cải thiện kiểm tra dependency.

## v1.0.2 — 29/08/2026

- Thêm npm workspaces.
- Cho phép test/typecheck/build từ thư mục root.

## v1.0.3 — 29/08/2026

- Vá dependency `deepmerge-ts`.
- Root security overrides.
- `npm audit` sạch mức High.

## v1.0.4 — 29/08/2026

- Prisma tự dựng `DATABASE_URL` từ `POSTGRES_*`.
- Local dùng PostgreSQL port 5434.

## v1.0.5 — 29/08/2026

- Chuyển API sang ESM/NodeNext cho NestJS 12.
- Sửa relative import `.js`.

## v1.0.6 — 29/08/2026

- PostgreSQL Windows chuyển sang port 5434.
- PostgreSQL 18 mount volume đúng `/var/lib/postgresql`.
- Docker API dùng root security overrides.

## v1.0.7 — 29/08/2026

- Bổ sung `@fastify/static` cho Swagger.
- Chuẩn hóa seed mỗi bảng nghiệp vụ có tối thiểu 10 dòng.
- Thêm script kiểm tra dữ liệu.

## v2.0.0 — 29/08/2026

- Thêm `gio_hang`.
- Thêm `chi_tiet_gio_hang`.
- Thêm `phuong_thuc_thanh_toan`.
- Thêm `thanh_toan`.
- Thêm `dia_chi_nguoi_dung`.
- Migration V2 chạy nối tiếp migration V1, không phá dữ liệu cũ.
- 5 bảng mới đều có tối thiểu 10 dòng seed.
- Thêm API giỏ hàng.
- Thêm checkout transaction.
- Kiểm tra/trừ tồn kho ở server.
- COD + chuyển khoản hoạt động mặc định.
- Thêm giao diện giỏ hàng dạng drawer.
- Thêm form checkout ngay trên storefront.
- Cập nhật Swagger/API/health/version lên V2.


## v2.1.0 — 29/08/2026

- Tinh chỉnh font và kích thước chữ storefront.
- Bỏ các dòng quảng bá V2 khỏi hero/giỏ hàng.
- Thêm lịch sử phát triển trên giao diện theo thứ tự tăng dần.
- Cho phép giả lập 8 gateway online khi chạy local.
- Thanh toán giả lập được ghi `DA_THANH_TOAN` với mã `N3D-MOCK-*`; không phát sinh tiền thật.
- Production vẫn khóa phương thức chưa tích hợp thật.

## v2.1.1 — 29/08/2026

- Thêm trang chi tiết sản phẩm theo `duong_dan`.
- Cho phép chọn biến thể và số lượng trước khi thêm vào giỏ.
- Tách trang giỏ hàng khỏi checkout; giỏ hàng hỗ trợ tăng/giảm số lượng và xóa sản phẩm.
- Tạo trang thanh toán riêng, chỉ truy cập từ bước xác nhận giỏ hàng.
- Giữ nguyên thanh toán giả lập local và schema PostgreSQL.

