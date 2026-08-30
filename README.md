# NhienIn3d

> Phiên bản hiện tại: **v2.14.0** — 30/08/2026

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


## Giao diện dựng lại theo bố cục CineBooking Pro

Bản source v2.14.0 tiếp tục dùng **frontend layout** theo cấu trúc CineBooking Pro, giữ nguyên nghiệp vụ NhienIn3d và tách rõ quản lý **Sản phẩm** với **Kho** trong Admin:

- Dùng `RootLayout` chung với **header sticky**, vùng nội dung `max-w-7xl`, **footer dùng chung** và menu drawer responsive; không còn lặp navbar ở từng route.
- Bổ sung **Tailwind CSS 4 + `@tailwindcss/postcss`** giống lớp công nghệ frontend tham chiếu, đồng thời giữ toàn bộ CSS/logic nghiệp vụ cũ để tránh phá luồng sản phẩm, giỏ hàng, tài khoản và quản trị.
- Giữ Next.js App Router, React 19, Motion, Three.js/React Three Fiber/Drei, NestJS/Fastify, Prisma và PostgreSQL của NhienIn3d.
- Nền toàn site dùng đúng ảnh người dùng cung cấp tại `apps/web/public/backgrounds/nhienin3d-main.jpg`, phủ gradient tối nhẹ để chữ và panel vẫn dễ đọc.
- Các route hiện có (`/san-pham`, `/gio-hang`, `/thanh-toan`, `/dang-nhap`, `/tai-khoan`, `/quan-tri`...) giữ nguyên URL và luồng dữ liệu.

## Điểm chính bản hiện tại

- v2.14.0 tách tab **Sản phẩm** và **Kho**: Sản phẩm chỉ phụ trách thêm/sửa/xóa, ảnh và thông tin bán hàng; Kho chỉ phụ trách tồn kho/hiển thị từng biến thể.
- Admin có thể **chọn ảnh JPEG/PNG/WebP trực tiếp từ máy**. Frontend crop/căn giữa và chuẩn hóa ảnh thành **1000 × 800 (tỉ lệ 5:4)** trước khi lưu, đồng bộ đúng khung ảnh product card; ảnh tải lên được lưu cùng dữ liệu sản phẩm trong PostgreSQL dưới dạng data URL nên không phụ thuộc đường dẫn file tạm trên máy người dùng.
- Hai sản phẩm `N3D-ORG-011` và `N3D-MAKER-012` chuyển sang **ảnh chụp sản phẩm thật** từ trang tham khảo MakerWorld thay cho SVG minh họa v2.12.3.
- Seed sản phẩm/biến thể vẫn **bootstrap-only**: không ghi đè ảnh, giá, tồn kho, trạng thái hoặc nội dung Admin đã chỉnh; sản phẩm mẫu bị Admin xóa cũng không tự xuất hiện lại sau khi restart Docker/chạy seed.
- v2.12.0 bổ sung **Quản trị đơn hàng**: tìm kiếm/lọc, xem chi tiết, cập nhật trạng thái theo luồng hợp lệ và xem lịch sử xử lý; khi hủy đơn hệ thống hoàn tồn kho các biến thể có mã được lưu trong `tuy_chon`.
- v2.12.0 bổ sung **Quản trị sản phẩm & tồn kho** ở mức cơ bản: sửa tên, mô tả ngắn, giá bán, trạng thái sản phẩm; sửa tồn kho và bật/tắt hiển thị từng biến thể.
- v2.12.1 tinh gọn tab **Sản phẩm & kho**: danh sách sản phẩm chuyển thành **ô chọn xổ xuống**, chỉ hiển thị một sản phẩm được chọn để chỉnh sửa; tìm kiếm vẫn lọc danh sách lựa chọn.
- v2.12.2 chuẩn hóa storefront thành **6 sản phẩm mỗi hàng trên desktop** và bổ sung đủ **12 sản phẩm mẫu**, nhờ đó danh sách mặc định hiển thị trọn **2 hàng × 6 sản phẩm**.
- v2.12.0 bổ sung tab **Nhật ký Admin** lấy 200 sự kiện `ADMIN_*` gần nhất. Các thao tác khách hàng, nhân viên, ca làm, phân ca, đơn hàng, sản phẩm và tồn kho đều có audit trail trong `nhat_ky_bao_mat`.
- Migration `202608300004_v212_quan_tri_don_hang_audit` tạo bảng `lich_su_don_hang`, backfill mốc đầu tiên cho đơn hiện có và checkout mới tự ghi lịch sử ngay khi tạo đơn.
- Giữ Dashboard v2.11.0: doanh thu hôm nay/7 ngày/30 ngày, số đơn theo kỳ, giá trị đơn trung bình, khách hàng mới, biểu đồ doanh thu 7 ngày, top sản phẩm, tồn kho thấp và đơn gần nhất.
- v2.10.0 cho phép **chỉnh sửa/xóa phân ca đã xếp** ngay trên lịch: đổi nhân viên, ngày làm, mẫu ca, ghi chú; mỗi dòng lịch có nút **Chỉnh sửa** và **Xóa**.
- v2.10.1 tách **Khách hàng** và **Nhân viên bán hàng** thành hai khu quản trị riêng; khách hàng được sửa họ tên/email/SĐT/địa chỉ, đồng thời ca làm và phân ca chuyển sang endpoint POST cập nhật ổn định và xác minh lại PostgreSQL sau khi lưu.
- v2.10.2 sửa lỗi **Lưu thay đổi hồ sơ/địa chỉ** và **Đổi mật khẩu** báo `Failed to fetch`: Fastify CORS cho phép tường minh `GET/HEAD/POST/PUT/PATCH/DELETE/OPTIONS`, frontend tài khoản chuyển hai thao tác này sang POST alias ổn định; PATCH cũ vẫn giữ tương thích.
- Seed Admin không còn có nhánh nào reset `ADMIN_PASSWORD` lên tài khoản đã tồn tại; mật khẩu môi trường chỉ được dùng đúng lúc bootstrap tài khoản Admin lần đầu.
- Mẫu ca đã có phân công vẫn **chỉnh sửa được**; tên/giờ/màu mới áp dụng tức thời cho các phân ca đang tham chiếu. Xóa mẫu ca sẽ xóa kèm các phân ca liên quan trong transaction.
- Các thao tác xóa mẫu ca/phân ca trên web dùng endpoint `POST .../:id/xoa` có JSON body để ổn định với Fastify/proxy; endpoint `DELETE` vẫn giữ cho tương thích API.
- Đã bỏ nhãn **STAFF OPERATIONS** khỏi cả màn hình Ca làm và Xếp ca.
- Bỏ dòng kicker `NHIENIN3D · ADMIN` phía trên tiêu đề Admin Dashboard để giao diện gọn hơn.
- Chuẩn hóa lịch làm việc mặc định còn **2 ca**: `CA01 · Ca sáng · 06:00–14:00` và `CA02 · Ca chiều · 14:00–22:00`. Migration v2.9.9 gom các mẫu ca cũ về hai khung này và giữ phân ca cũ hợp lệ.
- Admin có thể **chỉnh sửa** mã ca, tên ca, giờ bắt đầu/kết thúc, màu hiển thị; có thể **xóa ca** trực tiếp trong tab Ca làm. Khi xóa ca, các phân ca đang tham chiếu ca đó được xóa cùng trong transaction để không bị lỗi khóa ngoại.
- Seed ca/phân ca chuyển sang **bootstrap-only**. Sau khi Admin chỉnh sửa hoặc xóa, chạy Docker/seed lại sẽ không tạo lại ca đã xóa hay ghi đè giờ ca đã chỉnh.
- Kiểm tra dữ liệu không còn ép `nguoi_dung`, `nhan_vien`, `ca_lam_viec`, `phan_ca` phải luôn >= 10 vì đây là dữ liệu vận hành được phép xóa/chỉnh; các bảng dữ liệu mẫu tĩnh vẫn giữ yêu cầu tối thiểu.
- Đổi nền nút **Giỏ hàng** trên thanh điều hướng từ trắng sang **dark glass xanh đen** đồng bộ với nút Tài khoản/CineBooking Pro; badge số lượng dùng gradient tím → cyan và có hover viền tím nhẹ.
- Sửa dứt điểm luồng **Lưu thay đổi** tại `/tai-khoan`: `PATCH /tai-khoan/ho-so` ghi và đọc lại dữ liệu trong **cùng transaction PostgreSQL**; frontend dùng trực tiếp phản hồi vừa commit và **không GET lại ngay sau khi lưu**, tránh state cũ ghi đè họ tên/email/số điện thoại/địa chỉ mới.
- Tăng kích thước toàn bộ form CineBooking: input/select/textarea tối thiểu khoảng 46–48px, chữ nhập 14–15px, label 13–14px, button 14px; card Tài khoản, Đăng nhập/Đăng ký, Quản trị, Ca làm và Xếp ca đều rộng/dễ đọc hơn.
- Sửa xóa tài khoản Admin bằng endpoint ghi an toàn `POST /api/v1/quan-tri/nguoi-dung/:id/xoa` có JSON body; vẫn giữ `DELETE /api/v1/quan-tri/nguoi-dung/:id` để tương thích. Backend dọn tường minh session/reset token/địa chỉ/hồ sơ nhân viên/phân ca và đặt liên kết đơn hàng/giỏ hàng về `NULL` trước khi xóa.
- Hồ sơ nhân sự chỉ còn **Nhân viên bán hàng**. Chức danh cố định `Nhân viên bán hàng`, bộ phận cố định `Bán hàng`; Admin chỉ đổi trạng thái `Đang làm / Tạm nghỉ / Nghỉ việc`.
- Khi Admin đổi trạng thái nhân viên: `Đang làm` tự kích hoạt tài khoản + reset lockout; `Tạm nghỉ`/`Nghỉ việc` tự khóa tài khoản và thu hồi phiên đăng nhập.
- Form **Tạo nhân viên bán hàng** làm lại theo bố cục CineBooking Pro dạng một card lớn căn giữa, có mã nhân viên/ngày vào làm/họ tên/email/SĐT/mật khẩu/xác nhận mật khẩu. Không còn panel phân quyền, không còn chọn vai trò, chức danh hay bộ phận.
- Hệ thống hiện hành chỉ còn ba vai trò: `ADMIN`, `NHAN_VIEN`, `KHACH_HANG`. `ADMIN` là quyền quản trị duy nhất và có toàn quyền hệ thống; `NHAN_VIEN` là nhân viên bán hàng.
- Migration `202608300002_v295_nhan_vien_ban_hang` chuyển `QUAN_LY` legacy về `KHACH_HANG`, giữ `ADMIN`, đồng bộ mọi tài khoản có hồ sơ nhân viên thành `NHAN_VIEN`, và chuẩn hóa dữ liệu nhân sự cũ thành `Nhân viên bán hàng / Bán hàng`.
- Seed mới giữ cơ chế **bootstrap-only**: dữ liệu người dùng đã sửa, trạng thái tài khoản và trạng thái nhân viên không bị reset khi chạy Docker lại. 10 hồ sơ nhân viên mẫu đều được chuẩn hóa thành nhân viên bán hàng.
- Giữ thay đổi v2.9.1: trang chi tiết sản phẩm không yêu cầu chọn màu; tự dùng biến thể mặc định còn hàng.
- Giữ nền 3D tại `apps/web/public/backgrounds/nhienin3d-main.jpg` và toàn bộ luồng JWT/HttpOnly cookie, Argon2id, SMTP, giỏ hàng, thanh toán, ca làm, xếp ca hiện có.

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
.\scripts\release.ps1 v2.9.1
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

# Lộ trình tiếp theo

## v2.15.0

- CRUD danh mục và quản lý biến thể nâng cao (vật liệu/màu/mã biến thể).
- Duyệt/ẩn đánh giá sản phẩm trong Admin.
- Xuất báo cáo đơn hàng/doanh thu/tồn kho theo CSV.
- Mở rộng regression test/E2E cho luồng quản trị thương mại điện tử.

## v3.0.0

- CRUD quản trị mở rộng cho sản phẩm/danh mục/tồn kho/đơn hàng.
- MFA/TOTP cho quản trị.
- Audit nâng cao.
- Backup/restore.
- Security hardening và E2E regression.
