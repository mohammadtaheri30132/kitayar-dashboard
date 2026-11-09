import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { AuthWebModal, AVATAR_PRESETS } from './AuthWebModal'

type TeacherTab = 'classes' | 'exams' | 'online_class' | 'profile'
type ClassSubTab = 'students' | 'attendance' | 'exams' | 'reports'
type AttendanceStatus = 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | 'LATE'

const getInitialTeacherUser = () => {
  try {
    const raw = localStorage.getItem('teacher-user')
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

export const TeacherWebApp: React.FC<{ onBackToPortal: () => void }> = ({ onBackToPortal }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('teacher-token'))
  const [user, setUser] = useState<any>(getInitialTeacherUser)
  const [activeTab, setActiveTab] = useState<TeacherTab>('classes')

  // Data states
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ invitedCount: 0, classesCount: 0, studentsCount: 0, examsCount: 0 })
  const [loading, setLoading] = useState<boolean>(false)

  // Create Class Modal
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassGrade, setNewClassGrade] = useState('نهم')
  const [newClassSubject, setNewClassSubject] = useState('ریاضی')
  const [creatingClass, setCreatingClass] = useState(false)

  // Create Exam Modal
  const [showCreateExamModal, setShowCreateExamModal] = useState(false)
  const [examTitle, setExamTitle] = useState('')
  const [examClassId, setExamClassId] = useState('')
  const [examDuration, setExamDuration] = useState('60')
  const [examTotalScore, setExamTotalScore] = useState('20')
  const [requireAppOnly, setRequireAppOnly] = useState(false) // الزام به شرکت صرفاً در اپلیکیشن نوکیتا
  const [examQuestionText, setExamQuestionText] = useState('')
  const [creatingExam, setCreatingExam] = useState(false)

  // Selected Class details (مدیریت کلاس اختصاصی)
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  const [classSubTab, setClassSubTab] = useState<ClassSubTab>('students')
  const [classStudents, setClassStudents] = useState<any[]>([])
  const [classJoinRequests, setClassJoinRequests] = useState<any[]>([])
  const [classReports, setClassReports] = useState<any | null>(null)
  const [classDetailsLoading, setClassDetailsLoading] = useState(false)

  // Add Student Modal in Class
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [newStudentPhone, setNewStudentPhone] = useState('')
  const [newStudentName, setNewStudentName] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)

  // Attendance state inside Class
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [savingAttendance, setSavingAttendance] = useState(false)

  const apiHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  }

  // Handle Login Success
  const handleAuthSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('teacher-token', newToken)
    if (newUser) {
      localStorage.setItem('teacher-user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('teacher-user')
    }
    setToken(newToken)
    setUser(newUser || null)
  }

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('teacher-token')
    localStorage.removeItem('teacher-user')
    setToken(null)
    setUser(null)
    toast.success('از حساب کاربری معلم خارج شدید')
  }

  // Load Data
  const loadData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [classRes, examRes, profileRes] = await Promise.allSettled([
        axios.get('/api/teacher/classrooms', apiHeaders),
        axios.get('/api/teacher/exams', apiHeaders),
        axios.get('/api/teacher/profile', apiHeaders),
      ])

      if (classRes.status === 'fulfilled' && classRes.value.data?.success) {
        setClassrooms(classRes.value.data.data || [])
        if (!examClassId && classRes.value.data.data?.length > 0) {
          setExamClassId(classRes.value.data.data[0]._id)
        }
      }

      if (examRes.status === 'fulfilled' && examRes.value.data?.success) {
        setExams(examRes.value.data.data || [])
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.success) {
        const p = profileRes.value.data.data
        const s = profileRes.value.data.stats || {}
        setStats({
          invitedCount: s.invitedCount ?? p.invitedCount ?? 0,
          classesCount: s.classesCount ?? 0,
          studentsCount: s.studentsCount ?? 0,
          examsCount: s.examsCount ?? 0,
        })
      }
    } catch (err) {
      console.error('Error loading teacher data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadData()
  }, [token])

  // Load full details for a single selected class
  const loadClassDetails = async (classroomId: string) => {
    setClassDetailsLoading(true)
    try {
      const [studentsRes, requestsRes, reportsRes] = await Promise.allSettled([
        axios.get(`/api/teacher/classrooms/${classroomId}/students/list`, apiHeaders),
        axios.get(`/api/teacher/classrooms/${classroomId}/join-requests`, apiHeaders),
        axios.get(`/api/teacher/classrooms/${classroomId}/reports`, apiHeaders),
      ])

      if (studentsRes.status === 'fulfilled' && studentsRes.value.data?.success) {
        const list = studentsRes.value.data.data || []
        setClassStudents(list)
        // Set default present status for attendance
        const initialStatus: Record<string, AttendanceStatus> = {}
        list.forEach((st: any) => {
          const ph = st.studentPhone || st.phone || st.studentId?.phone
          if (ph) initialStatus[ph] = 'PRESENT'
        })
        setAttendanceStatuses(initialStatus)
      }

      if (requestsRes.status === 'fulfilled' && requestsRes.value.data?.success) {
        setClassJoinRequests(requestsRes.value.data.data || [])
      }

      if (reportsRes.status === 'fulfilled' && reportsRes.value.data?.success) {
        setClassReports(reportsRes.value.data.data || null)
      }
    } catch (err) {
      console.error('Error loading class details:', err)
    } finally {
      setClassDetailsLoading(false)
    }
  }

  // Open Class Details Dashboard
  const openClassDetails = (classroom: any) => {
    setSelectedClass(classroom)
    setClassSubTab('students')
    loadClassDetails(classroom._id)
  }

  // Create Class Action
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) {
      toast.error('نام کلاس الزامی است')
      return
    }

    setCreatingClass(true)
    try {
      const res = await axios.post(
        '/api/teacher/classrooms',
        {
          name: newClassName.trim(),
          gradeName: newClassGrade,
          subjectName: newClassSubject,
        },
        apiHeaders
      )

      if (res.data?.success) {
        toast.success('کلاس با موفقیت ایجاد شد 🎉')
        setClassrooms([res.data.data, ...classrooms])
        setShowCreateClassModal(false)
        setNewClassName('')
      } else {
        toast.error(res.data?.message || 'خطا در ایجاد کلاس')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ثبت کلاس جدید')
    } finally {
      setCreatingClass(false)
    }
  }

  // Add Student to Selected Class
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentPhone.trim()) {
      toast.error('شماره موبایل دانش‌آموز الزامی است')
      return
    }

    setAddingStudent(true)
    try {
      const res = await axios.post(
        `/api/teacher/classrooms/${selectedClass._id}/students`,
        {
          studentPhone: newStudentPhone.trim(),
          firstName: newStudentName.trim() || 'دانش‌آموز',
          lastName: '',
        },
        apiHeaders
      )

      if (res.data?.success) {
        toast.success('دانش‌آموز با موفقیت به کلاس افزوده شد 🎉')
        setShowAddStudentModal(false)
        setNewStudentPhone('')
        setNewStudentName('')
        loadClassDetails(selectedClass._id)
        loadData()
      } else {
        toast.error(res.data?.message || 'خطا در افزودن دانش‌آموز')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در افزودن دانش‌آموز')
    } finally {
      setAddingStudent(false)
    }
  }

  // Delete Student from Class
  const handleRemoveStudent = async (phone: string, name: string) => {
    if (!window.confirm(`آیا از حذف «${name || phone}» از این کلاس مطمئن هستید؟`)) return
    try {
      const res = await axios.delete(
        `/api/teacher/classrooms/${selectedClass._id}/students/${phone}`,
        apiHeaders
      )
      if (res.data?.success) {
        toast.success('دانش‌آموز از کلاس حذف شد')
        loadClassDetails(selectedClass._id)
        loadData()
      } else {
        toast.error(res.data?.message || 'خطا در حذف دانش‌آموز')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در حذف دانش‌آموز')
    }
  }

  // Accept / Reject Join Request
  const handleAcceptJoinRequest = async (requestId: string) => {
    try {
      const res = await axios.post(
        `/api/teacher/classrooms/${selectedClass._id}/join-requests/${requestId}/accept`,
        {},
        apiHeaders
      )
      if (res.data?.success) {
        toast.success('درخواست عضویت دانش‌آموز با موفقیت تایید شد ✅')
        loadClassDetails(selectedClass._id)
        loadData()
      } else {
        toast.error(res.data?.message || 'خطا در تایید درخواست')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در تایید درخواست')
    }
  }

  const handleRejectJoinRequest = async (requestId: string) => {
    if (!window.confirm('آیا از رد این درخواست عضویت مطمئن هستید؟')) return
    try {
      const res = await axios.post(
        `/api/teacher/classrooms/${selectedClass._id}/join-requests/${requestId}/reject`,
        {},
        apiHeaders
      )
      if (res.data?.success) {
        toast.success('درخواست عضویت رد شد')
        loadClassDetails(selectedClass._id)
      } else {
        toast.error(res.data?.message || 'خطا در رد درخواست')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در رد درخواست')
    }
  }

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedClass) return
    setSavingAttendance(true)
    const attendanceData = (classStudents || []).map((st) => {
      const ph = st.studentPhone || st.phone || st.studentId?.phone
      return {
        studentPhone: ph,
        status: attendanceStatuses[ph] || 'PRESENT',
        reason: '',
      }
    })

    try {
      const res = await axios.post(
        `/api/teacher/classrooms/${selectedClass._id}/sessions/today/attendance`,
        {
          date: attendanceDate,
          subject: selectedClass.subjectName || 'عمومی',
          attendanceData,
        },
        apiHeaders
      )
      if (res.data?.success) {
        toast.success('حضور و غیاب این جلسه در سامانه ثبت و ذخیره شد ✅')
      } else {
        toast.error(res.data?.message || 'خطا در ثبت حضور و غیاب')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ثبت حضور و غیاب')
    } finally {
      setSavingAttendance(false)
    }
  }

  // Copy Code / Link / Share
  const handleCopyCode = (code: string) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    toast.success(`شناسه کلاس (${code}) در حافظه کپی شد 📋`)
  }

  const handleCopyClassLink = (code: string) => {
    const origin = window.location.origin
    const joinLink = `${origin}/c/${code}`
    navigator.clipboard.writeText(joinLink)
    toast.success('لینک ثبت‌نام مستقیم دانش‌آموزان کپی شد 🔗')
  }

  const handleShareInvite = (c: any) => {
    const code = c.code || c._id.slice(-5)
    const origin = window.location.origin
    const regUrl = `${origin}/c/${code}`
    const text = `دانش‌آموز گرامی،\nبرای ثبت‌نام در کلاس «${c.name}»، لطفاً از طریق لینک زیر مشخصات خود را تکمیل نمایید:\n\n🔗 لینک ثبت‌نام:\n${regUrl}\n\n🔢 کد اختصاصی کلاس: ${code}\n\nپس از ثبت‌نام، می‌توانید اپلیکیشن «نوکیتا» را برای دریافت تکالیف و نمرات دانلود کنید.`

    if (navigator.share) {
      navigator.share({ title: `ثبت‌نام در کلاس ${c.name}`, text, url: regUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      toast.success('متن و لینک دعوت به کلاس برای ارسال کپی شد 📋')
    }
  }

  // Create Exam Action (with requireAppOnly)
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examTitle.trim()) {
      toast.error('عنوان آزمون الزامی است')
      return
    }
    if (!examClassId) {
      toast.error('انتخاب کلاس الزامی است')
      return
    }

    setCreatingExam(true)
    try {
      const now = new Date()
      const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      const res = await axios.post(
        '/api/teacher/exams',
        {
          title: examTitle.trim(),
          classroomId: examClassId,
          totalScore: Number(examTotalScore) || 20,
          durationMinutes: Number(examDuration) || 60,
          requireAppOnly: !!requireAppOnly,
          startTime: now.toISOString(),
          endTime: end.toISOString(),
          questions: [
            {
              questionText: examQuestionText.trim() || 'سوال پیش‌فرض: ۲ ضرب در ۲ چند می‌شود؟',
              type: 'MULTIPLE_CHOICE',
              score: 5,
              options: [{ text: '۲' }, { text: '۴' }, { text: '۶' }],
              correctAnswer: '۴',
            },
          ],
        },
        apiHeaders
      )

      if (res.data?.success) {
        toast.success(
          requireAppOnly
            ? 'آزمون ساخته شد! (تنظیم شده برای برگزاری صرفاً در اپلیکیشن نوکیتا)'
            : 'آزمون آنلاین با موفقیت ساخته شد و در وب و اپلیکیشن فعال است'
        )
        setShowCreateExamModal(false)
        setExamTitle('')
        setExamQuestionText('')
        setRequireAppOnly(false)
        loadData()
      } else {
        toast.error(res.data?.message || 'خطا در ایجاد آزمون')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ساخت آزمون')
    } finally {
      setCreatingExam(false)
    }
  }

  const copyExamLink = (examId: string) => {
    const origin = window.location.origin
    const joinLink = `${origin}/kitayar-dashboard/#/exam/${examId}`
    navigator.clipboard.writeText(joinLink)
    toast.success('لینک اختصاصی آزمون برای ارسال به دانش‌آموزان کپی شد 📋')
  }

  if (!token) {
    return <AuthWebModal portalRole="teacher" onSuccess={handleAuthSuccess} onBack={onBackToPortal} />
  }

  // Filter exams for selected class
  const classSpecificExams = selectedClass
    ? exams.filter((ex) => String(ex.classroom || ex.classroomId || ex.classId) === String(selectedClass._id))
    : []

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between" dir="rtl">
      
      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800/90 sticky top-0 z-30 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              ک
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white">وب‌اپلیکیشن کیتایار</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                  نسخه معلم (iOS/PWA)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                خوش آمدید، {user?.fullName || 'همکار گرامی'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToPortal}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition"
              title="تغییر پورتال"
            >
              🔄 تغییر پورتال
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-900/40 transition"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 pb-24 sm:pb-8 flex-1">
        
        {/* Referral Card (تعداد افراد دعوت‌شده) */}
        <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/40 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl">
              🎁
            </div>
            <div>
              <div className="text-xs text-slate-400">سیستم معرف و دعوت کیتایار</div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                تعداد افراد دعوت‌شده: <span className="text-blue-400 text-base font-black">{stats.invitedCount}</span> نفر
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block max-w-xs text-left">
            دانش‌آموزانی که با لینک آزمون‌های شما ثبت‌نام می‌کنند، به صورت خودکار به آمار دعوت‌شده‌های شما اضافه می‌شوند.
          </div>
        </div>

        {/* Top Tab Switcher on Desktop (تب حضور و غیاب طبق دستور کاربر به داخل هر کلاس منتقل شده و از هدر اصلی حذف گردید) */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => {
              setActiveTab('classes')
              setSelectedClass(null)
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'classes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📚</span>
            <span>کلاس‌های من ({classrooms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'exams' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📝</span>
            <span>آزمون‌ها ({exams.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('online_class')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'online_class' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📹</span>
            <span>کلاس آنلاین</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👤</span>
            <span>پروفایل من</span>
          </button>
        </div>

        {/* TAB 1: CLASSES (دقیقاً مطابق ClassManagementScreen و ClassDetailsScreen در اپلیکیشن کیتایار) */}
        {activeTab === 'classes' && (
          <div className="space-y-5">
            {!selectedClass ? (
              /* =================== 1. لیست کلاس‌ها (مشابه ClassManagementScreen) =================== */
              <>
                {/* هدر بالایی مدیریت کلاس */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-2xl font-black">
                      🏫
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base sm:text-lg font-black text-white">مدیریت کلاس</h2>
                        {classrooms.length > 0 && (
                          <span className="text-[11px] bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
                            {classrooms.length} کلاس
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">لیست مدارس، کلاس‌ها و دانش‌آموزان</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCreateClassModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span>➕</span>
                    <span>ایجاد کلاس</span>
                  </button>
                </div>

                {/* کارت‌های کلاس یا حالت خالی */}
                {classrooms.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 text-3xl flex items-center justify-center mx-auto mb-2">
                      🎓
                    </div>
                    <h3 className="text-base font-black text-white">کلاسی وجود ندارد</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      اولین کلاس خودتو ایجاد کن و کلاس خودتو مدیریت کن
                    </p>
                    <button
                      onClick={() => setShowCreateClassModal(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition mt-2"
                    >
                      <span>➕</span>
                      <span>ایجاد کلاس</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classrooms.map((c) => {
                      const studentCount = c.students?.length || 0
                      return (
                        <div
                          key={c._id}
                          style={{ borderRight: '5px solid #3b82f6' }}
                          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
                        >
                          {/* هدر کارت: عنوان کلاس، کد کلاسی و تعداد دانش‌آموزان */}
                          <div className="pb-3 border-b border-slate-800/80 flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-base text-white truncate" title={c.name}>
                              {c.name}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {c.code && (
                                <span className="text-[11px] bg-blue-950/80 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded-md font-mono font-bold">
                                  کد: {c.code}
                                </span>
                              )}
                              <span className="text-[11px] bg-blue-600/20 text-blue-400 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                <span>👥</span>
                                <span>{studentCount} دانش‌آموز</span>
                              </span>
                            </div>
                          </div>

                          {/* بدنه کارت: پایه و درس */}
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>📖</span>
                            <span>
                              {formatText(c.subjectName || c.course, 'عمومی')} · پایه {formatText(c.gradeName || c.grade, 'نامشخص')}
                            </span>
                          </div>

                          {/* فوتر کارت: دکمه برجسته «مدیریت کلاس ←» */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                            <button
                              onClick={() => openClassDetails(c)}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition active:scale-95"
                            >
                              <span>مدیریت کلاس</span>
                              <span className="text-sm font-black">←</span>
                            </button>
                            <button
                              onClick={() => handleShareInvite(c)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold p-2.5 rounded-xl transition border border-slate-700/80"
                              title="ارسال لینک دعوت کلاسی"
                            >
                              🔗
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              /* =================== 2. داشبورد و مدیریت کلاس انتخابی (مشابه ClassDetailsScreen) =================== */
              <div className="space-y-5">
                {/* دکمه بازگشت و هدر کلاس */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedClass(null)}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-lg font-black transition border border-slate-700"
                      title="بازگشت به لیست کلاس‌ها"
                    >
                      →
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-white">{selectedClass.name}</h2>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                          داشبورد کلاس
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        پایه {formatText(selectedClass.gradeName || selectedClass.grade, 'نامشخص')} • درس {formatText(selectedClass.subjectName, 'عمومی')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        window.location.href = `/classroom/${selectedClass.roomName || selectedClass._id}`
                      }}
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <span>📹</span>
                      <span>شروع کلاس آنلاین</span>
                    </button>
                  </div>
                </div>

                {/* بنر درخواست‌های عضویت در کلاس (مشابه بنر اینستاگرام در اپلیکیشن) */}
                {classJoinRequests.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-950/40 via-blue-950/40 to-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-black">
                          🔔
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-white">درخواست‌های عضویت در کلاس</span>
                            <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                              {classJoinRequests.length} نفر
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            دانش‌آموزان از طریق فرم وب ثبت‌نام کرده و منتظر تأیید شما هستند
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* لیست درخواست‌ها جهت تایید یا رد سریع */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-900/40">
                      {classJoinRequests.map((req) => (
                        <div
                          key={req._id}
                          className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              {req.firstName ? `${req.firstName} ${req.lastName || ''}` : 'دانش‌آموز ناشناس'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {req.studentPhone || req.phone}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAcceptJoinRequest(req._id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              تایید
                            </button>
                            <button
                              onClick={() => handleRejectJoinRequest(req._id)}
                              className="bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-900/50 text-xs px-2.5 py-1.5 rounded-lg transition"
                            >
                              رد
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* کارت شناسه کلاس و ثبت‌نام مستقیم دانش‌آموزان (مطابق کارت inviteCard در اپلیکیشن) */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-300">شناسه کلاسی:</span>
                      <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg font-mono font-bold">
                        {selectedClass.code || selectedClass._id.slice(-5)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(selectedClass.code || selectedClass._id.slice(-5))}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1 font-bold"
                    >
                      <span>📋</span>
                      <span>کپی کد</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">لینک ثبت‌نام دانش‌آموزان در کلاس</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      با ارسال این لینک، دانش‌آموزان مشخصات خود را تکمیل کرده و مستقیماً وارد کلاس شما می‌شوند.
                    </p>
                    <div className="mt-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono text-slate-300 overflow-hidden">
                      <span className="truncate">{`${window.location.origin}/c/${selectedClass.code || selectedClass._id.slice(-5)}`}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleShareInvite(selectedClass)}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <span>📤</span>
                      <span>ارسال لینک به دانش‌آموزان</span>
                    </button>
                    <button
                      onClick={() => handleCopyClassLink(selectedClass.code || selectedClass._id.slice(-5))}
                      className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5"
                    >
                      <span>📋</span>
                      <span>کپی لینک</span>
                    </button>
                  </div>
                </div>

                {/* زیرتب‌های داشبورد کلاس (دانش‌آموزان، حضور و غیاب، آزمون‌ها، گزارشات) */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
                  <button
                    onClick={() => setClassSubTab('students')}
                    className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      classSubTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>👥</span>
                    <span>دانش‌آموزان ({classStudents.length})</span>
                  </button>
                  <button
                    onClick={() => setClassSubTab('attendance')}
                    className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      classSubTab === 'attendance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📋</span>
                    <span>حضور و غیاب</span>
                  </button>
                  <button
                    onClick={() => setClassSubTab('exams')}
                    className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      classSubTab === 'exams' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📝</span>
                    <span>آزمون‌ها ({classSpecificExams.length})</span>
                  </button>
                  <button
                    onClick={() => setClassSubTab('reports')}
                    className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      classSubTab === 'reports' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📊</span>
                    <span>گزارشات</span>
                  </button>
                </div>

                {/* 1. زیرتب دانش‌آموزان (ClassStudentsScreen) */}
                {classSubTab === 'students' && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">لیست دانش‌آموزان کلاس</h3>
                        <p className="text-[11px] text-slate-400">تعداد کل: {classStudents.length} نفر</p>
                      </div>
                      <button
                        onClick={() => setShowAddStudentModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <span>➕</span>
                        <span>افزودن دانش‌آموز</span>
                      </button>
                    </div>

                    {classDetailsLoading ? (
                      <div className="py-8 text-center text-xs text-slate-400">در حال دریافت لیست دانش‌آموزان...</div>
                    ) : classStudents.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <span className="text-3xl block">👥</span>
                        <p className="text-xs font-bold text-white">دانش‌آموزی در این کلاس ثبت نشده است</p>
                        <p className="text-[11px] text-slate-400">
                          می‌توانید با دکمه «افزودن دانش‌آموز» شماره دانش‌آموز را وارد کنید یا لینک ثبت‌نام را برای آنها ارسال نمایید.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {classStudents.map((st, idx) => {
                          const phone = st.studentPhone || st.phone || st.studentId?.phone
                          const name = st.firstName ? `${st.firstName} ${st.lastName || ''}` : st.studentId?.user?.fullName || 'بدون نام'
                          return (
                            <div
                              key={st._id || idx}
                              className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">{name}</span>
                                    {st.isVerified && (
                                      <span className="text-blue-400 text-xs" title="تایید شده">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono">{phone}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemoveStudent(phone, name)}
                                className="text-xs text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-950/40 transition"
                                title="حذف از کلاس"
                              >
                                🗑️
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. زیرتب حضور و غیاب (ClassAttendanceScreen) */}
                {classSubTab === 'attendance' && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">ثبت حضور و غیاب جلسه</h3>
                        <p className="text-[11px] text-slate-400">وضعیت حضور هر دانش‌آموز را مشخص و در پایان ذخیره نمایید</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">تاریخ جلسه:</label>
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-xl text-white outline-none"
                        />
                      </div>
                    </div>

                    {classStudents.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        ابتدا باید دانش‌آموزان را به کلاس اضافه نمایید.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                          <span>نام دانش‌آموز</span>
                          <span>وضعیت حضور</span>
                        </div>

                        <div className="space-y-2">
                          {classStudents.map((st, idx) => {
                            const phone = st.studentPhone || st.phone || st.studentId?.phone
                            const name = st.firstName ? `${st.firstName} ${st.lastName || ''}` : st.studentId?.user?.fullName || 'بدون نام'
                            const currentStatus = attendanceStatuses[phone] || 'PRESENT'

                            return (
                              <div
                                key={st._id || idx}
                                className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <span className="text-xs font-bold text-white block">{name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{phone}</span>
                                  </div>
                                </div>

                                {/* دکمه‌های چهارتایی وضعیت (حاضر، غایب، با تأخیر، موجه) */}
                                <div className="grid grid-cols-4 gap-1.5 sm:w-80">
                                  <button
                                    type="button"
                                    onClick={() => setAttendanceStatuses({ ...attendanceStatuses, [phone]: 'PRESENT' })}
                                    className={`text-[11px] py-1.5 rounded-lg font-bold transition ${
                                      currentStatus === 'PRESENT'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400'
                                    }`}
                                  >
                                    حاضر
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAttendanceStatuses({ ...attendanceStatuses, [phone]: 'ABSENT_UNEXCUSED' })}
                                    className={`text-[11px] py-1.5 rounded-lg font-bold transition ${
                                      currentStatus === 'ABSENT_UNEXCUSED'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400'
                                    }`}
                                  >
                                    غایب
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAttendanceStatuses({ ...attendanceStatuses, [phone]: 'LATE' })}
                                    className={`text-[11px] py-1.5 rounded-lg font-bold transition ${
                                      currentStatus === 'LATE'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400'
                                    }`}
                                  >
                                    تأخیر
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAttendanceStatuses({ ...attendanceStatuses, [phone]: 'ABSENT_EXCUSED' })}
                                    className={`text-[11px] py-1.5 rounded-lg font-bold transition ${
                                      currentStatus === 'ABSENT_EXCUSED'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400'
                                    }`}
                                  >
                                    موجه
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex justify-end">
                          <button
                            onClick={handleSaveAttendance}
                            disabled={savingAttendance}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                          >
                            <span>✓</span>
                            <span>{savingAttendance ? 'در حال ثبت...' : 'ثبت نهایی حضور و غیاب امروز'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. زیرتب آزمون‌های کلاس (ClassExamsScreen) */}
                {classSubTab === 'exams' && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">آزمون‌های اختصاصی این کلاس</h3>
                        <p className="text-[11px] text-slate-400">آزمون‌های آنلاین برگزار شده برای {selectedClass.name}</p>
                      </div>
                      <button
                        onClick={() => {
                          setExamClassId(selectedClass._id)
                          setShowCreateExamModal(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <span>➕</span>
                        <span>طراحی آزمون جدید برای این کلاس</span>
                      </button>
                    </div>

                    {classSpecificExams.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <span className="text-3xl block">📝</span>
                        <p className="text-xs font-bold text-white">هنوز آزمونی برای این کلاس تعریف نشده است</p>
                        <p className="text-[11px] text-slate-400">با کلیک روی «طراحی آزمون جدید» اولین آزمون این کلاس را بسازید.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {classSpecificExams.map((ex) => (
                          <div
                            key={ex._id}
                            className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="text-xs font-bold text-white">{ex.title}</h4>
                              {ex.requireAppOnly ? (
                                <span className="text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                                  📱 فقط اپلیکیشن
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                  🌐 وب و اپ
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center justify-between">
                              <span>نمره کل: {ex.totalScore || 20}</span>
                              <span>مدت: {ex.durationMinutes || 60} دقیقه</span>
                            </div>

                            <button
                              onClick={() => copyExamLink(ex._id)}
                              className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                            >
                              <span>📋</span>
                              <span>کپی لینک آزمون</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. زیرتب گزارشات و کارنامه (ClassReportsScreen) */}
                {classSubTab === 'reports' && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="pb-3 border-b border-slate-800">
                      <h3 className="text-sm font-bold text-white">گزارشات و عملکرد کلاس</h3>
                      <p className="text-[11px] text-slate-400">خلاصه نمرات آزمون‌ها و میانگین مشارکت دانش‌آموزان</p>
                    </div>

                    {classReports ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
                            <span className="text-[11px] text-slate-400 block mb-1">میانگین کل کلاس:</span>
                            <span className="text-lg font-black text-blue-400">{classReports.averageClassScore || 0}</span>
                          </div>
                          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
                            <span className="text-[11px] text-slate-400 block mb-1">تعداد آزمون‌ها:</span>
                            <span className="text-lg font-black text-white">{classReports.totalExams || 0}</span>
                          </div>
                          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
                            <span className="text-[11px] text-slate-400 block mb-1">تعداد دانش‌آموزان:</span>
                            <span className="text-lg font-black text-emerald-400">{classStudents.length} نفر</span>
                          </div>
                        </div>

                        {classReports.examAverages?.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <h4 className="text-xs font-bold text-slate-300">میانگین آزمون‌های برگزار شده:</h4>
                            {classReports.examAverages.map((ex: any) => (
                              <div
                                key={ex._id}
                                className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs"
                              >
                                <span className="font-bold text-white">{ex.title}</span>
                                <div className="flex items-center gap-3 text-slate-400">
                                  <span>میانگین: <strong className="text-blue-400">{ex.averageScore}</strong> از {ex.maxScore}</span>
                                  <span>شرکت‌کننده: {ex.participantsCount} نفر</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400">
                        اطلاعات گزارش و آزمونی برای نمایش وجود ندارد.
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXAMS & EXAM BUILDER WITH REQUIRE_APP_ONLY */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">مدیریت و طراحی آزمون‌ها</h2>
                <p className="text-xs text-slate-400">آزمون‌های آنلاین برگزار شده و در حال اجرا</p>
              </div>
              <button
                onClick={() => setShowCreateExamModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition active:scale-95"
              >
                <span>➕</span>
                <span>طراحی آزمون جدید</span>
              </button>
            </div>

            {exams.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center">
                <span className="text-4xl block mb-3">📝</span>
                <p className="text-sm font-bold text-white">هنوز آزمونی طراحی نکرده‌اید</p>
                <p className="text-xs text-slate-400 mt-1">
                  می‌توانید آزمون جدید ایجاد کرده و مشخص کنید دانش‌آموز فقط در اپلیکیشن نوکیتا شرکت کند یا از وب هم بتواند آزمون دهد.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exams.map((ex) => (
                  <div
                    key={ex._id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-base text-white">{ex.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          نمره کل: {ex.totalScore || 20} • سوالات: {ex.questions?.length || 0}
                        </p>
                      </div>

                      {/* نشانگر محدودیت اپلیکیشن نوکیتا */}
                      {ex.requireAppOnly ? (
                        <span className="text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span>📱</span>
                          <span>فقط اپلیکیشن نوکیتا</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span>🌐</span>
                          <span>وب و اپلیکیشن</span>
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>شرکت‌کنندگان:</span>
                      <span className="font-bold text-white">{ex.allowedParticipants?.length || 0} نفر</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => copyExamLink(ex._id)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <span>📋</span>
                        <span>کپی لینک اختصاصی آزمون</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ONLINE CLASS (PlugNmeet) */}
        {activeTab === 'online_class' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-2xl font-black">
                📹
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">اتاق اختصاصی کلاس آنلاین (plugNmeet)</h2>
                <p className="text-xs text-slate-400">
                  برگزاری کلاس تعاملی زنده با تخته وایت‌برد هوشمند، اشتراک اسلاید و میکروفون
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">شروع کلاس آنلاین فوری</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                با یک کلیک اتاق کلاس آنلاین شما ایجاد می‌شود و لینک اختصاصی ورود برای شما و دانش‌آموزان صادر می‌گردد.
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await axios.post(
                      '/api/teacher/classrooms',
                      {
                        name: `کلاس آنلاین فوری ${user?.fullName || ''}`,
                        subjectName: 'کلاس آنلاین',
                      },
                      apiHeaders
                    )
                    if (res.data?.success) {
                      toast.success('کلاس با موفقیت ایجاد شد! اکنون وارد اتاق کلاس می‌شوید...')
                      window.location.href = `/classroom/${res.data.data.roomName}`
                    }
                  } catch (err: any) {
                    toast.error('کلاس آنلاین ایجاد نشد')
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <span>🚀</span>
                <span>شروع فوری جلسه آنلاین</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <img
                src={user?.avatar || (AVATAR_PRESETS && AVATAR_PRESETS[0]) || ''}
                alt="avatar"
                className="w-20 h-20 rounded-full mx-auto border-3 border-blue-500 shadow-xl object-cover"
              />
              <h2 className="text-xl font-black text-white">{user?.fullName || 'همکار گرامی'}</h2>
              <p className="text-xs text-blue-400 font-mono">{user?.phoneNumber || user?.username}</p>
            </div>

            {/* Stat Box */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">تعداد افراد دعوت‌شده:</span>
                <span className="text-xl font-black text-blue-400">{stats?.invitedCount ?? user?.invitedCount ?? 0} نفر</span>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">تعداد کلاس‌ها:</span>
                <span className="text-xl font-black text-white">{classrooms?.length || 0} کلاس</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-600/30 transition"
              >
                خروج از حساب کاربری
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Mobile Fixed Bottom Navigation Bar (تب حضور غیاب از اینجا هم حذف شده و در منوی ۴ تایی زیر جا گرفت) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => {
            setActiveTab('classes')
            setSelectedClass(null)
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-3 rounded-xl transition ${
            activeTab === 'classes' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">📚</span>
          <span>کلاس‌ها</span>
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-3 rounded-xl transition ${
            activeTab === 'exams' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">📝</span>
          <span>آزمون‌ها</span>
        </button>
        <button
          onClick={() => setActiveTab('online_class')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-3 rounded-xl transition ${
            activeTab === 'online_class' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">📹</span>
          <span>کلاس آنلاین</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-3 rounded-xl transition ${
            activeTab === 'profile' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">👤</span>
          <span>پروفایل</span>
        </button>
      </nav>

      {/* CREATE CLASS MODAL */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">ایجاد کلاس درس جدید</h3>
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام کلاس</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="مثال: کلاس ریاضی نهم الف"
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">پایه تحصیلی</label>
                <input
                  type="text"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  placeholder="مثال: نهم"
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام درس</label>
                <input
                  type="text"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  placeholder="مثال: ریاضی"
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={creatingClass}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
                >
                  {creatingClass ? 'در حال ثبت...' : 'ثبت و ساخت کلاس'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL IN CLASS */}
      {showAddStudentModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">افزودن دانش‌آموز به {selectedClass.name}</h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام و نام خانوادگی دانش‌آموز</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="مثال: علی رضایی"
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره موبایل دانش‌آموز (جهت احراز هویت)</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
                >
                  {addingStudent ? 'در حال افزودن...' : 'افزودن به کلاس'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL (WITH REQUIRE_APP_ONLY TOGGLE) */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">طراحی آزمون جدید</h3>
              <button
                onClick={() => setShowCreateExamModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان آزمون</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: آزمون میان‌ترم ریاضی نهم"
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">کلاس هدف</label>
                <select
                  value={examClassId}
                  onChange={(e) => setExamClassId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                >
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({formatText(c.gradeName || c.grade)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">مدت آزمون (دقیقه)</label>
                  <input
                    type="number"
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نمره کل آزمون</label>
                  <input
                    type="number"
                    value={examTotalScore}
                    onChange={(e) => setExamTotalScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              {/* سوییچ الزام برگزاری در اپلیکیشن نوکیتا */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-600/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    <label htmlFor="requireAppOnlySwitch" className="text-xs font-black text-amber-300 cursor-pointer">
                      الزام به شرکت فقط از طریق اپلیکیشن نوکیتا
                    </label>
                  </div>
                  <input
                    id="requireAppOnlySwitch"
                    type="checkbox"
                    checked={requireAppOnly}
                    onChange={(e) => setRequireAppOnly(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {requireAppOnly
                    ? '⚠️ فعال است: دانش‌آموزان در صورت ورود از طریق وب‌اپلیکیشن مجاز به شروع آزمون نخواهند بود و به صفحه دانلود اپلیکیشن نوکیتا هدایت می‌شوند.'
                    : '🌐 غیرفعال است: دانش‌آموزان می‌توانند هم از طریق وب‌اپلیکیشن و هم اپلیکیشن نوکیتا در آزمون شرکت کنند.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">متن اولین سوال آزمون</label>
                <textarea
                  value={examQuestionText}
                  onChange={(e) => setExamQuestionText(e.target.value)}
                  placeholder="صورت سوال را بنویسید (مثال: حاصل ۲ + ۲ ضرب در ۵ چند است؟)"
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={creatingExam}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-blue-600/30"
                >
                  {creatingExam ? 'در حال ثبت آزمون...' : 'ثبت و صدور لینک آزمون 🚀'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default TeacherWebApp
