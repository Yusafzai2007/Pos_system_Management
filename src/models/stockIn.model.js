import mongoose from "mongoose";

const stockInSchema = new mongoose.Schema(
  {
    itemId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
    ],

    stcokIn_price:{
      type:Number,
      required:true
    },

    stockAdded: {
      type: [Number],
      required: true,
    },

    stockInDate: {
      type: Date,
      required: true,
    },

    stockInCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockInCategory",
      required: true,
    },

    invoiceNo: {
      type: String,
      unique: true,
      trim: true,
    },

    notes: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export const StockIn = mongoose.model("StockIn", stockInSchema);
