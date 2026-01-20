import { Router } from "express";
import {
  create_item,
  delete_item,
  get_items,
  getStockGroupedByProduct,
  getStockGroupedByProductId,
  update_item,
} from "../controllers/item.controller.js";

const route = Router();

route.post("/add_item", create_item);

route.put("/update_item/:id", update_item);

route.delete("/delete_item/:id", delete_item);

route.get("/get_items", get_items);



route.get("/stock/grouped", getStockGroupedByProduct);


route.get("/getStockGroupedByProductId/:productId",getStockGroupedByProductId)



export default route;
