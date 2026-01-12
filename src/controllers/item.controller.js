import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { product_group } from "../models/product_group.model.js";
import { item, item as Item } from "../models/item.model.js";

const create_item = asynhandler(async (req, res) => {
  const {
    itemGroupName,
    item_Name,
    item_Description,
    actual_item_price,
    selling_item_price,
    item_discount_price = 0,
    item_final_price,
    modelNoSKU,
    serialNo,
    unit,
  } = req.body;

  if (
    !itemGroupName ||
    !item_Name ||
    !item_Description ||
    actual_item_price === undefined ||
    selling_item_price === undefined ||
    !item_final_price ||
    !modelNoSKU ||
    !unit
  ) {
    throw new apiError(400, "All fields are required");
  }

  const existingItem = await Item.findOne({ modelNoSKU });
  if (existingItem) throw new apiError(410, "Model SKU already exists");

  const group = await product_group.findOne({
    itemGroupName: itemGroupName,
    isActive: true,
  });

  if (!group) {
    throw new apiError(404, "Item Group not found");
  }
  if (selling_item_price - item_discount_price < 0) {
    throw new apiError(401, "Discount cannot be greater than selling price");
  }

  const newItem = await Item.create({
    itemGroupId: group._id,
    item_Name,
    item_Description,
    actual_item_price,
    selling_item_price,
    item_discount_price,
    item_final_price,
    modelNoSKU,
    serialNo,
    unit,
  });

  res
    .status(201)
    .json(new apiResponse(201, newItem, "Item created successfully"));
});

const update_item = asynhandler(async (req, res) => {
  const { id } = req.params;
  const {
    itemGroupName,
    item_Name,
    item_Description,
    actual_item_price,
    selling_item_price,
    item_discount_price = 0,
    item_final_price,
    modelNoSKU,
    serialNo,
    unit,
    isActive,
  } = req.body;

  const itemdata = await item.findById(id);
  if (!itemdata) throw new apiError(404, "Item not found");

  const group = await product_group.findOne({
    itemGroupName: itemGroupName,
    isActive: true,
  });
  if (!group) {
    throw new apiError(404, "Item Group not found");
  }

  if (selling_item_price - item_discount_price < 0) {
    throw new apiError(400, "Discount cannot be greater than selling price");
  }

  const existingSKU = await Item.findOne({ modelNoSKU, _id: { $ne: id } });
  if (existingSKU) throw new apiError(410, "Model SKU already exists");

  // ✅ Update
  const updatedItem = await Item.findByIdAndUpdate(
    id,
    {
      itemGroupId: group._id,
      item_Name,
      item_Description,
      actual_item_price,
      selling_item_price,
      item_discount_price,
      item_final_price,
      modelNoSKU,
      serialNo,
      unit,
      isActive,
    },
    { new: true }
  );

  res
    .status(200)
    .json(new apiResponse(200, updatedItem, "Item updated successfully"));
});

const delete_item = asynhandler(async (req, res) => {
  const { id } = req.params;
  const itemdata = await item.findById(id);
  if (!itemdata) throw new apiError(404, "Item not found");
  await item.findByIdAndDelete(id);
  res.status(200).json(new apiResponse(200, null, "Item deleted successfully"));
});








const get_items = asynhandler(async (req, res) => {
  const items = await item.find();
  if (!items || items.length===0) {
    throw new apiError(404, "No items found");

  }
  res.status(200).json(new apiResponse(200, items, "Items retrieved successfully"));
});










export { create_item, update_item, delete_item, get_items };
