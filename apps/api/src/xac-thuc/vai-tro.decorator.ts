import { SetMetadata } from "@nestjs/common";
import { VaiTro } from "../generated/prisma/client.js";

export const KHOA_VAI_TRO = "nhienin3d_vai_tro";
export const VaiTroChoPhep = (...vai_tro: VaiTro[]) => SetMetadata(KHOA_VAI_TRO, vai_tro);
