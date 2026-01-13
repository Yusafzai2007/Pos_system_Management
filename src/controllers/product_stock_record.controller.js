import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import ItemStockRecord from "../models/product_stock_record.model.js";

const create_product_stock_record = asynhandler(async (req, res) => {
  console.log("Controller hit");
  const { id: productId } = req.params;
  const { openingStock } = req.body;


  // Use the static method
  const stockRecord = await ItemStockRecord.updateStock(
    productId,
    openingStock,
    "Opening",
    "Opening Stock"
  );


  res.status(201).json(
    new apiResponse(201, stockRecord, "Opening stock created successfully")
  );
});


export { create_product_stock_record };
