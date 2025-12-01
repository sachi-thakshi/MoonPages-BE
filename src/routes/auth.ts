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

export default router

