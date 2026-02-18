import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryimg = async (localapth) => {
  try {
    if (!localapth) return null;

    const response = await cloudinary.uploader.upload(localapth);
    console.log(response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localapth);
  }
};

export { cloudinaryimg };
