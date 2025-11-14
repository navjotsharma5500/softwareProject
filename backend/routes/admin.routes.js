import express from "express";
import { isAuthenticated, adminOnly } from "../middlewares/auth.middleware.js";
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
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes protected
router.get("/items", isAuthenticated, adminOnly, listAllItems);
router.post("/items", isAuthenticated, adminOnly, createItem);
router.get("/items/:id", isAuthenticated, adminOnly, getItemById);
router.patch("/items/:id", isAuthenticated, adminOnly, updateItem);
router.delete("/items/:id", isAuthenticated, adminOnly, deleteItem);
router.get("/items/:id/claims", isAuthenticated, adminOnly, getItemClaims);

router.get("/claims", isAuthenticated, adminOnly, listPendingClaims);
router.patch("/claims/:id/approve", isAuthenticated, adminOnly, approveClaim);
router.patch("/claims/:id/reject", isAuthenticated, adminOnly, rejectClaim);

export default router;
