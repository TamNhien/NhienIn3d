import { IsOptional, IsString, Length, Matches } from "class-validator";

export class TaoCaLamDto {
  @IsString() @Length(2, 40) ma_ca!: string;
  @IsString() @Length(2, 120) ten_ca!: string;
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) gio_bat_dau!: string;
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) gio_ket_thuc!: string;
  @IsOptional() @IsString() @Matches(/^#[0-9A-Fa-f]{6}$/) mau_hien_thi?: string;
}
