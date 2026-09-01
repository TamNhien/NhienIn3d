import { IsOptional, IsString, MaxLength } from "class-validator";

export class CapNhatSuCoVanHanhDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ghi_chu?: string;
}
