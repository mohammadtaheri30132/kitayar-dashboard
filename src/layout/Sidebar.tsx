import { useState } from 'react'
import { useQuestionStore } from '../store/useQuestionStore'
import { useAuthStore } from '../store/authStore'
import { ALL_TYPES, TYPE_LABELS } from '../types/question'

interface Props {
  onClose: () => void
  activePage?: string
  onNavigate?: (page: any) => void
}

const NAV_SECTIONS = [
  {
    title: 'اصلی و سامانه',
    items: [
      { id: 'dashboard', label: 'داشبورد مدیریت', icon: '📊' },
    ],
  },
  {
    title: 'بانک سوالات و آزمون‌ها',
    items: [
      { id: 'blog', label: 'مدیریت وبلاگ و سئو', icon: '✍️' },
      { id: 'nokita', label: 'مدیریت وبسایت نوکیتا', icon: '🟣' },
      { id: 'questions', label: 'بانک سوالات', icon: '📝' },
      { id: 'quiz', label: 'کوییز نوکیتا', icon: '🎮' },
      { id: 'question-builder', label: 'طراح آزمون (سوال‌ساز)', icon: '📄' },
    ],
  },
  {
    title: 'ارتباطات و اطلاع‌رسانی',
    items: [
      { id: 'community', label: 'جامعه معلمان', icon: '👥' },
      { id: 'announcements', label: 'اطلاعیه‌ها و اخبار', icon: '📢' },
      { id: 'notifications', label: 'ارسال اعلان و FCM', icon: '🔔' },
      { id: 'support', label: 'تیکت‌های پشتیبانی', icon: '💬' },
    ],
  },
  {
    title: 'ابزارها و سرویس‌ها',
    items: [
      { id: 'system-events', label: 'مناسبت‌ها و تقویم', icon: '🗓️' },
      { id: 'music', label: 'موسیقی و صوت', icon: '🎵' },
      { id: 'phonebook', label: 'دفترچه تلفن', icon: '📞' },
      { id: 'settings', label: 'تنظیمات سامانه', icon: '⚙️' },
      { id: 'landing-tools', label: 'ابزارهای صفحه اصلی وب', icon: '🧰' },
    ],
  },
]

const Sidebar = ({ onClose, activePage = 'dashboard', onNavigate }: Props) => {
  const activeType = useQuestionStore((s) => s.draft.type)
  const setType = useQuestionStore((s) => s.setType)
  const resetDraft = useQuestionStore((s) => s.resetDraft)
  const { user, logout } = useAuthStore()
  const [showTypes, setShowTypes] = useState(false)

  const isKitayarActive = ['kitayar-classes', 'kitayar-teachers', 'kitayar-students'].includes(activePage)
  const [showKitayar, setShowKitayar] = useState(true)

  const handleCreateQuestion = () => {
    resetDraft()
    onNavigate?.('create-question')
  }

  const handleNavClick = (pageId: string) => {
    onNavigate?.(pageId)
    if (pageId === 'questions') setShowTypes(false)
  }

  return (
    <nav className="h-full flex flex-col text-slate-300 bg-[#0A0F1D] border-l border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0 bg-[#0B1122]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-base shadow-lg shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
              سامانه کیتایار
            </span>
            <span className="text-[10px] text-indigo-400 font-medium">پنل مدیریت یکپارچه</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white transition"
          title="بستن منو"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* User Info Card */}
      <div className="p-3 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user?.fullName?.charAt(0) || 'م'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0A0F1D] rounded-full" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs font-bold text-white truncate">{user?.fullName || 'کاربر مدیر'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span>{user?.role === 'admin' ? '🛡️ مدیر ارشد' : 'معلم'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-4">
        {/* SECTION 1: اصلی و کیتایار */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            اصلی و کیتایار
          </p>

          {/* داشبورد */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-right ${
              activePage === 'dashboard'
                ? 'bg-gradient-to-l from-blue-600/30 to-indigo-600/20 text-blue-300 border-r-4 border-blue-500 shadow-lg shadow-blue-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📊</span>
              <span>داشبورد مدیریت</span>
            </div>
          </button>

          {/* کیتایار Accordion */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowKitayar(!showKitayar)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 text-right ${
                isKitayarActive
                  ? 'bg-gradient-to-l from-indigo-600/30 to-purple-600/20 text-indigo-200 border-r-4 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🎓</span>
                <span>کیتایار</span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  ویژه
                </span>
              </div>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform duration-200 ${
                  showKitayar ? 'rotate-180 text-indigo-400' : 'text-slate-500'
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showKitayar && (
              <div className="pr-4 pl-1 mt-1 space-y-1 border-r-2 border-indigo-500/30 mr-3 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => handleNavClick('classroom-monitoring')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-right ${
                    activePage === 'classroom-monitoring'
                      ? 'bg-emerald-600/25 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-sm">📡</span>
                  <span>پایش زنده کلاس‌ها (LiveKit)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-auto animate-pulse" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('kitayar-classes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-right ${
                    activePage === 'kitayar-classes'
                      ? 'bg-indigo-600/25 text-indigo-200 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-sm">🏫</span>
                  <span>لیست کلاس‌ها و فعالیت‌ها</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('kitayar-teachers')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-right ${
                    activePage === 'kitayar-teachers'
                      ? 'bg-indigo-600/25 text-indigo-200 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-sm">👨‍🏫</span>
                  <span>لیست معلمان و ارسال اعلان</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('kitayar-students')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-right ${
                    activePage === 'kitayar-students'
                      ? 'bg-indigo-600/25 text-indigo-200 font-bold border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-sm">🧑‍🎓</span>
                  <span>دانش‌آموزان ثبت‌شده</span>
                </button>
              </div>
            )}
          </div>

          {/* مدیریت کیف پول و امور مالی */}
          <button
            type="button"
            onClick={() => handleNavClick('wallets')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-right ${
              activePage === 'wallets'
                ? 'bg-gradient-to-l from-emerald-600/30 to-teal-600/20 text-emerald-300 border-r-4 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">💳</span>
              <span>مدیریت کیف پول و تراکنش‌ها</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              مالی
            </span>
          </button>
        </div>

        {/* SECTION 2: بانک سوالات و آزمون‌ها */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            محتوا و آزمون
          </p>
          {NAV_SECTIONS[1].items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-right ${
                activePage === item.id ||
                (item.id === 'questions' &&
                  ['lesson-questions', 'question-detail', 'import-json', 'edit-question'].includes(activePage))
                  ? 'bg-gradient-to-l from-blue-600/30 to-indigo-600/20 text-blue-300 border-r-4 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Add Question Button */}
        <div className="pt-1 pb-1">
          <button
            type="button"
            onClick={handleCreateQuestion}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>افزودن سوال جدید</span>
          </button>
        </div>

        {/* SECTION 3: ارتباطات و اعلانات */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            ارتباطات و اعلانات
          </p>
          {NAV_SECTIONS[2].items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-right ${
                activePage === item.id
                  ? 'bg-gradient-to-l from-blue-600/30 to-indigo-600/20 text-blue-300 border-r-4 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* SECTION 4: ابزارها و سرویس‌ها */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            ابزارها و تنظیمات
          </p>
          {NAV_SECTIONS[3].items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-right ${
                activePage === item.id
                  ? 'bg-gradient-to-l from-blue-600/30 to-indigo-600/20 text-blue-300 border-r-4 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* انواع سوالات Dropdown */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowTypes(!showTypes)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 bg-slate-900/40 border border-slate-800/60"
          >
            <span>دسته‌بندی انواع سوال</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showTypes ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showTypes && (
            <div className="mt-1 space-y-1 pr-2 animate-fadeIn">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    handleNavClick('create-question')
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-right ${
                    activeType === t
                      ? 'bg-blue-600/20 text-blue-300 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <span>
                    {t === 'تستی'
                      ? '🔘'
                      : t === 'جاخالی'
                      ? '📝'
                      : t === 'صحیح-غلط'
                      ? '✅'
                      : t === 'کوتاه-پاسخ'
                      ? '✍️'
                      : t === 'گسترده-پاسخ'
                      ? '📄'
                      : '🔗'}
                  </span>
                  <span>{TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800/70 shrink-0 bg-[#0B1122]">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-right"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>خروج از پنل مدیریت</span>
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-1.5 font-mono">Kitayar CMS • v2.5.0</p>
      </div>
    </nav>
  )
}

export default Sidebar
