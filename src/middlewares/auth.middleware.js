import { asynhandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const jwtverify = asynhandler(async (req, res, next) => {
  const token = req.cookies?.isaccesstoken || req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) throw new apiError(401, "Unauthorized request");

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decoded._id).select("-password");

  if (!user) throw new apiError(401, "Unauthorized");

  req.user = user;
  next(); // ✅ works now
});


export { jwtverify };
