import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      return
    }

    await login({ username: username.trim(), password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="w-full max-w-md">
        {/* لوگو */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Question CMS</h1>
          <p className="text-sm text-gray-500 mt-1">پنل مدیریت سوالات</p>
        </div>

        {/* فرم لاگین */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">
            ورود به حساب کاربری
          </h2>

          {/* نام کاربری */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">
              نام کاربری
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                👤
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری را وارد کنید"
                className="w-full pr-10 pl-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                           focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400
                           outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* رمز عبور */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">
              رمز عبور
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔒
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور را وارد کنید"
                className="w-full pr-10 pl-12 py-3 text-sm border-2 border-gray-200 rounded-xl
                           focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400
                           outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* دکمه ورود */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all
              ${isLoading || !username.trim() || !password.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25 active:scale-[0.98]'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                در حال ورود...
              </span>
            ) : (
              'ورود به پنل'
            )}
          </button>

          {/* راهنما */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
            <p className="font-bold text-gray-600 mb-2">🔑 اطلاعات ورود تستی:</p>
            <p>نام کاربری: <code className="bg-gray-200 px-1.5 py-0.5 rounded">admin</code></p>
            <p>رمز عبور: <code className="bg-gray-200 px-1.5 py-0.5 rounded">Admin@123456</code></p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
