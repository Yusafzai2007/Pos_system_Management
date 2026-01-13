import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const jwtverify = asynhandler(async (req, res) => {
  const token =
    req.cookies?.isaccesstoken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new apiError(404, "Unauthorized request");
  }

  const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decode._id).select("-password");

  if (!user) {
    throw new apiError(400, "Unauthorized");
  }

  req.user = user;
  // No need to call next() — asynhandler will handle it
});

export { jwtverify };
