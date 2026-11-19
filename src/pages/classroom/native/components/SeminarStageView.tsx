import React, { useMemo, useRef, useState } from 'react'
import { EDU_ADMIN_TOKENS, SEMINAR_UI_TOKENS } from '../../../../theme/eduAdminTokens'
import type {
  IChatMessage,
  INativeParticipant,
  ISeminarPollView,
  IWhiteboardState,
} from '../../../../services/nativeWebrtc/types'
import type {
  IRegistrationFormField,
  ISeminarAttendeeRow,
} from '../../../../services/classroomService'
import { ParticipantCard } from './ParticipantCard'
import { TeacherWhiteboard } from './TeacherWhiteboard'

interface SeminarStageViewProps {
  roomId: string
  roomTitle: string
  isConnected: boolean
  isAutoplayBlocked: boolean
  isTeacher: boolean
  isMicEnabled: boolean
  isMicBlocked: boolean
  isCameraEnabled: boolean
  isScreenSharing: boolean
  self: INativeParticipant | null
  participants: INativeParticipant[]
  localVideoStream: MediaStream | null
  remoteVideoStreams: Map<string, MediaStream>
  chatMessages: IChatMessage[]
  polls: ISeminarPollView[]
  seminarAttendees: ISeminarAttendeeRow[]
  registrationFormFields?: IRegistrationFormField[]
  whiteboard: IWhiteboardState
  remoteLaser: any
  remoteDraftElement: any
  onUnlockAudio: () => void
  onToggleMic: () => void
  onToggleCamera: () => void
  onSwitchCamera: () => void
  onToggleScreenShare: () => void
  onToggleHandRaise: () => void
  onGrantSpeaker: (peerId: string) => void
  onRevokeSpeaker: (peerId: string) => void
  onGrantModerator: (peerId: string) => void
  onRevokeModerator: (peerId: string) => void
  onRemoveParticipant: (peerId: string) => void
  onCreatePoll: (payload: { question: string; options: string[]; allowMultiple?: boolean }) => void
  onVotePoll: (pollId: string, optionIds: string[]) => void
  onClosePoll: (pollId: string) => void
  onSendChat: (text: string) => void
  onWhiteboardAction: (action: string, payload?: any) => void
  onSetWhiteboard: React.Dispatch<React.SetStateAction<IWhiteboardState>>
  onTeacherEndRoom: () => void
  onLeave: () => void
}

export const SeminarStageView: React.FC<SeminarStageViewProps> = ({
  roomTitle,
  isConnected,
  isAutoplayBlocked,
  isTeacher,
  isMicEnabled,
  isMicBlocked,
  isCameraEnabled,
  isScreenSharing,
  self,
  participants,
  localVideoStream,
  remoteVideoStreams,
  chatMessages,
  polls,
  seminarAttendees,
  registrationFormFields = [],
  whiteboard,
  remoteLaser,
  remoteDraftElement,
  onUnlockAudio,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onToggleScreenShare,
  onToggleHandRaise,
  onGrantSpeaker,
  onRevokeSpeaker,
  onGrantModerator,
  onRevokeModerator,
  onRemoveParticipant,
  onCreatePoll,
  onVotePoll,
  onClosePoll,
  onSendChat,
  onWhiteboardAction,
  onSetWhiteboard,
  onTeacherEndRoom,
  onLeave,
}) => {
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'polls' | 'people'>('chat')
  const [stageMode, setStageMode] = useState<'video' | 'slides'>('video')
  const [chatText, setChatText] = useState('')
  const [expandedAttendeeId, setExpandedAttendeeId] = useState<string | null>(null)
  const slideInputRef = useRef<HTMLInputElement | null>(null)

  // Live Poll Builder State (Managers Only)
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false)

  const isManager = !!(isTeacher || self?.isModerator || self?.role === 'teacher' || self?.role === 'admin')

  const allPeople = useMemo(() => {
    const map = new Map<string, INativeParticipant>()
    if (self) map.set(self.peerId, self)
    for (const p of participants) map.set(p.peerId, p)
    return Array.from(map.values())
  }, [self, participants])

  const stageSpeakers = useMemo(() => {
    return allPeople.filter(
      p => p.isTeacher || p.role === 'teacher' || p.role === 'admin' || p.isModerator || p.isSpeaker
    )
  }, [allPeople])

  const handRaisedAudience = useMemo(() => {
    return allPeople.filter(p => !p.isTeacher && !p.isModerator && p.role !== 'teacher' && p.handRaised)
  }, [allPeople])

  const primaryPresenter = useMemo(() => {
    const sharing = allPeople.find(p => p.screenShareEnabled)
    if (sharing) return sharing
    const manager = allPeople.find(p => p.isTeacher || p.role === 'teacher' || p.isModerator)
    return manager || stageSpeakers[0] || self || null
  }, [allPeople, stageSpeakers, self])

  const activeOpenPolls = useMemo(() => polls.filter(p => !p.isClosed), [polls])

  const fieldLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of registrationFormFields) {
      map.set(f.id, f.label)
    }
    return map
  }, [registrationFormFields])

  const findFormAnswersForParticipant = (p: INativeParticipant) => {
    if (!seminarAttendees.length) return null
    return (
      seminarAttendees.find(
        a =>
          (p.attendeeKey && a.attendeeKey === p.attendeeKey) ||
          (a.displayName && a.displayName === p.name)
      ) || null
    )
  }

  const offlineRegisteredAttendees = useMemo(() => {
    const onlineKeys = new Set(allPeople.map(p => p.attendeeKey).filter(Boolean))
    const onlineNames = new Set(allPeople.map(p => p.name))
    return seminarAttendees.filter(
      a => (!a.attendeeKey || !onlineKeys.has(a.attendeeKey)) && !onlineNames.has(a.displayName)
    )
  }, [seminarAttendees, allPeople])

  const getStreamFor = (p: INativeParticipant | null) => {
    if (!p) return null
    if (self && p.peerId === self.peerId) return localVideoStream
    return remoteVideoStreams.get(p.peerId) || null
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatText.trim()) return
    onSendChat(chatText.trim())
    setChatText('')
  }

  const handlePollSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanOpts = pollOptions.map(o => o.trim()).filter(Boolean)
    if (!pollQuestion.trim() || cleanOpts.length < 2) return
    onCreatePoll({
      question: pollQuestion.trim(),
      options: cleanOpts,
      allowMultiple: pollAllowMultiple,
    })
    setPollQuestion('')
    setPollOptions(['', ''])
    setPollAllowMultiple(false)
    setShowPollForm(false)
  }

  const canBroadcastMedia = isManager || !!self?.isSpeaker || !isMicBlocked

  return (
    <div dir="rtl" className={SEMINAR_UI_TOKENS.shellBg}>
      {/* Top Seminar Live Bar (Clean — No Technical Logs/Diagnostics) */}
      <header className={SEMINAR_UI_TOKENS.topBar}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={SEMINAR_UI_TOKENS.liveBroadcastBadge}>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{isConnected ? 'پخش زنده سمینار' : 'در حال اتصال...'}</span>
          </span>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate">{roomTitle}</h1>
            <p className="text-[11px] text-slate-400 truncate">
              مدیر / میزبان: {primaryPresenter?.name || 'در انتظار ورود مدیر'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={SEMINAR_UI_TOKENS.audiencePill}>
            <span>👥</span>
            <span>{allPeople.length} حاضر در سالن</span>
          </span>

          {activeOpenPolls.length > 0 && (
            <button
              type="button"
              onClick={() => setSidebarTab('polls')}
              className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums animate-pulse ${EDU_ADMIN_TOKENS.badgeWarning}`}
            >
              📊 نظرسنجی فعال ({activeOpenPolls.length})
            </button>
          )}

          {isManager && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setStageMode('video')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  stageMode === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎥 نمای استیج
              </button>
              <button
                type="button"
                onClick={() => setStageMode('slides')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  stageMode === 'slides' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🖼️ تخته و اسلاید
              </button>
            </div>
          )}

          {isManager && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('آیا سمینار برای تمام شرکت‌کنندگان به پایان برسد؟')) {
                  onTeacherEndRoom()
                }
              }}
              className={EDU_ADMIN_TOKENS.btnDanger}
            >
              🛑 پایان سمینار
            </button>
          )}

          <button type="button" onClick={onLeave} className={EDU_ADMIN_TOKENS.btnDanger}>
            خروج
          </button>
        </div>
      </header>

      {/* Autoplay Audio Notice for Audience */}
      {isAutoplayBlocked && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <span className="text-amber-200 font-bold">
            🔊 برای شنیدن صدای سخنرانان سمینار، روی دکمه فعال‌سازی صدا کلیک کنید.
          </span>
          <button type="button" onClick={onUnlockAudio} className={EDU_ADMIN_TOKENS.btnSuccess}>
            فعال‌سازی صدای سمینار
          </button>
        </div>
      )}

      {/* Main Auditorium Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 sm:p-5 max-w-[1600px] w-full mx-auto">
        {/* Main Stage (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-3 min-h-[380px]">
          <div className={SEMINAR_UI_TOKENS.stageFrame}>
            <div className={SEMINAR_UI_TOKENS.stageHeaderOverlay}>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-bold">
                  {stageMode === 'slides' || primaryPresenter?.screenShareEnabled
                    ? '🖥️ صفحه نمایش و اسلاید ارائه'
                    : '🎙️ استیج اصلی سمینار'}
                </span>
                {primaryPresenter?.screenShareEnabled && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeInfo}`}>
                    اشتراک صفحه زنده
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-[11px] tabular-nums">
                {stageSpeakers.length} سخنران و مدیر روی استیج
              </span>
            </div>

            <div className="flex-1 relative p-3 flex items-center justify-center bg-slate-950/70">
              {stageMode === 'slides' ? (
                <div className="w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-slate-800">
                  <TeacherWhiteboard
                    whiteboard={whiteboard}
                    setWhiteboard={onSetWhiteboard}
                    remoteLaser={remoteLaser}
                    remoteDraftElement={remoteDraftElement}
                    isTeacher={isManager}
                    sendWhiteboardAction={onWhiteboardAction}
                    fileInputRef={slideInputRef}
                  />
                </div>
              ) : primaryPresenter ? (
                <div className="w-full h-full max-w-4xl flex items-center justify-center">
                  <div className="w-full aspect-video max-h-[520px]">
                    <ParticipantCard
                      participant={primaryPresenter}
                      isSelf={!!(self && primaryPresenter.peerId === self.peerId)}
                      isTeacherViewer={isManager}
                      videoStream={getStreamFor(primaryPresenter)}
                      uiMode="seminar"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 text-slate-400">
                  <div className="text-4xl">🎤</div>
                  <p className="text-sm font-bold text-white">در انتظار شروع سخنرانی مدیر سمینار...</p>
                  <p className="text-xs">به محض اتصال مدیر یا سخنران، صدا و تصویر به صورت زنده نمایش داده می‌شود.</p>
                </div>
              )}
            </div>

            {/* Active Co-Speakers / Co-Managers Strip */}
            {stageSpeakers.length > 1 && (
              <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-3 overflow-x-auto">
                {stageSpeakers.map(sp => (
                  <div key={sp.peerId} className={`w-44 h-28 shrink-0 ${SEMINAR_UI_TOKENS.speakerTileActive}`}>
                    <ParticipantCard
                      participant={sp}
                      isSelf={!!(self && sp.peerId === self.peerId)}
                      isTeacherViewer={isManager}
                      videoStream={getStreamFor(sp)}
                      compact={true}
                      uiMode="seminar"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {canBroadcastMedia ? (
                <>
                  <button
                    type="button"
                    onClick={onToggleMic}
                    className={isMicEnabled ? EDU_ADMIN_TOKENS.btnSuccess : EDU_ADMIN_TOKENS.btnGhost}
                  >
                    {isMicEnabled ? '🎙️ میکروفون روشن' : '🔇 میکروفون خاموش'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleCamera}
                    className={isCameraEnabled ? EDU_ADMIN_TOKENS.btnPrimary : EDU_ADMIN_TOKENS.btnGhost}
                  >
                    {isCameraEnabled ? '📹 دوربین روشن' : '📷 روشن کردن دوربین'}
                  </button>
                  {isCameraEnabled && (
                    <button type="button" onClick={onSwitchCamera} className={EDU_ADMIN_TOKENS.btnGhost}>
                      🔄 چرخش دوربین
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onToggleScreenShare}
                    className={isScreenSharing ? EDU_ADMIN_TOKENS.btnPrimary : EDU_ADMIN_TOKENS.btnGhost}
                  >
                    {isScreenSharing ? '🖥️ توقف اشتراک صفحه' : '🖥️ اشتراک صفحه / ارائه'}
                  </button>
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setStageMode('slides')
                        setTimeout(() => slideInputRef.current?.click(), 80)
                      }}
                      className={EDU_ADMIN_TOKENS.btnGhost}
                    >
                      📎 بارگذاری PDF / اسلاید
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onToggleHandRaise}
                    className={
                      self?.handRaised
                        ? SEMINAR_UI_TOKENS.raiseHandBtnActive
                        : SEMINAR_UI_TOKENS.raiseHandBtnIdle
                    }
                  >
                    <span>✋</span>
                    <span>
                      {self?.handRaised
                        ? 'دست شما بالاست (در انتظار تایید مدیر)'
                        : 'بلند کردن دست برای صحبت'}
                    </span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    در سمینار میکروفون شرکت‌کنندگان بسته است؛ برای پرسش یا صحبت دست خود را بالا ببرید.
                  </span>
                </div>
              )}
            </div>

            {isManager && handRaisedAudience.length > 0 && (
              <button
                type="button"
                onClick={() => setSidebarTab('people')}
                className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums ${EDU_ADMIN_TOKENS.badgeWarning}`}
              >
                ✋ {handRaisedAudience.length} شرکت‌کننده درخواست صحبت دارند
              </button>
            )}
          </div>
        </section>

        {/* Right Sidebar: Q&A Chat | Live Polls | Attendees & Form Answers */}
        <aside className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col overflow-hidden min-h-[440px] max-h-[calc(100vh-140px)]">
          <div className="p-2 bg-slate-950/70 border-b border-slate-800 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setSidebarTab('chat')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition ${
                sidebarTab === 'chat' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              💬 پرسش ({chatMessages.length})
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('polls')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition ${
                sidebarTab === 'polls' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 نظرسنجی ({polls.length})
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('people')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition ${
                sidebarTab === 'people' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 شرکت‌کنندگان ({allPeople.length})
            </button>
          </div>

          {/* TAB 1: Live Q&A Chat */}
          {sidebarTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {chatMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    هنوز پیامی ارسال نشده است. پرسش یا دیدگاه خود را در این بخش بنویسید.
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isSenderMgr = msg.senderRole === 'teacher' || msg.senderRole === 'admin'
                    return (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          isSenderMgr
                            ? 'bg-indigo-950/40 border-indigo-500/35'
                            : 'bg-slate-950/70 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>{isSenderMgr ? '👑' : '👤'}</span>
                            <span>{msg.senderName}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{msg.text}</p>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-800 bg-slate-950/70 flex gap-2">
                <input
                  type="text"
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  placeholder="پرسش یا پیام خود را بنویسید..."
                  className={EDU_ADMIN_TOKENS.inputClass}
                />
                <button type="submit" className={EDU_ADMIN_TOKENS.btnPrimary}>
                  ارسال
                </button>
              </form>
            </>
          )}

          {/* TAB 2: Live Interactive Polls (Managers Create/Close, Everyone Votes) */}
          {sidebarTab === 'polls' && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
              {isManager && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPollForm(v => !v)}
                    className={`w-full ${showPollForm ? EDU_ADMIN_TOKENS.btnGhost : EDU_ADMIN_TOKENS.btnPrimary}`}
                  >
                    {showPollForm ? '✕ بستن فرم ساخت نظرسنجی' : '➕ ایجاد نظرسنجی زنده جدید'}
                  </button>

                  {showPollForm && (
                    <form
                      onSubmit={handlePollSubmit}
                      className="p-3.5 rounded-2xl bg-slate-950/90 border border-indigo-500/40 space-y-3"
                    >
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">سوال نظرسنجی *</label>
                        <input
                          type="text"
                          value={pollQuestion}
                          onChange={e => setPollQuestion(e.target.value)}
                          placeholder="مثلاً: کیفیت مطالب سمینار تا این لحظه چطور بود؟"
                          className={EDU_ADMIN_TOKENS.inputClass}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-bold text-slate-300">گزینه‌ها (حداقل ۲ گزینه) *</label>
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={opt}
                              onChange={e =>
                                setPollOptions(prev => prev.map((v, i) => (i === idx ? e.target.value : v)))
                              }
                              placeholder={`گزینه ${idx + 1}`}
                              className={EDU_ADMIN_TOKENS.inputClass}
                            />
                            {pollOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPollOptions(prev => prev.filter((_, i) => i !== idx))
                                }
                                className="p-2 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 6 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions(prev => [...prev, ''])}
                            className={EDU_ADMIN_TOKENS.btnGhost}
                          >
                            + افزودن گزینه
                          </button>
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pollAllowMultiple}
                          onChange={e => setPollAllowMultiple(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>امکان انتخاب چند گزینه همزمان</span>
                      </label>

                      <button type="submit" className={`w-full ${EDU_ADMIN_TOKENS.btnSuccess}`}>
                        🚀 انتشار نظرسنجی برای همه
                      </button>
                    </form>
                  )}
                </div>
              )}

              {polls.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  {isManager
                    ? 'هنوز نظرسنجی ایجاد نکرده‌اید. با دکمه بالا اولین نظرسنجی را منتشر کنید.'
                    : 'در حال حاضر نظرسنجی فعالی توسط مدیر سمینار منتشر نشده است.'}
                </div>
              ) : (
                polls.map(poll => {
                  const totalVotesSum = poll.options.reduce((acc, o) => acc + o.votes, 0) || 1
                  return (
                    <div
                      key={poll.id}
                      className="p-3.5 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-white leading-relaxed">{poll.question}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                            ایجاد توسط {poll.createdByName} • {poll.totalVoters} رای ثبت‌شده
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            poll.isClosed ? EDU_ADMIN_TOKENS.badgeMuted : EDU_ADMIN_TOKENS.badgeSuccess
                          }`}
                        >
                          {poll.isClosed ? 'پایان یافته' : 'در حال رای‌گیری'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {poll.options.map(opt => {
                          const isSelected = poll.myOptionIds.includes(opt.id)
                          const pct = poll.totalVoters > 0 ? Math.round((opt.votes / totalVotesSum) * 100) : 0
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={poll.isClosed}
                              onClick={() => {
                                if (poll.isClosed) return
                                if (poll.allowMultiple) {
                                  const next = isSelected
                                    ? poll.myOptionIds.filter(id => id !== opt.id)
                                    : [...poll.myOptionIds, opt.id]
                                  if (next.length > 0) onVotePoll(poll.id, next)
                                } else {
                                  onVotePoll(poll.id, [opt.id])
                                }
                              }}
                              className={`w-full text-start p-2.5 rounded-xl border transition relative overflow-hidden ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-950/40'
                                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                              }`}
                            >
                              <div
                                className="absolute inset-y-0 start-0 bg-indigo-500/20 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative flex items-center justify-between gap-2">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <span>{isSelected ? '✓' : '○'}</span>
                                  <span>{opt.text}</span>
                                </span>
                                <span className="text-[11px] font-bold text-indigo-300 tabular-nums">
                                  {pct}% ({opt.votes})
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {isManager && !poll.isClosed && (
                        <button
                          type="button"
                          onClick={() => onClosePoll(poll.id)}
                          className={`w-full ${EDU_ADMIN_TOKENS.btnDanger}`}
                        >
                          ⏹️ بستن نظرسنجی
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 3: Attendees, Manager Promotion, Mic Grants & Pre-Entry Form Answers */}
          {sidebarTab === 'people' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
              {allPeople.map(p => {
                const isTargetPrimaryMgr = p.isTeacher || p.role === 'teacher' || p.role === 'admin'
                const isTargetMod = isTargetPrimaryMgr || !!p.isModerator
                const matchedFormRow = isManager ? findFormAnswersForParticipant(p) : null
                const formEntries = matchedFormRow?.formAnswers
                  ? Object.entries(matchedFormRow.formAnswers)
                  : []
                const isExpanded = expandedAttendeeId === p.peerId

                return (
                  <div
                    key={p.peerId}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{isTargetMod ? '👑' : p.handRaised ? '✋' : '👤'}</span>
                          <span className="truncate">{p.name}</span>
                          {self?.peerId === p.peerId && (
                            <span className="text-[10px] text-cyan-400">(شما)</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isTargetPrimaryMgr
                            ? 'مدیر اصلی سمینار'
                            : p.isModerator
                            ? 'مدیر سمینار (ارتقایافته)'
                            : p.isSpeaker
                            ? 'سخنران میهمان'
                            : p.handRaised
                            ? 'متقاضی صحبت'
                            : 'شرکت‌کننده'}
                        </div>
                      </div>

                      {isManager && formEntries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedAttendeeId(isExpanded ? null : p.peerId)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeInfo}`}
                        >
                          {isExpanded ? 'بستن فرم' : '📋 مشاهده فرم'}
                        </button>
                      )}
                    </div>

                    {/* Manager Controls on Other Participants */}
                    {isManager && self?.peerId !== p.peerId && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/70">
                        {p.isSpeaker ? (
                          <button
                            type="button"
                            onClick={() => onRevokeSpeaker(p.peerId)}
                            className="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 text-[10px] font-bold"
                          >
                            🔇 بستن میکروفون
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onGrantSpeaker(p.peerId)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              p.handRaised
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            🎙️ اجازه صحبت
                          </button>
                        )}

                        {!isTargetPrimaryMgr &&
                          (p.isModerator ? (
                            <button
                              type="button"
                              onClick={() => onRevokeModerator(p.peerId)}
                              className="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 text-[10px] font-bold"
                            >
                              ⬇️ لغو مدیریت
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onGrantModerator(p.peerId)}
                              className="px-2 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[10px] font-bold transition"
                            >
                              👑 مدیر کردن
                            </button>
                          ))}

                        {!isTargetPrimaryMgr && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`آیا از اخراج «${p.name}» اطمینان دارید؟`)) {
                                onRemoveParticipant(p.peerId)
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-bold transition"
                          >
                            🚫 اخراج
                          </button>
                        )}
                      </div>
                    )}

                    {/* Dynamic Pre-Entry Form Answers (Visible to Managers Only) */}
                    {isManager && isExpanded && formEntries.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                        {formEntries.map(([fieldId, value]) => (
                          <div key={fieldId} className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">
                              {fieldLabelById.get(fieldId) || fieldId}:
                            </span>
                            <span className="font-bold text-slate-100">
                              {typeof value === 'boolean' ? (value ? 'بله' : 'خیر') : String(value || '—')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Departed / Registered Form Submissions (Managers Only) */}
              {isManager && offlineRegisteredAttendees.length > 0 && (
                <div className="pt-2 space-y-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">
                    ثبت‌نامی‌های خارج‌شده / آفلاین ({offlineRegisteredAttendees.length})
                  </div>
                  {offlineRegisteredAttendees.map(att => (
                    <div
                      key={att.attendeeKey}
                      className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">{att.displayName}</span>
                        <span className="text-slate-500 tabular-nums">
                          {att.joinCount} بار ورود
                        </span>
                      </div>
                      {att.formAnswers && Object.keys(att.formAnswers).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(att.formAnswers).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                            >
                              {fieldLabelById.get(k) || k}: {typeof v === 'boolean' ? (v ? 'بله' : 'خیر') : String(v || '—')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
