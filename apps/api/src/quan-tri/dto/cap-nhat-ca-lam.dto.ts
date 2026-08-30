import { IsBoolean, IsOptional, IsString, Length, Matches } from "class-validator";

export class CapNhatCaLamDto {
  @IsOptional() @IsString() @Length(2, 40) ma_ca?: string;
  @IsOptional() @IsString() @Length(2, 120) ten_ca?: string;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) gio_bat_dau?: string;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) gio_ket_thuc?: string;
  @IsOptional() @IsString() @Matches(/^#[0-9A-Fa-f]{6}$/) mau_hien_thi?: string;
  @IsOptional() @IsBoolean() dang_hoat_dong?: boolean;
}
