import { Type } from "class-transformer";
import { IsInt, IsString, Length, Max, Min } from "class-validator";

export class LuuDanhGiaDto {
  @IsString()
  @Length(16, 120)
  ma_phien!: string;

  @IsString()
  @Length(2, 120)
  ho_ten!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  so_sao!: number;

  @IsString()
  @Length(10, 1500)
  noi_dung!: string;
}
