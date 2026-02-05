import mongoose from "mongoose";

const stockInSchema = new mongoose.Schema(
  {
    itemId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "item",
        required: true,
      },
    ],

    // 🔗 NEW: transaction linking
    transactions: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "item",
          required: true,
        },
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
      },
    ],

    stcokIn_price: {
      type: Number,
      required: true,
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
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);


export const StockIn = mongoose.model("StockIn", stockInSchema);
