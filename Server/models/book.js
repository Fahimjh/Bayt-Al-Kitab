import mongoose from "mongoose";

const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  category: String,
  description: String,
  coverImage: String,
  pdfUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "approved", "rejected", "delete_requested"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Book", BookSchema);
