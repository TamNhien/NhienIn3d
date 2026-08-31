import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CapNhatDanhMucDto {
  @IsOptional() @IsString() @Length(2, 150)
  ten_danh_muc?: string;

  @IsOptional() @IsString() @Length(0, 1000)
  mo_ta?: string;

  @IsOptional() @IsInt() @Min(0) @Max(9999)
  thu_tu?: number;

  @IsOptional() @IsBoolean()
  dang_hien_thi?: boolean;
}
