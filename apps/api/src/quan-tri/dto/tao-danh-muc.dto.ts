import { IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from "class-validator";

export class TaoDanhMucDto {
  @IsString() @Length(2, 50) @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
  ma_danh_muc!: string;

  @IsString() @Length(2, 150)
  ten_danh_muc!: string;

  @IsOptional() @IsString() @Length(0, 1000)
  mo_ta?: string;

  @IsOptional() @IsInt() @Min(0) @Max(9999)
  thu_tu?: number;

  @IsOptional() @IsBoolean()
  dang_hien_thi?: boolean;
}
