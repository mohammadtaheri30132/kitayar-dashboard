import { useEffect, useState } from 'react'
import { courseService, fieldService, gradeService, bookService } from '../services/courseService'
import type { CourseData, FieldData, GradeData, BookData } from '../services/courseService'
import toast from 'react-hot-toast'

interface Props {
  onLessonClick?: (
    courseId: string,
    courseName: string,
    fieldId: string,
    fieldName: string,
    gradeId: string,
    gradeName: string,
    bookId: string,
    bookName: string
  ) => void
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

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await courseService.getAll()
      if (res.success) setCourses(res.data)
    } catch {
      toast.error('خطا در دریافت دوره‌ها')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFields = async (courseId: string) => {
    if (fieldsMap[courseId]) return
    try {
      const res = await fieldService.getByCourse(courseId)
      if (res.success) setFieldsMap((prev) => ({ ...prev, [courseId]: res.data }))
    } catch {
      toast.error('خطا در دریافت رشته‌ها')
    }
  }

  const fetchGrades = async (courseId: string, fieldId: string) => {
    const key = `${courseId}_${fieldId}`
    if (gradesMap[key]) return
    try {
      const res = await gradeService.getByCourse(courseId, fieldId)
      if (res.success) setGradesMap((prev) => ({ ...prev, [key]: res.data }))
    } catch {
      toast.error('خطا در دریافت پایه‌ها')
    }
  }

  const fetchBooks = async (gradeId: string) => {
    if (booksMap[gradeId]) return
    try {
      const res = await bookService.getByGrade(gradeId)
      if (res.success) setBooksMap((prev) => ({ ...prev, [gradeId]: res.data }))
    } catch {
      toast.error('خطا در دریافت کتاب‌ها')
    }
  }

  const courseColor = (code: string) =>
    code === 'ELEMENTARY'
      ? 'from-emerald-600 to-teal-600'
      : code === 'MIDDLE'
      ? 'from-blue-600 to-indigo-600'
      : 'from-purple-600 to-pink-600'

  const courseIcon = (code: string) =>
    code === 'ELEMENTARY' ? '🎒' : code === 'MIDDLE' ? '🏫' : '🎓'

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">در حال بارگذاری بانک سوالات...</p>
      </div>
    )

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>📚</span>
            <span>بانک جامع سوالات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت و مشاهده سوالات طبقه‌بندی شده بر اساس دوره، رشته، پایه و درس</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onImportJson}
            className="px-4 py-2.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/20 transition active:scale-95 shadow-sm"
          >
            ورود دسته‌جمعی (Import JSON)
          </button>
          <button
            onClick={onCreateQuestion}
            className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95"
          >
            + افزودن سوال جدید
          </button>
        </div>
      </div>

      {/* Course Tree Accordion */}
      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-xl transition hover:border-slate-700/80"
          >
            <button
              onClick={async () => {
                if (expandedCourse === course._id) {
                  setExpandedCourse(null)
                  return
                }
                setExpandedCourse(course._id)
                await fetchFields(course._id)
              }}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-800/40 text-right transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-tr ${courseColor(
                    course.code
                  )} shadow-md`}
                >
                  {courseIcon(course.code)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{course.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {(course.totalQuestions || 0).toLocaleString('fa-IR')} سوال ثبت‌شده
                  </p>
                </div>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`text-slate-400 transition-transform duration-200 ${
                  expandedCourse === course._id ? 'rotate-180 text-indigo-400' : ''
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expandedCourse === course._id && (
              <div className="border-t border-slate-800/80 bg-slate-950/40">
                {(fieldsMap[course._id] || []).map((field) => (
                  <div key={field._id}>
                    <button
                      onClick={async () => {
                        if (expandedField === field._id) {
                          setExpandedField(null)
                          return
                        }
                        setExpandedField(field._id)
                        await fetchGrades(course._id, field._id)
                      }}
                      className="w-full flex items-center justify-between px-8 py-3.5 hover:bg-slate-800/40 text-right transition border-b border-slate-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-500/50" />
                        <span className="font-semibold text-slate-200 text-xs">{field.name}</span>
                      </div>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        className={`text-slate-500 transition-transform duration-200 ${
                          expandedField === field._id ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {expandedField === field._id && (
                      <div className="bg-slate-950/70 border-b border-slate-800/60">
                        {(gradesMap[`${course._id}_${field._id}`] || []).map((grade) => (
                          <div key={grade._id}>
                            <button
                              onClick={async () => {
                                if (expandedGrade === grade._id) {
                                  setExpandedGrade(null)
                                  return
                                }
                                setExpandedGrade(grade._id)
                                await fetchBooks(grade._id)
                              }}
                              className="w-full flex items-center justify-between px-12 py-3 hover:bg-slate-800/30 text-right transition border-b border-slate-800/30"
                            >
                              <span className="text-xs text-slate-300 font-medium">{grade.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {(grade.totalQuestions || 0).toLocaleString('fa-IR')} سوال
                                </span>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className={`text-slate-500 transition-transform ${
                                    expandedGrade === grade._id ? 'rotate-180 text-indigo-400' : ''
                                  }`}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                            </button>

                            {expandedGrade === grade._id && (
                              <div className="bg-slate-950/90 divide-y divide-slate-800/30">
                                {(booksMap[grade._id] || []).map((book) => (
                                  <button
                                    key={book._id}
                                    onClick={() =>
                                      onLessonClick?.(
                                        course._id,
                                        course.name,
                                        field._id,
                                        field.name,
                                        grade._id,
                                        grade.name,
                                        book._id,
                                        book.name
                                      )
                                    }
                                    className="w-full flex items-center justify-between px-16 py-3 hover:bg-indigo-600/10 text-right transition group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-base group-hover:scale-110 transition">{book.icon || '📖'}</span>
                                      <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300 transition">
                                        {book.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono border border-slate-700/60">
                                        {(book.totalQuestions || 0).toLocaleString('fa-IR')} سوال
                                      </span>
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-slate-500 group-hover:text-indigo-400 group-hover:-translate-x-1 transition"
                                      >
                                        <polyline points="9 18 15 12 9 6" />
                                      </svg>
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
