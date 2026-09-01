import { IsBoolean, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

export class CapNhatBaoTriHeThongDto {
  @IsBoolean()
  bat!: boolean;

  @IsOptional() @IsISO8601({ strict: true })
  bat_dau?: string;

  @IsOptional() @IsISO8601({ strict: true })
  ket_thuc?: string;

  @IsOptional() @IsString() @MaxLength(500)
  ly_do?: string;
}
