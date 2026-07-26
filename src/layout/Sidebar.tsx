import { useQuestionStore } from '../store/useQuestionStore'
import { ALL_TYPES, TYPE_LABELS } from '../types/question'

interface Props {
  onClose: () => void
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'داشبورد', icon: '📊' },
  { id: 'questions', label: 'سوالات', icon: '📝' },
  { id: 'settings', label: 'تنظیمات', icon: '⚙️' },
] as const

const Sidebar = ({ onClose }: Props) => {
  const activeType = useQuestionStore((s) => s.draft.type)
  const setType = useQuestionStore((s) => s.setType)
  const resetDraft = useQuestionStore((s) => s.resetDraft)

  return (
    <nav className="h-full flex flex-col text-gray-200">
      {/* لوگو و عنوان */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700/30 shrink-0">
        <span className="font-bold text-white text-lg">QuestionCMS</span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
          title="بستن منو"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* منوهای اصلی */}
      <div className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-gray-300 hover:text-white hover:bg-gray-700/40 transition-colors text-right"
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* جداکننده */}
      <div className="px-4 py-2">
        <div className="border-t border-gray-700/30" />
      </div>

      {/* عنوان بخش انواع سوال */}
      <div className="px-4 py-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          انواع سوال
        </span>
      </div>

      {/* لیست انواع سوال */}
      <div className="px-3 flex-1 overflow-y-auto space-y-1">
        <button
          type="button"
          onClick={resetDraft}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right
            ${!activeType ? 'bg-primary-500/20 text-primary-300' : 'text-gray-300 hover:text-white hover:bg-gray-700/40'}`}
        >
          <span className="text-lg">🏠</span>
          <span>خانه (انتخاب نوع)</span>
        </button>

        {ALL_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right
              ${activeType === t ? 'bg-primary-500/20 text-primary-300' : 'text-gray-300 hover:text-white hover:bg-gray-700/40'}`}
          >
            <span className="text-base">
              {t === 'تستی' ? '🔘' :
               t === 'جاخالی' ? '📝' :
               t === 'صحیح-غلط' ? '✅' :
               t === 'کوتاه-پاسخ' ? '✍️' :
               t === 'گسترده-پاسخ' ? '📄' :
               '🔗'}
            </span>
            <span>{TYPE_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* فوتر سایدبار */}
      <div className="px-4 py-3 border-t border-gray-700/30 shrink-0">
        <span className="text-xs text-gray-500">نسخه 1.0.0</span>
      </div>
    </nav>
  )
}

export default Sidebar