import {
  addClientForm,
  addCandidateForm,
  getAllForms,
  getFormCount,
  getFormById,
  updateFormStatus,
  deleteForm,
} from "../../../models/formModel.js";

// Submit client form
export const submitClientForm = async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.email || !data.companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name and email are required",
      });
    }

    const result = await addClientForm(data);

    res.json({
      success: true,
      message: "Client form submitted successfully",
      formId: result.insertId,
    });
  } catch (error) {
    console.error("Submit client form error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit form",
    });
  }
};

// Submit candidate form
export const submitCandidateForm = async (req, res) => {
  try {
    const data = req.body;

    // Get resume path if file was uploaded
    let resumePath = null;
    if (req.file) {
      resumePath = `/uploads/${req.file.filename}`;
    }

    // Validate required fields
    if (!data.email || !data.fullName) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    const result = await addCandidateForm({
      ...data,
      resumePath,
    });

    res.json({
      success: true,
      message: "Candidate form submitted successfully",
      formId: result.insertId,
    });
  } catch (error) {
    console.error("Submit candidate form error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit form",
    });
  }
};

// Get all forms (with pagination)
export const getForms = async (req, res) => {
  try {
    const { type = null, page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;
    const forms = await getAllForms(type, limit, offset);
    const total = await getFormCount(type);

    res.json({
      success: true,
      data: {
        forms,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get forms error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch forms",
    });
  }
};

// Get single form
export const getForm = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await getFormById(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error("Get form error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch form",
    });
  }
};

// Update form status
export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    await updateFormStatus(id, status);

    res.json({
      success: true,
      message: "Form status updated successfully",
    });
  } catch (error) {
    console.error("Update form error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update form",
    });
  }
};

// Delete form
export const deleteFormHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteForm(id);

    res.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete form",
    });
  }
};
