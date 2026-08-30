import { IsEmail, IsOptional, IsString, Length, MinLength } from "class-validator";
export class DangNhapDto {
  @IsEmail({}, { message: "Email không hợp lệ" }) thu_dien_tu!: string;
  @IsString() @MinLength(8, { message: "Mật khẩu tối thiểu 8 ký tự" }) mat_khau!: string;
  @IsOptional() @IsString() @Length(2, 160) trinh_duyet_hien_thi?: string;
}
