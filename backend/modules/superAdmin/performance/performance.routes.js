import express from "express";
import * as controller from "./performance.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER", "TL"]));

router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

// extra
router.get("/stats", controller.getStats);
router.get("/employee/:employeeId", controller.getByEmployee);
router.post("/bulk-update", controller.bulkUpdate);
router.get("/export", controller.exportReport);
router.get("/employees", controller.getEmployees);
export default router;
