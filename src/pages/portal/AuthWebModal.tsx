import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface AuthWebModalProps {
  portalRole: 'teacher' | 'student'
  onSuccess: (token: string, user: any) => void
  onBack: () => void
}

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
]

export const AuthWebModal: React.FC<AuthWebModalProps> = ({
  portalRole,
  onSuccess,
  onBack,
}) => {
  const isTeacher = portalRole === 'teacher'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const cleanPhone = (p: string) =>
    p
      .replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
      .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
      .replace(/[^0-9]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = cleanPhone(phoneNumber)
    if (clean.length !== 11 || !clean.startsWith('09')) {
      toast.error('شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود')
      return
    }
    if (mode === 'register' && !fullName.trim()) {
      toast.error('لطفاً نام و نام‌خانوادگی خود را وارد کنید')
      return
    }
    if (!password.trim() || password.trim().length < 4) {
      toast.error('لطفاً رمز عبور (حداقل ۴ کاراکتر) را وارد کنید')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', {
        phoneNumber: clean,
        password,
        fullName: mode === 'register' ? fullName.trim() : undefined,
        role: portalRole,
      })

      if (res.data?.success) {
        const rawData = res.data.data || {}
        const userObj = rawData.user || rawData
        const token = rawData.token
        toast.success(`خوش آمدید، ${userObj.fullName || 'کاربر گرامی'}`)
        onSuccess(token, userObj)
      } else {
        toast.error(res.data?.message || 'خطا در احراز هویت')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      <div className={`absolute top-1/4 -right-20 w-80 h-80 ${isTeacher ? 'bg-blue-600/15' : 'bg-emerald-600/15'} rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-1/4 -left-20 w-80 h-80 ${isTeacher ? 'bg-indigo-600/15' : 'bg-teal-600/15'} rounded-full blur-3xl pointer-events-none`} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className={`w-14 h-14 rounded-2xl ${isTeacher ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-600/30' : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-600/30'} flex items-center justify-center mx-auto mb-3 shadow-xl text-2xl`}>
            {isTeacher ? '👨‍🏫' : '🧑‍🎓'}
          </div>
          <h1 className="text-2xl font-black text-white">
            {isTeacher ? 'پنل دبیران کیتایار' : 'پنل دانش‌آموزان کیتایار'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ورود یا ثبت‌نام سریع با شماره موبایل (بدون نیاز به کد پیامکی)
          </p>
        </div>

        <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'login'
                  ? isTeacher
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ورود به حساب
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'register'
                  ? isTeacher
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ثبت‌نام سریع
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  نام و نام‌خانوادگی
                </label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    👤
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                    className="w-full pr-10 pl-4 py-3 text-xs bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl
                               focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                               outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                شماره موبایل
              </label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  📱
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09123456789"
                  maxLength={11}
                  className="w-full pr-10 pl-4 py-3 text-sm bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl
                             focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                             outline-none transition-all placeholder:text-slate-600 text-left font-mono"
                  autoFocus
                />
              </div>
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
                  placeholder="حداقل ۴ کاراکتر..."
                  className="w-full pr-10 pl-11 py-3 text-xs bg-slate-950/80 border border-slate-800 text-slate-200 rounded-xl
                             focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                             outline-none transition-all placeholder:text-slate-600 text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneNumber.trim() || !password.trim()}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2
                ${
                  isTeacher
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                } shadow-lg active:scale-[0.98] disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'register' ? (
                'تکمیل ثبت‌نام و ورود ←'
              ) : (
                'ورود به سامانه ←'
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-center mt-4 text-[11px] text-slate-400 hover:text-slate-200 transition"
            >
              ← بازگشت به انتخاب پورتال
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
