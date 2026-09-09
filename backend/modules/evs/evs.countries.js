/**
 * International document registry for the Employee Verification System.
 * Ported 1:1 from the old FastAPI international_routes.py COUNTRY_REGISTRY.
 */
export const COUNTRY_REGISTRY = {
  NP: {
    name: "Nepal",
    documents: {
      citizenship: {
        label: "Citizenship Certificate (Nagarikta)",
        hint: "District-issued number, digits with - or / (e.g. 12-01-75-01234)",
        pattern: /^[0-9]{1,6}([-/][0-9]{1,6}){0,3}$/,
        min_len: 5,
        max_len: 20,
      },
      national_id: {
        label: "National Identity Card (NIN)",
        hint: "10-digit National Identification Number",
        pattern: /^\d{10}$/,
        min_len: 10,
        max_len: 10,
      },
      passport: {
        label: "Passport",
        hint: "2 letters followed by 7 digits (e.g. PA1234567)",
        pattern: /^[A-Z]{2}\d{7}$/,
        min_len: 9,
        max_len: 9,
      },
    },
  },
  BT: {
    name: "Bhutan",
    documents: {
      cid: {
        label: "Citizenship Identity Card (CID)",
        hint: "11-digit CID number",
        pattern: /^\d{11}$/,
        min_len: 11,
        max_len: 11,
      },
      passport: {
        label: "Passport",
        hint: "1 letter followed by 7 digits (e.g. A1234567)",
        pattern: /^[A-Z]\d{7}$/,
        min_len: 8,
        max_len: 8,
      },
    },
  },
  BD: {
    name: "Bangladesh",
    documents: {
      nid: {
        label: "National ID Card (NID)",
        hint: "10, 13, or 17-digit NID number",
        pattern: /^(\d{10}|\d{13}|\d{17})$/,
        min_len: 10,
        max_len: 17,
      },
      birth_reg: {
        label: "Birth Registration Certificate",
        hint: "17-digit birth registration number",
        pattern: /^\d{17}$/,
        min_len: 17,
        max_len: 17,
      },
      passport: {
        label: "Passport",
        hint: "2 letters followed by 7 digits (e.g. BR1234567)",
        pattern: /^[A-Z]{2}\d{7}$/,
        min_len: 9,
        max_len: 9,
      },
    },
  },
  LK: {
    name: "Sri Lanka",
    documents: {
      nic: {
        label: "National Identity Card (NIC)",
        hint: "Old: 9 digits + V/X (e.g. 851234567V) or New: 12 digits",
        pattern: /^(\d{9}[VvXx]|\d{12})$/,
        min_len: 10,
        max_len: 12,
      },
      passport: {
        label: "Passport",
        hint: "1 letter followed by 7 or 8 digits (e.g. N1234567)",
        pattern: /^[A-Z]\d{7,8}$/,
        min_len: 8,
        max_len: 9,
      },
    },
  },
  AF: {
    name: "Afghanistan",
    documents: {
      tazkira: {
        label: "Tazkira (National ID)",
        hint: "Electronic Tazkira number, 10 to 14 digits",
        pattern: /^\d{10,14}$/,
        min_len: 10,
        max_len: 14,
      },
      passport: {
        label: "Passport",
        hint: "1-2 letters followed by 7 digits (e.g. P1234567)",
        pattern: /^[A-Z]{1,2}\d{7}$/,
        min_len: 8,
        max_len: 9,
      },
    },
  },
  MV: {
    name: "Maldives",
    documents: {
      national_id: {
        label: "National Identity Card",
        hint: "Letter A followed by 6 digits (e.g. A123456)",
        pattern: /^A\d{6}$/,
        min_len: 7,
        max_len: 7,
      },
      passport: {
        label: "Passport",
        hint: "2 letters followed by 7 digits",
        pattern: /^[A-Z]{2}\d{7}$/,
        min_len: 9,
        max_len: 9,
      },
    },
  },
  OTHER: {
    name: "Other Country",
    documents: {
      passport: {
        label: "Passport (International)",
        hint: "6 to 12 letters/digits as printed on the passport",
        pattern: /^[A-Z0-9]{6,12}$/,
        min_len: 6,
        max_len: 12,
      },
    },
  },
};

export function maskDoc(value) {
  const tail = value.length > 3 ? value.slice(-3) : value.slice(-1);
  return "X".repeat(Math.max(value.length - tail.length, 4)) + tail;
}

/** Returns { cleaned, doc, error } */
export function validateDoc(countryCode, docType, number) {
  const country = COUNTRY_REGISTRY[countryCode];
  if (!country) return { error: "Unsupported country" };

  const doc = country.documents[docType];
  if (!doc) return { error: "Unsupported document type for this country" };

  const cleaned = String(number || "").trim().toUpperCase().replace(/\s/g, "");
  if (!cleaned) return { error: "Document number is required" };

  if (!doc.pattern.test(cleaned)) {
    return { error: `Invalid ${doc.label} format. Expected: ${doc.hint}` };
  }
  return { cleaned, doc, error: null };
}

export function listCountries() {
  return Object.entries(COUNTRY_REGISTRY).map(([code, info]) => ({
    code,
    name: info.name,
    documents: Object.entries(info.documents).map(([type, d]) => ({
      type,
      label: d.label,
      hint: d.hint,
      max_len: d.max_len,
    })),
  }));
}
