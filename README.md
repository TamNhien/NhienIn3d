# NhienIn3d

> Phiên bản hiện tại: **v3.3.0** — 31/08/2026

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

- v3.3.0 mở rộng audit diff cho **danh mục, vật liệu, màu sắc, ca làm và phân ca**; tab Nhật ký Admin có thêm bộ lọc theo người thao tác và vẫn xuất CSV/Excel theo đúng bộ lọc.
- Tab **Hệ thống** bổ sung thống kê vận hành 7/30 ngày: tỷ lệ health tốt, backup/restore thành công và số lần gửi cảnh báo; lịch sử vận hành có nút **Xuất Excel**.
- Cảnh báo vận hành dùng chính sách **silence + escalation**: cùng một sự cố được im lặng theo `SYSTEM_HEALTH_ALERT_SILENCE_MINUTES`, sau đó chỉ gửi lại khi đạt cấp escalation mới theo `SYSTEM_HEALTH_ALERT_ESCALATION_MINUTES`, tránh spam nhưng vẫn nhắc khi sự cố kéo dài.
- Migration `202608310007_v330_audit_ops_indexes` bổ sung index composite cho audit/đơn hàng/lịch sử vận hành để giữ truy vấn ổn định khi dữ liệu tăng. CI có thêm job Docker runtime chạy migration + API health + backup/restore cô lập.

- v3.2.3 sửa lỗi `npm run typecheck` ở optimistic order UI: `AdminDonHangChiTiet` không còn kế thừa đồng thời `thanh_toan` dạng object tóm tắt và array chi tiết; tách type thanh toán tóm tắt/chi tiết và dùng `Omit<AdminDonHang, "thanh_toan">` để model đúng dữ liệu API.

- v3.2.2 sửa form **Cập nhật trạng thái** bị chồng field và chuyển thao tác xác nhận đơn sang optimistic UI: badge/trạng thái phản hồi ngay, rollback khi API lỗi, các refresh Dashboard/Sản phẩm/Nhật ký chạy nền không giữ nút `Đang lưu...`.

- v3.2.1 sửa các lỗi `npm run typecheck` của v3.2.0 ở Prisma JSON audit/operation history: chuẩn hóa `chi_tiet` về `Prisma.InputJsonObject`, diff trước/sau có kiểu JSON tương thích Prisma và tách hai nhánh truy vấn audit phân trang để TypeScript không suy luận literal `take: 5000` sai kiểu.
- Admin có thể chọn **Đã giao / hoàn tất** trực tiếp từ mọi trạng thái đơn hàng, kể cả đơn đang chờ xác nhận, đã xác nhận, đang sản xuất hoặc đã hủy. Các chuyển trạng thái khác vẫn giữ quy trình tuyến tính. Khi khôi phục đơn đã hủy sang hoàn tất, hệ thống trừ lại phần tồn kho đã hoàn trước đó và chặn nếu không đủ tồn; giao dịch còn `CHO_THANH_TOAN` tiếp tục được chốt `DA_THANH_TOAN` và ghi nhận doanh thu theo logic hiện có.
- Giao diện Đơn hàng hiển thị tùy chọn **Đã giao / hoàn tất** cho mọi đơn chưa hoàn tất và có ghi chú rõ quyền xác nhận trực tiếp của Admin. Không có migration database mới ở v3.2.1.
- v3.2.0 sửa lỗi release khi nâng cấp theo kiểu **chép source mới đè lên thư mục cũ**: `scripts/don-dep-legacy.mjs` chủ động xóa hai file MFA v3.0.x còn sót trước khi chạy test, nên regression “MFA runtime phải được gỡ” không còn fail vì file legacy ngoài gói source.
- Giao diện **Nhà cung cấp** làm gọn checkbox `Đang hoạt động`: checkbox 16px, nhãn một dòng, không còn khối tick lớn chiếm gần hết cột như style checkbox dùng chung.
- Nhật ký Admin v3.2.0 có **phân trang phía server**, bộ lọc dữ liệu lớn, hiển thị diff `trước → sau` cho các thao tác nhạy cảm và xuất Excel bên cạnh CSV. Diff đã được thêm cho cập nhật khách hàng/người dùng, nhà cung cấp, sản phẩm, biến thể, tồn kho và trạng thái đơn hàng/thanh toán.
- Thêm bảng `lich_su_van_hanh` và tab **Hệ thống** mở rộng: lưu health check, kết quả backup/restore và email cảnh báo; có lọc loại/trạng thái + phân trang trực tiếp trong Admin.
- Cảnh báo vận hành qua email dùng `SYSTEM_HEALTH_EMAIL_*`: theo dõi PostgreSQL mất kết nối, backup quá hạn/chưa có backup và SMTP lỗi; chống gửi lặp theo chữ ký tập vấn đề.
- `backup-db.ps1`/`restore-db.ps1` ghi kết quả thành công/thất bại vào PostgreSQL theo cơ chế best-effort. Thêm `scripts/e2e-runtime-v320.ps1` kiểm tra runtime backup → SHA-256 → restore trên **database tạm cô lập**, không ghi đè database vận hành.
- v3.1.0 **loại bỏ hoàn toàn MFA/TOTP khỏi runtime** theo yêu cầu: đăng nhập quay về một bước email + mật khẩu, không còn challenge 6 số, setup key, route MFA, biến `MFA_ENCRYPTION_KEY` hay tab Bảo mật. Migration `202608310005_v310_remove_mfa_system_health` xóa ba cột MFA khỏi `nguoi_dung`; migration v3.0.0 vẫn được giữ nguyên trong lịch sử để các database nâng cấp tuần tự an toàn.
- Admin có tab **Hệ thống** mới hiển thị sức khỏe API, PostgreSQL, SMTP, backup gần nhất và lịch cảnh báo tồn kho. API chỉ đọc thư mục `backups/` qua volume read-only, không expose password SMTP hay secret cấu hình.
- Backup PostgreSQL được nâng thành cơ chế vận hành thực tế: daily backup, snapshot weekly vào Chủ nhật, retention 14 ngày/8 tuần, SHA-256 sidecar, script kiểm tra toàn bộ checksum và script Windows Scheduled Task chạy tự động lúc 02:00. Restore vẫn bắt buộc `-XacNhan`.
- v2.19.3 hợp nhất Docker local theo **HTTPS mặc định**: `docker compose up -d --build` giờ khởi động Caddy cùng stack, Web chỉ `expose` cổng 3000 nội bộ và **chỉ Caddy bind `127.0.0.1:3000`**, loại bỏ lỗi `Bind for 127.0.0.1:3000 failed: port is already allocated` khi chuyển qua lại giữa compose thường và HTTPS.
- Frontend Docker dùng API cùng origin `/api/v1`, tránh mixed-content; `WEB_PUBLIC_URL` mặc định chuyển sang `https://localhost:3000`. `docker-compose.https.yml` được đồng bộ cùng topology để file cũ không còn tạo orphan `nhienin3d-https`.
- `scripts/https-local.ps1` chạy `docker compose up -d --build --remove-orphans`, tự dọn service legacy/orphan, cài CA CurrentUser như trước và báo lệnh kiểm tra cổng khi 3000 bị một chương trình ngoài Docker chiếm.
- v2.19.0 bổ sung **quản lý nhà cung cấp** đầy đủ trong Admin, liên kết nhà cung cấp với phiếu nhập/lô hàng và chặn xóa nhà cung cấp đã có lịch sử nhập kho; có thể chuyển sang trạng thái ngừng hoạt động để giữ nguyên dữ liệu đối soát.
- Lịch sử **phiếu nhập kho** hỗ trợ tìm kiếm/lọc theo nhà cung cấp và khoảng ngày, xem chi tiết từng dòng tồn trước → tồn sau, đồng thời xuất Excel để đối soát.
- Mỗi biến thể có **tồn tối thiểu/tối đa**; Kho tự xác định biến thể cần nhập và tính **gợi ý số lượng cần nhập = tồn tối đa - tồn hiện tại** khi tồn chạm ngưỡng tối thiểu. Báo cáo tồn kho Excel/CSV cũng mang theo định mức và gợi ý nhập.
- v2.18.3 bổ sung **HTTPS local được Windows/Chromium tin cậy** cho `localhost:3000`: Caddy reverse proxy TLS cùng origin cho Web + `/api/*`, script PowerShell tự lấy CA nội bộ và cài vào Trusted Root của `CurrentUser`, loại bỏ cảnh báo “Kết nối không an toàn” khi chạy đúng chế độ HTTPS.
- v2.18.2 làm rõ danh sách xổ xuống **Vật liệu/Màu** trong Admin: nền tối tương phản cao, chữ lớn hơn, mục đang chọn nổi bật và option hiển thị cả mã + tên; đồng thời giữ toàn bộ logo/favicon thương hiệu từ v2.18.1.
- v2.18.1 bổ sung **logo NhienIn3d** đồng bộ trên favicon/tab trình duyệt, thanh điều hướng, menu drawer và footer; logo khối 3D dùng SVG local nên sắc nét ở mọi DPI và không cần tải tài nguyên ngoài.
- v2.18.0 bổ sung **nhập kho nhanh theo lô**: Admin có thể chọn CSV/XLSX, xem trước và kiểm tra toàn bộ mã biến thể/số lượng/lỗi trùng trước khi ghi; chỉ khi tất cả dòng hợp lệ mới cho phép xác nhận nhập kho trong một transaction.
- Mỗi lần nhập lô tạo **phiếu nhập kho** và chi tiết tồn trước → tồn sau, mã lô/nhà cung cấp/ghi chú; lịch sử gần nhất hiển thị ngay trong tab Kho và audit liên kết theo mã phiếu.
- Cảnh báo tồn kho qua email có thể chạy theo lịch bằng `LOW_STOCK_EMAIL_*`; hệ thống lưu chữ ký trạng thái trong `cau_hinh_he_thong` để **không gửi lặp** khi danh sách tồn thấp chưa thay đổi, đồng thời Admin có nút kiểm tra/gửi ngay.
- v2.17.1 sửa form **Tạo biến thể mới** trong tab Kho: chia lại grid desktop 4 cột, field co đúng chiều rộng, nhãn không bị che và responsive 2/1 cột để không còn hiện tượng chữ/ô nhập chồng lên nhau.
- v2.17.0 bổ sung **cảnh báo tồn kho theo ngưỡng cấu hình**: Admin chỉnh ngưỡng ngay trong tab Kho, Dashboard cảnh báo số biến thể sắp hết/hết hàng; lịch sử kho phân loại Nhập/Xuất/Điều chỉnh, lưu nguyên nhân, chênh lệch và người thao tác.
- v2.16.0 bổ sung **CRUD Vật liệu & Màu sắc** trong Admin, chặn xóa dữ liệu tham chiếu đang được biến thể sử dụng; tab Kho có bộ lọc nâng cao theo tồn/vật liệu/màu/hiển thị và lịch sử điều chỉnh tồn gần nhất.
- v2.15.5 chỉnh thanh chức năng Admin để **mọi hàng tự giãn kín 100% chiều ngang**, không còn khoảng trống lớn bên phải khi các nút xuống hàng; desktop dùng flex-wrap có flex-grow, mobile chuyển dần về nút toàn hàng.
- v2.15.3 sửa lệch số liệu dashboard: số **đơn** nằm cạnh doanh thu giờ được đếm theo **ngày ghi nhận doanh thu/thanh toán**, không còn lấy ngày tạo đơn; đồng thời KPI tách rõ **đơn ghi nhận doanh thu** và **đơn mới phát sinh**.
- v2.15.2 sửa lỗi `npm run typecheck` tại `prisma/seed.ts` do kiểu `don_hang_map` thiếu trường `trang_thai`, đồng thời bổ sung xuất **Excel (.xlsx)** cho Đơn hàng/Doanh thu/Tồn kho và bỏ ghi chú nền ảnh khỏi footer.
- v2.15.1 sửa **ghi nhận doanh thu theo thanh toán**: non-COD đã thanh toán được cộng doanh thu ngay; COD chỉ cộng khi Admin xác nhận **Đã giao / hoàn tất**, lúc đó giao dịch tự chuyển sang `DA_THANH_TOAN`.
- v2.15.0 bổ sung **CRUD Danh mục**: tạo, sửa tên/mô tả/thứ tự/hiển thị và xóa danh mục trống; không cho xóa khi vẫn còn sản phẩm để tránh mất liên kết dữ liệu.
- Tab **Kho** được nâng thành quản lý biến thể đầy đủ: tạo/sửa/xóa mã biến thể, chọn vật liệu, màu sắc, giá chênh lệch, tồn kho và trạng thái hiển thị; sản phẩm luôn phải còn ít nhất một biến thể.
- Thêm tab **Đánh giá**: đánh giá mới ở trạng thái chờ duyệt; Admin có thể Duyệt, Ẩn hoặc Xóa. Storefront chỉ đọc đánh giá đã duyệt.
- Tab **Báo cáo** hỗ trợ song song **Excel (.xlsx)** và **CSV UTF-8** cho Đơn hàng, Doanh thu theo thời điểm ghi nhận thanh toán và snapshot Tồn kho. File XLSX được backend tạo trực tiếp, có header định dạng, freeze hàng đầu, auto-filter và độ rộng cột phù hợp; CSV vẫn có BOM để mở đúng tiếng Việt trong Excel.
- Các thao tác Danh mục/Biến thể/Đánh giá được ghi vào `nhat_ky_bao_mat` dưới nhóm sự kiện `ADMIN_*`.
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

# Lộ trình tiếp theo

## v3.4.0

- Thêm trang chi tiết sự cố vận hành theo chuỗi thời gian và nhóm cùng chữ ký cảnh báo.
- Cho Admin cấu hình ngưỡng/silence/escalation từ giao diện thay vì chỉ qua `.env`, có audit trước/sau.
- Bổ sung thống kê SLA/uptime theo ngày và biểu đồ 30/90 ngày.
- Tối ưu phân trang cursor cho audit/lịch sử vận hành khi dữ liệu vượt hàng trăm nghìn bản ghi.
- Mở rộng E2E Docker cho đăng nhập Admin, đơn hàng, nhập kho và xuất báo cáo.
---
