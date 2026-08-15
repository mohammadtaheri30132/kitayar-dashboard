import { useState } from 'react'
import { useQuestionStore } from '../store/useQuestionStore'
import { useAuthStore } from '../store/authStore'
import { ALL_TYPES, TYPE_LABELS } from '../types/question'

interface Props {
  onClose: () => void
  activePage?: string
  onNavigate?: (page: any) => void
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'داشبورد', icon: '📊' },
  { id: 'questions', label: 'سوالات', icon: '📝' },
  { id: 'question-builder', label: 'سوال ساز', icon: '📄' },
  { id: 'settings', label: 'تنظیمات', icon: '⚙️' },
]

const Sidebar = ({ onClose, activePage = 'dashboard', onNavigate }: Props) => {
  const activeType = useQuestionStore((s) => s.draft.type)
  const setType = useQuestionStore((s) => s.setType)
  const resetDraft = useQuestionStore((s) => s.resetDraft)
  const { user, logout } = useAuthStore()
  const [showTypes, setShowTypes] = useState(false)

  const handleCreateQuestion = () => {
    resetDraft()
    onNavigate?.('create-question')
  }

  const handleNavClick = (pageId: string) => {
    onNavigate?.(pageId)
    if (pageId === 'questions') setShowTypes(false)
  }

  return (
    <nav className="h-full flex flex-col text-gray-200">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700/30 shrink-0">
        <span className="font-bold text-white text-lg">QuestionCMS</span>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-700/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.fullName?.charAt(0) || 'ا'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400">{user?.role === 'admin' ? 'مدیر' : 'معلم'}</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right
              ${activePage === item.id || (item.id === 'questions' && ['lesson-questions', 'question-detail', 'import-json', 'edit-question'].includes(activePage))
                ? 'bg-primary-500/20 text-primary-300'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/40'}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={handleCreateQuestion}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors text-right"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>افزودن سوال جدید</span>
        </button>
      </div>

      <div className="px-4 py-2"><div className="border-t border-gray-700/30" /></div>

      <div className="px-4 py-2">
        <button
          type="button"
          onClick={() => setShowTypes(!showTypes)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300"
        >
          <span>انواع سوال</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showTypes ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {showTypes && (
        <div className="px-3 flex-1 overflow-y-auto space-y-1">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); handleNavClick('create-question') }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-right
                ${activeType === t ? 'bg-primary-500/20 text-primary-300' : 'text-gray-300 hover:text-white hover:bg-gray-700/40'}`}
            >
              <span>{t === 'تستی' ? '🔘' : t === 'جاخالی' ? '📝' : t === 'صحیح-غلط' ? '✅' : t === 'کوتاه-پاسخ' ? '✍️' : t === 'گسترده-پاسخ' ? '📄' : '🔗'}</span>
              <span>{TYPE_LABELS[t]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="px-3 py-3 border-t border-gray-700/30 shrink-0 mt-auto">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-right"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>خروج</span>
        </button>
        <p className="text-xs text-gray-600 text-center mt-2">نسخه 1.0.0</p>
      </div>
    </nav>
  )
}

export default Sidebar
