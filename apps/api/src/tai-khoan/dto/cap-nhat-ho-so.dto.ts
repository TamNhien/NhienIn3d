import { IsEmail, IsOptional, IsString, Length, Matches, ValidateIf } from "class-validator";

export class CapNhatHoSoDto {
  @IsOptional()
  @IsEmail({}, { message: "Email không hợp lệ" })
  @Length(5, 255)
  thu_dien_tu?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150, { message: "Họ tên phải từ 2 đến 150 ký tự" })
  ho_ten?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_o, value) => value !== "")
  @Matches(/^[0-9+()\-\s]{8,30}$/, { message: "Số điện thoại không hợp lệ" })
  so_dien_thoai?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: "Địa chỉ tối đa 500 ký tự" })
  dia_chi?: string;
}
