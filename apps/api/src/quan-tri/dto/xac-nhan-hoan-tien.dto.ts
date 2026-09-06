import { IsOptional, IsString, MaxLength } from "class-validator";

export class XacNhanHoanTienDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ghi_chu?: string;
}
