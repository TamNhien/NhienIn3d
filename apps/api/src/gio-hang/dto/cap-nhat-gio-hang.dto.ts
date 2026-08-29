import { IsInt, Max, Min } from "class-validator";

export class CapNhatGioHangDto {
  @IsInt()
  @Min(1)
  @Max(20)
  so_luong!: number;
}
