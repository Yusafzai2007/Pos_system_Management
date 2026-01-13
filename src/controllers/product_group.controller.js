import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { product_group } from "../models/product_group.model.js";

const create_item_group = asynhandler(async (req, res) => {
  const { itemGroupName, group_description } = req.body;
  if (!itemGroupName || !group_description) {
    throw new apiError(400, "itemGroupName and group_title are required");
  }
  const itemGroup = await product_group.create({
    itemGroupName,
    group_description,
  });

  const existsItemGroup = await product_group.findOne({ itemGroupName });
  if (existsItemGroup) {
    throw new apiError(409, "Item Group with this name already exists");
  }

  if (!itemGroup) {
    throw new apiError(500, "Server error");
  }

  res
    .status(201)
    .json(new apiResponse(201, "Item Group created successfully", itemGroup));
});

const update_item_group = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { itemGroupName, group_description, isActive } = req.body;
  const itemGroup = await product_group.findByIdAndUpdate(
    id,
    { itemGroupName, group_description, isActive },
    { new: true }
  );
  if (!itemGroup) {
    throw new apiError(404, "Item Group not found");
  }
  res
    .status(200)
    .json(new apiResponse(200, "Item Group updated successfully", itemGroup));
});

const delete_item_group = asynhandler(async (req, res) => {
  const { id } = req.params;
  const itemGroup = await product_group.findByIdAndDelete(id);
  if (!itemGroup) {
    throw new apiError(404, "Item Group not found");
  }
  res
    .status(200)
    .json(new apiResponse(200, "Item Group deleted successfully", null));
});

const get_item_groups = asynhandler(async (req, res) => {
  const itemGroups = await product_group.find();
  if (!itemGroups || itemGroups.length === 0) {
    throw new apiError(404, "No Item Groups found");
  }
  res
    .status(200)
    .json(new apiResponse(200, "Item Groups fetched successfully", itemGroups));
});

export {
  create_item_group,
  update_item_group,
  delete_item_group,
  get_item_groups,
};
