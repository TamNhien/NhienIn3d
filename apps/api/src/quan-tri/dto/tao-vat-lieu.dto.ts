import { IsNumber, IsOptional, IsString, Length, Matches, Max, Min } from "class-validator";

export class TaoVatLieuDto {
  @IsString() @Length(2, 40) @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
  ma_vat_lieu!: string;

  @IsString() @Length(2, 120)
  ten_vat_lieu!: string;

  @IsOptional() @IsString() @Length(0, 1000)
  mo_ta?: string;

  @IsOptional() @IsNumber() @Min(0.1) @Max(10)
  he_so_gia?: number;
}
