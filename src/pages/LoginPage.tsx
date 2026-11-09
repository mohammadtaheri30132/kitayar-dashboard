import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

type AuthStep =
  | 'identifier'        // مرحله اول: دریافت شماره تلفن یا نام کاربری
  | 'password_login'    // کاربر موجود: رمز عبور + یا + ورود با کد یک‌بارمصرف + فراموشی رمز
  | 'otp_register'      // کاربر جدید: کد تایید پیامک
  | 'complete_profile'  // کاربر جدید: انتخاب عکس + نام و نام‌خانوادگی + تعیین رمز
  | 'otp_login'         // ورود با کد یک‌بارمصرف
  | 'reset_password'    // فراموشی و تغییر رمز عبور

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
]

const LoginPage = () => {
  const { login, setSession, isLoading: isGlobalLoading } = useAuthStore()

  const [step, setStep] = useState<AuthStep>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0])
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const isPhone = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '')
    return clean.length === 11 && clean.startsWith('09')
  }

  // ۱. بررسی شماره تلفن یا نام کاربری در مرحله اول
  const handleCheckIdentifier = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = identifier.trim()
    if (!raw) {
      toast.error('لطفاً شماره تلفن همراه یا نام کاربری خود را وارد کنید')
      return
    }

    // اگر شماره تلفن است:
    if (isPhone(raw)) {
      setLoading(true)
      try {
        const res = await axios.post('/api/auth/check-phone', { phoneNumber: raw })
        if (res.data?.success) {
          if (res.data.data?.isRegistered) {
            setStep('password_login')
          } else {
            setStep('otp_register')
            toast.success('کد تایید ارسال شد (کد تستی: ۱۲۳۴۵)')
          }
        } else {
          toast.error(res.data?.message || 'خطا در بررسی شماره')
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'خطا در ارتباط با سرور')
      } finally {
        setLoading(false)
      }
    } else {
      // نام کاربری سازمانی / ادمین
      setStep('password_login')
    }
  }

  // ۲. ورود با رمز عبور
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('لطفاً رمز عبور خود را وارد کنید')
      return
    }

    setLoading(true)
    try {
      if (isPhone(identifier.trim())) {
        const res = await axios.post('/api/auth/login', {
          phoneNumber: identifier.trim(),
          password,
        })
        if (res.data?.success) {
          setSession(res.data.data.token, res.data.data.user)
        } else {
          toast.error(res.data?.message || 'رمز عبور نادرست است')
        }
      } else {
        await login({ username: identifier.trim(), password })
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'رمز عبور اشتباه است')
    } finally {
      setLoading(false)
    }
  }

  // ۳. سوییچ به ورود با کد یک‌بارمصرف
  const handleRequestOtpLogin = async () => {
    setLoading(true)
    try {
      await axios.post('/api/auth/request-otp', { phoneNumber: identifier.trim() })
      setStep('otp_login')
      setOtp('')
      toast.success('کد یک‌بارمصرف ارسال شد (کد تستی: ۱۲۳۴۵)')
    } catch (err: any) {
      toast.error('خطا در ارسال کد یک‌بارمصرف')
    } finally {
      setLoading(false)
    }
  }

  // تایید کد یک‌بارمصرف و ورود
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error('لطفاً کد تایید ۵ رقمی را وارد کنید')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login-otp', {
        phoneNumber: identifier.trim(),
        otp: otp.trim(),
      })
      if (res.data?.success) {
        setSession(res.data.data.token, res.data.data.user)
      } else {
        toast.error(res.data?.message || 'کد تایید اشتباه یا منقضی شده است')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در تایید کد یک‌بارمصرف')
    } finally {
      setLoading(false)
    }
  }

  // ۴. کاربر جدید: تایید OTP و رفتن به تکمیل پروفایل
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || otp.trim().length < 4) {
      toast.error('لطفاً کد تایید ۵ رقمی را وارد کنید (کد تستی: ۱۲۳۴۵)')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/auth/verify-otp', {
        phoneNumber: identifier.trim(),
        otp: otp.trim(),
      })
      if (res.data?.success) {
        toast.success('کد تایید شد! اکنون پروفایل خود را تکمیل کنید')
        setStep('complete_profile')
      } else {
        toast.error(res.data?.message || 'کد تایید نامعتبر است')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'کد تایید اشتباه است (کد تستی: ۱۲۳۴۵)')
    } finally {
      setLoading(false)
    }
  }

  // ۵. کاربر جدید: تکمیل ثبت‌نام (عکس + نام + رمز عبور)
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('لطفاً نام و نام‌خانوادگی خود را وارد کنید')
      return
    }
    if (password.length < 5) {
      toast.error('رمز عبور باید حداقل ۵ کاراکتر باشد')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/auth/complete-profile', {
        phoneNumber: identifier.trim(),
        fullName: fullName.trim(),
        password,
        avatar,
        otp: otp.trim(),
      })
      if (res.data?.success) {
        setSession(res.data.data.token, res.data.data.user)
      } else {
        toast.error(res.data?.message || 'خطا در ثبت‌نام')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  // ۶. فراموشی رمز عبور: درخواست کد و باز کردن فرم
  const handleOpenForgotPassword = async () => {
    setLoading(true)
    try {
      await axios.post('/api/auth/request-otp', { phoneNumber: identifier.trim() })
      setStep('reset_password')
      setOtp('')
      setNewPassword('')
      toast.success('کد تایید جهت تنظیم رمز پیامک شد (کد تستی: ۱۲۳۴۵)')
    } catch (err: any) {
      toast.error('خطا در ارسال کد تایید')
    } finally {
      setLoading(false)
    }
  }

  // ثبت رمز عبور جدید
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error('لطفاً کد تایید ۵ رقمی را وارد کنید')
      return
    }
    if (newPassword.length < 5) {
      toast.error('رمز جدید باید حداقل ۵ کاراکتر باشد')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/auth/reset-password', {
        phoneNumber: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      })
      if (res.data?.success) {
        setSession(res.data.data.token, res.data.data.user)
      } else {
        toast.error(res.data?.message || 'خطا در تغییر رمز')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'کد تایید اشتباه است')
    } finally {
      setLoading(false)
    }
  }

  const isBusy = loading || isGlobalLoading

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#070B14] text-slate-100 p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-600/30">
            <span className="text-3xl font-black text-white">ک</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">سامانه کیتایار</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            ورود یکپارچه به پلتفرم آموزش، آزمون‌ساز و کلاس‌های آنلاین
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/85 border border-slate-800/90 rounded-3xl p-7 shadow-2xl backdrop-blur-2xl">
          
          {/* مرحله ۱: دریافت شماره تلفن یا نام کاربری */}
          {step === 'identifier' && (
            <form onSubmit={handleCheckIdentifier}>
              <div className="text-center mb-5">
                <h2 className="text-base font-bold text-white">ورود یا ثبت‌نام</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  شماره موبایل یا نام کاربری خود را وارد کنید
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  شماره موبایل / نام کاربری
                </label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    📱
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="09123456789 یا admin"
                    className="w-full pr-10 pl-4 py-3 text-xs bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl
                               focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                               outline-none transition-all placeholder:text-slate-600 text-left font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || !identifier.trim()}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2
                  ${
                    isBusy || !identifier.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-[0.98]'
                  }`}
              >
                {isBusy ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>ادامه ←</span>
                )}
              </button>
            </form>
          )}

          {/* مرحله ۲: کاربر موجود (رمز عبور + یا + ورود با کد یک‌بارمصرف + فراموشی رمز) */}
          {step === 'password_login' && (
            <form onSubmit={handlePasswordLogin}>
              <div className="text-center mb-5">
                <h2 className="text-base font-bold text-white">رمز عبور خود را وارد کنید</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  حساب کاربری: <span className="text-indigo-400 font-mono font-bold">{identifier}</span>
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  رمز عبور
                </label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    🔒
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور..."
                    className="w-full pr-10 pl-11 py-3 text-xs bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl
                               focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                               outline-none transition-all placeholder:text-slate-600 text-left font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* دکمه ورود */}
              <button
                type="submit"
                disabled={isBusy || !password.trim()}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2
                  ${
                    isBusy || !password.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-[0.98]'
                  }`}
              >
                {isBusy ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>ورود</span>
                )}
              </button>

              {/* نوشته «یا» و دکمه ورود با کد یک‌بارمصرف مخصوص کاربران دارای شماره همراه */}
              {isPhone(identifier) && (
                <>
                  <div className="flex items-center my-4">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="px-3 text-xs text-slate-500 font-bold">یا</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestOtpLogin}
                    disabled={isBusy}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-800/60 hover:bg-indigo-900/40 transition active:scale-[0.98]"
                  >
                    ورود با کد یک‌بارمصرف
                  </button>
                </>
              )}

              {/* فوتر: فراموشی رمز عبور و تغییر شماره */}
              <div className="flex items-center justify-between mt-5 text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setStep('identifier')}
                  className="hover:text-slate-200 transition"
                >
                  ← تغییر شماره
                </button>
                {isPhone(identifier) && (
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition"
                  >
                    فراموشی رمز عبور
                  </button>
                )}
              </div>
            </form>
          )}

          {/* مرحله ۲ (کاربر جدید): ورود کد تایید */}
          {step === 'otp_register' && (
            <form onSubmit={handleVerifyRegisterOtp}>
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-white">کد تایید را وارد کنید</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  کد تایید برای <span className="text-indigo-400 font-mono font-bold">{identifier}</span> پیامک شد
                </p>
              </div>

              {/* بنر کد تستی */}
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 mb-4 text-center">
                <p className="text-[11px] text-emerald-400">
                  💡 کد تستی پیش‌فرض: <span className="font-bold font-mono">12345</span>
                </p>
                <button
                  type="button"
                  onClick={() => setOtp('12345')}
                  className="mt-1 text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-800 transition"
                >
                  درج خودکار کد ۱۲۳۴۵
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  کد ۵ رقمی
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="12345"
                  className="w-full py-3 text-center text-lg tracking-widest font-mono font-bold bg-slate-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl outline-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isBusy || !otp.trim()}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition active:scale-[0.98]"
              >
                {isBusy ? 'در حال تایید...' : 'تایید کد و ادامه ←'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep('identifier')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  ← ویرایش شماره موبایل
                </button>
              </div>
            </form>
          )}

          {/* مرحله ۳ (کاربر جدید): تکمیل پروفایل (عکس + نام + رمز) */}
          {step === 'complete_profile' && (
            <form onSubmit={handleCompleteRegistration}>
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-white">تکمیل پروفایل</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  تصویر و نام کاربری خود را مشخص فرمایید
                </p>
              </div>

              {/* انتخاب تصویر آواتار */}
              <div className="text-center mb-4">
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-indigo-500 shadow-md object-cover"
                />
                <p className="text-[11px] text-slate-400 mb-2">انتخاب عکس پروفایل:</p>
                <div className="flex justify-center gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset)}
                      className={`rounded-full p-0.5 border-2 transition ${
                        avatar === preset ? 'border-indigo-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-8 h-8 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* نام و نام خانوادگی */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: رضا صادقی"
                  className="w-full px-3 py-2.5 text-xs bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl outline-none"
                  autoFocus
                />
              </div>

              {/* رمز عبور */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تعیین رمز عبور (حداقل ۵ کاراکتر)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور..."
                    className="w-full pr-3 pl-10 py-2.5 text-xs bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || !fullName.trim()}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition active:scale-[0.98]"
              >
                {isBusy ? 'در حال ثبت‌نام...' : 'تکمیل ثبت‌نام و ورود 🚀'}
              </button>
            </form>
          )}

          {/* حالت ورود با کد یک‌بارمصرف */}
          {step === 'otp_login' && (
            <form onSubmit={handleVerifyOtpLogin}>
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-white">ورود با کد یک‌بارمصرف</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  کد پیامک‌شده به <span className="text-indigo-400 font-mono font-bold">{identifier}</span> را وارد کنید
                </p>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 mb-4 text-center">
                <p className="text-[11px] text-emerald-400">
                  💡 کد تستی شبیه‌ساز: <span className="font-bold font-mono">12345</span>
                </p>
                <button
                  type="button"
                  onClick={() => setOtp('12345')}
                  className="mt-1 text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-800 transition"
                >
                  درج کد ۱۲۳۴۵
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  کد ۵ رقمی
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="12345"
                  className="w-full py-3 text-center text-lg tracking-widest font-mono font-bold bg-slate-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl outline-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isBusy || !otp.trim()}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/30 transition active:scale-[0.98]"
              >
                {isBusy ? 'در حال ورود...' : 'ورود به سامانه'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep('password_login')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  ← بازگشت به ورود با رمز عبور
                </button>
              </div>
            </form>
          )}

          {/* حالت تغییر و بازنشانی رمز عبور */}
          {step === 'reset_password' && (
            <form onSubmit={handleResetPassword}>
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-white">تغییر رمز عبور</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  کد تایید پیامک‌شده و رمز جدید خود را وارد فرمایید
                </p>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 mb-4 text-center">
                <p className="text-[11px] text-emerald-400">
                  💡 کد تستی تایید: <span className="font-bold font-mono">12345</span>
                </p>
                <button
                  type="button"
                  onClick={() => setOtp('12345')}
                  className="mt-1 text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-800 transition"
                >
                  درج کد ۱۲۳۴۵
                </button>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  کد تایید ۵ رقمی
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="12345"
                  className="w-full py-2.5 text-center text-base tracking-widest font-mono font-bold bg-slate-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl outline-none"
                  autoFocus
                />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رمز عبور جدید (حداقل ۵ کاراکتر)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="رمز جدید..."
                    className="w-full pr-3 pl-10 py-2.5 text-xs bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || !otp.trim() || newPassword.length < 5}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/30 transition active:scale-[0.98]"
              >
                {isBusy ? 'در حال ثبت...' : 'ثبت رمز جدید و ورود'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep('password_login')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  ← انصراف و بازگشت به ورود
                </button>
              </div>
            </form>
          )}

          <p className="text-[10px] text-slate-500 text-center mt-6 font-mono">
            Kitayar Unified Authentication • Secure
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
