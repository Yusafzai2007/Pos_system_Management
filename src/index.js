import { connectdb } from "./db/index.js";
import app from "./app.js";

import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

connectdb()
  .then(() => {
    app.listen(process.env.PORT || 800, () => {
      console.log(`server running ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`server making errror ${err}`);
  });
