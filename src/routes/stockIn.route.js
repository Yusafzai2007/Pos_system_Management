import { Router } from "express";
import { create_stockIn, delete_stockIn, get_stockIn, get_stockInById, update_stockIn } from "../controllers/stockIn.controller.js";


const router = Router();

router.post("/create_stockIn", create_stockIn);
router.put("/update_stockIn/:id", update_stockIn);
router.delete("/delete_stockIn/:id", delete_stockIn);
router.get("/get_stockIn", get_stockIn);
router.get("/get_stockInById/:id", get_stockInById);
export default router;
