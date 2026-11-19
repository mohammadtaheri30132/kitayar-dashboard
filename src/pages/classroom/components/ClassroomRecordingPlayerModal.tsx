import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CLASSROOM_RECORDING_THEME, EDU_ADMIN_TOKENS } from '../../../theme/eduAdminTokens'

export interface RecordingServerLogItem {
  timestamp: number | string
  offsetMs: number
  type: string
  actorId?: string
  actorName?: string
  actorRole?: string
  message: string
  metadata?: Record<string, any>
}

export interface RecordingChatItem {
  id: string
  senderId?: string
  senderName: string
  senderRole: 'teacher' | 'student' | 'admin'
  message: string
  timestamp: number | string
  offsetMs: number
}

export interface RecordingWhiteboardTimelineItem {
  timestamp: number | string
  offsetMs: number
  page?: number
  action: string
  payload?: any
}

export interface ClassroomRecordingPayload {
  roomId: string
  sessionId?: string
  title: string
  teacherName?: string
  studentName?: string
  isTestRoom?: boolean
  status: 'idle' | 'recording' | 'completed' | 'deleted'
  isRecording?: boolean
  mode: 'auto' | 'manual_test'
  startedAt?: string | number
  endedAt?: string | number
  durationSeconds: number
  videoUrl?: string
  fileSize: number
  chunksCount: number
  expiresAt?: string
  deletedAt?: string
  retentionHours?: number
  serverLogs: RecordingServerLogItem[]
  chatLog: RecordingChatItem[]
  whiteboardTimeline: RecordingWhiteboardTimelineItem[]
  participantsLog: Array<{
    identity: string
    name: string
    role: 'teacher' | 'student' | 'admin'
    joinedAt: string
    leftAt?: string
  }>
  whiteboardSnapshot?: any
}

interface ClassroomRecordingPlayerModalProps {
  roomId: string
  isOpen?: boolean
  onClose?: () => void
  isAdmin?: boolean
  fullPage?: boolean
  onDeleted?: () => void
}

function formatOffsetTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0))
  const hrs = Math.floor(safe / 3600)
  const mins = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatClockTime(ts?: number | string): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '۰ کیلوبایت'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const ClassroomRecordingPlayerModal: React.FC<ClassroomRecordingPlayerModalProps> = ({
  roomId,
  isOpen = true,
  onClose,
  isAdmin = false,
  fullPage = false,
  onDeleted,
}) => {
  const [data, setData] = useState<ClassroomRecordingPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeSec, setCurrentTimeSec] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [viewMode, setViewMode] = useState<'video' | 'interactive_board'>('video')
  const [activePodTab, setActivePodTab] = useState<'logs' | 'chat' | 'participants'>('logs')
  const [logFilter, setLogFilter] = useState<'all' | 'presence' | 'media' | 'board'>('all')
  const [syncFollow, setSyncFollow] = useState(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const logContainerRef = useRef<HTMLDivElement | null>(null)

  const fetchRecording = async () => {
    if (!roomId) return
    setLoading(true)
    setError(null)
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('kitayar_token') ||
        localStorage.getItem('nokita_token') ||
        ''
      const res = await fetch(
        `/api/classroom/native/rooms/${encodeURIComponent(roomId)}/recording`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'اطلاعات ضبط این کلاس یافت نشد')
      }
      setData(json.data)
      if (!json.data?.videoUrl) {
        setViewMode('interactive_board')
      } else {
        setViewMode('video')
      }
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری اطلاعات ضبط کلاس')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRecording()
    }
  }, [isOpen, roomId])

  const totalDurationSec = useMemo(() => {
    if (!data) return 60
    const maxLogSec =
      data.serverLogs?.length > 0
        ? Math.ceil(Math.max(...data.serverLogs.map(l => (l.offsetMs || 0) / 1000)))
        : 0
    const maxChatSec =
      data.chatLog?.length > 0
        ? Math.ceil(Math.max(...data.chatLog.map(c => (c.offsetMs || 0) / 1000)))
        : 0
    return Math.max(data.durationSeconds || 0, maxLogSec, maxChatSec, 10)
  }, [data])

  // Synthetic timer when playing in interactive board mode (or when video has no file)
  useEffect(() => {
    if (!isPlaying) return
    if (viewMode === 'video' && data?.videoUrl && videoRef.current) {
      return
    }
    const timer = window.setInterval(() => {
      setCurrentTimeSec(prev => {
        if (prev + 0.25 * playbackRate >= totalDurationSec) {
          setIsPlaying(false)
          return totalDurationSec
        }
        return prev + 0.25 * playbackRate
      })
    }, 250)
    return () => window.clearInterval(timer)
  }, [isPlaying, viewMode, data?.videoUrl, playbackRate, totalDurationSec])

  const seekToSecond = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(totalDurationSec, targetSec))
    setCurrentTimeSec(clamped)
    if (videoRef.current && data?.videoUrl) {
      try {
        videoRef.current.currentTime = clamped
      } catch {}
    }
  }

  const togglePlay = () => {
    if (viewMode === 'video' && data?.videoUrl && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {
          setViewMode('interactive_board')
          setIsPlaying(true)
        })
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    } else {
      if (currentTimeSec >= totalDurationSec) {
        setCurrentTimeSec(0)
      }
      setIsPlaying(prev => !prev)
    }
  }

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }

  // Reconstruct Whiteboard + Classroom Stage at currentTimeSec
  useEffect(() => {
    const canvas = boardCanvasRef.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentMs = currentTimeSec * 1000
    ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasBoardBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw subtle grid
    ctx.strokeStyle = CLASSROOM_RECORDING_THEME.canvasBoardGrid
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Reconstruct active page & strokes up to currentMs
    let activePage = 1
    const pages: Record<number, any[]> = { 1: [] }

    if (data.whiteboardTimeline && data.whiteboardTimeline.length > 0) {
      for (const item of data.whiteboardTimeline) {
        if ((item.offsetMs || 0) > currentMs) break
        const p = item.page || item.payload?.page || activePage
        if (!pages[p]) pages[p] = []
        if (item.action === 'change_page') {
          activePage = p
        } else if (item.action === 'clear_page') {
          pages[p] = []
        } else if (item.action === 'undo') {
          pages[p].pop()
        } else if (item.action === 'erase_element' && item.payload?.elementId) {
          pages[p] = pages[p].filter(el => el.id !== item.payload.elementId)
        } else if (item.action === 'add_element' && item.payload?.element) {
          pages[p].push(item.payload.element)
        }
      }
    } else if (data.whiteboardSnapshot?.pages) {
      Object.assign(pages, data.whiteboardSnapshot.pages)
      activePage = data.whiteboardSnapshot.currentPage || 1
    }

    const elements = pages[activePage] || []
    for (const el of elements) {
      ctx.save()
      ctx.strokeStyle = el.color || CLASSROOM_RECORDING_THEME.canvasDefaultPen
      ctx.fillStyle = el.color || CLASSROOM_RECORDING_THEME.canvasDefaultPen
      ctx.lineWidth = el.size || 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      if (el.tool === 'highlighter') {
        ctx.globalAlpha = 0.35
        ctx.lineWidth = (el.size || 4) * 3
      }

      if (Array.isArray(el.points) && el.points.length > 1) {
        ctx.beginPath()
        el.points.forEach((pt: { x: number; y: number }, idx: number) => {
          const px = pt.x <= 1 ? pt.x * canvas.width : pt.x
          const py = pt.y <= 1 ? pt.y * canvas.height : pt.y
          if (idx === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.stroke()
      } else if (el.start && el.end) {
        const sx = el.start.x <= 1 ? el.start.x * canvas.width : el.start.x
        const sy = el.start.y <= 1 ? el.start.y * canvas.height : el.start.y
        const ex = el.end.x <= 1 ? el.end.x * canvas.width : el.end.x
        const ey = el.end.y <= 1 ? el.end.y * canvas.height : el.end.y
        if (el.tool === 'rect') {
          ctx.strokeRect(sx, sy, ex - sx, ey - sy)
        } else if (el.tool === 'circle') {
          const r = Math.hypot(ex - sx, ey - sy)
          ctx.beginPath()
          ctx.arc(sx, sy, r, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(ex, ey)
          ctx.stroke()
        }
      } else if (el.text && el.start) {
        const tx = el.start.x <= 1 ? el.start.x * canvas.width : el.start.x
        const ty = el.start.y <= 1 ? el.start.y * canvas.height : el.start.y
        ctx.font = CLASSROOM_RECORDING_THEME.canvasTitleFont
        ctx.fillText(el.text, tx, ty)
      }
      ctx.restore()
    }

    // Overlay slide badge
    ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasHeaderBg
    ctx.fillRect(16, 16, 170, 34)
    ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasTextLight
    ctx.font = CLASSROOM_RECORDING_THEME.canvasSubFont
    ctx.textAlign = 'right'
    ctx.fillText(`تخته سفید • اسلاید ${activePage}`, 174, 38)
  }, [data, currentTimeSec, viewMode])

  // Filtered server logs
  const filteredServerLogs = useMemo(() => {
    if (!data?.serverLogs) return []
    return data.serverLogs.filter(log => {
      if (logFilter === 'all') return true
      if (logFilter === 'presence') {
        return ['participant_joined', 'participant_left', 'participant_removed', 'room_ended'].includes(log.type)
      }
      if (logFilter === 'media') {
        return ['mic_changed', 'camera_changed', 'screen_share_changed', 'permission_changed'].includes(log.type)
      }
      if (logFilter === 'board') {
        return ['whiteboard_action', 'recording_started', 'recording_stopped'].includes(log.type)
      }
      return true
    })
  }, [data?.serverLogs, logFilter])

  // Active participants at current timestamp
  const activeParticipantsAtTime = useMemo(() => {
    if (!data) return []
    const currentMs = currentTimeSec * 1000
    const map = new Map<
      string,
      { name: string; role: string; present: boolean; micOn: boolean; cameraOn: boolean }
    >()

    for (const log of data.serverLogs || []) {
      if ((log.offsetMs || 0) > currentMs) break
      const key = log.actorId || log.actorName || ''
      if (!key || log.actorRole === 'system') continue
      const existing = map.get(key) || {
        name: log.actorName || 'کاربر',
        role: log.actorRole || 'student',
        present: true,
        micOn: false,
        cameraOn: false,
      }
      if (log.type === 'participant_joined') {
        existing.present = true
      } else if (log.type === 'participant_left' || log.type === 'participant_removed') {
        existing.present = false
        existing.micOn = false
        existing.cameraOn = false
      } else if (log.type === 'mic_changed') {
        existing.micOn =
          log.metadata?.micState === 'enabled' ||
          log.metadata?.micState === 'unmuted' ||
          log.message.includes('روشن')
      } else if (log.type === 'camera_changed') {
        existing.cameraOn = !!log.metadata?.cameraEnabled || log.message.includes('روشن')
      }
      map.set(key, existing)
    }

    if (map.size === 0 && data.participantsLog?.length) {
      return data.participantsLog.map(p => ({
        name: p.name,
        role: p.role,
        present: true,
        micOn: false,
        cameraOn: false,
      }))
    }

    return Array.from(map.values())
  }, [data, currentTimeSec])

  const latestActiveEvent = useMemo(() => {
    if (!data?.serverLogs?.length) return null
    const currentMs = currentTimeSec * 1000 + 500
    let latest: RecordingServerLogItem | null = null
    for (const log of data.serverLogs) {
      if ((log.offsetMs || 0) <= currentMs) {
        latest = log
      } else {
        break
      }
    }
    return latest
  }, [data?.serverLogs, currentTimeSec])

  const handleDeleteRecording = async () => {
    if (!window.confirm('آیا از حذف فایل ویدیوی ضبط‌شده این کلاس از روی سرور اطمینان دارید؟ (لاگ سرور و چت‌ها باقی می‌مانند)')) {
      return
    }
    setDeleting(true)
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('kitayar_token') ||
        ''
      const res = await fetch(
        `/api/classroom/native/rooms/${encodeURIComponent(roomId)}/recording`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      const json = await res.json()
      if (json.success) {
        await fetchRecording()
        onDeleted?.()
      }
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  const wrapperClass = fullPage
    ? 'min-h-screen w-full bg-slate-950 text-slate-100 p-2 sm:p-4 flex flex-col'
    : CLASSROOM_RECORDING_THEME.modalOverlay

  const containerClass = fullPage
    ? 'w-full max-w-7xl mx-auto flex-1 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100'
    : CLASSROOM_RECORDING_THEME.modalContainer

  return (
    <div dir="rtl" className={wrapperClass}>
      <div className={containerClass}>
        {/* Top Adobe Connect Header */}
        <div className={CLASSROOM_RECORDING_THEME.headerBar}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-lg">
              🎬
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">
                  {data?.title || `بازپخش کلاس (${roomId})`}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    data?.mode === 'manual_test'
                      ? EDU_ADMIN_TOKENS.badgeWarning
                      : EDU_ADMIN_TOKENS.badgeInfo
                  }`}
                >
                  {data?.mode === 'manual_test' ? '🧪 ضبط دستی (بخش تست)' : '⚡ ضبط خودکار از لحظه ورود'}
                </span>
                {data?.status === 'deleted' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${EDU_ADMIN_TOKENS.badgeMuted}`}>
                    🗑️ ویدیو حذف‌شده (لاگ و چت موجود است)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1 tabular-nums">
                <span>شناسه اتاق: {data?.roomId || roomId}</span>
                {data?.fileSize ? <span>• حجم ویدیو: {formatBytes(data.fileSize)}</span> : null}
                {data?.expiresAt && data?.status !== 'deleted' && (
                  <span className="text-amber-300">
                    • حذف خودکار ویدیو: {new Date(data.expiresAt).toLocaleString('fa-IR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.videoUrl && (
              <a
                href={data.videoUrl}
                download
                target="_blank"
                rel="noreferrer"
                className={EDU_ADMIN_TOKENS.btnGhost}
              >
                ⬇️ دانلود فیلم کلاس
              </a>
            )}
            <button type="button" onClick={fetchRecording} className={EDU_ADMIN_TOKENS.btnGhost}>
              🔄 بروزرسانی
            </button>
            {isAdmin && data?.videoUrl && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRecording}
                className={EDU_ADMIN_TOKENS.btnDanger}
              >
                {deleting ? 'در حال حذف...' : '🗑️ حذف ویدیو از سرور'}
              </button>
            )}
            {onClose && (
              <button type="button" onClick={onClose} className={EDU_ADMIN_TOKENS.btnGhost}>
                ✕ بستن
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-bold">در حال بارگذاری فیلم ضبط‌شده، لاگ سرور و چت‌های کلاس...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-rose-300 font-bold">{error}</p>
            <button type="button" onClick={fetchRecording} className={EDU_ADMIN_TOKENS.btnPrimary}>
              تلاش مجدد
            </button>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
            {/* Main Stage Column (8 cols on lg) */}
            <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
              {/* Stage Mode Switcher & Live Event Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  {data?.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setViewMode('video')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        viewMode === 'video'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🎥 فیلم ضبط‌شده کلاس
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewMode('interactive_board')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      viewMode === 'interactive_board'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🎨 بازپخش همگام تخته سفید
                  </button>
                </div>

                {/* Live Server Log Ticker at Current Second */}
                <div className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl max-w-full truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-slate-400 shrink-0">لاگ لحظه فعلی:</span>
                  <span className="text-amber-300 font-bold truncate">
                    {latestActiveEvent ? latestActiveEvent.message : 'آماده شروع پخش کلاس'}
                  </span>
                </div>
              </div>

              {/* Video / Interactive Whiteboard Stage */}
              <div className="relative flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center min-h-[260px]">
                {viewMode === 'video' && data?.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={data.videoUrl}
                    className="w-full h-full object-contain bg-slate-950"
                    controls={false}
                    onTimeUpdate={e => setCurrentTimeSec(e.currentTarget.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onError={() => setViewMode('interactive_board')}
                  />
                ) : (
                  <canvas
                    ref={boardCanvasRef}
                    width={960}
                    height={540}
                    className="w-full h-full object-contain bg-white"
                  />
                )}

                {/* Floating Timestamp & Active Participants Overlay */}
                <div className="absolute top-3 start-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-700/80 text-xs font-bold text-white tabular-nums backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>زمان کلاس: {formatOffsetTime(currentTimeSec)}</span>
                  <span className="text-slate-400">|</span>
                  <span>
                    حاضرین این لحظه: {activeParticipantsAtTime.filter(p => p.present).length} نفر
                  </span>
                </div>
              </div>

              {/* Adobe Connect Synchronized Timeline Scrubber & Transport Controls */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5">
                {/* Timeline Track with Event Markers */}
                <div className="relative pt-2 pb-1">
                  <input
                    type="range"
                    min={0}
                    max={totalDurationSec}
                    step={0.5}
                    value={Math.min(currentTimeSec, totalDurationSec)}
                    onChange={e => seekToSecond(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  {/* Event Markers on Timeline */}
                  <div className="relative h-3 w-full mt-1">
                    {(data?.serverLogs || []).slice(0, 80).map((log, idx) => {
                      const sec = (log.offsetMs || 0) / 1000
                      const pct = Math.min(99, Math.max(1, (sec / totalDurationSec) * 100))
                      const dotColor =
                        log.type === 'participant_joined'
                          ? 'bg-emerald-400'
                          : log.type === 'participant_left' || log.type === 'participant_removed'
                            ? 'bg-rose-400'
                            : log.type === 'chat_message'
                              ? 'bg-amber-400'
                              : 'bg-sky-400'
                      return (
                        <button
                          key={`${log.offsetMs}_${idx}`}
                          type="button"
                          onClick={() => seekToSecond(sec)}
                          style={{ insetInlineStart: `${pct}%` }}
                          title={`${formatOffsetTime(sec)} - ${log.message}`}
                          className={`absolute top-0 w-2 h-2 rounded-full ${dotColor} hover:scale-150 transition`}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Transport Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow"
                    >
                      {isPlaying ? '⏸ توقف' : '▶ پخش همگام'}
                    </button>
                    <button
                      type="button"
                      onClick={() => seekToSecond(currentTimeSec - 10)}
                      className={EDU_ADMIN_TOKENS.btnGhost}
                    >
                      ⏪ ۱۰- ثانیه
                    </button>
                    <button
                      type="button"
                      onClick={() => seekToSecond(currentTimeSec + 10)}
                      className={EDU_ADMIN_TOKENS.btnGhost}
                    >
                      ۱۰+ ثانیه ⏩
                    </button>
                    <span className="text-xs font-bold text-slate-300 ms-2 tabular-nums">
                      {formatOffsetTime(currentTimeSec)} / {formatOffsetTime(totalDurationSec)}
                    </span>
                  </div>

                  {/* Playback Rate & Legend */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 me-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> ورود
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> خروج
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> چت
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-sky-400" /> صدا/تخته
                      </span>
                    </div>
                    {[1, 1.25, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => changeSpeed(rate)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold tabular-nums transition ${
                          playbackRate === rate
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Synchronized Pods Column (4 cols on lg) */}
            <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-hidden">
              {/* Pod Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActivePodTab('logs')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    activePodTab === 'logs'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📋 لاگ سرور</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] tabular-nums">
                    {data?.serverLogs?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePodTab('chat')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    activePodTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>💬 چت کلاس</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] tabular-nums">
                    {data?.chatLog?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePodTab('participants')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    activePodTab === 'participants'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>👥 حاضرین</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] tabular-nums">
                    {activeParticipantsAtTime.filter(p => p.present).length}
                  </span>
                </button>
              </div>

              {/* Pod 1: Synchronized Server Event Logs */}
              {activePodTab === 'logs' && (
                <div className={`${CLASSROOM_RECORDING_THEME.podCard} flex-1 min-h-0`}>
                  <div className={CLASSROOM_RECORDING_THEME.podHeader}>
                    <span>لاگ سرور در لحظه پخش (کلیک = پرش به ثانیه)</span>
                    <button
                      type="button"
                      onClick={() => setSyncFollow(v => !v)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        syncFollow ? EDU_ADMIN_TOKENS.badgeSuccess : EDU_ADMIN_TOKENS.badgeMuted
                      }`}
                    >
                      {syncFollow ? 'همگام با ویدیو ✓' : 'نمایش ثابت'}
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 p-2 border-b border-slate-800/80 overflow-x-auto">
                    {[
                      { id: 'all', label: 'همه رویدادها' },
                      { id: 'presence', label: 'ورود و خروج' },
                      { id: 'media', label: 'میکروفون و تصویر' },
                      { id: 'board', label: 'تخته و ضبط' },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setLogFilter(f.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                          logFilter === f.id
                            ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div ref={logContainerRef} className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    {filteredServerLogs.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-10">
                        هنوز رویدادی در این دسته ثبت نشده است.
                      </div>
                    ) : (
                      filteredServerLogs.map((log, index) => {
                        const sec = (log.offsetMs || 0) / 1000
                        const isReached = sec <= currentTimeSec + 0.5
                        const isCurrentMoment = Math.abs(sec - currentTimeSec) <= 2.5
                        return (
                          <button
                            key={`${log.offsetMs}_${index}`}
                            type="button"
                            onClick={() => seekToSecond(sec)}
                            className={`w-full text-start p-2.5 rounded-xl border transition flex flex-col gap-1 ${
                              isCurrentMoment
                                ? CLASSROOM_RECORDING_THEME.activeLogRow
                                : isReached
                                  ? CLASSROOM_RECORDING_THEME.inactiveLogRow
                                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-65 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
                              <span className="px-2 py-0.5 rounded-md bg-slate-950 text-indigo-300 font-bold">
                                ⏱ {formatOffsetTime(sec)}
                              </span>
                              <span className="text-slate-400">{formatClockTime(log.timestamp)}</span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed">{log.message}</p>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Pod 2: Synchronized In-Class Chat Messages */}
              {activePodTab === 'chat' && (
                <div className={`${CLASSROOM_RECORDING_THEME.podCard} flex-1 min-h-0`}>
                  <div className={CLASSROOM_RECORDING_THEME.podHeader}>
                    <span>چت‌های داخل کلاس (همگام با تایم‌لاین)</span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {data?.chatLog?.length || 0} پیام
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {!data?.chatLog || data.chatLog.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-10">
                        هیچ پیام متنی در طول این کلاس ارسال نشده است.
                      </div>
                    ) : (
                      data.chatLog.map((chat, idx) => {
                        const sec = (chat.offsetMs || 0) / 1000
                        const isReached = sec <= currentTimeSec + 0.5
                        return (
                          <button
                            key={chat.id || idx}
                            type="button"
                            onClick={() => seekToSecond(sec)}
                            className={`w-full text-start p-3 rounded-2xl border transition ${
                              isReached
                                ? 'bg-slate-900/90 border-slate-700/80 text-slate-100'
                                : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    chat.senderRole === 'teacher'
                                      ? EDU_ADMIN_TOKENS.badgePurple
                                      : EDU_ADMIN_TOKENS.badgeInfo
                                  }`}
                                >
                                  {chat.senderRole === 'teacher' ? 'استاد' : 'دانش‌آموز'}
                                </span>
                                <span className="text-xs font-bold text-white">{chat.senderName}</span>
                              </div>
                              <span className="text-[11px] text-indigo-300 font-bold tabular-nums">
                                {formatOffsetTime(sec)}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-200">{chat.message}</p>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Pod 3: Active Participants at Current Timestamp */}
              {activePodTab === 'participants' && (
                <div className={`${CLASSROOM_RECORDING_THEME.podCard} flex-1 min-h-0`}>
                  <div className={CLASSROOM_RECORDING_THEME.podHeader}>
                    <span>وضعیت اعضا در ثانیه {formatOffsetTime(currentTimeSec)}</span>
                    <span className="text-[11px] text-emerald-400 font-bold tabular-nums">
                      {activeParticipantsAtTime.filter(p => p.present).length} حاضر
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {activeParticipantsAtTime.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-10">
                        اطلاعات حضور و غیاب در این ثانیه ثبت نشده است.
                      </div>
                    ) : (
                      activeParticipantsAtTime.map((p, idx) => (
                        <div
                          key={`${p.name}_${idx}`}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            p.present
                              ? 'bg-slate-900/90 border-slate-800 text-white'
                              : 'bg-slate-950/50 border-slate-900 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                p.present ? 'bg-emerald-400' : 'bg-slate-600'
                              }`}
                            />
                            <div>
                              <div className="text-xs font-bold">{p.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {p.role === 'teacher' ? 'مدرس کلاس' : 'دانش‌آموز'} •{' '}
                                {p.present ? 'حاضر در کلاس' : 'خارج شده'}
                              </div>
                            </div>
                          </div>
                          {p.present && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span title={p.micOn ? 'میکروفون روشن' : 'میکروفون خاموش'}>
                                {p.micOn ? '🎙️' : '🔇'}
                              </span>
                              <span title={p.cameraOn ? 'دوربین روشن' : 'دوربین خاموش'}>
                                {p.cameraOn ? '📹' : '📷'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const ClassroomRecordingReplayPage: React.FC<{ roomId?: string; onBack?: () => void }> = ({
  roomId,
  onBack,
}) => {
  const resolvedRoomId =
    roomId ||
    window.location.pathname.match(/\/classroom\/replay\/([^/?#]+)/)?.[1] ||
    ''
  return (
    <ClassroomRecordingPlayerModal
      roomId={decodeURIComponent(resolvedRoomId)}
      isOpen={true}
      fullPage={true}
      onClose={onBack || (() => window.history.back())}
    />
  )
}
