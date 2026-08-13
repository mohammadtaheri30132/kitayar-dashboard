import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../store/authStore'

type PageId = 'dashboard' | 'questions' | 'create-question' | 'edit-question' | 'import-json' | 'lesson-questions' | 'question-detail' | 'settings'

interface Props {
  children: ReactNode
  activePage?: PageId
  onNavigate?: (page: PageId) => void
  onBack?: () => void
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'داشبورد',
  questions: 'بانک سوالات',
  'create-question': 'ایجاد سوال جدید',
  'edit-question': 'ویرایش سوال',
  'import-json': 'import JSON',
  'lesson-questions': 'سوالات درس',
  'question-detail': 'جزئیات سوال',
  settings: 'تنظیمات',
}

const AppShell = ({ children, activePage = 'dashboard', onNavigate, onBack }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuthStore()

  const pageTitle = PAGE_TITLES[activePage] || 'داشبورد'
  const showBackButton = activePage !== 'dashboard' && activePage !== 'questions' && activePage !== 'settings'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100" dir="rtl">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-800 border-l border-gray-700/20 shrink-0`}>
        <div className="w-64">
          <Sidebar onClose={() => setSidebarOpen(false)} activePage={activePage} onNavigate={onNavigate} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            {showBackButton && onBack && (
              <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600" title="بازگشت">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-800">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.fullName}</span>
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.fullName?.charAt(0) || 'ا'}
            </div>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition-colors mr-1" title="خروج">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 w-full">{children}</div>
        </div>
      </main>
    </div>
  )
}

export default AppShell
