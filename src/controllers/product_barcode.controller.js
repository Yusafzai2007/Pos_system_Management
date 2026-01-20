import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { ProductBarcode } from "../models/product_barcode.model.js";

const create_barcode = asynhandler(async (req, res) => {
  const { id: stock_productId } = req.params;

  const { barcode_serila, stockInId, stockoutId } = req.body;

  if (!stock_productId) {
    throw new apiError(400, "stock_productId are required");
  }

  if (
    !barcode_serila ||
    !Array.isArray(barcode_serila) ||
    barcode_serila.length === 0
  ) {
    throw new apiError(400, "barcode_serila must be a non-empty array");
  }

  // Check for duplicates
  const existingBarcodes = await ProductBarcode.find({
    stock_productId,
    barcode_serila: { $in: barcode_serila }
  });

  if (existingBarcodes.length > 0) {
    throw new apiError(400, "Some barcodes already exist");
  }

  const barcodedocs = barcode_serila.map((barcode) => ({
    stock_productId,
    barcode_serila: barcode,
    stockInId: stockInId || null,
    stockoutId: stockoutId || null,
  }));

  const create_barcode = await ProductBarcode.insertMany(barcodedocs);

  res
    .status(201)
    .json(
      new apiResponse(201, create_barcode, "Barcodes created successfully")
    );
});

const delete_barcode = asynhandler(async (req, res) => {
  const { id } = req.params;
  const barcode = await ProductBarcode.findByIdAndDelete(id);

  if (!barcode) {
    throw new apiError(404, "Barcode not found");
  }
  res
    .status(200)
    .json(new apiResponse(200, null, "Barcode deleted successfully"));
});

const get_all_barcodes = asynhandler(async (req, res) => {
  const barcodes = await ProductBarcode.find();
  if (barcodes.length === 0) {
    throw new apiError(404, "No barcodes found");
  }
  res
    .status(200)
    .json(new apiResponse(200, barcodes, "Barcodes retrieved successfully"));
});

const update_single_barcode = asynhandler(async (req, res) => {
  const { id } = req.params; // barcode document _id
  const { barcode_serila, stockInId, stockoutId } = req.body;

  const barcode = await ProductBarcode.findById(id);

  if (!barcode) {
    throw new apiError(404, "Barcode not found");
  }

  // Check for duplicate barcode
  if (barcode_serila && barcode_serila !== barcode.barcode_serila) {
    const existingBarcode = await ProductBarcode.findOne({
      stock_productId: barcode.stock_productId,
      barcode_serila: barcode_serila,
      _id: { $ne: id }
    });

    if (existingBarcode) {
      throw new apiError(400, "Barcode already exists for this product");
    }
  }

  // Update fields
  if (barcode_serila) barcode.barcode_serila = barcode_serila;
  if (stockInId !== undefined) barcode.stockInId = stockInId;
  if (stockoutId !== undefined) barcode.stockoutId = stockoutId;

  await barcode.save();

  res.status(200).json(
    new apiResponse(200, barcode, "Barcode updated successfully")
  );
});

export { create_barcode, get_all_barcodes, delete_barcode, update_single_barcode };