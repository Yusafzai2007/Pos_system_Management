import { Router } from "express";
import { create_stockOut, update_stockOut, delete_stockOut, get_stockOut } from "../controllers/stock_out.controller.js";

const router = Router();

router.post("/stock-out", create_stockOut);
router.put("/stock-out/:id", update_stockOut);
router.delete("/stock-out/:id", delete_stockOut);

router.get("/get_all_stockOut",get_stockOut)

export default router;
