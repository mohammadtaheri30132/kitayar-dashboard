import AppShell from './layout/AppShell'
import TypeSelectLanding from './pages/TypeSelectLanding'
import QuestionFormPage from './pages/QuestionFormPage'
import { useQuestionStore } from './store/useQuestionStore'
import './App.css'

function App() {
  const type = useQuestionStore((s) => s.draft.type)

  return <AppShell>{type ? <QuestionFormPage /> : <TypeSelectLanding />}</AppShell>
}

export default App