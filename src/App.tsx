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
import AnnouncementsPage from './pages/AnnouncementsPage'
import SystemEventsPage from './pages/SystemEventsPage'
import CommunityManagementPage from './pages/CommunityManagementPage'
import QuizManagementPage from './pages/QuizManagementPage'
import MusicManagementPage from './pages/MusicManagementPage'
import { PhonebookManagementPage } from './pages/PhonebookManagementPage'
import NotificationsManagementPage from './pages/NotificationsManagementPage'
import { SupportManagementPage } from './pages/SupportManagementPage'
import KitayarClassesPage from './pages/kitayar/KitayarClassesPage'
import KitayarTeachersPage from './pages/kitayar/KitayarTeachersPage'
import KitayarStudentsPage from './pages/kitayar/KitayarStudentsPage'
import WalletManagementPage from './pages/WalletManagementPage'
import AdminClassroomMonitoringPage from './pages/classroom/AdminClassroomMonitoringPage'
import PlugNmeetClassroomPage from './pages/classroom/PlugNmeetClassroomPage'
import { NativeClassroomPage } from './pages/classroom/native/NativeClassroomPage'
import MobilePreviewPage from './pages/MobilePreviewPage'
import PortalSelectorPage from './pages/portal/PortalSelectorPage'
import TeacherWebApp from './pages/portal/TeacherWebApp'
import StudentWebApp from './pages/portal/StudentWebApp'
import StudentExamTakePage from './pages/portal/StudentExamTakePage'
import BlogManagementPage from './pages/blog/BlogManagementPage'
import LandingToolsManagementPage from './pages/LandingToolsManagementPage'
import NokitaManagementPage from './pages/nokita/NokitaManagementPage'
import './App.css'

type PageId =
  | 'dashboard'
  | 'blog'
  | 'nokita'
  | 'landing-tools'
  | 'classroom-monitoring'
  | 'wallets'
  | 'kitayar-classes'
  | 'kitayar-teachers'
  | 'kitayar-students'
  | 'quiz'
  | 'community'
  | 'questions'
  | 'create-question'
  | 'edit-question'
  | 'import-json'
  | 'lesson-questions'
  | 'settings'
  | 'question-builder'
  | 'announcements'
  | 'notifications'
  | 'system-events'
  | 'music'
  | 'phonebook'
  | 'support'

interface BreadcrumbState {
  courseId?: string; courseName?: string
  fieldId?: string; fieldName?: string
  gradeId?: string; gradeName?: string
  bookId?: string; subjectName?: string
}

type AppSection = 'portal' | 'teacher' | 'student' | 'admin' | 'exam'

function parseCurrentRoute(): { section: AppSection; examId?: string } {
  const hash = window.location.hash || ''
  const path = window.location.pathname || ''

  // 1. Direct Admin Access (hidden from main portal selector)
  if (hash.startsWith('#/admin') || path.endsWith('/admin') || path.includes('/admin/')) {
    return { section: 'admin' }
  }

  // 2. Teacher Web App (Kitayar for iOS / Web)
  if (hash.startsWith('#/teacher') || path.endsWith('/teacher') || path.includes('/teacher/')) {
    return { section: 'teacher' }
  }

  // 3. Student Web App (Nokita)
  if (hash.startsWith('#/student') || path.endsWith('/student') || path.includes('/student/')) {
    return { section: 'student' }
  }

  // 4. Student Exam Taking Link (#/exam/:id or /exam/:id)
  if (hash.startsWith('#/exam/')) {
    const examId = hash.replace('#/exam/', '').split('?')[0].split('/')[0]
    return { section: 'exam', examId }
  }
  const examMatch = path.match(/\/exam\/([^/?#]+)/)
  if (examMatch && examMatch[1]) {
    return { section: 'exam', examId: examMatch[1] }
  }

  // Default: Main Portal Selector
  return { section: 'portal' }
}

function App() {
  const [routeState, setRouteState] = useState(parseCurrentRoute)

  useEffect(() => {
    const handleLocationChange = () => {
      setRouteState(parseCurrentRoute())
    }
    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  // Mobile preview
  const isMobilePreview = window.location.pathname.includes('mobile-preview')
  if (isMobilePreview) {
    return <MobilePreviewPage />
  }

  // 1. Online Classroom Special Links
  const inviteMatch = window.location.pathname.match(/\/online-class\/invite\/([^/?#]+)/)
  if (inviteMatch && inviteMatch[1]) {
    const dashboardBase = import.meta.env.BASE_URL || '/'
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <PlugNmeetClassroomPage
          sessionId={inviteMatch[1]}
          inviteToken={inviteMatch[1]}
          onLeave={() => { window.location.href = dashboardBase }}
        />
      </>
    )
  }

  const onlineClassMatch = window.location.pathname.match(/\/online-class\/([^/?#]+)/)
  if (onlineClassMatch && onlineClassMatch[1]) {
    const dashboardBase = import.meta.env.BASE_URL || '/'
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <PlugNmeetClassroomPage
          sessionId={onlineClassMatch[1]}
          onLeave={() => { window.location.href = dashboardBase }}
        />
      </>
    )
  }

  // 0. Native WebRTC Online Classroom Links (/classroom/native/:roomId or #/classroom/native/:roomId)
  const nativeMatch =
    window.location.pathname.match(/\/classroom\/native\/([^/?#]+)/) ||
    window.location.hash.match(/#\/classroom\/native\/([^/?#]+)/)
  if (nativeMatch && nativeMatch[1]) {
    const dashboardBase = import.meta.env.BASE_URL || '/'
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <NativeClassroomPage
          roomId={nativeMatch[1]}
          onLeave={() => { window.location.href = dashboardBase }}
        />
      </>
    )
  }

  const classroomMatch = window.location.pathname.match(/\/classroom\/([^/?#]+)/)
  if (classroomMatch && classroomMatch[1]) {
    const dashboardBase = import.meta.env.BASE_URL || '/'
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <PlugNmeetClassroomPage
          sessionId={classroomMatch[1]}
          onLeave={() => { window.location.href = dashboardBase }}
        />
      </>
    )
  }

  // --- SECTION ROUTING ---

  // A. Teacher Web App (Kitayar)
  if (routeState.section === 'teacher') {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <TeacherWebApp
          onBackToPortal={() => {
            window.location.hash = '#/'
            setRouteState({ section: 'portal' })
          }}
        />
      </>
    )
  }

  // B. Student Web App (Nokita)
  if (routeState.section === 'student') {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <StudentWebApp
          onBackToPortal={() => {
            window.location.hash = '#/'
            setRouteState({ section: 'portal' })
          }}
          onTakeExam={(examId) => {
            window.location.hash = `#/exam/${examId}`
            setRouteState({ section: 'exam', examId })
          }}
        />
      </>
    )
  }

  // C. Student Exam Taker Link (#/exam/:id)
  if (routeState.section === 'exam' && routeState.examId) {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <StudentExamTakePage
          examId={routeState.examId}
          onBackToPortal={() => {
            window.location.hash = '#/student'
            setRouteState({ section: 'student' })
          }}
        />
      </>
    )
  }

  // D. Main Portal Selector (Landing page for root route - NO link to admin)
  if (routeState.section === 'portal') {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <PortalSelectorPage
          onSelectTeacher={() => {
            window.location.hash = '#/teacher'
            setRouteState({ section: 'teacher' })
          }}
          onSelectStudent={() => {
            window.location.hash = '#/student'
            setRouteState({ section: 'student' })
          }}
        />
      </>
    )
  }

  // E. Admin Panel (Accessed directly via #/admin)
  return <AdminPanelWrapper />
}

/**
 * Admin Panel Component (Original AppShell + Auth logic)
 */
const SUPER_ADMIN_PHONES = ['09137780061', '09919735344']

function AdminPanelWrapper() {
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore()
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const [activeClassroomId, setActiveClassroomId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbState>({})
  const [editQuestion, setEditQuestion] = useState<QuestionData | null>(null)
  const { resetDraft } = useQuestionStore()

  useEffect(() => {
    checkAuth()
  }, [])

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
        <LoginPage />
      </>
    )
  }

  // بررسی دسترسی سوپر ادمین (فقط دو شماره مجاز)
  const userPhone = user?.phoneNumber || user?.username || ''
  const isSuperAdmin =
    SUPER_ADMIN_PHONES.includes(userPhone) ||
    (user?.role === 'admin' && SUPER_ADMIN_PHONES.includes(userPhone))

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <Toaster position="top-center" />
        <div className="bg-slate-800 border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-3xl font-black">
            🚫
          </div>
          <h2 className="text-xl font-black text-white">عدم دسترسی به پنل مدیریت</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            این بخش منحصراً مخصوص سوپرادمین‌های سامانه کیتایار است. معلمان و همکاران گرامی دسترسی به بخش مدیریت مرکزی را ندارند.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                window.location.hash = '#/teacher'
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
            >
              انتقال به پنل معلم
            </button>
            <button
              onClick={() => {
                logout()
              }}
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs transition"
            >
              خروج از حساب
            </button>
          </div>
        </div>
      </div>
    )
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
      case 'dashboard': return <DashboardPage onNavigate={(p: any) => setCurrentPage(p)} />
      case 'blog': return <BlogManagementPage />
      case 'nokita': return <NokitaManagementPage />
      case 'classroom-monitoring':
        return (
          <AdminClassroomMonitoringPage
            onJoinRoom={(roomId) => setActiveClassroomId(roomId)}
          />
        )
      case 'wallets': return <WalletManagementPage />
      case 'kitayar-classes': return <KitayarClassesPage />
      case 'kitayar-teachers': return <KitayarTeachersPage />
      case 'kitayar-students': return <KitayarStudentsPage />
      case 'quiz': return <QuizManagementPage />
      case 'community': return <CommunityManagementPage />
      case 'questions':
        return (
          <QuestionsListPage
            onLessonClick={handleLessonClick}
            onCreateQuestion={handleCreateQuestion}
            onImportJson={() => setCurrentPage('import-json')}
          />
        )
      case 'lesson-questions':
        return (
          <LessonQuestionsPage
            {...breadcrumb}
            onBack={() => setCurrentPage('questions')}
            onCreateQuestion={handleCreateQuestion}
            onEditQuestion={handleEditQuestion}
          />
        )
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
      case 'announcements':
        return <AnnouncementsPage />
      case 'notifications':
        return <NotificationsManagementPage />
      case 'system-events':
        return <SystemEventsPage />
      case 'music':
        return <MusicManagementPage />
      case 'phonebook':
        return <PhonebookManagementPage />
      case 'support':
        return <SupportManagementPage />
      case 'settings': return <SettingsPage />
      case 'landing-tools': return <LandingToolsManagementPage />
      default: return <DashboardPage />
    }
  }

  if (activeClassroomId) {
    return (
      <PlugNmeetClassroomPage
        sessionId={activeClassroomId}
        onLeave={() => setActiveClassroomId(null)}
      />
    )
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '14px' } }} />
      <AppShell
        activePage={currentPage}
        onNavigate={(p: PageId) => {
          if (p === 'create-question') handleCreateQuestion()
          else setCurrentPage(p)
        }}
      >
        {renderContent()}
      </AppShell>
    </>
  )
}

export default App
