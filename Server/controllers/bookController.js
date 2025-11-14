import Book from "../models/book.js";
import http from "http";
import https from "https";
import { URL } from "url";

import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const removeFileIfExists = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    // ...existing code...
  }
};

export const uploadBook = async (req, res) => {
  try {
    const { title, author, category, description } = req.body;

    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    if (!["writer", "admin"].includes(req.user.role))
      return res.status(403).json({ message: "Only writers & admins can upload" });

    const coverFile = req.files?.cover?.[0];
    const pdfFile = req.files?.pdf?.[0];

    if (!coverFile || !pdfFile) {
      return res.status(400).json({ message: "Cover and PDF files are required" });
    }


    let coverUrl, pdfUrl;
    let coverUploaded = false;
    let pdfUploaded = false;

    // Upload cover to Cloudinary
    try {
      const coverResult = await cloudinary.uploader.upload(coverFile.path, {
        folder: "islamic_books/covers",
      });
      coverUrl = coverResult.secure_url;
      coverUploaded = true;
      removeFileIfExists(coverFile.path);
    } catch (cloudinaryError) {
      // ...existing code...
      // Store relative path for local serving
      const relativePath = path.relative(path.join(__dirname, '..'), coverFile.path).replace(/\\/g, '/');
      coverUrl = '/' + relativePath;
    }

    // Upload PDF to Cloudinary
    try {
      const pdfResult = await cloudinary.uploader.upload(pdfFile.path, {
        folder: "islamic_books/pdfs",
        resource_type: "raw"
      });
      pdfUrl = pdfResult.secure_url;
      pdfUploaded = true;
      removeFileIfExists(pdfFile.path);
    } catch (cloudinaryError) {
      // ...existing code...
      // Store relative path for local serving
      const relativePath = path.relative(path.join(__dirname, '..'), pdfFile.path).replace(/\\/g, '/');
      pdfUrl = '/' + relativePath;
    }

    // Always set status to 'pending' for writers, only admin can approve
    const isAdmin = req.user && String(req.user.role || "").toLowerCase() === "admin";
    const book = await Book.create({
      title,
      author,
      category,
      description,
      coverImage: coverUrl,
      pdfUrl: pdfUrl,
      uploadedBy: req.user._id,
      status: isAdmin ? "approved" : "pending",
    });

    return res.status(201).json({ message: isAdmin ? "Book uploaded and approved!" : "Book submitted for review!", book });
  } catch (err) {
    console.error("uploadBook error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

export const getApprovedBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { status: "approved" };

    if (category) filter.category = { $regex: new RegExp(category, "i") };
    if (search) {
      filter.$or = [
        { title: { $regex: new RegExp(search, "i") } },
        { authorName: { $regex: new RegExp(search, "i") } },
        { description: { $regex: new RegExp(search, "i") } },
      ];
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPendingBooks = async (req, res) => {
  try {
    const books = await Book.find({ status: "pending" }).populate("uploadedBy", "name email");
    res.json(books);
  } catch (err) {
    console.error("getPendingBooks error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const approveBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book approved", book });
  } catch (err) {
    console.error("approveBook error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const rejectBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book rejected", book });
  } catch (err) {
    console.error("rejectBook error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId early to avoid Mongoose CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const book = await Book.findById(id).populate("uploadedBy", "name email");
    if (!book) return res.status(404).json({ message: "Not found" });
    res.json(book);
  } catch (err) {
    console.error("getBookById error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const getUserBooks = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const books = await Book.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error("getUserBooks error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ message: "Authentication required" });

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // only allow the uploader or admin to delete
    if (book.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own books" });
    }

    // Remove cover from Cloudinary if it's a Cloudinary URL
    if (book.coverImage && book.coverImage.includes('cloudinary.com')) {
      try {
        const coverUrlParts = book.coverImage.split('/');
        let coverPublicId = coverUrlParts.slice(coverUrlParts.indexOf('islamic_books')).join('/');
        coverPublicId = coverPublicId.replace(/\.[^/.]+$/, ""); // remove extension
        await cloudinary.uploader.destroy(coverPublicId);
      } catch (e) {
        // ...existing code...
      }
    } else if (book.coverImage && book.coverImage.startsWith('/uploads/')) {
      // Remove local cover if present
      removeFileIfExists(path.join(__dirname, '..', book.coverImage));
    }

    // Remove PDF from Cloudinary if it's a Cloudinary URL
    if (book.pdfUrl && book.pdfUrl.includes('cloudinary.com')) {
      try {
        const pdfUrlParts = book.pdfUrl.split('/');
        const pdfPublicId = pdfUrlParts.slice(pdfUrlParts.indexOf('islamic_books')).join('/');
        await cloudinary.uploader.destroy(pdfPublicId, { resource_type: 'raw' });
      } catch (e) {
        // ...existing code...
      }
    } else if (book.pdfUrl && book.pdfUrl.startsWith('/uploads/')) {
      // Remove local PDF if present
      removeFileIfExists(path.join(__dirname, '..', book.pdfUrl));
    }

    await Book.findByIdAndDelete(id);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("deleteBook error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};


// Admin: get all books with delete_requested status
export const getDeleteRequestedBooks = async (req, res) => {
  try {
    const books = await Book.find({ status: "delete_requested" }).populate("uploadedBy");
    res.json(books);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Admin: approve delete request
export const approveDeleteRequest = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.status !== "delete_requested") {
      return res.status(400).json({ message: "Book is not marked for deletion" });
    }
    // Remove cover from Cloudinary if it's a Cloudinary URL
    if (book.coverImage && book.coverImage.includes('cloudinary.com')) {
      try {
        const coverUrlParts = book.coverImage.split('/');
        let coverPublicId = coverUrlParts.slice(coverUrlParts.indexOf('islamic_books')).join('/');
        coverPublicId = coverPublicId.replace(/\.[^/.]+$/, ""); // remove extension
        console.log('Attempting to delete cover from Cloudinary:', coverPublicId);
        const result = await cloudinary.uploader.destroy(coverPublicId);
        console.log('Cloudinary cover delete result:', result);
      } catch (e) {
        console.warn('Failed to delete cover from Cloudinary:', e.message);
      }
    } else if (book.coverImage && book.coverImage.startsWith('/uploads/')) {
      // Remove local cover if present
      removeFileIfExists(path.join(__dirname, '..', book.coverImage));
    }

    // Remove PDF from Cloudinary if it's a Cloudinary URL
    if (book.pdfUrl && book.pdfUrl.includes('cloudinary.com')) {
      try {
        const pdfUrlParts = book.pdfUrl.split('/');
        const pdfPublicId = pdfUrlParts.slice(pdfUrlParts.indexOf('islamic_books')).join('/');
        console.log('Attempting to delete PDF from Cloudinary:', pdfPublicId);
        const result = await cloudinary.uploader.destroy(pdfPublicId, { resource_type: 'raw' });
        console.log('Cloudinary delete result:', result);
      } catch (e) {
        console.warn('Failed to delete PDF from Cloudinary:', e.message);
      }
    } else if (book.pdfUrl && book.pdfUrl.startsWith('/uploads/')) {
      // Remove local PDF if present
      removeFileIfExists(path.join(__dirname, '..', book.pdfUrl));
    }

    await book.deleteOne();
    res.json({ message: "Book deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Admin: reject delete request
export const rejectDeleteRequest = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.status !== "delete_requested") {
      return res.status(400).json({ message: "Book is not marked for deletion" });
    }
    book.status = "approved";
    await book.save();
    res.json({ message: "Delete request rejected, book restored to approved" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
