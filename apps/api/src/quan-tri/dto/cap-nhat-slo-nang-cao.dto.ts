import { IsArray, IsObject, IsOptional } from "class-validator";

export class CapNhatSloNangCaoDto {
  @IsArray()
  burn_windows!: Array<Record<string, unknown>>;

  @IsObject()
  service_targets!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  endpoint_checks?: Array<Record<string, unknown>>;
}
