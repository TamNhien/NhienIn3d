import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class CapNhatCauHinhKhoDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(999)
  nguong_sap_het!: number;
}
