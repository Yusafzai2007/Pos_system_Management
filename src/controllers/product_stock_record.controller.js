import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import ItemStockRecord from "../models/product_stock_record.model.js";
import { item } from "../models/item.model.js";
import { StockOut } from "../models/stock_out.model.js";
import { StockIn } from "../models/stockIn.model.js";

const create_product_stock_record = asynhandler(async (req, res) => {
  const { id: productId } = req.params;
  const { openingStock } = req.body;

  // Fetch product prices from Item collection
  const product = await item.findById(productId);

  if (!product) {
    throw new apiError(404, "Product not found");
  }

  const prices = {
    costPrice: product.actual_item_price,
    salePrice: product.selling_item_price,
    discount: product.item_discount_price,
    finalPrice: product.item_final_price,
  };

 const stockRecord = await ItemStockRecord.updateStock({
  productId,        // your product id
  quantity: openingStock, // the stock number
  type: "Opening",
  reference: "Opening Stock",
  prices,           // the prices object
});

  res
    .status(201)
    .json(
      new apiResponse(201, stockRecord, "Opening stock created successfully"),
    );
});

const edit_product_stock_record = asynhandler(async (req, res) => {
  const { id } = req.params; // this id is the _id of stock record
  const { openingStock } = req.body;

  const record = await ItemStockRecord.findById(id);

  if (!record) {
    throw new apiError(404, "Stock record not found");
  }

  // Calculate difference
  const difference = openingStock - record.openingStock;

  record.openingStock = openingStock;
  record.remainingStock += difference;

  // Update existing Opening transaction (no new transaction)
  const openingTxn = record.transactions.find(
    (t) => t.type === "Opening" && t.reference.includes("Opening Stock"),
  );

  if (openingTxn) {
    openingTxn.quantity = Math.abs(openingStock);
    openingTxn.date = new Date();
    openingTxn.reference = "Opening Stock Edited";
  } else {
    record.transactions.push({
      date: new Date(),
      quantity: Math.abs(openingStock),
      type: "Opening",
      reference: "Opening Stock",
    });
  }

  await record.save();

  res
    .status(200)
    .json(new apiResponse(200, record, "Opening stock updated successfully"));
});


const get_stock_record = asynhandler(async (req, res) => {
  const records = await ItemStockRecord.find().populate(
    'productId',
    'item_Name modelNoSKU unit createdAt updatedAt'
  );

  if (!records || records.length === 0) {
    throw new apiError(404, "No stock records found");
  }

  // Loop through each record and resolve Stock-In and Stock-Out transaction data
  const recordsWithTransactions = await Promise.all(
    records.map(async (record) => {
      const updatedTransactions = await Promise.all(
        record.transactions.map(async (txn) => {
          let txnDetails = null;

          if (txn.type === "Stock-In") {
            txnDetails = await StockIn.findById(txn.reference); // reference should hold StockIn _id
          } else if (txn.type === "Stock-Out") {
            txnDetails = await StockOut.findById(txn.reference); // reference should hold StockOut _id
          }

          return {
            ...txn.toObject(),
            fullTransaction: txnDetails ? txnDetails.toObject() : null
          };
        })
      );

      return {
        ...record.toObject(),
        transactions: updatedTransactions
      };
    })
  );

  res.status(200).json(
  new apiResponse(
    200,
    "Stock records with full transaction details retrieved successfully", // message
    recordsWithTransactions // data
  )
);

});













export { create_product_stock_record, edit_product_stock_record,get_stock_record };
