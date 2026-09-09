export const EMPLOYEE_ROLE = "CLIENT_EMPLOYEE";

// Modules that are always available to a client admin regardless of Master Control.
export const ALWAYS_ON = [
  "OVERVIEW",
  "PROPOSALS",
  "AGREEMENTS",
  "SOP_LIBRARY",
  "LEAVE_APPROVALS",
  "OFFER_LETTERS",
  "EMPLOYEE_SEARCH",
  "INVOICES",
];

// Modules whose backend routes accept a CLIENT_EMPLOYEE token and scope data to
// that employee. Everything else is admin-only on the server (403), so it must
// not be offered to employees in the UI either.
export const EMPLOYEE_FEATURES = [
  "OVERVIEW",
  "SALES_REPORT",
  "PERFORMANCE_TRACKER",
  "WORK_POLICY",
  "WORK_TARGET",
  "WORK_ASSIGNMENT",
  "LEADS",
  "INVENTORY",
];

export const isEmployeeRole = (client) => client?.role === EMPLOYEE_ROLE;

export function canAccessFeature(featureKey, { client, enabledFeatures }) {
  if (isEmployeeRole(client)) {
    if (!EMPLOYEE_FEATURES.includes(featureKey)) return false;
    return featureKey === "OVERVIEW" || (enabledFeatures || []).includes(featureKey);
  }
  if (ALWAYS_ON.includes(featureKey)) return true;
  return (enabledFeatures || []).includes(featureKey);
}
