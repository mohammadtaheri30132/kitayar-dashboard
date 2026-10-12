import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  adminCommunityService,
  type AdminCommunityStats,
  type AdminCategory,
  type AdminQuestion,
  type AdminAnswer,
  type AdminReport,
  type AdminRestriction,
  type AdminAuditLog,
  type AdminCommunitySettings,
} from '../services/adminCommunityService'

type CommunityTab =
  | 'overview'
  | 'pending_queue'
  | 'forbidden_words'
  | 'questions'
  | 'answers'
  | 'categories'
  | 'reports'
  | 'audit'

const TABS: { id: CommunityTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'داشبورد و آمار', icon: '📊' },
  { id: 'pending_queue', label: 'صف بررسی محتوا', icon: '⏳' },
  { id: 'forbidden_words', label: 'کلمات ممنوعه و فیلتر', icon: '🛡️' },
  { id: 'questions', label: 'مدیریت پرسش‌ها', icon: '❓' },
  { id: 'answers', label: 'مدیریت پاسخ‌ها', icon: '💬' },
  { id: 'categories', label: 'دسته‌بندی‌های تالار', icon: '🏷️' },
  { id: 'reports', label: 'گزارش‌های تخلف', icon: '🚨' },
  { id: 'audit', label: 'لاگ امنیتی', icon: '📜' },
]

export default function CommunityManagementPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('overview')
  const [loading, setLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState<AdminCommunityStats | null>(null)

  // Pending Queue
  const [pendingQuestions, setPendingQuestions] = useState<AdminQuestion[]>([])
  const [pendingAnswers, setPendingAnswers] = useState<AdminAnswer[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)

  // Forbidden Words & Settings
  const [settings, setSettings] = useState<AdminCommunitySettings>({
    forbiddenWords: [],
    autoApproveText: true,
    requireApprovalForImages: true,
  })
  const [newWordInput, setNewWordInput] = useState('')

  // Categories
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    order: 0,
    isActive: true,
  })
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null)
  const [reassignCatId, setReassignCatId] = useState<string>('')

  // Questions
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [qSearch, setQSearch] = useState('')
  const [qCatFilter, setQCatFilter] = useState('')
  const [qStatusFilter, setQStatusFilter] = useState('')

  // Answers
  const [answers, setAnswers] = useState<AdminAnswer[]>([])
  const [ansSearch, setAnsSearch] = useState('')

  // Reports
  const [reports, setReports] = useState<AdminReport[]>([])
  const [reportStatusFilter, setReportStatusFilter] = useState('')
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [modNotes, setModNotes] = useState('')

  // Restrictions & Audit
  const [restrictions, setRestrictions] = useState<AdminRestriction[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])

  // ----------------------------------------------------------------------------
  // Loaders
  // ----------------------------------------------------------------------------
  const loadStats = useCallback(async () => {
    try {
      const data = await adminCommunityService.getStats()
      setStats(data)
    } catch {
      toast.error('خطا در دریافت آمار تالار')
    }
  }, [])

  const loadPendingQueue = useCallback(async () => {
    try {
      const res = await adminCommunityService.getPendingReviews()
      setPendingQuestions(res.questions || [])
      setPendingAnswers(res.answers || [])
      setPendingTotal(res.total || 0)
    } catch {
      // silent
    }
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const data = await adminCommunityService.getSettings()
      if (data) setSettings(data)
    } catch {
      toast.error('خطا در دریافت تنظیمات فیلتر کلمات')
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const data = await adminCommunityService.getCategories()
      setCategories(data)
    } catch {
      toast.error('خطا در دریافت دسته‌بندی‌ها')
    }
  }, [])

  const loadQuestions = useCallback(async () => {
    try {
      const res = await adminCommunityService.getQuestions({
        search: qSearch || undefined,
        category: qCatFilter || undefined,
        status: qStatusFilter || undefined,
      })
      setQuestions(res.questions)
    } catch {
      toast.error('خطا در دریافت پرسش‌ها')
    }
  }, [qSearch, qCatFilter, qStatusFilter])

  const loadAnswers = useCallback(async () => {
    try {
      const res = await adminCommunityService.getAnswers({ search: ansSearch || undefined })
      setAnswers(res.answers)
    } catch {
      toast.error('خطا در دریافت پاسخ‌ها')
    }
  }, [ansSearch])

  const loadReports = useCallback(async () => {
    try {
      const res = await adminCommunityService.getReports({
        status: reportStatusFilter || undefined,
      })
      setReports(res.reports)
    } catch {
      toast.error('خطا در دریافت گزارش‌ها')
    }
  }, [reportStatusFilter])

  const loadRestrictions = useCallback(async () => {
    try {
      const res = await adminCommunityService.getRestrictions()
      setRestrictions(res.restrictions)
    } catch {
      toast.error('خطا در دریافت لیست محدودیت‌ها')
    }
  }, [])

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await adminCommunityService.getAuditLogs()
      setAuditLogs(res.logs)
    } catch {
      toast.error('خطا در دریافت وقایع امنیتی')
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      loadStats(),
      loadPendingQueue(),
      loadSettings(),
      loadCategories(),
      loadQuestions(),
      loadAnswers(),
      loadReports(),
    ])
    setLoading(false)
  }, [loadStats, loadPendingQueue, loadSettings, loadCategories, loadQuestions, loadAnswers, loadReports])

  useEffect(() => {
    refreshAll()
  }, [])

  // ----------------------------------------------------------------------------
  // Actions: Pending Queue Approval
  // ----------------------------------------------------------------------------
  const handleApproveQuestion = async (id: string) => {
    try {
      await adminCommunityService.approveQuestion(id)
      toast.success('پرسش با موفقیت تأیید و منتشر شد')
      loadPendingQueue()
      loadQuestions()
      loadStats()
    } catch {
      toast.error('خطا در تأیید پرسش')
    }
  }

  const handleApproveAnswer = async (id: string) => {
    try {
      await adminCommunityService.approveAnswer(id)
      toast.success('پاسخ با موفقیت تأیید و منتشر شد')
      loadPendingQueue()
      loadAnswers()
      loadStats()
    } catch {
      toast.error('خطا در تأیید پاسخ')
    }
  }

  const handleRejectQuestion = async (id: string) => {
    if (!confirm('آیا از رد و حذف این پرسش اطمینان دارید؟')) return
    try {
      await adminCommunityService.updateQuestionStatus(id, { status: 'deleted' })
      toast.success('پرسش رد و حذف شد')
      loadPendingQueue()
      loadQuestions()
    } catch {
      toast.error('خطا در حذف پرسش')
    }
  }

  const handleRejectAnswer = async (id: string) => {
    if (!confirm('آیا از رد و حذف این پاسخ اطمینان دارید؟')) return
    try {
      await adminCommunityService.updateAnswerStatus(id, 'deleted')
      toast.success('پاسخ رد و حذف شد')
      loadPendingQueue()
      loadAnswers()
    } catch {
      toast.error('خطا در حذف پاسخ')
    }
  }

  // ----------------------------------------------------------------------------
  // Actions: Forbidden Words & Settings
  // ----------------------------------------------------------------------------
  const handleAddWord = async () => {
    if (!newWordInput.trim()) return
    try {
      const words = await adminCommunityService.addForbiddenWord(newWordInput.trim())
      setSettings(prev => ({ ...prev, forbiddenWords: words }))
      setNewWordInput('')
      toast.success('کلمه به لیست کلمات حساس اضافه شد')
    } catch {
      toast.error('خطا در افزودن کلمه')
    }
  }

  const handleRemoveWord = async (w: string) => {
    try {
      const words = await adminCommunityService.removeForbiddenWord(w)
      setSettings(prev => ({ ...prev, forbiddenWords: words }))
      toast.success('کلمه با موفقیت حذف شد')
    } catch {
      toast.error('خطا در حذف کلمه')
    }
  }

  const handleToggleAutoApprove = async () => {
    try {
      const updated = await adminCommunityService.updateSettings({
        autoApproveText: !settings.autoApproveText,
      })
      setSettings(prev => ({ ...prev, autoApproveText: updated.autoApproveText }))
      toast.success('تنظیمات ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره تنظیمات')
    }
  }

  const handleToggleRequireImages = async () => {
    try {
      const updated = await adminCommunityService.updateSettings({
        requireApprovalForImages: !settings.requireApprovalForImages,
      })
      setSettings(prev => ({ ...prev, requireApprovalForImages: updated.requireApprovalForImages }))
      toast.success('تنظیمات ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره تنظیمات')
    }
  }

  // ----------------------------------------------------------------------------
  // Actions: Categories
  // ----------------------------------------------------------------------------
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await adminCommunityService.updateCategory(editingCategory._id, catForm)
        toast.success('دسته‌بندی با موفقیت ویرایش شد')
      } else {
        await adminCommunityService.createCategory(catForm)
        toast.success('دسته‌بندی جدید با موفقیت ایجاد شد')
      }
      setIsCatModalOpen(false)
      setEditingCategory(null)
      loadCategories()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ثبت دسته‌بندی')
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteCatId) return
    try {
      await adminCommunityService.deleteCategory(deleteCatId, reassignCatId || undefined)
      toast.success('دسته‌بندی با موفقیت حذف شد')
      setDeleteCatId(null)
      setReassignCatId('')
      loadCategories()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در حذف دسته‌بندی')
    }
  }

  // ----------------------------------------------------------------------------
  // Actions: Questions & Answers Status
  // ----------------------------------------------------------------------------
  const handleTogglePinQuestion = async (q: AdminQuestion) => {
    try {
      await adminCommunityService.updateQuestionStatus(q._id, { isPinned: !q.isPinned })
      toast.success(q.isPinned ? 'پین پرسش برداشته شد' : 'پرسش در بالای تالار سنجاق شد')
      loadQuestions()
    } catch {
      toast.error('خطا در تغییر وضعیت پین')
    }
  }

  const handleChangeQuestionStatus = async (id: string, status: string) => {
    try {
      await adminCommunityService.updateQuestionStatus(id, { status })
      toast.success('وضعیت پرسش تغییر کرد')
      loadQuestions()
    } catch {
      toast.error('خطا در تغییر وضعیت')
    }
  }

  const handleChangeAnswerStatus = async (id: string, status: string) => {
    try {
      await adminCommunityService.updateAnswerStatus(id, status)
      toast.success('وضعیت پاسخ تغییر کرد')
      loadAnswers()
    } catch {
      toast.error('خطا در تغییر وضعیت')
    }
  }

  // ----------------------------------------------------------------------------
  // Actions: Reports
  // ----------------------------------------------------------------------------
  const handleResolveReport = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport) return
    try {
      await adminCommunityService.resolveReport(selectedReport._id, {
        status,
        moderatorNotes: modNotes,
        actionTaken: status === 'resolved' ? 'تأیید تخلف و اقدام نظارتی' : 'رد گزارش',
      })
      toast.success('گزارش با موفقیت رسیدگی شد')
      setSelectedReport(null)
      setModNotes('')
      loadReports()
      loadStats()
    } catch {
      toast.error('خطا در رسیدگی به گزارش')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans" dir="rtl">
      {/* Header Banner with Rich Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 p-6 md:p-8 border border-indigo-500/20 shadow-2xl mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-full">
                مدیریت انجمن و تالار معلمان
              </span>
              {pendingTotal > 0 && (
                <span className="px-3 py-1 text-xs font-bold bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-full animate-pulse">
                  ⚡ {pendingTotal} مورد در انتظار بازبینی
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              سامانه نظارت بر پرسش و پاسخ معلمان (کیتایار)
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              انتشار خودکار سوالات، سیستم فیلتر کلمات نامناسب، بازبینی تصاویر، و مدیریت دسته‌بندی‌های درسی و اداری.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition"
            >
              <span>{loading ? 'در حال بارگذاری...' : '🔄 بروزرسانی'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-slate-800">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const isPendingTab = tab.id === 'pending_queue'
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'audit') loadAuditLogs()
                if (tab.id === 'reports') loadReports()
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {isPendingTab && pendingTotal > 0 && (
                <span className="px-2 py-0.5 text-xs font-black bg-amber-500 text-slate-950 rounded-full">
                  {pendingTotal}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & DASHBOARD METRICS */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Pending */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 shadow-lg">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-sm font-bold">در انتظار بررسی ادمین</span>
                <span className="text-xl">⏳</span>
              </div>
              <div className="text-3xl font-black text-amber-300">{pendingTotal}</div>
              <p className="text-xs text-amber-400/80 mt-1">
                پرسش‌ها و پاسخ‌های دارای تصویر یا واژگان خاص
              </p>
            </div>

            {/* Metric 2: Total Questions */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-lg">
              <div className="flex items-center justify-between text-indigo-400 mb-2">
                <span className="text-sm font-bold">کل پرسش‌های فعال</span>
                <span className="text-xl">❓</span>
              </div>
              <div className="text-3xl font-black text-indigo-300">
                {stats?.activeQuestions ?? 0}
              </div>
              <p className="text-xs text-indigo-400/80 mt-1">
                از مجموع {stats?.totalQuestions ?? 0} سوال ثبت شده
              </p>
            </div>

            {/* Metric 3: Total Answers */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-lg">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-sm font-bold">پاسخ‌های معلمان</span>
                <span className="text-xl">💬</span>
              </div>
              <div className="text-3xl font-black text-emerald-300">
                {stats?.totalAnswers ?? 0}
              </div>
              <p className="text-xs text-emerald-400/80 mt-1">تبادل نظر و راهنمایی‌های آموزشی</p>
            </div>

            {/* Metric 4: Open Reports */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-500/30 shadow-lg">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-sm font-bold">گزارش‌های تخلف باز</span>
                <span className="text-xl">🚨</span>
              </div>
              <div className="text-3xl font-black text-rose-300">
                {stats?.pendingReports ?? 0}
              </div>
              <p className="text-xs text-rose-400/80 mt-1">نیازمند بازبینی توسط مدیران</p>
            </div>
          </div>

          {/* Quick Actions & Policy Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
                <span>🛡️</span> وضعیت قوانین انتشار خودکار
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div>
                    <div className="font-semibold text-sm text-slate-200">
                      انتشار خودکار متون پاک
                    </div>
                    <div className="text-xs text-slate-400">
                      متون بدون کلمات ممنوعه مستقیماً منتشر می‌شوند.
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      settings.autoApproveText
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {settings.autoApproveText ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div>
                    <div className="font-semibold text-sm text-slate-200">
                      بررسی اجباری موارد دارای عکس
                    </div>
                    <div className="text-xs text-slate-400">
                      تصاویر و فایل‌های پیوست پیش از انتشار به صف بررسی می‌روند.
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      settings.requireApprovalForImages
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {settings.requireApprovalForImages ? 'الزامی' : 'آزاد'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div>
                    <div className="font-semibold text-sm text-slate-200">
                      تعداد واژگان در لیست سیاه
                    </div>
                    <div className="text-xs text-slate-400">
                      کلمات حساس که انتشار را معلق می‌کنند.
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    {settings.forbiddenWords.length} واژه
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
                  <span>⚡</span> دسترسی‌های سریع
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  بررسی فوری موارد معلق یا تغییر در واژگان ممنوعه تالار.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('pending_queue')}
                    className="p-3.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-sm font-bold flex flex-col items-center justify-center gap-1 transition"
                  >
                    <span className="text-xl">⏳</span>
                    <span>صف بررسی ({pendingTotal})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('forbidden_words')}
                    className="p-3.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-sm font-bold flex flex-col items-center justify-center gap-1 transition"
                  >
                    <span className="text-xl">🛡️</span>
                    <span>کلمات ممنوعه</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className="p-3.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-sm font-bold flex flex-col items-center justify-center gap-1 transition"
                  >
                    <span className="text-xl">❓</span>
                    <span>لیست سوالات</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="p-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex flex-col items-center justify-center gap-1 transition"
                  >
                    <span className="text-xl">🏷️</span>
                    <span>دسته‌بندی‌ها</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: PENDING REVIEW QUEUE */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'pending_queue' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⏳</span> صف بررسی و تأیید محتوا
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                مواردی که به دلیل وجود تصویر یا شناسایی کلمات ممنوعه به صورت خودکار معلق شده‌اند.
              </p>
            </div>
            <button
              onClick={loadPendingQueue}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
            >
              تازه‌سازی صف
            </button>
          </div>

          {pendingTotal === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-slate-200">صف بررسی خالی است!</h3>
              <p className="text-slate-400 text-sm mt-1">
                تمامی پرسش‌ها و پاسخ‌های نیازمند بازبینی تایید یا رد شده‌اند.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Questions */}
              {pendingQuestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-md font-bold text-amber-400 flex items-center gap-2">
                    <span>❓</span> پرسش‌های در انتظار تأیید ({pendingQuestions.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {pendingQuestions.map((q) => (
                      <div
                        key={q._id}
                        className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {q.moderationReason === 'contains_bad_words'
                                ? '⚠️ حاوی کلمات حساس'
                                : q.moderationReason === 'contains_image'
                                ? '🖼️ دارای پیوست تصویر'
                                : 'نیازمند بررسی'}
                            </span>
                            {q.category && (
                              <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                                {q.category.name}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            نویسنده: <strong className="text-slate-200">{q.author?.name}</strong>
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-white mb-1">{q.title}</h4>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                            {q.body}
                          </p>
                        </div>

                        {/* Attachments preview */}
                        {q.attachments && q.attachments.length > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">پیوست‌ها:</span>
                            {q.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:underline flex items-center gap-1"
                              >
                                <span>📎</span> مشاهده تصویر/فایل
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleRejectQuestion(q._id)}
                            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition"
                          >
                            ✕ رد و حذف
                          </button>
                          <button
                            onClick={() => handleApproveQuestion(q._id)}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
                          >
                            ✓ تأیید و انتشار در تالار
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Answers */}
              {pendingAnswers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-md font-bold text-amber-400 flex items-center gap-2">
                    <span>💬</span> پاسخ‌های در انتظار تأیید ({pendingAnswers.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {pendingAnswers.map((ans) => (
                      <div
                        key={ans._id}
                        className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {ans.moderationReason === 'contains_bad_words'
                              ? '⚠️ حاوی کلمات حساس'
                              : ans.moderationReason === 'contains_image'
                              ? '🖼️ دارای پیوست تصویر'
                              : 'نیازمند بررسی'}
                          </span>
                          <span className="text-xs text-slate-400">
                            پاسخ‌دهنده: <strong className="text-slate-200">{ans.author?.name}</strong>
                          </span>
                        </div>

                        {ans.question && (
                          <div className="text-xs text-slate-400">
                            در پاسخ به سوال: <span className="text-indigo-300 font-semibold">{ans.question.title}</span>
                          </div>
                        )}

                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                          {ans.body}
                        </p>

                        {/* Attachments */}
                        {ans.attachments && ans.attachments.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">پیوست‌ها:</span>
                            {ans.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:underline flex items-center gap-1"
                              >
                                <span>📎</span> مشاهده تصویر/فایل
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleRejectAnswer(ans._id)}
                            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition"
                          >
                            ✕ رد و حذف
                          </button>
                          <button
                            onClick={() => handleApproveAnswer(ans._id)}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
                          >
                            ✓ تأیید و انتشار پاسخ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 3: FORBIDDEN WORDS & MODERATION SETTINGS */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'forbidden_words' && (
        <div className="space-y-6">
          {/* Rules & Toggles */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚙️</span> تنظیمات انتشار و نظارت خودکار
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={handleToggleAutoApprove}
                className="cursor-pointer p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition"
              >
                <div>
                  <div className="font-bold text-sm text-slate-100">
                    انتشار خودکار متون پاک
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    در صورت فعال بودن، سوال و پاسخ بدون نیاز به تایید ادمین فوراً نمایش داده می‌شود.
                  </div>
                </div>
                <div
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    settings.autoApproveText ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.autoApproveText ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              <div
                onClick={handleToggleRequireImages}
                className="cursor-pointer p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition"
              >
                <div>
                  <div className="font-bold text-sm text-slate-100">
                    الزام بررسی موارد دارای تصویر و فایل
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    هرگونه پرسش یا پاسخ دارای پیوست حتماً وارد صف بازبینی ناظر می‌شود.
                  </div>
                </div>
                <div
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    settings.requireApprovalForImages ? 'bg-amber-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.requireApprovalForImages ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Forbidden Words Manager */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🛡️</span> مدیریت کلمات و واژگان ممنوعه ({settings.forbiddenWords.length} کلمه)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                اگر سوال یا پاسخی حاوی هر یک از این واژه‌ها باشد، فوراً به حالت «در حال بررسی» تغییر یافته و به صف بازبینی منتقل می‌شود.
              </p>
            </div>

            {/* Add new word input */}
            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                placeholder="کلمه حساس یا توهین‌آمیز جدید..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddWord}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                + افزودن واژه
              </button>
            </div>

            {/* Word Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {settings.forbiddenWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition"
                >
                  <span>{word}</span>
                  <button
                    onClick={() => handleRemoveWord(word)}
                    className="text-rose-400 hover:text-rose-200 transition font-bold"
                    title="حذف کلمه"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 4: QUESTIONS MANAGEMENT */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="جستجو در عنوان یا متن سوال..."
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 flex-1 min-w-[200px]"
            />
            <select
              value={qCatFilter}
              onChange={(e) => setQCatFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={qStatusFilter}
              onChange={(e) => setQStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="active">منتشر شده</option>
              <option value="pending_review">در حال بررسی</option>
              <option value="hidden">پنهان شده</option>
            </select>
            <button
              onClick={loadQuestions}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
            >
              اعمال فیلتر
            </button>
          </div>

          {/* Questions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800/60 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">عنوان پرسش</th>
                  <th className="p-4">دسته</th>
                  <th className="p-4">نویسنده</th>
                  <th className="p-4">پاسخ‌ها</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      هیچ سوالی با این مشخصات یافت نشد.
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-slate-100 line-clamp-1">{q.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{q.body}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300">
                          {q.category?.name || 'نامشخص'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-xs">
                        <div className="font-bold">{q.author?.name}</div>
                        <div className="text-slate-500">{q.author?.role || 'معلم'}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-200">
                        💬 {q.answerCount || 0}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            q.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : q.status === 'pending_review'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {q.status === 'active'
                            ? '✓ منتشر شده'
                            : q.status === 'pending_review'
                            ? '⏳ در حال بررسی'
                            : 'پنهان'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {q.status === 'pending_review' && (
                            <button
                              onClick={() => handleApproveQuestion(q._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                              title="تأیید فوری"
                            >
                              ✓ تأیید
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePinQuestion(q)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                              q.isPinned
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                            title="سنجاق کردن"
                          >
                            📌
                          </button>
                          <button
                            onClick={() =>
                              handleChangeQuestionStatus(
                                q._id,
                                q.status === 'hidden' ? 'active' : 'hidden'
                              )
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                            title="تغییر وضعیت نمایش"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleChangeQuestionStatus(q._id, 'deleted')}
                            className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs"
                            title="حذف سوال"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 5: ANSWERS MANAGEMENT */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'answers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <input
              type="text"
              value={ansSearch}
              onChange={(e) => setAnsSearch(e.target.value)}
              placeholder="جستجو در متن پاسخ‌ها یا نویسنده..."
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 flex-1 max-w-md"
            />
            <button
              onClick={loadAnswers}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
            >
              جستجو
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800/60 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">متن پاسخ</th>
                  <th className="p-4">پرسش مربوطه</th>
                  <th className="p-4">نویسنده</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {answers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      پاسخی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  answers.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 max-w-md">
                        <div className="text-slate-200 line-clamp-2">{a.body}</div>
                      </td>
                      <td className="p-4 text-xs text-indigo-300 font-semibold max-w-xs truncate">
                        {a.question?.title || 'سوال نامشخص'}
                      </td>
                      <td className="p-4 text-xs text-slate-300">
                        {a.author?.name || 'کاربر'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            a.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : a.status === 'pending_review'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {a.status === 'active'
                            ? '✓ منتشر شده'
                            : a.status === 'pending_review'
                            ? '⏳ در حال بررسی'
                            : 'پنهان'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {a.status === 'pending_review' && (
                            <button
                              onClick={() => handleApproveAnswer(a._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                            >
                              ✓ تأیید
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleChangeAnswerStatus(
                                a._id,
                                a.status === 'hidden' ? 'active' : 'hidden'
                              )
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleChangeAnswerStatus(a._id, 'deleted')}
                            className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 6: CATEGORIES */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏷️</span> دسته‌بندی‌های تالار گفتگو
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                شامل دروس پرطرفدار، بخش اداری، اخبار و کلاس‌داری.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null)
                setCatForm({
                  name: '',
                  slug: '',
                  description: '',
                  color: '#3b82f6',
                  order: categories.length + 1,
                  isActive: true,
                })
                setIsCatModalOpen(true)
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              + دسته جدید
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: (cat.color || '#3b82f6') + '20',
                        color: cat.color || '#3b82f6',
                        border: `1px solid ${cat.color || '#3b82f6'}40`,
                      }}
                    >
                      {cat.name}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ترتیب: {cat.order}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                    {cat.description || 'بدون توضیحات'}
                  </p>
                  <div className="text-xs font-semibold text-indigo-300">
                    ❓ {cat.questionCount || 0} سوال
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setEditingCategory(cat)
                      setCatForm({
                        name: cat.name,
                        slug: cat.slug,
                        description: cat.description || '',
                        color: cat.color || '#3b82f6',
                        order: cat.order,
                        isActive: cat.isActive,
                      })
                      setIsCatModalOpen(true)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => setDeleteCatId(cat._id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold border border-rose-500/30"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 7: REPORTS */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🚨</span> صف گزارش‌های تخلف کاربران ({reports.length})
            </h2>
            <select
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="pending">در انتظار بررسی</option>
              <option value="resolved">رسیدگی شده</option>
              <option value="dismissed">رد شده</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800/60 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">نوع</th>
                  <th className="p-4">علت</th>
                  <th className="p-4">توضیحات گزارش‌دهنده</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      هیچ گزارشی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-indigo-300">{r.targetType}</td>
                      <td className="p-4 text-slate-200">{r.reason}</td>
                      <td className="p-4 text-xs text-slate-400">{r.description || '-'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            r.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : r.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {r.status === 'pending'
                            ? 'در انتظار'
                            : r.status === 'resolved'
                            ? 'رسیدگی شد'
                            : 'رد شد'}
                        </span>
                      </td>
                      <td className="p-4">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedReport(r)
                              setModNotes('')
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                          >
                            رسیدگی
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 8: AUDIT LOGS */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📜</span> تاریخچه اقدامات نظارتی و امنیتی
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800/60 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">عملیات</th>
                  <th className="p-4">اقدام‌کننده</th>
                  <th className="p-4">موجودیت</th>
                  <th className="p-4">جزئیات</th>
                  <th className="p-4">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      هیچ لاگی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-indigo-300 text-xs">{log.action}</td>
                      <td className="p-4 text-xs text-slate-200">{log.actorName}</td>
                      <td className="p-4 text-xs text-slate-400">{log.targetType}</td>
                      <td className="p-4 text-xs text-slate-400 font-mono">
                        {JSON.stringify(log.details || {})}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: CATEGORY CREATE / EDIT */}
      {/* -------------------------------------------------------------------- */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  نام دسته‌بندی *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  شناسه یکتا (Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="e.g. math"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  توضیحات
                </label>
                <textarea
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    رنگ نشانگر
                  </label>
                  <input
                    type="color"
                    value={catForm.color}
                    onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ترتیب نمایش
                  </label>
                  <input
                    type="number"
                    value={catForm.order}
                    onChange={(e) =>
                      setCatForm({ ...catForm, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  ذخیره دسته‌بندی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: DELETE CATEGORY WITH REASSIGNMENT */}
      {/* -------------------------------------------------------------------- */}
      {deleteCatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">حذف دسته‌بندی</h3>
            <p className="text-xs text-slate-400 mb-4">
              در صورت وجود سوال در این دسته، لطفاً دسته‌بندی جایگزین برای انتقال سوالات را مشخص کنید.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                انتقال سوالات به:
              </label>
              <select
                value={reassignCatId}
                onChange={(e) => setReassignCatId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
              >
                <option value="">انتخاب دسته جایگزین...</option>
                {categories
                  .filter((c) => c._id !== deleteCatId)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteCatId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
              >
                انصراف
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm"
              >
                تأیید حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: RESOLVE REPORT */}
      {/* -------------------------------------------------------------------- */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">رسیدگی به گزارش تخلف</h3>
            <div className="text-xs text-slate-300 mb-2">
              علت گزارش: <strong className="text-rose-400">{selectedReport.reason}</strong>
            </div>
            <p className="text-xs text-slate-400 mb-4 bg-slate-800/60 p-3 rounded-xl">
              {selectedReport.description || 'بدون توضیحات کاربر'}
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                یادداشت ناظر:
              </label>
              <textarea
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                placeholder="توضیحات اقدام انجام شده..."
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                بستن
              </button>
              <button
                onClick={() => handleResolveReport('dismissed')}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold"
              >
                رد گزارش
              </button>
              <button
                onClick={() => handleResolveReport('resolved')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                تأیید و مختومه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
