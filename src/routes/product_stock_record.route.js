import { Router } from "express";
import {
  create_product_stock_record,
  edit_product_stock_record,
  get_stock_record,
} from "../controllers/product_stock_record.controller.js";

const router = Router();

router.post("/product_stock_record/:id", create_product_stock_record);

router.put("/edit_product_stock_record/:id", edit_product_stock_record);

router.get("/get_stock_record", get_stock_record);

export default router;
