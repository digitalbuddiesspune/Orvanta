import express from "express";
import { authenticate, authenticateAdmin } from "../middleware/authMiddleware.js";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controller/orderController.js";

const router = express.Router();

router.post("/place", authenticate, placeOrder);
router.get("/my-orders", authenticate, getMyOrders);
router.put("/:orderId/cancel", authenticate, cancelOrder);
router.get("/:orderId", authenticate, getOrderById);

router.get("/admin/all", authenticateAdmin, getAllOrders);
router.put("/admin/:orderId/status", authenticateAdmin, updateOrderStatus);

export default router;
