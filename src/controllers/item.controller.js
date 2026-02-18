import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { product_group } from "../models/product_group.model.js";
import { item, item as Item } from "../models/item.model.js";
import ItemStockRecord from "../models/product_stock_record.model.js";
import { StockOut } from "../models/stock_out.model.js";

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

  // Validate required fields
  if (
    !itemGroupName ||
    !item_Name ||
    !item_Description ||
    actual_item_price === undefined ||
    selling_item_price === undefined ||
    item_final_price === undefined ||
    !modelNoSKU ||
    !unit
  ) {
    throw new apiError(400, "All fields are required");
  }

  // Validate prices are numbers
  if (
    typeof actual_item_price !== "number" ||
    typeof selling_item_price !== "number" ||
    typeof item_discount_price !== "number" ||
    typeof item_final_price !== "number"
  ) {
    throw new apiError(400, "Prices must be valid numbers");
  }

  // Check discount is not more than selling price
  if (item_discount_price > selling_item_price) {
    throw new apiError(401, "Discount cannot be greater than selling price");
  }

  // Calculate expected final price
  const expectedFinalPrice = selling_item_price - item_discount_price;

  // Check final price matches calculation
  if (item_final_price !== expectedFinalPrice) {
    throw new apiError(
      402,
      `Final price must be equal to selling price minus discount (${expectedFinalPrice})`,
    );
  }

  // Check final price is not less than actual price
  if (item_final_price < actual_item_price) {
    throw new apiError(
      403,
      "Final price cannot be less than actual item price. Selling at a loss is not allowed!",
    );
  }

  // Check if item already exists
  const existingItem = await Item.findOne({ modelNoSKU });
  if (existingItem) throw new apiError(410, "Model SKU already exists");

  // Check if group exists
  const group = await product_group.findOne({
    itemGroupName: itemGroupName,
    isActive: true,
  });
  if (!group) {
    throw new apiError(404, "Item Group not found");
  }

  // Create new item
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

  // -------------------------
  // CHECK ITEM
  // -------------------------
  const itemdata = await Item.findById(id);
  if (!itemdata) throw new apiError(404, "Item not found");

  // -------------------------
  // CHECK GROUP
  // -------------------------
  const group = await product_group.findOne({
    itemGroupName: itemGroupName,
    isActive: true,
  });

  if (!group) throw new apiError(404, "Item Group not found");

  // -------------------------
  // VALIDATIONS
  // -------------------------
  if (selling_item_price - item_discount_price < 0) {
    throw new apiError(400, "Discount cannot be greater than selling price");
  }

  const existingSKU = await Item.findOne({
    modelNoSKU,
    _id: { $ne: id },
  });

  if (existingSKU)
    throw new apiError(410, "Model SKU already exists");

  // -------------------------
  // UPDATE ITEM
  // -------------------------
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

  // -------------------------
  // UPDATE OPENING TRANSACTION ONLY
  // -------------------------
  const record = await ItemStockRecord.findOne({ productId: id });

  if (record) {
    const openingTransaction = record.transactions.find(
      (t) => t.type === "Opening"
    );

    if (openingTransaction) {
      openingTransaction.date = new Date();
      openingTransaction.costPrice = actual_item_price;
      openingTransaction.salePrice = selling_item_price;
      openingTransaction.discount = item_discount_price;
      openingTransaction.finalPrice = item_final_price;

      await record.save();
    }
  }

  // -------------------------
  // RESPONSE
  // -------------------------
  res
    .status(200)
    .json(new apiResponse(200, updatedItem, "Item updated successfully"));
});


const delete_item = asynhandler(async (req, res) => {
  const { id } = req.params;
  const itemdata = await item.findById(id);
  if (!itemdata) throw new apiError(404, "Item not found");

  await StockIn.deleteMany({ itemId: id });

  await StockOut.deleteMany({ itemId: id });

  await ProductBarcode.deleteMany({ stock_productId: id });

  await ItemStockRecord.deleteOne({ productId: id });

  await item.findByIdAndDelete(id);

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        null,
        "Item and all related records deleted successfully",
      ),
    );
});

const get_items = asynhandler(async (req, res) => {
  const items = await item.find();
  if (!items || items.length === 0) {
    throw new apiError(404, "No items found");
  }
  res
    .status(200)
    .json(new apiResponse(200, "Items retrieved successfully", items));
});

export const getStockGroupedByProduct = async (req, res) => {
  try {
    const data = await ItemStockRecord.aggregate([
      {
        $group: {
          _id: "$productId",
          stockRecordIds: { $push: "$_id" },
          totalRemainingStock: { $sum: "$remainingStock" },
          totalOpeningStock: { $sum: "$openingStock" },
          allTransactions: { $push: "$transactions" }, // nested arrays
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "product_barcodes",
          localField: "_id",
          foreignField: "stock_productId",
          as: "barcodes",
        },
      },
      {
        $project: {
          _id: 1,
          stockRecordIds: 1,
          totalRemainingStock: 1,
          totalOpeningStock: 1,
          allTransactions: 1,
          product: 1,
          barcodes: 1,
        },
      },
    ]);

    // 🔹 Reverse transaction history per product
    const reversedData = data.map((product) => {
      return {
        ...product,
        allTransactions: product.allTransactions
          .flat() // flatten nested arrays
          .sort((a, b) => new Date(b.date) - new Date(a.date)), // newest first
      };
    });

    res.status(200).json({
      success: true,
      count: reversedData.length,
      data: reversedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

import mongoose from "mongoose";
import { StockIn } from "../models/stockIn.model.js";
import { ProductBarcode } from "../models/product_barcode.model.js";

const getStockGroupedByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const data = await ItemStockRecord.aggregate([
      // 0️⃣ Filter single product
      {
        $match: { productId: new mongoose.Types.ObjectId(productId) },
      },

      // 1️⃣ Group
      {
        $group: {
          _id: "$productId",
          stockRecordIds: { $push: "$_id" }, // 🔹 add ItemStockRecord _id
          totalRemainingStock: { $sum: "$remainingStock" },
          totalOpeningStock: { $sum: "$openingStock" },
          allTransactions: { $push: "$transactions" },
        },
      },

      // 2️⃣ Join Product
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // 3️⃣ Join Barcodes
      {
        $lookup: {
          from: "product_barcodes",
          localField: "_id",
          foreignField: "stock_productId",
          as: "barcodes",
        },
      },

      // 4️⃣ Response Shape
      {
        $project: {
          _id: 1,
          stockRecordIds: 1, // 🔹 include ItemStockRecord IDs
          totalRemainingStock: 1,
          totalOpeningStock: 1,
          allTransactions: 1,
          product: 1,
          barcodes: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  create_item,
  update_item,
  delete_item,
  get_items,
  getStockGroupedByProductId,
};
