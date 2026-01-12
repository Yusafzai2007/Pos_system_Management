import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectdb = async () => {
  try {
    const response = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(
      `mongodb connected to ${process.env.MONGO_URL}/${DB_NAME} successfully`
    );
    return response;
  } catch (error) {
    console.log(`mongodb connection error ${error}`);
  }
};

export { connectdb };
