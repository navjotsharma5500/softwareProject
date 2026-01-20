import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";
import {
  listPendingClaims,
  approveClaim,
  rejectClaim,
  listAllItems,
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  getItemClaims,
  downloadDataAsCSV,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes protected
router.get("/items", isAuthenticated, adminOnly, listAllItems);
router.post(
  "/items",
  isAuthenticated,
  adminOnly,
  idempotencyMiddleware(86400),
  createItem,
);
router.get("/items/:id", isAuthenticated, adminOnly, getItemById);
router.patch(
  "/items/:id",
  isAuthenticated,
  adminOnly,
  idempotencyMiddleware(3600),
  updateItem,
);
router.delete(
  "/items/:id",
  isAuthenticated,
  adminOnly,
  idempotencyMiddleware(3600),
  deleteItem,
);
router.get("/items/:id/claims", isAuthenticated, adminOnly, getItemClaims);

router.get("/claims", isAuthenticated, adminOnly, listPendingClaims);
router.patch(
  "/claims/:id/approve",
  isAuthenticated,
  adminOnly,
  idempotencyMiddleware(86400),
  approveClaim,
);
router.patch(
  "/claims/:id/reject",
  isAuthenticated,
  adminOnly,
  idempotencyMiddleware(86400),
  rejectClaim,
);

// CSV download route
router.get("/download-csv", isAuthenticated, adminOnly, downloadDataAsCSV);

export default router;
