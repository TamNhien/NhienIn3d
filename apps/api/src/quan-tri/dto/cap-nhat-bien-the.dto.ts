import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min } from "class-validator";

export class CapNhatBienTheDto {
  @IsOptional() @IsString() @Length(3, 80)
  ma_bien_the?: string;

  @IsOptional() @IsUUID()
  vat_lieu_id?: string | null;

  @IsOptional() @IsUUID()
  mau_sac_id?: string | null;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 })
  gia_chenh_lech?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1000000)
  so_luong_ton?: number;

  @IsOptional() @IsBoolean()
  dang_hien_thi?: boolean;

  @IsOptional() @IsString() @MaxLength(300)
  ly_do_ton_kho?: string;
}
