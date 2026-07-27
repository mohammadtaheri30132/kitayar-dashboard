import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import AppShell from './layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import QuestionsListPage from './pages/QuestionsListPage'
import LessonQuestionsPage from './pages/LessonQuestionsPage'
import QuestionFormPage from './pages/QuestionFormPage'
import ImportJsonPage from './pages/ImportJsonPage'
import SettingsPage from './pages/SettingsPage'
import TypeSelectLanding from './pages/TypeSelectLanding'
import { useAuthStore } from './store/authStore'
import { useQuestionStore } from './store/useQuestionStore'
import type { QuestionData } from './services/questionService'
import './App.css'

type PageId = 'dashboard' | 'questions' | 'create-question' | 'edit-question' | 'import-json' | 'lesson-questions' | 'settings'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const [breadcrumb, setBreadcrumb] = useState<any>({})
  const [editQuestion, setEditQuestion] = useState<QuestionData | null>(null)
  const type = useQuestionStore((s) => s.draft.type)

  useEffect(() => { checkAuth() }, [])

  if (!isAuthenticated) {
    return <><Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} /><LoginPage /></>
  }

  const handleEditQuestion = (q: QuestionData) => {
    setEditQuestion(q)
    setCurrentPage('edit-question')
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />
      case 'questions':
        return <QuestionsListPage
          onLessonClick={(c, g, s, bid) => { setBreadcrumb({ courseName: c, gradeName: g, subjectName: s, bookId: bid }); setCurrentPage('lesson-questions') }}
          onCreateQuestion={() => { setEditQuestion(null); setCurrentPage('create-question') }}
          onImportJson={() => setCurrentPage('import-json')}
        />
      case 'lesson-questions':
        return <LessonQuestionsPage {...breadcrumb}
          onBack={() => setCurrentPage('questions')}
          onCreateQuestion={() => { setEditQuestion(null); setCurrentPage('create-question') }}
          onEditQuestion={handleEditQuestion}
        />
      case 'create-question':
        return type || editQuestion ? (
          <QuestionFormPage onBack={() => setCurrentPage('questions')} editQuestion={editQuestion} onSaved={() => setCurrentPage('lesson-questions')} />
        ) : <TypeSelectLanding />
      case 'edit-question':
        return <QuestionFormPage onBack={() => setCurrentPage('lesson-questions')} editQuestion={editQuestion} onSaved={() => { setEditQuestion(null); setCurrentPage('lesson-questions') }} />
      case 'import-json': return <ImportJsonPage onBack={() => setCurrentPage('questions')} />
      case 'settings': return <SettingsPage />
      default: return <DashboardPage />
    }
  }

  return (
    <><Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
      <AppShell activePage={currentPage} onNavigate={(p: PageId) => { setCurrentPage(p); if (p !== 'edit-question') setEditQuestion(null) }}>
        {renderContent()}
      </AppShell>
    </>
  )
}

export default App
