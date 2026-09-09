import express from "express";

import {
  createTemplate,
  getTemplates,
} from "./agreementTemplates.controller.js";

import upload from "../../../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    {
      name: "templateFile",
      maxCount: 1,
    },
  ]),
  createTemplate
);

router.get("/", getTemplates);

export default router;