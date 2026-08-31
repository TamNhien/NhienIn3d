import { IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CapNhatVatLieuDto {
  @IsOptional() @IsString() @Length(2, 120)
  ten_vat_lieu?: string;

  @IsOptional() @IsString() @Length(0, 1000)
  mo_ta?: string;

  @IsOptional() @IsNumber() @Min(0.1) @Max(10)
  he_so_gia?: number;
}
