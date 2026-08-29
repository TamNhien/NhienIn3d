import { Controller, Get } from "@nestjs/common";
import { CoSoDuLieuService } from "../co-so-du-lieu/co-so-du-lieu.service.js";
@Controller("danh-muc")
export class DanhMucController {
  constructor(private readonly db: CoSoDuLieuService) {}
  @Get() danh_sach() { return this.db.danhMuc.findMany({ where: { dang_hien_thi: true }, orderBy: [{ thu_tu: "asc" }, { ten_danh_muc: "asc" }] }); }
}
