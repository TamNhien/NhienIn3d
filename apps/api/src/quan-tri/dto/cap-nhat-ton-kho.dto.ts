import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class CapNhatTonKhoDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(1000000)
  so_luong_ton!: number;

  @IsOptional() @IsBoolean()
  dang_hien_thi?: boolean;
}
