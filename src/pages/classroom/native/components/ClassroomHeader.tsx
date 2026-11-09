import React, { useState } from 'react'
import type { ClassroomLayoutMode, WhiteboardGridMode } from '../../../../services/nativeWebrtc/types'

interface ClassroomHeaderProps {
  title: string
  teacherName?: string
  participantCount: number
  isConnected: boolean
  isTeacher: boolean
  layoutMode: ClassroomLayoutMode
  gridMode: WhiteboardGridMode
  allowStudentDraw: boolean
  hasBackgroundSlide: boolean
  diagnosticCount: number
  onChangeLayout: (mode: ClassroomLayoutMode) => void
  onChangeGridMode: (mode: WhiteboardGridMode) => void
  onToggleStudentDraw: () => void
  onUploadFile: () => void
  onClearPage: () => void
  onClearBackground: () => void
  onOpenDiagnostics: () => void
  onEndRoom?: () => void
  onLeave: () => void
}

const LAYOUT_OPTIONS: { id: ClassroomLayoutMode; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'teaching',
    label: 'حالت تدریس (تخته + تصویر)',
    desc: 'تخته هوشمند به همراه نوار تصویر مدرس و دانش‌آموزان',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    ),
  },
  {
    id: 'speaker',
    label: 'فوکوس مدرس / اشتراک صفحه',
    desc: 'تصویر بزرگ مدرس یا صفحه نمایش در مرکز',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
  },
  {
    id: 'grid',
    label: 'شبکه ویدیویی (Grid)',
    desc: 'نمایش شبکه‌ای تصاویر تمام اعضای حاضر در کلاس',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'board',
    label: 'تخته تمام‌صفحه',
    desc: 'حداکثر فضای نوشتن روی تخته هوشمند',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
    ),
  },
]

export const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
  title,
  participantCount,
  isConnected,
  isTeacher,
  layoutMode,
  gridMode,
  allowStudentDraw,
  hasBackgroundSlide,
  diagnosticCount,
  onChangeLayout,
  onChangeGridMode,
  onToggleStudentDraw,
  onUploadFile,
  onClearPage,
  onClearBackground,
  onOpenDiagnostics,
  onEndRoom,
  onLeave,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false)

  return (
    <header className="relative h-13 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-2 z-30 shrink-0 text-white select-none">
      {/* Right Section: Hamburger Menu + Title + Status */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => {
            setMenuOpen(v => !v)
            setLayoutDropdownOpen(false)
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            menuOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="منوی امکانات و تنظیمات کلاس"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
              {title || 'کلاس آنلاین کیتایار'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{isTeacher ? '🎓 مدرس کلاس' : '👨‍🎓 دانش‌آموز'}</span>
            <span>•</span>
            <span>{participantCount} نفر حاضر</span>
          </div>
        </div>
      </div>

      {/* Left Section: Quick Layout Grid Switcher Icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Desktop Direct Layout Pills */}
        <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 gap-1">
          {LAYOUT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeLayout(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                layoutMode === opt.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title={opt.desc}
            >
              {opt.icon}
              <span>{opt.label.split(' ')[0] + ' ' + (opt.label.split(' ')[1] || '')}</span>
            </button>
          ))}
        </div>

        {/* Mobile Layout Grid Icon Button */}
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => {
              setLayoutDropdownOpen(v => !v)
              setMenuOpen(false)
            }}
            className="h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="تغییر چیدمان صفحه (Grid)"
          >
            {LAYOUT_OPTIONS.find(o => o.id === layoutMode)?.icon}
            <span className="text-[11px]">چیدمان</span>
          </button>

          {layoutDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setLayoutDropdownOpen(false)}
              />
              <div className="absolute left-0 top-11 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400">
                  انتخاب نحوه نمایش کلاس:
                </div>
                {LAYOUT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChangeLayout(opt.id)
                      setLayoutDropdownOpen(false)
                    }}
                    className={`w-full p-2.5 rounded-xl text-right flex items-center gap-2.5 transition-colors cursor-pointer ${
                      layoutMode === opt.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="shrink-0">{opt.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[10px] opacity-75 truncate">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hamburger Slide-Down / Popover Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-12 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200">⚙️ امکانات و تنظیمات کلاس</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isTeacher && (
              <>
                <div className="text-[10px] font-bold text-slate-400 px-1">امکانات تخته و فایل مدرس:</div>

                {/* Upload PDF / Image */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onUploadFile()
                  }}
                  className="w-full p-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>📄 بارگذاری PDF یا تصویر روی تخته</span>
                  <span>+</span>
                </button>

                {/* Student Draw Permission */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleStudentDraw()
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 flex items-center justify-between cursor-pointer"
                >
                  <span>✏️ اجازه نوشتن به دانش‌آموزان</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      allowStudentDraw ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {allowStudentDraw ? 'فعال 🔓' : 'غیرفعال 🔒'}
                  </span>
                </button>

                {/* Whiteboard Grid Mode Selector */}
                <div className="p-2 rounded-xl bg-slate-800 flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-300 font-bold">نوع کاغذ تخته:</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'grid', label: 'شطرنجی' },
                      { id: 'lined', label: 'خط‌دار' },
                      { id: 'dots', label: 'نقطه‌ای' },
                      { id: 'blank', label: 'ساده' },
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onChangeGridMode(g.id as WhiteboardGridMode)}
                        className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          gridMode === g.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Page Drawings */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onClearPage()
                    }}
                    className="flex-1 p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-red-300 font-bold text-center cursor-pointer border border-slate-700"
                  >
                    🗑️ پاک کردن خطوط صفحه
                  </button>
                  {hasBackgroundSlide && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        onClearBackground()
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-amber-950/60 text-amber-300 font-bold cursor-pointer border border-slate-700"
                      title="حذف فایل پس‌زمینه این صفحه"
                    >
                      حذف اسلاید
                    </button>
                  )}
                </div>
              </>
            )}

            <div className="border-t border-slate-800 pt-2 flex flex-col gap-1.5">
              {/* Diagnostics Logs */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onOpenDiagnostics()
                }}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-between cursor-pointer"
              >
                <span>🛠️ وضعیت شبکه و لاگ‌های فنی</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px]">
                  {diagnosticCount}
                </span>
              </button>

              {/* Teacher End Room */}
              {isTeacher && onEndRoom && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    if (window.confirm('آیا از پایان رسمی کلاس برای همه دانش‌آموزان اطمینان دارید؟')) {
                      onEndRoom()
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-bold text-center cursor-pointer"
                >
                  🛑 اتمام رسمی کلاس برای همه
                </button>
              )}

              {/* Leave */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  if (window.confirm('آیا قصد خروج از کلاس را دارید؟')) {
                    onLeave()
                  }
                }}
                className="w-full p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-center cursor-pointer"
              >
                خروج از کلاس
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
