import express from "express";
import {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "./purchaseOrder.controller.js";

import auditMiddleware from "../../../../middleware/audit.middleware.js";
import { clientAuthMiddleware } from "../../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getAllOrders);
router.post("/add", auditMiddleware("ADD_PURCHASE_ORDER"), createOrder);
router.put("/status/:id",  auditMiddleware("UPDATE_PURCHASE_ORDER_STATUS"), updateOrderStatus,);
router.delete("/:id", auditMiddleware("DELETE_PURCHASE_ORDER"), deleteOrder);

export default router;
