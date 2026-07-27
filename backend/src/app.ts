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

// ==================== CORS ====================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL || '',
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log('❌ CORS blocked origin:', origin)
      callback(null, true) // موقتاً همه رو قبول کن
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
}))

// Pre-flight برای همه مسیرها
app.options('*', cors())

// ==================== Middleware ====================
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(requestLogger)

// ==================== Routes ====================
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '✅ سرور فعال است', timestamp: new Date().toISOString() })
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
  try {
    await connectDB()
    app.listen(PORT, () => {
      logger.info(`🚀 سرور روی پورت ${PORT} در حال اجراست`)
      logger.info(`📍 آدرس: http://localhost:${PORT}`)
      logger.info(`🔗 کلاینت: ${allowedOrigins.join(', ')}`)
    })
  } catch (error) {
    logger.error('❌ خطا در راه‌اندازی سرور:', error)
    process.exit(1)
  }
}

startServer()
