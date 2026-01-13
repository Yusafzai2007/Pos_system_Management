import mongoose from "mongoose";

const stockoutCategorySchema = new mongoose.Schema(
  {
    stockoutCategoryName: {
      type: String,
      required: true,
      unique: true,
    },
    stockout_category_description: {
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

export const StockoutCategory = mongoose.model(
  "StockoutCategory",
  stockoutCategorySchema
);
