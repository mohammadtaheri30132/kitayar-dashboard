import React from 'react'

interface AudioControlBarProps {
  isMicEnabled: boolean
  isMicBlocked: boolean
  isCameraEnabled: boolean
  isScreenSharing: boolean
  isTeacher: boolean
  unreadChatCount: number
  participantCount: number
  isChatOpen: boolean
  isParticipantsOpen: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onSwitchCamera: () => void
  onToggleScreenShare: () => void
  onOpenFilePicker: () => void
  onToggleChat: () => void
  onToggleParticipants: () => void
  onLeave: () => void
}

export const AudioControlBar: React.FC<AudioControlBarProps> = ({
  isMicEnabled,
  isMicBlocked,
  isCameraEnabled,
  isScreenSharing,
  isTeacher,
  unreadChatCount,
  participantCount,
  isChatOpen,
  isParticipantsOpen,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onToggleScreenShare,
  onOpenFilePicker,
  onToggleChat,
  onToggleParticipants,
  onLeave,
}) => {
  const isMobileWeb =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    typeof window !== 'undefined' &&
    !(window as any).ReactNativeWebView &&
    !window.location.search.includes('platform=app')

  return (
    <footer className="h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 sm:px-6 flex items-center justify-center z-30 shrink-0">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 max-w-full overflow-x-auto no-scrollbar py-1">
        {/* 1. Microphone Button */}
        <button
          type="button"
          onClick={onToggleMic}
          disabled={isMicBlocked}
          className={`h-11 px-3 sm:px-4 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isMicBlocked
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isMicEnabled
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25'
              : 'bg-red-600/90 hover:bg-red-500 text-white'
          }`}
          title={isMicBlocked ? 'میکروفون قفل است' : isMicEnabled ? 'قطع میکروفون' : 'وصل میکروفون'}
        >
          {isMicEnabled ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
              <path d="M5 10v2a7 7 0 0 0 12 5" />
              <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
            </svg>
          )}
          <span className="hidden md:inline">{isMicEnabled ? 'صدا وصل' : 'بی‌صدا'}</span>
        </button>

        {/* 2. Camera Button */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`h-11 px-3 sm:px-4 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isCameraEnabled
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={isCameraEnabled ? 'خاموش کردن دوربین' : 'روشن کردن دوربین'}
        >
          {isCameraEnabled ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m22 8-6 4 6 4V8Z" />
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8" />
              <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          )}
          <span className="hidden md:inline">{isCameraEnabled ? 'دوربین روشن' : 'دوربین'}</span>
        </button>

        {/* 3. Flip Camera (Front/Rear) Button - Shown when camera is active */}
        {isCameraEnabled && (
          <button
            type="button"
            onClick={onSwitchCamera}
            className="h-11 w-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="چرخش دوربین (جلو / عقب)"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
              <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
              <circle cx="12" cy="12" r="3" />
              <path d="m18 22-3-3 3-3" />
              <path d="m6 2 3 3-3 3" />
            </svg>
          </button>
        )}

        {/* 4. Screen Share Button (Shown on Desktop & Mobile Apps, hidden on Mobile Web) */}
        {!isMobileWeb && (
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`h-11 px-3 sm:px-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isScreenSharing
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title={isScreenSharing ? 'توقف اشتراک صفحه نمایش' : 'اشتراک‌گذاری صفحه نمایش'}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <line x1="8" x2="16" y1="21" y2="21" />
              <line x1="12" x2="12" y1="17" y2="21" />
              <path d="m9 10 3-3 3 3" />
              <line x1="12" x2="12" y1="7" y2="14" />
            </svg>
            <span className="hidden lg:inline">
              {isScreenSharing ? 'توقف اشتراک' : 'اشتراک صفحه'}
            </span>
          </button>
        )}

        {/* 5. Upload PDF / File to Whiteboard (Teacher quick button) */}
        {isTeacher && (
          <button
            type="button"
            onClick={onOpenFilePicker}
            className="h-11 px-3 sm:px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="بارگذاری فایل PDF یا تصویر روی تخته"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="m9 15 3-3 3 3" />
            </svg>
            <span className="hidden lg:inline">ارائه PDF</span>
          </button>
        )}

        {/* 6. Live Chat Toggle Button with Unread Badge */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`relative h-11 px-3 sm:px-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isChatOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title="گفتگوی متنی کلاس"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="hidden lg:inline">گفتگو</span>
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* 7. Participants Drawer Toggle Button */}
        <button
          type="button"
          onClick={onToggleParticipants}
          className={`relative h-11 px-3 sm:px-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isParticipantsOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title="لیست شرکت‌کنندگان"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-[11px] font-bold">{participantCount}</span>
        </button>

        {/* 8. Leave Button */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('آیا قصد خروج از کلاس را دارید؟')) {
              onLeave()
            }
          }}
          className="h-11 px-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md shadow-red-600/20"
          title="خروج از کلاس"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </footer>
  )
}
