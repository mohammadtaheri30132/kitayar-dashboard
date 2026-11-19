import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  classroomService,
  type IAttendanceReportData,
  type IDeveloperTelemetryReport,
  type ISeminarAttendeeRow,
} from '../../../services/classroomService'
import {
  CLASSROOM_RECORDING_THEME,
  EDU_ADMIN_TOKENS,
  SEMINAR_UI_TOKENS,
} from '../../../theme/eduAdminTokens'

interface AdminSeminarReportsModalProps {
  roomId: string | null // null => Global Server Telemetry Mode
  roomTitle?: string
  initialTab?: 'attendance' | 'telemetry'
  onClose: () => void
}

function formatDurationClock(totalSeconds?: number): string {
  const sec = Math.max(0, Math.round(totalSeconds || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function formatFaDateTime(value?: string | number): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export const AdminSeminarReportsModal: React.FC<AdminSeminarReportsModalProps> = ({
  roomId,
  roomTitle,
  initialTab = roomId ? 'attendance' : 'telemetry',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'telemetry'>(
    roomId ? initialTab : 'telemetry'
  )
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingTelemetry, setLoadingTelemetry] = useState(false)
  const [attendanceData, setAttendanceData] = useState<IAttendanceReportData | null>(null)
  const [telemetryData, setTelemetryData] = useState<IDeveloperTelemetryReport | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedAttendeeKey, setExpandedAttendeeKey] = useState<string | null>(null)
  const [autoRefreshTelemetry, setAutoRefreshTelemetry] = useState(true)

  const loadAttendance = async () => {
    if (!roomId) return
    try {
      setLoadingAttendance(true)
      const res = await classroomService.getAttendanceReport(roomId)
      if (res.success && res.data) {
        setAttendanceData(res.data)
      }
    } catch {
      toast.error('خطا در دریافت گزارش حضور و غیاب')
    } finally {
      setLoadingAttendance(false)
    }
  }

  const loadTelemetry = async (silent = false) => {
    try {
      if (!silent) setLoadingTelemetry(true)
      const res = roomId
        ? await classroomService.getRoomTelemetryReport(roomId)
        : await classroomService.getServerTelemetryReport()
      if (res.success && res.data) {
        setTelemetryData(res.data)
      }
    } catch {
      if (!silent) toast.error('خطا در دریافت گزارش فنی سرور')
    } finally {
      if (!silent) setLoadingTelemetry(false)
    }
  }

  useEffect(() => {
    if (roomId) loadAttendance()
    loadTelemetry()
  }, [roomId])

  useEffect(() => {
    if (activeTab !== 'telemetry' || !autoRefreshTelemetry) return
    const timer = setInterval(() => loadTelemetry(true), 8000)
    return () => clearInterval(timer)
  }, [activeTab, autoRefreshTelemetry, roomId])

  const formFields = useMemo(() => {
    return attendanceData?.registrationForm?.fields || []
  }, [attendanceData])

  const filteredAttendees = useMemo(() => {
    const list = attendanceData?.attendees || []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(item => {
      if ((item.displayName || '').toLowerCase().includes(q)) return true
      if ((item.attendeeKey || '').toLowerCase().includes(q)) return true
      const answers = item.formAnswers || {}
      return Object.values(answers).some(v => String(v ?? '').toLowerCase().includes(q))
    })
  }, [attendanceData, searchQuery])

  const handleExportCsv = () => {
    if (!attendanceData) return
    const headers = [
      'نام شرکت‌کننده',
      'نقش',
      'وضعیت فعلی',
      'تعداد دفعات ورود',
      'اولین ورود',
      'آخرین خروج',
      'مجموع حضور (ثانیه)',
      'مجموع حضور (ساعت)',
      ...formFields.map(f => f.label),
    ]

    const escapeCsv = (val: any) => {
      const s = String(val ?? '').replace(/"/g, '""')
      return `"${s}"`
    }

    const rows = filteredAttendees.map((att: ISeminarAttendeeRow) => [
      att.displayName,
      att.role === 'teacher' ? 'مجری/استاد' : 'شرکت‌کننده',
      att.isOnline ? 'آنلاین' : 'آفلاین',
      att.joinCount,
      formatFaDateTime(att.firstJoinedAt),
      att.isOnline ? 'در حال حضور' : formatFaDateTime(att.lastLeftAt),
      att.effectiveDurationSeconds,
      formatDurationClock(att.effectiveDurationSeconds),
      ...formFields.map(f => {
        const val = att.formAnswers?.[f.id]
        if (typeof val === 'boolean') return val ? 'بله' : 'خیر'
        return val ?? ''
      }),
    ])

    const csvContent =
      '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${attendanceData.roomId}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('فایل اکسل (CSV) گزارش حضور دانلود شد')
  }

  const handleCopyMarkdownReport = () => {
    if (!telemetryData?.markdownReport) return
    navigator.clipboard.writeText(telemetryData.markdownReport)
    toast.success('گزارش فنی Markdown برای مهندس نرم‌افزار کپی شد')
  }

  const handleDownloadJsonReport = () => {
    if (!telemetryData) return
    const blob = new Blob([JSON.stringify(telemetryData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `server-telemetry-${telemetryData.roomId || 'global'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('فایل JSON تست بار و ظرفیت سرور دانلود شد')
  }

  const healthBadgeClass =
    telemetryData?.healthStatus === 'critical'
      ? SEMINAR_UI_TOKENS.healthCritical
      : telemetryData?.healthStatus === 'elevated'
      ? SEMINAR_UI_TOKENS.healthElevated
      : SEMINAR_UI_TOKENS.healthHealthy

  const healthLabelFa =
    telemetryData?.healthStatus === 'critical'
      ? 'بحرانی (نزدیک به سقف منابع)'
      : telemetryData?.healthStatus === 'elevated'
      ? 'بار متوسط رو به بالا'
      : 'سالم و آماده پذیرش بار'

  return (
    <div dir="rtl" className={CLASSROOM_RECORDING_THEME.modalOverlay}>
      <div className={CLASSROOM_RECORDING_THEME.modalContainer}>
        {/* Top Modal Header */}
        <div className={CLASSROOM_RECORDING_THEME.headerBar}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {roomId ? `گزارش تحلیلی و فنی: ${roomTitle || attendanceData?.title || roomId}` : 'گزارش سلامت، منابع و ظرفیت سرور'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {roomId
                  ? 'رصد دقیق ورود و خروج، اطلاعات فرم داینامیک و تله‌متری منابع سرور'
                  : 'تله‌متری زنده Node.js / Event Loop / RAM / ظرفیت تخمینی برای تست بار مهندسی'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {roomId && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'attendance'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👥 حضور و فرم‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('telemetry')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'telemetry'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚙️ گزارش فنی سرور
                </button>
              </div>
            )}

            <button type="button" onClick={onClose} className={EDU_ADMIN_TOKENS.btnDanger}>
              ✕ بستن
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'attendance' && roomId && (
            <>
              {/* Attendance KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                  <span className="text-[11px] text-slate-400 font-medium">ثبت‌نام / ورودی یکتا</span>
                  <span className="text-2xl font-black text-white tabular-nums">
                    {attendanceData?.summary.totalRegistered ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-500">بدون تکرار در ورودهای مجدد</span>
                </div>

                <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                  <span className="text-[11px] text-slate-400 font-medium">حاضرین واقعی در جلسه</span>
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {attendanceData?.summary.totalAttended ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    مجموع دفعات ورود: {attendanceData?.summary.totalJoinEvents ?? 0}
                  </span>
                </div>

                <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                  <span className="text-[11px] text-slate-400 font-medium">آنلاین در لحظه</span>
                  <span className="text-2xl font-black text-cyan-400 tabular-nums">
                    {attendanceData?.summary.currentlyOnline ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-500">اتصال فعال WebSocket</span>
                </div>

                <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                  <span className="text-[11px] text-slate-400 font-medium">میانگین مدت حضور</span>
                  <span className="text-2xl font-black text-indigo-400 tabular-nums" dir="ltr">
                    {formatDurationClock(attendanceData?.summary.averageDurationSeconds)}
                  </span>
                  <span className="text-[10px] text-slate-500">محاسبه تجمعی تمام نوبت‌ها</span>
                </div>
              </div>

              {/* Filter & CSV Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[240px] max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="جستجو بر اساس نام یا پاسخ فرم (شماره تماس، ایمیل...)"
                    className={EDU_ADMIN_TOKENS.inputClass}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAttendance}
                    disabled={loadingAttendance}
                    className={EDU_ADMIN_TOKENS.btnGhost}
                  >
                    🔄 بروزرسانی
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={filteredAttendees.length === 0}
                    className={EDU_ADMIN_TOKENS.btnSuccess}
                  >
                    📥 خروجی اکسل (CSV)
                  </button>
                </div>
              </div>

              {/* Attendees & Form Answers Table */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold">
                      <tr>
                        <th className="py-3 px-4 text-start">شرکت‌کننده</th>
                        <th className="py-3 px-4 text-start">وضعیت</th>
                        <th className="py-3 px-4 text-start">دفعات ورود</th>
                        <th className="py-3 px-4 text-start">اولین ورود / آخرین خروج</th>
                        <th className="py-3 px-4 text-start">مجموع کل حضور</th>
                        {formFields.map(field => (
                          <th key={field.id} className="py-3 px-4 text-start">
                            {field.label}
                          </th>
                        ))}
                        <th className="py-3 px-4 text-center">تایم‌لاین</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {loadingAttendance && filteredAttendees.length === 0 ? (
                        <tr>
                          <td colSpan={6 + formFields.length} className="py-10 text-center text-slate-500">
                            در حال دریافت گزارش حضور...
                          </td>
                        </tr>
                      ) : filteredAttendees.length === 0 ? (
                        <tr>
                          <td colSpan={6 + formFields.length} className="py-10 text-center text-slate-500">
                            هنوز شرکت‌کننده‌ای ثبت نشده یا نتیجه‌ای با این جستجو یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        filteredAttendees.map(att => {
                          const isExpanded = expandedAttendeeKey === att.attendeeKey
                          return (
                            <React.Fragment key={att.attendeeKey}>
                              <tr className="hover:bg-slate-900/50 transition">
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                      <span>{att.role === 'teacher' ? '🎤' : '👤'}</span>
                                      <span>{att.displayName}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {att.attendeeKey}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {att.isOnline ? (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeSuccess}`}>
                                      ● آنلاین
                                    </span>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeMuted}`}>
                                      آفلاین
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 tabular-nums font-bold text-slate-200">
                                  {att.joinCount} بار
                                </td>
                                <td className="py-3 px-4 tabular-nums text-slate-300">
                                  <div className="flex flex-col text-[11px]">
                                    <span>ورود: {formatFaDateTime(att.firstJoinedAt)}</span>
                                    <span className="text-slate-500">
                                      خروج: {att.isOnline ? 'حاضر در جلسه' : formatFaDateTime(att.lastLeftAt)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    dir="ltr"
                                    className="inline-block px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-extrabold tabular-nums"
                                  >
                                    {formatDurationClock(att.effectiveDurationSeconds)}
                                  </span>
                                </td>
                                {formFields.map(field => {
                                  const raw = att.formAnswers?.[field.id]
                                  const displayVal =
                                    typeof raw === 'boolean' ? (raw ? 'تایید شد' : 'خیر') : raw || '—'
                                  return (
                                    <td key={field.id} className="py-3 px-4 text-slate-200">
                                      {String(displayVal)}
                                    </td>
                                  )
                                })}
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedAttendeeKey(isExpanded ? null : att.attendeeKey)
                                    }
                                    className={EDU_ADMIN_TOKENS.btnGhost}
                                  >
                                    {isExpanded ? 'بستن' : `جزئیات (${att.sessions?.length || 0})`}
                                  </button>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-slate-900/70">
                                  <td colSpan={6 + formFields.length} className="px-6 py-4">
                                    <div className="text-[11px] font-bold text-indigo-300 mb-2">
                                      تاریخچه دقیق دفعات ورود و خروج برای «{att.displayName}»:
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {(att.sessions || []).map((sess, idx) => (
                                        <div
                                          key={idx}
                                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between tabular-nums"
                                        >
                                          <span className="text-slate-300">
                                            نوبت {idx + 1}: {formatFaDateTime(sess.joinedAt)} ←{' '}
                                            {sess.leftAt ? formatFaDateTime(sess.leftAt) : 'آنلاین'}
                                          </span>
                                          <span className="text-emerald-400 font-bold" dir="ltr">
                                            {sess.leftAt
                                              ? formatDurationClock(sess.durationSeconds)
                                              : 'فعال'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Saved Polls Summary inside Admin Attendance Report */}
              {attendanceData?.polls && attendanceData.polls.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>📊</span>
                    <span>نتایج نظرسنجی‌های برگزارشده در جلسه ({attendanceData.polls.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attendanceData.polls.map(poll => {
                      const sumVotes = poll.options.reduce((acc, o) => acc + o.votes, 0) || 1
                      return (
                        <div
                          key={poll.id}
                          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white">{poll.question}</span>
                            <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                              {poll.totalVoters} رای
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {poll.options.map(opt => {
                              const pct = poll.totalVoters > 0 ? Math.round((opt.votes / sumVotes) * 100) : 0
                              return (
                                <div key={opt.id} className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-300">{opt.text}</span>
                                    <span className="text-indigo-300 font-bold tabular-nums">
                                      {pct}% ({opt.votes})
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'telemetry' && (
            <>
              {/* Telemetry Top Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${healthBadgeClass}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                  <span>وضعیت سلامت سرور: {healthLabelFa}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={autoRefreshTelemetry}
                      onChange={e => setAutoRefreshTelemetry(e.target.checked)}
                      className="rounded border-slate-600 text-indigo-600"
                    />
                    <span>پایش خودکار (هر ۸ ثانیه)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => loadTelemetry()}
                    disabled={loadingTelemetry}
                    className={EDU_ADMIN_TOKENS.btnGhost}
                  >
                    🔄 نمونه‌برداری لحظه‌ای
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyMarkdownReport}
                    className={EDU_ADMIN_TOKENS.btnPrimary}
                  >
                    📋 کپی گزارش Markdown مهندسی
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJsonReport}
                    className={EDU_ADMIN_TOKENS.btnSuccess}
                  >
                    💾 دانلود JSON تست بار
                  </button>
                </div>
              </div>

              {telemetryData && (
                <>
                  {/* Hardware & Architecture Summary */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="text-slate-400">مشخصات سخت‌افزار و هسته اجرا</div>
                      <div className="font-bold text-white">
                        {telemetryData.hostHardware.cpuModel} ({telemetryData.hostHardware.cpuCores} هسته) • RAM کل:{' '}
                        <span className="tabular-nums">{telemetryData.hostHardware.totalRamMb} MB</span> •{' '}
                        <span dir="ltr" className="font-mono text-cyan-300">
                          {telemetryData.hostHardware.nodeVersion}
                        </span>
                      </div>
                    </div>
                    <div className="text-start sm:text-end space-y-1">
                      <div className="text-slate-400">معماری انتقال و توپولوژی</div>
                      <div className="font-bold text-indigo-300 font-mono" dir="ltr">
                        {telemetryData.architecture}
                      </div>
                    </div>
                  </div>

                  {/* 6 Engineering Telemetry KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                      <span className="text-[11px] text-slate-400">مصرف CPU پردازش Node (زنده / پیک)</span>
                      <div className="flex items-baseline justify-between tabular-nums">
                        <span className="text-2xl font-black text-cyan-400">
                          {telemetryData.liveMetrics.cpuPercent}%
                        </span>
                        <span className="text-xs text-slate-400">
                          پیک: <strong className="text-white">{telemetryData.peakMetrics.peakCpuPercent}%</strong> | میانگین:{' '}
                          {telemetryData.peakMetrics.avgCpuPercent}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all"
                          style={{ width: `${Math.min(100, telemetryData.liveMetrics.cpuPercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                      <span className="text-[11px] text-slate-400">Event Loop Lag (p95)</span>
                      <div className="flex items-baseline justify-between tabular-nums">
                        <span className="text-2xl font-black text-emerald-400" dir="ltr">
                          {telemetryData.liveMetrics.eventLoopLagP95Ms} ms
                        </span>
                        <span className="text-xs text-slate-400">
                          حداکثر ثبت‌شده:{' '}
                          <strong className="text-white" dir="ltr">
                            {telemetryData.peakMetrics.peakEventLoopLagP95Ms} ms
                          </strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        مقدار زیر ۲۰ms نشانه پاسخ‌گویی بدون مکث وب‌سوکت است
                      </span>
                    </div>

                    <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                      <span className="text-[11px] text-slate-400">حافظه RAM (RSS پردازش / آزاد سیستم)</span>
                      <div className="flex items-baseline justify-between tabular-nums">
                        <span className="text-2xl font-black text-indigo-400" dir="ltr">
                          {telemetryData.peakMetrics.peakRssMb} MB
                        </span>
                        <span className="text-xs text-slate-400">
                          Heap: {telemetryData.liveMetrics.heapUsedMb} MB | آزاد:{' '}
                          <strong className="text-white">{telemetryData.hostHardware.freeRamMb} MB</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        سرانه هر کاربر: ~{telemetryData.capacityEstimation.marginalRamPerUserMb} MB RAM و{' '}
                        {telemetryData.capacityEstimation.marginalCpuPerUserPct}% CPU
                      </span>
                    </div>

                    <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                      <span className="text-[11px] text-slate-400">ترافیک سیگنالینگ WebSocket</span>
                      <div className="flex items-baseline justify-between tabular-nums">
                        <span className="text-2xl font-black text-amber-400">
                          {telemetryData.liveMetrics.wsMsgsPerSec} <span className="text-xs font-normal">msg/s</span>
                        </span>
                        <span className="text-xs text-slate-400">
                          ورودی: {telemetryData.peakMetrics.wsMessagesReceived} | خروجی:{' '}
                          {telemetryData.peakMetrics.wsMessagesBroadcast}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        پیک شرکت‌کنندگان همزمان: {telemetryData.peakMetrics.peakConcurrentParticipants} نفر
                      </span>
                    </div>

                    <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                      <span className="text-[11px] text-slate-400">ظرفیت تخمینی باقی‌مانده سیگنالینگ سرور</span>
                      <div className="flex items-baseline justify-between tabular-nums">
                        <span className="text-2xl font-black text-emerald-400">
                          +{telemetryData.capacityEstimation.signalingAdditionalUsersPossible} نفر
                        </span>
                        <span className="text-xs text-slate-400">
                          سقف کل سرور: ~{telemetryData.capacityEstimation.signalingServerMaxConcurrent} نفر
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        بر اساس Headroom فعلی CPU و RAM سرور Node.js
                      </span>
                    </div>

                    <div className={SEMINAR_UI_TOKENS.telemetryCard}>
                      <span className="text-[11px] text-slate-400">سقف ایمن توپولوژی مدیا (WebRTC)</span>
                      <div className="flex items-baseline justify-between tabular-nums">
                        <span className="text-2xl font-black text-rose-400">
                          ~{telemetryData.capacityEstimation.webrtcMediaTopologySafeCeiling} کاربر همزمان
                        </span>
                        <span className="text-xs text-slate-400">
                          لینک‌های P2P فعلی: {telemetryData.liveMetrics.estimatedPeerLinks}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        گلوگاه اصلی: {telemetryData.capacityEstimation.primaryBottleneck}
                      </span>
                    </div>
                  </div>

                  {/* Time-Series Load Bar Visualization */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">
                        نمودار زمانی مصرف CPU و تعداد کاربران همزمان (بازه نمونه‌برداری ۱۰ ثانیه‌ای)
                      </h4>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {telemetryData.samples.length} نمونه ثبت‌شده
                      </span>
                    </div>

                    {telemetryData.samples.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        هنوز نمونه زمانی برای این اتاق ثبت نشده است (نمونه‌برداری با ورود کاربران فعال می‌شود).
                      </div>
                    ) : (
                      <div className="flex items-end gap-1.5 h-32 pt-4 px-2 bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-x-auto">
                        {telemetryData.samples.map((s, idx) => {
                          const heightPct = Math.max(8, Math.min(100, s.cpuPercent * 1.4 + s.activeParticipants * 2))
                          return (
                            <div
                              key={idx}
                              className="flex-1 min-w-[14px] max-w-[32px] h-full flex flex-col justify-end items-center group relative"
                              title={`زمان: ${formatFaDateTime(s.timestamp)} | CPU: ${s.cpuPercent}% | کاربران: ${s.activeParticipants} | Lag: ${s.eventLoopLagP95Ms}ms`}
                            >
                              <span className="text-[9px] text-slate-400 tabular-nums mb-1 opacity-75 group-hover:opacity-100">
                                {s.activeParticipants}
                              </span>
                              <div
                                className={`w-full ${SEMINAR_UI_TOKENS.telemetryBarFill}`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Engineering Bottleneck Analysis & Recommendations */}
                  <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/30 space-y-2.5">
                    <h4 className="text-xs font-extrabold text-indigo-300 flex items-center gap-2">
                      <span>🧠</span>
                      <span>تحلیل گلوگاه و پیشنهادهای مهندسی نرم‌افزار</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-200 leading-relaxed list-disc list-inside">
                      {telemetryData.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
