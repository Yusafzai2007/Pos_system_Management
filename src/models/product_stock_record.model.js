import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

// Transaction schema
const TransactionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  quantity: { type: Number, required: true },
  type: { type: String, enum: ["Stock-In", "Stock-Out", "Opening"], required: true },
  reference: { type: String, required: true },
});

// Item Stock Record Schema
const itemStockRecordSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    stockInId: { type: String, default: null },
    stockOutId: { type: String, default: null },
    openingStock: { type: Number, default: 0 },
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

// Auto-increment

// Safe and modern
itemStockRecordSchema.pre("save", function () {
  if (this.remainingStock < -10000) {
    throw new Error("Stock level too low");
  }
});





itemStockRecordSchema.statics.updateStock = async function (
  productId,
  quantity,
  type,
  reference
) {
  let record = await this.findOne({ productId });

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
        },
      ],
    });
  } else {
    record.remainingStock += quantity;
    record.transactions.push({
      date: new Date(),
      quantity: Math.abs(quantity),
      type,
      reference,
    });
  }

  // Use try/catch here to debug if save fails
  try {
    await record.save();
  } catch (err) {
    console.error("Error saving stock record:", err);
    throw new apiError(500, "Failed to save stock record");
  }

  return record;
};


// Instance method
itemStockRecordSchema.methods.getCurrentStock = function () {
  return this.remainingStock;
};

const ItemStockRecord = mongoose.model("ItemStockRecord", itemStockRecordSchema);
export default ItemStockRecord;
