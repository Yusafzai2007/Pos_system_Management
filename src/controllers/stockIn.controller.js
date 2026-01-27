import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { StockIn } from "../models/stockIn.model.js";
import { item as Item } from "../models/item.model.js";
import { ProductBarcode } from "../models/product_barcode.model.js";
import ItemStockRecord from "../models/product_stock_record.model.js";


const create_stockIn = asynhandler(async (req, res) => {
  const {
    itemId,
    stockAdded,
    stockInDate,
    stockInCategoryId,
    invoiceNo,
    stcokIn_price,
    notes,
  } = req.body;

  if (
    !itemId ||
    !stockAdded ||
    !Array.isArray(itemId) ||
    !Array.isArray(stockAdded)
  ) {
    throw new apiError(400, "itemId and stockAdded must be arrays");
  }

  if (itemId.length !== stockAdded.length) {
    throw new apiError(400, "itemId and stockAdded length must be same");
  }

  if (!stockInDate || !stockInCategoryId) {
    throw new apiError(400, "Required fields are missing");
  }

  if (invoiceNo) {
    const exists = await StockIn.findOne({ invoiceNo });
    if (exists) {
      throw new apiError(409, "Invoice number already exists");
    }
  }

  for (let qty of stockAdded) {
    if (qty <= 0) {
      throw new apiError(400, "Stock quantity must be greater than 0");
    }
  }

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
    const qty = stockAdded[i];

    const item = await Item.findById(productId);
    if (!item) throw new apiError(404, `Item not found: ${productId}`);

    await ItemStockRecord.updateStock(
      productId,
      qty,
      "Stock-In",
      stockIn._id.toString(),
      {
        costPrice: item.actual_item_price,
        salePrice: item.selling_item_price,
        discount: item.item_discount_price,
        finalPrice: item.item_final_price,
      }
    );
  }

  res
    .status(201)
    .json(new apiResponse(201, stockIn, "Stock-In created successfully"));
});


/* ======================================================
   UPDATE STOCK-IN
====================================================== */
const update_stockIn = asynhandler(async (req, res) => {
  const { id } = req.params;

  const {
    itemId,
    stockAdded,
    stockInDate,
    stockInCategoryId,
    invoiceNo,
    stcokIn_price,
    notes,
  } = req.body;

  const existingStockIn = await StockIn.findById(id);

  if (!existingStockIn) {
    throw new apiError(404, "Stock-In record not found");
  }

  /* 🔴 STEP 1: REVERSE OLD STOCK */
  for (let i = 0; i < existingStockIn.itemId.length; i++) {
    await Item.findByIdAndUpdate(existingStockIn.itemId[i], {
      $inc: { stock: -existingStockIn.stockAdded[i] },
    });
  }

  /* 🔴 STEP 2: VALIDATION */
  if (!Array.isArray(itemId) || !Array.isArray(stockAdded)) {
    throw new apiError(400, "itemId and stockAdded must be arrays");
  }

  if (itemId.length !== stockAdded.length) {
    throw new apiError(400, "itemId and stockAdded length must be same");
  }

  for (let qty of stockAdded) {
    if (qty <= 0) {
      throw new apiError(400, "Stock quantity must be greater than 0");
    }
  }

  /* 🔴 STEP 3: APPLY NEW STOCK */
  for (let i = 0; i < itemId.length; i++) {
    const item = await Item.findById(itemId[i]);
    if (!item) {
      throw new apiError(404, `Item not found: ${itemId[i]}`);
    }

    await Item.findByIdAndUpdate(itemId[i], {
      $inc: { stock: stockAdded[i] },
    });
  }

  /* 🔴 STEP 4: UPDATE STOCK-IN RECORD */
  existingStockIn.itemId = itemId;
  existingStockIn.stockAdded = stockAdded;
  existingStockIn.stockInDate = stockInDate;
  existingStockIn.stockInCategoryId = stockInCategoryId;
  existingStockIn.invoiceNo = invoiceNo;
  existingStockIn.notes = notes;
  existingStockIn.stcokIn_price = stcokIn_price;

  await existingStockIn.save();

  res
    .status(200)
    .json(
      new apiResponse(200, existingStockIn, "Stock-In updated successfully")
    );
});

const delete_stockIn = asynhandler(async (req, res) => {
  const { id } = req.params;

  const existingStockIn = await StockIn.findById(id);
  if (!existingStockIn) {
    throw new apiError(404, "Stock-In record not found");
  }
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
    .lean(); // ⭐ IMPORTANT

  // 🔹 Collect all item IDs
  const itemIds = stockInData.flatMap(s =>
    s.itemId.map(i => i._id)
  );

  // 🔹 Find barcodes where product id matches
  const barcodes = await ProductBarcode.find({
    stock_productId: { $in: itemIds },
  });

  // 🔹 Attach barcodes to items
  stockInData.forEach(stock => {
    stock.itemId.forEach(item => {
      item.barcodes = barcodes.filter(
        b => b.stock_productId.toString() === item._id.toString()
      );
    });
  });

  res.status(200).json(
    new apiResponse(200, stockInData, "Stock-In data fetched successfully")
  );
});

export { create_stockIn, update_stockIn, delete_stockIn, get_stockIn };
