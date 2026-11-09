import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface StudentExamTakePageProps {
  examId: string
  onBackToPortal?: () => void
}

const getInitialExamUser = () => {
  try {
    const raw = localStorage.getItem('student-user')
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const StudentExamTakePage: React.FC<StudentExamTakePageProps> = ({
  examId,
  onBackToPortal,
}) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('student-token'))
  const [user, setUser] = useState<any>(getInitialExamUser)

  const [loading, setLoading] = useState(true)
  const [examInfo, setExamInfo] = useState<any | null>(null)

  // Auth form state if not logged in
  const [authStep, setAuthStep] = useState<'request' | 'verify'>('request')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [submittingAuth, setSubmittingAuth] = useState(false)

  // Exam taking state
  const [examStarted, setExamStarted] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [examFinished, setExamFinished] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  // 1. Fetch Exam Meta
  const fetchExamInfo = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/student/auth/join/${examId}/info`)
      if (res.data?.success && res.data?.data) {
        setExamInfo(res.data.data)
      } else {
        toast.error(res.data?.message || 'آزمون یافت نشد')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در بارگذاری اطلاعات آزمون')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExamInfo()
  }, [examId])

  // Timer countdown
  useEffect(() => {
    if (!examStarted || remainingSeconds === null || examFinished) return
    if (remainingSeconds <= 0) {
      handleFinishExam()
      return
    }
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [examStarted, remainingSeconds, examFinished])

  // 2. Auth Flow (Request OTP / Verify)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) {
      toast.error('شماره موبایل را وارد کنید')
      return
    }
    setSubmittingAuth(true)
    try {
      const res = await axios.post(`/api/student/auth/join/${examId}/request`, {
        phoneNumber: phoneNumber.trim(),
      })
      if (res.data?.success) {
        toast.success(res.data.message || 'کد تایید ارسال شد (کد تست: 12345)')
        setAuthStep('verify')
      } else {
        toast.error(res.data?.message || 'خطا در ارسال کد')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ارتباط با سرور')
    } finally {
      setSubmittingAuth(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode.trim()) {
      toast.error('کد تایید را وارد کنید')
      return
    }
    setSubmittingAuth(true)
    try {
      const res = await axios.post(`/api/student/auth/join/${examId}/verify`, {
        phoneNumber: phoneNumber.trim(),
        otp: otpCode.trim(),
        fullName: fullName.trim() || undefined,
      })
      if (res.data?.success) {
        const receivedToken = res.data.data?.token
        const receivedUser = {
          phoneNumber: phoneNumber.trim(),
          fullName: fullName.trim() || 'دانش‌آموز',
          role: 'student',
        }
        localStorage.setItem('student-token', receivedToken)
        localStorage.setItem('student-user', JSON.stringify(receivedUser))
        setToken(receivedToken)
        setUser(receivedUser)
        toast.success('ورود با موفقیت انجام شد')
        // Refresh exam info in case server returned updated requireAppOnly
        if (res.data.data?.requireAppOnly !== undefined) {
          setExamInfo((prev: any) => ({ ...prev, requireAppOnly: res.data.data.requireAppOnly }))
        }
      } else {
        toast.error(res.data?.message || 'کد تایید اشتباه است')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در تایید کد')
    } finally {
      setSubmittingAuth(false)
    }
  }

  // 3. Start Exam in Web (only if requireAppOnly is false)
  const handleStartExam = async () => {
    if (!token) return
    setLoading(true)
    try {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } }
      // Enter exam session
      await axios.post(`/api/student/exams/${examId}/enter`, {}, authHeader)
      // Get exam questions
      const qRes = await axios.get(`/api/student/exams/${examId}/questions`, authHeader)
      if (qRes.data?.success && qRes.data?.data) {
        const qList = qRes.data.data.questions || qRes.data.data || []
        setQuestions(qList)
        setExamStarted(true)
        if (examInfo?.duration) {
          setRemainingSeconds(examInfo.duration * 60)
        } else {
          setRemainingSeconds(60 * 60) // default 60 mins
        }
      } else {
        toast.error('خطا در دریافت سوالات آزمون')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در شروع آزمون آنلاین')
    } finally {
      setLoading(false)
    }
  }

  // 4. Submit single answer
  const handleSelectAnswer = async (questionId: string, answerVal: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerVal }))
    if (!token) return
    try {
      setSubmittingAnswer(true)
      await axios.post(
        `/api/student/exams/${examId}/answer`,
        {
          questionId,
          submittedAnswer: answerVal,
          currentQuestionIndex: currentIndex,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.warn('Auto save answer failed:', err)
    } finally {
      setSubmittingAnswer(false)
    }
  }

  // 5. Finalize Exam
  const handleFinishExam = async () => {
    if (!token) return
    setLoading(true)
    try {
      await axios.post(
        `/api/student/exams/${examId}/finish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setExamFinished(true)
      toast.success('آزمون با موفقیت به پایان رسید و ثبت شد')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ثبت نهایی آزمون')
    } finally {
      setLoading(false)
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Loading state
  if (loading && !examInfo) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 font-sans" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">در حال بارگذاری اطلاعات آزمون...</p>
        </div>
      </div>
    )
  }

  // Step A: Student is NOT logged in -> Show phone/OTP login screen
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-white">ورود دانش‌آموز به آزمون</h2>
            {examInfo && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                <div className="font-bold text-cyan-400 text-sm">{examInfo.title}</div>
                <div className="text-slate-400 mt-0.5">طراح: {examInfo.teacherName || 'دبیر'}</div>
              </div>
            )}
          </div>

          {authStep === 'request' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی رضایی"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">شماره موبایل:</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0912..."
                  dir="ltr"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white text-center font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 transition disabled:opacity-50"
              >
                {submittingAuth ? 'در حال ارسال کد...' : 'دریافت کد تایید و ورود'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">کد تایید ارسال شده:</label>
                  <span className="text-[11px] text-cyan-400 font-mono">کد تست: 12345</span>
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="12345"
                  dir="ltr"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-lg text-white font-mono text-center tracking-widest focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg transition disabled:opacity-50"
              >
                {submittingAuth ? 'در حال تایید...' : 'تایید کد و ورود به آزمون'}
              </button>

              <button
                type="button"
                onClick={() => setAuthStep('request')}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
              >
                ویرایش شماره موبایل
              </button>
            </form>
          )}

          {onBackToPortal && (
            <div className="mt-6 text-center">
              <button onClick={onBackToPortal} className="text-xs text-slate-500 hover:text-slate-300 transition">
                ← بازگشت به پرتال اصلی
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step B: Authenticated, but requireAppOnly is TRUE -> Show Nokita App Download page (as specifically requested)
  if (examInfo?.requireAppOnly) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100" dir="rtl">
        <div className="max-w-lg w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-xl">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-3">
            دانش‌آموز عزیز برای شرکت در این آزمون باید اپلیکیشن نوکیتا را نصب کنید
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            دبیر محترم، آزمون <strong className="text-cyan-400">«{examInfo.title}»</strong> را در وضعیت «الزام اپلیکیشن»
            قرار داده است. به منظور برقراری امنیت آزمون و جلوگیری از تقلب، شرکت در این آزمون تنها از طریق اپلیکیشن نوکیتا مقدور است.
          </p>

          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 mb-6 text-right text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">نام آزمون:</span>
              <span className="font-bold text-white">{examInfo.title}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">دبیر طراح:</span>
              <span className="font-bold text-white">{examInfo.teacherName || 'معلم'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">تعداد سوالات:</span>
              <span className="font-bold text-white">{examInfo.questionsCount || 0} سوال</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">وضعیت دسترسی:</span>
              <span className="font-bold text-rose-400">فقط از طریق اپلیکیشن نوکیتا</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="/uploads/nokita.apk"
              download="nokita.apk"
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>دانلود مستقیم اپلیکیشن نوکیتا (نسخه اندروید)</span>
            </a>

            {onBackToPortal ? (
              <button
                onClick={onBackToPortal}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                بازگشت به پرتال اصلی
              </button>
            ) : (
              <a
                href="#/student"
                className="block w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition text-center"
              >
                ورود به پنل وب نوکیتا
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Step C: Exam Finished screen
  if (examFinished) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-2">آزمون با موفقیت به پایان رسید</h2>
          <p className="text-xs text-slate-300 mb-6">
            پاسخ‌های شما برای آزمون <strong>«{examInfo?.title}»</strong> با موفقیت در سامانه ثبت شد و نتایج پس از بررسی دبیر اعلام خواهد شد.
          </p>

          <a
            href="#/student"
            className="block w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition text-center"
          >
            بازگشت به کلاس‌های من
          </a>
        </div>
      </div>
    )
  }

  // Step D: Exam taking view (when requireAppOnly is FALSE and examStarted is TRUE)
  if (examStarted && questions.length > 0) {
    const currentQ = questions[currentIndex] || {}
    const qText = currentQ.questionText || currentQ.title || 'متن سوال'
    const qOptions = currentQ.options || []

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-sm sm:text-base">{examInfo?.title}</span>
              <span className="text-xs text-slate-400">
                سوال {currentIndex + 1} از {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {remainingSeconds !== null && (
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-xl font-mono font-bold text-xs">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatTimer(remainingSeconds)}</span>
                </div>
              )}

              <button
                onClick={handleFinishExam}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow"
              >
                پایان آزمون
              </button>
            </div>
          </div>
        </header>

        {/* Question Body */}
        <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                سوال شماره {currentIndex + 1}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                بارم: {currentQ.score || (examInfo?.totalScore ? (examInfo.totalScore / questions.length).toFixed(1) : 1)} نمره
              </span>
            </div>

            {/* Render Question Text (HTML or Plain text) */}
            <div
              className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed mb-6 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: qText }}
            />

            {/* Render Options if available */}
            {qOptions.length > 0 ? (
              <div className="space-y-3">
                {qOptions.map((opt: any, idx: number) => {
                  const optVal = typeof opt === 'string' ? opt : opt.text || opt.title || `گزینه ${idx + 1}`
                  const optKey = (idx + 1).toString()
                  const isSelected = answers[currentQ._id] === optKey || answers[currentQ._id] === optVal

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(currentQ._id, optKey)}
                      className={`w-full text-right p-4 rounded-2xl border transition flex items-center justify-between text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-cyan-600/20 border-cyan-500 text-white font-bold shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs border ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-bold'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{optVal}</span>
                      </div>
                      {isSelected && <span className="text-cyan-400 text-base">✓</span>}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Descriptive Answer input */
              <div>
                <label className="block text-xs text-slate-400 mb-2">پاسخ تشریحی شما:</label>
                <textarea
                  rows={5}
                  value={answers[currentQ._id] || ''}
                  onChange={(e) => handleSelectAnswer(currentQ._id, e.target.value)}
                  placeholder="پاسخ خود را اینجا بنویسید..."
                  className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold disabled:opacity-30 transition"
              >
                سوال قبلی
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
                >
                  سوال بعدی →
                </button>
              ) : (
                <button
                  onClick={handleFinishExam}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                >
                  ثبت نهایی و اتمام آزمون ✓
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Step E: Not started yet, ready to start online exam (requireAppOnly is FALSE)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100" dir="rtl">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
            🌐 آزمون آنلاین تحت وب
          </span>
          <h2 className="text-xl font-black text-white mt-3">{examInfo?.title}</h2>
          <p className="text-xs text-slate-400 mt-1">دبیر: {examInfo?.teacherName || 'معلم'}</p>
        </div>

        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 mb-6 space-y-2.5 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">تعداد سوالات:</span>
            <span className="font-bold text-white">{examInfo?.questionsCount || 0} سوال</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">بارم کل آزمون:</span>
            <span className="font-bold text-white">{examInfo?.totalScore || 20} نمره</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">دانش‌آموز:</span>
            <span className="font-bold text-cyan-400">{user?.fullName || user?.phoneNumber}</span>
          </div>
        </div>

        <button
          onClick={handleStartExam}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-cyan-600/25 transition flex items-center justify-center gap-2"
        >
          <span>شروع آزمون آنلاین</span>
          <span>←</span>
        </button>

        {onBackToPortal ? (
          <button
            onClick={onBackToPortal}
            className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition"
          >
            ← بازگشت به پرتال
          </button>
        ) : (
          <a
            href="#/student"
            className="block text-center w-full mt-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition"
          >
            ← بازگشت به کلاس‌های من
          </a>
        )}
      </div>
    </div>
  )
}
export default StudentExamTakePage

