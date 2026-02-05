import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { StockIn } from "../models/stockIn.model.js";
import { item as Item } from "../models/item.model.js";
import { ProductBarcode } from "../models/product_barcode.model.js";
import ItemStockRecord from "../models/product_stock_record.model.js";

const create_stockIn = asynhandler(async (req, res) => {
  try {
    const {
      itemId,
      stockAdded,
      stockInDate,
      stockInCategoryId,
      invoiceNo,
      stcokIn_price,
      notes,
    } = req.body;

    // ---- validations (same as tumhari) ----

    const stockIn = await StockIn.create({
      itemId,
      stockAdded,
      stockInDate,
      stockInCategoryId,
      invoiceNo,
      stcokIn_price,
      notes,
    });

    for (let i = 0; i < itemId.length; i++) {
      const productId = itemId[i];
      const qty = Number(stockAdded[i]); // ✅ important

      if (isNaN(qty)) {
        throw new Error("Quantity is not a number");
      }

      const item = await Item.findById(productId);
      if (!item) {
        throw new apiError(404, `Item not found: ${productId}`);
      }

      await ItemStockRecord.updateStock(
        productId,
        qty,
        "Stock-In",
        stockIn._id.toString(),
        {
          costPrice: item.actual_item_price || 0,
          salePrice: item.selling_item_price || 0,
          discount: item.item_discount_price || 0,
          finalPrice: item.item_final_price || 0,
        }
      );
    }

    res
      .status(201)
      .json(new apiResponse(201, stockIn, "Stock-In created successfully"));

  } catch (error) {
    console.error("❌ Stock-In Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});



const update_stockIn = asynhandler(async (req, res) => {
  const { id } = req.params;
  const { itemId, stockAdded } = req.body;

  const existingStockIn = await StockIn.findById(id);
  if (!existingStockIn) {
    throw new apiError(404, "Stock-In not found");
  }

  // 🔹 LOOP items
  for (let i = 0; i < itemId.length; i++) {
    const productId = itemId[i];

    const oldQty = Number(existingStockIn.stockAdded[i]); // 🟢 purani qty
    const newQty = Number(stockAdded[i]);                 // 🟢 new qty

    if (isNaN(newQty) || newQty <= 0) {
      throw new apiError(400, "Invalid quantity");
    }

    // ⭐ DIFFERENCE
    const difference = newQty - oldQty;

    // 🟢 sirf DIFFERENCE apply hoga
    await ItemStockRecord.updateOne(
      { productId },
      {
        $inc: { remainingStock: difference },
        $set: {
          "transactions.$[t].quantity": Math.abs(newQty)
        }
      },
      {
        arrayFilters: [
          { "t.reference": existingStockIn._id.toString() }
        ]
      }
    );
  }

  // 🔹 StockIn update
  existingStockIn.itemId = itemId;
  existingStockIn.stockAdded = stockAdded;
  await existingStockIn.save();

  res.status(200).json(
    new apiResponse(200, existingStockIn, "Stock-In updated correctly")
  );
});


const delete_stockIn = asynhandler(async (req, res) => {
  const { id } = req.params;

  const existingStockIn = await StockIn.findById(id);
  if (!existingStockIn) {
    throw new apiError(404, "Stock-In record not found");
  }

  // 🔹 STEP 1: Adjust remainingStock for each item
  for (let i = 0; i < existingStockIn.itemId.length; i++) {
    const productId = existingStockIn.itemId[i];
    const qty = existingStockIn.stockAdded[i];

    // remainingStock se minus karo
    await ItemStockRecord.updateOne(
      { productId },
      { $inc: { remainingStock: -qty } }
    );
  }

  // 🔹 STEP 2: Delete Stock-In record
  const deletedata = await StockIn.findByIdAndDelete(id);

  res
    .status(200)
    .json(new apiResponse(200, deletedata, "Stock-In deleted successfully"));
});


const get_stockIn = asynhandler(async (req, res) => {
  const stockInData = await StockIn.find()
    .populate({
      path: "itemId",
      populate: {
        path: "itemGroupId",
        model: "product_group",
      },
    })
    .populate("stockInCategoryId")
    .lean();

  // 🔹 Collect all item IDs
  const itemIds = stockInData.flatMap((s) =>
    s.itemId.map((i) => i._id)
  );

  // 🔹 Get barcodes
  const barcodes = await ProductBarcode.find({
    stock_productId: { $in: itemIds },
  }).lean();

  // 🔹 Get stock records (OPENING + REMAINING)
  const stockRecords = await ItemStockRecord.find({
    productId: { $in: itemIds },
  }).lean();

  // 🔹 Attach data to items
  stockInData.forEach((stock) => {
    stock.itemId.forEach((item) => {
      // Barcodes
      item.barcodes = barcodes.filter(
        (b) => b.stock_productId.toString() === item._id.toString()
      );

      // Stock record
      const record = stockRecords.find(
        (r) => r.productId.toString() === item._id.toString()
      );

      item.openingStock = record?.openingStock || 0;
      item.remainingStock = record?.remainingStock || 0;
    });
  });

  res.status(200).json(
    new apiResponse(
      200,
      stockInData,
      "Stock-In data with opening & remaining stock fetched successfully"
    )
  );
});


import mongoose from "mongoose";

const get_stockInById = asynhandler(async (req, res) => {
  const { id } = req.params;

  const query = {};
  if (id) {
    query._id = new mongoose.Types.ObjectId(id);
  }

  const stockInData = await StockIn.find(query)
    .populate({
      path: "itemId",
      populate: { path: "itemGroupId", model: "product_group" },
    })
    .populate("stockInCategoryId")
    .lean();

  const itemIds = stockInData.flatMap((s) =>
    s.itemId.map((i) => i._id)
  );

  // 🔥 get stock records
  const stockRecords = await ItemStockRecord.find({
    productId: { $in: itemIds },
  }).lean();

  // 🔥 map opening & remaining + stock record ID
  stockInData.forEach((stock) => {
    stock.itemId.forEach((item) => {
      const record = stockRecords.find(
        (r) => r.productId.toString() === item._id.toString()
      );

      item.openingStock = record ? record.openingStock : 0;
      item.remainingStock = record ? record.remainingStock : 0;

      // ✅ Add stock record id
      item.stockRecordId = record ? record._id : null;
    });
  });

  res.status(200).json(
    new apiResponse(200, "Stock-In data with opening & remaining stock fetched successfully", stockInData)
  );
});



export {
  create_stockIn,
  update_stockIn,
  delete_stockIn,
  get_stockIn,
  get_stockInById,
};
