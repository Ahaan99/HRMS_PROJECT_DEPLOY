import multer from "multer";
import fs from "fs";
import path from "path";

const uploadPath = path.join(
  process.cwd(),
  "modules",
  "hr",
  "form",
  "uploads",
  "joining"
);

// create folder automatically
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  }
});

export const upload = multer({ storage });