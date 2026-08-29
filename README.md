# NhienIn3d

**NhienIn3d** là web bán sản phẩm in 3D, ưu tiên trải nghiệm hiện đại, hiệu ứng 3D tương tác, PostgreSQL và quy trình migration/seed/release tự động.

> V1.0.7 — 29/08/2026

## Công nghệ V1

- Web: Next.js 16.3.3 + React 19.2.8 + Three.js 0.185.1 + React Three Fiber 9.7.0 + Motion 13.1.1.
- API: NestJS 12.0.1 + Fastify 5.12.1 + TypeScript 7.0.2.
- Database: PostgreSQL 18.6 + Prisma 7.10.0 + `@prisma/adapter-pg`.
- Bảo mật nền: Argon2id, HttpOnly cookie, CORS allow-list, Helmet, rate limit, audit log, DB user riêng.
- DevOps: Docker Compose, GitHub Actions, Dependabot, GHCR, GitHub Release tự động.

## Quy ước database

**Tên bảng, cột, biến nghiệp vụ: tiếng Việt không dấu.**

Ví dụ:

```text
san_pham
ten_san_pham
gia_ban
mo_ta_ngan
ngay_tao
nguoi_dung
mat_khau_bam
phien_dang_nhap
nhat_ky_bao_mat
```

**Dữ liệu hiển thị: tiếng Việt có dấu, UTF-8.**

```text
Đèn Lithophane theo ảnh
Chậu cây xoắn ốc hiện đại
Giá treo tai nghe đôi
Vỏ Raspberry Pi 5 thoáng khí
```

## V1 có gì?

- Landing page responsive, dark premium UI.
- Hero Three.js xoay/zoom 3D.
- Danh sách 10 sản phẩm mẫu.
- Tìm sản phẩm phía client.
- REST API sản phẩm + danh mục + health.
- Login cơ bản với Argon2id và HttpOnly cookies.
- PostgreSQL schema cho người dùng, sản phẩm, biến thể, vật liệu, màu, đơn hàng, session và audit log.
- Seed version hóa để chạy nhiều lần không bị trùng.
- 12 bảng nghiệp vụ đều có tối thiểu 10 dòng dữ liệu mẫu trên database mới; bảng `_prisma_migrations` là metadata hệ thống nên không chèn dữ liệu giả.
- Docker Compose.
- GitHub CI + release tag + GHCR images.

## 10 sản phẩm mẫu

Dữ liệu seed là dữ liệu demo kinh doanh thực tế (tên, giá bán dự kiến, thời gian in, khối lượng, kích thước) và ảnh tham khảo từ các trang model 3D công khai. Trạng thái nguồn được lưu `MAU_THAM_KHAO`; trước khi bán thương mại phải kiểm tra giấy phép của từng model.

## 1. Yêu cầu

- Docker Desktop mới.
- Hoặc Node.js 24 LTS + PostgreSQL 18 nếu chạy không Docker.
- Git + GitHub CLI (`gh`) nếu muốn tự push/release.

## 2. Khởi tạo lần đầu bằng Docker

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
Copy-Item .env.example .env
notepad .env
```

Đổi tối thiểu các giá trị:

```text
POSTGRES_PASSWORD
JWT_SECRET
COOKIE_SECRET
ADMIN_PASSWORD
```

Sau đó:

```powershell
docker compose up -d postgres
```

Khởi tạo toàn bộ bằng một lệnh:

```powershell
.\scripts\khoi-tao.ps1
```

Hoặc trực tiếp:

```powershell
docker compose up -d --build
```

Docker sẽ chạy theo thứ tự `postgres → migrate → api → web`. Container `migrate` tự chạy `prisma migrate deploy` và seed version hóa trước khi API khởi động.

PostgreSQL của NhienIn3d được publish riêng trên Windows ở `localhost:5434`; bên trong Docker network vẫn là `postgres:5432`.

## 3. Chạy toàn hệ thống

```powershell
docker compose up -d --build
```

Truy cập:

```text
Web:     http://localhost:3000
API:     http://localhost:3001/api/v1
Health:  http://localhost:3001/api/v1/suc-khoe
Swagger: http://localhost:3001/tai-lieu
```

Xem trạng thái:

```powershell
docker compose ps
```

Xem log:

```powershell
docker compose logs -f
```

Tắt:

```powershell
docker compose down
```

Không thêm `-v` nếu không muốn xóa volume PostgreSQL.

## 4. Mỗi lần nâng cấp version

Quy tắc cố định:

```powershell
.\scripts\cap-nhat.ps1
```

Script build image rồi khởi động Compose. Container `migrate` sẽ tự thực hiện:

```text
PostgreSQL health check
→ Prisma migrate deploy
→ Seed version mới (seed cũ tự bỏ qua)
→ API
→ Web
```

Bạn cũng có thể dùng trực tiếp:

```powershell
docker compose up -d --build
```

### Tạo migration mới khi phát triển

```powershell
cd apps\api
npx prisma migrate dev --name v002_ten_thay_doi
```

Production chỉ chạy:

```powershell
npm run db:migrate
npm run db:seed
```

Không xóa migration đã phát hành.


### Kiểm tra số dòng dữ liệu mẫu

Sau khi migrate/seed xong, chạy từ thư mục gốc:

```powershell
npm run db:kiem-tra-du-lieu
```

Hoặc kiểm tra trực tiếp trong container migrate:

```powershell
docker compose run --rm migrate npm run db:kiem-tra-du-lieu
```

Kết quả hợp lệ: 12 bảng nghiệp vụ đều `>= 10` dòng. Trên database mới của v1.0.7, seed tạo đúng 10 dòng mẫu cho từng bảng nghiệp vụ. Bảng `_prisma_migrations` do Prisma quản lý và không được chèn bản ghi giả chỉ để đủ số lượng.

## 5. Tạo PostgreSQL thủ công (nếu không dùng Docker)

Đăng nhập bằng tài khoản quản trị PostgreSQL:

```sql
CREATE USER nhienin3d_app WITH PASSWORD 'MAT_KHAU_MANH_CUA_BAN';
CREATE DATABASE nhienin3d
  WITH OWNER = nhienin3d_app
       ENCODING = 'UTF8'
       TEMPLATE = template0;
```

Connection string:

```text
postgresql://nhienin3d_app:MAT_KHAU_CUA_BAN@localhost:5434/nhienin3d
```

Sau đó tại `apps/api`:

```powershell
$env:DATABASE_URL="postgresql://nhienin3d_app:MAT_KHAU_CUA_BAN@localhost:5434/nhienin3d"
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 6. Build kiểm tra

```powershell
.\scripts\kiem-tra.ps1
```

Hoặc:

```powershell
npm test
npm run typecheck
npm run build
npm run audit:security
```

## 7. Kết nối GitHub lần đầu

Repo đích:

```text
https://github.com/TamNhien/NhienIn3d
```

Chạy:

```powershell
gh auth login
.\scripts\khoi-tao-github.ps1
```

Script tạo repo private nếu chưa tồn tại, commit và push `main`.

## 8. Tạo version + GitHub Release tự động

Ví dụ bản hiện tại:

```powershell
.\scripts\release.ps1 v1.0.7
```

Các version sau:

```powershell
.\scripts\release.ps1 v1.1.0
.\scripts\release.ps1 v1.2.0
.\scripts\release.ps1 v2.0.0
```

Script local sẽ:

```text
Typecheck + build
→ cập nhật VERSION/package versions
→ git commit
→ git tag
→ push main
→ push tag
```

GitHub Actions khi nhận tag sẽ:

```text
Build API + Web
→ npm audit mức high
→ tạo source ZIP + SHA256SUMS
→ build/push Docker images lên GHCR
→ tạo GitHub Release + release notes
```

Image:

```text
ghcr.io/tamnhien/nhienin3d-api:v1.0.0
ghcr.io/tamnhien/nhienin3d-web:v1.0.0
```

## 9. Bảo mật quan trọng

- Không commit `.env`.
- Không dùng PostgreSQL superuser cho app.
- Docker chỉ bind PostgreSQL vào `127.0.0.1` ở môi trường local.
- Production phải đặt HTTPS/reverse proxy phía trước.
- `JWT_SECRET` >= 32 ký tự ngẫu nhiên, khuyến nghị >= 64.
- `ADMIN_PASSWORD` tối thiểu 12 ký tự, khuyến nghị passphrase mạnh.
- File/model nguồn bên thứ ba cần kiểm tra license trước khi bán.
- V2 nên bổ sung refresh-token rotation hoàn chỉnh, CSRF token, RBAC guard, MFA admin và upload STL/3MF cách ly.

## Lịch sử phiên bản

### v1.0.0 — 29/08/2026

- Khởi tạo NhienIn3d.
- Next.js + Three.js frontend hiện đại.
- NestJS/Fastify API.
- PostgreSQL 18 + Prisma 7.
- Database dùng định danh tiếng Việt không dấu; dữ liệu tiếng Việt UTF-8 có dấu.
- 10 sản phẩm mẫu.
- Migration + seed version hóa.
- Docker Compose.
- GitHub Actions + GHCR + GitHub Release tự động.

### v1.0.1 — 29/08/2026

- Sửa lỗi TypeScript 7 `TS5108`: đổi `module/moduleResolution` sang `Node16`.
- Cài `openssl` + `ca-certificates` trong Docker API build/runtime để Prisma không còn cảnh báo dò OpenSSL.
- Thêm `.dockerignore` cho API/Web.
- Thêm `ADMIN_NAME` vào seed và Docker Compose.
- Loại bỏ fallback `COOKIE_SECRET` yếu; API sẽ từ chối khởi động nếu JWT/Cookie secret dưới 32 ký tự.
- Thêm API build vào GitHub CI.
- Nâng security audit gate từ `critical` lên `high`.
- Pin override bảo mật cho `fast-uri 3.1.6`, `lodash 4.18.1`, `js-yaml 4.3.2`.

#### Cách cập nhật từ v1.0.0

Giữ nguyên file `.env` của bạn, thay source bằng v1.0.1 rồi chạy:

```powershell
docker compose down
docker compose build --no-cache api migrate
docker compose up -d --build
docker compose ps
```

Kiểm tra log:

```powershell
docker compose logs migrate
docker compose logs api
docker compose logs web
```

### v1.0.2 — 29/08/2026

- Chuyển thư mục gốc thành npm workspaces: `apps/api` + `apps/web`.
- Thêm `npm test` ở thư mục gốc và test riêng cho API/Web.
- Thêm `npm run typecheck`, `npm run build`, `npm run check`, `npm run ci` chạy trực tiếp từ `D:\LienThongDH\DoAn\NhienIn3d`.
- `npm install` tại thư mục gốc giờ cài dependency cho toàn bộ workspace, không còn chỉ audit 1 package.
- Cập nhật `scripts/kiem-tra.ps1`, GitHub CI, GitHub Release và Dependabot theo cấu trúc workspace.

#### Quy trình mặc định từ thư mục gốc

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
npm install
npm test
npm run typecheck
npm run build
```

Hoặc chạy toàn bộ kiểm tra trước release:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
.\scripts\kiem-tra.ps1
```


### v1.0.3 — 29/08/2026

- Sửa cảnh báo `npm audit` mức High của `deepmerge-ts < 8.0.0` (CVE-2026-40345 / GHSA-ggr8-5vv4-36mx) phát sinh qua `@prisma/config`.
- Giữ Prisma `7.10.0`; không dùng `npm audit fix --force` vì npm đề xuất hạ Prisma xuống `6.12.0` và gây breaking change.
- Chuyển toàn bộ dependency `overrides` từ workspace API lên `package.json` gốc vì npm chỉ áp dụng `overrides` tại workspace root.
- Pin `deepmerge-ts` ở bản vá `8.0.1`; giữ các override bảo mật `fast-uri`, `lodash`, `js-yaml` tại root.
- Thêm `npm run audit:security` và đưa security audit vào quy trình kiểm tra mặc định.

#### Cập nhật từ v1.0.2

Tại thư mục mặc định:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
npm install
npm audit
npm test
npm run typecheck
npm run build
```

Kỳ vọng `npm audit` không còn cảnh báo `deepmerge-ts < 8.0.0`. Sau khi PASS, chạy Docker:

```powershell
docker compose up -d --build
docker compose ps
```

### v1.0.4 — 29/08/2026

- Sửa `npm run typecheck`/`prisma generate` báo `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL` khi `.env` chỉ khai báo các biến `POSTGRES_*` ở thư mục gốc.
- `apps/api/prisma.config.ts` giờ tự nạp `.env` gốc khi chạy qua npm workspace.
- Nếu Docker/CI đã truyền `DATABASE_URL`, Prisma luôn ưu tiên biến này.
- Khi chạy local, Prisma tự dựng URL PostgreSQL từ `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`; mật khẩu/user/database được URL-encode an toàn.
- Không yêu cầu tạo `.env` riêng trong `apps/api` và không yêu cầu khai báo `DATABASE_URL` thủ công.
- Giữ Prisma `7.10.0` và root override `deepmerge-ts 8.0.1`; `npm audit` trên máy kiểm thử của dự án đã đạt `0 vulnerabilities` trước bước typecheck.

#### Cập nhật từ v1.0.3

Giữ nguyên `.env` ở:

```text
D:\LienThongDH\DoAn\NhienIn3d\.env
```

Chép source v1.0.4 đè vào thư mục dự án rồi chạy:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
npm install
npm audit
npm test
npm run typecheck
npm run build
```

Sau khi PASS:

```powershell
docker compose up -d --build
docker compose ps
```



### v1.0.5 — 29/08/2026

- Sửa 21 lỗi TypeScript `TS1479` khi NestJS 12 ESM-only được import từ API đang bị nhận diện là CommonJS.
- Chuyển `apps/api/package.json` sang `"type": "module"`.
- Chuyển TypeScript API sang `module: NodeNext` và `moduleResolution: NodeNext`, phù hợp Node.js 24 + NestJS 12.
- Bổ sung `resolvePackageJsonExports`, `isolatedModules` và cấu hình ESM hiện đại.
- Toàn bộ relative import của API/seed dùng đuôi `.js` để Node ESM resolve đúng sau khi compile.
- Giữ nguyên Prisma 7.10.0, PostgreSQL 18.6 và cách tự dựng `DATABASE_URL` từ `.env` gốc của v1.0.4.

#### Cập nhật từ v1.0.4

Giữ nguyên `.env` tại thư mục gốc, chép source v1.0.5 đè vào `D:\LienThongDH\DoAn\NhienIn3d`, sau đó chạy:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
npm install
npm audit
npm test
npm run typecheck
npm run build
```

Sau khi PASS:

```powershell
docker compose up -d --build
docker compose ps
```


### v1.0.6 — 29/08/2026

- Đổi cổng PostgreSQL trên Windows/pgAdmin sang `5434` để không xung đột dịch vụ PostgreSQL cũ ở `5432`.
- Docker map `127.0.0.1:5434 -> postgres:5432`; API và migrate trong Docker vẫn kết nối cổng nội bộ `5432`.
- Prisma chạy local mặc định dùng `localhost:5434` khi `.env` không khai báo `DATABASE_URL`.
- API/migrate Docker chuyển build context về root workspace để nhận đúng `overrides` bảo mật ở `package.json` gốc.
- Docker API chạy `npm audit --audit-level=high` trong build và runtime; build dừng nếu còn lỗ hổng High trở lên.
- Giữ Prisma `7.10.0` stable và override `deepmerge-ts 8.0.1`; không nâng Prisma 8 RC.
- Cập nhật version hiển thị API/Health/Web lên `v1.0.6`.

#### Cập nhật từ v1.0.5

Trong `.env` đổi cổng PostgreSQL host:

```env
POSTGRES_PORT=5434
```

Chạy toàn bộ từ thư mục mặc định:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
npm install
npm audit
npm test
npm run typecheck
npm run build
docker compose down
docker compose up -d --build
docker compose ps
```

Kết nối PostgreSQL từ pgAdmin/Windows:

```text
Host: localhost
Port: 5434
Database: nhienin3d
Username: nhienin3d_app
```

Trong Docker:

```text
Host: postgres
Port: 5432
```

### v1.0.7 — 29/08/2026

- Bổ sung dữ liệu seed để cả 12 bảng nghiệp vụ đều có tối thiểu 10 dòng dữ liệu mẫu; database mới có đúng 10 dòng mẫu cho mỗi bảng.
- Mở rộng lên 10 danh mục, 10 vật liệu, 10 màu sắc, 10 người dùng, 10 biến thể, 10 đơn hàng, 10 chi tiết đơn hàng, 10 phiên đăng nhập và 10 nhật ký bảo mật.
- Giữ 10 sản phẩm mẫu và 10 ảnh chính, toàn bộ dữ liệu hiển thị tiếng Việt có dấu UTF-8.
- Thêm `npm run db:kiem-tra-du-lieu` để đếm và xác nhận số dòng của 12 bảng.
- Sửa API Docker restart vì Swagger trên Fastify thiếu `@fastify/static`; pin `@fastify/static 10.1.3` tương thích Fastify 5.
- Sửa volume PostgreSQL 18 sang `/var/lib/postgresql` để dữ liệu thực sự nằm trong Docker volume và tồn tại khi recreate container.
- PostgreSQL host vẫn dùng `127.0.0.1:5434`, Docker nội bộ vẫn `postgres:5432`.
- Seed mới idempotent: nâng cấp version chạy lại không nhân bản các dòng mẫu có khóa định danh.

#### Cập nhật từ v1.0.6

Giữ `.env`, chép source v1.0.7 đè vào `D:\LienThongDH\DoAn\NhienIn3d`, rồi chạy:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
npm install
npm audit
npm test
npm run typecheck
npm run build
```

Vì v1.0.6 từng mount sai vị trí volume PostgreSQL 18, nếu đây vẫn là database thử nghiệm có thể tạo lại volume một lần để chắc chắn dữ liệu nằm đúng volume:

```powershell
docker compose down -v
docker compose up -d --build
docker compose ps
```

Sau đó kiểm tra:

```powershell
docker compose logs migrate --tail 150
docker compose logs api --tail 100
npm run db:kiem-tra-du-lieu
```

