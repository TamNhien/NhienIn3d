import { IsString, Matches, MinLength } from "class-validator";

export class DatLaiMatKhauDto {
  @IsString()
  @MinLength(32, { message: "Mã đặt lại mật khẩu không hợp lệ" })
  ma!: string;

  @IsString()
  @MinLength(12, { message: "Mật khẩu tối thiểu 12 ký tự" })
  @Matches(/[a-z]/, { message: "Mật khẩu cần ít nhất một chữ thường" })
  @Matches(/[A-Z]/, { message: "Mật khẩu cần ít nhất một chữ hoa" })
  @Matches(/[0-9]/, { message: "Mật khẩu cần ít nhất một chữ số" })
  @Matches(/[^A-Za-z0-9]/, { message: "Mật khẩu cần ít nhất một ký tự đặc biệt" })
  mat_khau_moi!: string;
}
