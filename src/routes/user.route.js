import { Router } from "express";
import {
  createaccount,
  currentuser,
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


route.get("/current_user",jwtverify,currentuser)


export default route;
