import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";

export class CapNhatSanPhamQuanTriDto {
  @IsOptional() @IsString() @Length(2, 200)
  ten_san_pham?: string;

  @IsOptional() @IsString() @Length(0, 700)
  mo_ta_ngan?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  gia_ban?: number;

  @IsOptional() @IsIn(["NHAP", "DANG_BAN", "TAM_AN", "NGUNG_BAN"])
  trang_thai?: "NHAP" | "DANG_BAN" | "TAM_AN" | "NGUNG_BAN";
}
