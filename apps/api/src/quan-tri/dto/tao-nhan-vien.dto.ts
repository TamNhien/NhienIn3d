import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from "class-validator";

export class TaoNhanVienDto {
  @IsEmail() thu_dien_tu!: string;
  @IsString() @Length(2, 150) ho_ten!: string;
  @IsOptional() @IsString() @Matches(/^[0-9+()\-\s]{8,30}$/) so_dien_thoai?: string;
  @IsString() @MinLength(12) @Matches(/[a-z]/) @Matches(/[A-Z]/) @Matches(/[0-9]/) @Matches(/[^A-Za-z0-9]/) mat_khau!: string;
  @IsString() @Length(3, 40) ma_nhan_vien!: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) ngay_vao_lam!: string;
}
