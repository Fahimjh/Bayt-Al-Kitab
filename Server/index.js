import express from "express";
import cors from "cors";
import booksRouter from "./routes/bookRoutes.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create express app
const app = express();

// allow your frontend origin, credentials and common headers
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://bayt-al-kitab.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(express.json());
// ensure upload directories exist
const uploadBase = path.join(__dirname, "uploads");
const uploadCoversDir = path.join(uploadBase, "covers");
const uploadPdfsDir = path.join(uploadBase, "pdfs");
for (const dir of [uploadBase, uploadCoversDir, uploadPdfsDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// support HTTP range requests for PDFs
app.get('/uploads/pdfs/:file', (req, res) => {
  const filePath = path.join(uploadPdfsDir, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  if (!range) {
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    return fs.createReadStream(filePath).pipe(res);
  }
  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
  const chunkSize = end - start + 1;
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': 'application/pdf',
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
});

// serve uploaded files publicly at /uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/books", booksRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT);
