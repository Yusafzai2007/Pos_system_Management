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

  // ------------------- VALIDATION -------------------
  if (!Array.isArray(itemId) || !Array.isArray(quantity))
    throw new apiError(400, "itemId and quantity must be arrays");

  if (itemId.length !== quantity.length)
    throw new apiError(400, "itemId and quantity length must match");

  if (!stockOutCategoryId || !Total_sale || !stockOutDate)
    throw new apiError(400, "Required fields missing");

  if (invoiceNo) {
    const exists = await StockOut.findOne({ invoiceNo });
    if (exists) throw new apiError(409, "Invoice number already exists");
  }

  for (let qty of quantity) {
    if (qty <= 0) throw new apiError(400, "Quantity must be greater than 0");
  }

  // ------------------- CREATE STOCK-OUT -------------------
  const stockOut = await StockOut.create({
    itemId,
    quantity,
    stockOutCategoryId,
    Total_sale,
    stockOutDate,
    invoiceNo,
  });

  // ------------------- UPDATE STOCK -------------------
  for (let i = 0; i < itemId.length; i++) {
    const productId = itemId[i];
    const qty = quantity[i];

    const item = await Item.findById(productId);
    if (!item) throw new apiError(404, `Item not found: ${productId}`);

    const record = await ItemStockRecord.findOne({ productId });

    if (!record) {
      throw new apiError(
        400,
        `Opening stock required for first entry of product: ${item.item_name || productId}`
      );
    }

    if (record.remainingStock < qty) {
      throw new apiError(
        400,
        `Insufficient stock for product: ${item.item_name || productId}. Available: ${record.remainingStock}`
      );
    }

    // Update stock using correct object format
    await ItemStockRecord.updateStock({
      productId,
      quantity: -qty, // negative for Stock-Out
      type: "Stock-Out",
      reference: stockOut._id.toString(),
      prices: {
        costPrice: item.actual_item_price,
        salePrice: item.selling_item_price,
        discount: item.item_discount_price,
        finalPrice: item.item_final_price,
      },
    });
  }

  res
    .status(201)
    .json(new apiResponse(201, stockOut, "Stock-Out created successfully"));
});

/* ======================================================
   UPDATE STOCK-OUT
====================================================== */
const update_stockOut = asynhandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity, stockOutCategoryId, Total_sale, stockOutDate, invoiceNo } = req.body;

    const existingStockOut = await StockOut.findById(id);
    if (!existingStockOut) throw new apiError(404, "Stock-Out record not found");

    // Validation
    if (!Array.isArray(itemId) || !Array.isArray(quantity))
      throw new apiError(400, "itemId and quantity must be arrays");
    if (itemId.length !== quantity.length)
      throw new apiError(400, "itemId and quantity length must match");

    // Loop through items
    for (let i = 0; i < itemId.length; i++) {
      const productId = itemId[i];
      const oldQty = Number(existingStockOut.quantity[i]) || 0;
      const newQty = Number(quantity[i]);

      if (isNaN(newQty) || newQty < 0)
        throw new apiError(400, "Invalid quantity for item: " + productId);

      const difference = newQty - oldQty; // 🔹 positive -> reduce more stock, negative -> add back

      const item = await Item.findById(productId);
      if (!item) throw new apiError(404, `Item not found: ${productId}`);

      if (item.stock < difference * 1 && difference > 0) // ensure enough stock to reduce
        throw new apiError(400, `Insufficient stock for item: ${item.name}`);

      // Update remaining stock in ItemStockRecord
      await ItemStockRecord.updateOne(
        { productId },
        { $inc: { remainingStock: -difference } } // minus difference for Stock-Out
      );

      // Update the Stock-Out transaction
      const updated = await ItemStockRecord.updateOne(
        { productId, "transactions.reference": existingStockOut._id.toString() },
        {
          $set: {
            "transactions.$[t].quantity": newQty,
            "transactions.$[t].type": "Stock-Out",
            "transactions.$[t].finalPrice": item.item_final_price || 0,
          },
        },
        {
          arrayFilters: [{ "t.reference": existingStockOut._id.toString(), "t.type": "Stock-Out" }],
        }
      );

      // If transaction doesn't exist, create it
      if (updated.modifiedCount === 0) {
        await ItemStockRecord.updateOne(
          { productId },
          {
            $push: {
              transactions: {
                date: stockOutDate ? new Date(stockOutDate) : new Date(),
                quantity: newQty,
                type: "Stock-Out",
                reference: existingStockOut._id.toString(),
                finalPrice: item.item_final_price || 0,
              },
            },
          }
        );
      }
    }

    // Update Stock-Out document
    existingStockOut.itemId = itemId;
    existingStockOut.quantity = quantity;
    existingStockOut.stockOutCategoryId = stockOutCategoryId;
    existingStockOut.Total_sale = Total_sale;
    existingStockOut.stockOutDate = stockOutDate;
    existingStockOut.invoiceNo = invoiceNo;

    await existingStockOut.save();

    res.status(200).json(
      new apiResponse(200, existingStockOut, "Stock-Out updated successfully")
    );
  } catch (error) {
    console.error("❌ Stock-Out Update Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
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

  // 4️⃣ Attach openingStock, remainingStock, barcodes to each item
  for (const stock of stockOutData) {
    for (const item of stock.itemId) {
      // Fetch ItemStockRecord for this item
      const record = await ItemStockRecord.findOne({ productId: item._id });

      item.openingStock = record?.openingStock || 0;       // Exact opening stock
      item.remainingStock = record?.remainingStock || 0;   // Exact remaining stock

      // Attach barcodes
      item.barcodes = barcodes.filter(
        (b) => b.stock_productId.toString() === item._id.toString()
      );
    }
  }

  // 5️⃣ Send response
  res.status(200).json(
    new apiResponse(200, stockOutData, "Stock-Out data fetched successfully")
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





const dashboard_stockOut = asynhandler(async (req, res) => {
  const stockOutData = await StockOut.find()
    res.status(200).json(
      new apiResponse(200, stockOutData, "Stock-Out data fetched successfully")
    );
});























export {
  create_stockOut,
  update_stockOut,
  delete_stockOut,
  get_stockOut,
  get_stockOutById,
  dashboard_stockOut,
};
