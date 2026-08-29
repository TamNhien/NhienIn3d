# NhienIn3d

> Phiên bản hiện tại: **v2.8.4** — 29/08/2026

NhienIn3d là web thương mại điện tử cho sản phẩm in 3D với **frontend Next.js** và **backend NestJS/Fastify** kết nối **PostgreSQL qua Prisma**.

## Kiến trúc hiện tại

- Frontend: Next.js 16.3.3 + React 19.2.8.
- Backend: NestJS 12 + Fastify 5.
- Database: PostgreSQL 18.6.
- ORM: Prisma 7.10.0.
- Xác thực: JWT access token + refresh token HttpOnly cookie.
- Mật khẩu: Argon2id.
- Email: Nodemailer 9.0.6; hỗ trợ Gmail/Google Workspace SMTP qua STARTTLS, Mailpit giữ làm profile test tùy chọn.
- Container: Docker Compose.
- CI/Release: GitHub Actions + GitHub CLI.

## Mới trong v2.8.4

V2.8.4 là hotfix giao diện xác thực, không thay đổi backend API hay database schema.

- Bỏ dòng mô tả dài về cookie HttpOnly/ghi nhớ tài khoản khỏi trang Đăng nhập.
- Đặt **Quên mật khẩu?** ngang hàng với **Ghi nhớ tài khoản** trong cùng một hàng tùy chọn.
- Đổi nhãn người dùng **Tạo tài khoản** thành **Đăng kí** ở heading, nút submit và liên kết từ trang đăng nhập.
- Thu nhỏ nút **Đăng nhập** trên desktop; mobile vẫn tự giãn toàn chiều rộng để dễ thao tác.
- Ghi nhớ tài khoản vẫn chỉ lưu email trong `localStorage`; không thay đổi cơ chế cookie HttpOnly/session phía backend.
- Không có migration mới.

## Mới trong v2.8.3

V2.8.3 là bản vá runtime cho backend NestJS sau khi Docker build thành công nhưng API dừng ở lúc khởi tạo `TaiKhoanModule`/`QuanTriModule`.

- Sửa `UnknownDependenciesException`: `JwtGuard` cần `JwtService` nhưng `JwtModule` trước đó chỉ được import nội bộ trong `XacThucModule` và chưa re-export cho các module dùng guard.
- `XacThucModule` giờ re-export `JwtModule` cùng `JwtGuard` và `VaiTroGuard`, để `TaiKhoanModule` và `QuanTriModule` resolve dependency đúng khi `@UseGuards(JwtGuard)` được áp dụng.
- Sửa nguyên nhân frontend hiện `Failed to fetch` ở Đăng ký/Tài khoản khi API container crash.
- Không đổi schema PostgreSQL và không cần migration mới.
- Gmail SMTP, quên mật khẩu, độ mạnh mật khẩu, ghi nhớ email đăng nhập và các tính năng v2.8.2 được giữ nguyên.
- Thêm regression test kiểm tra `JwtModule` được export để tránh lỗi DI tái diễn.

### Dấu hiệu lỗi đã sửa

```text
Nest can't resolve dependencies of the JwtGuard (?, CoSoDuLieuService)
JwtService at index [0] is not available in the TaiKhoanModule module
```

Sau v2.8.3, `docker compose logs api` phải đi tới trạng thái NestJS lắng nghe cổng `3001` thay vì dừng tại `UnknownDependenciesException`.

## Mới trong v2.8.2

V2.8.2 hoàn thiện luồng mật khẩu và SMTP theo đúng hành vi người dùng thực tế:

- `MAIL_USERNAME` là biến tài khoản SMTP chính trong `.env` và Docker. Không cần khai báo `MAIL_USER`; backend chỉ còn giữ `MAIL_USER` như fallback legacy nếu một máy cũ chưa chuyển cấu hình.
- Quên mật khẩu nhận **email đã đăng ký**; backend tra đúng tài khoản và gửi email reset tới `nguoi_dung.thu_dien_tu` của tài khoản đó.
- Email chứa link một lần `/dat-lai-mat-khau?ma=...`; click link sẽ mở trực tiếp trang đặt lại mật khẩu.
- Đăng ký, đặt lại mật khẩu và tạo mật khẩu ban đầu cho nhân viên có cùng checklist: tối thiểu 12 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.
- Giao diện hiển thị **độ mạnh mật khẩu** theo thời gian thực và trạng thái từng yêu cầu.
- Tất cả ô mật khẩu quan trọng có nút **Hiện/Ẩn**.
- Đăng nhập có **Ghi nhớ tài khoản**; chỉ lưu email trong `localStorage`, tuyệt đối không lưu mật khẩu plaintext.
- Backend tiếp tục bắt buộc cùng chính sách mật khẩu bằng `class-validator` và lưu mật khẩu bằng Argon2id.

### Luồng quên mật khẩu

```text
Nhập email đã đăng ký
        ↓
POST /api/v1/xac-thuc/quen-mat-khau
        ↓
Backend tìm nguoi_dung theo email
        ↓
Token 256-bit → email người dùng
SHA-256(token) → PostgreSQL
        ↓
Click nút Đặt lại mật khẩu trong email
        ↓
/dat-lai-mat-khau?ma=...
        ↓
Mật khẩu mới đạt đủ 5 yêu cầu
        ↓
Argon2id → PostgreSQL
        ↓
Thu hồi toàn bộ phiên đăng nhập cũ
```

### Gmail SMTP v2.8.2

Chỉ cần bộ biến chính dưới đây; **không cần `MAIL_USER`**:

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-account@gmail.com
MAIL_PASSWORD=YOUR_GOOGLE_APP_PASSWORD
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
MAIL_STARTTLS_REQUIRED=true
MAIL_FROM="NhienIn3d <your-account@gmail.com>"
MAIL_CONNECTION_TIMEOUT=5000
MAIL_TIMEOUT=5000
MAIL_WRITE_TIMEOUT=5000
MAIL_TLS_REJECT_UNAUTHORIZED=true
WEB_PUBLIC_URL=http://localhost:3000
RESET_PASSWORD_EXPIRES_MINUTES=15
```

## Mới trong v2.8.1

V2.8.1 chuẩn hóa cấu hình SMTP theo bộ biến `MAIL_*` để có thể gửi email khôi phục mật khẩu trực tiếp bằng Gmail/Google Workspace hoặc SMTP tương thích:

- Thêm `MAIL_ENABLED` để bật/tắt gửi mail rõ ràng.
- Dùng `MAIL_USERNAME` làm biến cấu hình chính; `MAIL_USER` chỉ còn là fallback legacy nội bộ và không cần khai báo trong `.env` mới.
- Hỗ trợ `MAIL_SMTP_AUTH`, `MAIL_STARTTLS`, `MAIL_STARTTLS_REQUIRED`.
- Hỗ trợ timeout `MAIL_CONNECTION_TIMEOUT`, `MAIL_TIMEOUT`, `MAIL_WRITE_TIMEOUT`.
- Docker API nhận trực tiếp cấu hình Gmail SMTP; không còn phụ thuộc Mailpit để khởi động.
- Mailpit chuyển thành Docker profile `mailpit`, chỉ chạy khi cần test hộp thư local.
- Thêm lệnh `npm run mail:kiem-tra` để kiểm tra kết nối SMTP trước khi thử quên mật khẩu.
- Không chứa địa chỉ Gmail hay App Password thật trong source/repository.

### Gmail SMTP mẫu

Gmail dùng cổng `587` với STARTTLS. Với xác thực bằng mật khẩu SMTP, hãy bật xác minh 2 bước trên tài khoản Google và dùng **App Password**, không dùng mật khẩu Gmail thông thường.

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-account@gmail.com
MAIL_PASSWORD=YOUR_GOOGLE_APP_PASSWORD
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
MAIL_STARTTLS_REQUIRED=true
MAIL_FROM="NhienIn3d <your-account@gmail.com>"
MAIL_CONNECTION_TIMEOUT=5000
MAIL_TIMEOUT=5000
MAIL_WRITE_TIMEOUT=5000
MAIL_TLS_REJECT_UNAUTHORIZED=true
WEB_PUBLIC_URL=http://localhost:3000
RESET_PASSWORD_EXPIRES_MINUTES=15
```

Kiểm tra SMTP từ thư mục root:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
npm run mail:kiem-tra
```

> `.env` thật bị `.gitignore`; tuyệt đối không đưa App Password vào README, source, commit hoặc GitHub Actions log.

## Mới trong v2.8.0

V2.8.0 hoàn thiện khu vực tài khoản và quản trị nhân sự:

- Chọn màu sản phẩm sẽ cập nhật **preview màu trên ảnh sản phẩm ngay lập tức**. Đây là preview màu trên ảnh tham khảo, không giả làm ảnh chụp riêng của từng màu.
- Nút **Tài khoản** trên thanh điều hướng hiển thị họ tên, email, vai trò, liên kết hồ sơ và nút đăng xuất.
- Người dùng, nhân viên, quản lý và admin đều có thể sửa họ tên/số điện thoại trong `/tai-khoan`.
- `/tai-khoan` hiển thị phiên đăng nhập, cho thu hồi từng phiên, lịch sử đơn hàng và lịch làm việc nếu tài khoản là nhân viên.
- Thêm tài khoản nhân viên, hồ sơ nhân viên, mẫu ca làm và phân ca.
- Thêm `/quan-tri` cho `QUAN_TRI` và `SIEU_QUAN_TRI`: quản lý người dùng, vai trò, trạng thái tài khoản, tạo/sửa hồ sơ nhân viên, tạo ca và xếp ca.
- `SIEU_QUAN_TRI` bypass mọi `VaiTroGuard`; `QUAN_TRI` có toàn quyền trên các module quản trị hiện có nhưng không được tự cấp/đụng tài khoản `SIEU_QUAN_TRI`.
- Mỗi bảng nghiệp vụ mới tiếp tục có tối thiểu 10 dòng seed.

### Backend v2.8.0

Backend **đã có và đang dùng thật** trong project, không phải mock frontend.

```text
apps/api
NestJS 12
  -> Fastify 5
  -> Prisma 7.10
  -> PostgreSQL 18.6
```

Endpoint tài khoản:

```text
GET    /api/v1/tai-khoan/ho-so
PATCH  /api/v1/tai-khoan/ho-so
GET    /api/v1/tai-khoan/phien
DELETE /api/v1/tai-khoan/phien/:id
GET    /api/v1/tai-khoan/don-hang
GET    /api/v1/tai-khoan/lich-lam-viec
```

Endpoint quản trị:

```text
GET    /api/v1/quan-tri/tong-quan
GET    /api/v1/quan-tri/nguoi-dung
PATCH  /api/v1/quan-tri/nguoi-dung/:id
GET    /api/v1/quan-tri/nhan-vien
POST   /api/v1/quan-tri/nhan-vien
PATCH  /api/v1/quan-tri/nhan-vien/:id
GET    /api/v1/quan-tri/ca-lam
POST   /api/v1/quan-tri/ca-lam
GET    /api/v1/quan-tri/phan-ca
POST   /api/v1/quan-tri/phan-ca
PATCH  /api/v1/quan-tri/phan-ca/:id
DELETE /api/v1/quan-tri/phan-ca/:id
```

## Database v2.8.0

Migration mới:

```text
apps/api/prisma/migrations/202608290007_v280_tai_khoan_nhan_vien_phan_ca
```

Bổ sung cột:

```text
nguoi_dung.so_dien_thoai
```

Bảng mới:

```text
nhan_vien
ca_lam_viec
phan_ca
```

Tổng số bảng nghiệp vụ được script kiểm tra seed: **23 bảng**.

Quy ước database vẫn giữ nguyên:

- Tên bảng/cột: tiếng Việt không dấu.
- Dữ liệu: tiếng Việt có dấu UTF-8.
- Migration chạy tăng dần, không ghi đè migration cũ.
- Seed idempotent.
- Mỗi bảng nghiệp vụ có tối thiểu 10 dòng dữ liệu mẫu/historical an toàn.

## Phân quyền

```text
KHACH_HANG      mua hàng + tài khoản cá nhân
NHAN_VIEN       tài khoản cá nhân + lịch làm việc
QUAN_LY         nền tảng quản lý theo module được mở
QUAN_TRI        toàn quyền quản trị nghiệp vụ hiện có
SIEU_QUAN_TRI   bypass toàn bộ VaiTroGuard + bảo vệ cấp cao nhất
```

Tài khoản khai báo bằng `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env` được seed thành `SIEU_QUAN_TRI`.

## Cấu hình `.env`

Giữ các biến PostgreSQL/JWT hiện tại và thêm SMTP thật trong `.env` local. Ví dụ Gmail:

```env
POSTGRES_DB=nhienin3d
POSTGRES_USER=nhienin3d_app
POSTGRES_PORT=5434
API_PORT=3001
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-account@gmail.com
MAIL_PASSWORD=YOUR_GOOGLE_APP_PASSWORD
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
MAIL_STARTTLS_REQUIRED=true
MAIL_FROM="NhienIn3d <your-account@gmail.com>"
MAIL_CONNECTION_TIMEOUT=5000
MAIL_TIMEOUT=5000
MAIL_WRITE_TIMEOUT=5000
MAIL_TLS_REJECT_UNAUTHORIZED=true
WEB_PUBLIC_URL=http://localhost:3000
RESET_PASSWORD_EXPIRES_MINUTES=15
```

Không commit `.env` lên GitHub. Nếu muốn dùng Mailpit thay Gmail để test offline, đặt cấu hình SMTP về Mailpit và khởi động profile `mailpit`.

## Chạy mặc định từ thư mục dự án

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d

npm install
npm audit
npm test
npm run typecheck
npm run build
npm run audit:security
```

Hoặc:

```powershell
.\scripts\kiem-tra.ps1
```

## Cập nhật database và Docker

Không xóa volume khi nâng từ version trước:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d

docker compose up -d --build
docker compose ps
```

Kiểm tra:

```powershell
docker compose logs migrate --tail 150
docker compose logs api --tail 100
docker compose logs web --tail 100
```

Không dùng `docker compose down -v` khi chỉ nâng version vì lệnh đó xóa PostgreSQL volume.

## URL local

```text
Web:             http://localhost:3000
Sản phẩm:        http://localhost:3000/san-pham
Tài khoản:       http://localhost:3000/tai-khoan
Quản trị:        http://localhost:3000/quan-tri
Đăng nhập:       http://localhost:3000/dang-nhap
Quên mật khẩu:   http://localhost:3000/quen-mat-khau
API:             http://localhost:3001/api/v1
Swagger:         http://localhost:3001/tai-lieu
Mailpit profile: http://localhost:8025 (chỉ khi chạy --profile mailpit)
PostgreSQL:      127.0.0.1:5434
```

## Test v2.8.4

1. Chạy `npm run mail:kiem-tra` và xác nhận Gmail SMTP kết nối thành công.
2. Tạo tài khoản mới tại `/dang-ky`: thử mật khẩu yếu rồi tăng dần để kiểm tra thanh độ mạnh và 5 điều kiện.
3. Dùng nút **Hiện/Ẩn** ở cả mật khẩu và xác nhận mật khẩu.
4. Đăng xuất rồi mở `/dang-nhap`; bật **Ghi nhớ tài khoản**, đăng nhập và đăng xuất lại. Email phải tự điền nhưng mật khẩu không được lưu bởi code NhienIn3d.
5. Mở `/quen-mat-khau`, nhập đúng email vừa đăng ký và bấm **Xác nhận và gửi email đặt lại**.
6. Kiểm tra Inbox/Spam của chính email đăng ký; mở email **Đặt lại mật khẩu NhienIn3d**.
7. Click nút trong email. Browser phải mở `/dat-lai-mat-khau?ma=...`.
8. Tại trang reset, thử mật khẩu yếu/mạnh, kiểm tra checklist, Hiện/Ẩn và xác nhận mật khẩu.
9. Reset thành công rồi đăng nhập lại bằng mật khẩu mới; session cũ phải bị thu hồi.
10. Đăng nhập tài khoản khách hàng và kiểm tra `/tai-khoan`, sửa họ tên/số điện thoại rồi lưu.
11. Đăng nhập Admin/Super Admin, mở `/quan-tri`, tạo nhân viên với password strength/checklist rồi xếp ca.
12. Đăng nhập tài khoản nhân viên để xem lịch tại `/tai-khoan`.
13. Mở chi tiết sản phẩm, đổi màu và xác nhận ảnh preview đổi tông màu theo lựa chọn.

## Release GitHub

Sau khi test/build/Docker PASS:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
.\scripts\release.ps1 v2.8.4
```

---

# Lịch sử phiên bản

Các phiên bản dưới đây được sắp xếp **đúng thứ tự tăng dần**.

## v1.0.0 — 29/08/2026

- Khởi tạo NhienIn3d.
- Next.js, NestJS, PostgreSQL, Prisma và Docker Compose.
- Seed 10 sản phẩm mẫu.

## v1.0.1 — 29/08/2026

- Sửa TypeScript build.
- Bổ sung OpenSSL cho Prisma trong Docker.
- Bổ sung kiểm tra dependency bảo mật.

## v1.0.2 — 29/08/2026

- Thêm npm workspaces.
- Chuẩn hóa test/typecheck/build từ thư mục root.

## v1.0.3 — 29/08/2026

- Vá `deepmerge-ts` qua root security overrides.
- `npm audit` sạch mức High.

## v1.0.4 — 29/08/2026

- Prisma tự dựng `DATABASE_URL` từ `POSTGRES_*`.
- Chuẩn hóa kết nối PostgreSQL local.

## v1.0.5 — 29/08/2026

- Chuyển backend NestJS sang ESM/NodeNext.
- Chuẩn hóa relative import `.js`.

## v1.0.6 — 29/08/2026

- PostgreSQL Windows chuyển sang port 5434.
- PostgreSQL 18 mount volume đúng `/var/lib/postgresql`.
- Docker API dùng root security overrides.

## v1.0.7 — 29/08/2026

- Bổ sung `@fastify/static` cho Swagger.
- Chuẩn hóa mỗi bảng nghiệp vụ có tối thiểu 10 dòng seed.
- Thêm script kiểm tra dữ liệu.

## v2.0.0 — 29/08/2026

- Thêm giỏ hàng và chi tiết giỏ hàng PostgreSQL.
- Checkout transaction, kiểm tra tồn kho và trừ tồn ở server.
- Thêm thanh toán và địa chỉ người dùng.

## v2.1.0 — 29/08/2026

- Tinh chỉnh typography storefront.
- Bỏ nội dung quảng bá version khỏi giao diện.
- Thêm thanh toán giả lập local.

## v2.1.1 — 29/08/2026

- Tách route chi tiết sản phẩm, giỏ hàng và thanh toán.
- Sửa luồng click sản phẩm và xem giỏ hàng trước checkout.

## v2.2.0 — 29/08/2026

- Tinh gọn trang chủ.
- Thử nghiệm viewer 3D/ảnh tương tác.
- Chuyển lịch sử phát triển về README.

## v2.2.1 — 29/08/2026

- Dọn file storefront legacy khi chép source đè.
- Sửa regression test lịch sử phiên bản.

## v2.3.0 — 29/08/2026

- Thêm trang danh sách sản phẩm.
- Tìm kiếm, lọc, sắp xếp.
- Thêm yêu thích lưu PostgreSQL.

## v2.4.0 — 29/08/2026

- Thử nghiệm viewer WebGL/Three.js cho sản phẩm.
- Bỏ dải chữ trang trí không có chức năng.

## v2.4.1 — 29/08/2026

- Chuẩn hóa thứ tự sản phẩm mặc định theo mã `001 -> 010`.

## v2.5.0 — 29/08/2026

- Thêm đánh giá 1–5 sao lưu PostgreSQL.
- Thêm sản phẩm liên quan và đã xem gần đây.

## v2.6.0 — 29/08/2026

- Thêm đăng ký, đăng nhập, đăng xuất và refresh session.
- Mật khẩu Argon2id.
- RBAC 5 vai trò.
- Khóa tạm tài khoản sau nhiều lần đăng nhập sai.

## v2.6.1 — 29/08/2026

- Bỏ viewer 3D sản phẩm vì model dựng không khớp ảnh thật.
- Thêm lựa chọn màu theo biến thể PostgreSQL.
- Giỏ hàng lưu đúng biến thể/màu đã chọn.

## v2.7.0 — 29/08/2026

- Thêm quên mật khẩu qua email.
- Token reset 256-bit, database chỉ lưu SHA-256.
- Mật khẩu mới Argon2id.
- Thu hồi toàn bộ session cũ sau reset.
- Thêm Mailpit local và bảng `dat_lai_mat_khau`.

## v2.8.0 — 29/08/2026

- Ảnh sản phẩm đổi preview màu khi chọn biến thể màu.
- Hoàn thiện menu Tài khoản và sửa luồng đăng xuất.
- Cho phép sửa hồ sơ cá nhân cho mọi tài khoản đã đăng nhập.
- Thêm lịch sử đơn hàng, quản lý phiên và lịch làm việc trong tài khoản.
- Thêm `nhan_vien`, `ca_lam_viec`, `phan_ca` và seed tối thiểu 10 dòng mỗi bảng.
- Thêm khu quản trị người dùng, tạo/sửa nhân viên, ca làm và xếp ca.
- `SIEU_QUAN_TRI` bypass mọi role guard; `QUAN_TRI` toàn quyền trên module quản trị hiện có.

## v2.8.1 — 29/08/2026

- Chuẩn hóa gửi email bằng Gmail/SMTP với `MAIL_ENABLED`, `MAIL_USERNAME`, SMTP AUTH và STARTTLS.
- Thêm timeout SMTP và lệnh `npm run mail:kiem-tra`.
- Docker API không còn phụ thuộc Mailpit; Mailpit chuyển thành profile test tùy chọn.
- Giữ App Password ngoài source/Git và tiếp tục dùng link đặt lại mật khẩu một lần.

## v2.8.2 — 29/08/2026

- Chuẩn hóa `MAIL_USERNAME` là cấu hình SMTP chính; bỏ `MAIL_USER` khỏi `.env.example` và Docker Compose mới.
- Xác nhận backend gửi reset tới đúng email đã đăng ký và link email mở trang đặt lại mật khẩu.
- Thêm độ mạnh mật khẩu, checklist chữ hoa/chữ thường/số/ký tự đặc biệt và nút Hiện/Ẩn.
- Áp dụng UX mật khẩu cho đăng ký, reset mật khẩu và tạo tài khoản nhân viên.
- Thêm Ghi nhớ tài khoản khi đăng nhập, chỉ lưu email và không lưu mật khẩu plaintext.

## v2.8.3 — 29/08/2026

- Sửa runtime DI `JwtGuard -> JwtService` làm API NestJS crash trong `TaiKhoanModule` và `QuanTriModule`.
- Re-export `JwtModule` từ `XacThucModule` để các module sử dụng guard nhận đúng `JwtService`.
- Sửa lỗi giao diện `Failed to fetch` do backend không khởi động.
- Thêm regression test cho dependency injection của guard.
- Không đổi database schema; giữ toàn bộ Gmail SMTP và password UX của v2.8.2.

## v2.8.4 — 29/08/2026

- Bỏ mô tả dài trên form đăng nhập.
- Đặt Quên mật khẩu ngang hàng với Ghi nhớ tài khoản.
- Đổi Tạo tài khoản thành Đăng kí.
- Thu nhỏ nút Đăng nhập trên desktop.
- Không đổi backend/database.

---

# Lộ trình tiếp theo

## v2.9.0

- Dashboard thống kê quản trị.
- Doanh thu theo ngày/7 ngày/30 ngày.
- Số đơn, trạng thái đơn, giá trị đơn trung bình.
- Top sản phẩm, tồn kho thấp, khách hàng mới.
- Phân quyền dashboard theo vai trò.

## v3.0.0

- CRUD quản trị mở rộng cho sản phẩm/danh mục/tồn kho/đơn hàng.
- MFA/TOTP cho quản trị.
- Audit nâng cao.
- Backup/restore.
- Security hardening và E2E regression.
