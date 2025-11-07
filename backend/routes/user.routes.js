import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  claimItem,
  myClaims,
  listItems,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/items", isAuthenticated, listItems);
router.post("/items/:id/claim", isAuthenticated, claimItem);
router.get("/my-claims", isAuthenticated, myClaims);

export default router;
