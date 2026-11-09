import React, { useEffect, useRef } from 'react'
import type { INativeParticipant } from '../../../../services/nativeWebrtc/types'

interface ParticipantCardProps {
  participant: INativeParticipant
  isSelf: boolean
  isTeacherViewer: boolean
  videoStream?: MediaStream | null
  compact?: boolean
  cameraFacingMode?: 'user' | 'environment'
  onToggleBlockMic?: (peerId: string, currentBlocked: boolean) => void
  onRemoveParticipant?: (peerId: string) => void
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isSelf,
  isTeacherViewer,
  videoStream,
  compact = false,
  cameraFacingMode = 'user',
  onToggleBlockMic,
  onRemoveParticipant,
}) => {
  const isTeacher = participant.role === 'teacher' || participant.isTeacher
  const isMicEnabled = participant.micState === 'enabled'
  const isMicBlocked = participant.micState === 'blocked'
  const isScreenShare = !!participant.screenShareEnabled
  const hasVideo = !!videoStream && videoStream.getVideoTracks().length > 0
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (videoStream && hasVideo) {
      if (el.srcObject !== videoStream) {
        el.srcObject = videoStream
      }
      el.play().catch(() => {})
    } else {
      el.srcObject = null
    }
  }, [videoStream, hasVideo])

  const shouldMirror = isSelf && !isScreenShare && cameraFacingMode === 'user'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all select-none ${
        compact ? 'h-20 w-32 sm:h-24 sm:w-40 shrink-0' : 'w-full h-full min-h-[140px]'
      } ${
        isMicEnabled
          ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* Video Stream or Centered Avatar */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${
            isScreenShare ? 'object-contain bg-black' : 'object-cover'
          } ${shouldMirror ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 p-2">
          <div
            className={`${
              compact ? 'w-9 h-9 text-sm' : 'w-14 h-14 text-xl'
            } rounded-full flex items-center justify-center font-bold shadow-md ${
              isTeacher
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white ring-2 ring-blue-400/40'
                : isMicEnabled
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white ring-2 ring-emerald-400/40'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {participant.name ? participant.name.trim()[0] : 'ک'}
          </div>
          {!compact && (
            <span className="mt-2 text-xs font-bold text-slate-300 truncate max-w-[90%]">
              {participant.name || 'کاربر'}
            </span>
          )}
        </div>
      )}

      {/* Top Overlay: Role Badge & Teacher Quick Moderation Icons */}
      <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between gap-1 pointer-events-none">
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md flex items-center gap-1 ${
            isScreenShare
              ? 'bg-purple-600/90 text-white'
              : isTeacher
              ? 'bg-blue-600/85 text-white'
              : 'bg-slate-950/70 text-slate-200'
          }`}
        >
          <span>{isScreenShare ? '🖥️' : isTeacher ? '🎓' : '👨‍🎓'}</span>
          {!compact && <span>{isScreenShare ? 'صفحه نمایش' : isTeacher ? 'معلم' : 'دانش‌آموز'}</span>}
        </span>

        {/* Teacher quick action icons on students */}
        {isTeacherViewer && !isTeacher && !isSelf && (
          <div className="flex items-center gap-1 pointer-events-auto">
            {onToggleBlockMic && (
              <button
                type="button"
                onClick={() => onToggleBlockMic(participant.peerId, isMicBlocked)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] backdrop-blur-md cursor-pointer transition-colors ${
                  isMicBlocked
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900/80 text-slate-200 hover:bg-amber-600'
                }`}
                title={isMicBlocked ? 'رفع قفل میکروفون' : 'قفل کردن میکروفون'}
              >
                {isMicBlocked ? '🔓' : '🔇'}
              </button>
            )}
            {onRemoveParticipant && !compact && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`آیا از اخراج ${participant.name} اطمینان دارید؟`)) {
                    onRemoveParticipant(participant.peerId)
                  }
                }}
                className="w-6 h-6 rounded-lg bg-red-600/85 hover:bg-red-600 text-white flex items-center justify-center text-[11px] backdrop-blur-md cursor-pointer"
                title="اخراج از کلاس"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Overlay: Name & Live Mic Status */}
      <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-slate-950/75 backdrop-blur-xs text-white">
        <span className="text-[10px] sm:text-xs font-bold truncate">
          {participant.name || 'کاربر'} {isSelf ? '(شما)' : ''}
        </span>

        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            isMicBlocked
              ? 'bg-red-600 text-white'
              : isMicEnabled
              ? 'bg-emerald-500 text-white animate-pulse'
              : 'bg-slate-800 text-slate-400'
          }`}
          title={isMicBlocked ? 'میکروفون قفل' : isMicEnabled ? 'میکروفون روشن' : 'بی‌صدا'}
        >
          {isMicBlocked ? (
            <span className="text-[10px]">🔒</span>
          ) : isMicEnabled ? (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
              <path d="M5 10v2a7 7 0 0 0 12 5" />
            </svg>
          )}
        </span>
      </div>
    </div>
  )
}
