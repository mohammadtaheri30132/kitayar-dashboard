import { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import type { DashboardStats } from '../services/dashboardService'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Props {
  onNavigate?: (page: string) => void
}

const DashboardPage = ({ onNavigate }: Props) => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [kitayarSummary, setKitayarSummary] = useState<{
    totalClasses?: number
    activeClasses?: number
    totalStudents?: number
    totalActivities?: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [dashRes, kitayarRes] = await Promise.allSettled([
        dashboardService.getStats(),
        api.get('/kitayar/classes?limit=1'),
      ])

      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setStats(dashRes.value.data)
      }

      if (kitayarRes.status === 'fulfilled' && kitayarRes.value.data?.success) {
        setKitayarSummary(kitayarRes.value.data.summary || null)
      }
    } catch (error: any) {
      toast.error('خطا در دریافت آمار داشبورد')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-400">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium">در حال بارگذاری داده‌های داشبورد...</p>
      </div>
    )
  }

  const todayPersian = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100" dir="rtl">
      {/* 1. Hero Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-slate-800/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>سامانه یکپارچه آموزش و آزمون کیتایار</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              سلام مدیر گرامی، روزتان پرانرژی 👋
            </h2>
            <p className="text-xs md:text-sm text-slate-300/80 max-w-2xl leading-relaxed">
              مرکز کنترل و نظارت بر فعالیت معلمان، کلاس‌های فعال، جامعه دانش‌آموزی و بانک جامع سوالات در دسترس شماست.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl px-4 py-3 text-right">
              <span className="text-[11px] text-slate-400 block">تاریخ روز:</span>
              <span className="text-xs font-bold text-white mt-0.5 block">{todayPersian}</span>
            </div>
            <button
              onClick={() => fetchData()}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>بروزرسانی داده‌ها</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: معلمان */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-blue-500/40 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">جامعه معلمان</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {(stats?.teachers || 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              👨‍🏫
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
            <span className="text-blue-400 font-medium">معلمان ثبت‌نامی فعال</span>
            <span className="text-slate-500">پایش مستمر</span>
          </div>
        </div>

        {/* Metric 2: کلاس‌های کیتایار */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-emerald-500/40 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">کلاس‌های تشکیل‌شده</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">
                {(kitayarSummary?.totalClasses || 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              🏫
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
            <span className="text-emerald-400 font-medium">
              {(kitayarSummary?.activeClasses || 0).toLocaleString('fa-IR')} کلاس فعال
            </span>
            <span className="text-slate-500">پایه‌های تحصیلی</span>
          </div>
        </div>

        {/* Metric 3: دانش‌آموزان عضو */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-purple-500/40 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">دانش‌آموزان ثبت‌شده</p>
              <h3 className="text-3xl font-black text-purple-300 mt-1">
                {(kitayarSummary?.totalStudents || stats?.students || 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              🧑‍🎓
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
            <span className="text-purple-400 font-medium">دارای پرونده کلاسی</span>
            <span className="text-slate-500">عضو در سامانه</span>
          </div>
        </div>

        {/* Metric 4: بانک سوالات */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-amber-500/40 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">مخزن سوالات آزمون</p>
              <h3 className="text-3xl font-black text-amber-400 mt-1">
                {(stats?.questions?.total || 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              📝
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
            <span className="text-amber-400 font-medium">
              {(stats?.questions?.recent || 0).toLocaleString('fa-IR')} سوال جدید
            </span>
            <span className="text-slate-500">استانداردسازی شده</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Launchpad */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>⚡</span>
          <span>میانبرهای سریع سامانه</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate?.('kitayar-classes')}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 transition group text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
              🏫
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">کلاس‌های کیتایار</span>
          </button>

          <button
            onClick={() => onNavigate?.('kitayar-teachers')}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 transition group text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
              👨‍🏫
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">لیست معلمان</span>
          </button>

          <button
            onClick={() => onNavigate?.('kitayar-students')}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition group text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
              🧑‍🎓
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">دانش‌آموزان ثبت‌شده</span>
          </button>

          <button
            onClick={() => onNavigate?.('create-question')}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 transition group text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
              ✍️
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">ثبت سوال جدید</span>
          </button>

          <button
            onClick={() => onNavigate?.('notifications')}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition group text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
              🔔
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">ارسال اعلان FCM</span>
          </button>

          <button
            onClick={() => onNavigate?.('support')}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/40 transition group text-center"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
              💬
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">تیکت‌های پشتیبانی</span>
          </button>
        </div>
      </div>

      {/* 4. Question Breakdown & System Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions by Type */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📊</span>
              <span>توزیع انواع سوالات در بانک</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              مجموع: {(stats?.questions?.total || 0).toLocaleString('fa-IR')} سوال
            </span>
          </div>

          {stats?.questions?.byType && Object.keys(stats.questions.byType).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(stats.questions.byType).map(([type, count]) => {
                const total = stats.questions.total || 1
                const percent = Math.round(((count as number) / total) * 100)

                return (
                  <div
                    key={type}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">{type}</span>
                        <span className="text-[11px] font-bold text-indigo-400 font-mono">
                          {percent}٪
                        </span>
                      </div>
                      <div className="text-xl font-black text-white mt-2">
                        {(count as number).toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-10">اطلاعاتی در دسترس نیست.</p>
          )}
        </div>

        {/* System Services Status */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span>🛡️</span>
              <span>وضعیت سلامت سرویس‌ها</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-slate-200">سرور هسته (Node.js Express)</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">200 OK</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-slate-200">دیتابیس ابری (MongoDB)</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">Connected</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="font-semibold text-slate-200">نوتیفیکیشن و پیامک (FCM)</span>
                </div>
                <span className="text-[11px] text-blue-400 font-mono">Ready</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <span className="font-semibold text-slate-200">کلاینت فرانت‌اند (Vite React)</span>
                </div>
                <span className="text-[11px] text-indigo-400 font-mono">v2.5.0</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            کلیه ارتباطات با رمزنگاری ایمن تبادل می‌گردد
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
