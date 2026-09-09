import * as service from "./lead.service.js";
import xlsx from "xlsx";

// 🔥 UPLOAD
export const uploadLeads = async (req, res) => {
  try {
    const file = req.file;
    const { assignedTo } = req.body; // 🔥 HR ID

    if (!assignedTo) {
      return res.status(400).json({ message: "HR is required" });
    }

    const workbook = xlsx.read(file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const leads = data.map((row) => ({
      name: row["Full Name"] || row.name,
      phone: row["Mobile No."] || row.phone,
    }));

    // 🔥 CREATE BATCH
    const batchId = await service.createBatch(
      file.originalname,
      leads.length,
      req.user.id,
      assignedTo // 🔥 ADD THIS
    );

    // 🔥 ASSIGN HR DURING INSERT
    const finalLeads = leads.map((l) => ({
      ...l,
      batch_id: batchId,
      assigned_to: assignedTo,
      assigned_by: req.user.id,
    }));

    await service.insertLeads(finalLeads);

    res.json({ success: true });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔥 ASSIGN
export const assignLead = async (req, res) => {
  try {
    await service.assignLead(
      req.params.id,
      req.body.assignedTo,
      req.user.id
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 UPDATE
export const updateLead = async (req, res) => {
  try {
    await service.updateLead(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 ADMIN VIEW
export const getAllLeads = async (req, res) => {
  const data = await service.getAllLeads();
  res.json({ success: true, data });
};

// 🔥 HR VIEW
export const getMyLeads = async (req, res) => {
  const data = await service.getMyLeads(req.user.id);
  res.json({ success: true, data });
};

export const getAllBatches = async (req, res) => {
  const data = await service.getAllBatches();
  res.json({ success: true, data });
};

