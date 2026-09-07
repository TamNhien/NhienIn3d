import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateIf } from "class-validator";

export class TaoNhaCungCapDto {
  @IsString() @Length(2, 50) @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
  ma_nha_cung_cap!: string;

  @IsString() @Length(2, 180)
  ten_nha_cung_cap!: string;

  @IsOptional() @IsString() @MaxLength(120)
  nguoi_lien_he?: string;

  @IsOptional() @IsString() @MaxLength(30)
  so_dien_thoai?: string;

  @IsOptional() @ValidateIf((_o, value) => value !== "") @IsEmail() @MaxLength(190)
  thu_dien_tu?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  dia_chi?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  ghi_chu?: string;

  @IsOptional() @IsBoolean()
  dang_hoat_dong?: boolean;

  @IsOptional() @IsInt() @Min(1) @Max(180)
  thoi_gian_giao_hang_ngay?: number;
}
