import mongoose from "mongoose";

const productBarcodeSchema = new mongoose.Schema(
  {
    stock_productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
      required: true,
    },
    barcode_serila: {
      type: String,
      required: true,
    },
    stockInId: {
      type: String,
      default: null,
    },
    stockoutId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const ProductBarcode = mongoose.model(
  "product_barcode",
  productBarcodeSchema
);
