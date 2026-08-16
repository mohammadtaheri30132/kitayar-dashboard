import { useState, useEffect } from 'react'
import HeaderSelector from '../components/question-builder/HeaderSelector'
import HeaderTypeModal from '../components/question-builder/HeaderTypeModal'
import CustomHeaderModal from '../components/question-builder/CustomHeaderModal'
import QuestionPickerModal from '../components/question-builder/QuestionPickerModal'
import A4Preview from '../components/question-builder/A4Preview'
import BuilderSettingsModal from '../components/question-builder/BuilderSettingsModal'
import type {
  BuilderQuestion, BuilderHeader, BuilderState, BuilderSettings,
  HeaderStandard1Fields, HeaderStandard2Fields, HeaderStandard4Fields, CustomHeaderConfig,
} from '../types/question-builder'
import { DEFAULT_SETTINGS } from '../types/question-builder'
import { DEFAULT_SETTINGS_ADDITIONS } from '../types/question-builder-additions'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'question-builder-state'
const HEADERS_KEY = 'question-builder-headers'
const SETTINGS_KEY = 'question-builder-settings'

const FULL_DEFAULT_SETTINGS: BuilderSettings = { ...DEFAULT_SETTINGS_ADDITIONS, ...DEFAULT_SETTINGS } as BuilderSettings

interface Props {
  onBack?: () => void
}

const QuestionBuilderPage = ({ onBack }: Props) => {
  const [headers, setHeaders] = useState<BuilderHeader[]>([])
  const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<BuilderQuestion[]>([])
  const [settings, setSettings] = useState<BuilderSettings>(FULL_DEFAULT_SETTINGS)
  const [showPicker, setShowPicker] = useState(false)
  const [showHeaderTypeModal, setShowHeaderTypeModal] = useState(false)
  const [showCustomHeaderModal, setShowCustomHeaderModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null)
  const [savedContext, setSavedContext] = useState<{
    courseId?: string; fieldId?: string; gradeId?: string; bookId?: string
    courseName?: string; fieldName?: string; gradeName?: string; bookName?: string
  }>({})

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data: BuilderState = JSON.parse(saved)
        if (data.questions) setQuestions(data.questions)
        if (data.selectedCourseId || data.selectedBookId) {
          setSavedContext({
            courseId: data.selectedCourseId, fieldId: data.selectedFieldId,
            gradeId: data.selectedGradeId, bookId: data.selectedBookId,
            courseName: data.selectedCourseName, fieldName: data.selectedFieldName,
            gradeName: data.selectedGradeName, bookName: data.selectedBookName,
          })
        }
        if (data.headerId) setSelectedHeaderId(data.headerId)
      } catch {}
    }

    const savedHeaders = localStorage.getItem(HEADERS_KEY)
    if (savedHeaders) {
      try {
        const parsed = JSON.parse(savedHeaders)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHeaders(parsed)
        }
      } catch {}
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...FULL_DEFAULT_SETTINGS, ...parsed })
      } catch {}
    }
  }, [])

  useEffect(() => {
    const state: BuilderState = { headerId: selectedHeaderId, questions, ...savedContext, settings } as BuilderState
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [questions, selectedHeaderId, savedContext, settings])

  useEffect(() => { localStorage.setItem(HEADERS_KEY, JSON.stringify(headers)) }, [headers])
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])

  // ---------- هدرها ----------
  const handleAddHeader = (header: BuilderHeader) => {
    setHeaders(prev => [...prev, header])
    setSelectedHeaderId(header.id)
    toast.success('✅ هدر اضافه شد')
  }

  const handleDeleteHeader = (id: string) => {
    setHeaders(prev => prev.filter(h => h.id !== id))
    if (selectedHeaderId === id) setSelectedHeaderId(null)
    toast.success('🗑️ هدر حذف شد')
  }

  const handleUpdateHeaderField = (headerId: string, kind: 'title' | 'subtitle' | 'footer', value: string) => {
    if (kind === 'footer') {
      setSettings(prev => ({ ...prev, footerText: value }))
      return
    }
    setHeaders(prev => prev.map(h => h.id === headerId ? { ...h, [kind]: value } : h))
  }

  const handleUpdateHeaderCell = (headerId: string, fieldIndex: number, value: string) => {
    setHeaders(prev => prev.map(h => {
      if (h.id !== headerId || !h.fields) return h
      const fields = [...h.fields]
      fields[fieldIndex] = { ...fields[fieldIndex], value }
      return { ...h, fields }
    }))
  }

  const handleUpdateHeaderStandard1 = (headerId: string, field: keyof HeaderStandard1Fields, value: string) => {
    setHeaders(prev => prev.map(h => {
      if (h.id !== headerId || !h.standard1) return h
      return { ...h, standard1: { ...h.standard1, [field]: value } }
    }))
  }

  const handleUpdateHeaderStandard2 = (headerId: string, field: keyof HeaderStandard2Fields, value: string) => {
    setHeaders(prev => prev.map(h => {
      if (h.id !== headerId || !h.standard2) return h
      return { ...h, standard2: { ...h.standard2, [field]: value } }
    }))
  }

  const handleUpdateHeaderStandard4 = (headerId: string, field: keyof HeaderStandard4Fields, value: string) => {
    setHeaders(prev => prev.map(h => {
      if (h.id !== headerId || !h.standard4) return h
      return { ...h, standard4: { ...h.standard4, [field]: value } }
    }))
  }

  const handleUpdateHeaderCustom = (headerId: string, updater: (cfg: CustomHeaderConfig) => CustomHeaderConfig) => {
    setHeaders(prev => prev.map(h => {
      if (h.id !== headerId || !h.custom) return h
      return { ...h, custom: updater(h.custom) }
    }))
  }

  // ---------- سوالات ----------
  const applyDefaultScore = (q: BuilderQuestion): BuilderQuestion => {
    if (q.score) return q
    const def = settings.defaultScoreByType?.[q.type]
    return def ? { ...q, score: def } : q
  }

  const handleAddQuestions = (newQuestions: BuilderQuestion[]) => {
    if (swapTargetId) {
      const replacement = applyDefaultScore(newQuestions[0])
      setQuestions(prev => prev.map(q => (q._id === swapTargetId ? { ...replacement, score: q.score || replacement.score } : q)))
      toast.success('🔁 سوال جایگزین شد')
      setSwapTargetId(null)
      return
    }
    setQuestions(prev => [...prev, ...newQuestions.map(applyDefaultScore)])
    toast.success(`✅ ${newQuestions.length} سوال اضافه شد`)
  }

  const handleRemoveQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q._id !== id))
  }

  const handleMoveQuestion = (id: string, direction: 'up' | 'down') => {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q._id === id)
      if (idx === -1) return prev

      if (settings.groupingMode !== 'grouped') {
        const target = direction === 'up' ? idx - 1 : idx + 1
        if (target < 0 || target >= prev.length) return prev
        const next = [...prev]
        ;[next[idx], next[target]] = [next[target], next[idx]]
        return next
      }

      const type = prev[idx].type
      const sameTypeIdx = prev.map((q, i) => (q.type === type ? i : -1)).filter(i => i !== -1)
      const posInGroup = sameTypeIdx.indexOf(idx)
      const targetPos = direction === 'up' ? posInGroup - 1 : posInGroup + 1
      if (targetPos < 0 || targetPos >= sameTypeIdx.length) return prev
      const targetIdx = sameTypeIdx[targetPos]
      const next = [...prev]
      ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
      return next
    })
  }

  const handleUpdateScore = (id: string, score: string) => {
    setQuestions(prev => prev.map(q => (q._id === id ? { ...q, score } : q)))
  }

  const handleUpdateQuestion = (id: string, patch: Partial<BuilderQuestion>) => {
    setQuestions(prev => prev.map(q => (q._id === id ? { ...q, ...patch } : q)))
  }

  const handleApplyScoreToAll = () => {
    setQuestions(prev => prev.map(q => ({ ...q, score: settings.defaultScoreByType?.[q.type] ?? q.score })))
    toast.success('✅ بارم پیش‌فرض روی همه سوالات اعمال شد')
  }

  const handleUpdateGroupInstruction = (type: string, text: string) => {
    setSettings(prev => ({
      ...prev,
      groupInstructions: { ...(prev.groupInstructions || {}), [type]: text },
    }))
    toast.success('✅ متن دستور ذخیره شد')
  }

  const handleSwapQuestion = (id: string) => {
    setSwapTargetId(id)
    setShowPicker(true)
  }

  const handleSaveContext = (ctx: {
    courseId: string; fieldId: string; gradeId: string; bookId: string
    courseName: string; fieldName: string; gradeName: string; bookName: string
  }) => setSavedContext(ctx)

  const handlePrint = () => window.print()

  return (
    <div className="max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📝 سوال ساز</h2>
            <p className="text-sm text-gray-500">ساخت برگه آزمون با پیش‌نمایش A4</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300">⚙️ تنظیمات</button>
          <button onClick={() => setShowHeaderTypeModal(true)} className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300">📋 هدر جدید</button>
          <button onClick={() => { setSwapTargetId(null); setShowPicker(true) }} className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 shadow-sm">➕ افزودن سوال</button>
          <button onClick={handlePrint} className="px-4 py-2.5 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-800 shadow-sm">🖨️ پرینت</button>
        </div>
      </div>

      <div className="print:hidden">
        <HeaderSelector
          headers={headers}
          selectedHeaderId={selectedHeaderId}
          onSelect={setSelectedHeaderId}
          onAddHeader={handleAddHeader}
          onDeleteHeader={handleDeleteHeader}
        />
      </div>

      <div className="print-area">
        <A4Preview
          headers={headers}
          selectedHeaderId={selectedHeaderId}
          questions={questions}
          settings={settings}
          onRemoveQuestion={handleRemoveQuestion}
          onMoveQuestion={handleMoveQuestion}
          onUpdateScore={handleUpdateScore}
          onUpdateQuestion={handleUpdateQuestion}
          onSwapQuestion={handleSwapQuestion}
          onUpdateHeaderField={handleUpdateHeaderField}
          onUpdateHeaderCell={handleUpdateHeaderCell}
          onUpdateHeaderStandard1={handleUpdateHeaderStandard1}
          onUpdateHeaderStandard2={handleUpdateHeaderStandard2}
          onUpdateHeaderStandard4={handleUpdateHeaderStandard4}
          onUpdateHeaderCustom={handleUpdateHeaderCustom}
          onUpdateGroupInstruction={handleUpdateGroupInstruction}
        />
      </div>

      {showPicker && (
        <QuestionPickerModal
          onClose={() => { setShowPicker(false); setSwapTargetId(null) }}
          onAddQuestions={handleAddQuestions}
          defaultCourseId={savedContext.courseId}
          defaultFieldId={savedContext.fieldId}
          defaultGradeId={savedContext.gradeId}
          defaultBookId={savedContext.bookId}
          defaultCourseName={savedContext.courseName}
          defaultFieldName={savedContext.fieldName}
          defaultGradeName={savedContext.gradeName}
          defaultBookName={savedContext.bookName}
          onSaveContext={handleSaveContext}
        />
      )}

      {showHeaderTypeModal && (
        <HeaderTypeModal
          onSelect={handleAddHeader}
          onClose={() => setShowHeaderTypeModal(false)}
          onOpenCustomBuilder={() => setShowCustomHeaderModal(true)}
        />
      )}

      {showCustomHeaderModal && (
        <CustomHeaderModal
          onSave={handleAddHeader}
          onClose={() => setShowCustomHeaderModal(false)}
        />
      )}

      {showSettings && (
        <BuilderSettingsModal
          settings={settings}
          onSave={setSettings}
          onApplyScoreToAll={handleApplyScoreToAll}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default QuestionBuilderPage