import * as candidateService from "./superAdminCandidates.service.js";

export const createCandidate = async (req, res) => {
  try {
    const data = await candidateService.createCandidate(req.body);

    return res.status(201).json({
      success: true,
      message: "Candidate created",
      candidate: data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to create candidate",
    });
  }
};

export const getAllCandidates = async (req, res) => {
  try {
    const data = await candidateService.getAllCandidates();

    return res.status(200).json({
      success: true,
      candidates: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch candidates",
    });
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const data = await candidateService.getCandidateById(req.params.id);

    return res.status(200).json({
      success: true,
      candidate: data,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || "Candidate not found",
    });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const data = await candidateService.updateCandidate(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Candidate updated",
      candidate: data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update candidate",
    });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    await candidateService.deleteCandidate(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Candidate deleted",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to delete candidate",
    });
  }
};
