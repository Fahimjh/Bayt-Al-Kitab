import Book from "../models/bookModel.js"; // adjust path/name if needed
import cloudinary from "../config/cloudinary.js"; // or: import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadBook = async (req, res) => {
  try {
    const { title, author, category, description } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "writer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only writers & admins can upload" });
    }

    if (!req.files || !req.files.cover || !req.files.pdf) {
      return res.status(400).json({ message: "Cover and PDF files are required" });
    }

    const coverPath = req.files.cover[0].path;
    const pdfPath = req.files.pdf[0].path;

    const coverResult = await cloudinary.uploader.upload(coverPath, {
      folder: "islamic_books/covers",
    });

    const pdfResult = await cloudinary.uploader.upload(pdfPath, {
      folder: "islamic_books/pdfs",
      resource_type: "raw",
    });

    // Optionally remove temp files
    try {
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    } catch (e) {
      console.warn("Failed to remove temp files:", e.message);
    }

    const book = await Book.create({
      title,
      author,
      category,
      description,
      coverImage: coverResult.secure_url,
      pdfUrl: pdfResult.secure_url,
      uploadedBy: req.user._id,
      status: "pending",
    });

    res.status(201).json({ message: "Book submitted for review!", book });
  } catch (err) {
    console.error("uploadBook error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

export const approveBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "✅ Book approved!", book });
  } catch (err) {
    console.error("approveBook error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

export const rejectBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "❌ Book rejected!", book });
  } catch (err) {
    console.error("rejectBook error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};
