import multer from "multer";
import path from "path";
import fs from "fs";

// 🔥 OUTSIDE PROJECT (IMPORTANT)
const BASE_UPLOAD_PATH = path.join(process.cwd(), "uploads");

// ensure folder exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    // 👇 detect file type (you can customize)
    if (file.fieldname === "cv_file") {
      folder = "cv";
    } else if (file.fieldname === "photo") {
      folder = "profile";
    } else if (file.fieldname === "signature") {
      folder = "signature";
    } else if (file.fieldname === "agreementPdf") {
  folder = "client-agreements";
    }else if (file.fieldname === "templateFile") {
  folder = "agreement-templates";
} else if (
  file.fieldname === "sopFile" ||
  file.fieldname === "reportFile" ||
  file.fieldname === "sheetFile" ||
  file.fieldname === "sourceCodeFile" ||
  file.fieldname === "videoFile" ||
  file.fieldname === "projectReportFile"
) {
  folder = "sops";
}

    const fullPath = path.join(BASE_UPLOAD_PATH, folder);

    ensureDir(fullPath);

    cb(null, fullPath);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// const upload = multer({ storage });

const fileFilter = (req, file, cb) => {
  if (
    file.fieldname === "agreementPdf" &&
    file.mimetype !== "application/pdf"
  ) {
    return cb(
      new Error("Only PDF files are allowed"),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter,
});

// Dedicated SOP uploader: project reports (pdf/doc/docx), spreadsheets,
// source code archives (zip/rar/7z), and walkthrough videos (mp4/webm/mkv/avi/mov)
const SOP_ALLOWED_EXT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
  ".zip",
  ".rar",
  ".7z",
  ".mp4",
  ".webm",
  ".mkv",
  ".avi",
  ".mov",
];

const sopFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!SOP_ALLOWED_EXT.includes(ext)) {
    return cb(
      new Error(
        "Unsupported file type. Allowed: documents (pdf/doc/xls/ppt/txt), archives (zip/rar/7z), videos (mp4/webm/mkv/avi/mov)",
      ),
      false,
    );
  }
  cb(null, true);
};

export const sopUpload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB for videos / source archives
  },
  fileFilter: sopFileFilter,
});

// ---- Multi-file SOP uploader: one field per file kind ----
// reportFile (pdf/doc/ppt/txt) 200MB, sheetFile (xls/csv) 200MB,
// sourceCodeFile (zip/rar/7z) 500MB, videoFile (mp4/webm/mkv/avi/mov) 200MB
export const SOP_FIELD_RULES = {
  reportFile: {
    kind: "report",
    exts: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md"],
    maxBytes: 200 * 1024 * 1024,
    label: "Report (PDF/DOC/PPT/TXT, max 200MB)",
  },
  sheetFile: {
    kind: "sheet",
    exts: [".xls", ".xlsx", ".csv"],
    maxBytes: 200 * 1024 * 1024,
    label: "Sheet (XLS/XLSX/CSV, max 200MB)",
  },
  sourceCodeFile: {
    kind: "source_code",
    exts: [".zip", ".rar", ".7z"],
    maxBytes: 500 * 1024 * 1024,
    label: "Source code (ZIP/RAR/7Z, max 500MB)",
  },
  videoFile: {
    kind: "video",
    exts: [".mp4", ".webm", ".mkv", ".avi", ".mov"],
    maxBytes: 200 * 1024 * 1024,
    label: "Video (MP4/WEBM/MKV/AVI/MOV, max 200MB)",
  },
  projectReportFile: {
    kind: "project_report",
    exts: [".pdf", ".doc", ".docx"],
    maxBytes: 200 * 1024 * 1024,
    label: "Project Report (PDF/DOC/DOCX, max 200MB)",
  },
};

const sopMultiFileFilter = (req, file, cb) => {
  const rule = SOP_FIELD_RULES[file.fieldname];
  if (!rule) {
    return cb(new Error(`Unexpected upload field: ${file.fieldname}`), false);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (!rule.exts.includes(ext)) {
    return cb(
      new Error(`${rule.label}: "${ext}" is not an allowed file type`),
      false,
    );
  }
  cb(null, true);
};

export const sopMultiUpload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // hard cap (source code); per-field re-checked below
  },
  fileFilter: sopMultiFileFilter,
}).fields(Object.keys(SOP_FIELD_RULES).map((name) => ({ name, maxCount: 1 })));

// Per-field size enforcement (multer's fileSize limit is global). Deletes
// any oversized file from disk and rejects the request.
export const sopValidateSizes = (req, res, next) => {
  const files = req.files || {};
  for (const [field, arr] of Object.entries(files)) {
    const rule = SOP_FIELD_RULES[field];
    if (!rule) continue;
    for (const f of arr) {
      if (f.size > rule.maxBytes) {
        // remove everything uploaded in this request
        for (const a of Object.values(files)) {
          for (const g of a) {
            try {
              fs.unlinkSync(g.path);
            } catch {
              /* ignore */
            }
          }
        }
        return res.status(400).json({
          message: `${rule.label}: "${f.originalname}" is ${(f.size / (1024 * 1024)).toFixed(1)}MB which exceeds the limit`,
        });
      }
    }
  }
  next();
};

export default upload;
