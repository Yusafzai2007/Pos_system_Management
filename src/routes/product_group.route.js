import { Router } from "express";
import {
  create_item_group,
  delete_item_group,
  get_item_groups,
  update_item_group,
} from "../controllers/product_group.controller.js";

const route = Router();

route.post("/create-product-group", create_item_group);
route.put("/update-product-group/:id", update_item_group);
route.delete("/delete-product-group/:id", delete_item_group);
route.get("/get-product-groups", get_item_groups);
export default route;
