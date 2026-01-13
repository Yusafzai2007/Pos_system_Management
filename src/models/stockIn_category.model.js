import mongoose from "mongoose";

const stockInCategorySchema = new mongoose.Schema(
  {
    stockInCategoryName: {
      type: String,
      required: true,
      unique: true,
    },
    category_description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const StockInCategory = mongoose.model(
  "StockInCategory",
  stockInCategorySchema
);
