import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/database.js'
import { requestLogger } from './middleware/requestLogger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'

import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import courseRoutes from './routes/courses.js'
import fieldRoutes from './routes/fields.js'
import gradeRoutes from './routes/grades.js'
import bookRoutes from './routes/books.js'
import questionRoutes from './routes/questions.js'
import settingsRoutes from './routes/settings.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(requestLogger)

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '✅ سرور فعال است' })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/fields', fieldRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/settings', settingsRoutes)

app.use((req, res) => { res.status(404).json({ success: false, message: '⚠️ مسیر یافت نشد' }) })
app.use(errorHandler)

const startServer = async () => {
  await connectDB()
  app.listen(PORT, () => logger.info(`🚀 سرور روی پورت ${PORT}`))
}

startServer()
