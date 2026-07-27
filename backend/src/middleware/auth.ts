import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User.js'
import { logger } from '../utils/logger.js'

export interface AuthRequest extends Request {
  user?: IUser
}

interface JwtPayload {
  userId: string
  username: string
  role: string
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined

    // بررسی هدر Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: '⛔ دسترسی غیرمجاز. لطفاً وارد حساب کاربری خود شوید',
        error: 'TOKEN_MISSING',
      })
      return
    }

    // تایید توکن
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JwtPayload

    // پیدا کردن کاربر
    const user = await User.findById(decoded.userId)

    if (!user) {
      res.status(401).json({
        success: false,
        message: '⛔ کاربر یافت نشد. لطفاً دوباره وارد شوید',
        error: 'USER_NOT_FOUND',
      })
      return
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: '⛔ حساب کاربری شما غیرفعال شده است',
        error: 'ACCOUNT_DISABLED',
      })
      return
    }

    req.user = user
    next()
  } catch (error: any) {
    logger.error('❌ خطا در احراز هویت:', error.message)

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: '⛔ توکن نامعتبر است. لطفاً دوباره وارد شوید',
        error: 'INVALID_TOKEN',
      })
      return
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: '⛔ توکن منقضی شده است. لطفاً دوباره وارد شوید',
        error: 'TOKEN_EXPIRED',
      })
      return
    }

    res.status(500).json({
      success: false,
      message: '❌ خطای سرور در احراز هویت',
      error: 'AUTH_ERROR',
    })
  }
}

// میدلور برای محدود کردن دسترسی به ادمین
export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: '⛔ فقط مدیر سیستم به این بخش دسترسی دارد',
      error: 'ADMIN_ONLY',
    })
  }
}
