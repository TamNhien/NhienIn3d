import { IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";

export class DatHangDto {
  @IsString()
  @MinLength(16)
  ma_gio_hang!: string;

  @IsString()
  @Length(2, 150)
  ho_ten_nguoi_nhan!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  so_dien_thoai!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(500)
  dia_chi_giao_hang!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  ma_phuong_thuc!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ghi_chu?: string;
}
