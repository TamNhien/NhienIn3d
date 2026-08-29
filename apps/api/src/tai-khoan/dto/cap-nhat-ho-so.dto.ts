import { IsOptional, IsString, Length, Matches, ValidateIf } from "class-validator";

export class CapNhatHoSoDto {
  @IsOptional()
  @IsString()
  @Length(2, 150, { message: "Họ tên phải từ 2 đến 150 ký tự" })
  ho_ten?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_o, value) => value !== "")
  @Matches(/^[0-9+()\-\s]{8,30}$/, { message: "Số điện thoại không hợp lệ" })
  so_dien_thoai?: string;
}
