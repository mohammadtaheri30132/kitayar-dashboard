import { useEffect, useState } from 'react'
import QuestionEditor from '../components/QuestionEditor'
import MetaFieldsPanel from '../components/MetaFieldsPanel'
import RichAnswerEditor from '../components/answer-sections/RichAnswerEditor'
import TrueFalseAnswer from '../components/answer-sections/TrueFalseAnswer'
import FillBlankAnswer from '../components/answer-sections/FillBlankAnswer'
import MultipleChoiceAnswer from '../components/answer-sections/MultipleChoiceAnswer'
import MatchingAnswer from '../components/answer-sections/MatchingAnswer'
import WordChoiceAnswer from '../components/answer-sections/WordChoiceAnswer'
import CompositeAnswer from '../components/answer-sections/CompositeAnswer'
import SelectField from '../components/SelectField'
import { useQuestionStore } from '../store/useQuestionStore'
import { questionService } from '../services/questionService'
import { courseService, fieldService, gradeService, bookService } from '../services/courseService'
import type { CourseData, FieldData, GradeData, BookData } from '../services/courseService'
import type { QuestionData } from '../services/questionService'
import { TYPE_LABELS, ALL_TYPES } from '../types/question'
import type { QuestionType } from '../types/question'
import toast from 'react-hot-toast'

const ANSWER_SECTION: Record<QuestionType, React.ComponentType> = {
  'گسترده-پاسخ': RichAnswerEditor, 'کوتاه-پاسخ': RichAnswerEditor,
  'جاخالی': FillBlankAnswer, 'صحیح-غلط': TrueFalseAnswer,
  'تستی': MultipleChoiceAnswer, 'جورکردنی': MatchingAnswer,
  'انتخاب-کلمه': WordChoiceAnswer, 'ترکیبی': CompositeAnswer,
}

interface Props { onBack?: () => void; editQuestion?: QuestionData | null; onSaved?: () => void }

const QuestionFormPage = ({ onBack, editQuestion, onSaved }: Props) => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)
  const setType = useQuestionStore((s) => s.setType)
  const resetDraft = useQuestionStore((s) => s.resetDraft)
  const setOptions = useQuestionStore((s) => s.setOptions)
  const setMatchingLeft = useQuestionStore((s) => s.setMatchingLeft)
  const setMatchingRight = useQuestionStore((s) => s.setMatchingRight)

  const [courses, setCourses] = useState<CourseData[]>([])
  const [fields, setFields] = useState<FieldData[]>([])
  const [grades, setGrades] = useState<GradeData[]>([])
  const [books, setBooks] = useState<BookData[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedBook, setSelectedBook] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const isEditing = !!editQuestion

  useEffect(() => { courseService.getAll().then(res => { if (res.success) setCourses(res.data) }).catch(() => {}) }, [])

  useEffect(() => {
    if (!editQuestion?._id || courses.length === 0) return
    const load = async () => {
      setIsLoadingEdit(true)
      try {
        const res = await questionService.getById(editQuestion._id!)
        if (!res.success) return
        const q = res.data
        const bookId = typeof q.book === 'string' ? q.book : (q.book as any)?._id || ''
        const gradeId = typeof q.grade === 'string' ? q.grade : (q.grade as any)?._id || ''
        const courseId = typeof q.course === 'string' ? q.course : (q.course as any)?._id || ''
        if (courseId) {
          setSelectedCourse(courseId)
          const fieldsRes = await fieldService.getByCourse(courseId)
          if (fieldsRes.success) {
            setFields(fieldsRes.data)
            if (gradeId) {
              const allGradesRes = await gradeService.getByCourse(courseId)
              if (allGradesRes.success) {
                const found = allGradesRes.data.find((g: any) => g._id === gradeId)
                if (found) {
                  const fieldId = typeof found.field === 'string' ? found.field : found.field?._id || ''
                  if (fieldId) { setSelectedField(fieldId); const gRes = await gradeService.getByCourse(courseId, fieldId); if (gRes.success) setGrades(gRes.data) }
                }
              }
            }
            if (gradeId) setSelectedGrade(gradeId)
            if (bookId) { setSelectedBook(bookId); bookService.getByGrade(gradeId).then(r => { if (r.success) setBooks(r.data) }).catch(() => {}) }
          }
        }
        setType((q.type as QuestionType) || null)
        if (q.difficulty) setField('difficulty', q.difficulty as any)
        if (q.question) setField('question', q.question)
        if (q.answer) setField('answer', q.answer)
        if (q.lesson_id) setField('lesson_id', q.lesson_id)
        if (q.page_number?.length) setField('page_number', q.page_number)
        if (q.source_image) setField('source_image', q.source_image)
        if (q.options?.length) setOptions(q.options)
        if (q.matching_left?.length) setMatchingLeft(q.matching_left)
        if (q.matching_right?.length) setMatchingRight(q.matching_right)
        if (q.sub?.length) setField('sub' as any, q.sub)
      } catch { toast.error('❌ خطا') } finally { setIsLoadingEdit(false) }
    }
    load()
  }, [editQuestion, courses])

  useEffect(() => { if (!selectedCourse || isEditing) return; fieldService.getByCourse(selectedCourse).then(res => { if (res.success) { setFields(res.data); if (res.data.length === 1 && !selectedField) setSelectedField(res.data[0]._id) } }).catch(() => {}) }, [selectedCourse])
  useEffect(() => { if (!selectedCourse || !selectedField || isEditing) return; gradeService.getByCourse(selectedCourse, selectedField).then(res => { if (res.success) setGrades(res.data) }).catch(() => {}) }, [selectedCourse, selectedField])
  useEffect(() => { if (!selectedGrade || isEditing) return; bookService.getByGrade(selectedGrade).then(res => { if (res.success) setBooks(res.data) }).catch(() => {}) }, [selectedGrade])

  const AnswerSection = draft.type ? ANSWER_SECTION[draft.type] : null
  const isValid = selectedCourse && selectedField && selectedGrade && selectedBook && draft.type && draft.question.trim() &&
    (draft.type === 'ترکیبی' ? true : draft.answer.trim())

  const handleSubmit = async () => {
    if (!isValid) { toast.error('⚠️ فیلدهای الزامی را تکمیل کنید'); return }
    setIsSubmitting(true)
    try {
      const payload: any = {
        book: selectedBook, type: draft.type!, difficulty: draft.difficulty,
        question: draft.question, options: draft.options,
        matching_left: draft.matching_left, matching_right: draft.matching_right,
        answer: draft.answer, lesson_id: draft.lesson_id || 1,
        page_number: draft.page_number || [],
        source_image: draft.source_image,
      }
      if (draft.type === 'ترکیبی') {
        payload.sub = (draft as any).sub || []
        payload.answer = ''
      }
      const res = isEditing ? await questionService.update(editQuestion!._id!, payload) : await questionService.create(payload)
      if (res.success) { toast.success(isEditing ? '✅ ویرایش شد' : '✅ ایجاد شد'); resetDraft(); onSaved?.(); onBack?.() }
    } catch (err: any) { toast.error(err.response?.data?.message || '❌ خطا') } finally { setIsSubmitting(false) }
  }

  if (isLoadingEdit) return <div className="flex justify-center py-32"><svg className="animate-spin h-10 w-10 text-primary-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        {onBack && <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>}
        <h2 className="text-2xl font-bold text-gray-800">{isEditing ? '✏️ ویرایش سوال' : '➕ ایجاد سوال جدید'}</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-5">📚 مشخصات درس</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <SelectField label="دوره" icon="📚" options={courses.map(c => ({ value: c._id, label: c.name }))} value={selectedCourse} onChange={v => { setSelectedCourse(v); setSelectedField(''); setSelectedGrade(''); setSelectedBook('') }} placeholder="دوره" />
          <SelectField label="رشته" icon="🎯" options={fields.map(f => ({ value: f._id, label: f.name }))} value={selectedField} onChange={v => { setSelectedField(v); setSelectedGrade(''); setSelectedBook('') }} placeholder="رشته" disabled={!selectedCourse || (fields.length <= 1 && !!selectedField)} />
          <SelectField label="پایه" icon="🏫" options={grades.map(g => ({ value: g._id, label: g.name }))} value={selectedGrade} onChange={v => { setSelectedGrade(v); setSelectedBook('') }} placeholder="پایه" disabled={!selectedField} />
          <SelectField label="درس" icon="📖" options={books.map(b => ({ value: b._id, label: b.name }))} value={selectedBook} onChange={setSelectedBook} placeholder="درس" disabled={!selectedGrade} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="نوع سوال" icon="📝" options={ALL_TYPES.map(t => ({ value: t, label: TYPE_LABELS[t] }))} value={draft.type || ''} onChange={v => setType(v as QuestionType)} placeholder="نوع سوال" />
          <SelectField label="سختی" icon="🎯" options={[{ value: 'ساده', label: '🟢 ساده' }, { value: 'متوسط', label: '🟡 متوسط' }, { value: 'دشوار', label: '🔴 دشوار' }]} value={draft.difficulty} onChange={v => setField('difficulty', v as any)} placeholder="سختی" />
        </div>
      </div>

      {draft.type && <MetaFieldsPanel />}

      {draft.type && (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-5">📝 صورت سوال {draft.type === 'ترکیبی' && '(اصلی)'}</h3>
            <QuestionEditor key={draft.question_id + (isEditing ? '-edit' : '-new')} content={draft.question} storageKey={isEditing ? `qmaker-edit-${editQuestion?._id}` : `qmaker-stem-${draft.question_id}`} placeholderText="صورت سوال را بنویسید..." onChange={html => setField('question', html)} />
          </div>
          {AnswerSection && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <AnswerSection />
            </div>
          )}
          <div className="flex justify-center gap-3 pb-8">
            <button onClick={() => { resetDraft(); onBack?.() }} className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">انصراف</button>
            <button onClick={handleSubmit} disabled={!isValid || isSubmitting} className={`px-8 py-3 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${isValid && !isSubmitting ? 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25' : 'bg-gray-300 cursor-not-allowed'}`}>
              {isSubmitting ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> در حال ثبت...</> : isEditing ? '💾 ذخیره' : '✓ ثبت'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default QuestionFormPage
