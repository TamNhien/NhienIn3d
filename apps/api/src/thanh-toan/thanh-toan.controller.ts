import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DatHangDto } from "./dto/dat-hang.dto.js";
import { ThanhToanService } from "./thanh-toan.service.js";

@ApiTags("Thanh toán")
@Controller("thanh-toan")
export class ThanhToanController {
  constructor(private readonly service: ThanhToanService) {}

  @Get("phuong-thuc")
  phuong_thuc() { return this.service.phuongThuc(); }

  @Post("dat-hang")
  dat_hang(@Body() dto: DatHangDto) { return this.service.datHang(dto); }
}
