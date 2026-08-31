import { IsBoolean } from "class-validator";

export class CapNhatDanhGiaDto {
  @IsBoolean()
  da_duyet!: boolean;
}
