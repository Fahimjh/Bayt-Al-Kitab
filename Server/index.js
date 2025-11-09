import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import bookRoutes from "./routes/bookRoutes.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/books", bookRoutes);

app.listen(process.env.PORT, () =>
  console.log(` Server running on port ${process.env.PORT}`)
);
