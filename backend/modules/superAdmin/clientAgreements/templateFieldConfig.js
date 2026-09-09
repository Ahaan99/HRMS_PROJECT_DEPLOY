export const templateFieldConfig = {
  "1": {
    name: "HR Outsourcing Agreement",
    fields: {
      client_company_name: {
        page: 0,
        x: 340,
        y: 420,
        size: 14,
      },
      effective_date: {
        page: 0,
        x: 100,
        y: 360,
        size: 11,
      },
      duration: {
        page: 0,
        x: 100,
        y: 335,
        size: 11,
      },
      client_address: {
        page: 0,
        x: 100,
        y: 290,
        size: 10,
      },
      client_gst_number: {
        page: 0,
        x: 100,
        y: 265,
        size: 10,
      },
      client_representative_name: {
        page: 0,
        x: 100,
        y: 240,
        size: 11,
      }
    }
  },
};

export const getTemplateConfig = (templateId) => {
  return templateFieldConfig[templateId] || null;
};