import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import ItemStockRecord from "../models/product_stock_record.model.js";
import { item } from "../models/item.model.js";

const create_product_stock_record = asynhandler(async (req, res) => {
  console.log("Controller hit");
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

  // Use the static method
  const stockRecord = await ItemStockRecord.updateStock(
    productId,
    openingStock,
    "Opening",
    "Opening Stock",
    prices // <-- Pass prices here
  );

  res.status(201).json(
    new apiResponse(201, stockRecord, "Opening stock created successfully")
  );
});



const edit_product_stock_record = asynhandler(async (req, res) => {
  const { id } = req.params;  // this id is the _id of stock record
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
    (t) => t.type === "Opening" && t.reference.includes("Opening Stock")
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

  res.status(200).json(
    new apiResponse(200, record, "Opening stock updated successfully")
  );
});




export { create_product_stock_record,edit_product_stock_record };
