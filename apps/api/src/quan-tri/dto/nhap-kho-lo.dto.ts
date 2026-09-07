import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, ValidateNested } from "class-validator";

export class DongNhapKhoDto {
  @IsString() @Length(3, 80)
  ma_bien_the!: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(1000000)
  so_luong_nhap!: number;

  @IsOptional() @IsString() @MaxLength(300)
  ly_do?: string;
}

export class NhapKhoLoDto {
  @IsOptional() @IsString() @MaxLength(80)
  ma_lo?: string;

  @IsOptional() @IsUUID()
  nha_cung_cap_id?: string;

  @IsOptional() @IsString() @MaxLength(180)
  nha_cung_cap?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  ghi_chu?: string;

  @IsOptional() @IsUUID()
  don_mua_hang_id?: string;

  @IsOptional() @IsBoolean()
  cho_phep_vuot_don_mua?: boolean;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500)
  @ValidateNested({ each: true }) @Type(() => DongNhapKhoDto)
  dong!: DongNhapKhoDto[];
}
