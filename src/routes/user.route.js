import { Router } from "express";
import {
  createaccount,
  currentuser,
  deleteuser,
  logout_user,
  singleuser,
  update_user,
  user_login,
  users,
} from "../controllers/user.controller.js";
import { jwtverify } from "../middlewares/auth.middleware.js";

const route = Router();

route.post("/signup", createaccount);

route.post("/login", user_login);

route.post("/logout", jwtverify, logout_user);

route.get("/users", users);

route.get("/current_user", jwtverify, currentuser);

route.delete("/deleteuser/:id", deleteuser);

route.put("/updaeuser/:id", update_user);

route.get("/singleuser/:id", singleuser);

export default route;
