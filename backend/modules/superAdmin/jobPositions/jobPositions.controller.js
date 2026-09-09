// jobPositions.controller.js

import * as service from "./jobPositions.service.js";

export const createJobPosition = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title required" });
    }

    await service.createJobPosition(title);

    res.json({ success: true, message: "Job position created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const getJobPositions = async (req, res) => {
  try {
    const data = await service.getJobPositions();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};