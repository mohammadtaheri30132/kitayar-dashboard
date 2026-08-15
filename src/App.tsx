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
import QuestionBuilderPage from './pages/QuestionBuilderPage'
import { useAuthStore } from './store/authStore'
import { useQuestionStore } from './store/useQuestionStore'
import type { QuestionData } from './services/questionService'
import './App.css'

type PageId = 'dashboard' | 'questions' | 'create-question' | 'edit-question' | 'import-json' | 'lesson-questions' | 'settings' | 'question-builder'

interface BreadcrumbState {
  courseId?: string; courseName?: string
  fieldId?: string; fieldName?: string
  gradeId?: string; gradeName?: string
  bookId?: string; subjectName?: string
}

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbState>({})
  const [editQuestion, setEditQuestion] = useState<QuestionData | null>(null)
  const { resetDraft } = useQuestionStore()

  useEffect(() => { checkAuth() }, [])

  if (!isAuthenticated) {
    return <><Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} /><LoginPage /></>
  }

  const handleLessonClick = (
    courseId: string, courseName: string,
    fieldId: string, fieldName: string,
    gradeId: string, gradeName: string,
    bookId: string, subjectName: string
  ) => {
    setBreadcrumb({ courseId, courseName, fieldId, fieldName, gradeId, gradeName, bookId, subjectName })
    setCurrentPage('lesson-questions')
  }

  const handleEditQuestion = (q: QuestionData) => {
    setEditQuestion(q)
    setCurrentPage('edit-question')
  }

  const handleCreateQuestion = () => {
    setEditQuestion(null)
    setCurrentPage('create-question')
  }

  const handleSavedQuestion = () => {
    setEditQuestion(null)
    if (breadcrumb.bookId) setCurrentPage('lesson-questions')
    else setCurrentPage('questions')
  }

  const handleCancelQuestion = () => {
    resetDraft()
    setEditQuestion(null)
    if (breadcrumb.bookId) setCurrentPage('lesson-questions')
    else setCurrentPage('questions')
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />
      case 'questions':
        return <QuestionsListPage
          onLessonClick={handleLessonClick}
          onCreateQuestion={handleCreateQuestion}
          onImportJson={() => setCurrentPage('import-json')}
        />
      case 'lesson-questions':
        return <LessonQuestionsPage
          {...breadcrumb}
          onBack={() => setCurrentPage('questions')}
          onCreateQuestion={handleCreateQuestion}
          onEditQuestion={handleEditQuestion}
        />
      case 'create-question':
        return (
          <QuestionFormPage
            key={`create-${breadcrumb.bookId || 'default'}`}
            onBack={handleCancelQuestion}
            onSaved={handleSavedQuestion}
            editQuestion={null}
            defaultCourseId={breadcrumb.courseId}
            defaultFieldId={breadcrumb.fieldId}
            defaultGradeId={breadcrumb.gradeId}
            defaultBookId={breadcrumb.bookId}
          />
        )
      case 'edit-question':
        return (
          <QuestionFormPage
            onBack={handleCancelQuestion}
            editQuestion={editQuestion}
            onSaved={handleSavedQuestion}
          />
        )
      case 'import-json':
        return <ImportJsonPage onBack={() => setCurrentPage('questions')} />
      case 'question-builder':
        return <QuestionBuilderPage onBack={() => setCurrentPage('dashboard')} />
      case 'settings': return <SettingsPage />
      default: return <DashboardPage />
    }
  }

  return (
    <><Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
      <AppShell activePage={currentPage} onNavigate={(p: PageId) => {
        if (p === 'create-question') handleCreateQuestion()
        else setCurrentPage(p)
      }}>
        {renderContent()}
      </AppShell>
    </>
  )
}

export default App
