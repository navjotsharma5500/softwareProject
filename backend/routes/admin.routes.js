import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
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
router.get("/items", isAdmin, listAllItems);
router.post("/items", isAdmin, createItem);
router.get("/items/:id", isAdmin, getItemById);
router.patch("/items/:id", isAdmin, updateItem);
router.delete("/items/:id", isAdmin, deleteItem);
router.get("/items/:id/claims", isAdmin, getItemClaims);

router.get("/claims", isAdmin, listPendingClaims);
router.patch("/claims/:id/approve", isAdmin, approveClaim);
router.patch("/claims/:id/reject", isAdmin, rejectClaim);

export default router;
