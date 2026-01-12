import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    itemGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product_group",
      required: true,
    },
    item_Name: {
      type: String,
      required: true,
    },
    item_Description: {
      type: String,
      required: true,
    },
    actual_item_price: {
      type: Number,
      required: true,
    },
    selling_item_price: {
      type: Number,
      required: true,
    },
    item_discount_price: {
      type: Number,
      default: 0,
    },
    item_final_price: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    modelNoSKU: {
      type: String,
      required: true,
      unique: true,
    },
    serialNo: {
      type:Boolean,
      default: false,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ["piece", "kg", "gram", "liter", "ml", "box", "pack"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const item = mongoose.model("item", itemSchema);
