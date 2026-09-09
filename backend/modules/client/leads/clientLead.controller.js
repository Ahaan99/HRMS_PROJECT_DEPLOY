import * as service from "./clientLead.service.js";
import xlsx from "xlsx";

// Resolve the caller's tenant scope from clientUnifiedAuthMiddleware.
//   client_admin     -> req.client   { id, client_code }
//   CLIENT_EMPLOYEE  -> req.employee { employee_id, client_id }
// Check the employee first: Node's IncomingMessage already exposes `req.client`
// (the TCP socket), so its mere presence does not mean the caller is an admin.
const scopeOf = (req) => {
  if (req.employee?.employee_id) {
    return { clientId: req.employee.client_id, employeeId: req.employee.employee_id, isAdmin: false };
  }
  if (req.client?.client_code && req.client.id) {
    return { clientId: req.client.id, employeeId: null, isAdmin: true };
  }
  return null;
};

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// Header matching is case/spacing/punctuation-insensitive so exported sheets
// ("Client Name", "Mobile No.", "phone_number") all map to name / phone.
const normalize = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, "");
const NAME_HEADERS = ["fullname", "name", "clientname", "customername", "leadname", "contactname", "person"];
const PHONE_HEADERS = ["mobileno", "mobile", "mobilenumber", "phone", "phoneno", "phonenumber", "contact", "contactno", "contactnumber", "whatsapp"];
const findColumn = (headers, candidates) => {
  const map = new Map(headers.map((h) => [normalize(h), h]));
  for (const c of candidates) if (map.has(c)) return map.get(c);
  return headers.find((h) => candidates.some((c) => normalize(h).includes(c))) || null;
};

// 🔥 UPLOAD (client admin only)
export const uploadClientLeads = async (req, res) => {
  try {
    const scope = scopeOf(req);
    if (!scope?.isAdmin) return fail(res, 403, "Only client admins can upload leads");
    const file = req.file;
    if (!file) return fail(res, 400, "Excel file is required");
    const { assignedTo } = req.body;
    if (!assignedTo) return fail(res, 400, "assignedTo is required");

    const workbook = xlsx.read(file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (!data.length) return fail(res, 400, "The first sheet is empty");

    const headers = Object.keys(data[0]);
    const nameKey = findColumn(headers, NAME_HEADERS);
    const phoneKey = findColumn(headers, PHONE_HEADERS);
    if (!nameKey && !phoneKey) {
      return fail(
        res,
        400,
        `Could not find a name or phone column. Found: ${headers.join(", ")}. ` +
          `Use headers like "Full Name" / "Mobile No." (or Name, Client Name, Phone, Contact).`,
      );
    }

    const leads = data
      .map((row) => ({
        name: String(nameKey ? row[nameKey] : "").trim() || null,
        phone: String(phoneKey ? row[phoneKey] : "").trim() || null,
      }))
      .filter((l) => l.name || l.phone);

    if (!leads.length) return fail(res, 400, "No leads found in the uploaded file");

    const batchId = await service.createBatch(file.originalname, leads.length, scope.clientId, assignedTo);
    await service.insertLeads(leads, batchId, scope.clientId, assignedTo);

    res.json({ success: true, data: { batchId, total: leads.length } });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    fail(res, 500, err.message);
  }
};

// 🔥 BATCHES (admin: all batches of the client; employee: only batches with leads assigned to them)
export const getClientBatches = async (req, res) => {
  try {
    const scope = scopeOf(req);
    if (!scope) return fail(res, 403, "Invalid role");
    const data = await service.getBatches(scope.clientId, scope.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("BATCH ERROR:", err);
    fail(res, 500, err.message);
  }
};

// 🔥 LEADS OF ONE BATCH (tenant-scoped; employees only see their own rows)
export const getClientLeadsByBatch = async (req, res) => {
  try {
    const scope = scopeOf(req);
    if (!scope) return fail(res, 403, "Invalid role");
    const data = await service.getLeadsByBatch(req.params.id, scope.clientId, scope.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("LEADS BY BATCH ERROR:", err);
    fail(res, 500, err.message);
  }
};

// 🔥 MY LEADS (client employee)
export const getEmployeeLeads = async (req, res) => {
  try {
    const scope = scopeOf(req);
    if (!scope) return fail(res, 403, "Invalid role");
    if (scope.isAdmin) {
      // admins have no "my" leads — return all leads of the tenant instead of crashing
      const data = await service.getClientLeads(scope.clientId);
      return res.json({ success: true, data });
    }
    const data = await service.getEmployeeLeads(scope.employeeId, scope.clientId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("MY LEADS ERROR:", err);
    fail(res, 500, err.message);
  }
};

// 🔥 UPDATE (scoped to the caller's tenant; employees may only update leads assigned to them)
export const updateClientLead = async (req, res) => {
  try {
    const scope = scopeOf(req);
    if (!scope) return fail(res, 403, "Invalid role");
    const { status, remarks } = req.body || {};
    if (!status) return fail(res, 400, "status is required");

    const affected = await service.updateLead(req.params.id, { status, remarks }, scope.clientId, scope.employeeId);
    if (!affected) return fail(res, 404, "Lead not found");
    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE LEAD ERROR:", err);
    fail(res, 500, err.message);
  }
};
