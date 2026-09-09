import { logAudit } from "../utils/auditLogger.js";
import { db } from "../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id, company_name FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );

  if (!rows.length) return {};

  return {
    client_id: rows[0].id,
    user_name: rows[0].company_name,
  };
};

const formatAuditDetails = (action, body, params) => {
  switch (action) {
    case "ADD_INVENTORY":
      return `Added item "${body.item_name}" (Qty: ${body.quantity}, Price: ₹${body.price})`;

    case "UPDATE_INVENTORY":
      return `Updated item "${body.item_name}"`;

    case "DELETE_INVENTORY":
      return `Deleted inventory item`;

    case "ADD_ASSET":
      return `Added asset "${body.asset_name}" (₹${body.value})`;

    case "UPDATE_ASSET":
      return `Updated asset "${body.asset_name}"`;

    case "DELETE_ASSET":
      return `Deleted asset`;

    case "ADD_PURCHASE_ORDER":
      return `Created order for "${body.vendor_name}" (₹${body.total_amount})`;

    case "UPDATE_PURCHASE_ORDER_STATUS":
      return `Order status changed to "${body.status}"`;

    case "DELETE_PURCHASE_ORDER":
      return `Deleted purchase order`;

    default:
      return "Performed an action";
  }
};
const auditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = async function (body) {
      try {
        // only log success responses
        if (res.statusCode < 400) {
          const { client_id, user_name } = await getClientId(
            req.client?.client_code
          );

          await logAudit({
            client_id,
            user_name,
            action,
            details: formatAuditDetails(action, req.body, req.params),
          });
        }
      } catch (err) {
        console.error("Audit middleware error:", err);
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

export default auditMiddleware;