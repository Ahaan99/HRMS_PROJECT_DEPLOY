import * as service from "./interviews.service.js";

// ================= GET
export const getClientInterviews = async (req, res) => {
  try {
    const data = await service.getClientInterviewsService(
      req.client.client_code
    );

    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// ================= UPDATE
export const updateClientDecision = async (req, res) => {
  try {
    await service.updateClientDecisionService(
      req.client.client_code,
      req.params.id,
      req.body
    );

    res.json({ success: true, message: "Decision updated" });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};