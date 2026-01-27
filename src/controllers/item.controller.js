import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { product_group } from "../models/product_group.model.js";
import { item, item as Item } from "../models/item.model.js";
import ItemStockRecord from "../models/product_stock_record.model.js";

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

  const itemdata = await Item.findById(id);
  if (!itemdata) throw new apiError(404, "Item not found");

  const group = await product_group.findOne({
    itemGroupName: itemGroupName,
    isActive: true,
  });
  if (!group) throw new apiError(404, "Item Group not found");

  if (selling_item_price - item_discount_price < 0) {
    throw new apiError(400, "Discount cannot be greater than selling price");
  }

  const existingSKU = await Item.findOne({ modelNoSKU, _id: { $ne: id } });
  if (existingSKU) throw new apiError(410, "Model SKU already exists");

  // Update Item
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
  // UPDATE Product Edited History
  // -------------------------
  const record = await ItemStockRecord.findOne({ productId: id });

  if (!record) {
    // IF no record, create it once
    await ItemStockRecord.create({
      productId: id,
      remainingStock: 0,
      transactions: [
        {
          date: new Date(),
          quantity: 0,
          type: "Opening",
          reference: "Product Edited",
          costPrice: actual_item_price,
          salePrice: selling_item_price,
          discount: item_discount_price,
          finalPrice: item_final_price,
        },
      ],
    });
  } else {
    const editIndex = record.transactions.findIndex(
      (t) => t.reference === "Product Edited"
    );

    if (editIndex !== -1) {
      // UPDATE existing transaction
      record.transactions[editIndex].date = new Date();
      record.transactions[editIndex].costPrice = actual_item_price;
      record.transactions[editIndex].salePrice = selling_item_price;
      record.transactions[editIndex].discount = item_discount_price;
      record.transactions[editIndex].finalPrice = item_final_price;

      await record.save();
    } else {
      // Create ONLY once if not exist
      record.transactions.push({
        date: new Date(),
        quantity: 0,
        type: "Opening",
        reference: "Product Edited",
        costPrice: actual_item_price,
        salePrice: selling_item_price,
        discount: item_discount_price,
        finalPrice: item_final_price,
      });

      await record.save();
    }
  }

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
  if (!items || items.length === 0) {
    throw new apiError(404, "No items found");
  }
  res
    .status(200)
    .json(new apiResponse(200, items, "Items retrieved successfully"));
});

export const getStockGroupedByProduct = async (req, res) => {
  try {
    const data = await ItemStockRecord.aggregate([
      {
        $group: {
          _id: "$productId",
          stockRecordIds: { $push: "$_id" }, // <-- add this
          totalRemainingStock: { $sum: "$remainingStock" },
          totalOpeningStock: { $sum: "$openingStock" },
          allTransactions: { $push: "$transactions" },
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

      // ✅ Add stockRecordIds here
      {
        $project: {
          _id: 1,
          stockRecordIds: 1, // <-- must add
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

import mongoose from "mongoose";

const getStockGroupedByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const data = await ItemStockRecord.aggregate([
      // ✅ 0️⃣ FILTER SINGLE PRODUCT
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
        },
      },

      // 1️⃣ GROUP
      {
        $group: {
          _id: "$productId",
          totalRemainingStock: { $sum: "$remainingStock" },
          totalOpeningStock: { $sum: "$openingStock" },
          allTransactions: { $push: "$transactions" },
        },
      },

      // 2️⃣ JOIN PRODUCT
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // 3️⃣ JOIN BARCODES
      {
        $lookup: {
          from: "product_barcodes",
          localField: "_id",
          foreignField: "stock_productId",
          as: "barcodes",
        },
      },

      // 4️⃣ RESPONSE SHAPE
      {
        $project: {
          _id: 1,
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
      count: data.length, // 👉 should be 1
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
