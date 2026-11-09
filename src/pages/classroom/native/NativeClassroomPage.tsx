import React, { useState, useEffect, useRef } from 'react'
import { useNativeClassroomAudio } from '../../../services/nativeWebrtc/useNativeClassroomAudio'
import type { ClassroomLayoutMode, WhiteboardGridMode } from '../../../services/nativeWebrtc/types'
import { ClassroomHeader } from './components/ClassroomHeader'
import { ParticipantCard } from './components/ParticipantCard'
import { AudioControlBar } from './components/AudioControlBar'
import { ClassroomDiagnostics } from './components/ClassroomDiagnostics'
import { TeacherWhiteboard } from './components/TeacherWhiteboard'

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

  useEffect(() => {
    const savedToken = localStorage.getItem('auth-token') || ''
    setToken(savedToken)

    const search = new URLSearchParams(window.location.search)
    const urlTicket = search.get('ticket') || search.get('token') || ''
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
    }

    const savedUserStr = localStorage.getItem('auth-user')
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr)
        const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username
        if (name) setDisplayName(name)
      } catch (e) {}
    }

    let isMounted = true
    const loadInfo = () => {
      fetch(`/api/classroom/native/rooms/${encodeURIComponent(roomId)}/info`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.success && data.data) {
            setRoomInfo(data.data)
            if (data.data.hasActiveTeacher) {
              setSelectedRole('student')
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

  // Pre-join Lobby View (Dark Modern Theme)
  if (!hasEnteredLobby) {
    return (
      <div
        className="min-h-[100dvh] bg-slate-950 text-white flex flex-col justify-center items-center p-4 select-none"
        dir="rtl"
      >
        <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-6 sm:p-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-2xl mx-auto shadow-lg shadow-blue-600/30 mb-3">
            🎥
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-center text-white mb-1">
            {roomInfo?.title || (isTestRoom ? 'کلاس آنلاین هوشمند کیتایار' : 'کلاس آنلاین کیتایار')}
          </h2>

          {isTestRoom && (
            <div className="my-2.5 py-1.5 px-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 rounded-xl text-center text-[11px] font-bold flex items-center justify-center gap-1.5">
              <span>🧪</span>
              <span>محیط تست مستقیم صوتی، تصویری و تخته هوشمند</span>
            </div>
          )}

          <div className="space-y-4 my-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                انتخاب نقش ورود به کلاس:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={teacherPresent}
                  onClick={() => setSelectedRole('teacher')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                    teacherPresent
                      ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      : selectedRole === 'teacher'
                      ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30 text-white cursor-pointer'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🎓</span>
                    {teacherPresent ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                        تکمیل 🔒
                      </span>
                    ) : (
                      selectedRole === 'teacher' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      )
                    )}
                  </div>
                  <span className="text-xs font-bold">ورود به عنوان معلم</span>
                  <span className="text-[10px] text-slate-400">
                    {teacherPresent ? 'معلم در کلاس حاضر است' : 'تخته، PDF و مدیریت کلاس'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    selectedRole === 'student' || teacherPresent
                      ? 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">👨‍🎓</span>
                    {(selectedRole === 'student' || teacherPresent) && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <span className="text-xs font-bold">ورود به عنوان دانش‌آموز</span>
                  <span className="text-[10px] text-slate-400">مشاهده تخته، صدا و تصویر</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نام نمایشی شما:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="مثال: استاد رضایی یا علی"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500 text-sm font-medium"
              />
            </div>

            {/* Camera initial state toggle */}
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

            <button
              onClick={() => {
                const effectiveRole = teacherPresent ? 'student' : selectedRole
                setSelectedRole(effectiveRole)
                const name =
                  displayName.trim() ||
                  `${effectiveRole === 'teacher' ? 'مدرس' : 'دانش‌آموز'} (${Math.floor(
                    100 + Math.random() * 900
                  )})`
                setDisplayName(name)
                setHasEnteredLobby(true)
              }}
              disabled={infoLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer mt-1"
            >
              {teacherPresent || selectedRole === 'student'
                ? '👨‍🎓 ورود به کلاس (دانش‌آموز)'
                : '🎓 ورود به کلاس (معلم)'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ActiveNativeClassroom
      roomId={roomId}
      token={token}
      ticketCode={ticket}
      displayName={displayName}
      requestedRole={selectedRole}
      initialCameraEnabled={startWithCamera}
      onBackToLobby={() => {
        setSelectedRole('student')
        setHasEnteredLobby(false)
      }}
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
  initialCameraEnabled?: boolean
  onBackToLobby: () => void
  onLeave: () => void
}

const ActiveNativeClassroom: React.FC<ActiveClassroomProps> = ({
  roomId,
  token,
  ticketCode,
  displayName,
  requestedRole,
  initialCameraEnabled,
  onBackToLobby,
  onLeave,
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false)
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
    whiteboard,
    setWhiteboard,
    remoteLaser,
    remoteDraftElement,
    chatMessages,
    unreadChatCount,
    clearUnreadChat,
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
    teacherEndRoom,
    leaveRoom,
  } = useNativeClassroomAudio({
    roomId,
    token,
    ticketCode,
    displayName,
    requestedRole,
    initialCameraEnabled,
  })

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

  return (
    <div
      className="h-[100dvh] w-screen overflow-hidden bg-slate-950 text-white flex flex-col select-none"
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

      {/* Banners: Autoplay Unlock or Error */}
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
      <main className="flex-1 min-h-0 relative overflow-hidden p-1.5 sm:p-2.5 flex flex-col">
        {/* MODE A: TEACHING (Whiteboard + Compact Video Strip on Mobile / Sidebar on Desktop) */}
        {layoutMode === 'teaching' && (
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-2">
            {/* Mobile Compact Video Strip (Top 84px strip so mobile users see Teacher video + Whiteboard together) */}
            <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-0.5">
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
          <div className={`flex-1 min-h-0 grid gap-2 ${getGridClass(sortedParticipants.length)}`}>
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
              className="p-2.5 border-t border-slate-800 flex items-center gap-2 bg-slate-950/60"
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
    </div>
  )
}
