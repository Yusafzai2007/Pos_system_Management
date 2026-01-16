import mongoose from "mongoose";

const stockOutSchema = new mongoose.Schema(
  {
    itemId: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
        },
      ],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one item ID is required",
      },
    },

    stockOutCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "stockOutCategory",
      required: true,
    },
    Total_sale: {
      type: Number,
      required: true,
    },

    quantity: {
      type: [Number],
      default: [0],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one quantity is required",
      },
    },

    stockOutDate: {
      type: Date,
      required: true,
      // default: Date.now,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    invoiceNo: {
      type: String,
      sparse: true, // Allows multiple documents with null/undefined values
      default: null, // Use null instead of empty string
      required: false,
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

export const StockOut = mongoose.model("StockOut", stockOutSchema);
