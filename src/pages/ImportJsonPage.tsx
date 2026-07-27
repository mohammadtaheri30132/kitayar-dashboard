import { useState, useRef, useEffect } from 'react'
import { questionService } from '../services/questionService'
import { courseService, fieldService, gradeService, bookService } from '../services/courseService'
import type { CourseData, FieldData, GradeData, BookData } from '../services/courseService'
import SelectField from '../components/SelectField'
import toast from 'react-hot-toast'

interface FailedItem {
  index: number
  question_id: string
  type: string
  question: string
  fullJson: string
  reason: string
  errorType: string
}

type ErrorTab = 'all' | 'duplicate' | 'validation' | 'other'

interface Props { onBack?: () => void }

const ImportJsonPage = ({ onBack }: Props) => {
  const [dragOver, setDragOver] = useState(false)
  const [jsonContent, setJsonContent] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [failedItems, setFailedItems] = useState<FailedItem[]>([])
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set())
  const [errorTab, setErrorTab] = useState<ErrorTab>('all')

  const [courses, setCourses] = useState<CourseData[]>([])
  const [fields, setFields] = useState<FieldData[]>([])
  const [grades, setGrades] = useState<GradeData[]>([])
  const [books, setBooks] = useState<BookData[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedBook, setSelectedBook] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { courseService.getAll().then(res => { if (res.success) setCourses(res.data) }).catch(() => {}) }, [])
  useEffect(() => { if (!selectedCourse) { setFields([]); return }; fieldService.getByCourse(selectedCourse).then(res => { if (res.success) { setFields(res.data); if (res.data.length === 1 && !selectedField) setSelectedField(res.data[0]._id) } }).catch(() => {}) }, [selectedCourse])
  useEffect(() => { if (!selectedField || !selectedCourse) { setGrades([]); return }; gradeService.getByCourse(selectedCourse, selectedField).then(res => { if (res.success) setGrades(res.data) }).catch(() => {}) }, [selectedField, selectedCourse])
  useEffect(() => { if (!selectedGrade) { setBooks([]); return }; bookService.getByGrade(selectedGrade).then(res => { if (res.success) setBooks(res.data) }).catch(() => {}) }, [selectedGrade])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonContent(content)
      try {
        const data = JSON.parse(content)
        const arr = Array.isArray(data) ? data : [data]
        setParsedData(arr)
        setParseError(null)
        setImportResult(null)
        setFailedItems([])
        setExpandedErrors(new Set())
        setErrorTab('all')
      } catch { setParseError('❌ فرمت JSON نامعتبر است'); setParsedData(null) }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/json' || file?.name.endsWith('.json')) handleFile(file)
    else toast.error('⚠️ فقط فایل JSON مجاز است')
  }

  const handleImport = async () => {
    if (!parsedData || !selectedBook) { toast.error('⚠️ درس مقصد را انتخاب کنید'); return }
    setImporting(true); setFailedItems([]); setExpandedErrors(new Set()); setErrorTab('all')
    try {
      const res = await questionService.importBatch(parsedData, selectedBook)
      if (res.success) {
        setImportResult(res.data || res)
        if (res.data?.failedItems?.length > 0) {
          setFailedItems(res.data.failedItems)
          toast(`${res.data.success} موفق, ${res.data.failed} ناموفق`, { icon: '⚠️' })
        } else {
          toast.success(`✅ همه ${res.data?.success || 0} سوال import شدند`)
        }
      }
    } catch (err: any) { toast.error(err.response?.data?.message || '❌ خطا') }
    finally { setImporting(false) }
  }

  const toggleExpand = (idx: number) => {
    const next = new Set(expandedErrors)
    next.has(idx) ? next.delete(idx) : next.add(idx)
    setExpandedErrors(next)
  }

  const getStats = () => {
    if (!parsedData) return null
    const types: Record<string, number> = {}
    const difficulties: Record<string, number> = {}
    let composites = 0
    parsedData.forEach(q => {
      const hasSub = q.sub && Array.isArray(q.sub) && q.sub.length > 0
      const t = hasSub ? 'ترکیبی' : (q.type || 'نامشخص')
      types[t] = (types[t] || 0) + 1
      difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1
      if (hasSub) composites++
    })
    return { total: parsedData.length, composites, types, difficulties }
  }

  const stats = getStats()

  // فیلتر خطاها بر اساس تب
  const filteredErrors = failedItems.filter(item => {
    if (errorTab === 'all') return true
    if (errorTab === 'duplicate') return item.errorType === 'DUPLICATE_ID' || item.errorType === 'DUPLICATE_CONTENT' || item.errorType === 'DUPLICATE_KEY'
    if (errorTab === 'validation') return ['VALIDATION', 'EMPTY_QUESTION', 'INVALID_TYPE', 'INVALID_DIFFICULTY', 'BOOK_NOT_FOUND'].includes(item.errorType)
    if (errorTab === 'other') return !['DUPLICATE_ID', 'DUPLICATE_CONTENT', 'DUPLICATE_KEY', 'VALIDATION', 'EMPTY_QUESTION'].includes(item.errorType)
    return true
  })

  const duplicateCount = failedItems.filter(f => f.errorType === 'DUPLICATE_ID' || f.errorType === 'DUPLICATE_CONTENT' || f.errorType === 'DUPLICATE_KEY').length
  const validationCount = failedItems.filter(f => f.errorType === 'VALIDATION' || f.errorType === 'EMPTY_QUESTION').length
  const otherCount = failedItems.length - duplicateCount - validationCount

  const renderErrorItem = (item: FailedItem, idx: number) => {
    const isExpanded = expandedErrors.has(idx)
    const isDuplicate = item.errorType === 'DUPLICATE_ID' || item.errorType === 'DUPLICATE_CONTENT' || item.errorType === 'DUPLICATE_KEY'
    const isValidation = item.errorType === 'VALIDATION' || item.errorType === 'EMPTY_QUESTION'

    const bgColor = isDuplicate ? 'border-orange-300 bg-orange-50 hover:bg-orange-100' :
      isValidation ? 'border-red-300 bg-red-50 hover:bg-red-100' :
      'border-red-200 bg-red-50 hover:bg-red-100'

    const icon = isDuplicate ? '🔄' : isValidation ? '⚠️' : '❌'
    const badgeColor = isDuplicate ? 'bg-orange-100 text-orange-700' :
      isValidation ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'

    return (
      <div key={idx} className={`border rounded-xl overflow-hidden transition-colors ${bgColor}`}>
        <button onClick={() => toggleExpand(idx)} className="w-full flex items-center justify-between p-4 text-right">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-lg shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-gray-500">#{item.index}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>{item.type}</span>
                {item.question_id !== 'بدون شناسه' && (
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">{item.question_id}</span>
                )}
              </div>
              <p className="text-sm text-gray-700 truncate">{item.question}</p>
              <p className="text-xs mt-1 font-medium text-red-600">{item.reason}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`shrink-0 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isExpanded && (
          <div className="border-t border-gray-300 p-4 bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">📋 JSON کامل:</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(item.fullJson)
                  toast.success('📋 کپی شد')
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                📋 کپی JSON
              </button>
            </div>
            <pre className="text-xs text-green-400 font-mono overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed">
              {item.fullJson}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        {onBack && <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>}
        <div><h2 className="text-2xl font-bold text-gray-800">وارد کردن سوالات از JSON</h2><p className="text-sm text-gray-500">فایل JSON را آپلود و درس مقصد را انتخاب کنید</p></div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4">📚 درس مقصد</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField label="دوره" icon="📚" options={courses.map(c => ({ value: c._id, label: c.name }))} value={selectedCourse} onChange={v => { setSelectedCourse(v); setSelectedField(''); setSelectedGrade(''); setSelectedBook('') }} placeholder="دوره" />
          <SelectField label="رشته" icon="🎯" options={fields.map(f => ({ value: f._id, label: f.name }))} value={selectedField} onChange={v => { setSelectedField(v); setSelectedGrade(''); setSelectedBook('') }} placeholder="رشته" disabled={!selectedCourse || (fields.length <= 1 && !!selectedField)} />
          <SelectField label="پایه" icon="🏫" options={grades.map(g => ({ value: g._id, label: g.name }))} value={selectedGrade} onChange={v => { setSelectedGrade(v); setSelectedBook('') }} placeholder="پایه" disabled={!selectedField} />
          <SelectField label="درس" icon="📖" options={books.map(b => ({ value: b._id, label: b.name }))} value={selectedBook} onChange={setSelectedBook} placeholder="درس" disabled={!selectedGrade} />
        </div>
      </div>

      {!jsonContent ? (
        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${dragOver ? 'border-primary-400 bg-primary-50/50 scale-[1.01]' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'}`}>
          <span className="text-6xl mb-4 block">📁</span>
          <h3 className="text-lg font-bold text-gray-700 mb-2">فایل JSON را اینجا رها کنید</h3>
          <p className="text-sm text-gray-500">یا برای انتخاب فایل کلیک کنید</p>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* آمار فایل */}
          {stats && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3"><span className="text-blue-600 text-xl">📊</span><span className="font-medium text-blue-800">{stats.total} سوال {stats.composites > 0 && `(${stats.composites} ترکیبی)`}</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">انواع:</p>
                  {Object.entries(stats.types).slice(0, 5).map(([t, c]) => <div key={t} className="text-gray-700 text-xs">• {t}: {c}</div>)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">سختی:</p>
                  {Object.entries(stats.difficulties).map(([d, c]) => <div key={d} className="text-gray-700 text-xs">• {d}: {c}</div>)}
                </div>
              </div>
            </div>
          )}

          {/* نتیجه ایمپورت */}
          {importResult && (
            <div className={`rounded-xl p-5 ${importResult.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{importResult.failed > 0 ? '⚠️' : '✅'}</span>
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {importResult.success} <span className="text-green-600">موفق</span>
                    {importResult.failed > 0 && <> / {importResult.failed} <span className="text-red-600">ناموفق</span></>}
                  </div>
                  <div className="text-sm text-gray-500">از {importResult.total} سوال کل</div>
                </div>
              </div>
              {importResult.failed > 0 && (
                <div className="flex gap-3 text-xs">
                  {duplicateCount > 0 && <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">🔄 {duplicateCount} تکراری</span>}
                  {validationCount > 0 && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full">⚠️ {validationCount} اعتبارسنجی</span>}
                  {otherCount > 0 && <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">❌ {otherCount} سایر</span>}
                </div>
              )}
            </div>
          )}

          {/* تب‌های خطاها */}
          {failedItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* هدر با تب‌ها */}
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700">❌ خطاهای ایمپورت ({failedItems.length})</h3>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button
                    onClick={() => setErrorTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      errorTab === 'all'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    همه ({failedItems.length})
                  </button>
                  {duplicateCount > 0 && (
                    <button
                      onClick={() => setErrorTab('duplicate')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        errorTab === 'duplicate'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'
                      }`}
                    >
                      🔄 تکراری ({duplicateCount})
                    </button>
                  )}
                  {validationCount > 0 && (
                    <button
                      onClick={() => setErrorTab('validation')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        errorTab === 'validation'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
                      }`}
                    >
                      ⚠️ اعتبارسنجی ({validationCount})
                    </button>
                  )}
                  {otherCount > 0 && (
                    <button
                      onClick={() => setErrorTab('other')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        errorTab === 'other'
                          ? 'bg-gray-700 text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      ❌ سایر ({otherCount})
                    </button>
                  )}
                </div>
              </div>

              {/* لیست خطاها */}
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {filteredErrors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <span className="text-3xl block mb-2">✅</span>
                    موردی در این دسته وجود ندارد
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredErrors.map((item, idx) => renderErrorItem(item, idx))}
                  </div>
                )}
              </div>

              {/* فوتر */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {errorTab === 'all' && `${failedItems.length} خطا`}
                  {errorTab === 'duplicate' && `${duplicateCount} تکراری`}
                  {errorTab === 'validation' && `${validationCount} اعتبارسنجی`}
                  {errorTab === 'other' && `${otherCount} سایر`}
                </span>
                <button
                  onClick={() => {
                    const json = filteredErrors.map(e => JSON.parse(e.fullJson))
                    navigator.clipboard.writeText(JSON.stringify(json, null, 2))
                    toast.success('📋 JSON خطاها کپی شد')
                  }}
                  className="text-primary-500 hover:underline"
                >
                  📋 کپی JSON همه خطاهای این تب
                </button>
              </div>
            </div>
          )}

          {/* پیش‌نمایش */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">پیش‌نمایش فایل</span>
              <button onClick={() => { setJsonContent(null); setParsedData(null); setParseError(null); setImportResult(null); setFailedItems([]) }} className="text-xs text-red-500 hover:underline">حذف فایل</button>
            </div>
            <pre className="p-4 text-sm font-mono text-gray-700 overflow-x-auto max-h-60" dir="ltr">{jsonContent.substring(0, 1500)}{jsonContent.length > 1500 ? '\n...' : ''}</pre>
          </div>

          {/* دکمه import */}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setJsonContent(null); setParsedData(null); setParseError(null); setImportResult(null); setFailedItems([]) }} className="px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">انصراف</button>
            <button onClick={handleImport} disabled={!selectedBook || !parsedData || importing}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${!selectedBook || !parsedData || importing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'}`}>
              {importing ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> در حال import...</> : '🚀 شروع import'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportJsonPage
