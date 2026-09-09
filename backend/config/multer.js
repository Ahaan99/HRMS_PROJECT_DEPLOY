import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

/* Shared uploader for public forms (logo / resume) and lead sheet imports.
   Only document, image and spreadsheet types are accepted; everything else
   (scripts, executables, archives) is rejected before it reaches a handler. */
const ALLOWED_EXT = new Set([
  ".pdf", ".doc", ".docx", ".txt", ".rtf",
  ".xls", ".xlsx", ".csv",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
]);

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      const err = new Error("Unsupported file type. Allowed: PDF, Word, text, Excel/CSV and images.");
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});
