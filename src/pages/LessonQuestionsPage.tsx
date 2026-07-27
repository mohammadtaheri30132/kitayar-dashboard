import { useEffect, useState } from 'react'
import { questionService } from '../services/questionService'
import type { QuestionData } from '../services/questionService'
import toast from 'react-hot-toast'

interface Props {
  courseName?: string
  gradeName?: string
  subjectName?: string
  bookId?: string
  onBack?: () => void
  onCreateQuestion?: () => void
  onEditQuestion?: (q: QuestionData) => void
}

const TYPE_STYLES: Record<string, string> = {
  'تستی': 'bg-blue-50 text-blue-700',
  'جاخالی': 'bg-orange-50 text-orange-700',
  'صحیح-غلط': 'bg-purple-50 text-purple-700',
  'کوتاه-پاسخ': 'bg-green-50 text-green-700',
  'گسترده-پاسخ': 'bg-teal-50 text-teal-700',
  'جورکردنی': 'bg-pink-50 text-pink-700',
  'انتخاب-کلمه': 'bg-cyan-50 text-cyan-700',
  'ترکیبی': 'bg-indigo-50 text-indigo-700',
}

const DIFFICULTY_STYLES: Record<string, string> = {
  'ساده': 'text-green-600',
  'متوسط': 'text-yellow-600',
  'دشوار': 'text-red-600',
}

const LessonQuestionsPage = ({
  courseName = '',
  gradeName = '',
  subjectName = '',
  bookId,
  onBack,
  onCreateQuestion,
  onEditQuestion,
}: Props) => {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('همه')
  const [filterUnanswered, setFilterUnanswered] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (bookId) fetchQuestions()
  }, [bookId, page, filterType, filterUnanswered])

  const fetchQuestions = async () => {
    if (!bookId) return
    setIsLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (filterType !== 'همه') params.type = filterType
      if (search) params.search = search
      const res = await questionService.getByBook(bookId, params)
      if (res.success) {
        let data = res.data
        if (filterUnanswered) {
          data = data.filter(
            (q: any) =>
              !q.answer || q.answer === '' || q.answer === '<p dir="rtl"></p>'
          )
        }
        setQuestions(data)
        setTotalPages(Math.ceil(res.total / 20))
        setTotal(res.total)
      }
    } catch {
      toast.error('❌ خطا')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ آیا از حذف این سوال اطمینان دارید؟')) return
    try {
      await questionService.delete(id)
      toast.success('✅ حذف شد')
      fetchQuestions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || '❌ خطا')
    }
  }

  const stripHtml = (html: string) => {
    if (!html) return ''
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || ''
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )
    }

    if (questions.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-gray-500">سوالی یافت نشد</p>
          {filterUnanswered && (
            <button onClick={() => setFilterUnanswered(false)} className="mt-4 text-primary-500 text-sm hover:underline">
              نمایش همه سوالات
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b text-xs font-bold text-gray-500">
          <div className="col-span-1">#</div>
          <div className="col-span-4">صورت سوال</div>
          <div className="col-span-2">نوع</div>
          <div className="col-span-2">سختی</div>
          <div className="col-span-1">تاریخ</div>
          <div className="col-span-2">عملیات</div>
        </div>
        {questions.map((q: any, idx: number) => (
          <div
            key={q._id}
            className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 hover:bg-gray-50/50 items-center text-sm"
          >
            <div className="col-span-1 text-gray-400">{(page - 1) * 20 + idx + 1}</div>
            <div
              onClick={() => {
                setSelectedQuestion(q)
                setShowPreview(true)
              }}
              className="col-span-4 text-gray-800 truncate cursor-pointer hover:text-primary-600 font-medium"
            >
              {stripHtml(q.question).substring(0, 70)}
              {q.is_composite && (
                <span className="text-indigo-500 mr-1 text-xs">🔗{q.sub?.length || 0}</span>
              )}
              {(!q.answer || q.answer === '') && !q.is_composite && (
                <span className="text-red-400 mr-1">⚠️</span>
              )}
            </div>
            <div className="col-span-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[q.type] || 'bg-gray-50'}`}>
                {q.type}
              </span>
            </div>
            <div className={`col-span-2 text-xs font-medium ${DIFFICULTY_STYLES[q.difficulty] || ''}`}>
              {q.difficulty}
            </div>
            <div className="col-span-1 text-xs text-gray-400">
              {q.createdAt ? new Date(q.createdAt).toLocaleDateString('fa-IR') : '-'}
            </div>
            <div className="col-span-2 flex gap-1.5">
              <button
                onClick={() => {
                  setSelectedQuestion(q)
                  setShowPreview(true)
                }}
                className="text-primary-500 hover:bg-primary-50 px-2 py-1 rounded text-xs"
              >
                👁️
              </button>
              <button
                onClick={() => onEditQuestion?.(q)}
                className="text-green-500 hover:bg-green-50 px-2 py-1 rounded text-xs"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(q._id)}
                className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const previewQ = selectedQuestion as any
  const hasSub = previewQ?.is_composite && previewQ?.sub?.length > 0

  return (
    <div className="max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        {onBack && (
          <button onClick={onBack} className="hover:text-gray-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
        <span>{courseName}</span>
        <span>/</span>
        <span>{gradeName}</span>
        <span>/</span>
        <span className="text-gray-600 font-medium">{subjectName}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{subjectName}</h2>
          <p className="text-sm text-gray-500">{total} سوال</p>
        </div>
        <button
          onClick={onCreateQuestion}
          className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 shadow-sm"
        >
          + افزودن سوال
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            fetchQuestions()
          }}
          className="flex-1 min-w-[200px] flex gap-2"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600"
          >
            جستجو
          </button>
        </form>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none"
        >
          <option value="همه">همه</option>
          <option value="تستی">تستی</option>
          <option value="جاخالی">جای خالی</option>
          <option value="صحیح-غلط">صحیح/غلط</option>
          <option value="کوتاه-پاسخ">کوتاه پاسخ</option>
          <option value="گسترده-پاسخ">تشریحی</option>
          <option value="جورکردنی">جورکردنی</option>
          <option value="انتخاب-کلمه">انتخاب کلمه</option>
          <option value="ترکیبی">ترکیبی</option>
        </select>
        <button
          onClick={() => {
            setFilterUnanswered(!filterUnanswered)
            setPage(1)
          }}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
            filterUnanswered
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {filterUnanswered ? '🔴 بی‌پاسخ' : '⚪ بی‌پاسخ'}
        </button>
      </div>

      {renderContent()}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {getPageNumbers().map((p, i) =>
            typeof p === 'string' ? (
              <span key={i} className="w-9 h-9 flex items-center justify-center text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${
                  page === p ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      <div className="text-center mt-2 text-xs text-gray-400">
        صفحه {page} از {totalPages} | مجموع: {total} سوال
      </div>

      {showPreview && selectedQuestion && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowPreview(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-[90%] max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
            dir="rtl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[previewQ.type] || 'bg-gray-50'}`}>
                  {previewQ.type}
                </span>
                <span className={`mr-2 text-xs font-medium ${DIFFICULTY_STYLES[previewQ.difficulty] || ''}`}>
                  {previewQ.difficulty}
                </span>
                {hasSub && (
                  <span className="mr-2 text-xs text-indigo-500">{previewQ.sub.length} زیرسوال</span>
                )}
              </div>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            <div
              className="mb-4 p-4 bg-gray-50 rounded-xl text-sm leading-loose"
              dangerouslySetInnerHTML={{ __html: previewQ.question }}
            />

            {hasSub && (
              <div className="mb-4 space-y-3">
                <p className="text-xs font-bold text-indigo-600 mb-2">🔗 زیرسوالات:</p>
                {previewQ.sub.map((sub: any, si: number) => (
                  <div key={si} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-md flex items-center justify-center text-xs font-bold">
                        {sub.sub_id}
                      </span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{sub.type}</span>
                    </div>
                    <div className="text-sm mb-2" dangerouslySetInnerHTML={{ __html: sub.question }} />
                    {sub.options?.length > 0 && (
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {sub.options.map((opt: string, oi: number) => (
                          <span
                            key={oi}
                            className={`px-2 py-1 rounded text-xs ${
                              opt === sub.answer
                                ? 'bg-green-200 text-green-800 font-medium'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      پاسخ:{' '}
                      <span
                        className="text-gray-800 font-medium"
                        dangerouslySetInnerHTML={{ __html: sub.answer }}
                      />
                    </div>
                    {sub.page_number?.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        صفحات: {sub.page_number.join('، ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!hasSub && previewQ.options?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2">گزینه‌ها:</p>
                <div className="space-y-2">
                  {previewQ.options.map((opt: string, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm ${
                        opt === previewQ.answer
                          ? 'bg-green-50 border border-green-300 font-medium text-green-800'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {i + 1}. {opt} {opt === previewQ.answer && '✅'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasSub && (
              <div className="p-4 bg-gray-800 text-gray-200 rounded-xl text-xs font-mono" dir="ltr">
                <span className="text-gray-400">answer:</span> {previewQ.answer || '(خالی)'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonQuestionsPage
