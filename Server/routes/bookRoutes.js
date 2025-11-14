import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  uploadBook,
  getApprovedBooks,
  getPendingBooks,
  getBookById,
  getUserBooks,
  deleteBook,
  approveBook,
  rejectBook,
  getDeleteRequestedBooks,
  approveDeleteRequest,
  rejectDeleteRequest
} from "../controllers/bookController.js";
import { verifyToken, permit } from "../middleware/auth.js";
import Book from "../models/book.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, path.join(__dirname, '../uploads/covers'));
    } else if (file.mimetype === 'application/pdf') {
      cb(null, path.join(__dirname, '../uploads/pdfs'));
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

// accept POST /api/books/upload
router.post(
  "/upload",
  verifyToken,
  upload.fields([{ name: "cover", maxCount: 1 }, { name: "pdf", maxCount: 1 }]),
  uploadBook
);

// add admin approve/reject endpoints (match client)
router.put("/admin/approve/:id", verifyToken, permit("admin"), approveBook);
router.put("/admin/reject/:id", verifyToken, permit("admin"), rejectBook);
router.delete("/:id", verifyToken, deleteBook);

// Delete request endpoints
router.get("/delete-requests", verifyToken, permit("admin"), getDeleteRequestedBooks);
router.put("/admin/approve-delete/:id", verifyToken, permit("admin"), approveDeleteRequest);
router.put("/admin/reject-delete/:id", verifyToken, permit("admin"), rejectDeleteRequest);

// existing public endpoints
router.get("/", getApprovedBooks);
router.get("/user", verifyToken, getUserBooks);
router.get("/pending", verifyToken, permit("admin"), getPendingBooks);
router.get("/:id", getBookById);
// Removed proxy remote PDFs to avoid CORS/auth issues

// Add a route for writers to request book deletion
router.post("/request-delete/:id", verifyToken, async (req, res) => {
  try {
    // Only writers can request delete for their own books
    if (!req.user || req.user.role !== "writer") {
      return res.status(403).json({ message: "Only writers can request deletion" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (String(book.uploadedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only request deletion for your own books" });
    }
    if (book.status === "delete_requested") {
      return res.status(400).json({ message: "Delete already requested" });
    }
    book.status = "delete_requested";
    await book.save();
    res.json({ message: "Delete request sent to admin" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
