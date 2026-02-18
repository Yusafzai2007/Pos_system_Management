import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { StockoutCategory } from "../models/stockout_category.model.js";

// Create Stock Out Category
const create_stockOut_category = asynhandler(async (req, res) => {
  const { stockoutCategoryName, stockout_category_description } = req.body;

  if (!stockoutCategoryName || !stockout_category_description) {
    throw new apiError(
      400,
      "stockoutCategoryName and stockout_category_description are required",
    );
  }

  const existsCategory = await StockoutCategory.findOne({
    stockoutCategoryName,
  });

  if (existsCategory) {
    throw new apiError(409, "Stock Out Category with this name already exists");
  }

  const stockOutCategory = await StockoutCategory.create({
    stockoutCategoryName,
    stockout_category_description,
  });

  if (!stockOutCategory) {
    throw new apiError(500, "Server error");
  }

  res
    .status(201)
    .json(
      new apiResponse(
        201,
        "Stock Out Category created successfully",
        stockOutCategory,
      ),
    );
});

// Update Stock Out Category
const update_stockOut_category = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { stockoutCategoryName, stockout_category_description, isActive } =
    req.body;

  if (!id) {
    throw new apiError(400, "ID parameter is required");
  }

  const stockOutCategory = await StockoutCategory.findByIdAndUpdate(
    id,
    {
      stockoutCategoryName,
      stockout_category_description,
      isActive,
    },
    { new: true },
  );

  if (!stockOutCategory) {
    throw new apiError(404, "Stock Out Category not found");
  }

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        "Stock Out Category updated successfully",
        stockOutCategory,
      ),
    );
});

// Delete Stock Out Category
const delete_stockOut_category = asynhandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new apiError(400, "ID parameter is required");
  }

  const stockOutCategory = await StockoutCategory.findByIdAndDelete(id);

  if (!stockOutCategory) {
    throw new apiError(404, "Stock Out Category not found");
  }

  res
    .status(200)
    .json(
      new apiResponse(200, "Stock Out Category deleted successfully", null),
    );
});

// Get All Stock Out Categories
const get_stockOut_categories = asynhandler(async (req, res) => {
  const stockOutCategories = await StockoutCategory.find().sort({
    createdAt: -1,
  }); // 🔹 Latest first
  if (!stockOutCategories || stockOutCategories.length === 0) {
    throw new apiError(404, "No Stock Out Categories found");
  }

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        "Stock Out Categories fetched successfully",
        stockOutCategories,
      ),
    );
});

export {
  create_stockOut_category,
  update_stockOut_category,
  delete_stockOut_category,
  get_stockOut_categories,
};
