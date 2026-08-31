import { IsString, MaxLength } from "class-validator";

export class KiemTraTepNhapKhoDto {
  @IsString() @MaxLength(180)
  ten_file!: string;

  @IsString() @MaxLength(2800000)
  du_lieu_base64!: string;
}
