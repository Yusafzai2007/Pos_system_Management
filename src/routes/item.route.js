import { Router } from "express";
import {
  create_item,
  delete_item,
  get_items,
  update_item,
} from "../controllers/item.controller.js";

const route = Router();

route.post("/add_item", create_item);

route.put("/update_item/:id", update_item);

route.delete("/delete_item/:id", delete_item);

route.get("/get_items", get_items);

export default route;
