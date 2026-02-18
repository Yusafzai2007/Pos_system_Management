import { Router } from "express";
import {
  create_stockOut,
  update_stockOut,
  delete_stockOut,
  get_stockOut,
  get_stockOutById,
  dashboard_stockOut,
} from "../controllers/stock_out.controller.js";

const router = Router();

router.post("/stock-out", create_stockOut);
router.put("/stock-out/:id", update_stockOut);
router.delete("/delete-stock-out/:id", delete_stockOut);

router.get("/get_all_stockOut", get_stockOut);

router.get("/get_stockOutById/:id", get_stockOutById);

router.get("/dashboard_stockOut", dashboard_stockOut);

export default router;
