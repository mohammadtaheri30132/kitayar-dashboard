import React from 'react'

interface PortalSelectorPageProps {
  onSelectTeacher: () => void
  onSelectStudent: () => void
}

export const PortalSelectorPage: React.FC<PortalSelectorPageProps> = ({
  onSelectTeacher,
  onSelectStudent,
}) => {
  return (
    <div
      className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none"
      dir="rtl"
    >
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/6 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/6 -left-24 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 text-center max-w-2xl mx-auto pt-6 sm:pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-4 shadow-sm">
          <span>⚡</span>
          <span>نسخه تحت وب پیش‌رونده (PWA) • بدون نیاز به دانلود</span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
            ک
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            سامانه کیتایار
          </h1>
        </div>

        <p className="text-sm sm:text-base text-slate-300 font-medium">
          پلتفرم یکپارچه مدیریت آموزش، آزمون‌ساز هوشمند و کلاس‌های آنلاین
        </p>
        <p className="text-xs text-slate-400 mt-1">
          جهت ورود به حساب کاربری خود، پورتال مورد نظر را انتخاب نمایید:
        </p>
      </header>

      {/* Main Choice Grid */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Teacher Web App (Kitayar) */}
        <div
          onClick={onSelectTeacher}
          className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/20 cursor-pointer backdrop-blur-xl"
        >
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md">
            🍎 مناسب iOS و دسکتاپ
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👨‍🏫
              </div>
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                ویژه معلمان و مدرسین
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
              وب‌اپلیکیشن کیتایار
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-normal">
              دسترسی کامل به ابزارهای معلمی در تمامی دستگاه‌ها (آیفون، آیپد، مک و ویندوز) بدون نیاز به نصب نرم‌افزار جانبی.
            </p>

            {/* Features Pill List */}
            <div className="flex flex-wrap gap-1.5 mt-5">
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                📚 مدیریت کلاس‌ها و دانش‌آموزان
              </span>
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                📝 آزمون‌ساز هوشمند
              </span>
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                📋 ثبت حضور و غیاب
              </span>
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                📑 تکالیف و کارنامه
              </span>
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                📹 برگزاری کلاس آنلاین
              </span>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
              ورود با شماره موبایل دبیر
            </span>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 group-hover:shadow-blue-600/50 flex items-center gap-2 transition-all group-hover:translate-x-[-4px]"
            >
              <span>ورود به وب‌اپلیکیشن</span>
              <span>←</span>
            </button>
          </div>
        </div>

        {/* Card 2: Student Web App (Nokita) */}
        <div
          onClick={onSelectStudent}
          className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-600/20 cursor-pointer backdrop-blur-xl"
        >
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md">
            🧑‍🎓 پورتال دانش‌آموزی
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🎓
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                ویژه دانش‌آموزان
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
              وب‌اپلیکیشن نوکیتا
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-normal">
              ورود به فضای کلاس‌های درسی، مشاهده تکالیف، شرکت در آزمون‌های مجاز و اطلاع از وضعیت نمرات و برنامه کلاسی.
            </p>

            {/* Features Pill List */}
            <div className="flex flex-wrap gap-1.5 mt-5">
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                🏫 مشاهده کلاس‌های من
              </span>
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                ✍️ شرکت در آزمون‌های مجاز
              </span>
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                📋 تکالیف و فعالیت‌ها
              </span>
              <span className="text-[11px] bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">
                📱 اتصال هوشمند به اپلیکیشن
              </span>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
              ورود با شماره موبایل دانش‌آموز
            </span>
            <button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 group-hover:shadow-emerald-600/50 flex items-center gap-2 transition-all group-hover:translate-x-[-4px]"
            >
              <span>ورود به وب‌اپلیکیشن</span>
              <span>←</span>
            </button>
          </div>
        </div>

      </main>

      {/* iOS PWA Helper Banner */}
      <footer className="relative z-10 max-w-3xl mx-auto w-full pb-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-md">
          <span className="text-lg">💡</span>
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-200">راهنمای کاربران آیفون و آیپد (iOS): </span>
            برای استفاده بدون دردسر و بدون نیاز به دانلود از اپ‌استور، کافیست در مرورگر Safari گزینه{' '}
            <span className="text-blue-400 font-bold">Share (اشتراک‌گذاری)</span> و سپس گزینه{' '}
            <span className="text-blue-400 font-bold">Add to Home Screen</span> را انتخاب کنید تا آیکون کیتایار روی صفحه گوشی شما قرار گیرد.
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4 font-mono">
          Kitayar Education Ecosystem • Teacher & Student Portals
        </p>
      </footer>
    </div>
  )
}

export default PortalSelectorPage

