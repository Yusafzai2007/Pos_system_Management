import { Router } from "express";
import {
  createaccount,
  logout_user,
  user_login,
  users,
} from "../controllers/user.controller.js";
import { jwtverify } from "../middlewares/auth.middleware.js";

const route = Router();

route.post(
  "/signup",
  createaccount
);

route.post("/login", user_login);

route.post("/logout", jwtverify, logout_user);

route.get("/users",users)


export default route;
