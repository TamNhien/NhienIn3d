import { IsInt, IsString, Max, Min } from "class-validator";

export class ThemVaoGioHangDto {
  @IsString()
  ma_bien_the!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  so_luong!: number;
}
