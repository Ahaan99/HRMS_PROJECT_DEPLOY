// One-off: wire validateSalePayload into createSale/updateSale (edit tool dropped it).
import fs from "node:fs";
const file = new URL("../modules/sales/reports/salesReport.controller.js", import.meta.url);
let s = fs.readFileSync(file, "utf8");
const before = s;

const destructure = `    const {
      client_code,
      plan_name,
      billing_months,
      amount,
      amount_paid,
      payment_status,
      payment_method,
      purchase_date,
      start_date,
      due_date,
      subscription_status,
      remarks,
    } = req.body;`;

const validated = `    const validated = validateSalePayload(req.body);
    if (!validated.ok) {
      return res.status(400).json({ message: validated.message });
    }
    const {
      client_code,
      plan_name,
      billing_months,
      amount,
      amount_paid,
      payment_status,
      payment_method,
      purchase_date,
      start_date,
      due_date,
      subscription_status,
      remarks,
    } = validated.data;`;

const count = s.split(destructure).length - 1;
if (count !== 2) throw new Error(`expected 2 destructure blocks, found ${count}`);
s = s.split(destructure).join(validated);

s = s.replace(/\n    console\.log\("saleId:", saleId\);\r?\n    console\.log\("employeeId from token:", employeeId\);/, "");
s = s.replace(
  /res\.json\(\{ message: "Sale created", id: result\.insertId \}\);\r?\n  \} catch \(err\) \{\r?\n    console\.error\("Create sale error:", err\);\r?\n    res\.status\(500\)\.json\(\{ message: "Server error" \}\);/,
  `res.status(201).json({ message: "Sale created", id: result.insertId });
  } catch (err) {
    console.error("Create sale error:", err);
    res.status(err.status || 500).json({ message: err.status ? err.message : "Server error" });`,
);
s = s.replace(
  /console\.error\("Update sale error:", err\);\r?\n    res\.status\(500\)\.json\(\{ message: "Server error" \}\);/,
  `console.error("Update sale error:", err);
    res.status(err.status || 500).json({ message: err.status ? err.message : "Server error" });`,
);

if (s === before) throw new Error("no change");
fs.writeFileSync(file, s, "utf8");
console.log("validateSalePayload calls:", (s.match(/validateSalePayload\(req\.body\)/g) || []).length);
console.log("err.status handlers:", (s.match(/err\.status \|\| 500/g) || []).length);
