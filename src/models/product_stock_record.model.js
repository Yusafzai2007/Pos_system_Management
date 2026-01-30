import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

// Transaction schema
const TransactionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  quantity: { type: Number, required: true },
  type: {
    type: String,
    enum: ["Stock-In", "Stock-Out", "Opening"],
    required: true,
  },
  reference: { type: String, required: true },

  // ✅ Prices added here
  costPrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
});

// Item Stock Record Schema
const itemStockRecordSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    stockInId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockIn",
      default: null,
    },
    stockOutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockOut",
      default: null,
    },
    openingStock: {
      type: Number,
      default: 0,
    },
    remainingStock: { type: Number, required: true },
    transactions: [TransactionSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
itemStockRecordSchema.index({ productId: 1 });
itemStockRecordSchema.index({ stockInId: 1 });
itemStockRecordSchema.index({ stockOutId: 1 });

// Pre save check
itemStockRecordSchema.pre("save", function () {
  if (this.remainingStock < -10000) {
    throw new Error("Stock level too low");
  }
});

itemStockRecordSchema.statics.updateStock = async function (
  productId,
  quantity,
  type,
  reference,
  prices = {}
) {
  let record = await this.findOne({ productId });

  // 🟢 FIRST TIME (Opening / First Stock-In)
  if (!record) {
    record = new this({
      productId,
      openingStock: type === "Opening" ? quantity : 0,
      remainingStock: quantity,
      transactions: [
        {
          date: new Date(),
          quantity: Math.abs(quantity),
          type,
          reference,
          ...prices,
        },
      ],
    });
  } else {
    // ❌ Opening dobara allow nahi
    if (type === "Opening") {
      throw new Error("Opening stock can be set only once");
    }

    // ✅ Stock add / minus
    record.remainingStock += quantity;

    // ✅ HAR Stock-In / Stock-Out ki NEW history
    record.transactions.push({
      date: new Date(),
      quantity: Math.abs(quantity),
      type,
      reference,
      ...prices,
    });
  }

  await record.save();
  return record;
};





// Instance method
itemStockRecordSchema.methods.getCurrentStock = function () {
  return this.remainingStock;
};

const ItemStockRecord = mongoose.model(
  "ItemStockRecord",
  itemStockRecordSchema
);

export default ItemStockRecord;
