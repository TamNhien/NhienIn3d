import { IsEmail } from "class-validator";

export class QuenMatKhauDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  thu_dien_tu!: string;
}
