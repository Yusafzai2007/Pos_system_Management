import mongoose from "mongoose";

// ---------------- TRANSACTION SCHEMA ----------------
const TransactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  quantity: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["Opening", "Stock-In", "Stock-Out"],
    required: true,
  },
  reference: {
    type: String,
    required: true,
  },

  costPrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
});

// ---------------- MAIN STOCK SCHEMA ----------------
const itemStockRecordSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
      required: true,
      unique: true,
    },

    openingStock: {
      type: Number,
      default: 0,
    },

    remainingStock: {
      type: Number,
      required: true,
    },

    transactions: [TransactionSchema],
  },
  { timestamps: true }
);

// ---------------- STATIC METHOD ----------------
itemStockRecordSchema.statics.updateStock = async function ({
  productId,
  quantity,
  type,
  reference,
  prices = {},
}) {
  let record = await this.findOne({ productId });

  // 🟢 FIRST ENTRY
  if (!record) {
    if (type !== "Opening") {
      throw new Error("Opening stock required for first entry");
    }

    record = new this({
      productId,
      openingStock: quantity,
      remainingStock: quantity,
      transactions: [
        {
          quantity,
          type: "Opening",
          reference,
          ...prices,
        },
      ],
    });
  } else {
    // ❌ Opening dobara allow nahi
    if (type === "Opening") {
      throw new Error("Opening stock already set");
    }

    // ➕ ➖ Stock calculation
    record.remainingStock += quantity;

    if (record.remainingStock < 0) {
      throw new Error("Insufficient stock");
    }

    record.transactions.push({
      quantity: Math.abs(quantity),
      type,
      reference,
      ...prices,
    });
  }

  await record.save();
  return record;
};

// ---------------- INSTANCE METHOD ----------------
itemStockRecordSchema.methods.getCurrentStock = function () {
  return this.remainingStock;
};

const ItemStockRecord = mongoose.model(
  "ItemStockRecord",
  itemStockRecordSchema
);

export default ItemStockRecord;
