import { Router } from "express"
import {
  getMyProfile,
  login,
  registerAdmin,
  registerUser,
  refreshToken,
} from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"
import { forgotPassword, resetPassword } from "../controllers/forgotpassword.controller"

const router = Router()

router.post("/register", registerUser)

router.post("/login", login)

router.post(
  "/admin/register",
  authenticate,
  requireRole([Role.ADMIN]),
  registerAdmin
)

router.post("/refresh", refreshToken)

router.get("/me", authenticate, getMyProfile)

router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)

export default router