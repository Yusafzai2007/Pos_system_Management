import multer from "multer";

function random() {
  return (1000 + Math.random() * 90000).toString();
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    const genrate = random();
    cb(null, genrate + "." + ext);
  },
});

export const upload = multer({
  storage,
});