import express from "express";
import cookieParser from "cookie-parser";
const app = express();
import { apiError } from "./utils/apiError.js";
import cors from "cors";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userroutes from "./routes/user.route.js";
import product_group from "./routes/product_group.route.js";
import create_item from "./routes/item.route.js";
import product_barcode from "./routes/product_barcode.route.js";
import product_stock_record from "./routes/product_stock_record.route.js";
import stockIn_category from "./routes/stockIn_category.route.js";
import stockout_category from "./routes/stockout_category.route.js";

app.use("/api/v1/pos", userroutes);
app.use("/api/v1/pos", product_group);
app.use("/api/v1/pos", create_item);
app.use("/api/v1/pos", product_barcode);
app.use("/api/v1/pos", product_stock_record);
app.use("/api/v1/pos", stockIn_category);
app.use("/api/v1/pos", stockout_category);
// ================= Error Handling =================
app.use((err, req, res, next) => {
  if (err instanceof apiError) {
    return res.status(err.statuscode).json({
      success: false,
      message: err.message,
      error: err.error || [],
    });
  }
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
