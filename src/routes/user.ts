import { Router } from "express"
import { authenticate } from "../middleware/auth"
import { upload } from "../middleware/upload";
import { updateUser, deleteUser, uploadProfilePic } from "../controllers/user.controller";

const router = Router()

// Update user info
router.put("/update", authenticate, updateUser)

// Delete account
router.delete("/delete", authenticate, deleteUser)

// Upload profile image
router.post("/upload-profile", authenticate, upload.single("profilePic"), uploadProfilePic)

export default router