import { Router } from "express"
import { getAuthorDashboardData } from '../controllers/author.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/dashboard-stats', authenticate, getAuthorDashboardData)

export default router