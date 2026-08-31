import { IsOptional, IsString, Length, Matches } from "class-validator";

export class CapNhatMauSacDto {
  @IsOptional() @IsString() @Length(2, 120)
  ten_mau?: string;

  @IsOptional() @IsString() @Matches(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/)
  ma_hex?: string;
}
