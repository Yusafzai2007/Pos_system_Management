import { Router } from "express";
import {
  create_stockOut_category,
  delete_stockOut_category,
  get_stockOut_categories,
  update_stockOut_category,
} from "../controllers/stockout_category.controller.js";

const router = Router();

router.post("/create_stockOut_category", create_stockOut_category);
router.put("/update_stockOut_category/:id", update_stockOut_category);
router.delete("/delete_stockOut_category/:id", delete_stockOut_category);
router.get("/get_stockOut_categories", get_stockOut_categories);



export default router;
