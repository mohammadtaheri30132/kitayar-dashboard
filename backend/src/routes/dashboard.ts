import { Router } from 'express'
import { getDashboardStats } from '../controllers/dashboardController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, getDashboardStats)

export default router
