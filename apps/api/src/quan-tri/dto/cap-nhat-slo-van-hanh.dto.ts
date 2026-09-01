import { IsBoolean, IsNumber, Max, Min } from "class-validator";

export class CapNhatSloVanHanhDto {
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(90) @Max(100)
  sla_muc_tieu_percent!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(90) @Max(100)
  uptime_muc_tieu_percent!: number;

  @IsBoolean()
  canh_bao_xu_huong!: boolean;
}
