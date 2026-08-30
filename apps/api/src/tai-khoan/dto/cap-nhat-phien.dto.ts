import { IsString, Length } from "class-validator";

export class CapNhatPhienDto {
  @IsString()
  @Length(2, 160)
  trinh_duyet_hien_thi!: string;
}
