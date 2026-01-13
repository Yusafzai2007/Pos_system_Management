import { Router } from "express";
import { create_stockIn_category, delete_stockIn_category, get_stockIn_categories, update_stockIn_category } from "../controllers/stockIn_category.controller.js";

const router = Router();

router.post("/create_stockIn_category", create_stockIn_category);
router.put("/update_stockIn_category/:id",   update_stockIn_category);
router.delete("/delete_stockIn_category/:id", delete_stockIn_category);
router.get("/get_stockIn_categories", get_stockIn_categories);


export default router;
