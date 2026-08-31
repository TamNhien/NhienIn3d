import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";

export class TaoBienTheDto {
  @IsString() @Length(3, 80)
  ma_bien_the!: string;

  @IsOptional() @IsUUID()
  vat_lieu_id?: string;

  @IsOptional() @IsUUID()
  mau_sac_id?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 })
  gia_chenh_lech?: number;

  @Type(() => Number) @IsInt() @Min(0) @Max(1000000)
  so_luong_ton!: number;

  @IsOptional() @IsBoolean()
  dang_hien_thi?: boolean;
}
