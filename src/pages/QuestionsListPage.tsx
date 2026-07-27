import { useEffect, useState } from 'react'
import { courseService, fieldService, gradeService, bookService } from '../services/courseService'
import type { CourseData, FieldData, GradeData, BookData } from '../services/courseService'
import toast from 'react-hot-toast'

interface Props {
  onLessonClick?: (course: string, grade: string, subject: string, bookId: string) => void
  onCreateQuestion?: () => void
  onImportJson?: () => void
}

const QuestionsListPage = ({ onLessonClick, onCreateQuestion, onImportJson }: Props) => {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [fieldsMap, setFieldsMap] = useState<Record<string, FieldData[]>>({})
  const [gradesMap, setGradesMap] = useState<Record<string, GradeData[]>>({})
  const [booksMap, setBooksMap] = useState<Record<string, BookData[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    try {
      const res = await courseService.getAll()
      if (res.success) setCourses(res.data)
    } catch (err) { toast.error('❌ خطا در دریافت دوره‌ها') }
    finally { setIsLoading(false) }
  }

  const fetchFields = async (courseId: string) => {
    if (fieldsMap[courseId]) return
    try {
      const res = await fieldService.getByCourse(courseId)
      if (res.success) setFieldsMap(prev => ({ ...prev, [courseId]: res.data }))
    } catch (err) { toast.error('❌ خطا') }
  }

  const fetchGrades = async (courseId: string, fieldId: string) => {
    const key = `${courseId}_${fieldId}`
    if (gradesMap[key]) return
    try {
      const res = await gradeService.getByCourse(courseId, fieldId)
      if (res.success) setGradesMap(prev => ({ ...prev, [key]: res.data }))
    } catch (err) { toast.error('❌ خطا') }
  }

  const fetchBooks = async (gradeId: string) => {
    if (booksMap[gradeId]) return
    try {
      const res = await bookService.getByGrade(gradeId)
      if (res.success) setBooksMap(prev => ({ ...prev, [gradeId]: res.data }))
    } catch (err) { toast.error('❌ خطا') }
  }

  const courseColor = (code: string) => code === 'ELEMENTARY' ? 'bg-green-500' : code === 'MIDDLE' ? 'bg-primary-500' : 'bg-purple-500'
  const courseIcon = (code: string) => code === 'ELEMENTARY' ? '🎒' : code === 'MIDDLE' ? '🏫' : '🎓'

  if (isLoading) return <div className="flex justify-center py-32"><svg className="animate-spin h-10 w-10 text-primary-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">بانک سوالات</h2>
          <p className="text-sm text-gray-500">مدیریت سوالات بر اساس دوره، رشته، پایه و درس</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onImportJson} className="px-4 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100">import JSON</button>
          <button onClick={onCreateQuestion} className="px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 shadow-sm">+ افزودن سوال</button>
        </div>
      </div>

      <div className="space-y-4">
        {courses.map(course => (
          <div key={course._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button onClick={async () => {
              if (expandedCourse === course._id) { setExpandedCourse(null); return }
              setExpandedCourse(course._id)
              await fetchFields(course._id)
            }} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 text-right">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold ${courseColor(course.code)}`}>{courseIcon(course.code)}</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.totalQuestions} سوال</p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform ${expandedCourse === course._id ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            {expandedCourse === course._id && (
              <div className="border-t border-gray-100 bg-gray-50/50">
                {(fieldsMap[course._id] || []).map(field => (
                  <div key={field._id}>
                    <button onClick={async () => {
                      if (expandedField === field._id) { setExpandedField(null); return }
                      setExpandedField(field._id)
                      await fetchGrades(course._id, field._id)
                    }} className="w-full flex items-center justify-between px-8 py-4 hover:bg-gray-100 text-right">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary-400 rounded-full" />
                        <span className="font-medium text-gray-700">{field.name}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform ${expandedField === field._id ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                    </button>

                    {expandedField === field._id && (
                      <div className="border-t border-gray-200 bg-white">
                        {(gradesMap[`${course._id}_${field._id}`] || []).map(grade => (
                          <div key={grade._id}>
                            <button onClick={async () => {
                              if (expandedGrade === grade._id) { setExpandedGrade(null); return }
                              setExpandedGrade(grade._id)
                              await fetchBooks(grade._id)
                            }} className="w-full flex items-center justify-between px-12 py-3.5 hover:bg-gray-50 text-right">
                              <span className="text-sm text-gray-700">{grade.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{grade.totalQuestions} سوال</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform ${expandedGrade === grade._id ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                              </div>
                            </button>

                            {expandedGrade === grade._id && (
                              <div className="border-t border-gray-200 bg-white">
                                {(booksMap[grade._id] || []).map(book => (
                                  <button key={book._id} onClick={() => onLessonClick?.(course.name, grade.name, book.name, book._id)}
                                    className="w-full flex items-center justify-between px-16 py-3 hover:bg-gray-50 text-right">
                                    <div className="flex items-center gap-3">
                                      <span>{book.icon || '📖'}</span>
                                      <span className="text-sm text-gray-700">{book.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{book.totalQuestions} سوال</span>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><polyline points="9 18 15 12 9 6" /></svg>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuestionsListPage
