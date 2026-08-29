import { IsEmail, IsString, Length, Matches, MinLength } from "class-validator";

export class DangKyDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  thu_dien_tu!: string;

  @IsString()
  @Length(2, 150, { message: "Họ tên phải từ 2 đến 150 ký tự" })
  ho_ten!: string;

  @IsString()
  @MinLength(12, { message: "Mật khẩu tối thiểu 12 ký tự" })
  @Matches(/[a-z]/, { message: "Mật khẩu cần ít nhất một chữ thường" })
  @Matches(/[A-Z]/, { message: "Mật khẩu cần ít nhất một chữ hoa" })
  @Matches(/[0-9]/, { message: "Mật khẩu cần ít nhất một chữ số" })
  @Matches(/[^A-Za-z0-9]/, { message: "Mật khẩu cần ít nhất một ký tự đặc biệt" })
  mat_khau!: string;
}
