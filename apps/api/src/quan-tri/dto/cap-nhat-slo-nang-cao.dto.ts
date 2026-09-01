import { IsArray, IsObject } from "class-validator";

export class CapNhatSloNangCaoDto {
  @IsArray()
  burn_windows!: Array<Record<string, unknown>>;

  @IsObject()
  service_targets!: Record<string, unknown>;
}
