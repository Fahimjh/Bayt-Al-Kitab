import multer from "multer";

const storage = multer.memoryStorage(); // file kept in memory
const upload = multer({ storage });

export default upload;
