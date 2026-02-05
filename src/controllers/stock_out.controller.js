import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { item as Item } from "../models/item.model.js";
import { StockOut } from "../models/stock_out.model.js";
import { ProductBarcode } from "../models/product_barcode.model.js";
import ItemStockRecord from "../models/product_stock_record.model.js";
/* ======================================================
   CREATE STOCK-OUT
====================================================== */
const create_stockOut = asynhandler(async (req, res) => {
  const {
    itemId,
    quantity,
    stockOutCategoryId,
    Total_sale,
    stockOutDate,
    invoiceNo,
  } = req.body;

  // Validation
  if (!Array.isArray(itemId) || !Array.isArray(quantity))
    throw new apiError(400, "itemId and quantity must be arrays");

  if (itemId.length !== quantity.length)
    throw new apiError(400, "itemId and quantity length must match");

  if (!stockOutCategoryId || !Total_sale || !stockOutDate)
    throw new apiError(400, "Required fields missing");

  // Invoice unique
  if (invoiceNo) {
    const exists = await StockOut.findOne({ invoiceNo });
    if (exists) throw new apiError(409, "Invoice number already exists");
  }

  // Quantity > 0
  for (let qty of quantity) {
    if (qty <= 0) throw new apiError(400, "Quantity must be greater than 0");
  }

  // Create Stock-Out
  const stockOut = await StockOut.create({
    itemId,
    quantity,
    stockOutCategoryId,
    Total_sale,
    stockOutDate,
    invoiceNo,
  });

  // 🔥 STOCK CHECK + UPDATE
  for (let i = 0; i < itemId.length; i++) {
    const productId = itemId[i];
    const qty = quantity[i];

    const item = await Item.findById(productId);
    if (!item) throw new apiError(404, `Item not found: ${productId}`);

    // ✅ CHECK remaining stock
    const record = await ItemStockRecord.findOne({ productId });
    if (!record || record.remainingStock < qty) {
      throw new apiError(
        400,
        `Insufficient stock. Available: ${record?.remainingStock || 0}`,
      );
    }

    // ✅ Minus stock + history
    await ItemStockRecord.updateStock(
      productId,
      -qty,
      "Stock-Out",
      stockOut._id.toString(),
      {
        costPrice: item.actual_item_price,
        salePrice: item.selling_item_price,
        discount: item.item_discount_price,
        finalPrice: item.item_final_price,
      },
    );
  }

  res
    .status(201)
    .json(new apiResponse(201, stockOut, "Stock-Out created successfully"));
});

/* ======================================================
   UPDATE STOCK-OUT
====================================================== */
const update_stockOut = asynhandler(async (req, res) => {
  const { id } = req.params;
  const {
    itemId,
    quantity,
    stockOutCategoryId,
    Total_sale,
    stockOutDate,
    invoiceNo,
  } = req.body;

  const existingStockOut = await StockOut.findById(id);
  if (!existingStockOut) throw new apiError(404, "Stock-Out record not found");

  // Reverse old stock
  for (let i = 0; i < existingStockOut.itemId.length; i++) {
    await Item.findByIdAndUpdate(existingStockOut.itemId[i], {
      $inc: { stock: existingStockOut.quantity[i] },
    });
  }

  // Validation new data
  if (!Array.isArray(itemId) || !Array.isArray(quantity))
    throw new apiError(400, "itemId and quantity must be arrays");
  if (itemId.length !== quantity.length)
    throw new apiError(400, "itemId and quantity length must match");

  for (let i = 0; i < itemId.length; i++) {
    const item = await Item.findById(itemId[i]);
    if (!item) throw new apiError(404, `Item not found: ${itemId[i]}`);
    if (item.stock < quantity[i])
      throw new apiError(400, `Insufficient stock for item: ${item.name}`);
    await Item.findByIdAndUpdate(itemId[i], { $inc: { stock: -quantity[i] } });
  }

  // Update Stock-Out record
  existingStockOut.itemId = itemId;
  existingStockOut.quantity = quantity;
  existingStockOut.stockOutCategoryId = stockOutCategoryId;
  existingStockOut.Total_sale = Total_sale;
  existingStockOut.stockOutDate = stockOutDate;
  existingStockOut.invoiceNo = invoiceNo;

  await existingStockOut.save();

  res
    .status(200)
    .json(
      new apiResponse(200, existingStockOut, "Stock-Out updated successfully"),
    );
});

/* ======================================================
   DELETE STOCK-OUT (Soft Delete)
====================================================== */
const delete_stockOut = asynhandler(async (req, res) => {
  const { id } = req.params;
  const existingStockOut = await StockOut.findById(id);

  if (!existingStockOut) throw new apiError(404, "Stock-Out record not found");
  if (!existingStockOut.isActive)
    throw new apiError(400, "Stock-Out already deleted");

  // Reverse stock
  for (let i = 0; i < existingStockOut.itemId.length; i++) {
    await Item.findByIdAndUpdate(existingStockOut.itemId[i], {
      $inc: { stock: existingStockOut.quantity[i] },
    });
  }

  // Soft delete
  existingStockOut.isActive = false;
  existingStockOut.deletedAt = new Date();
  await existingStockOut.save();

  res
    .status(200)
    .json(
      new apiResponse(200, existingStockOut, "Stock-Out deleted successfully"),
    );
});

const get_stockOut = asynhandler(async (req, res) => {
  // 1️⃣ Fetch all Stock-Out records with items and categories
  const stockOutData = await StockOut.find()
    .populate({
      path: "itemId",
      populate: { path: "itemGroupId", model: "product_group" },
    })
    .populate({
      path: "stockOutCategoryId",
      model: "StockoutCategory",
    })
    .lean();

  // 2️⃣ Collect all item IDs
  const itemIds = stockOutData.flatMap((s) => s.itemId.map((i) => i._id));

  // 3️⃣ Fetch all barcodes for these items
  const barcodes = await ProductBarcode.find({
    stock_productId: { $in: itemIds },
  });

  // 4️⃣ Aggregate total stock-in per item
  const stockIns = await StockIn.aggregate([
    { $match: { itemId: { $in: itemIds } } },
    {
      $group: {
        _id: "$itemId",
        totalStockIn: { $sum: { $sum: "$stockAdded" } }, // Sum all stockAdded array values
      },
    },
  ]);

  // 5️⃣ Aggregate total stock-out per item
  const stockOuts = await StockOut.aggregate([
    { $unwind: "$itemId" },
    { $match: { itemId: { $in: itemIds } } },
    {
      $group: {
        _id: "$itemId",
        totalStockOut: { $sum: { $sum: "$quantity" } }, // Sum all quantity array values
      },
    },
  ]);

  // 6️⃣ Map stock-ins and stock-outs for quick lookup
  const stockInMap = new Map(
    stockIns.map((s) => [s._id.toString(), s.totalStockIn]),
  );
  const stockOutMap = new Map(
    stockOuts.map((s) => [s._id.toString(), s.totalStockOut]),
  );

  // 7️⃣ Attach openingStock, remainingStock, barcodes to each item
  stockOutData.forEach((stock) => {
    stock.itemId.forEach((item) => {
      const stockIn = stockInMap.get(item._id.toString()) || 0;
      const stockOut = stockOutMap.get(item._id.toString()) || 0;

      item.openingStock = stockIn;
      item.remainingStock = stockIn - stockOut;
      item.barcodes = barcodes.filter(
        (b) => b.stock_productId.toString() === item._id.toString(),
      );
    });
  });

  // 8️⃣ Send response
  res
    .status(200)
    .json(
      new apiResponse(200, stockOutData, "Stock-Out data fetched successfully"),
    );
});
import mongoose from "mongoose";
import { StockIn } from "../models/stockIn.model.js";

const get_stockOutById = asynhandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new apiError(400, "Stock-Out ID is required");

  const stockOutData = await StockOut.findById(id)
    .populate({
      path: "itemId",
      populate: { path: "itemGroupId", model: "product_group" },
    })
    .populate("stockOutCategoryId")
    .lean();

  if (!stockOutData) throw new apiError(404, "Stock-Out not found");

  // Ensure itemId is always an array
  stockOutData.itemId = Array.isArray(stockOutData.itemId)
    ? stockOutData.itemId
    : [];

  const itemIds = stockOutData.itemId.map((i) => i._id);

  // 🔹 Fetch barcodes
  const barcodes = itemIds.length
    ? await ProductBarcode.find({ stock_productId: { $in: itemIds } }).lean()
    : [];

  // 🔹 Fetch stock records
  const stockRecords = itemIds.length
    ? await ItemStockRecord.find({
        productId: { $in: itemIds },
        "transactions.reference": stockOutData._id.toString(),
      }).lean()
    : [];

  // Attach barcodes + stock info + transaction ID safely
  stockOutData.itemId.forEach((item) => {
    if (!item) return;

    const record = stockRecords.find(
      (r) => r.productId?.toString() === item._id?.toString(),
    );

    item.barcodes = barcodes.filter(
      (b) => b.stock_productId?.toString() === item._id?.toString(),
    );

    item.openingStock = record?.openingStock ?? 0;
    item.remainingStock = record?.remainingStock ?? 0;

    const transaction = record?.transactions?.find(
      (t) =>
        t.reference === stockOutData._id.toString() && t.type === "Stock-Out",
    );

    item.transactionId = transaction?._id ?? null;
  });
  res.status(200).json(
    new apiResponse(
      200,
      "Stock-Out data with opening, remaining stock & transaction ID fetched successfully", // message
      stockOutData, // data
    ),
  );
});

export {
  create_stockOut,
  update_stockOut,
  delete_stockOut,
  get_stockOut,
  get_stockOutById,
};
