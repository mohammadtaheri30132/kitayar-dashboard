import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../store/authStore'

type PageId =
  | 'dashboard'
  | 'classroom-monitoring'
  | 'kitayar-classes'
  | 'kitayar-teachers'
  | 'kitayar-students'
  | 'quiz'
  | 'community'
  | 'questions'
  | 'create-question'
  | 'edit-question'
  | 'import-json'
  | 'lesson-questions'
  | 'question-detail'
  | 'question-builder'
  | 'announcements'
  | 'notifications'
  | 'system-events'
  | 'music'
  | 'phonebook'
  | 'support'
  | 'settings'

interface Props {
  children: ReactNode
  activePage?: PageId
  onNavigate?: (page: PageId) => void
  onBack?: () => void
}

const PAGE_INFO: Record<string, { title: string; subtitle?: string; icon: string }> = {
  dashboard: { title: 'مرکز فرماندهی داشبورد', subtitle: 'خلاصه وضعیت، آمار کلی و دسترسی سریع سیستم', icon: '📊' },
  'classroom-monitoring': { title: 'پایش و مانیتورینگ زنده کلاس‌های آنلاین', subtitle: 'نظارت بر اتاق‌های لایوکیت، پایداری استریم‌ها و لاگ حاضرین', icon: '📡' },
  'kitayar-classes': { title: 'کیتایار • مدیریت کلاس‌ها و فعالیت‌ها', subtitle: 'بررسی کلاس‌های فعال، تکالیف، آزمون‌ها و حضور غیاب', icon: '🏫' },
  'kitayar-teachers': { title: 'کیتایار • مدیریت معلمان و اعلانات', subtitle: 'مشاهده مشخصات، مدارس، ارسال پیام مستقیم و لیست شاگردان', icon: '👨‍🏫' },
  'kitayar-students': { title: 'کیتایار • بانک دانش‌آموزان ثبت‌شده', subtitle: 'لیست کامل شاگردان، اطلاعات اولیاء، تاییدیه و خروجی اکسل', icon: '🧑‍🎓' },
  quiz: { title: 'کوییز و آزمون‌های نوکیتا', subtitle: 'مدیریت و نظارت بر لیگ‌ها و مسابقات دانش‌آموزی', icon: '🎮' },
  community: { title: 'جامعه معلمان و تالار گفتگو', subtitle: 'پست‌ها، تبادل تجربیات و تعاملات آموزشی', icon: '👥' },
  questions: { title: 'بانک جامع سوالات', subtitle: 'فهرست دروس، پایه‌ها و مخزن سوالات استاندارد', icon: '📝' },
  'create-question': { title: 'طراحی و ثبت سوال جدید', subtitle: 'ویرایشگر پیشرفته چندرسانه‌ای و فرمول‌نویسی ریاضی', icon: '✍️' },
  'edit-question': { title: 'ویرایش سوال', subtitle: 'بروزرسانی محتوا، پاسخ‌ها و تنظیمات سوال', icon: '✏️' },
  'import-json': { title: 'ورود دسته‌جمعی سوالات (Import JSON)', subtitle: 'بارگذاری سریع بسته‌های سوال با ساختار استاندارد', icon: '📥' },
  'lesson-questions': { title: 'سوالات تخصصی درس', subtitle: 'فهرست سوالات طبقه‌بندی شده کتاب درسی', icon: '📚' },
  'question-detail': { title: 'جزئیات سوال', subtitle: 'مشاهده مشخصات کامل، پیش‌نمایش و تحلیل پاسخ', icon: '🔍' },
  'question-builder': { title: 'طراح آزمون و برگه امتحانی', subtitle: 'صفحه‌آرایی، تولید فایل PDF و سربرگ‌های استاندارد امتحانی', icon: '📄' },
  announcements: { title: 'اطلاعیه‌ها و اخبار', subtitle: 'مدیریت و انتشار اعلانات رسمی به کاربران اپلیکیشن', icon: '📢' },
  notifications: { title: 'مرکز ارسال پوش‌نوتیفیکیشن (FCM)', subtitle: 'ارسال اعلان فوری، زمان‌بندی‌شده و دسته‌بندی‌شده', icon: '🔔' },
  'system-events': { title: 'تقویم و مناسبت‌های ملی/مذهبی', subtitle: 'مدیریت رویدادهای تقویم آموزشی و سال تحصیلی', icon: '🗓️' },
  music: { title: 'کتابخانه صوتی و موسیقی آموزشی', subtitle: 'مدیریت قطعات صوتی، زنگ‌ها و پس‌زمینه‌ها', icon: '🎵' },
  phonebook: { title: 'دفترچه تلفن و مخاطبین سازمانی', subtitle: 'دسترسی سریع به شماره‌های تماس مدارس و همکاران', icon: '📞' },
  support: { title: 'مرکز ارتباط و تیکت‌های پشتیبانی', subtitle: 'پاسخگویی به پیام‌ها و درخواست‌های معلمان و کاربران', icon: '💬' },
  settings: { title: 'تنظیمات و پیکربندی سیستم', subtitle: 'تنظیمات پایه، سطوح دسترسی و متغیرهای سامانه', icon: '⚙️' },
}

const AppShell = ({ children, activePage = 'dashboard', onNavigate, onBack }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuthStore()

  const pageMeta = PAGE_INFO[activePage] || {
    title: 'پنل مدیریت کیتایار',
    subtitle: 'سامانه یکپارچه مدیریت آموزشی',
    icon: '⚡',
  }

  const showBackButton = activePage !== 'dashboard' && activePage !== 'questions' && activePage !== 'settings'

  // تاریخ امروز به شمسی
  const todayPersian = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070B14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200" dir="rtl">
      {/* Ambient background glows for rich dark aesthetic */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 ease-in-out overflow-hidden bg-[#0A0F1D] border-l border-slate-800/80 shrink-0 shadow-2xl z-30`}
      >
        <div className="w-64 h-full">
          <Sidebar onClose={() => setSidebarOpen(false)} activePage={activePage} onNavigate={onNavigate as any} />
        </div>
      </aside>

      {/* Main App Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-b from-[#080C16] via-[#080C14] to-[#070A12]">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#0A0F1D]/80 backdrop-blur-xl border-b border-slate-800/70 flex items-center justify-between px-5 shrink-0 shadow-md z-20">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition shadow-sm"
                title="باز کردن منو"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}

            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition shadow-sm"
                title="بازگشت به صفحه قبل"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <span className="text-xl p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                {pageMeta.icon}
              </span>
              <div>
                <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  {pageMeta.title}
                </h1>
                {pageMeta.subtitle && (
                  <p className="text-[11px] text-slate-400 font-normal hidden md:block">
                    {pageMeta.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Status & User Info */}
          <div className="flex items-center gap-3">
            {/* Live Persian Date Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
              <span className="text-slate-400">📅</span>
              <span>{todayPersian}</span>
            </div>

            {/* System Online Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>سیستم آنلاین</span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pr-2 pl-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.fullName?.charAt(0) || 'م'}
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold text-slate-200 block leading-tight">
                  {user?.fullName || 'کاربر مدیر'}
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">
                  {user?.role === 'admin' ? 'مدیر ارشد' : 'معلم'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition mr-1"
                title="خروج از حساب"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8 w-full min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppShell
