import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from "class-validator";

export class CapNhatSanPhamQuanTriDto {
  @IsOptional() @IsString() @Length(2, 200)
  ten_san_pham?: string;

  @IsOptional() @IsUUID()
  danh_muc_id?: string;

  @IsOptional() @IsString() @Length(0, 700)
  mo_ta_ngan?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  gia_ban?: number;

  @IsOptional() @IsString() @MaxLength(120)
  kich_thuoc?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  khoi_luong_gam?: number;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  thoi_gian_in_gio?: number;

  @IsOptional() @IsIn(["NHAP", "DANG_BAN", "TAM_AN", "NGUNG_BAN"])
  trang_thai?: "NHAP" | "DANG_BAN" | "TAM_AN" | "NGUNG_BAN";

  @IsOptional() @IsString() @MaxLength(1800000)
  anh_chinh_data_url?: string;
}
