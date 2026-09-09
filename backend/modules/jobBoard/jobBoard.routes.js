import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  publicJobs,
  publicApply,
  listPosts,
  createPost,
  updatePost,
  listApplications,
  decideApplication,
} from "./jobBoard.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN", "MANAGER", "hr"]);

/* Public job board */
router.get("/public/jobs", publicJobs);
router.post("/public/apply", publicApply);

/* Admin ATS */
router.get("/posts", admin, listPosts);
router.post("/posts", admin, createPost);
router.patch("/posts/:id", admin, updatePost);
router.get("/applications", admin, listApplications);
router.patch("/applications/:id", admin, decideApplication);

export default router;
