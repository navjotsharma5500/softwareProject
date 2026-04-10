import express from "express";
import { makeAdmin, removeAdmin } from "../controllers/makeadmin.controller.js";

const router = express.Router();

// Route to make a user admin (not protected by adminOnly, but requires special code)
router.post("/makeadmin", makeAdmin);

// Route to remove admin privileges (not protected by adminOnly, but requires special code)
router.post("/removeadmin", removeAdmin);

export default router;
