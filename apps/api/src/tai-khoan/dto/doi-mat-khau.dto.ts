import { IsString, Matches, MinLength } from "class-validator";

export class DoiMatKhauDto {
  @IsString()
  @MinLength(8, { message: "Mật khẩu hiện tại không hợp lệ" })
  mat_khau_hien_tai!: string;

  @IsString()
  @MinLength(12, { message: "Mật khẩu mới tối thiểu 12 ký tự" })
  @Matches(/[a-z]/, { message: "Mật khẩu mới cần ít nhất một chữ thường" })
  @Matches(/[A-Z]/, { message: "Mật khẩu mới cần ít nhất một chữ hoa" })
  @Matches(/[0-9]/, { message: "Mật khẩu mới cần ít nhất một chữ số" })
  @Matches(/[^A-Za-z0-9]/, { message: "Mật khẩu mới cần ít nhất một ký tự đặc biệt" })
  mat_khau_moi!: string;
}
