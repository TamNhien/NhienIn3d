# NhienIn3d

> Phiên bản hiện tại: **v3.13.0** — 02/09/2026
- **Multi-region quorum + asymmetric probe v3.13.0**: bổ sung Ed25519 signing tùy chọn bên cạnh HMAC, public-key rotation grace-period, quorum/consensus theo region và anomaly detection latency/status trên persistent probe samples.

NhienIn3d là web thương mại điện tử cho sản phẩm in 3D với **frontend Next.js** và **backend NestJS/Fastify** kết nối **PostgreSQL qua Prisma**.

## Kiến trúc hiện tại

- Frontend: Next.js 16.3.3 + React 19.2.8 + Tailwind CSS 4/PostCSS, giữ React Three Fiber/Drei cho khối 3D.
- Backend: NestJS 12 + Fastify 5.
- Database: PostgreSQL 18.6.
- ORM: Prisma 7.10.0.
- Xác thực: JWT access token + refresh token HttpOnly cookie.
- Mật khẩu: Argon2id.
- Email: Nodemailer 9.0.6; hỗ trợ Gmail/Google Workspace SMTP qua STARTTLS, Mailpit giữ làm profile test tùy chọn.
- Container: Docker Compose.
- CI/Release: GitHub Actions + GitHub CLI.

## Điểm chính bản hiện tại

- **Ed25519 probe signing**: `scripts/probe-agent-v3130.mjs` ưu tiên private key Ed25519 qua `NH3D_PROBE_AGENT_PRIVATE_KEY` / `NH3D_PROBE_AGENT_PRIVATE_KEY_FILE`; API xác minh bằng `SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON`. HMAC-SHA256 v3.11 vẫn tương thích ngược.
- **Rotation grace-period**: mỗi agent trong `SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON` có thể trỏ tới một public key hoặc mảng nhiều public key; server chấp nhận bất kỳ key hợp lệ nào trong lúc rotate, không cần giữ private key phía server.
- **Key generation an toàn**: `npm run probe:keygen -- agent-hcm-01` tạo Ed25519 keypair vào `.probe-keys/`; thư mục này bị `.gitignore`, source không chứa private key.
- **Multi-region quorum/consensus**: Ops runtime tính quorum theo persistent `slo_endpoint_mau`, `SYSTEM_SLO_QUORUM_MIN_REGIONS`, `SYSTEM_SLO_QUORUM_HEALTHY_PERCENT` và `SYSTEM_SLO_QUORUM_WINDOW_SECONDS`; phân loại `QUORUM_OK` / `DEGRADED` / `OUTAGE` và phát hiện region bất đồng.
- **Anomaly detection**: so latency mới nhất với median baseline theo region/endpoint, ngưỡng multiplier cấu hình; đồng thời phát hiện status anomaly khi baseline ổn định nhưng sample mới chuyển xấu.
- **Managed probe fleet v3.12 được giữ nguyên**: ONLINE/STALE/OFFLINE/MISSING, key/registration coverage, keepalive runner và compact badge; v3.13 mở rộng coverage để chấp nhận cả HMAC per-agent key lẫn Ed25519 public key.
- **Ops Dashboard v3.13**: thêm panel **Multi-region quorum · anomaly detection**, badge compact `QUORUM OK` / `DEGRADED`, số endpoint/quorum/disagreement/anomaly và trạng thái signing; không hiển thị raw secret/private key.
- **Database**: v3.13.0 không thêm migration; tiếp tục dùng 23 migrations, migration mới nhất `202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive`. Runtime/browser dùng `scripts/e2e-runtime-v3130.ps1` / `scripts/e2e-browser-v3130.mjs`; CI/Health/OpenAPI đồng bộ **v3.13.0**.

## Tài khoản và bảo mật

V2.8.6 sửa ba vấn đề trực tiếp ở khu vực Tài khoản mà không thay đổi schema PostgreSQL:

- Nhận diện **Brave** bằng `navigator.brave.isBrave()` thay vì chỉ dựa vào User-Agent Chromium. Phiên hiện tại được cập nhật nhãn kiểu `Brave (Chromium 152) · Windows 10/11`; nhãn trình duyệt chỉ phục vụ hiển thị và không tham gia quyết định bảo mật.
- Đăng nhập/đăng kí gửi nhãn trình duyệt đã nhận diện về backend; refresh session kế thừa nhãn của phiên trước để không quay lại chuỗi User-Agent dài.
- **Lưu thông tin tài khoản** cập nhật PostgreSQL rồi frontend đọc lại `GET /tai-khoan/ho-so` để xác nhận dữ liệu đã lưu thật. Navbar nhận sự kiện cập nhật và hiển thị tên/email mới ngay.
- Seed không còn ghi đè họ tên/email/mật khẩu của Super Admin đang hoạt động. `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` chỉ dùng để bootstrap Admin lần đầu. Vì vậy Admin sửa hồ sơ xong sẽ không bị seed đổi ngược ở lần chạy Docker tiếp theo.
- Thêm **Đổi mật khẩu** ngay tại `/tai-khoan` cho tất cả vai trò, kể cả `QUAN_TRI` và `SIEU_QUAN_TRI`. Bắt buộc nhập mật khẩu hiện tại, mật khẩu mới đủ 12 ký tự + chữ hoa + chữ thường + số + ký tự đặc biệt.
- Mật khẩu mới được hash bằng Argon2id. Sau khi đổi thành công, backend tăng `phien_ban_mat_khau`, thu hồi mọi phiên khác và phát access JWT mới cho phiên hiện tại để người dùng không bị đá ra ngay.
- Không có migration mới; dùng các bảng `nguoi_dung`, `phien_dang_nhap`, `nhat_ky_bao_mat` hiện có.

### API tài khoản v2.8.6

```text
PATCH /api/v1/tai-khoan/ho-so
PATCH /api/v1/tai-khoan/doi-mat-khau
PATCH /api/v1/tai-khoan/phien/hien-tai
GET   /api/v1/tai-khoan/phien
```

## Trải nghiệm sản phẩm và hồ sơ

V2.8.5 là hotfix đồng bộ UI + tài khoản + session. Không thay đổi schema PostgreSQL nên không có migration mới.

- Chọn màu áp bộ lọc trực tiếp lên ảnh sản phẩm, bỏ lớp màu phủ toàn khung ảnh.
- Dữ liệu mẫu dùng họ tên Việt Nam và email định dạng thực tế trên miền `example.com` (miền dành riêng cho tài liệu/kiểm thử, tránh gửi nhầm người thật).
- Đăng nhập và khu Đăng kí được canh giữa.
- Mọi vai trò, kể cả `QUAN_TRI` và `SIEU_QUAN_TRI`, có thể sửa họ tên, email và số điện thoại của chính mình. Vai trò vẫn chỉ do hệ thống/Admin quản lý.
- Access JWT mới gắn `sid` phiên đăng nhập; logout thu hồi phiên server-side và xóa cookie rõ ràng để không tự đăng nhập lại.

- Bỏ dòng mô tả dài về cookie HttpOnly/ghi nhớ tài khoản khỏi trang Đăng nhập.
- Đặt **Quên mật khẩu?** ngang hàng với **Ghi nhớ tài khoản** trong cùng một hàng tùy chọn.
- Đổi nhãn người dùng **Tạo tài khoản** thành **Đăng kí** ở heading, nút submit và liên kết từ trang đăng nhập.
- Thu nhỏ nút **Đăng nhập** trên desktop; mobile vẫn tự giãn toàn chiều rộng để dễ thao tác.
- Ghi nhớ tài khoản vẫn chỉ lưu email trong `localStorage`; không thay đổi cơ chế cookie HttpOnly/session phía backend.
- Không có migration mới.

## Ổn định backend NestJS

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

## Mật khẩu và ghi nhớ tài khoản

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

## Gmail SMTP

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

## Nhân sự và phân quyền

V2.8.0 hoàn thiện khu vực tài khoản và quản trị nhân sự:

- Chọn màu sản phẩm sẽ cập nhật **preview màu trên ảnh sản phẩm ngay lập tức**. Đây là preview màu trên ảnh tham khảo, không giả làm ảnh chụp riêng của từng màu.
- Nút **Tài khoản** trên thanh điều hướng hiển thị họ tên, email, vai trò, liên kết hồ sơ và nút đăng xuất.
- Người dùng, nhân viên, quản lý và admin đều có thể sửa họ tên/số điện thoại trong `/tai-khoan`.
- `/tai-khoan` hiển thị phiên đăng nhập, cho thu hồi từng phiên, lịch sử đơn hàng và lịch làm việc nếu tài khoản là nhân viên.
- Thêm tài khoản nhân viên, hồ sơ nhân viên, mẫu ca làm và phân ca.
- Thêm `/quan-tri` cho `QUAN_TRI` và `SIEU_QUAN_TRI`: quản lý người dùng, vai trò, trạng thái tài khoản, tạo/sửa hồ sơ nhân viên, tạo ca và xếp ca.
- `SIEU_QUAN_TRI` bypass mọi `VaiTroGuard`; `QUAN_TRI` có toàn quyền trên các module quản trị hiện có nhưng không được tự cấp/đụng tài khoản `SIEU_QUAN_TRI`.
- Các bảng dữ liệu mẫu tĩnh tiếp tục có tối thiểu 10 dòng seed; tài khoản/nhân sự/ca/phân ca là dữ liệu vận hành và được phép thay đổi số lượng.

### Backend hiện tại — v2.15.1

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

Endpoint quản trị chính:

```text
GET    /api/v1/quan-tri/tong-quan
GET    /api/v1/quan-tri/nguoi-dung
POST   /api/v1/quan-tri/nguoi-dung/:id/cap-nhat
POST   /api/v1/quan-tri/nguoi-dung/:id/kich-hoat
POST   /api/v1/quan-tri/nguoi-dung/:id/khoa
POST   /api/v1/quan-tri/nguoi-dung/:id/xoa

GET    /api/v1/quan-tri/danh-muc
POST   /api/v1/quan-tri/danh-muc
POST   /api/v1/quan-tri/danh-muc/:id/cap-nhat
POST   /api/v1/quan-tri/danh-muc/:id/xoa

GET    /api/v1/quan-tri/san-pham
POST   /api/v1/quan-tri/san-pham
POST   /api/v1/quan-tri/san-pham/:id/cap-nhat
POST   /api/v1/quan-tri/san-pham/:id/xoa
GET    /api/v1/quan-tri/vat-lieu
GET    /api/v1/quan-tri/mau-sac
POST   /api/v1/quan-tri/san-pham/:id/bien-the
POST   /api/v1/quan-tri/bien-the/:id/cap-nhat
POST   /api/v1/quan-tri/bien-the/:id/xoa

GET    /api/v1/quan-tri/danh-gia
POST   /api/v1/quan-tri/danh-gia/:id/trang-thai
POST   /api/v1/quan-tri/danh-gia/:id/xoa
GET    /api/v1/quan-tri/bao-cao/don-hang
GET    /api/v1/quan-tri/bao-cao/doanh-thu
GET    /api/v1/quan-tri/bao-cao/ton-kho
GET    /api/v1/quan-tri/nhat-ky

GET    /api/v1/quan-tri/nhan-vien
POST   /api/v1/quan-tri/nhan-vien
GET    /api/v1/quan-tri/ca-lam
POST   /api/v1/quan-tri/ca-lam
GET    /api/v1/quan-tri/phan-ca
POST   /api/v1/quan-tri/phan-ca
```

## Cấu trúc database tài khoản và nhân sự

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

Tổng số bảng nghiệp vụ được script kiểm tra seed: **24 bảng**.

Quy ước database vẫn giữ nguyên:

- Tên bảng/cột: tiếng Việt không dấu.
- Dữ liệu: tiếng Việt có dấu UTF-8.
- Migration chạy tăng dần, không ghi đè migration cũ.
- Seed idempotent.
- Các bảng dữ liệu mẫu tĩnh có tối thiểu 10 dòng; bảng tài khoản/nhân sự/ca/phân ca được phép giảm số lượng do thao tác quản trị.

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

## HTTPS local không còn cảnh báo “Kết nối không an toàn”

Chế độ Docker mặc định vẫn giữ HTTP để tương thích. Khi cần trình duyệt hiển thị kết nối an toàn trên máy Windows, chạy **một lệnh**:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
.\scripts\https-local.ps1
```

Script sẽ tự động:

1. Chạy stack bằng `docker-compose.https.yml`.
2. Đặt Caddy trước Web/API và phục vụ TLS tại `https://localhost:3000`.
3. Proxy `/api/*` về API nội bộ để frontend HTTPS không gọi API HTTP/mixed-content.
4. Sao chép CA local của Caddy và cài vào **Trusted Root Certification Authorities của CurrentUser** bằng `certutil -user`; không cần cài chứng thư hệ thống cho toàn máy.
5. Mở trình duyệt tại `https://localhost:3000`.

Sau lần đầu, nếu tab cũ vẫn hiện trạng thái trước đó, nhấn `Ctrl+F5` hoặc đóng/mở lại tab. **Không xóa volume Caddy** nếu muốn giữ nguyên CA đã được Windows tin cậy.

Dừng stack HTTPS:

```powershell
docker compose -f docker-compose.https.yml down
```

Nếu không còn dùng HTTPS local và muốn gỡ CA khỏi Trusted Root của tài khoản Windows hiện tại:

```powershell
.\scripts\https-local-bo-tin-cay.ps1
```

Muốn chạy riêng Next.js HTTPS trong lúc phát triển frontend, có thể dùng:

```powershell
npm run dev:web:https
```

Next.js hỗ trợ `--experimental-https` cho local development; với toàn bộ hệ thống Docker, ưu tiên `https-local.ps1` để Web và API luôn cùng origin HTTPS.

## URL local

```text
Web HTTP:        http://localhost:3000
Web HTTPS:       https://localhost:3000 (sau khi chạy .\scripts\https-local.ps1)
Sản phẩm HTTPS: https://localhost:3000/san-pham
Tài khoản HTTPS:https://localhost:3000/tai-khoan
Quản trị HTTPS: https://localhost:3000/quan-tri
Đăng nhập HTTPS:https://localhost:3000/dang-nhap
API trực tiếp:    http://localhost:3001/api/v1
Swagger HTTPS:   https://localhost:3000/tai-lieu
Swagger trực tiếp:http://localhost:3001/tai-lieu
Mailpit profile: http://localhost:8025 (chỉ khi chạy --profile mailpit)
PostgreSQL:      127.0.0.1:5434
```

## Kiểm thử hiện tại

1. Chạy `npm run mail:kiem-tra` và xác nhận Gmail SMTP kết nối thành công.
2. Tạo tài khoản mới tại `/dang-ky`: thử mật khẩu yếu rồi tăng dần để kiểm tra thanh độ mạnh và 5 điều kiện.
3. Dùng nút **Hiện/Ẩn** ở cả mật khẩu và xác nhận mật khẩu.
4. Đăng xuất rồi mở `/dang-nhap`; bật **Ghi nhớ tài khoản**, đăng nhập và đăng xuất lại. Email phải tự điền nhưng mật khẩu không được lưu bởi code NhienIn3d.
5. Mở `/quen-mat-khau`, nhập đúng email vừa đăng ký và bấm **Xác nhận và gửi email đặt lại**.
6. Kiểm tra Inbox/Spam của chính email đăng ký; mở email **Đặt lại mật khẩu NhienIn3d**.
7. Click nút trong email. Browser phải mở `/dat-lai-mat-khau?ma=...`.
8. Tại trang reset, thử mật khẩu yếu/mạnh, kiểm tra checklist, Hiện/Ẩn và xác nhận mật khẩu.
9. Reset thành công rồi đăng nhập lại bằng mật khẩu mới; session cũ phải bị thu hồi.
10. Đăng nhập bằng **Brave**, mở `/tai-khoan`; phiên hiện tại phải hiện `Brave (Chromium ...) · Windows 10/11` thay vì chuỗi `Mozilla/... Chrome/...`. Phiên cũ chưa có nhãn chỉ hiện `Chromium ... (phiên cũ chưa phân biệt Brave/Chrome)`.
11. Ở `/tai-khoan`, sửa họ tên/email/số điện thoại rồi bấm **Lưu thay đổi**. Trang phải báo `Đã lưu thông tin tài khoản vào PostgreSQL.`; refresh trang và xác nhận dữ liệu vẫn giữ nguyên. Kiểm tra cả tài khoản Admin/Super Admin.
12. Ở mục **Đổi mật khẩu**, nhập mật khẩu hiện tại + mật khẩu mới đủ 5 điều kiện + xác nhận; đổi thành công rồi refresh trang vẫn đăng nhập bình thường. Các phiên khác phải bị thu hồi.
13. Chạy lại `docker compose up -d --build`/seed và xác nhận hồ sơ Admin vừa sửa không bị `ADMIN_NAME`/`ADMIN_EMAIL` ghi đè trở lại.
14. Đăng nhập Admin/Super Admin, mở `/quan-tri`, tạo nhân viên với password strength/checklist rồi xếp ca.
15. Đăng nhập tài khoản nhân viên để xem lịch tại `/tai-khoan`.
16. Mở chi tiết sản phẩm và xác nhận không còn khối **Chọn màu sắc**; ảnh dùng trực tiếp ảnh gốc, hệ thống tự chọn biến thể mặc định đầu tiên còn hàng và chỉ cho chọn số lượng.
17. Trong `/quan-tri`, xác nhận Super Admin nằm đầu danh sách và hiển thị **Bảo vệ**; tài khoản khóa có nút **Kích hoạt**, tài khoản hoạt động có nút **Khóa**.
18. Khóa một tài khoản thường, sau đó bấm **Kích hoạt** và đăng nhập ngay bằng tài khoản đó; không được còn lỗi khóa tạm thời từ `khoa_den`.
19. Đăng nhập bằng tài khoản `QUAN_TRI`, xóa một tài khoản khách hàng/nhân viên thử nghiệm và xác nhận card biến mất sau khi tải lại; không được phép xóa chính tài khoản đang đăng nhập hoặc Super Admin gốc.
20. Bấm **Đăng xuất**, sau đó F5 nhiều lần ở `/dang-nhap?da_dang_xuat=1`; navbar phải tiếp tục ở trạng thái chưa đăng nhập và `/xac-thuc/toi` không được tự phục hồi bằng refresh cookie cũ.

## Release GitHub

Sau khi test/build/Docker PASS:

```powershell
cd D:\LienThongDH\DoAn\NhienIn3d
.\scripts\release.ps1 v3.1.0
```

---

# Lịch sử phiên bản

Các phiên bản dưới đây được sắp xếp **đúng thứ tự tăng dần**.

## v1.0.0 — 29/08/2026

- Khởi tạo NhienIn3d.
- Next.js, NestJS, PostgreSQL, Prisma và Docker Compose.
- Seed nền ban đầu có 10 sản phẩm mẫu; từ v2.12.2 được mở rộng lên 12 sản phẩm.

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

## v2.8.5 — 29/08/2026

- Chọn màu tác động trực tiếp lên ảnh sản phẩm, bỏ lớp màu phủ toàn khung.
- Chuẩn hóa dữ liệu mẫu bằng họ tên Việt Nam và email định dạng thực tế trên `example.com`.
- Canh giữa nút Đăng nhập, heading/nút/liên kết Đăng kí.
- Cho mọi tài khoản, kể cả Admin/Super Admin, sửa họ tên, email và số điện thoại của chính mình.
- Access JWT mới gắn `sid`, logout thu hồi session PostgreSQL và xóa cookie dứt điểm.
- Không đổi schema PostgreSQL; không có migration mới.

## v2.8.6 — 29/08/2026

- Nhận diện Brave đúng bằng Brave API phía browser và cập nhật nhãn phiên đăng nhập.
- Sửa lưu hồ sơ: ghi PostgreSQL, đọc lại xác nhận và cập nhật navbar.
- Seed không ghi đè hồ sơ/mật khẩu Super Admin đang hoạt động; biến `ADMIN_*` chỉ bootstrap lần đầu.
- Thêm đổi mật khẩu trong trang Tài khoản cho mọi vai trò, xác minh mật khẩu hiện tại và dùng Argon2id cho mật khẩu mới.
- Sau đổi mật khẩu, thu hồi các phiên khác và cấp access JWT mới cho phiên hiện tại.
- Không đổi schema PostgreSQL; không có migration mới.


## v2.8.7 — 29/08/2026

- Ảnh màu sản phẩm chuyển sang URL ảnh biến thể riêng; ảnh gốc được giữ làm nền và vùng sản phẩm đổi màu, không áp filter lên toàn khung ảnh.
- Danh sách quản trị luôn xếp `SIEU_QUAN_TRI` đầu bảng; thêm cột **Thao tác** với nút **Kích hoạt/Khóa** rõ ràng.
- Đăng xuất thu hồi toàn bộ session PostgreSQL của tài khoản, dọn cả refresh cookie legacy và chặn frontend tự refresh lại sau F5.
- JWT legacy không có `sid` phải đăng nhập lại để mọi thao tác thu hồi session có hiệu lực tức thì.

## v2.8.8 — 29/08/2026

- Bổ sung số điện thoại và địa chỉ trong form Đăng kí.
- Backend tạo địa chỉ mặc định trong `dia_chi_nguoi_dung` cùng transaction tạo tài khoản.
- Trang Tài khoản đọc và cho phép cập nhật địa chỉ mặc định.
- Không đổi schema PostgreSQL.

## v2.8.9 — 29/08/2026

- Bảo vệ `SIEU_QUAN_TRI`: không thể khóa, xóa hoặc hạ vai trò tài khoản gốc từ UI/API.
- Giữ Super Admin đứng đầu bảng và hiển thị trạng thái **Bảo vệ** thay cho nút Khóa.
- Làm dịu nền panel Tài khoản/Quản trị để bố cục phân lớp rõ hơn.
- Chỉnh bố cục đổi mật khẩu theo dạng 2 cột cân đối trên desktop, 1 cột trên mobile.
- Kế thừa toàn bộ đăng kí số điện thoại/địa chỉ của v2.8.8 và các bản sửa session trước đó.

## v2.9.0 — 30/08/2026

- Đồng bộ giao diện Đăng nhập/Đăng ký/Quên mật khẩu/Đặt lại mật khẩu/Tài khoản theo card compact của CineBooking Pro.
- Làm lại trang Quản trị theo dashboard + tab + card responsive thay cho bảng người dùng quá rộng.
- Sửa kích hoạt lại tài khoản đã khóa bằng cách reset `khoa_den` và số lần đăng nhập thất bại; khóa thủ công đồng thời thu hồi session.
- Bổ sung API và UI xóa tài khoản theo RBAC; giữ bảo vệ tài khoản đang đăng nhập và Super Admin gốc.
- Không đổi schema PostgreSQL; giữ lịch sử đơn hàng/giỏ hàng theo quy tắc `SetNull` hiện có.

## v2.9.1 — 30/08/2026

- Bỏ hoàn toàn phần chọn màu trên trang chi tiết sản phẩm; người dùng chỉ chọn số lượng.
- Tự lấy biến thể mặc định theo quy tắc: **biến thể đầu tiên còn hàng**, nếu tất cả hết thì lấy biến thể đầu tiên để hiển thị trạng thái hết hàng.
- Ảnh chi tiết dùng ảnh gốc, không còn đổi `src` sang API ảnh biến thể theo màu.
- Card sản phẩm đổi nút **Chọn màu** thành **Xem chi tiết** và bỏ chip màu.
- Giỏ hàng ẩn màu biến thể, chỉ hiển thị vật liệu/cấu hình mặc định; backend vẫn giữ `ma_bien_the` để tồn kho và dữ liệu đơn hàng không bị phá.
- Không đổi schema PostgreSQL, không cần migration mới.

## v2.9.2 — 30/08/2026

- Hợp nhất `QUAN_TRI` và `SIEU_QUAN_TRI` thành **một vai trò `ADMIN` duy nhất** có toàn quyền hệ thống; loại bỏ hai chức danh quản trị cũ khỏi schema, API và Web hiện hành.
- Thêm migration PostgreSQL chuyển dữ liệu tài khoản `QUAN_TRI`/`SIEU_QUAN_TRI` hiện có sang `ADMIN`, không cần tạo lại tài khoản.
- Tách API khóa/kích hoạt tài khoản thành endpoint chuyên dụng. Khi kích hoạt, hệ thống luôn đặt `da_kich_hoat=true`, xóa `khoa_den` và reset `so_lan_dang_nhap_that_bai=0` để tài khoản đăng nhập lại ngay.
- Khi Admin khóa tài khoản, toàn bộ session đang hoạt động của tài khoản đó bị thu hồi.
- Admin được đổi quyền, khóa/kích hoạt và xóa mọi tài khoản **khác**; chỉ chặn tự khóa hoặc tự xóa chính phiên Admin đang dùng để tránh tự mất quyền truy cập.
- Giữ nguyên lịch sử đơn hàng và dữ liệu nghiệp vụ theo các quan hệ `SetNull` hiện có khi tài khoản bị xóa.

## v2.9.3 — 30/08/2026

- Làm lại **Ca làm** theo phong cách CineBooking Pro: tiêu đề `STAFF OPERATIONS`, form compact bên trái và danh sách mẫu ca bên phải, bố cục `420px + 1fr` trên desktop và tự xếp 1 cột trên màn hình nhỏ.
- Làm lại **Xếp ca** theo đúng flow CineBooking Pro: form nhân viên/ngày/ca/ghi chú bên trái, bộ lọc từ ngày–đến ngày và lịch phân ca nhóm theo từng ngày ở bên phải.
- Chỉ hiển thị nhân viên đang làm và tài khoản đang hoạt động trong danh sách xếp ca; ca ngừng hoạt động không xuất hiện để chọn.
- Danh sách lịch hiển thị mã nhân viên, họ tên, bộ phận, chức danh, tên ca, giờ làm, trạng thái và thao tác xóa trong card gọn, responsive.
- Giữ nguyên thay đổi v2.9.1: sản phẩm tự dùng cấu hình/biến thể mặc định, không yêu cầu người mua chọn màu.
- Quy trình release chuẩn chạy từ `D:\LienThongDH\DoAn\NhienIn3d`: test → typecheck → build → Docker Compose → `scripts\release.ps1` để push tag và kích hoạt GitHub Release.

## v2.9.4 — 30/08/2026

- Sửa lỗi các request `POST`/`DELETE` không có body nhưng vẫn gửi `Content-Type: application/json`, nguyên nhân trực tiếp của thông báo `Body cannot be empty when content-type is set to application/json` trên trang Admin.
- Nút **Kích hoạt**, **Khóa**, **Xóa tài khoản**, thu hồi phiên, refresh session và đăng xuất gửi request body rỗng đúng chuẩn Fastify 5.
- Hồ sơ dùng bản ghi PostgreSQL trả về ngay từ `PATCH /tai-khoan/ho-so` làm dữ liệu đã lưu; request xác minh tiếp theo không còn có thể làm mất state vừa lưu khi mạng lỗi.
- Bắt buộc `no-store` cho luồng xác thực/tài khoản/quản trị để tránh hiển thị lại dữ liệu cũ sau khi đổi họ tên, email, số điện thoại hoặc trạng thái tài khoản.
- Seed v2.9.4 chuyển dữ liệu người dùng/nhân viên/địa chỉ mẫu sang cơ chế **bootstrap-only**: chạy lại Docker/migrate/seed không reset họ tên, email, số điện thoại, vai trò, trạng thái kích hoạt, chức danh/bộ phận hoặc địa chỉ đã chỉnh. `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` cũng chỉ bootstrap Admin lần đầu.
- Seed tự sửa dữ liệu cũ từng có nhiều địa chỉ `la_mac_dinh=true`: giữ bản ghi được tạo đầu tiên và bỏ cờ mặc định ở các bản sao do seed cũ tạo. Khi người dùng lưu hồ sơ, backend tiếp tục ép chỉ còn đúng một địa chỉ mặc định.
- Nhờ vậy tài khoản mẫu đã **Kích hoạt** không bị seed khóa trở lại sau `docker compose up -d --build`, và thông tin hồ sơ không quay về dữ liệu mẫu.
- Không có migration database mới.

## v2.9.5 — 30/08/2026

- Sửa lưu hồ sơ theo transaction PostgreSQL và bỏ request GET xác minh ngay sau PATCH, ngăn dữ liệu vừa sửa bị state cũ ghi đè trên giao diện.
- Tăng kích thước form/chữ trên toàn bộ màn hình xác thực, tài khoản, quản trị, ca làm, xếp ca và checkout.
- Thêm endpoint `POST /api/v1/quan-tri/nguoi-dung/:id/xoa` có body để xóa tài khoản ổn định qua Fastify/proxy; dọn quan hệ tường minh trước khi xóa nhưng giữ lịch sử đơn hàng/giỏ hàng.
- Chỉ còn `ADMIN`, `NHAN_VIEN`, `KHACH_HANG`; loại `QUAN_LY` khỏi schema hiện hành. Admin là quyền quản trị duy nhất.
- Nhân viên được chuẩn hóa thành **Nhân viên bán hàng / Bán hàng**; form tạo nhân viên không cho chọn chức danh, bộ phận hoặc quyền Admin.
- Trạng thái hồ sơ nhân sự được đồng bộ trực tiếp với trạng thái tài khoản: Đang làm = kích hoạt; Tạm nghỉ/Nghỉ việc = khóa + thu hồi session.
- Làm lại form tạo nhân viên theo bố cục CineBooking Pro `460px + 1fr`, thêm xác nhận mật khẩu và panel quyền rõ ràng.
- Thêm migration `202608300002_v295_nhan_vien_ban_hang` để chuẩn hóa dữ liệu cũ và seed mới cho toàn bộ 10 nhân viên mẫu bán hàng.
- Quy trình release chuẩn tiếp tục chạy từ `D:\LienThongDH\DoAn\NhienIn3d`: test → typecheck → build → Docker Compose → `.\scripts\release.ps1 v2.9.5`.

## v2.9.6 — 30/08/2026

- Đổi nền nút **Giỏ hàng** trên header từ trắng sang dark glass `#172033 → #0f172a`, đồng bộ với giao diện CineBooking Pro và thanh tài khoản.
- Chữ/biểu tượng giỏ hàng chuyển sang màu sáng; badge số lượng dùng gradient tím → cyan để vẫn nổi bật trên nền tối.
- Thêm trạng thái hover nâng nhẹ, viền tím và shadow tối; không thay đổi nghiệp vụ giỏ hàng, API hay database.
- Không có migration mới.
- Quy trình release tiếp tục chạy từ `D:\LienThongDH\DoAn\NhienIn3d` bằng `./scripts/release.ps1 v2.9.6` (PowerShell có thể dùng `.\scripts\release.ps1 v2.9.6`).


## v2.9.7 — 30/08/2026

- Sửa dứt điểm trạng thái **Hồ sơ nhân viên bán hàng** bị quay về giá trị cũ sau F5. Web chuyển sang endpoint chuyên dụng `POST /api/v1/quan-tri/nhan-vien/:id/trang-thai`, backend cập nhật hồ sơ + trạng thái tài khoản trong transaction rồi đọc lại trực tiếp PostgreSQL sau commit trước khi trả kết quả.
- Sau khi bấm **Lưu trạng thái**, frontend xác minh lại bằng `GET /quan-tri/nhan-vien` với `cache: no-store`; chỉ báo thành công khi dữ liệu PostgreSQL khớp đúng trạng thái vừa chọn.
- `Đang làm` tiếp tục kích hoạt tài khoản và xóa lockout; `Tạm nghỉ`/`Nghỉ việc` khóa tài khoản và thu hồi session đang mở.
- Bỏ hoàn toàn panel **PHÂN QUYỀN / Nhân viên chỉ tập trung bán hàng** nằm cạnh form tạo nhân viên. Form tạo nhân viên chuyển thành một card lớn, căn giữa, rộng tối đa 760px theo bố cục CineBooking Pro.
- Không có migration mới; dữ liệu trạng thái được lưu trực tiếp vào bảng `nhan_vien` hiện tại.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → test/typecheck/build/Docker → `.\scripts\release.ps1 v2.9.7`.


## v2.9.8 — 30/08/2026

- Bỏ hoàn toàn mũi tên/dropdown ở cột **Vai trò** trong danh sách người dùng. Vai trò giờ hiển thị bằng trường tĩnh: `Admin · Toàn quyền`, `Nhân viên bán hàng` hoặc `Khách hàng`.
- Admin vẫn có toàn quyền quản trị hệ thống; việc bỏ dropdown chỉ loại bỏ khả năng đổi nhầm loại tài khoản ngay trên danh sách.
- Vai trò được cố định theo đúng luồng nghiệp vụ: Admin được bootstrap từ cấu hình hệ thống, tài khoản đăng ký là Khách hàng, tài khoản tạo từ màn hình nhân sự luôn là Nhân viên bán hàng.
- API `PATCH /quan-tri/nguoi-dung/:id` không còn nhận trường `vai_tro`; `ValidationPipe` sẽ từ chối payload cố đổi vai trò ngoài luồng chuẩn.
- Không có migration database mới.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → test/typecheck/build/Docker → `.\scripts\release.ps1 v2.9.8`.


## v2.9.9 — 30/08/2026

- Bỏ dòng `NHIENIN3D · ADMIN` trên Admin Dashboard.
- Chuẩn hóa mặc định thành 2 ca: `CA01 · Ca sáng · 06:00–14:00` và `CA02 · Ca chiều · 14:00–22:00`.
- Thêm API `PATCH /api/v1/quan-tri/ca-lam/:id` để chỉnh sửa ca và `DELETE /api/v1/quan-tri/ca-lam/:id` để xóa ca.
- Khi xóa ca, backend xóa các phân ca liên quan trong cùng transaction trước khi xóa mẫu ca.
- UI tab Ca làm có trạng thái chỉnh sửa, nút **Chỉnh sửa**, **Lưu thay đổi**, **Hủy chỉnh sửa**, **Xóa** và cảnh báo khi xóa ca đang có phân công.
- Migration `202608300003_v299_hai_ca_lam_va_quan_ly_ca` gom dữ liệu ca cũ về hai khung giờ mới và xử lý trùng phân ca trước khi cập nhật khóa ngoại.
- Seed ca/phân ca là bootstrap-only để chỉnh sửa/xóa của Admin được giữ nguyên sau khi chạy lại Docker.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.9.9`.


## v2.10.0 — 30/08/2026

- Bỏ dòng nhãn `STAFF OPERATIONS` khỏi cả tab **Ca làm** và **Xếp ca**.
- Cho phép chỉnh sửa mẫu ca ngay cả khi mẫu ca đang được dùng bởi phân ca; thay đổi tên/giờ/màu áp dụng tức thời cho toàn bộ lịch đã xếp vì phân ca giữ cùng khóa ngoại `ca_lam_viec_id`.
- Xóa mẫu ca đã tạo bằng endpoint ổn định `POST /api/v1/quan-tri/ca-lam/:id/xoa`; backend xóa toàn bộ phân ca liên quan trong transaction rồi mới xóa mẫu ca. Endpoint REST `DELETE` vẫn được giữ tương thích.
- Cho phép chỉnh sửa **phân ca đã xếp**: đổi nhân viên, ngày làm, mẫu ca và ghi chú; backend kiểm tra tài khoản nhân viên, ca hoạt động và chống trùng `(nhân viên, ca, ngày)`.
- Xóa phân ca đã xếp bằng `POST /api/v1/quan-tri/phan-ca/:id/xoa`, tránh lỗi body rỗng/proxy từng gặp với Fastify; `DELETE` vẫn được giữ.
- UI lịch phân ca có hai nút **Chỉnh sửa** và **Xóa** trên từng dòng; form bên trái chuyển sang chế độ chỉnh sửa và có **Hủy chỉnh sửa**.
- Mỗi mẫu ca hiển thị số phân công đang sử dụng để Admin biết phạm vi ảnh hưởng trước khi chỉnh/xóa.
- Không có migration mới; dữ liệu vận hành hiện tại được giữ nguyên.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.10.0`.

## v2.10.1 — 30/08/2026

- Tách danh sách **Tài khoản khách hàng** khỏi **Nhân viên bán hàng**. Admin không còn quản lý hai loại tài khoản trong một danh sách chung.
- Thêm form chỉnh sửa khách hàng trực tiếp trong Admin: họ tên, email đăng nhập, số điện thoại và địa chỉ mặc định; backend kiểm tra trùng email và đọc lại dữ liệu PostgreSQL sau khi commit.
- Thêm endpoint ổn định `POST /api/v1/quan-tri/nguoi-dung/:id/cap-nhat`; endpoint PATCH cũ vẫn giữ để tương thích.
- Sửa lưu **Ca làm** bằng `POST /api/v1/quan-tri/ca-lam/:id/cap-nhat`, sau đó frontend GET `no-store` để xác nhận mã/tên/giờ/màu vừa lưu trước khi báo thành công.
- Sửa lưu **Phân ca đã xếp** bằng `POST /api/v1/quan-tri/phan-ca/:id/cap-nhat`, sau đó frontend đọc lại PostgreSQL và xác minh nhân viên/ngày/ca/ghi chú.
- Giữ endpoint PATCH cũ cho ca và phân ca để tương thích API, nhưng giao diện quản trị mặc định dùng POST nhằm tránh lỗi proxy/Fastify từng gặp với request cập nhật.
- Bỏ dòng mô tả `Sản phẩm in 3D theo yêu cầu với cấu hình mua hàng mặc định.` nằm ngay dưới logo NhienIn3d ở footer.
- Không có migration database mới.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.10.1`.


## v2.10.2 — 30/08/2026

- Sửa nguyên nhân gốc của lỗi `Failed to fetch` khi cập nhật tài khoản: cấu hình `@fastify/cors` khai báo đầy đủ `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` và headers cần thiết.
- Thêm `POST /api/v1/tai-khoan/ho-so` làm alias cho `PATCH /api/v1/tai-khoan/ho-so`; giao diện `/tai-khoan` mặc định dùng POST để lưu họ tên, email, số điện thoại và địa chỉ.
- Thêm `POST /api/v1/tai-khoan/doi-mat-khau` làm alias cho PATCH; cả hai endpoint dùng chung một handler cookie/JWT để không lệch hành vi.
- Giữ transaction PostgreSQL khi lưu hồ sơ: địa chỉ mặc định được update/create cùng người dùng, sau đó response đọc lại chính dữ liệu vừa ghi.
- Khi đổi mật khẩu cần đăng nhập lại, backend dọn cả access cookie và refresh cookie đúng path; khi giữ phiên hiện tại thì vẫn phát access JWT mới theo `phien_ban_mat_khau`.
- Seed Admin được harden: nếu email Admin đã tồn tại thì chỉ bảo đảm `vai_tro=ADMIN` và `da_kich_hoat=true`, tuyệt đối không hash/reset mật khẩu hoặc ghi đè họ tên. `ADMIN_PASSWORD` chỉ dùng khi tạo Admin lần đầu.
- Không có migration database mới.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.10.2`.

## v2.11.0 — 30/08/2026

- Thêm tab **Tổng quan** làm màn hình mặc định của Admin Dashboard, giữ phong cách dark glass/CineBooking Pro và responsive cho desktop/mobile.
- `GET /api/v1/quan-tri/tong-quan` mở rộng thống kê doanh thu **hôm nay / 7 ngày / 30 ngày**; doanh thu chỉ tính đơn `HOAN_TAT` để không tính nhầm đơn đang xử lý hoặc đã hủy.
- Bổ sung số đơn theo kỳ, giá trị đơn hoàn tất trung bình 30 ngày, khách hàng mới hôm nay/7 ngày/30 ngày và thống kê toàn bộ trạng thái đơn hàng.
- Bổ sung chuỗi **doanh thu 7 ngày theo múi giờ Việt Nam (+07:00)** để dashboard hiển thị bar chart không cần thêm thư viện chart.
- Bổ sung **Top 5 sản phẩm 30 ngày** theo số lượng bán (loại đơn đã hủy), **tồn kho thấp ≤ 5** cho biến thể đang hiển thị và **8 đơn hàng gần nhất**.
- Dashboard tiếp tục được bảo vệ ở controller bằng `JwtGuard`, `VaiTroGuard` và `@VaiTroChoPhep(VaiTro.ADMIN)`; hiện tại chỉ Admin có quyền xem số liệu kinh doanh.
- Không có migration database mới; toàn bộ số liệu được tổng hợp trực tiếp từ PostgreSQL hiện có.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.11.0`.

## v2.12.0 — 30/08/2026

- Thêm tab **Đơn hàng** trong Admin: lọc theo trạng thái, tìm theo mã đơn/người nhận/SĐT/email, xem chi tiết người nhận, sản phẩm, thanh toán và lịch sử xử lý.
- Thêm luồng cập nhật trạng thái có kiểm soát `Chờ xác nhận → Đã xác nhận → Đang sản xuất → Đang giao → Hoàn tất`; cho hủy ở các bước trước giao và tự hoàn tồn kho khi hủy.
- Migration `202608300004_v212_quan_tri_don_hang_audit` tạo bảng `lich_su_don_hang`; các đơn cũ được backfill một mốc lịch sử, đơn mới ghi mốc ngay khi checkout, Admin cập nhật trạng thái ghi người thực hiện và ghi chú.
- Thêm tab **Sản phẩm & kho**: sửa tên, mô tả ngắn, giá bán, trạng thái; cập nhật số lượng tồn và bật/tắt hiển thị từng biến thể.
- Thêm tab **Nhật ký Admin**, hiển thị 200 sự kiện `ADMIN_*` gần nhất; bổ sung audit cho tạo/sửa/xóa ca, tạo/sửa/xóa phân ca, cập nhật đơn, sản phẩm và tồn kho bên cạnh các audit tài khoản/nhân viên sẵn có.
- Seed v2.12.0 bảo đảm các đơn mẫu tạo sau migration vẫn có lịch sử ban đầu; `kiem-tra-du-lieu` theo dõi thêm bảng `lich_su_don_hang`.
- Giao diện mới giữ dark glass/CineBooking Pro, responsive và các tab Admin có thể cuộn ngang trên màn hình hẹp.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.12.0`.

## v2.12.1 — 30/08/2026

- Tinh gọn tab **Sản phẩm & tồn kho** theo yêu cầu: không còn render đồng thời 10 card sản phẩm kéo dài trang.
- Thêm ô **Chọn sản phẩm** dạng danh sách xổ xuống; mỗi lựa chọn hiển thị `mã · tên · danh mục`, sau khi chọn chỉ một form sản phẩm và bảng biến thể tương ứng được mở.
- Ô **Tìm sản phẩm** vẫn hoạt động và trực tiếp lọc các lựa chọn trong danh sách xổ xuống; số kết quả được cập nhật theo bộ lọc.
- Khi sản phẩm đang chọn không còn khớp bộ lọc, giao diện tự dùng kết quả đầu tiên còn lại; nếu không có kết quả sẽ hiển thị trạng thái rỗng thay vì nhiều card.
- Không thay đổi API, PostgreSQL, tồn kho hay dữ liệu sản phẩm; không có migration mới.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.12.1`.


## v2.12.2 — 30/08/2026

- Storefront trang chủ và `/san-pham` hiển thị **6 sản phẩm mỗi hàng trên desktop**; bố cục responsive tự giảm còn 4/3/2/1 cột theo kích thước màn hình.
- Mở rộng vùng sản phẩm desktop lên tối đa 1540px và tinh gọn padding/font/meta của product card để 6 card vẫn rõ ràng, không vỡ nút giá/xem chi tiết.
- Bổ sung `N3D-ORG-011 · Khay Gridfinity 2×3 có ngăn bút` và `N3D-MAKER-012 · Vỏ Raspberry Pi 5 gắn quạt 40 mm`, nâng dữ liệu mẫu từ 10 lên **12 sản phẩm**.
- Mỗi sản phẩm mới có 3 biến thể màu/vật liệu/tồn kho trong PostgreSQL; fallback frontend cũng có đủ 12 sản phẩm để giao diện vẫn đủ 2 hàng khi API tạm thời chưa sẵn sàng.
- Cập nhật thống kê trang chủ từ `10` thành `12 Sản phẩm mẫu`; không có migration database mới, seed idempotent tự tạo hai sản phẩm mới khi chạy lại.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.12.2`.

## v2.12.3 — 30/08/2026

- Sửa hai sản phẩm mới của v2.12.2 bị dùng lại ảnh của sản phẩm cũ: `N3D-ORG-011` không còn trùng ảnh `N3D-ORG-008`, `N3D-MAKER-012` không còn trùng ảnh `N3D-MAKER-010`.
- Thêm hai ảnh minh họa local riêng trong `apps/web/public/images`: `gridfinity-2x3-pen-holder.svg` và `raspberry-pi-5-40mm-fan-case.svg`, giúp storefront hiển thị đúng hai thiết kế khác nhau và không phụ thuộc remote image cho hai sản phẩm này.
- Seed PostgreSQL tiếp tục idempotent: chạy lại seed sẽ cập nhật `hinh_anh_san_pham` của hai mã sản phẩm mới sang ảnh riêng mà không tạo bản ghi sản phẩm trùng.
- Thêm regression test ngăn 12 sản phẩm mẫu tái sử dụng đường dẫn ảnh chính; storefront vẫn giữ 6 sản phẩm/hàng và 2 hàng trên desktop.
- Không có migration database mới.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.12.3`.

## v2.13.0 — 30/08/2026

- Nâng **Sản phẩm & tồn kho** thành CRUD sản phẩm đầy đủ cho Admin: `POST /api/v1/quan-tri/san-pham` để tạo, `POST /api/v1/quan-tri/san-pham/:id/cap-nhat` để sửa và `POST /api/v1/quan-tri/san-pham/:id/xoa` (kèm DELETE alias) để xóa.
- Form tạo sản phẩm cho phép chọn mã sản phẩm, tên, danh mục, mô tả, giá, kích thước, khối lượng, thời gian in, trạng thái và tồn kho ban đầu; backend tự tạo một biến thể mặc định để sản phẩm có thể dùng ngay trong luồng tồn kho/giỏ hàng.
- Thêm **tải ảnh từ máy** cho cả tạo mới và chỉnh sửa. Chỉ nhận JPEG/PNG/WebP; frontend dùng Canvas crop/căn giữa về **1000 × 800**, nén JPEG và giới hạn kích thước payload trước khi gửi API.
- Ảnh Admin tải lên được lưu trong `hinh_anh_san_pham` dưới dạng data URL, vì vậy F5/restart Web không làm mất ảnh và card storefront luôn render cùng tỉ lệ 5:4 với sản phẩm hiện có.
- Khi xóa sản phẩm do Admin tự tạo, backend dọn các dòng giỏ hàng liên quan rồi xóa sản phẩm/ảnh/biến thể bằng transaction. Với sản phẩm mẫu seed, hệ thống đánh dấu xóa mềm để giữ tham chiếu lịch sử và bảo đảm seed không khôi phục lại.
- Seed sản phẩm và biến thể chuyển sang **bootstrap-only (`update: {}`)**, không ghi đè giá/tồn kho/ảnh/trạng thái đã được Admin chỉnh. Hai ảnh SVG minh họa của `N3D-ORG-011` và `N3D-MAKER-012` được nâng một lần sang **ảnh sản phẩm thật từ MakerWorld**; nếu Admin đã tải ảnh riêng thì seed không thay thế.
- Bổ sung audit `ADMIN_TAO_SAN_PHAM`, `ADMIN_CAP_NHAT_SAN_PHAM`, `ADMIN_XOA_SAN_PHAM`; tăng Fastify `bodyLimit` lên 3 MB để nhận ảnh đã chuẩn hóa an toàn.
- Không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.13.0`.

---

## v2.14.0 — 30/08/2026

- Tách khu vực **Sản phẩm** và **Kho** thành hai tab độc lập trong Admin Dashboard.
- Tab **Sản phẩm** chỉ còn nghiệp vụ catalog: thêm sản phẩm, chỉnh sửa thông tin/ảnh, xóa sản phẩm; không còn bảng tồn kho nằm lẫn dưới form sản phẩm.
- Form tạo sản phẩm không còn trường `Tồn kho ban đầu`; sản phẩm mới tạo một biến thể mặc định với tồn kho **0** và Admin nhập số lượng tại tab Kho.
- Tab **Kho** hiển thị toàn bộ biến thể theo dạng bảng riêng với tìm kiếm theo mã sản phẩm/tên/mã biến thể/vật liệu/màu, chỉnh số lượng, bật/tắt hiển thị và lưu từng dòng.
- Bổ sung KPI kho: tổng biến thể, tổng số lượng tồn, số biến thể sắp hết (1–5) và hết hàng (0), kèm badge tình trạng `CÒN HÀNG / SẮP HẾT / HẾT HÀNG`.
- Từ form sản phẩm có nút **Mở tồn kho** để chuyển sang Kho và tự lọc đúng mã sản phẩm đang chỉnh; từ Kho có nút quay lại **Quản lý sản phẩm**.
- Không thay đổi Prisma schema/API tồn kho hiện có nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.14.0`.

---

## v2.15.0 — 30/08/2026

- Bổ sung CRUD **Danh mục** trong Admin: tạo danh mục mới, sửa tên/mô tả/thứ tự/trạng thái hiển thị và xóa danh mục khi không còn sản phẩm tham chiếu.
- Nâng tab **Kho** thành quản lý biến thể nâng cao: tạo/sửa/xóa mã biến thể, chọn vật liệu/màu, chỉnh giá chênh lệch, tồn kho và trạng thái hiển thị. API trả cả ID vật liệu/màu để form chỉnh sửa khôi phục đúng lựa chọn sau F5.
- Thêm quy trình kiểm duyệt **Đánh giá sản phẩm**: đánh giá mới mặc định `da_duyet=false`; Admin có thể duyệt, ẩn hoặc xóa; storefront chỉ hiển thị đánh giá đã duyệt.
- Thêm **Báo cáo CSV** theo khoảng ngày: đơn hàng, doanh thu các đơn `HOAN_TAT`, và snapshot tồn kho/biến thể. Frontend thêm BOM UTF-8 trước khi tải để Excel hiển thị tiếng Việt đúng dấu.
- Bổ sung audit trail cho tạo/sửa/xóa danh mục, tạo/sửa/xóa biến thể và duyệt/ẩn/xóa đánh giá.
- Không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.15.0`.

---

## v2.15.1 — 31/08/2026

- Sửa luồng doanh thu theo **trạng thái thanh toán thực tế** thay vì chỉ nhìn trạng thái đơn hàng. Đơn không phải COD khi checkout được xác nhận `DA_THANH_TOAN` và ghi nhận doanh thu ngay.
- Đơn **COD** vẫn ở `CHO_THANH_TOAN` trong quá trình xử lý; khi Admin chuyển từ `ĐANG_GIAO` sang `HOAN_TAT` (UI hiển thị **Đã giao / hoàn tất**), backend tự chuyển giao dịch sang `DA_THANH_TOAN`, ghi `ngay_thanh_toan` và cập nhật doanh thu.
- Tab Đơn hàng hiển thị thêm khối **Thanh toán & doanh thu**: phương thức, trạng thái thanh toán, số tiền, thời điểm thanh toán và trạng thái đã/chưa ghi nhận doanh thu.
- Nút hoàn tất đơn đổi thành **Xác nhận đã giao & ghi doanh thu** để Admin biết rõ tác động kế toán của thao tác.
- Dashboard doanh thu hôm nay/7 ngày/30 ngày và biểu đồ 7 ngày sử dụng **ngày ghi nhận thanh toán**; vẫn có fallback cho đơn `HOAN_TAT` cũ chưa có bản ghi thanh toán hợp lệ.
- Báo cáo CSV doanh thu chuyển sang tính theo **ngày ghi nhận doanh thu**; đơn đã thanh toán non-COD được đưa vào báo cáo ngay cả khi chưa giao, còn COD chỉ vào báo cáo sau khi xác nhận đã giao/hoàn tất.
- Dữ liệu seed thanh toán được chuẩn hóa: phương thức không COD mặc định `DA_THANH_TOAN`; COD chỉ `DA_THANH_TOAN` khi đơn đã hoàn tất.
- Không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.15.1`.

---


## v2.15.2 — 31/08/2026

- Sửa lỗi `npm run typecheck` ở `apps/api/prisma/seed.ts`: kiểu dữ liệu của `don_hang_map` giờ có `trang_thai: TrangThaiDonHang`, khớp đúng dữ liệu Prisma trả về và không còn lỗi `TS2339: Property 'trang_thai' does not exist`.
- Bổ sung **xuất Excel (.xlsx)** cho 3 báo cáo Admin: Đơn hàng, Doanh thu và Tồn kho; giữ nguyên lựa chọn khoảng ngày hiện có.
- File Excel có header nổi bật, freeze hàng tiêu đề, auto-filter, số được lưu dạng numeric và độ rộng cột tự điều chỉnh; không cần thêm thư viện npm mới.
- Giữ **CSV** làm định dạng xuất thứ hai để tương thích workflow cũ.
- Bỏ dòng `Nền giao diện dùng ảnh 3D do người dùng cung cấp.` khỏi footer; footer chỉ còn copyright NhienIn3d.
- Không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.15.2`.

---


## v2.15.3 — 31/08/2026

- Sửa lỗi dashboard có thể hiển thị **doanh thu > 0 nhưng 0 đơn** trên cùng một ngày. Nguyên nhân là doanh thu dùng `ngay_thanh_toan/ngay_ghi_nhan`, còn số đơn trên biểu đồ lại dùng `ngay_tao`.
- Biểu đồ **Doanh thu 7 ngày** giờ đếm `so_don` từ chính tập `doanhThuDaGhiNhan` theo `ngay_ghi_nhan`, nên số tiền và số đơn luôn cùng một cơ sở thời gian.
- KPI **Doanh thu hôm nay / 7 ngày / 30 ngày** bổ sung `don_ghi_nhan_doanh_thu_theo_ky` và hiển thị tách biệt số đơn đã ghi nhận doanh thu với số đơn mới phát sinh.
- Ví dụ: đơn tạo ngày 29/08 nhưng Admin xác nhận COD đã giao ngày 31/08 sẽ được tính là **1 đơn ghi nhận doanh thu ngày 31/08**, trong khi vẫn là **0 đơn mới phát sinh ngày 31/08** nếu hôm đó không có đơn mới.
- Không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.15.3`.

---


## v2.15.4 — 31/08/2026

- Đồng bộ version source/API/OpenAPI lên **v2.15.4**.
- Không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.15.4`.

---


## v2.15.5 — 31/08/2026

- Sửa thanh tab **Quản trị** bị chừa khoảng trống lớn bên phải khi các nút tự xuống dòng.
- Chuyển layout tab sang `flex-wrap: wrap` và cho từng nút `flex-grow`, nhờ đó **hàng cuối cũng tự giãn kín toàn bộ chiều ngang** thay vì dồn nút về bên trái.
- Desktop dùng basis 150px để phân bố số nút cân đối theo chiều rộng; màn hình nhỏ giảm basis và mobile cho nút chiếm toàn hàng để tránh chữ bị ép/tràn.
- Không thay đổi nghiệp vụ, API hoặc Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.15.5`.

---

## v2.16.0 — 31/08/2026

- Bổ sung tab **Vật liệu & màu** trong Admin: tạo/sửa/xóa vật liệu và màu sắc dùng cho biến thể sản phẩm; mã tham chiếu được chuẩn hóa chữ hoa và kiểm tra trùng.
- Vật liệu cho phép chỉnh tên, mô tả và `he_so_gia`; màu cho phép chỉnh tên và mã HEX, có color picker trực tiếp trên giao diện.
- Khi xóa vật liệu/màu, backend kiểm tra `_count.bien_the` và **chặn xóa nếu vẫn còn biến thể tham chiếu**, tránh biến thể bị mất cấu hình ngoài ý muốn.
- Tab **Kho** có bộ lọc nâng cao theo tình trạng tồn (`>5`, `1–5`, `0`), vật liệu, màu sắc và trạng thái hiển thị; các bộ lọc kết hợp được với tìm kiếm mã/tên hiện có.
- Bổ sung API `GET /api/v1/quan-tri/kho/lich-su` và panel **Lịch sử điều chỉnh tồn**, lấy các lần thay đổi số lượng gần nhất từ audit `ADMIN_CAP_NHAT_TON_KHO` / `ADMIN_CAP_NHAT_BIEN_THE`.
- Audit cập nhật biến thể giờ ghi `ton_cu` và `ton_moi`; thêm các sự kiện `ADMIN_TAO/CAP_NHAT/XOA_VAT_LIEU` và `ADMIN_TAO/CAP_NHAT/XOA_MAU_SAC` vào Nhật ký Admin.
- Không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → Docker Compose → `.\scripts\release.ps1 v2.16.0`.

---

## v2.17.0 — 31/08/2026

- Thêm bảng `cau_hinh_he_thong` và migration `202608310001_v217_canh_bao_kho` để lưu bền vững **ngưỡng sắp hết hàng**; mặc định là `5`, Admin có thể chỉnh từ `1–999`.
- Bổ sung API `GET/POST /api/v1/quan-tri/kho/cau-hinh`; thay đổi ngưỡng được audit bằng sự kiện `ADMIN_CAP_NHAT_CAU_HINH_KHO`.
- Dashboard có banner **Cảnh báo tồn kho** hiển thị riêng số biến thể sắp hết và hết hàng, đồng thời nút mở thẳng tab Kho để xử lý.
- Bộ lọc, KPI và nhãn trạng thái trong tab **Kho** dùng cùng ngưỡng cấu hình thay vì cố định `5`, tránh Dashboard/Kho lệch logic.
- Khi lưu biến thể/tồn kho, Admin có thể nhập **lý do điều chỉnh**. Backend tự phân loại biến động thành `NHAP_KHO`, `XUAT_KHO` hoặc `DIEU_CHINH`, lưu `ton_cu`, `ton_moi`, `chenh_lech`, nguyên nhân và người thao tác trong audit.
- Panel lịch sử kho được nâng thành **Lịch sử nhập / xuất / điều chỉnh kho**, có lọc loại biến động, hiển thị lý do, người thao tác, chênh lệch và thời gian; API lịch sử hỗ trợ query `?loai=` và trả tối đa 80 biến động gần nhất.
- Mở rộng regression test cho migration/cấu hình kho, Dashboard cảnh báo động, lý do điều chỉnh và phân loại biến động.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.17.0`.

---


## v2.17.1 — 31/08/2026

- Sửa form **Tạo biến thể mới** trong tab Kho bị thiếu chỗ ngang ở desktop, làm nhãn chữ nằm dưới control và các ô nhập/select chồng lên nhau.
- Chuyển form desktop sang **4 cột cân đối** trong khung nội dung 1180px; các trường sản phẩm/mã biến thể/vật liệu/màu ở hàng đầu và chênh lệch giá/tồn ban đầu/hiển thị/nút thêm ở hàng kế tiếp.
- Ép `min-width: 0`, `max-width: 100%` và `box-sizing: border-box` cho label/input/select để nội dung dài co đúng trong grid, không đẩy sang cột kế bên.
- Nhãn trường cho phép xuống dòng tự nhiên, không bị che; responsive chuyển **2 cột dưới 980px** và **1 cột dưới 620px**.
- Không thay đổi nghiệp vụ, API dữ liệu hay Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `.\scripts\release.ps1 v2.17.1`.

---

## v2.18.0 — 31/08/2026

- Bổ sung **nhập kho nhanh theo lô** trong tab Kho. Admin có thể nhập mã lô, nhà cung cấp, ghi chú rồi chọn file **CSV hoặc XLSX** để đưa nhiều biến thể vào một lần.
- File import được backend giải mã và **kiểm tra trước khi ghi**: bắt buộc cột `ma_bien_the` và `so_luong_nhap`, giới hạn tối đa 500 dòng/2 MB, phát hiện SKU không tồn tại, số lượng không hợp lệ và mã biến thể trùng trong cùng file. Giao diện hiển thị preview tồn hiện tại → tồn sau nhập; chỉ khi mọi dòng hợp lệ mới bật nút xác nhận.
- Parser XLSX đọc trực tiếp worksheet đầu tiên từ định dạng ZIP/XML chuẩn Office Open XML; không thêm thư viện npm mới chỉ để import Excel. CSV hỗ trợ UTF-8 BOM, dấu phẩy hoặc dấu chấm phẩy và trường có dấu ngoặc kép.
- Migration `202608310002_v218_nhap_kho_theo_lo` tạo `phieu_nhap_kho` và `chi_tiet_phieu_nhap_kho`. Mỗi lần xác nhận chạy trong **một Prisma transaction**, tăng tồn từng biến thể, lưu tồn trước/tồn sau và tạo audit `ADMIN_CAP_NHAT_TON_KHO` + `ADMIN_NHAP_KHO_THEO_LO`; lỗi ở một dòng sẽ rollback toàn bộ lô.
- Tab Kho hiển thị **phiếu nhập gần đây** gồm mã phiếu, mã lô, nhà cung cấp, số dòng, tổng số lượng và thời điểm nhập để dễ đối soát.
- Bổ sung **cảnh báo tồn kho qua email**. Khi `LOW_STOCK_EMAIL_ENABLED=true`, API kiểm tra định kỳ theo `LOW_STOCK_EMAIL_INTERVAL_MINUTES` (15–1440 phút). Người nhận lấy từ `LOW_STOCK_EMAIL_TO`; nếu bỏ trống sẽ dùng email của các Admin đang hoạt động.
- Trạng thái cảnh báo lưu trong `cau_hinh_he_thong` với khóa `CANH_BAO_KHO_EMAIL`. Backend tạo SHA-256 từ ngưỡng + danh sách tồn thấp và **không gửi lặp nếu chữ ký chưa đổi**; khi tồn kho hoặc ngưỡng thay đổi mới gửi lại. Admin vẫn có nút **Kiểm tra & gửi ngay** để chạy một lượt thủ công.
- Email cảnh báo liệt kê mã biến thể, sản phẩm, tồn hiện tại và trạng thái `HẾT HÀNG / SẮP HẾT`; việc gửi tiếp tục dùng cấu hình SMTP/Nodemailer hiện có.
- Mở rộng regression/contract test cho schema + migration phiếu nhập, API preview/transaction, scheduler chống gửi lặp, Web import CSV/XLSX, phiếu nhập và trạng thái email.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.18.0`.

---


## v2.18.1 — 31/08/2026

- Bổ sung logo thương hiệu **NhienIn3d** dạng SVG local, thiết kế theo khối lập phương 3D với dải màu hồng/tím/xanh đồng bộ giao diện hiện tại.
- Thêm favicon cho tab trình duyệt qua `app/icon.svg` và khai báo `metadata.icons`, thay biểu tượng mặc định của localhost/Next.js bằng logo NhienIn3d.
- Đặt logo **ngay trước chữ NhienIn3d** trên header; đồng bộ cùng logo ở menu drawer và footer để nhận diện thương hiệu nhất quán.
- Logo responsive 31px desktop / 28px mobile, có hiệu ứng hover nhẹ và tôn trọng `prefers-reduced-motion`; dùng `aria-hidden` cho ảnh trang trí để không lặp tên thương hiệu với screen reader.
- Không thay đổi API, nghiệp vụ hoặc Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.18.1`.

---

## v2.18.2 — 31/08/2026

- Sửa danh sách xổ xuống **Vật liệu** và **Màu sắc** trong Admin khó nhìn trên nền tối: ép `color-scheme: dark`, tăng cỡ chữ/độ đậm và độ tương phản của `select`/`option`.
- Mục đang được chọn có nền tím nổi bật; trạng thái focus có viền tím rõ hơn để dễ xác định field đang thao tác.
- Option Vật liệu hiển thị **mã vật liệu · tên vật liệu**; option Màu hiển thị **mã màu · tên màu**, giúp phân biệt nhanh khi dữ liệu nhiều.
- Áp dụng đồng bộ cho form **Tạo biến thể mới**, bộ lọc Kho và select Vật liệu/Màu trong từng dòng biến thể; mobile tăng lên 16px để tránh chữ nhỏ.
- Giữ nguyên logo/favicon v2.18.1, API và Prisma schema; **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.18.2`.

---

## v2.18.3 — 31/08/2026

- Bổ sung chế độ **HTTPS local tin cậy** dành cho Windows/Chromium để `https://localhost:3000` không còn bị đánh dấu “Kết nối không an toàn”.
- Thêm `docker-compose.https.yml` với **Caddy TLS reverse proxy**; frontend dùng API cùng origin `/api/v1`, tránh mixed-content khi trang Web chạy HTTPS.
- Thêm `scripts/https-local.ps1`: tự khởi động stack HTTPS, lấy CA local từ Caddy, cài vào Trusted Root của **CurrentUser** bằng `certutil -user` rồi mở đúng URL HTTPS.
- Thêm `infra/caddy/Caddyfile.local-https`, volume CA Caddy bền vững và `.local-https/` vào `.gitignore`/`.dockerignore`; không commit private key/chứng thư local vào Git. Có `https-local-bo-tin-cay.ps1` để gỡ CA khỏi Trusted Root khi không còn dùng.
- Bổ sung `npm run dev:web:https` sử dụng `next dev --experimental-https` cho trường hợp phát triển frontend độc lập.
- HTTP Compose cũ vẫn được giữ để tương thích; không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → kiểm tra HTTPS bằng `.\scripts\https-local.ps1 -KhongMoTrinhDuyet` → `.\scripts\release.ps1 v2.18.3`.

---

## v2.19.0 — 31/08/2026

- Thêm tab **Nhà cung cấp** trong Admin: tạo/sửa/xóa, tìm kiếm, lọc trạng thái, lưu người liên hệ/điện thoại/email/địa chỉ/ghi chú và bật/tắt hoạt động. Nhà cung cấp đã có phiếu nhập không được xóa để bảo toàn lịch sử; Admin có thể chuyển sang **Ngừng hoạt động**.
- Phiếu **Nhập kho theo lô** chọn trực tiếp nhà cung cấp đang hoạt động bằng ID; backend vẫn lưu tên nhà cung cấp snapshot để dữ liệu cũ/đối soát không bị mất khi thông tin nhà cung cấp thay đổi.
- Nâng cấp **Lịch sử phiếu nhập kho**: tìm mã phiếu/mã lô/mã biến thể/tên nhà cung cấp, lọc theo nhà cung cấp + khoảng ngày, xem chi tiết từng dòng và xuất Excel `.xlsx`.
- Bổ sung `ton_toi_thieu` và `ton_toi_da` cho từng biến thể. Khi tồn hiện tại `<= tồn tối thiểu` và tồn tối đa hợp lệ, giao diện tự hiển thị **Gợi ý nhập** để đưa tồn lên mức tối đa; có bộ lọc riêng **Cần nhập theo định mức** và KPI tổng số biến thể/tổng số lượng nên nhập.
- Báo cáo **Tồn kho** CSV/Excel bổ sung cột Tồn tối thiểu, Tồn tối đa và Gợi ý nhập. Audit ghi nhận thay đổi định mức cùng thay đổi tồn kho.
- Thêm migration `202608310003_v219_nha_cung_cap_dinh_muc_kho`: tạo bảng `nha_cung_cap`, FK từ `phieu_nhap_kho`, đồng thời thêm định mức min/max cho `bien_the_san_pham`.
- Giữ toàn bộ HTTPS local, logo/favicon, import CSV/XLSX và cảnh báo tồn qua email từ v2.18.x.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.19.0`.

---

## v2.19.1 — 31/08/2026

- Sửa các ô **Email/Mật khẩu** ở trang Đăng nhập bị nền xanh/trắng quá sáng khi Chrome/Brave tự điền thông tin đăng nhập (autofill), làm lệch hoàn toàn dark theme.
- Ép nền input auth sang dark `#091321`, chữ sáng, placeholder dễ đọc; focus dùng viền tím và nền tối hơn để nhận biết field đang thao tác.
- Bổ sung rule riêng cho Chromium/Brave `:-webkit-autofill`/`:autofill` với inset shadow + `-webkit-text-fill-color`, nên trình duyệt không còn phủ nền sáng lên Email/Mật khẩu đã lưu.
- Đồng bộ `color-scheme: dark`, caret và nút **Hiện/Ẩn mật khẩu**; áp dụng cho toàn bộ biểu mẫu auth dùng chung style, không chỉ riêng trang đăng nhập.
- Không thay đổi API nghiệp vụ hoặc Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.19.1`.

---

## v2.19.2 — 31/08/2026

- Bỏ dòng mô tả dài dưới tiêu đề **Admin Dashboard**: `Admin có toàn quyền hệ thống: catalog, danh mục, vật liệu/màu, biến thể, kho, đánh giá, đơn hàng, báo cáo và nhân sự.` theo yêu cầu giao diện gọn hơn.
- Giữ nguyên tiêu đề **Admin Dashboard**, tên tài khoản Admin, nút **Tài khoản của tôi**, KPI và toàn bộ tab quản trị; không thay đổi quyền truy cập hay nghiệp vụ.
- Không thay đổi API hoặc Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build` → `docker compose ps` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.19.2`.

---

## v2.19.3 — 31/08/2026

- Sửa dứt điểm lỗi Docker `Bind for 127.0.0.1:3000 failed: port is already allocated` khi container `nhienin3d-https` từ chế độ HTTPS còn chạy và `docker compose up -d --build` cố bind Web trực tiếp vào cùng cổng 3000.
- Hợp nhất topology local: **Caddy là dịch vụ duy nhất publish cổng `127.0.0.1:${WEB_PORT:-3000}`**, còn `nhienin3d-web` chỉ `expose: 3000` trong network Docker. Vì vậy Web và Caddy không còn tranh cùng host port.
- `docker-compose.yml` và `docker-compose.https.yml` được đồng bộ cùng stack HTTPS để chạy file nào cũng có cùng service set, không còn `nhienin3d-https` bị xem là orphan khi quay về compose mặc định.
- Web build dùng `NEXT_PUBLIC_API_URL=/api/v1`; Caddy reverse proxy `/api/*` và `/tai-lieu*` sang API, nên HTTPS không phát sinh mixed-content. `CORS_ORIGIN` vẫn chấp nhận cả HTTPS/HTTP localhost để tương thích dev.
- `scripts/https-local.ps1` chuyển sang compose mặc định, thêm `--remove-orphans`, giữ bước lấy/cài CA Caddy vào Trusted Root CurrentUser và đưa ra lệnh kiểm tra cổng nếu một ứng dụng ngoài Docker đang chiếm `WEB_PORT`.
- `.env.example` ở root mặc định `WEB_PUBLIC_URL=https://localhost:3000`; các `.env.example` riêng của API/Web vẫn giữ URL HTTP trực tiếp để chạy dev độc lập. Docker luôn ép frontend dùng same-origin `/api/v1`; không thay đổi Prisma schema nên **không có migration database mới**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v2.19.3`.

---

## v3.0.0 — 31/08/2026

- Nâng nhánh lớn lên **v3.0.0** với trọng tâm bảo mật quản trị, audit và khả năng sao lưu/khôi phục vận hành; giữ nguyên toàn bộ CRUD sản phẩm, danh mục, biến thể, kho, đơn hàng, nhà cung cấp, báo cáo và nhân sự từ v2.x.
- Bổ sung **MFA/TOTP cho Admin** không phụ thuộc thư viện ngoài: secret Base32 160-bit, TOTP HMAC-SHA1 chu kỳ 30 giây, chấp nhận lệch ±1 bước thời gian. Đăng nhập Admin đã bật MFA sẽ dừng ở challenge JWT 5 phút và chỉ tạo session/cookie sau khi mã 6 số hợp lệ.
- Secret MFA được mã hóa **AES-256-GCM** trước khi lưu PostgreSQL bằng `MFA_ENCRYPTION_KEY` (fallback `JWT_SECRET` cho môi trường cũ). Migration `202608310004_v300_mfa_admin` bổ sung trạng thái MFA, secret mã hóa và thời điểm xác nhận cho `nguoi_dung`.
- Thêm tab **Bảo mật** trong Admin để khởi tạo setup key/otpauth URI, xác nhận bật MFA và tắt MFA bằng mật khẩu hiện tại + mã TOTP. Khi bật/tắt, các phiên Admin khác được thu hồi; đăng nhập MFA sai bị giới hạn 5 lần trong 10 phút và được ghi audit.
- Nâng cấp **Nhật ký Admin**: lọc phía server theo nội dung/IP, loại sự kiện, từ ngày/đến ngày, giới hạn tối đa 500 dòng; hiển thị IP và xuất CSV UTF-8 chống formula injection. Nhật ký cũng theo dõi các sự kiện bật/tắt MFA và đăng nhập MFA.
- Thêm `scripts/backup-db.ps1` tạo PostgreSQL custom-format backup bằng `pg_dump`, tự sinh SHA-256; thêm `scripts/restore-db.ps1` yêu cầu cờ `-XacNhan`, dừng API/Web/HTTPS, restore bằng `pg_restore --clean --if-exists` rồi khởi động lại stack. Thư mục `backups/` được bỏ qua khỏi Git/Docker build context.
- Security hardening: cookie auth tự bật `Secure` khi `WEB_PUBLIC_URL` là HTTPS ngay cả ở local development; Web/Caddy bổ sung `nosniff`, `DENY frame`, `strict-origin-when-cross-origin` và Permissions-Policy; giữ Helmet + global rate limit hiện có ở API.
- `.env.example` bổ sung `MFA_ENCRYPTION_KEY`; Docker Compose truyền biến này vào API. Không commit secret MFA, backup database hoặc chứng thư local vào source.
- Bổ sung regression contract cho migration MFA, TOTP, login challenge, cookie HTTPS, tab Bảo mật, audit CSV và backup/restore.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v3.0.0`.

---

## v3.0.1 — 31/08/2026

- Hotfix lỗi `npm run typecheck` của API sau khi thêm MFA ở v3.0.0: kết quả `dang_nhap()` là union giữa **session thành công** và **MFA challenge**, nhưng controller dùng điều kiện ghép `"can_mfa" in kq && kq.can_mfa` khiến TypeScript 7 không loại trừ nhánh challenge trước khi truyền vào `ghiCookie()`.
- Đổi guard sang discriminant trực tiếp `if ("can_mfa" in kq) return ...`; sau nhánh return, TypeScript narrow `kq` về đúng kiểu có `ma_truy_cap` + `ma_lam_moi`, nên `ghiCookie(reply, kq)` hợp lệ mà không cần ép kiểu hoặc `any`.
- Bổ sung regression test để không tái xuất hiện pattern narrowing cũ; không thay đổi logic runtime MFA, cookie, database hay Prisma schema nên **không có migration database mới**.
- Đồng bộ version Root/API/Web/Health/OpenAPI lên **v3.0.1**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v3.0.1`.

---

## v3.1.0 — 31/08/2026

- Theo yêu cầu vận hành mới, **gỡ hoàn toàn MFA/TOTP** khỏi backend, frontend và cấu hình môi trường. Đăng nhập Admin quay về luồng một bước email + mật khẩu; cookie HttpOnly/Secure, Argon2id, session refresh, lockout đăng nhập sai và audit bảo mật vẫn được giữ nguyên.
- Migration `202608310005_v310_remove_mfa_system_health` xóa `mfa_totp_bat`, `mfa_totp_secret_ma_hoa`, `mfa_totp_xac_nhan_luc` và index liên quan khỏi `nguoi_dung`. Migration v3.0.0 không bị sửa/xóa để database đã từng nâng cấp qua v3.0.x vẫn migrate tuần tự được; dữ liệu secret MFA cũ sẽ bị xóa khi áp dụng migration mới.
- Xóa runtime MFA: không còn `mfa-totp.ts`, DTO xác nhận MFA, API `/dang-nhap/mfa`/`/mfa/*`, challenge 6 số, setup key/URI Authenticator, UI tab Bảo mật hay `MFA_ENCRYPTION_KEY` trong `.env.example`/Docker.
- Thêm tab **Hệ thống** trong Admin và endpoint `GET /api/v1/quan-tri/he-thong/suc-khoe`: tổng hợp uptime/memory của API, kết nối + latency + dung lượng PostgreSQL + migration gần nhất, trạng thái SMTP không lộ mật khẩu, backup gần nhất/dung lượng/số bản daily-weekly và trạng thái lịch cảnh báo tồn kho.
- API mount `./backups:/app/backups:ro` nên dashboard chỉ có quyền **đọc metadata backup**, không thể tự ghi/xóa file từ HTTP request. Khi DB mất kết nối, trạng thái tổng chuyển `LOI`; khi backup quá 36 giờ hoặc SMTP đã bật nhưng chưa sẵn sàng, trạng thái chuyển `CANH_BAO`.
- Nâng `scripts/backup-db.ps1`: tạo `nhienin3d-daily-*.dump`, tự tạo SHA-256 sidecar, mỗi Chủ nhật giữ thêm `nhienin3d-weekly-*.dump`, mặc định giữ daily 14 ngày và weekly 8 tuần rồi dọn bản cũ.
- Thêm `scripts/backup-schedule.ps1` đăng ký Windows Scheduled Task chạy backup mỗi ngày (mặc định 02:00), `scripts/backup-schedule-remove.ps1` gỡ lịch và `scripts/backup-verify.ps1` kiểm tra checksum toàn bộ backup. Restore tiếp tục yêu cầu `-XacNhan` và dùng `pg_restore --clean --if-exists`.
- Nhật ký Admin vẫn hỗ trợ lọc server + CSV UTF-8 chống formula injection; bộ lọc sự kiện dùng nhóm `ADMIN_*` và `DANG_NHAP_*`, nhờ đó các audit MFA lịch sử vẫn có thể xem dù MFA runtime đã bị gỡ.
- Bổ sung regression test cho việc gỡ MFA, migration cleanup, đăng nhập một bước, health API/UI, backup retention/schedule/checksum và volume backup read-only. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.1.0**.
- Quy trình release chuẩn: `cd D:\LienThongDH\DoAn\NhienIn3d` → `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `docker compose logs migrate --tail 150` → `docker compose logs api --tail 150` → `.\scripts\release.ps1 v3.1.0`.

---

## v3.2.0 — 31/08/2026

- Sửa regression release thực tế khi source mới được chép đè lên thư mục dự án cũ: cleanup legacy giờ xóa `apps/api/src/xac-thuc/mfa-totp.ts` và `apps/api/src/xac-thuc/dto/xac-nhan-mfa.dto.ts` trước test. Nhờ đó file MFA còn sót từ v3.0.x không làm test v3.1+ báo sai rằng MFA vẫn tồn tại.
- Tinh gọn checkbox **Đang hoạt động** trong CRUD Nhà cung cấp bằng class riêng v3.2.0; giữ checkbox dùng chung ở các màn hình khác để tránh regression giao diện.
- Migration `202608310006_v320_audit_ops_history` tạo `lich_su_van_hanh` cho sự kiện `HEALTH`, `BACKUP`, `RESTORE`, `ALERT`, trạng thái, mô tả, JSON chi tiết và thời gian bắt đầu/kết thúc.
- Health API ghi lịch sử best-effort và bổ sung API phân trang/lọc lịch sử vận hành. Tab Hệ thống hiển thị lịch sử, trạng thái cảnh báo email, backup/restore và nút kiểm tra/gửi cảnh báo vận hành thủ công.
- Thêm cảnh báo email hệ thống qua `SYSTEM_HEALTH_EMAIL_ENABLED`, `SYSTEM_HEALTH_EMAIL_INTERVAL_MINUTES`, `SYSTEM_HEALTH_EMAIL_TO`, `SYSTEM_HEALTH_BACKUP_MAX_AGE_HOURS`. Hệ thống cảnh báo DB mất kết nối, backup quá cũ/chưa có và SMTP đã bật nhưng chưa sẵn sàng; chữ ký SHA-256 chống gửi lặp khi tập vấn đề không đổi.
- Nhật ký Admin bổ sung endpoint phân trang và **Excel**, giao diện có nút Trước/Sau, tổng số sự kiện và diff trước/sau. Các thay đổi nhạy cảm trên người dùng, nhà cung cấp, sản phẩm, biến thể, tồn kho và trạng thái đơn hàng lưu `truoc`, `sau`, `thay_doi` trong audit detail.
- `backup-db.ps1` và `restore-db.ps1` ghi job thành công/thất bại vào `lich_su_van_hanh`; việc ghi lịch sử là best-effort để backup vẫn chạy được nếu migration mới chưa áp dụng.
- Thêm `scripts/e2e-runtime-v320.ps1`: tạo database PostgreSQL tạm theo timestamp, seed sentinel, `pg_dump -Fc`, kiểm tra SHA-256, drop/recreate, `pg_restore`, xác minh sentinel và luôn xóa database tạm trong `finally`. Script không đụng database `nhienin3d` chính.
- Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.2.0**. Quy trình release: `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v320.ps1` → `./scripts/release.ps1 v3.2.0`.

---

## v3.2.1 — 31/08/2026

- Fix 8 lỗi TypeScript được phát hiện khi chạy `npm run typecheck` trên Windows: `Record<string, unknown>` không tương thích Prisma JSON và lỗi suy luận kiểu `take: 5000` trong audit pagination.
- Thêm helper chuẩn hóa JSON cho Prisma, đổi `tao_diff` trả về `Prisma.InputJsonObject` và tách truy vấn có/không có từ khóa tìm kiếm thành hai nhánh rõ kiểu.
- Cho phép Admin xác nhận **Đã giao / hoàn tất** trực tiếp từ mọi trạng thái đơn. Tùy chọn `HOAN_TAT` xuất hiện trong dropdown cho cả `CHO_XAC_NHAN`, `DA_XAC_NHAN`, `DANG_SAN_XUAT`, `DANG_GIAO` và `DA_HUY`; đơn khôi phục từ `DA_HUY` sẽ trừ lại tồn kho đã hoàn và không cho âm kho.
- Giữ logic chốt thanh toán/doanh thu hiện có khi đơn được xác nhận hoàn tất; audit vẫn lưu trước/sau và diff. Không có migration mới.
- Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.2.1**. Quy trình release: `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/release.ps1 v3.2.1`.

---

## v3.2.2 — 31/08/2026

- Sửa layout khu vực **Cập nhật trạng thái**: `label`, `input`, `select` có `min-width: 0`, control chiếm đúng 100% cột và chuyển 1 cột khi màn hình hẹp, không còn chồng lấn giữa Trạng thái mới và Ghi chú xử lý.
- Cập nhật đơn hàng dùng **optimistic UI**: ngay khi Admin bấm xác nhận, trạng thái ở danh sách/chi tiết và thanh toán dự kiến được cập nhật tức thời; nếu API thất bại thì rollback về dữ liệu cũ.
- Sau khi request chính thành công, các request làm mới danh sách đơn, Dashboard, Sản phẩm và Nhật ký chạy nền bằng `Promise.allSettled`, không chặn nút thao tác.
- Không có migration database mới. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.2.2**.

## v3.2.3 — 31/08/2026

- Fix lỗi TypeScript Web tại `app/quan-tri/page.tsx` khi optimistic update gán `thanh_toan` dạng array cho `AdminDonHangChiTiet`.
- Tách `AdminThanhToanTomTat` và `AdminThanhToanChiTiet`; `AdminDonHangChiTiet` dùng `Omit<AdminDonHang, "thanh_toan">` rồi khai báo lại `thanh_toan` đúng dạng array, loại bỏ intersection type bất khả thi.
- Không thay đổi API, database hay migration. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.2.3**.

---

## v3.3.0 — 31/08/2026

- Mở rộng audit diff `truoc` / `sau` / `thay_doi` cho cập nhật danh mục, vật liệu, màu sắc, ca làm và phân ca. Bộ lọc Nhật ký Admin có thêm **Người thao tác** và tham số `nguoi_dung_id` được truyền đồng bộ cho phân trang, CSV và Excel.
- Thêm `GET /api/v1/quan-tri/he-thong/thong-ke` tổng hợp riêng 7 ngày và 30 ngày: health tốt/cảnh báo/lỗi, tỷ lệ health tốt, backup/restore thành công/thất bại và số cảnh báo email đã ghi nhận.
- Thêm `GET /api/v1/quan-tri/he-thong/lich-su/excel`; Admin có thể xuất tối đa 5.000 bản ghi lịch sử vận hành theo bộ lọc loại/trạng thái ra `.xlsx`.
- Cảnh báo vận hành thêm `SYSTEM_HEALTH_ALERT_SILENCE_MINUTES` và `SYSTEM_HEALTH_ALERT_ESCALATION_MINUTES`. Cùng một chữ ký sự cố sẽ không gửi lại trong thời gian im lặng; khi sự cố kéo dài đủ mốc escalation, email được gửi lại theo cấp tăng dần và trạng thái được lưu trong `CANH_BAO_HE_THONG_EMAIL` để restart API không làm mất nhịp chống spam.
- Migration `202608310007_v330_audit_ops_indexes` thêm index `(nguoi_dung_id, ngay_tao)`, `(loai_su_kien, ngay_tao)` cho audit, index trạng thái/ngày cho đơn hàng và index ngày cho lịch sử vận hành.
- GitHub Actions CI thêm job `runtime-docker`: dựng PostgreSQL + migrate + API bằng Docker Compose, chờ `/api/v1/suc-khoe`, sau đó chạy `scripts/e2e-runtime-v320.ps1` trên database tạm cô lập để kiểm tra `pg_dump` → SHA-256 → `pg_restore`.
- Giao diện Hệ thống có thẻ thống kê 7/30 ngày, hiển thị silence/escalation và nút xuất Excel lịch sử vận hành. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.3.0**.

---

## v3.3.1 — 31/08/2026

- Fix rate-limit khi Admin F5/thao tác liên tục: `API_RATE_LIMIT_MAX=600` mặc định và được truyền qua Docker Compose. Cơ chế khóa tài khoản sau nhiều lần nhập sai mật khẩu vẫn giữ nguyên.
- `layTaiKhoan()` và `lamMoiPhien()` dùng single-flight để Header + trang Admin không cùng lúc rotate một refresh token. Backend cũng giữ cùng kết quả rotate trong cửa sổ 30 giây theo hash refresh token, nên các request còn sót từ lần F5 trước nhận cùng session mới thay vì request đến sau bị 401. 429/5xx chỉ là lỗi tạm thời, không xóa trạng thái đăng nhập; trang Admin tự retry thay vì đẩy người dùng ra màn hình đăng nhập.
- Khi cập nhật đơn sang `HOAN_TAT`, API trả `cap_nhat_doanh_thu` cho biết doanh thu vừa được ghi nhận hay đã ghi nhận từ trước. Hệ thống kiểm tra toàn bộ giao dịch của đơn để không chốt thêm một giao dịch `CHO_THANH_TOAN` nếu đơn đã có giao dịch `DA_THANH_TOAN`, tránh cộng doanh thu lặp. Web cập nhật KPI/biểu đồ ngay, sau đó đọc lại `/quan-tri/tong-quan` để PostgreSQL là nguồn dữ liệu cuối cùng.
- Sửa truy vấn doanh thu: tìm giao dịch `DA_THANH_TOAN` hợp lệ thay vì mặc định lấy giao dịch mới nhất; chỉ tính các khoản có `ngay_ghi_nhan` trong 30 ngày.
- Không có migration database mới. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.3.1**.

---

## v3.3.2 — 31/08/2026

- Fix trường hợp Admin chuyển 3–4 đơn sang `HOAN_TAT` nhưng chỉ một phần COD làm doanh thu tăng: backend không còn giả định giao dịch mới nhất là giao dịch cần chốt. Hệ thống ưu tiên giao dịch `COD + CHO_THANH_TOAN`, sau đó mới dùng giao dịch chờ thanh toán khác; một lần thanh toán thất bại mới hơn không còn che khuất giao dịch COD hợp lệ.
- Sau transaction, metadata `cap_nhat_doanh_thu` lấy đúng giao dịch `DA_THANH_TOAN` thực tế và trả thêm `nguon` (`CHOT_KHI_GIAO`, `DA_THANH_TOAN_TRUOC`, `LEGACY_KHONG_GIAO_DICH`, `KHONG_PHAT_SINH`) để UI giải thích chính xác vì sao doanh thu có hoặc không tăng.
- Tổng quan tách riêng `don_da_giao_theo_ky` và `don_ghi_nhan_doanh_thu_theo_ky`. Đơn online/chuyển khoản đã trả tiền được ghi nhận doanh thu trước khi giao nên chuyển sang “Đã giao” không được cộng lần hai; Dashboard hiển thị đồng thời số đơn đã giao và số đơn ghi nhận doanh thu để đối soát.
- Giao diện Đơn hàng chọn đúng giao dịch thanh toán để hiển thị/chốt, optimistic update theo `id` giao dịch thay vì luôn lấy phần tử đầu tiên. Nút chuyển trạng thái đổi nội dung theo nghiệp vụ: đơn đã thanh toán trước chỉ hiện **Xác nhận đã giao**, COD/chưa ghi nhận mới hiện **Xác nhận đã giao & ghi doanh thu**.
- Thêm nút **Đối soát doanh thu** trong Quản trị đơn hàng và API `POST /api/v1/quan-tri/don-hang/doi-soat-doanh-thu`: quét tối đa 500 đơn đã giao còn giao dịch chờ thanh toán, chốt đúng giao dịch hợp lệ, ghi lịch sử đơn + audit tổng hợp và tải lại Dashboard. Dùng để sửa ngay dữ liệu đã phát sinh trước bản vá mà không cần mở từng đơn.
- Không có migration database mới. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.3.2**.

---

## v3.4.0 — 31/08/2026

- Admin có thể đọc/sửa **cấu hình cảnh báo vận hành** ngay trong tab Hệ thống: bật/tắt, chu kỳ kiểm tra, ngưỡng backup quá hạn, silence, escalation và danh sách email nhận cảnh báo. Cấu hình được lưu ở `cau_hinh_he_thong` với khóa `CANH_BAO_HE_THONG_CAU_HINH`, `.env` là fallback; sau khi lưu API hủy/tạo lại timer ngay và ghi audit `ADMIN_CAP_NHAT_CAU_HINH_CANH_BAO_HE_THONG` có `truoc` / `sau` / `thay_doi`.
- Health check tạo **SHA-256 incident signature** từ tập vấn đề và lưu vào `lich_su_van_hanh.chu_ky_canh_bao`. API mới nhóm tối đa 5.000 sự kiện gần nhất theo signature, trả danh sách incident và timeline chi tiết; Admin có thể mở chuỗi sự cố từ danh sách incident hoặc từng dòng lịch sử.
- Thêm thống kê **SLA/Uptime 30/90 ngày**: SLA là tỷ lệ mẫu HEALTH `TOT`, uptime là tỷ lệ mẫu không `LOI`; giao diện có KPI tổng hợp và biểu đồ theo từng ngày.
- Thêm cursor pagination dựa trên BigInt `id` cho lịch sử vận hành và Nhật ký Admin. UI dùng **Tải thêm** thay cho page offset; endpoint phân trang cũ vẫn được giữ để tương thích. Tìm kiếm audit dùng cursor-scan có giới hạn batch để không kéo toàn bộ bảng vào bộ nhớ.
- Migration `202608310008_v340_incident_signature_cursor_sla` thêm cột `chu_ky_canh_bao VARCHAR(64)` và index `(chu_ky_canh_bao, ngay_tao DESC)`.
- Thêm `scripts/e2e-runtime-v340.ps1`: chạy regression backup/SHA/restore v3.2.0, đăng nhập Admin bằng cookie session, đọc đơn hàng/sản phẩm, preview import kho CSV không ghi tồn, kiểm tra phiếu nhập + xuất Excel tồn kho và xác minh các endpoint config/SLA/incident/cursor. CI Docker chuyển sang script v3.4.0.
- Vì source release không kèm `package-lock.json`, CI/Release dùng `npm install` thay cho `npm ci`, thống nhất với quy trình release Windows hiện tại.
- Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.4.0**. Quy trình release: `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v340.ps1` → `./scripts/release.ps1 v3.4.0`.

---

## v3.4.1 — 01/09/2026

- Fix GitHub Actions `runtime-docker`: login Admin trả 200 nhưng request `GET /api/v1/quan-tri/don-hang` bị 401 do access cookie `nhienin3d_phien` có cờ `Secure` và PowerShell không gửi cookie đó khi smoke test gọi trực tiếp `http://localhost:3001`.
- `scripts/e2e-runtime-v341.ps1` dùng `Invoke-WebRequest` ở bước login để đọc `Set-Cookie`, lấy access JWT cookie và gắn `Cookie: nhienin3d_phien=...` tường minh cho các request loopback Admin. Vẫn kiểm tra đầy đủ JWT, session PostgreSQL và quyền ADMIN; không thay đổi cấu hình cookie production.
- Vá tương tự cho `scripts/e2e-runtime-v340.ps1` để người dùng chạy lại script cũ không còn gặp 401; health check của script v3.4.0 chấp nhận các patch release `3.4.x`.
- CI chuyển runtime smoke sang `scripts/e2e-runtime-v341.ps1`; thêm regression test cho chính lỗi Secure-cookie/HTTP-loopback.
- Không có migration database mới. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.4.1**. Quy trình release: `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v341.ps1` → `./scripts/release.ps1 v3.4.1`.

---

## v3.5.0 — 01/09/2026

- Thêm workflow Incident `MOI` / `DA_TIEP_NHAN` / `DA_KHAC_PHUC`, lưu người tiếp nhận, người khắc phục, thời điểm và ghi chú remediation. Hai API mới `POST /api/v1/quan-tri/he-thong/su-co/:chu_ky/tiep-nhan` và `/khac-phuc` đều ghi audit trước/sau.
- Migration `202609010001_v350_incident_slo_rollup` tạo bảng `su_co_van_hanh` và backfill từ lịch sử có chữ ký. Mỗi HEALTH/ALERT mới cập nhật aggregate theo chữ ký, nên API danh sách incident đọc trực tiếp bảng tổng hợp thay vì scan 5.000 sự kiện gần nhất.
- Thêm cấu hình runtime `SLO_VAN_HANH_CAU_HINH` với `SYSTEM_SLO_SLA_TARGET_PERCENT`, `SYSTEM_SLO_UPTIME_TARGET_PERCENT`, `SYSTEM_SLO_TREND_ALERT_ENABLED`. Admin chỉnh trực tiếp mục tiêu SLA/Uptime; thống kê trả thêm xu hướng 7/30 ngày, trạng thái đạt mục tiêu và danh sách cảnh báo.
- Cơ chế email vận hành nhận thêm cảnh báo SLO. Khi chỉ SLO vi phạm nhưng health tức thời vẫn tốt, email vẫn chuyển trạng thái cảnh báo và chữ ký SHA-256 được tính trên toàn bộ tập vấn đề để silence/escalation không gộp nhầm sự cố.
- UI Hệ thống có thẻ cấu hình SLO, cảnh báo xu hướng và thao tác tiếp nhận/khắc phục Incident kèm ghi chú. Bổ sung Playwright browser E2E trên HTTPS local và `scripts/e2e-runtime-v350.ps1`; GitHub Actions runtime job chạy cả hai lớp E2E.
- Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.5.0**. Quy trình release: `npm install` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v350.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.5.0`.

---

## v3.5.1 — 01/09/2026

- Sửa lỗi `docker compose up -d --build --remove-orphans` dừng ở target `api/migrate` do `npm audit --audit-level=high` nhìn thấy `@playwright/test 1.55.0` / `playwright <1.55.1` và advisory `GHSA-7mvr-c777-76hp`. Nâng Playwright browser E2E lên **1.62.1**.
- Dockerfile API vẫn giữ security gate nhưng `npm audit` được scope bằng `--workspace=@nhienin3d/api`, tránh dependency chỉ dùng cho browser E2E ở root chặn việc build API/migrate; CI root tiếp tục chạy `npm run audit:security` để không bỏ sót lỗ hổng toàn repository.
- Thêm `scripts/e2e-runtime-v351.ps1` và `scripts/e2e-browser-v351.mjs`. Hai script kiểm tra API đang thực sự chạy **v3.5.1** trước khi gọi các endpoint SLO/Incident; nếu build trước đó thất bại và Docker giữ container cũ, lỗi sẽ chỉ rõ stale image/container thay vì 404 `cau-hinh-slo`.
- GitHub Actions chuyển runtime/browser smoke sang v3.5.1 và audit lại dependency sau `npm install` trước khi tải Chromium.
- Không có migration database mới. Migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.5.1**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v351.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.5.1`.

---

## v3.5.2 — 01/09/2026

- Khóa dependency install script theo `allowScripts` pin phiên bản sau khi npm 12 báo 5 package chưa được duyệt: cho phép `@prisma/engines@7.10.0`, `prisma@7.10.0`, `argon2@0.45.1`, `esbuild@0.28.2`; từ chối `@scarf/scarf` để không chạy telemetry postinstall.
- Bật `strict-allow-scripts=true` ở root, API và Web. Thêm `engines.npm >=11.17.0` để tài liệu hóa mốc npm hỗ trợ policy này. Dockerfile API/Web copy `.npmrc` trước `npm install`, vì vậy build container cũng fail-closed nếu xuất hiện package install-script mới chưa được duyệt.
- Thêm regression test v3.5.2 kiểm tra allowlist, Scarf deny, `.npmrc` strict và Docker copy policy. Runtime/browser smoke chuyển sang `scripts/e2e-runtime-v352.ps1` / `scripts/e2e-browser-v352.mjs`.
- Không có migration database mới. Migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.5.2**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v352.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.5.2`.

---

## v3.5.3 — 01/09/2026

- Sửa warning npm 12 `allowScripts in workspace ... is ignored`: xóa `allowScripts` khỏi `apps/api/package.json` và `apps/web/package.json`, chỉ giữ allowlist pin phiên bản ở `package.json` gốc. Xóa `.npmrc` trùng trong hai workspace; `.npmrc` gốc là policy duy nhất và vẫn bật `strict-allow-scripts=true`.
- Docker Web chuyển build context về repository root, copy root `package.json` + `.npmrc` rồi cài riêng workspace Web. Nhờ đó Web image cũng áp dụng chính xác allowlist gốc thay vì cần một `allowScripts` cục bộ mà npm workspace sẽ cảnh báo khi cài ở root.
- Bổ sung regression test v3.5.3 để khóa yêu cầu root-only policy và Docker Web root-context. Runtime/browser smoke chuyển sang `scripts/e2e-runtime-v353.ps1` / `scripts/e2e-browser-v353.mjs`.
- Không có migration database mới. Migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.5.3**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v353.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.5.3`.

## v3.5.4 — 01/09/2026

- Sửa lỗi regression `v3.5.3 allowScripts chi khai bao o project root...` có thể fail tại `existsSync("apps/api/.npmrc")` khi người dùng chép source mới đè lên thư mục dự án đã từng chạy v3.5.2. Archive mới không chứa `.npmrc` workspace nhưng thao tác chép đè không tự xóa file cũ, nên test nhìn thấy file legacy còn sót.
- `scripts/don-dep-legacy.mjs` bổ sung tự động xóa `apps/api/.npmrc` và `apps/web/.npmrc` trước root test. Giữ nguyên `allowScripts` duy nhất ở `package.json` gốc và `strict-allow-scripts=true` ở `.npmrc` gốc; không hạ mức bảo vệ install-script.
- Bổ sung regression test v3.5.4 khóa cleanup overlay; Runtime/browser smoke chuyển sang `scripts/e2e-runtime-v354.ps1` / `scripts/e2e-browser-v354.mjs`, CI cũng dùng script mới.
- Không có migration database mới. Migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.5.4**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v354.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.5.4`.

---

## v3.6.0 — 01/09/2026

- Thêm `GET/POST /api/v1/quan-tri/he-thong/bao-tri` để quản lý một maintenance window có lịch trong `cau_hinh_he_thong`, gồm bật/tắt, bắt đầu, kết thúc và lý do. Backend validate thời gian kết thúc phải sau bắt đầu và giới hạn mỗi cửa sổ tối đa 30 ngày; mọi thay đổi ghi Audit và lịch sử `MAINTENANCE`.
- Job cảnh báo hệ thống tự động kiểm tra maintenance trước khi chạy health/SLO alert. Khi cửa sổ đang hoạt động, scheduler trả trạng thái im lặng và không gửi email/webhook; thao tác kiểm tra/gửi thủ công vẫn có thể chạy khi Admin chủ động yêu cầu. Health Admin trả thêm trạng thái maintenance và webhook.
- `GET /he-thong/sla` bổ sung **error budget 30 ngày** cho SLA/Uptime và **burn-rate 1h, 6h, 24h**. Burn-rate >= 1x được đưa vào danh sách cảnh báo SLO khi bật cảnh báo xu hướng; UI hiển thị ngân sách còn lại, phần đã tiêu và tốc độ burn theo từng cửa sổ.
- Thêm `GET /he-thong/su-co/excel` và `GET /he-thong/su-co/:chu_ky/excel` để xuất danh sách Incident và Timeline chi tiết ra XLSX, sử dụng bộ tạo Excel nội bộ hiện có, không thêm dependency.
- Chuẩn bị kênh webhook ngoài qua `SYSTEM_ALERT_WEBHOOK_ENABLED`, `SYSTEM_ALERT_WEBHOOK_URL`, `SYSTEM_ALERT_WEBHOOK_BEARER_TOKEN`; production yêu cầu HTTPS và Bearer token không bao giờ được phản hồi qua API/UI. Khi email cảnh báo được gửi, hệ thống đồng thời phát payload `nhienin3d.system.alert` tới webhook nếu cấu hình hợp lệ.
- Thêm `scripts/e2e-runtime-v360.ps1` kiểm tra maintenance/error budget/burn-rate/Incident Excel/webhook. Trong CI, runtime script seed một synthetic incident riêng; `scripts/e2e-browser-v360.mjs` dùng synthetic incident đó để kiểm tra `MOI → DA_TIEP_NHAN → DA_KHAC_PHUC` và persistence sau reload. Khi chạy local, mutation incident mặc định bị skip để bảo vệ dữ liệu thật.
- Browser E2E luôn kiểm tra cập nhật SLO + reload persistence và restore lại SLO ban đầu trong `finally`. CI chuyển runtime/browser smoke lên v3.6.0.
- Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.6.0**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v360.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.0`.

---

## v3.6.1 — 01/09/2026

- Sửa lỗi Docker Web trên Linux dừng với `ESTRICTALLOWSCRIPTS` vì dependency tùy chọn `fsevents@2.3.2` và `fsevents@2.3.3` có install script nhưng chưa có quyết định trong allowlist gốc. Hai phiên bản `fsevents` được **deny tường minh** (`false`) vì chỉ phục vụ macOS file watching và không cần chạy native build trong Linux container.
- Giữ `strict-allow-scripts=true`; không dùng `--dangerously-allow-all-scripts`, không tắt security gate và không cho phép install script `fsevents`. Regression v3.5.2 được đổi từ so sánh toàn bộ object sang kiểm tra các quyết định bảo mật bắt buộc để các patch sau có thể thêm deny/allow đã review.
- Runtime/browser smoke chuyển sang `scripts/e2e-runtime-v361.ps1` / `scripts/e2e-browser-v361.mjs`; preflight tiếp tục phát hiện container cũ nếu một lần Docker build trước đó thất bại.
- Không có migration database mới. Migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.6.1**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v361.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.1`.

---

## v3.6.2 — 01/09/2026

- Sửa lỗi image Web v3.6.1 build thành công nhưng container `nhienin3d-web` restart với `MODULE_NOT_FOUND: Cannot find module '/app/server.js'`. Với Next.js `output: "standalone"` trong npm workspace, standalone giữ cấu trúc monorepo và entrypoint nằm tại `apps/web/server.js`; Dockerfile cũ copy toàn bộ cây vào `/app` nhưng lại chạy từ `/app`.
- Runtime stage Web nay copy `.next/static` vào `/app/apps/web/.next/static`, `public` vào `/app/apps/web/public`, kiểm tra `RUN test -f /app/apps/web/server.js`, chuyển `WORKDIR /app/apps/web` rồi mới `CMD ["node", "server.js"]`. Cách này giữ đúng đường dẫn module/node_modules mà Next standalone tạo ra.
- `docker-compose.yml` thêm healthcheck HTTP nội bộ cho Web và HTTPS phụ thuộc `service_healthy`, giúp container lỗi bị phát hiện rõ trước khi Caddy phục vụ request. Giữ nguyên strict `allowScripts`, deny `fsevents`, Docker npm audit và toàn bộ tính năng Maintenance/Error Budget/Burn-rate/Incident Excel/Webhook của v3.6.0.
- Runtime/browser smoke chuyển sang `scripts/e2e-runtime-v362.ps1` / `scripts/e2e-browser-v362.mjs`; CI cũng dùng nhãn/version v3.6.2. Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.6.2**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v362.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.2`.

---


## v3.6.3 — 01/09/2026

- Sửa healthcheck Web v3.6.2 bị `unhealthy` dù image đã build đúng và `/app/apps/web/server.js` tồn tại. Next standalone đọc biến `HOSTNAME` của container; khi nó bind vào hostname/container-IP, healthcheck gọi `127.0.0.1:3000` có thể không chạm được server và Compose chặn HTTPS với `dependency web failed to start`.
- Runtime Web nay khởi động bằng `HOSTNAME=0.0.0.0 PORT=3000 exec node server.js`, buộc Next lắng nghe trên mọi interface nhưng vẫn giữ `WORKDIR /app/apps/web`, cấu trúc standalone monorepo và healthcheck loopback. HTTPS tiếp tục phụ thuộc `service_healthy` để phát hiện lỗi sớm.
- Runtime/browser smoke chuyển sang `scripts/e2e-runtime-v363.ps1` / `scripts/e2e-browser-v363.mjs`; CI đồng bộ nhãn/version v3.6.3. Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.6.3**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v363.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.3`.

---

## v3.6.4 — 01/09/2026

- Sửa lỗi `scripts/e2e-runtime-v363.ps1` báo `Health endpoint chưa lên v3.6.3` dù preflight public health đã xác nhận API v3.6.3. Nguyên nhân là assertion Admin health bị kế thừa sai từ v3.6.1: kiểm tra `health.phien_ban -eq "3.6.1"` thay vì version hiện tại.
- `e2e-runtime-v364.ps1` nay đối chiếu hai contract rõ ràng: public `/suc-khoe` phải trả `v3.6.4`, còn Admin `/quan-tri/he-thong/suc-khoe` phải trả `3.6.4`. Đồng thời sửa assertion version trong script lịch sử v3.6.2 và v3.6.3 để tránh false-negative tương tự.
- Thêm regression test khóa đúng hai version contract, CI chuyển sang runtime/browser E2E v3.6.4. Giữ nguyên Docker Web healthy fix v3.6.3, strict allowScripts/fsevents, Maintenance Window, Error Budget/Burn-rate, Incident Excel và Webhook.
- Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.6.4**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v364.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.4`.

---

## v3.6.5 — 01/09/2026

- Sửa GitHub Actions Browser E2E `strict mode violation`: `getByText(`#${syntheticSignature.slice(0, 12)}`)` có thể khớp cả chữ ký trong card Incident lẫn chữ ký ở Lịch sử vận hành, nên Playwright strict locator trả 2 phần tử và dừng tại `openSynthetic`.
- `e2e-browser-v365.mjs` scope locator vào riêng `.cine-incident-list-v340 .cine-incident-item-v340`, lọc theo nhãn chữ ký và assert đúng 1 card trước khi click. Cách này không phụ thuộc việc cùng chữ ký có xuất hiện ở timeline/lịch sử bên ngoài danh sách Incident.
- Đồng thời vá locator tương tự trong browser script versioned v3.6.0-v3.6.4 của source mới và thêm regression test để cấm quay lại selector toàn trang gây mơ hồ. Runtime E2E/CI/version chuyển sang v3.6.5.
- Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`. Đồng bộ Root/API/Web/Health/OpenAPI lên **v3.6.5**.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v365.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.5`.

---

## v3.6.6 — 01/09/2026

- Sửa Release workflow build Web image fail với `COPY ... not found`. Nguyên nhân: Web Dockerfile cần repository root context, nhưng `docker/build-push-action@v6` ở `.github/workflows/release.yml` vẫn dùng `context: ./apps/web`, khiến build context chỉ có nội dung workspace Web và không thể thấy `.npmrc`, `apps/api/package.json` hay đường dẫn `apps/web`.
- Bước `Build và push Web image` nay dùng `context: .` và `file: ./apps/web/Dockerfile`, khớp với `docker-compose.yml` đã chạy thành công ở local. Thêm regression test khóa root context để tránh release workflow lệch khỏi Dockerfile lần nữa.
- Runtime/browser smoke chuyển sang `scripts/e2e-runtime-v366.ps1` / `scripts/e2e-browser-v366.mjs`; CI/version/Health/OpenAPI đồng bộ **v3.6.6**. Cảnh báo Node 20 deprecation và `punycode` trong GitHub Actions là warning không chặn job, không dùng biến `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`.
- Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v366.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.6`.

---

## v3.6.7 — 01/09/2026

- Browser E2E incident lifecycle scope kiểm tra trạng thái vào panel chi tiết synthetic incident đang chọn, tránh Playwright strict-mode khi nhiều card/list/timeline cùng hiển thị `DA TIEP NHAN` hoặc `DA KHAC PHUC`.
- Backport cùng scoped status assertion cho `e2e-browser-v360.mjs` đến `e2e-browser-v366.mjs`; CI/runtime/browser hiện dùng v3.6.7 và vẫn giữ GitHub Release Web root Docker context từ v3.6.6.
- Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v367.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.6.7`.

## v3.7.0 — 01/09/2026

- Thêm Ops Dashboard riêng `/quan-tri/ops` với bộ lọc incident theo thời gian/trạng thái, tổng hợp SLO/Uptime, error budget, MTTA/MTTR, maintenance, webhook delivery và xuất Excel tổng hợp.
- Maintenance nâng từ một window thành danh sách tối đa 50 window, hỗ trợ bật/tắt riêng, lịch lặp hằng ngày/hằng tuần và API CRUD; endpoint cũ vẫn tương thích bằng window `legacy`.
- SLO nâng cao lưu multi-window burn-rate policy và service target cho API/PostgreSQL/backup/SMTP trong `cau_hinh_he_thong`; thống kê trả error budget theo dịch vụ và MTTA/MTTR/P95 từ incident aggregate.
- Webhook tách khỏi email transport, có retry/backoff, HMAC SHA-256 và delivery log trong `lich_su_van_hanh`. Thêm `SYSTEM_ALERT_WEBHOOK_SECRET`, `SYSTEM_ALERT_WEBHOOK_MAX_RETRIES`, `SYSTEM_ALERT_WEBHOOK_BACKOFF_MS` cho local/Docker.
- Incident list/Excel thêm filter `tu_ngay`, `den_ngay`; thêm endpoint `GET /he-thong/ops/excel` và `GET /he-thong/webhook/delivery`.
- Runtime/browser E2E chuyển sang v3.7.0. Không có migration mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v370.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.7.0`.


## v3.7.1 — 01/09/2026

- Sửa `npm run typecheck` API: `gia_tri: { windows }` trước đó nhận `Record<string, unknown>[]`, không thỏa Prisma 7 `InputJsonValue`. v3.7.1 định nghĩa `BaoTriV370Luu` với các field JSON-safe, ghi qua `Prisma.InputJsonObject` và tái sử dụng cùng payload cho create/update.
- Sửa `npm run typecheck` Web: `/quan-tri/ops` nay kiểm tra `!taiKhoan || taiKhoan.vai_tro !== "ADMIN"` trước khi đọc role, loại lỗi TS18047 khi `layTaiKhoan()` có thể trả `null`.
- Thêm regression test cho cả hai lỗi typecheck; Runtime/Browser E2E và CI chuyển sang v3.7.1. Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v371.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.7.1`.

## v3.7.2 — 01/09/2026

- Sửa `npm run build` Web trên Next.js 16/Turbopack: CSS Module `/quan-tri/ops/page.module.css` không còn selector global thuần `table`, `th`, `td`; các rule được scope thành `.tableWrap table`, `.tableWrap th`, `.tableWrap td` để đáp ứng pure-selector rule.
- Giữ nguyên fix typecheck v3.7.1 cho Prisma JSON `BaoTriV370Luu[]` và kiểm tra `taiKhoan` null trước role; thêm regression test chặn selector CSS Module thuần quay lại.
- Runtime/Browser E2E, CI, Health/OpenAPI chuyển sang v3.7.2. Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v372.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.7.2`.

## v3.8.0 — 01/09/2026

- Thêm endpoint SLO probe HTTP thật với scheduler riêng `SYSTEM_SLO_ENDPOINT_INTERVAL_MINUTES`; endpoint list/target/timeout cấu hình qua SLO policy hiện có. `GET /he-thong/sla` trả `endpoint_slo.time_weighted`, availability, downtime và error budget theo endpoint.
- Ops Dashboard thêm comparison 7/30/90, burn-rate timeline, maintenance annotation và endpoint SLO editor; Ops Excel xuất cùng dữ liệu comparison/endpoint time-weighted.
- Webhook thêm adapter preset `GENERIC/SLACK/TEAMS/DISCORD`, dead-letter `WEBHOOK_DLQ` khi hết retry và API/UI replay có audit `WEBHOOK_REPLAY`.
- Incident timeline thêm cursor pagination và PostgreSQL full-text search; UI Ops có search/tải thêm timeline thay vì phải nạp tối đa 1000 sự kiện một lần.
- Runtime/Browser E2E, CI, Health/OpenAPI chuyển sang v3.8.0. Không có migration database mới; migration mới nhất vẫn là `202609010001_v350_incident_slo_rollup`.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v380.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.8.0`.

## v3.9.0 — 01/09/2026

- Endpoint probe nâng lên `GET/HEAD`, header template `${ENV:NAME}`, Bearer token từ env, latency target, latency SLI/P50/P95/P99 và histogram; log chỉ lưu tên header/auth template, không lưu secret.
- SLO time-weighted trở thành maintenance-aware: tùy chọn loại maintenance khỏi availability/error budget, giới hạn gap bằng `max_gap_multiplier`, trả phút maintenance bị loại và cảnh báo latency P95.
- Webhook DLQ có retention, derived status, acknowledge, bulk replay 1-20 item và idempotency key; có policy cho phép replay trùng khi Admin chủ động bật.
- Migration `202609010002_v390_ops_search_metrics` thêm generated `search_vector`, GIN full-text index, incident cursor index và materialized view `ops_incident_metrics_v390` cho MTTA/MTTR/P95; service có runtime fallback nếu view chưa sẵn sàng.
- Ops Dashboard hiển endpoint latency + maintenance-aware policy, incident GIN full-text và DLQ lifecycle. Runtime/Browser E2E, CI, Health/OpenAPI chuyển sang v3.9.0.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v390.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.9.0`.

## v3.10.0 — 01/09/2026

- Endpoint SLI được persistence vào `slo_endpoint_mau` với agent/node/region, status, latency, target, maintenance flag và Apdex bucket. `GET /he-thong/sla` ưu tiên persistent sample, trả `persistent_samples`, `probe_agents` và Apdex score; legacy `SLO_ENDPOINT` history vẫn là fallback tương thích.
- Webhook DLQ payload chuyển sang `webhook_dlq_payload` mã hóa AES-256-GCM. `lich_su_van_hanh` chỉ giữ reference/hash/metadata, không giữ plaintext payload; khóa lấy từ `SYSTEM_ALERT_WEBHOOK_DLQ_ENCRYPTION_KEY` hoặc dẫn xuất từ `COOKIE_SECRET` và API chỉ lộ `key_id/key_source`, không lộ key.
- Thêm scheduled DLQ retry + exponential backoff + retention expiry; `SYSTEM_ALERT_WEBHOOK_DLQ_RETRY_INTERVAL_MINUTES` và `SYSTEM_ALERT_WEBHOOK_DLQ_SCHEDULED_MAX_ATTEMPTS` điều khiển scheduler. Replay/ack/bulk replay/idempotency từ v3.9.0 vẫn tương thích, legacy dead-letter vẫn đọc được.
- Materialized incident metrics không còn refresh đồng bộ trên request dashboard. Scheduler refresh `ops_incident_metrics_v390` rồi cache JSON trong `ops_metric_cache`; thêm retention cleanup cho endpoint sample và telemetry low-value không gắn incident.
- Thêm RBAC Ops/on-call theo dịch vụ với `OPS_VIEWER`, `ON_CALL`, `SERVICE_OWNER`, escalation 1-5. Admin quản lý assignment; người dùng được phân công truy cập dashboard/timeline qua `/api/v1/ops`, còn thao tác tiếp nhận/khắc phục yêu cầu ON_CALL hoặc SERVICE_OWNER.
- Migration `202609010003_v3100_ops_persistence_dlq_oncall` thêm `slo_endpoint_mau`, `webhook_dlq_payload`, `ops_metric_cache`, `ops_phan_cong`. Runtime/Browser E2E, CI, Health/OpenAPI đồng bộ v3.10.0 và kiểm tra persistent/Apdex/encrypted DLQ/cache/RBAC.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v3100.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.10.0`.


## v3.10.1 — 01/09/2026

- Sửa `npm run typecheck` API lỗi `TS18047: 'cache' is possibly 'null'` trong Ops metrics cache. Nhánh đọc cache nay kiểm tra đồng thời `cache && c` trước khi truy cập `cache.refreshed_at`, giữ nguyên fallback materialized view/runtime khi cache chưa tồn tại.
- Thêm regression test khóa null narrowing để không tái sử dụng `if (c)` rồi dereference `cache`. Runtime/Browser E2E, CI, Health/OpenAPI và package version đồng bộ **v3.10.1**.
- Không có migration mới; migration mới nhất vẫn là `202609010003_v3100_ops_persistence_dlq_oncall`. Toàn bộ persistent Apdex, encrypted DLQ, scheduled retry, Ops cache và RBAC on-call của v3.10.0 được giữ nguyên.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v3101.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.10.1`.

## v3.10.2 — 02/09/2026

- Sửa `npm audit` báo **2 high severity vulnerabilities** từ `mysql2 <3.22.0` / GHSA-3f6p-5ww8-9rcr nằm trong dependency tree của Prisma CLI. Root `overrides` ghim `mysql2: 3.22.0`, là ngưỡng đã vá theo audit report.
- Giữ nguyên Prisma `7.10.0`, `@prisma/client 7.10.0` và `@prisma/adapter-pg 7.10.0`; không chạy `npm audit fix --force` vì npm đề xuất downgrade Prisma xuống `6.19.3`, là breaking change và không cần thiết cho stack PostgreSQL hiện tại.
- Giữ fix null narrowing v3.10.1; Runtime/Browser E2E, CI, Health/OpenAPI và package version đồng bộ **v3.10.2**. Thêm regression test khóa `overrides.mysql2 === 3.22.0` và khóa Prisma 7.10.0.
- Không có migration mới; migration mới nhất vẫn là `202609010003_v3100_ops_persistence_dlq_oncall`.
- Quy trình release: `npm install` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → `./scripts/backup-db.ps1` → `docker compose up -d --build --remove-orphans` → `docker compose ps` → `./scripts/e2e-runtime-v3102.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.10.2`.

## v3.10.3 — 02/09/2026

- Sửa security dependency reconciliation: thêm `mysql2@3.22.0` làm root devDependency và cho `overrides.mysql2` tham chiếu `$mysql2`, để `npm install` cập nhật cây cài đặt/lockfile thay vì giữ `mysql2@3.15.3 invalid`.
- Thêm `scripts/kiem-tra-mysql2-security.mjs`; `npm run audit:security` và `scripts/kiem-tra.ps1` xác minh mysql2 đang cài đặt >=3.22.0 trước khi audit/release.
- Giữ Prisma 7.10.0 và PostgreSQL adapter; không dùng `npm audit fix --force`. Runtime/Browser E2E, CI, Health/OpenAPI đồng bộ v3.10.3. Không có migration mới.
- Quy trình release: `npm install` → `npm ls mysql2 --all` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → Docker → `./scripts/e2e-runtime-v3103.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.10.3`.


## v3.10.4 — 02/09/2026

- Sửa false-fail GitHub Actions ở bước `npm ls mysql2 --all`: trên runner, Prisma 7.10.0 vẫn khai báo exact `mysql2@3.15.3` trong package manifest nên npm có thể trả `ELSPROBLEMS` dù intentional root override đã làm module thực tế resolve tới `mysql2@3.22.0`.
- `scripts/kiem-tra-mysql2-security.mjs` nay dùng Node `createRequire()` để resolve `mysql2/package.json` từ root và từ context của Prisma; mọi package path thực tế phải đạt `>=3.22.0`. CI và `scripts/kiem-tra.ps1` không còn dùng `npm ls` làm security gate.
- Giữ direct pin `mysql2@3.22.0`, linked override `$mysql2`, Prisma 7.10.0 và `npm audit --audit-level=high`. Không downgrade Prisma và không dùng `npm audit fix --force`.
- Runtime/Browser E2E, CI, Health/OpenAPI đồng bộ **v3.10.4**. Không có migration mới; migration mới nhất vẫn `202609010003_v3100_ops_persistence_dlq_oncall`.
- Quy trình release: `npm install` → `npm run security:mysql2` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → Docker → `./scripts/e2e-runtime-v3104.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.10.4`.

## v3.10.5 — 02/09/2026

- Sửa checker v3.10.4 lỗi `Cannot find module .../node_modules/prisma/build/types.js` khi cố resolve package Prisma trên Windows. Đây là lỗi validation script, không phải lỗ hổng dependency: `npm audit` vẫn 0 và test/typecheck/build đều PASS.
- `scripts/kiem-tra-mysql2-security.mjs` không còn phụ thuộc `createRequire()`/entrypoint/exports của Prisma. Checker quét installed `node_modules` tree theo package boundary, theo cả nested `node_modules`, đọc trực tiếp `package.json` của mọi package có `name === "mysql2"` và fail nếu bất kỳ version nào `<3.22.0`.
- Thêm regression test thực thi checker trên dependency tree giả: PASS với `mysql2@3.22.0`, FAIL khi xuất hiện nested `mysql2@3.15.3`. Giữ direct pin `mysql2@3.22.0`, linked override `$mysql2`, Prisma 7.10.0 và `npm audit --audit-level=high`.
- Runtime/Browser E2E, CI, Health/OpenAPI đồng bộ **v3.10.5**. Không có migration mới; migration mới nhất vẫn `202609010003_v3100_ops_persistence_dlq_oncall`.
- Quy trình release: `npm install` → `npm run security:mysql2` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → Docker → `./scripts/e2e-runtime-v3105.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.10.5`.


## v3.11.0 — 02/09/2026

- Thêm signed distributed probe ingestion/heartbeat với HMAC-SHA256, timestamp clock-skew, nonce replay protection, agent health và standalone probe agent script; endpoint SLO có breakdown theo region/node.
- DLQ nâng lên keyring/KMS-friendly key references, active-key rotation, destination retry budget và async bulk replay jobs có progress/cancel/per-item audit.
- Migration `202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive` thêm probe agent/nonce, retry budget/replay job, on-call/escalation, incident service/owner, archive batch và partitioned telemetry archive.
- Retention chuyển sang archive-first: direct prune mặc định khóa, Admin preview count/hash rồi archive + verify trước khi prune dữ liệu nguồn.
- On-call schedule/rotation theo ca/timezone/service, escalation routing EMAIL/WEBHOOK, incident ownership/auto-assign; Ops Dashboard hiển thị toàn bộ control plane mới.
- Build hotfix: xử lý an toàn union return của `replay_webhook_dead_letter()` trước khi đọc `ly_do`, sửa lỗi TypeScript `TS2339` tại bulk replay job và thêm regression assertion để tránh tái phát.
- Distributed probe hotfix: HMAC heartbeat/ingest xác minh trên request body gốc trước transform DTO; fallback `public-health` luôn có `timeout_ms=5000`, probe có timeout fallback phòng thủ và log rõ lỗi endpoint thay vì âm thầm trả `LOI`.
- Runtime/Browser E2E, CI, Health/OpenAPI đồng bộ v3.11.0. Quy trình release: `npm install` → `npm run security:mysql2` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → Docker/migration → `./scripts/e2e-runtime-v3110.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.11.0`.

## v3.12.0 — 02/09/2026

- Thêm **Managed probe fleet** trên Ops runtime/UI: khai báo agent mong đợi bằng `SYSTEM_SLO_AGENT_PROFILES_JSON`, đối chiếu profile + per-agent keyring + PostgreSQL registration/heartbeat.
- Phân loại agent thành `ONLINE`, `STALE`, `OFFLINE`, `MISSING`; ngưỡng stale/offline cấu hình bằng `SYSTEM_SLO_AGENT_STALE_AFTER_SECONDS` và `SYSTEM_SLO_AGENT_OFFLINE_AFTER_SECONDS`.
- Ops Dashboard dùng badge trạng thái managed fleet và online/offline dạng compact 22px, chữ canh giữa để không kéo cao panel.
- Trả key coverage/registration coverage và metadata key an toàn; `secret_values_exposed=false`, không trả hoặc log raw secret trên API/Ops UI.
- Thêm `scripts/probe-fleet-v3120.ps1` làm managed keepalive runner: `npm run probe:fleet` chạy liên tục theo chu kỳ, `npm run probe:fleet:once` chạy một vòng smoke; cập nhật `probe:agent` sang `probe-agent-v3120.mjs`.
- Giữ HMAC timestamp/nonce của v3.11.0, không thêm migration mới; tiếp tục dùng 23 migrations với migration mới nhất `202609020001_v3110_distributed_probe_dlq_keyring_oncall_archive`.
- Runtime E2E, Browser E2E, CI, API Health/OpenAPI và Ops Dashboard đồng bộ **v3.12.0**.
- UI hotfix: thu nhỏ badge `online · offline` còn 22px, chặn flex stretch và canh giữa chữ để panel gọn hơn trên desktop.
- Probe Fleet PowerShell hotfix: dùng `${id}: ...` khi nội suy chuỗi để tránh `InvalidVariableReferenceWithDrive` trên Windows PowerShell; lưu runner dạng UTF-8 BOM để thông báo tiếng Việt không bị mojibake.
- Quy trình release: `npm install` → `npm run security:mysql2` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → Docker → `./scripts/e2e-runtime-v3120.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.12.0`.

## v3.13.0 — 02/09/2026

- Bổ sung **Ed25519 asymmetric signing** cho distributed probe; header `x-nhienin3d-signature-alg=ED25519`, API chỉ cần public key và tiếp tục dùng timestamp + nonce anti-replay.
- Giữ **HMAC-SHA256** làm chế độ tương thích ngược; agent tự chọn Ed25519 khi có private key, nếu không dùng per-agent/shared HMAC như v3.12.
- `SYSTEM_SLO_AGENT_PUBLIC_KEYS_JSON` hỗ trợ một public key hoặc mảng nhiều public key trên mỗi agent để rotate theo grace-period; Ops fleet tính signing coverage từ HMAC hoặc Ed25519.
- Thêm `scripts/probe-keygen-v3130.mjs` và `npm run probe:keygen`; keypair lưu ở `.probe-keys/` và không commit private key.
- Thêm **multi-region quorum/consensus** cho endpoint persistent samples với ngưỡng window/min-regions/healthy-percent cấu hình qua ENV; phát hiện `QUORUM_OK`, `DEGRADED`, `OUTAGE` và region disagreement.
- Thêm **latency/status anomaly detection** theo region: median baseline, multiplier, minimum samples và lookback configurable; Ops runtime trả anomaly regions mà không cần migration mới.
- Ops Dashboard thêm panel compact quorum/anomaly; Managed probe fleet và distributed probe badges giữ layout nhỏ, chữ canh giữa.
- Không thêm migration; tiếp tục 23 migrations và giữ DLQ keyring/replay jobs, archive verify-before-prune, on-call/escalation của v3.11-v3.12.
- Runtime/Browser E2E, CI, Health/OpenAPI và package version đồng bộ **v3.13.0**.
- Quy trình release: `npm install` → `npm run security:mysql2` → `npm audit` → `npm test` → `npm run typecheck` → `npm run build` → Docker → `./scripts/e2e-runtime-v3130.ps1` → `npm run e2e:browser` → `./scripts/release.ps1 v3.13.0`.

# Lộ trình tiếp theo

## v3.14.0

- Probe enrollment token/self-service rotation nâng cao hoặc mTLS; bổ sung revoke/expiry metadata cho asymmetric keys.
- SLO alert chủ động theo quorum + burn-rate anomaly và service dependency map.
- Archive export sang object storage S3-compatible, restore/replay từng partition và retention policy theo legal/audit class.
- On-call calendar import/export, override/absence, handoff report và escalation notification acknowledgment.
