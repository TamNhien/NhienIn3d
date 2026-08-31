import { IsString, Length, Matches } from "class-validator";

export class TaoMauSacDto {
  @IsString() @Length(2, 40) @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
  ma_mau!: string;

  @IsString() @Length(2, 120)
  ten_mau!: string;

  @IsString() @Matches(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/)
  ma_hex!: string;
}
