import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useNativeClassroomAudio } from '../../../services/nativeWebrtc/useNativeClassroomAudio'
import type { ClassroomLayoutMode, WhiteboardGridMode } from '../../../services/nativeWebrtc/types'
import {
  classroomService,
  type IRegistrationFormField,
} from '../../../services/classroomService'
import { EDU_ADMIN_TOKENS, SEMINAR_UI_TOKENS } from '../../../theme/eduAdminTokens'
import { ClassroomHeader } from './components/ClassroomHeader'
import { ParticipantCard } from './components/ParticipantCard'
import { AudioControlBar } from './components/AudioControlBar'
import { ClassroomDiagnostics } from './components/ClassroomDiagnostics'
import { TeacherWhiteboard } from './components/TeacherWhiteboard'
import { SeminarStageView } from './components/SeminarStageView'
import { ClassroomRecordingPlayerModal } from '../components/ClassroomRecordingPlayerModal'

interface NativeClassroomPageProps {
  roomId: string
  ticketCode?: string
  onLeave?: () => void
}

export const NativeClassroomPage: React.FC<NativeClassroomPageProps> = ({
  roomId,
  ticketCode: propTicket,
  onLeave,
}) => {
  const isTestRoom = roomId.toLowerCase().includes('test') || roomId.startsWith('test')
  const [token, setToken] = useState<string>('')
  const [ticket, setTicket] = useState<string>(propTicket || '')
  const [displayName, setDisplayName] = useState<string>(() => {
    if (isTestRoom) {
      const rand = Math.floor(100 + Math.random() * 900)
      return `کاربر (${rand})`
    }
    return ''
  })
  const [hasEnteredLobby, setHasEnteredLobby] = useState(false)
  const [roomInfo, setRoomInfo] = useState<any>(null)
  const [infoLoading, setInfoLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>('teacher')
  const [startWithCamera, setStartWithCamera] = useState(true)
  const [attendeeKey, setAttendeeKey] = useState<string>(() => {
    try {
      return localStorage.getItem(`kitayar_att_${roomId}`) || ''
    } catch {
      return ''
    }
  })
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(`kitayar_att_form_${roomId}`)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [joinAttempt, setJoinAttempt] = useState(0)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [rulesAccepted, setRulesAccepted] = useState(false)
  const [rulesCheckboxChecked, setRulesCheckboxChecked] = useState(false)
  const [remainingLockSec, setRemainingLockSec] = useState<number | null>(null)
  const [mobileVideoStripCollapsed, setMobileVideoStripCollapsed] = useState(false)

  useEffect(() => {
    if (!roomInfo?.isLocked || !roomInfo?.unlocksAt) {
      setRemainingLockSec(null)
      return
    }
    const updateCountdown = () => {
      const diff = Math.ceil((new Date(roomInfo.unlocksAt).getTime() - Date.now()) / 1000)
      if (diff <= 0) {
        setRemainingLockSec(0)
      } else {
        setRemainingLockSec(diff)
      }
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [roomInfo?.isLocked, roomInfo?.unlocksAt])

  useEffect(() => {
    const savedToken = localStorage.getItem('auth-token') || ''
    setToken(savedToken)

    const search = new URLSearchParams(window.location.search)
    const urlTicket = search.get('ticket') || search.get('token') || propTicket || ''
    if (urlTicket) {
      setTicket(urlTicket)
    }
    const urlRole = search.get('role')
    if (urlRole === 'teacher' || urlRole === 'student') {
      setSelectedRole(urlRole)
    }
    const urlName = search.get('name')
    if (urlName) {
      setDisplayName(urlName)
    } else if (!urlTicket) {
      const savedUserStr = localStorage.getItem('auth-user')
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr)
          const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username
          if (name) setDisplayName(name)
        } catch (e) {}
      }
    }

    let isMounted = true
    const loadInfo = () => {
      const infoUrl = urlTicket
        ? `/api/classroom/native/rooms/${encodeURIComponent(roomId)}/info?ticket=${encodeURIComponent(urlTicket)}`
        : `/api/classroom/native/rooms/${encodeURIComponent(roomId)}/info`
      fetch(infoUrl)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.success && data.data) {
            setRoomInfo(data.data)
            if (!urlName && data.data.ticketName) {
              setDisplayName(prev => (prev.trim() ? prev : data.data.ticketName))
            }
            const hasHostTicket =
              data.data.ticketRole === 'teacher' ||
              (!data.data.ticketValid && urlTicket?.startsWith('inv-tch'))
            if (hasHostTicket || urlRole === 'teacher') {
              setSelectedRole('teacher')
            } else if (data.data.ticketRole === 'student') {
              setSelectedRole('student')
            } else if (data.data.uiMode !== 'seminar' && data.data.hasActiveTeacher) {
              setSelectedRole('student')
            }
            if (data.data.uiMode === 'seminar' && !hasHostTicket && urlRole !== 'teacher') {
              setStartWithCamera(false)
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setInfoLoading(false)
        })
    }

    loadInfo()
    const timer = !hasEnteredLobby ? setInterval(loadInfo, 3000) : null
    return () => {
      isMounted = false
      if (timer) clearInterval(timer)
    }
  }, [roomId, hasEnteredLobby])

  const handleExit = () => {
    if (onLeave) {
      onLeave()
    } else {
      window.location.href = '/'
    }
  }

  const teacherPresent = !!roomInfo?.hasActiveTeacher
  const isSeminarMode = roomInfo?.uiMode === 'seminar'
  const registrationForm = roomInfo?.registrationForm
  const hasRegistrationForm = !!(registrationForm?.enabled && Array.isArray(registrationForm.fields) && registrationForm.fields.length > 0)
  const isAdminLoggedIn = (() => {
    try {
      const raw = localStorage.getItem('auth-user')
      if (!raw) return false
      const parsed = JSON.parse(raw)
      return parsed?.role === 'admin'
    } catch {
      return false
    }
  })()
  const hasValidTicket = Boolean(ticket && roomInfo?.ticketValid)
  const isTicketInvalid = Boolean(ticket && roomInfo?.ticketInvalid)
  const lockedTicketRole: 'teacher' | 'student' | null =
    hasValidTicket && (roomInfo?.ticketRole === 'teacher' || roomInfo?.ticketRole === 'student')
      ? roomInfo.ticketRole
      : null
  const isHostTicket = lockedTicketRole === 'teacher' || ticket.startsWith('inv-tch')
  const isSeminarManagerEntry = isSeminarMode && (isHostTicket || (isAdminLoggedIn && selectedRole === 'teacher'))

  const handleLobbyEnter = async () => {
    if (isTicketInvalid) {
      toast.error('لینک یا بلیت ورود به کلاس نامعتبر است')
      return
    }
    const effectiveRole: 'teacher' | 'student' = lockedTicketRole
      ? lockedTicketRole
      : isSeminarMode
      ? isHostTicket || (isAdminLoggedIn && selectedRole === 'teacher')
        ? 'teacher'
        : 'student'
      : teacherPresent
      ? 'student'
      : selectedRole
    setSelectedRole(effectiveRole)

    let derivedName = displayName.trim()
    if (!derivedName && hasRegistrationForm) {
      const nameCandidate = Object.entries(formAnswers).find(([k]) => /name|fullname|نام/i.test(k))?.[1]
      if (typeof nameCandidate === 'string' && nameCandidate.trim()) {
        derivedName = nameCandidate.trim()
      }
    }

    if (hasRegistrationForm && !isHostTicket && !(isAdminLoggedIn && effectiveRole === 'teacher')) {
      for (const field of registrationForm.fields as IRegistrationFormField[]) {
        if (!field.required) continue
        const val = formAnswers[field.id]
        const missing =
          field.type === 'checkbox'
            ? val !== true
            : val === undefined || val === null || String(val).trim() === ''
        if (missing) {
          toast.error(`لطفاً فیلد اجباری «${field.label}» را تکمیل کنید`)
          return
        }
      }

      try {
        setFormSubmitting(true)
        const regRes = await classroomService.registerNativeAttendee(roomId, {
          displayName: derivedName || 'شرکت‌کننده',
          formAnswers,
          attendeeKey: attendeeKey || undefined,
        })
        if (regRes.success && regRes.data?.attendeeKey) {
          setAttendeeKey(regRes.data.attendeeKey)
          if (regRes.data.displayName) {
            derivedName = regRes.data.displayName
            setDisplayName(regRes.data.displayName)
          }
          try {
            localStorage.setItem(`kitayar_att_${roomId}`, regRes.data.attendeeKey)
            localStorage.setItem(`kitayar_att_form_${roomId}`, JSON.stringify(formAnswers))
          } catch {}
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'خطا در ثبت اطلاعات فرم ورود')
        setFormSubmitting(false)
        return
      } finally {
        setFormSubmitting(false)
      }
    }

    const finalName =
      derivedName ||
      `${effectiveRole === 'teacher' ? 'مدرس' : 'شرکت‌کننده'} (${Math.floor(100 + Math.random() * 900)})`
    setDisplayName(finalName)
    setHasEnteredLobby(true)
  }

  const isClassCurrentlyLocked = Boolean(
    roomInfo?.isLocked && (remainingLockSec === null || remainingLockSec > 0)
  )

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handlePreEntryClick = () => {
    if (isClassCurrentlyLocked) {
      toast.error('کلاس آنلاین قفل است و ۵ دقیقه پیش از شروع باز خواهد شد.')
      return
    }
    if (!rulesAccepted) {
      setShowRulesModal(true)
      return
    }
    handleLobbyEnter()
  }

  const handleConfirmRulesAndEnter = () => {
    if (!rulesCheckboxChecked) {
      toast.error('لطفاً گزینه مطالعه و تایید قوانین را انتخاب کنید')
      return
    }
    setRulesAccepted(true)
    setShowRulesModal(false)
    handleLobbyEnter()
  }

  const currentRules: string[] =
    (selectedRole === 'teacher' ? roomInfo?.policy?.teacherRules : roomInfo?.policy?.studentRules) || [
      'حضور به موقع در کلاس الزامی است.',
      'احترام متقابل بین مدرس و دانش‌آموز الزامی است.',
      'ضبط تصویر و صدای کلاس بدون هماهنگی ممنوع است.',
      'ورود با نام واقعی و معتبر صورت گیرد.',
    ]

  // Pre-join Lobby View (Dark Modern Theme + Dynamic Pre-Entry Form)
  if (!hasEnteredLobby) {
    return (
      <div
        className="min-h-[100dvh] bg-slate-950 text-white flex flex-col justify-center items-center p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        dir="rtl"
      >
        <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-4 sm:space-y-5 text-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-2xl mx-auto shadow-lg shadow-blue-600/30">
            {isSeminarMode ? '🎤' : '🎥'}
          </div>

          <div className="text-center space-y-1">
            {isSeminarMode && (
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1 ${EDU_ADMIN_TOKENS.badgePurple}`}>
                سمینار / وبینار زنده
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {roomInfo?.title || (isTestRoom ? 'کلاس آنلاین هوشمند کیتایار' : 'کلاس آنلاین کیتایار')}
            </h2>
            {roomInfo?.topic && <p className="text-xs text-slate-400">{roomInfo.topic}</p>}
            {roomInfo?.teacherName && (
              <p className="text-[11px] text-indigo-300 font-semibold">
                {isSeminarMode ? 'سخنران / مجری:' : 'مدرس:'} {roomInfo.teacherName}
              </p>
            )}
          </div>

          {isTestRoom && (
            <div className="py-1.5 px-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 rounded-xl text-center text-[11px] font-bold flex items-center justify-center gap-1.5">
              <span>🧪</span>
              <span>محیط تست مستقیم صوتی، تصویری و تخته هوشمند</span>
            </div>
          )}

          <div className="space-y-4">
            {isClassCurrentlyLocked && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-center space-y-2">
                <div className="text-2xl">⏳</div>
                <div className="text-sm font-extrabold text-amber-100">کلاس آنلاین هنوز بازگشایی نشده است</div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  طبق قوانین، ورود به کلاس ۵ دقیقه قبل از زمان مقرر کلاس فعال می‌شود.
                </p>
                {remainingLockSec !== null && remainingLockSec > 0 && (
                  <div className="inline-block px-3 py-1.5 rounded-xl bg-amber-500/25 text-amber-100 text-xs font-mono font-bold">
                    زمان تا بازگشایی: {formatCountdown(remainingLockSec)}
                  </div>
                )}
              </div>
            )}

            {isTicketInvalid && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-bold leading-relaxed text-center">
                ⚠️ این لینک یا بلیت ورود نامعتبر یا منقضی است. لطفاً لینک جدید را از صفحه کلاس در اپلیکیشن دریافت کنید.
              </div>
            )}

            {hasValidTicket && (
              <div className="p-3.5 rounded-2xl bg-slate-800/75 border border-indigo-500/35 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    {lockedTicketRole === 'teacher'
                      ? '🎓 ورود اختصاصی به عنوان معلم'
                      : '👨‍🎓 ورود اختصاصی به عنوان دانش‌آموز'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                    لینک تاییدشده
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  🔒 فقط آخرین دستگاه متصل در کلاس باقی می‌ماند؛ با ورود از این مرورگر، اتصال قبلی شما در گوشی یا تب دیگر به‌صورت خودکار قطع می‌شود.
                </p>
                {lockedTicketRole === 'teacher' && teacherPresent && (
                  <p className="text-[11px] text-amber-300 font-semibold leading-relaxed">
                    نسخه دیگری از حساب معلم در حال حاضر متصل است و با ورود شما کلاس به این مرورگر منتقل می‌شود.
                  </p>
                )}
              </div>
            )}

            {/* Role Selector (Hidden when entering with a personal bound ticket, or regular Seminar Audience) */}
            {!hasValidTicket && (!isSeminarMode || isHostTicket || isAdminLoggedIn) && (() => {
              const teacherRoleLocked = !isSeminarMode && teacherPresent
              return (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    {isSeminarMode ? 'انتخاب نقش ورود به سمینار:' : 'انتخاب نقش ورود به کلاس:'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      disabled={teacherRoleLocked}
                      onClick={() => setSelectedRole('teacher')}
                      className={`p-3 rounded-2xl border text-start transition-all flex flex-col gap-1 ${
                        teacherRoleLocked
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                          : selectedRole === 'teacher'
                          ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30 text-white cursor-pointer'
                          : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{isSeminarMode ? '👑' : '🎓'}</span>
                        {teacherRoleLocked ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                            تکمیل 🔒
                          </span>
                        ) : (
                          selectedRole === 'teacher' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                          )
                        )}
                      </div>
                      <span className="text-xs font-bold">
                        {isSeminarMode ? 'ورود به عنوان مدیر سمینار' : 'ورود به عنوان معلم'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {teacherRoleLocked
                          ? 'معلم در کلاس حاضر است'
                          : isSeminarMode
                          ? 'مدیریت کامل، نظرسنجی و فرم‌ها'
                          : 'تخته، PDF و مدیریت کلاس'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('student')}
                      className={`p-3 rounded-2xl border text-start transition-all flex flex-col gap-1 cursor-pointer ${
                        selectedRole === 'student' || teacherRoleLocked
                          ? 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                          : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{isSeminarMode ? '👤' : '👨‍🎓'}</span>
                        {(selectedRole === 'student' || teacherRoleLocked) && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold">
                        {isSeminarMode ? 'ورود به عنوان شرکت‌کننده' : 'ورود به عنوان دانش‌آموز'}
                      </span>
                      <span className="text-[10px] text-slate-400">مشاهده پخش زنده و پرسش</span>
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Dynamic Pre-Entry Registration Form Gate */}
            {hasRegistrationForm && !isHostTicket && !(isSeminarMode && isAdminLoggedIn && selectedRole === 'teacher') ? (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {registrationForm.title || 'فرم ثبت‌نام ورود به سمینار'}
                  </h3>
                  {registrationForm.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {registrationForm.description}
                    </p>
                  )}
                </div>

                {(registrationForm.fields as IRegistrationFormField[]).map(field => {
                  const val = formAnswers[field.id]
                  const updateAnswer = (nextVal: any) => {
                    setFormAnswers(prev => ({ ...prev, [field.id]: nextVal }))
                    if (/name|fullname|نام/i.test(field.id) || /نام و نام خانوادگی|نام/.test(field.label)) {
                      if (typeof nextVal === 'string') setDisplayName(nextVal)
                    }
                  }

                  if (field.type === 'checkbox') {
                    return (
                      <label
                        key={field.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={val === true}
                          onChange={e => updateAnswer(e.target.checked)}
                          className="w-4 h-4 accent-indigo-500 rounded"
                        />
                        <span className="text-slate-200 font-medium">
                          {field.label} {field.required && <span className="text-rose-400">*</span>}
                        </span>
                      </label>
                    )
                  }

                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={val || ''}
                          onChange={e => updateAnswer(e.target.value)}
                          className={EDU_ADMIN_TOKENS.inputClass}
                        >
                          <option value="">انتخاب کنید...</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            field.type === 'phone'
                              ? 'tel'
                              : field.type === 'email'
                              ? 'email'
                              : field.type === 'number'
                              ? 'number'
                              : 'text'
                          }
                          dir={field.type === 'phone' || field.type === 'email' || field.type === 'number' ? 'ltr' : 'rtl'}
                          value={val || ''}
                          onChange={e => updateAnswer(e.target.value)}
                          placeholder={field.placeholder || ''}
                          className={EDU_ADMIN_TOKENS.inputClass}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نام نمایشی شما:
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="مثال: استاد رضایی یا سارا"
                  className={EDU_ADMIN_TOKENS.inputClass}
                />
              </div>
            )}

            {/* Camera toggle hidden for seminar audience to save bandwidth */}
            {(!isSeminarMode || isSeminarManagerEntry || (!isSeminarMode && selectedRole === 'teacher')) && (
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-base">{startWithCamera ? '📹' : '📷'}</span>
                  <span className="text-xs font-bold text-slate-200">روشن بودن دوربین در بدو ورود</span>
                </div>
                <input
                  type="checkbox"
                  checked={startWithCamera}
                  onChange={e => setStartWithCamera(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
              </label>
            )}

            <button
              type="button"
              onClick={handlePreEntryClick}
              disabled={infoLoading || formSubmitting || isTicketInvalid || isClassCurrentlyLocked}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer mt-1 disabled:opacity-50"
            >
              {formSubmitting
                ? 'در حال ثبت اطلاعات...'
                : isClassCurrentlyLocked
                ? `🔒 کلاس قفل است (${remainingLockSec !== null && remainingLockSec > 0 ? formatCountdown(remainingLockSec) : 'تا ۵ دقیقه قبل'})`
                : lockedTicketRole === 'teacher'
                ? '🎓 قوانین و ورود به کلاس (معلم)'
                : lockedTicketRole === 'student'
                ? '👨‍🎓 قوانین و ورود به کلاس (دانش‌آموز)'
                : isSeminarMode
                ? isSeminarManagerEntry
                  ? '👑 ورود به سالن سمینار (مدیر)'
                  : '🎤 ثبت‌نام و ورود به سمینار (شرکت‌کننده)'
                : teacherPresent || selectedRole === 'student'
                ? '👨‍🎓 قوانین و ورود به کلاس (دانش‌آموز)'
                : '🎓 قوانین و ورود به کلاس (معلم)'}
            </button>
          </div>
        </div>

        {/* Classroom Rules Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    قوانین و مقررات ورود به کلاس آنلاین ({selectedRole === 'teacher' ? 'مدرس' : 'دانش‌آموز'})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2.5 p-1">
                {currentRules.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-indigo-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulesCheckboxChecked}
                  onChange={e => setRulesCheckboxChecked(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200">
                  تمام قوانین و شرایط حضور در کلاس را مطالعه کرده‌ام و متعهد به رعایت آن هستم.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRulesAndEnter}
                  disabled={!rulesCheckboxChecked}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  تایید قوانین و ورود به کلاس
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <ActiveNativeClassroom
      key={joinAttempt}
      roomId={roomId}
      token={token}
      ticketCode={ticket}
      displayName={displayName}
      requestedRole={lockedTicketRole || (isHostTicket ? 'teacher' : isSeminarMode ? (isSeminarManagerEntry ? 'teacher' : 'student') : selectedRole)}
      attendeeKey={attendeeKey}
      formAnswers={formAnswers}
      initialUiMode={roomInfo?.uiMode}
      registrationFormFields={registrationForm?.fields || []}
      initialCameraEnabled={isSeminarMode && !isSeminarManagerEntry ? false : startWithCamera}
      initialMicEnabled={isSeminarMode && !isSeminarManagerEntry ? false : true}
      onBackToLobby={() => {
        setSelectedRole('student')
        setHasEnteredLobby(false)
      }}
      onRejoin={() => setJoinAttempt(n => n + 1)}
      onLeave={handleExit}
    />
  )
}

interface ActiveClassroomProps {
  roomId: string
  token?: string
  ticketCode?: string
  displayName?: string
  requestedRole?: 'teacher' | 'student'
  attendeeKey?: string
  formAnswers?: Record<string, any>
  initialUiMode?: 'online_class' | 'seminar'
  registrationFormFields?: IRegistrationFormField[]
  initialCameraEnabled?: boolean
  initialMicEnabled?: boolean
  onBackToLobby: () => void
  onRejoin: () => void
  onLeave: () => void
}

const ActiveNativeClassroom: React.FC<ActiveClassroomProps> = ({
  roomId,
  token,
  ticketCode,
  displayName,
  requestedRole,
  attendeeKey,
  formAnswers,
  initialUiMode,
  registrationFormFields,
  initialCameraEnabled,
  initialMicEnabled,
  onBackToLobby,
  onRejoin,
  onLeave,
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [showReplayModal, setShowReplayModal] = useState(false)
  const [layoutMode, setLayoutMode] = useState<ClassroomLayoutMode>('teaching')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const whiteboardFileInputRef = useRef<HTMLInputElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const {
    isConnected,
    isMicEnabled,
    isMicBlocked,
    isCameraEnabled,
    cameraFacingMode,
    isScreenSharing,
    localVideoStream,
    remoteVideoStreams,
    isAutoplayBlocked,
    participants,
    self,
    room,
    error,
    setError,
    removedCode,
    whiteboard,
    setWhiteboard,
    remoteLaser,
    remoteDraftElement,
    chatMessages,
    unreadChatCount,
    clearUnreadChat,
    polls,
    seminarAttendees,
    sendChatMessage,
    sendWhiteboardAction,
    diagnosticLogs,
    peersDiagnostics,
    unlockAudio,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
    toggleScreenShare,
    teacherMuteParticipant,
    teacherUnblockParticipant,
    teacherRemoveParticipant,
    teacherSetScreenSharePermission,
    teacherEndRoom,
    recordingState,
    startRecording,
    stopRecording,
    teacherPresence,
    roomTimer,
    endWarning,
    toggleHandRaise,
    grantSpeaker,
    revokeSpeaker,
    grantModerator,
    revokeModerator,
    createPoll,
    votePoll,
    closePoll,
    leaveRoom,
  } = useNativeClassroomAudio({
    roomId,
    token,
    ticketCode,
    displayName,
    requestedRole,
    attendeeKey,
    formAnswers,
    initialCameraEnabled,
    initialMicEnabled,
  })

  const [graceCountdownSec, setGraceCountdownSec] = useState<number | null>(null)

  useEffect(() => {
    const deadlineStr = teacherPresence?.teacherGraceDeadline
    if (!deadlineStr || teacherPresence?.present) {
      setGraceCountdownSec(null)
      return
    }
    const updateGrace = () => {
      const diff = Math.ceil((new Date(deadlineStr).getTime() - Date.now()) / 1000)
      setGraceCountdownSec(diff > 0 ? diff : 0)
    }
    updateGrace()
    const timer = setInterval(updateGrace, 1000)
    return () => clearInterval(timer)
  }, [teacherPresence?.teacherGraceDeadline, teacherPresence?.present])

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const isTeacher = !!(self?.isTeacher || self?.role === 'teacher')

  const allVisibleParticipants = self
    ? [self, ...participants.filter(p => p.peerId !== self.peerId)]
    : participants

  // Sort: Screen sharer first, then Teacher, then active mic, then others
  const sortedParticipants = [...allVisibleParticipants].sort((a, b) => {
    if (a.screenShareEnabled !== b.screenShareEnabled) {
      return a.screenShareEnabled ? -1 : 1
    }
    const aTeacher = a.isTeacher || a.role === 'teacher' ? 1 : 0
    const bTeacher = b.isTeacher || b.role === 'teacher' ? 1 : 0
    return bTeacher - aTeacher
  })

  const activeSpeakerOrTeacher =
    sortedParticipants.find(p => p.screenShareEnabled) ||
    sortedParticipants.find(p => p.isTeacher || p.role === 'teacher') ||
    sortedParticipants[0]

  // Auto-switch to speaker layout when a remote user starts screen sharing
  useEffect(() => {
    const someoneSharing = allVisibleParticipants.some(
      p => p.screenShareEnabled && p.peerId !== self?.peerId
    )
    if (someoneSharing) {
      setLayoutMode('speaker')
    }
  }, [allVisibleParticipants, self?.peerId])

  useEffect(() => {
    if (isChatOpen) {
      clearUnreadChat()
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isChatOpen, chatMessages.length, clearUnreadChat])

  const getVideoStreamFor = (peerId: string) =>
    peerId === self?.peerId ? localVideoStream : remoteVideoStreams.get(peerId) || null

  const currentPage = whiteboard.currentPage || 1
  const hasBackgroundSlide = !!whiteboard.pageBackgrounds?.[currentPage]

  const handleGridModeChange = (gridMode: WhiteboardGridMode) => {
    setWhiteboard(prev => ({ ...prev, gridMode }))
    sendWhiteboardAction('set_grid', { gridMode })
  }

  const handleToggleStudentDraw = () => {
    const next = !whiteboard.allowStudentDraw
    setWhiteboard(prev => ({ ...prev, allowStudentDraw: next }))
    sendWhiteboardAction('toggle_student_draw', { allowStudentDraw: next })
  }

  const handleClearPage = () => {
    setWhiteboard(prev => ({
      ...prev,
      pages: {
        ...(prev.pages || {}),
        [currentPage]: [],
      },
    }))
    sendWhiteboardAction('clear_page', { page: currentPage })
  }

  const handleClearBackground = () => {
    setWhiteboard(prev => {
      const nextBgs = { ...(prev.pageBackgrounds || {}) }
      delete nextBgs[currentPage]
      return { ...prev, pageBackgrounds: nextBgs }
    })
    sendWhiteboardAction('clear_background', { page: currentPage })
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    sendChatMessage(chatInput)
    setChatInput('')
  }

  // Adaptive grid columns based on participant count for 'grid' mode
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1 grid-rows-1'
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1'
    if (count <= 4) return 'grid-cols-2 grid-rows-2'
    return 'grid-cols-2 sm:grid-cols-3 auto-rows-fr'
  }

  if (removedCode) {
    const isDuplicate = removedCode === 'DUPLICATE_DEVICE'
    const isEnded = removedCode === 'ROOM_ENDED'
    const isInvalid = removedCode === 'INVALID_TICKET' || removedCode === 'UNAUTHORIZED'
    const title = isDuplicate
      ? 'اتصال شما در این دستگاه قطع شد'
      : isEnded
      ? 'جلسه کلاس به پایان رسید'
      : isInvalid
      ? 'عدم مجوز ورود به کلاس'
      : 'شما از کلاس خارج شدید'

    return (
      <div
        className="h-[100dvh] w-screen bg-slate-950 text-white flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl ${
              isDuplicate
                ? 'bg-amber-500/15 border border-amber-500/30'
                : 'bg-red-500/15 border border-red-500/30'
            }`}
          >
            {isDuplicate ? '📱' : isEnded ? '🏁' : '🚫'}
          </div>
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {error || 'ارتباط شما با کلاس آنلاین قطع شده است.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            {isDuplicate && (
              <button
                type="button"
                onClick={onRejoin}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                ورود مجدد از این دستگاه
              </button>
            )}
            <button
              type="button"
              onClick={onLeave}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
            >
              خروج از کلاس
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (room?.uiMode === 'seminar' || initialUiMode === 'seminar') {
    return (
      <SeminarStageView
        roomId={roomId}
        roomTitle={room?.title || 'سمینار آنلاین کیتایار'}
        isConnected={isConnected}
        isAutoplayBlocked={isAutoplayBlocked}
        isTeacher={isTeacher}
        isMicEnabled={isMicEnabled}
        isMicBlocked={isMicBlocked}
        isCameraEnabled={isCameraEnabled}
        isScreenSharing={isScreenSharing}
        self={self}
        participants={participants}
        localVideoStream={localVideoStream}
        remoteVideoStreams={remoteVideoStreams}
        chatMessages={chatMessages}
        polls={polls}
        seminarAttendees={seminarAttendees}
        registrationFormFields={registrationFormFields}
        whiteboard={whiteboard}
        remoteLaser={remoteLaser}
        remoteDraftElement={remoteDraftElement}
        onUnlockAudio={unlockAudio}
        onToggleMic={toggleMicrophone}
        onToggleCamera={toggleCamera}
        onSwitchCamera={switchCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleHandRaise={() => toggleHandRaise()}
        onGrantSpeaker={grantSpeaker}
        onRevokeSpeaker={revokeSpeaker}
        onGrantModerator={grantModerator}
        onRevokeModerator={revokeModerator}
        onRemoveParticipant={teacherRemoveParticipant}
        onCreatePoll={createPoll}
        onVotePoll={votePoll}
        onClosePoll={closePoll}
        onSendChat={text => sendChatMessage(text)}
        onWhiteboardAction={sendWhiteboardAction}
        onSetWhiteboard={setWhiteboard}
        onTeacherEndRoom={teacherEndRoom}
        onLeave={() => {
          leaveRoom()
          onLeave()
        }}
      />
    )
  }

  return (
    <div
      className="h-[100dvh] w-full max-w-full overflow-hidden bg-slate-950 text-white flex flex-col select-none"
      dir="rtl"
    >
      {/* 1. Compact Icon Header with Hamburger Menu & Layout Switcher */}
      <ClassroomHeader
        title={room?.title || 'کلاس آنلاین هوشمند کیتایار'}
        teacherName={activeSpeakerOrTeacher?.name}
        participantCount={allVisibleParticipants.length}
        isConnected={isConnected}
        isTeacher={isTeacher}
        layoutMode={layoutMode}
        gridMode={whiteboard.gridMode}
        allowStudentDraw={whiteboard.allowStudentDraw}
        hasBackgroundSlide={hasBackgroundSlide}
        diagnosticCount={diagnosticLogs.length}
        recordingState={recordingState}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onOpenReplay={() => setShowReplayModal(true)}
        onChangeLayout={setLayoutMode}
        onChangeGridMode={handleGridModeChange}
        onToggleStudentDraw={handleToggleStudentDraw}
        onUploadFile={() => {
          setLayoutMode('teaching')
          setTimeout(() => whiteboardFileInputRef.current?.click(), 80)
        }}
        onClearPage={handleClearPage}
        onClearBackground={handleClearBackground}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        onEndRoom={() => {
          teacherEndRoom()
          onLeave()
        }}
        onLeave={() => {
          leaveRoom()
          onLeave()
        }}
      />

      {/* Banners: Autoplay Unlock, End Warning, Teacher Waiting, or Error */}
      {endWarning && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 z-20 shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">⏳</span>
            <span>{endWarning.message || 'تنها ۵ دقیقه تا پایان کلاس آنلاین باقی مانده است.'}</span>
          </div>
          <span className="px-2 py-0.5 bg-black/20 rounded text-[11px]">۵ دقیقه باقی‌مانده</span>
        </div>
      )}

      {!isTeacher && teacherPresence && !teacherPresence.present && (
        <div className="bg-slate-900/95 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">👨‍🏫</span>
            <span>
              معلم هنوز وارد کلاس نشده است. در صورت عدم حضور تا ۳۰ دقیقه پس از ساعت مقرر، کلاس لغو و وجه به کیف پول شما مسترد می‌شود.
            </span>
          </div>
          {graceCountdownSec !== null && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-100 font-mono font-bold text-[11px]">
              مهلت ورود معلم: {formatCountdown(graceCountdownSec)}
            </div>
          )}
        </div>
      )}

      {isAutoplayBlocked && (
        <div
          onClick={unlockAudio}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 font-bold text-xs flex items-center justify-between cursor-pointer z-20 shrink-0"
        >
          <span>🔊 برای شنیدن صدای کلاس اینجا ضربه بزنید</span>
          <span className="px-2 py-0.5 bg-slate-950 text-amber-400 rounded-lg text-[10px]">
            فعال‌سازی صدا
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/90 border-b border-red-700 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between gap-2 z-20 shrink-0">
          <span className="truncate">⚠️ {error}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onBackToLobby}
              className="px-2 py-0.5 bg-blue-600 rounded-md text-[10px] cursor-pointer"
            >
              تغییر نقش
            </button>
            <button
              onClick={() => setError(null)}
              className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Classroom Stage (Fits 100% of remaining viewport without page scroll) */}
      <main className="flex-1 min-h-0 relative overflow-hidden p-1 sm:p-2.5 flex flex-col">
        {/* MODE A: TEACHING (Whiteboard + Compact Video Strip on Mobile / Sidebar on Desktop) */}
        {layoutMode === 'teaching' && (
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-1.5 sm:gap-2">
            {/* Mobile Compact Video Strip (Collapsible so mobile users have full whiteboard height when desired) */}
            {sortedParticipants.length > 0 && (
              <div className="lg:hidden flex flex-col shrink-0 gap-1 pb-1">
                <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                  <span className="font-bold text-slate-300">
                    👥 تصویر شرکت‌کنندگان ({sortedParticipants.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileVideoStripCollapsed(v => !v)}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                  >
                    <span>{mobileVideoStripCollapsed ? 'نمایش تصویر' : 'کوچک‌سازی'}</span>
                    <span>{mobileVideoStripCollapsed ? '▾' : '▴'}</span>
                  </button>
                </div>

                {!mobileVideoStripCollapsed && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-0.5">
                    {sortedParticipants.map(participant => (
                      <ParticipantCard
                        key={participant.peerId}
                        participant={participant}
                        isSelf={participant.peerId === self?.peerId}
                        isTeacherViewer={isTeacher}
                        compact={true}
                        cameraFacingMode={cameraFacingMode}
                        videoStream={getVideoStreamFor(participant.peerId)}
                        onToggleBlockMic={(peerId, currentBlocked) => {
                          if (currentBlocked) teacherUnblockParticipant(peerId)
                          else teacherMuteParticipant(peerId)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Whiteboard (Fills remaining height on mobile, 9 cols on desktop) */}
            <div className="flex-1 min-h-0 lg:col-span-9 h-full">
              <TeacherWhiteboard
                whiteboard={whiteboard}
                setWhiteboard={setWhiteboard}
                remoteLaser={remoteLaser}
                remoteDraftElement={remoteDraftElement}
                isTeacher={isTeacher}
                sendWhiteboardAction={sendWhiteboardAction}
                fileInputRef={whiteboardFileInputRef}
              />
            </div>

            {/* Desktop Video Sidebar (3 cols on desktop) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-2.5 h-full overflow-y-auto pl-1">
              {sortedParticipants.map(participant => (
                <div key={participant.peerId} className="h-44 shrink-0">
                  <ParticipantCard
                    participant={participant}
                    isSelf={participant.peerId === self?.peerId}
                    isTeacherViewer={isTeacher}
                    cameraFacingMode={cameraFacingMode}
                    videoStream={getVideoStreamFor(participant.peerId)}
                    onToggleBlockMic={(peerId, currentBlocked) => {
                      if (currentBlocked) teacherUnblockParticipant(peerId)
                      else teacherMuteParticipant(peerId)
                    }}
                    onRemoveParticipant={peerId => teacherRemoveParticipant(peerId)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE B: SPEAKER / SCREEN SHARE FOCUS */}
        {layoutMode === 'speaker' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            {/* Main Spotlight Video (Teacher or Active Screen Share) */}
            <div className="flex-1 min-h-0 w-full">
              {activeSpeakerOrTeacher && (
                <ParticipantCard
                  participant={activeSpeakerOrTeacher}
                  isSelf={activeSpeakerOrTeacher.peerId === self?.peerId}
                  isTeacherViewer={isTeacher}
                  cameraFacingMode={cameraFacingMode}
                  videoStream={getVideoStreamFor(activeSpeakerOrTeacher.peerId)}
                  onToggleBlockMic={(peerId, currentBlocked) => {
                    if (currentBlocked) teacherUnblockParticipant(peerId)
                    else teacherMuteParticipant(peerId)
                  }}
                />
              )}
            </div>

            {/* Bottom Thumbnail Strip of Other Participants */}
            {sortedParticipants.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 h-22 sm:h-26">
                {sortedParticipants
                  .filter(p => p.peerId !== activeSpeakerOrTeacher?.peerId)
                  .map(participant => (
                    <ParticipantCard
                      key={participant.peerId}
                      participant={participant}
                      isSelf={participant.peerId === self?.peerId}
                      isTeacherViewer={isTeacher}
                      compact={true}
                      cameraFacingMode={cameraFacingMode}
                      videoStream={getVideoStreamFor(participant.peerId)}
                      onToggleBlockMic={(peerId, currentBlocked) => {
                        if (currentBlocked) teacherUnblockParticipant(peerId)
                        else teacherMuteParticipant(peerId)
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* MODE C: EQUAL VIDEO GRID (Gallery View) */}
        {layoutMode === 'grid' && (
          <div className={`flex-1 min-h-0 grid gap-1.5 sm:gap-2 overflow-y-auto ${getGridClass(sortedParticipants.length)}`}>
            {sortedParticipants.map(participant => (
              <ParticipantCard
                key={participant.peerId}
                participant={participant}
                isSelf={participant.peerId === self?.peerId}
                isTeacherViewer={isTeacher}
                cameraFacingMode={cameraFacingMode}
                videoStream={getVideoStreamFor(participant.peerId)}
                onToggleBlockMic={(peerId, currentBlocked) => {
                  if (currentBlocked) teacherUnblockParticipant(peerId)
                  else teacherMuteParticipant(peerId)
                }}
                onRemoveParticipant={peerId => teacherRemoveParticipant(peerId)}
              />
            ))}
          </div>
        )}

        {/* MODE D: FULLSCREEN WHITEBOARD ONLY */}
        {layoutMode === 'board' && (
          <div className="flex-1 min-h-0 w-full h-full">
            <TeacherWhiteboard
              whiteboard={whiteboard}
              setWhiteboard={setWhiteboard}
              remoteLaser={remoteLaser}
              remoteDraftElement={remoteDraftElement}
              isTeacher={isTeacher}
              sendWhiteboardAction={sendWhiteboardAction}
              fileInputRef={whiteboardFileInputRef}
            />
          </div>
        )}

        {/* Slide-Over Live Chat Drawer */}
        {isChatOpen && (
          <div className="absolute inset-y-0 left-0 w-full sm:w-88 bg-slate-900/98 backdrop-blur-xl border-r border-slate-800 z-40 flex flex-col shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <span>💬</span>
                <span>گفتگوی کلاسی</span>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                  <span className="text-2xl mb-2">💭</span>
                  <span>هنوز پیامی ارسال نشده است.</span>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMine = msg.senderPeerId === self?.peerId
                  const isSenderTeacher = msg.senderRole === 'teacher'
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : isSenderTeacher
                            ? 'bg-indigo-950 border border-indigo-700 text-indigo-100 rounded-bl-xs'
                            : 'bg-slate-800 text-slate-100 rounded-bl-xs'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] opacity-80 mb-1 font-bold">
                          <span>{isSenderTeacher ? '🎓' : '👨‍🎓'}</span>
                          <span>{msg.senderName}</span>
                          <span>•</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed break-words select-text">{msg.text}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendChat}
              className="p-2 sm:p-2.5 border-t border-slate-800 flex items-center gap-2 bg-slate-950/80 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
            >
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                ارسال
              </button>
            </form>
          </div>
        )}

        {/* Slide-Over Participants Drawer */}
        {isParticipantsOpen && (
          <div className="absolute inset-y-0 left-0 w-full sm:w-88 bg-slate-900/98 backdrop-blur-xl border-r border-slate-800 z-40 flex flex-col shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <span>👥</span>
                <span>اعضای حاضر ({sortedParticipants.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsParticipantsOpen(false)}
                className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sortedParticipants.map(p => {
                const pIsTeacher = p.role === 'teacher' || p.isTeacher
                const pIsSelf = p.peerId === self?.peerId
                const pMicOn = p.micState === 'enabled'
                const pMicBlocked = p.micState === 'blocked'
                return (
                  <div
                    key={p.peerId}
                    className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          pIsTeacher ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {pIsTeacher ? '🎓' : '👨‍🎓'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {p.name} {pIsSelf ? '(شما)' : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{pIsTeacher ? 'مدرس کلاس' : 'دانش‌آموز'}</span>
                          <span>•</span>
                          <span className={pMicOn ? 'text-emerald-400' : 'text-slate-500'}>
                            {pMicBlocked ? '🔒 میکروفون قفل' : pMicOn ? '🎙️ صدا فعال' : 'بی‌صدا'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isTeacher && !pIsTeacher && !pIsSelf && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => teacherSetScreenSharePermission(p.peerId, !p.canShareScreen)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            p.canShareScreen
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          }`}
                          title={p.canShareScreen ? 'لغو اجازه اشتراک صفحه' : 'اجازه اشتراک صفحه'}
                        >
                          {p.canShareScreen ? 'لغو اشتراک' : 'اجازه اشتراک'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (pMicBlocked) teacherUnblockParticipant(p.peerId)
                            else teacherMuteParticipant(p.peerId)
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                            pMicBlocked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-600/30 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {pMicBlocked ? 'باز کردن صدا' : 'قفل صدا'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`آیا از اخراج ${p.name} اطمینان دارید؟`)) {
                              teacherRemoveParticipant(p.peerId)
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-red-600/30 text-red-300 border border-red-500/30 text-[10px] font-bold cursor-pointer"
                        >
                          اخراج
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* 3. Sleek Icon Bottom Control Bar */}
      <AudioControlBar
        isMicEnabled={isMicEnabled}
        isMicBlocked={isMicBlocked}
        isCameraEnabled={isCameraEnabled}
        isScreenSharing={isScreenSharing}
        canShareScreen={isTeacher || Boolean(self?.canShareScreen)}
        isTeacher={isTeacher}
        unreadChatCount={unreadChatCount}
        participantCount={sortedParticipants.length}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        onToggleMic={toggleMicrophone}
        onToggleCamera={toggleCamera}
        onSwitchCamera={switchCamera}
        onToggleScreenShare={toggleScreenShare}
        onOpenFilePicker={() => {
          setLayoutMode('teaching')
          setTimeout(() => whiteboardFileInputRef.current?.click(), 80)
        }}
        onToggleChat={() => {
          setIsChatOpen(v => !v)
          setIsParticipantsOpen(false)
        }}
        onToggleParticipants={() => {
          setIsParticipantsOpen(v => !v)
          setIsChatOpen(false)
        }}
        onLeave={() => {
          leaveRoom()
          onLeave()
        }}
      />

      {/* Diagnostics Modal */}
      <ClassroomDiagnostics
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        isConnected={isConnected}
        isMicEnabled={isMicEnabled}
        isMicBlocked={isMicBlocked}
        self={self}
        roomId={roomId}
        participants={participants}
        logs={diagnosticLogs}
        peersDiagnostics={peersDiagnostics}
        onUnlockAudio={unlockAudio}
      />

      {/* Adobe Connect Synchronized Recording Replay Modal */}
      {showReplayModal && (
        <ClassroomRecordingPlayerModal
          roomId={roomId}
          isOpen={showReplayModal}
          onClose={() => setShowReplayModal(false)}
        />
      )}
    </div>
  )
}
