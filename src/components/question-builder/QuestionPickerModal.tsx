import { useState, useEffect } from 'react'
import { questionService } from '../../services/questionService'
import { courseService, fieldService, gradeService, bookService } from '../../services/courseService'
import type { CourseData, FieldData, GradeData, BookData } from '../../services/courseService'
import type { BuilderQuestion } from '../../types/question-builder'
import SelectField from '../SelectField'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
  onAddQuestions: (questions: BuilderQuestion[]) => void
  defaultCourseId?: string
  defaultFieldId?: string
  defaultGradeId?: string
  defaultBookId?: string
  defaultCourseName?: string
  defaultFieldName?: string
  defaultGradeName?: string
  defaultBookName?: string
  onSaveContext: (ctx: {
    courseId: string; fieldId: string; gradeId: string; bookId: string
    courseName: string; fieldName: string; gradeName: string; bookName: string
  }) => void
}

const QuestionPickerModal: React.FC<Props> = ({
  onClose, onAddQuestions,
  defaultCourseId, defaultFieldId, defaultGradeId, defaultBookId,
  defaultCourseName, defaultFieldName, defaultGradeName, defaultBookName,
  onSaveContext,
}) => {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [fields, setFields] = useState<FieldData[]>([])
  const [grades, setGrades] = useState<GradeData[]>([])
  const [books, setBooks] = useState<BookData[]>([])

  const [selectedCourse, setSelectedCourse] = useState(defaultCourseId || '')
  const [selectedField, setSelectedField] = useState(defaultFieldId || '')
  const [selectedGrade, setSelectedGrade] = useState(defaultGradeId || '')
  const [selectedBook, setSelectedBook] = useState(defaultBookId || '')

  const [selectedCourseName, setSelectedCourseName] = useState(defaultCourseName || '')
  const [selectedFieldName, setSelectedFieldName] = useState(defaultFieldName || '')
  const [selectedGradeName, setSelectedGradeName] = useState(defaultGradeName || '')
  const [selectedBookName, setSelectedBookName] = useState(defaultBookName || '')

  const [questions, setQuestions] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('همه')

  // فصل (lesson_id) — «همه» یعنی مثل قبل، بدون فیلتر فصل، همه سوالات درس دیده شوند
  const [filterLesson, setFilterLesson] = useState<number | 'all'>('all')
  const [lessonOptions, setLessonOptions] = useState<number[]>([])

  const [loading, setLoading] = useState(false)

  // لود دوره‌ها
  useEffect(() => {
    courseService.getAll().then(res => { if (res.success) setCourses(res.data) }).catch(() => {})
  }, [])

  // لود رشته‌ها
  useEffect(() => {
    if (!selectedCourse) { setFields([]); return }
    fieldService.getByCourse(selectedCourse).then(res => {
      if (res.success) {
        setFields(res.data)
        if (res.data.length === 1 && !selectedField) {
          setSelectedField(res.data[0]._id)
          setSelectedFieldName(res.data[0].name)
        }
      }
    }).catch(() => {})
  }, [selectedCourse])

  // لود پایه‌ها
  useEffect(() => {
    if (!selectedCourse || !selectedField) { setGrades([]); return }
    gradeService.getByCourse(selectedCourse, selectedField).then(res => { if (res.success) setGrades(res.data) }).catch(() => {})
  }, [selectedCourse, selectedField])

  // لود درس‌ها
  useEffect(() => {
    if (!selectedGrade) { setBooks([]); return }
    bookService.getByGrade(selectedGrade).then(res => { if (res.success) setBooks(res.data) }).catch(() => {})
  }, [selectedGrade])

  // با تغییر درس: لیست فصل‌های موجود آن درس را (مستقل از فیلتر نوع/جستجو) می‌گیریم
  // تا کاربر بتواند از بین فصل‌های واقعاً موجود انتخاب کند
  useEffect(() => {
    setFilterLesson('all')
    if (!selectedBook) { setLessonOptions([]); return }
    questionService.getByBook(selectedBook, { limit: 500 }).then(res => {
      if (res.success) {
        const uniqueLessons = Array.from(
          new Set(
            (res.data as any[])
              .map(q => q.lesson_id)
              .filter((l): l is number => typeof l === 'number')
          )
        ).sort((a, b) => a - b)
        setLessonOptions(uniqueLessons)
      }
    }).catch(() => {})
  }, [selectedBook])

  // لود سوالات با تغییر درس/نوع/فصل
  useEffect(() => {
    if (!selectedBook) { setQuestions([]); return }
    setLoading(true)
    const params: any = { limit: filterLesson !== 'all' ? 500 : 200 }
    if (filterType !== 'همه') params.type = filterType
    if (search) params.search = search
    // نکته: پارامتر lesson_id را هم می‌فرستیم برای وقتی که بک‌اند این فیلتر را ساپورت کند،
    // ولی چون فعلاً روی سرور نادیده گرفته می‌شود، اینجا هم روی خروجی فیلتر می‌کنیم
    // تا انتخاب فصل همیشه واقعاً اثر داشته باشد.
    if (filterLesson !== 'all') params.lesson_id = filterLesson
    questionService.getByBook(selectedBook, params).then(res => {
      if (!res.success) return
      const data = filterLesson === 'all'
        ? res.data
        : (res.data as any[]).filter(q => q.lesson_id === filterLesson)
      setQuestions(data)
    }).catch(() => toast.error('❌ خطا')).finally(() => setLoading(false))
  }, [selectedBook, filterType, search, filterLesson])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length && questions.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(questions.map(q => q._id!).filter(Boolean)))
    }
  }

  const handleAdd = () => {
    const selectedQuestions = questions.filter(q => selectedIds.has(q._id!))
    if (selectedQuestions.length === 0) { toast.error('⚠️ هیچ سوالی انتخاب نشده'); return }

    const builderQuestions: BuilderQuestion[] = selectedQuestions.map((q: any) => ({
      _id: q._id,
      question_id: q.question_id,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      mainQuestion: q.mainQuestion,
      options: q.options,
      matching_left: q.matching_left,
      matching_right: q.matching_right,
      answer: q.answer,
      page_number: q.page_number,
      source_image: q.source_image,
      has_image: q.has_image,
      bookName: selectedBookName,
      gradeName: selectedGradeName,
      courseName: selectedCourseName,
    }))

    onAddQuestions(builderQuestions)
    onSaveContext({
      courseId: selectedCourse,
      fieldId: selectedField,
      gradeId: selectedGrade,
      bookId: selectedBook,
      courseName: selectedCourseName,
      fieldName: selectedFieldName,
      gradeName: selectedGradeName,
      bookName: selectedBookName,
    })
    onClose()
  }

  const stripHtml = (html: string) => { if (!html) return ''; const d = document.createElement('div'); d.innerHTML = html; return d.textContent || '' }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">📝 انتخاب سوال</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* فیلترهای درس */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <SelectField label="دوره" icon="📚" options={courses.map(c => ({ value: c._id, label: c.name }))} value={selectedCourse}
            onChange={v => { setSelectedCourse(v); setSelectedField(''); setSelectedGrade(''); setSelectedBook(''); const c = courses.find(x => x._id === v); setSelectedCourseName(c?.name || '') }} placeholder="دوره" />
          <SelectField label="رشته" icon="🎯" options={fields.map(f => ({ value: f._id, label: f.name }))} value={selectedField}
            onChange={v => { setSelectedField(v); setSelectedGrade(''); setSelectedBook(''); const f = fields.find(x => x._id === v); setSelectedFieldName(f?.name || '') }} placeholder="رشته" disabled={!selectedCourse || (fields.length <= 1 && !!selectedField)} />
          <SelectField label="پایه" icon="🏫" options={grades.map(g => ({ value: g._id, label: g.name }))} value={selectedGrade}
            onChange={v => { setSelectedGrade(v); setSelectedBook(''); const g = grades.find(x => x._id === v); setSelectedGradeName(g?.name || '') }} placeholder="پایه" disabled={!selectedField} />
          <SelectField label="درس" icon="📖" options={books.map(b => ({ value: b._id, label: b.name }))} value={selectedBook}
            onChange={v => { setSelectedBook(v); const b = books.find(x => x._id === v); setSelectedBookName(b?.name || '') }} placeholder="درس" disabled={!selectedGrade} />
        </div>

        {/* جستجو، فیلتر نوع، فیلتر فصل */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
            className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="همه">همه انواع</option>
            <option value="تستی">تستی</option>
            <option value="جاخالی">جای خالی</option>
            <option value="صحیح-غلط">صحیح/غلط</option>
            <option value="کوتاه-پاسخ">کوتاه پاسخ</option>
            <option value="گسترده-پاسخ">تشریحی</option>
            <option value="جورکردنی">جورکردنی</option>
            <option value="انتخاب-کلمه">انتخاب کلمه</option>
          </select>
          {/* فیلتر فصل — فقط وقتی درسی انتخاب شده و فصلی برایش موجود است نشان داده می‌شود */}
          {selectedBook && lessonOptions.length > 0 && (
            <select
              value={filterLesson}
              onChange={e => setFilterLesson(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">همه فصل‌ها</option>
              {lessonOptions.map(l => (
                <option key={l} value={l}>فصل {l}</option>
              ))}
            </select>
          )}
        </div>

        {/* لیست سوالات */}
        {loading ? (
          <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">سوالی یافت نشد</div>
        ) : (
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 sticky top-0">
              <input type="checkbox" checked={selectedIds.size === questions.length && questions.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5" />
              <span className="flex-1">صورت سوال</span>
              <span className="w-16 text-center">فصل</span>
              <span className="w-20 text-center">نوع</span>
              <span className="w-16 text-center">سختی</span>
            </div>
            {questions.map((q: any, idx: number) => (
              <div key={q._id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 text-sm hover:bg-gray-50 cursor-pointer ${selectedIds.has(q._id) ? 'bg-primary-50/50' : ''}`} onClick={() => toggleSelect(q._id!)}>
                <input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => toggleSelect(q._id!)} className="w-3.5 h-3.5" />
                <span className="flex-1 truncate">{idx + 1}. {stripHtml(q.question).substring(0, 100)}</span>
                <span className="w-16 text-center text-xs text-gray-500">{typeof q.lesson_id === 'number' ? q.lesson_id : '—'}</span>
                <span className="w-20 text-center text-xs bg-gray-100 rounded-full px-2 py-0.5">{q.type}</span>
                <span className="w-16 text-center text-xs">{q.difficulty}</span>
              </div>
            ))}
          </div>
        )}

        {/* دکمه‌ها */}
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">انصراف</button>
          <button onClick={handleAdd} disabled={selectedIds.size === 0} className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 disabled:opacity-40">
            افزودن {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionPickerModal