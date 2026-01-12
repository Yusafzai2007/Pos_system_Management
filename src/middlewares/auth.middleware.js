import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const jwtverify = asynhandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.isaccesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(404, "unauthorized request");
    }

    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decode._id).select("-password");

    if (!user) {
      throw new apiError(400, "unauthorized");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, "invalid token please login again");
  }
});

export { jwtverify };
