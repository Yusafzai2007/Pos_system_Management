import { Router } from "express";
import {
  create_barcode,
  delete_barcode,
  get_all_barcodes,
} from "../controllers/product_barcode.controller.js";

const route = Router();

route.post("/product_barcode/:id", create_barcode);

route.get("/product_barcodes", get_all_barcodes);

route.delete("/delete_product_barcode/:id", delete_barcode);

export default route;
