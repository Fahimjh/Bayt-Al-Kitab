import express from "express";
import upload from "../middleware/upload.js";
import { uploadBook, approveBook, rejectBook } from "../controllers/bookController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// multiple file uploads (cover + pdf)
router.post(
  "/",
  upload.fields([{ name: "cover", maxCount: 1 }, { name: "pdf", maxCount: 1 }]),
  uploadBook
);

router.put("/approve/:id", authMiddleware, adminOnly, approveBook);
router.put("/reject/:id", authMiddleware, adminOnly, rejectBook);

export default router;
