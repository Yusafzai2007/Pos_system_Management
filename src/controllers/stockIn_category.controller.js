import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { StockInCategory } from "../models/stockIn_category.model.js";

const create_stockIn_category = asynhandler(async (req, res) => {
  const { categoryName, description } = req.body;
  if (!categoryName || !description) {
    throw new apiError(400, "categoryName and description are required");
  }

  const existsCategory = await StockInCategory.findOne({
    stockInCategoryName: categoryName,
  });
  if (existsCategory) {
    throw new apiError(409, "Stock In Category with this name already exists");
  }

  const stockInCategory = await StockInCategory.create({
    stockInCategoryName: categoryName,
    category_description: description,
  });

  if (!stockInCategory) {
    throw new apiError(500, "Server error");
  }

  res
    .status(201)
    .json(
      new apiResponse(
        201,
        "Stock In Category created successfully",
        stockInCategory,
      ),
    );
});

const update_stockIn_category = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { categoryName, description, isActive } = req.body;
  if (!id) {
    throw new apiError(400, "ID parameter is required");
  }
  const stockInCategory = await StockInCategory.findByIdAndUpdate(
    id,
    {
      stockInCategoryName: categoryName,
      category_description: description,
      isActive,
    },
    { new: true },
  );
  if (!stockInCategory) {
    throw new apiError(404, "Stock In Category not found");
  }
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        "Stock In Category updated successfully",
        stockInCategory,
      ),
    );
});

const delete_stockIn_category = asynhandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new apiError(400, "ID parameter is required");
  }
  const stockInCategory = await StockInCategory.findByIdAndDelete(id);
  if (!stockInCategory) {
    throw new apiError(404, "Stock In Category not found");
  }
  res
    .status(200)
    .json(new apiResponse(200, "Stock In Category deleted successfully", null));
});

const get_stockIn_categories = asynhandler(async (req, res) => {
  const stockInCategories = await StockInCategory.find().sort({
    createdAt: -1,
  }); // 🔹 Latest first
  if (!stockInCategories || stockInCategories.length === 0) {
    throw new apiError(404, "No Stock In Categories found");
  }
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        "Stock In Categories fetched successfully",
        stockInCategories,
      ),
    );
});

export {
  create_stockIn_category,
  update_stockIn_category,
  delete_stockIn_category,
  get_stockIn_categories,
};
