import express from "express"
import { 
    addAdmin, 
    deleteAdmin, 
    deleteAuthor, 
    deleteUser, 
    getAdminDashboard, 
    getAdmins, 
    getAuthors, 
    getBooks, 
    getUsers, 
    updateAdmin } from "../controllers/admin.controller"
import { authenticate } from '../middleware/auth'
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"

const router = express.Router()

router.get(
  "/dashboard",
  authenticate,
  requireRole([Role.ADMIN]),
  getAdminDashboard
)
router.get("/", getAdmins)
router.post("/", addAdmin)
router.put("/:adminId", updateAdmin)
router.delete("/:adminId", deleteAdmin)

router.get("/authors", getAuthors)
router.delete("/authors/:id", deleteAuthor)

router.get("/users", getUsers)
router.delete("/users/:id", deleteUser)

router.get("/books", getBooks)

export default router