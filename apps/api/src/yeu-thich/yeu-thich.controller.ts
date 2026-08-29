import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { YeuThichService } from "./yeu-thich.service.js";

@ApiTags("Yêu thích")
@Controller("yeu-thich")
export class YeuThichController {
  constructor(private readonly service: YeuThichService) {}

  @Get(":ma_phien")
  danh_sach(@Param("ma_phien") ma_phien: string) { return this.service.danhSach(ma_phien); }

  @Post(":ma_phien/:ma_san_pham")
  them(@Param("ma_phien") ma_phien: string, @Param("ma_san_pham") ma_san_pham: string) {
    return this.service.them(ma_phien, ma_san_pham);
  }

  @Delete(":ma_phien/:ma_san_pham")
  xoa(@Param("ma_phien") ma_phien: string, @Param("ma_san_pham") ma_san_pham: string) {
    return this.service.xoa(ma_phien, ma_san_pham);
  }
}
