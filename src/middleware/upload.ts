import multer from "multer"

const storage = multer.memoryStorage() // upload buffer directly to Cloudinary

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})