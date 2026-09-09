import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  listBenefits, createBenefit, updateBenefit, deleteBenefit,
  listTrainings, createTraining, updateTraining, deleteTraining,
  listAssignments, assignTraining, updateAssignment,
  listCertifications, createCertification, deleteCertification,
  listSkills, createSkill, updateSkill, deleteSkill,
} from "./benefits.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN"]);

router.get("/", admin, listBenefits);
router.post("/", admin, createBenefit);
router.put("/:id", admin, updateBenefit);
router.delete("/:id", admin, deleteBenefit);

router.get("/trainings/all", admin, listTrainings);
router.post("/trainings", admin, createTraining);
router.put("/trainings/:id", admin, updateTraining);
router.delete("/trainings/:id", admin, deleteTraining);

router.get("/assignments/all", admin, listAssignments);
router.post("/assignments", admin, assignTraining);
router.put("/assignments/:id", admin, updateAssignment);

router.get("/certifications/all", admin, listCertifications);
router.post("/certifications", admin, createCertification);
router.delete("/certifications/:id", admin, deleteCertification);

router.get("/skills/all", admin, listSkills);
router.post("/skills", admin, createSkill);
router.put("/skills/:id", admin, updateSkill);
router.delete("/skills/:id", admin, deleteSkill);

export default router;
