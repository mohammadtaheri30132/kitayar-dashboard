import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { AuthWebModal } from './AuthWebModal'

const getInitialStudentUser = () => {
  try {
    const raw = localStorage.getItem('student-user')
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const formatText = (val: any, fallback = ''): string => {
  if (!val) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'object') return val.name || val.title || val.gradeName || fallback
  return String(val)
}

export const StudentWebApp: React.FC<{
  onBackToPortal: () => void
  onTakeExam?: (examId: string) => void
}> = ({ onBackToPortal, onTakeExam }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('student-token'))
  const [user, setUser] = useState<any>(getInitialStudentUser)

  const [classes, setClasses] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'classes' | 'exams'>('classes')

  // Search & Join Class Modal
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundClass, setFoundClass] = useState<any | null>(null)
  const [joining, setJoining] = useState(false)

  // Direct Exam Code Input
  const [directExamId, setDirectExamId] = useState('')

  // Nokita App Required Modal
  const [appRequiredModalExam, setAppRequiredModalExam] = useState<any | null>(null)

  // Selected Class for detailed view
  const [selectedClass, setSelectedClass] = useState<any | null>(null)

  const apiHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  }

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('student-token', newToken)
    if (newUser) {
      localStorage.setItem('student-user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('student-user')
    }
    setToken(newToken)
    setUser(newUser || null)
  }

  const handleLogout = () => {
    localStorage.removeItem('student-token')
    localStorage.removeItem('student-user')
    setToken(null)
    setUser(null)
    toast.success('از حساب دانش‌آموزی خارج شدید')
  }

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [classRes, examRes, profileRes] = await Promise.allSettled([
        axios.get('/api/student/classrooms/my-classes', apiHeaders),
        axios.get('/api/student/classrooms/my-exams', apiHeaders),
        axios.get('/api/student/auth/me', apiHeaders),
      ])

      if (classRes.status === 'fulfilled' && classRes.value.data?.success) {
        setClasses(classRes.value.data.data || [])
      }

      if (examRes.status === 'fulfilled' && examRes.value.data?.success) {
        setExams(examRes.value.data.data || [])
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.success) {
        const p = profileRes.value.data.data
        if (p) {
          const updated = { ...user, ...p }
          setUser(updated)
          localStorage.setItem('student-user', JSON.stringify(updated))
        }
      }
    } catch (err) {
      console.error('Failed to load student data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadData()
    }
  }, [token])

  const handleSearchClass = async () => {
    if (!searchCode.trim()) {
      toast.error('کد کلاس را وارد کنید')
      return
    }
    setSearching(true)
    setFoundClass(null)
    try {
      const res = await axios.get(`/api/student/classrooms/search/${searchCode.trim()}`, apiHeaders)
      if (res.data?.success && res.data?.data) {
        setFoundClass(res.data.data)
      } else {
        toast.error(res.data?.message || 'کلاسی با این کد یافت نشد')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'کلاسی با این کد پیدا نشد')
    } finally {
      setSearching(false)
    }
  }

  const handleSendJoinRequest = async () => {
    if (!foundClass?._id) return
    setJoining(true)
    try {
      const res = await axios.post('/api/student/classrooms/join-request', { classroomId: foundClass._id }, apiHeaders)
      if (res.data?.success) {
        toast.success('درخواست عضویت با موفقیت ارسال شد و در انتظار تایید دبیر است')
        setShowJoinModal(false)
        setFoundClass(null)
        setSearchCode('')
        loadData()
      } else {
        toast.error(res.data?.message || 'خطا در ارسال درخواست')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ثبت درخواست عضویت')
    } finally {
      setJoining(false)
    }
  }

  const handleExamClick = (exam: any) => {
    if (exam.requireAppOnly) {
      setAppRequiredModalExam(exam)
    } else {
      if (onTakeExam) {
        onTakeExam(exam._id || exam.id)
      } else {
        window.location.hash = `#/exam/${exam._id || exam.id}`
      }
    }
  }

  const handleDirectExamJoin = () => {
    if (!directExamId.trim()) {
      toast.error('لطفاً شناسه یا لینک آزمون را وارد کنید')
      return
    }
    let cleanedId = directExamId.trim()
    if (cleanedId.includes('/exam/')) {
      const parts = cleanedId.split('/exam/')
      cleanedId = parts[parts.length - 1].split('?')[0].split('#')[0]
    }
    if (onTakeExam) {
      onTakeExam(cleanedId)
    } else {
      window.location.hash = `#/exam/${cleanedId}`
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <AuthWebModal
          isOpen={true}
          onClose={onBackToPortal}
          onSuccess={handleAuthSuccess}
          targetRole="student"
        />
      </div>
    )
  }

  const activeClasses = classes.filter((c) => c.membershipStatus === 'ACTIVE' || !c.membershipStatus)
  const pendingClasses = classes.filter((c) => c.membershipStatus === 'PENDING')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPortal}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              title="بازگشت به انتخاب پرتال"
            >
              ← پرتال‌ها
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-lg">
                نو
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-1.5">
                  وب‌اپلیکیشن نوکیتا
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    دانش‌آموز
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">پنل دانش‌آموزی و کلاس‌های من</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile summary */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.fullName} className="w-full h-full object-cover" />
                ) : (
                  (user?.fullName || 'د')[0]
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">{user?.fullName || 'دانش‌آموز'}</div>
                <div className="text-[10px] text-cyan-400 font-mono">{user?.phoneNumber}</div>
              </div>
            </div>

            {/* Invited Count Badge */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-medium">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>دعوت‌شده‌ها: </span>
              <strong className="text-amber-200 font-bold">{user?.invitedCount || 0} نفر</strong>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition text-xs"
              title="خروج از حساب"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="max-w-6xl mx-auto px-4 flex gap-4 border-t border-slate-800/80 pt-2 pb-2">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'classes'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            کلاس‌های من ({classes.length})
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'exams'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            آزمون‌های من ({exams.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Banner: Join Class or Direct Exam */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Join Class with Code */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">عضویت در کلاس جدید</h3>
                <p className="text-xs text-slate-400">با وارد کردن کد کلاسی که معلم در اختیارتان گذاشته</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowJoinModal(true)
                setFoundClass(null)
                setSearchCode('')
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition"
            >
              + پیوستن به کلاس
            </button>
          </div>

          {/* Card 2: Direct Exam Link/Code */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm">ورود مستقیم به آزمون</h3>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={directExamId}
                  onChange={(e) => setDirectExamId(e.target.value)}
                  placeholder="شناسه یا لینک آزمون را وارد کنید..."
                  className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleDirectExamJoin}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition shrink-0"
                >
                  ورود
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Classes View */}
        {activeTab === 'classes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📚 کلاس‌های من</span>
                <span className="text-xs text-slate-400">({activeClasses.length} کلاس فعال)</span>
              </h2>
              <button
                onClick={loadData}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                بروزرسانی
              </button>
            </div>

            {loading && classes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">در حال دریافت کلاس‌ها...</div>
            ) : classes.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-10 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white mb-1">هنوز در کلاسی عضو نشده‌اید</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  کد کلاس را از دبیر خود دریافت کرده و با زدن دکمه «پیوستن به کلاس جدید» درخواست عضویت ارسال نمایید.
                </p>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  پیوستن به اولین کلاس
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => {
                  const isActive = cls.membershipStatus === 'ACTIVE' || !cls.membershipStatus
                  return (
                    <div
                      key={cls._id}
                      className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-white text-base">{cls.name || 'کلاس درس'}</h3>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {[formatText(cls.grade), formatText(cls.field), formatText(cls.schoolName)].filter(Boolean).join(' • ') || 'کلاس عمومی'}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {isActive ? 'عضو فعال' : 'در انتظار تایید'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 py-3 border-y border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">دبیر محترم:</span>
                            <span className="font-medium text-white">{cls.teacherName || cls.teacher?.fullName || 'معلم'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">کد کلاس:</span>
                            <span className="font-mono text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {cls.code || '---'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2 flex items-center justify-between">
                        {isActive ? (
                          <button
                            onClick={() => setSelectedClass(cls)}
                            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <span>مشاهده آزمون‌ها و جزئیات</span>
                            <span>←</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            درخواست شما ارسال شده و منتظر تایید دبیر است
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Exams View */}
        {activeTab === 'exams' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📝 آزمون‌های من</span>
                <span className="text-xs text-slate-400">({exams.length} آزمون ثبت‌شده)</span>
              </h2>
              <button
                onClick={loadData}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                بروزرسانی
              </button>
            </div>

            {loading && exams.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">در حال دریافت آزمون‌ها...</div>
            ) : exams.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-10 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white mb-1">در حال حاضر آزمون فعالی ندارید</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  آزمون‌هایی که توسط دبیرانتان تعریف می‌شوند در این قسمت نمایش داده خواهند شد.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => (
                  <div
                    key={exam._id}
                    className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white text-base">{exam.title}</h3>
                        {exam.requireAppOnly ? (
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                            📱 فقط در اپلیکیشن نوکیتا
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                            🌐 آزمون آنلاین تحت وب
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mb-3">
                        کلاس: {exam.classroom?.name || exam.classroomName || 'عمومی'}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 py-3 border-y border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">تعداد سوالات:</span>
                          <span className="font-bold text-white">{exam.questions?.length || exam.questionsCount || 0} سوال</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">بارم کل:</span>
                          <span className="font-bold text-white">{exam.totalScore || 20} نمره</span>
                        </div>
                        {exam.duration && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">مدت زمان:</span>
                            <span className="font-bold text-white">{exam.duration} دقیقه</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-2">
                      {exam.requireAppOnly ? (
                        <button
                          onClick={() => handleExamClick(exam)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>شرکت در آزمون (نیازمند اپلیکیشن)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleExamClick(exam)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>شروع آزمون آنلاین در وب</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal 1: Search & Join Class */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">پیوستن به کلاس جدید</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              کد ۶ رقمی یا اختصاصی کلاسی را که دبیر به شما داده است وارد کنید تا پس از بررسی، درخواست عضویت شما ثبت شود.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="مثال: 948215"
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono text-center tracking-wider focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSearchClass}
                disabled={searching}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs disabled:opacity-50 transition shrink-0"
              >
                {searching ? 'جستجو...' : 'یافتن کلاس'}
              </button>
            </div>

            {foundClass && (
              <div className="bg-slate-950/80 rounded-2xl border border-cyan-500/40 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">{foundClass.name}</h4>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                    کد: {foundClass.code}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div>دبیر: {foundClass.teacherName || foundClass.teacher?.fullName || 'نامشخص'}</div>
                  <div>مدرسه: {foundClass.schoolName || '---'}</div>
                  <div>پایه: {[formatText(foundClass.grade), formatText(foundClass.field)].filter(Boolean).join(' • ') || 'عمومی'}</div>
                </div>

                <button
                  onClick={handleSendJoinRequest}
                  disabled={joining}
                  className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {joining ? 'در حال ارسال درخواست...' : 'تایید و ارسال درخواست عضویت'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: App Download Required Modal (Mandatory as requested by User) */}
      {appRequiredModalExam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white mb-2">
              دانش‌آموز عزیز! برای شرکت در این آزمون باید اپلیکیشن نوکیتا را نصب کنید
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              دبیر محترم، آزمون <strong className="text-cyan-400">«{appRequiredModalExam.title}»</strong> را در وضعیت
              امنیت بالا تنظیم کرده است و شرکت در آن تنها از طریق نرم‌افزار اختصاصی نوکیتا مجاز است.
            </p>

            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 mb-6 text-right text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <span>⚠️ چرا باید از اپلیکیشن استفاده شود؟</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pr-2">
                <li>جلوگیری از خروج ناگهانی حین پاسخگویی</li>
                <li>تضمین برقراری ارتباط بدون قطعی اینترنت و وب‌سوکت</li>
                <li>ثبت دقیق تایمر آزمون و محاسبه خودکار نمرات</li>
              </ul>
            </div>

            <div className="space-y-3">
              <a
                href="/uploads/nokita.apk"
                download="nokita.apk"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>دانلود مستقیم اپلیکیشن نوکیتا (نسخه اندروید)</span>
              </a>

              <button
                onClick={() => setAppRequiredModalExam(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                بستن و بازگشت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Selected Class Details */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">{selectedClass.name}</h3>
                <p className="text-xs text-slate-400">کد کلاس: {selectedClass.code}</p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">دبیر:</span>
                <span className="text-white font-bold">{selectedClass.teacherName || selectedClass.teacher?.fullName || 'معلم'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">پایه و رشته:</span>
                <span className="text-white">{[formatText(selectedClass.grade), formatText(selectedClass.field)].filter(Boolean).join(' - ') || 'عمومی'}</span>
              </div>
              {selectedClass.schoolName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">مدرسه:</span>
                  <span className="text-white">{selectedClass.schoolName}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 text-center py-2">
              برای مشاهده تکالیف و کارنامه کامل، می‌توانید از اپلیکیشن نوکیتا استفاده کنید.
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedClass(null)
                  setActiveTab('exams')
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition text-center"
              >
                مشاهده آزمون‌های این کلاس
              </button>
              <button
                onClick={() => setSelectedClass(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default StudentWebApp

