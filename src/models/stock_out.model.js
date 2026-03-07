// models/stockOut.model.js
import mongoose from "mongoose";

const stockOutSchema = new mongoose.Schema(
  {
    itemId: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "item",
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
      ref: "StockoutCategory",
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
    },
    
    date: {
      type: Date,
      default: Date.now,
    },
    
    invoiceNo: {
      type: String,
      sparse: true,
      default: null,
      required: false,
    },
    
    // Payment Method Field
    paymentMethod: {
      type: String,
      enum: ['cash', 'online'],
      required: true,
      default: 'cash'
    },
    
    // Transaction ID for online payments
    transactionId: {
      type: String,
      sparse: true,
      default: null,
      required: false
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