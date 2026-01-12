import mongoose from "mongoose";

const ItemGroupSchema = new mongoose.Schema(
  {
    itemGroupName: {
      type: String,
      required: true,
    },
    group_description: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const product_group = mongoose.model("product_group", ItemGroupSchema);
