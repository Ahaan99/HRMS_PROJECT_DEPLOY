import xlsx from "xlsx";

// Header matching is case/spacing/punctuation-insensitive so exported sheets
// ("Client Name", "Mobile No.", "phone_number") all map to name / phone.
const normalize = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, "");
const NAME_HEADERS = ["fullname", "name", "clientname", "customername", "leadname", "contactname", "candidatename", "person"];
const PHONE_HEADERS = ["mobileno", "mobile", "mobilenumber", "phone", "phoneno", "phonenumber", "contact", "contactno", "contactnumber", "whatsapp"];

const findColumn = (headers, candidates) => {
  const map = new Map(headers.map((h) => [normalize(h), h]));
  for (const c of candidates) if (map.has(c)) return map.get(c);
  return headers.find((h) => candidates.some((c) => normalize(h).includes(c))) || null;
};

/**
 * Parse the first sheet of an uploaded workbook into [{ name, phone }].
 * Throws an Error with a user-facing message (status 400) when nothing usable is found.
 */
export function parseLeadSheet(buffer) {
  const workbook = xlsx.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  if (!data.length) throw badRequest("The first sheet is empty");

  const headers = Object.keys(data[0]);
  const nameKey = findColumn(headers, NAME_HEADERS);
  const phoneKey = findColumn(headers, PHONE_HEADERS);
  if (!nameKey && !phoneKey) {
    throw badRequest(
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

  if (!leads.length) throw badRequest("No leads found in the uploaded file");
  return leads;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}
