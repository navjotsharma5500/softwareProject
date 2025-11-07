import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
  listPendingClaims,
  approveClaim,
  rejectClaim,
  listAllItems,
} from "../controllers/admin.controller.js";

const router = express.Router();

// all admin routes protected
router.get("/items", isAdmin, listAllItems);
router.get("/claims", isAdmin, listPendingClaims);
router.patch("/claims/:id/approve", isAdmin, approveClaim);
router.patch("/claims/:id/reject", isAdmin, rejectClaim);

export default router;
