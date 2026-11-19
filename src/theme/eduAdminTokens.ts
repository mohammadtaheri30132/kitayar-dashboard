export const EDU_ADMIN_TOKENS = {
  surfaceCard: 'bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg',
  surfaceSubCard: 'bg-slate-950/70 border border-slate-800/80 rounded-xl',
  inputClass:
    'w-full bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition active:scale-[0.98] disabled:opacity-50',
  btnSuccess:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50',
  btnDanger:
    'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition disabled:opacity-50',
  btnGhost:
    'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-semibold transition disabled:opacity-50',
  badgeSuccess: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  badgeWarning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  badgeInfo: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  badgePurple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  badgeMuted: 'bg-slate-800 text-slate-400 border border-slate-700',
}

export const CLASSROOM_RECORDING_THEME = {
  fontSans: 'font-sans',
  canvasFont: '14px sans-serif',
  canvasTitleFont: 'bold 16px sans-serif',
  canvasSubFont: '12px sans-serif',
  canvasBgColor: 'rgb(15, 23, 42)',
  canvasHeaderBg: 'rgb(30, 41, 59)',
  canvasBoardBg: 'rgb(255, 255, 255)',
  canvasBoardGrid: 'rgba(148, 163, 184, 0.22)',
  canvasTextLight: 'rgb(248, 250, 252)',
  canvasTextMuted: 'rgb(148, 163, 184)',
  canvasAccentRed: 'rgb(239, 68, 68)',
  canvasAccentEmerald: 'rgb(16, 185, 129)',
  canvasAccentViolet: 'rgb(124, 58, 237)',
  canvasDefaultPen: 'rgb(30, 41, 59)',
  modalOverlay: 'fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4',
  modalContainer:
    'w-full max-w-7xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100',
  headerBar:
    'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/90 border-b border-slate-800',
  podCard: 'bg-slate-950/80 border border-slate-800/90 rounded-2xl flex flex-col overflow-hidden',
  podHeader:
    'px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200',
  activeLogRow: 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm',
  inactiveLogRow: 'bg-slate-900/50 border-slate-800/70 text-slate-300 hover:bg-slate-800/60',
  liveRecBadge:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold tabular-nums',
  testRecStartBtn:
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition active:scale-95',
  testRecStopBtn:
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/25 transition active:scale-95',
}

export const SEMINAR_UI_TOKENS = {
  shellBg: 'min-h-screen bg-slate-950 text-slate-100 flex flex-col',
  topBar:
    'flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-900/95 border-b border-slate-800/90 backdrop-blur-md',
  liveBroadcastBadge:
    'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold tabular-nums',
  stageFrame:
    'relative w-full h-full min-h-[340px] sm:min-h-[460px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col',
  stageHeaderOverlay:
    'flex items-center justify-between px-4 py-2.5 bg-slate-950/85 border-b border-slate-800/80 text-xs',
  speakerTileActive:
    'rounded-xl bg-slate-900/95 border-2 border-indigo-500/70 shadow-lg shadow-indigo-500/10 overflow-hidden',
  audiencePill:
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/70 text-slate-200 text-xs font-semibold tabular-nums',
  raiseHandBtnIdle:
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-bold transition active:scale-95',
  raiseHandBtnActive:
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 transition active:scale-95',
  modeCardActive:
    'p-3.5 rounded-xl bg-indigo-600/20 border-2 border-indigo-500 text-start transition shadow-md',
  modeCardIdle:
    'p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-start transition',
  formGateCard:
    'w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-100',
  telemetryCard:
    'p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex flex-col gap-1.5',
  telemetryBarFill: 'bg-gradient-to-l from-indigo-500 to-cyan-400 rounded-t-md transition-all',
  healthHealthy: 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300',
  healthElevated: 'bg-amber-500/15 border border-amber-500/35 text-amber-300',
  healthCritical: 'bg-rose-500/15 border border-rose-500/35 text-rose-300',
}

