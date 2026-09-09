import * as service from "./agreementTemplates.service.js";

export const createTemplate = async (
  req,
  res
) => {

  
  console.log("BODY:", req.body);

  console.log("FILES:", req.files);

  console.log(
    "TEMPLATE FILE:",
    req.files?.templateFile?.[0]
  );
  try {
    const { template_name } = req.body;

    const file =
      req.files?.templateFile?.[0]?.filename
        ? `/api/uploads/agreement-templates/${req.files.templateFile[0].filename}`
        : null;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Template PDF required",
      });
    }
     
   console.log("REQ FILES:", req.files);

console.log(
  "UPLOADED FILE:",
  req.files?.templateFile?.[0]
);

console.log(
  "FILENAME:",
  req.files?.templateFile?.[0]?.filename
);

console.log(
  "PATH:",
  req.files?.templateFile?.[0]?.path
);


    await service.createTemplate({
      template_name,
      template_file: file,
    });

    res.status(201).json({
      success: true,
      message: "Template uploaded",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const getTemplates = async (
  req,
  res
) => {

   console.log("GET TEMPLATES HIT");
  try {
    const data =
      await service.getTemplates();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};