import { useEffect, useState, useMemo } from 'react'
import { questionService } from '../services/questionService'
import type { QuestionData } from '../services/questionService'
import toast from 'react-hot-toast'

interface Props {
  courseName?: string; gradeName?: string; subjectName?: string; bookId?: string
  onBack?: () => void; onCreateQuestion?: () => void; onEditQuestion?: (q: QuestionData) => void
}

const TYPE_STYLES: Record<string, string> = {
  'تستی': 'bg-blue-50 text-blue-700', 'جاخالی': 'bg-orange-50 text-orange-700',
  'صحیح-غلط': 'bg-purple-50 text-purple-700', 'کوتاه-پاسخ': 'bg-green-50 text-green-700',
  'گسترده-پاسخ': 'bg-teal-50 text-teal-700', 'جورکردنی': 'bg-pink-50 text-pink-700',
  'انتخاب-کلمه': 'bg-cyan-50 text-cyan-700', 'ترکیبی': 'bg-indigo-50 text-indigo-700',
}
const DIFFICULTY_STYLES: Record<string, string> = { 'ساده': 'text-green-600', 'متوسط': 'text-yellow-600', 'دشوار': 'text-red-600' }
const STATUS_STYLES: Record<string, string> = {
  'در-حال-بررسی': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'تایید-شده': 'bg-green-100 text-green-700 border-green-300',
  'مشکل-دار': 'bg-red-100 text-red-700 border-red-300',
}
const STATUS_LABELS: Record<string, string> = { 'در-حال-بررسی': 'در حال بررسی', 'تایید-شده': 'تایید شده', 'مشکل-دار': 'مشکل دار' }

const LessonQuestionsPage = ({ courseName = '', gradeName = '', subjectName = '', bookId, onBack, onCreateQuestion, onEditQuestion }: Props) => {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('همه')
  const [filterStatus, setFilterStatus] = useState('همه')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // تیک‌ها
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [selectAllBook, setSelectAllBook] = useState(false)

  // نمایش پاسخ درجا
  const [showAnswers, setShowAnswers] = useState(false)

  // Batch action modal
  const [batchMode, setBatchMode] = useState<'status' | 'tag' | 'delete' | null>(null)
  const [batchValue, setBatchValue] = useState('')

  // preview
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { if (bookId) fetchQuestions() }, [bookId, page, filterType, filterStatus])

  const fetchQuestions = async () => {
    if (!bookId) return
    setIsLoading(true)
    try {
      const params: any = { page, limit: 50 }
      if (filterType !== 'همه') params.type = filterType
      if (filterStatus !== 'همه') params.status = filterStatus
      if (search) params.search = search
      const res = await questionService.getByBook(bookId, params)
      if (res.success) { setQuestions(res.data); setTotalPages(res.totalPages); setTotal(res.total) }
    } catch { toast.error('❌ خطا') } finally { setIsLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ حذف؟')) return
    try { await questionService.delete(id); toast.success('✅ حذف شد'); fetchQuestions() } catch (e: any) { toast.error(e.response?.data?.message || '❌ خطا') }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await questionService.updateStatus(id, status); toast.success('✅ وضعیت تغییر کرد'); fetchQuestions() } catch (e: any) { toast.error('❌ خطا') }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
    setSelectAll(false); setSelectAllBook(false)
  }

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false) }
    else { setSelectedIds(new Set(questions.map(q => q._id!))); setSelectAll(true) }
  }

  const toggleSelectAllBook = async () => {
    if (selectAllBook) { setSelectedIds(new Set()); setSelectAllBook(false); return }
    toast.success('⏳ در حال انتخاب همه سوالات این درس...')
    try {
      const res = await questionService.getByBook(bookId!, { limit: 9999 })
      if (res.success) { setSelectedIds(new Set(res.data.map((q: any) => q._id!))); setSelectAllBook(true); setSelectAll(true) }
    } catch { toast.error('❌ خطا') }
  }

  const handleBatchAction = async () => {
    if (selectedIds.size === 0) { toast.error('⚠️ هیچ سوالی انتخاب نشده'); return }
    if (batchMode === 'delete') {
      if (!confirm(`⚠️ ${selectedIds.size} سوال حذف شوند؟`)) return
      try { await questionService.batchUpdate(Array.from(selectedIds), 'delete'); toast.success('✅ حذف شدند'); setSelectedIds(new Set()); setSelectAll(false); setSelectAllBook(false); fetchQuestions() } catch (e: any) { toast.error('❌ خطا') }
    } else if (batchMode === 'status' && batchValue) {
      try { await questionService.batchUpdate(Array.from(selectedIds), 'status', batchValue); toast.success('✅ وضعیت تغییر کرد'); setSelectedIds(new Set()); setBatchMode(null); fetchQuestions() } catch (e: any) { toast.error('❌ خطا') }
    } else if (batchMode === 'tag' && batchValue) {
      try { await questionService.batchUpdate(Array.from(selectedIds), 'add-tag', batchValue); toast.success('✅ تگ اضافه شد'); setSelectedIds(new Set()); setBatchMode(null); setBatchValue(''); fetchQuestions() } catch (e: any) { toast.error('❌ خطا') }
    }
  }

  const stripHtml = (html: string) => { if (!html) return ''; const d = document.createElement('div'); d.innerHTML = html; return d.textContent || '' }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else { pages.push(1); if (page > 3) pages.push('...'); const s = Math.max(2, page - 1), e = Math.min(totalPages - 1, page + 1); for (let i = s; i <= e; i++) pages.push(i); if (page < totalPages - 2) pages.push('...'); pages.push(totalPages) }
    return pages
  }

  const renderAnswer = (q: any) => {
    if (q.is_composite && q.sub?.length > 0) {
      return (
        <div className="space-y-2 mt-2">
          {q.sub.map((s: any, si: number) => (
            <div key={si} className="bg-indigo-50 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 bg-indigo-500 text-white rounded flex items-center justify-center text-[10px] font-bold">{s.sub_id}</span>
                <span className="text-indigo-600">{s.type}</span>
              </div>
              <div className="mb-1" dangerouslySetInnerHTML={{ __html: s.question }} />
              <div className="text-gray-600">پاسخ: <span className="font-medium" dangerouslySetInnerHTML={{ __html: s.answer || '—' }} /></div>
            </div>
          ))}
        </div>
      )
    }
    if (q.type === 'جورکردنی') {
      return (
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div className="space-y-1">{(q.matching_left || []).map((l: string, i: number) => <div key={i} className="bg-blue-50 rounded px-2 py-1">{l}</div>)}</div>
          <div className="space-y-1">{(q.matching_right || []).map((r: string, i: number) => <div key={i} className="bg-green-50 rounded px-2 py-1">{r}</div>)}</div>
        </div>
      )
    }
    if (q.options?.length > 0) {
      return (
        <div className="flex gap-2 mt-2 flex-wrap">
          {q.options.map((opt: string, i: number) => (
            <span key={i} className={`px-2 py-0.5 rounded text-xs ${opt === q.answer ? 'bg-green-200 text-green-800 font-bold' : 'bg-gray-100 text-gray-600'}`}>{opt}</span>
          ))}
        </div>
      )
    }
    return <div className="mt-2 text-xs text-gray-600">پاسخ: <span className="font-medium" dangerouslySetInnerHTML={{ __html: q.answer || '—' }} /></div>
  }

  return (
    <div className="max-w-full mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        {onBack && <button onClick={onBack} className="hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>}
        <span>{courseName}</span><span>/</span><span>{gradeName}</span><span>/</span><span className="text-gray-600 font-medium">{subjectName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-2xl font-bold text-gray-800">{subjectName}</h2><p className="text-sm text-gray-500">{total} سوال</p></div>
        <button onClick={onCreateQuestion} className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 shadow-sm">+ افزودن سوال</button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 mb-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchQuestions() }} className="flex gap-2 flex-1 min-w-[200px]">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500/20" />
          <button type="submit" className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm">جستجو</button>
        </form>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          <option value="همه">همه انواع</option>
          <option value="تستی">تستی</option><option value="جاخالی">جای خالی</option><option value="صحیح-غلط">صحیح/غلط</option>
          <option value="کوتاه-پاسخ">کوتاه پاسخ</option><option value="گسترده-پاسخ">تشریحی</option><option value="جورکردنی">جورکردنی</option>
          <option value="انتخاب-کلمه">انتخاب کلمه</option><option value="ترکیبی">ترکیبی</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          <option value="همه">همه وضعیت‌ها</option>
          <option value="در-حال-بررسی">در حال بررسی</option>
          <option value="تایید-شده">تایید شده</option>
          <option value="مشکل-دار">مشکل دار</option>
        </select>
        <button onClick={() => setShowAnswers(!showAnswers)} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showAnswers ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          {showAnswers ? '📋 مخفی کردن پاسخ‌ها' : '📋 نمایش پاسخ‌ها'}
        </button>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-primary-700">{selectedIds.size} سوال انتخاب شده</span>
          <button onClick={() => { setBatchMode('delete'); setBatchValue('') }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">🗑️ حذف</button>
          <button onClick={() => { setBatchMode('status'); setBatchValue('تایید-شده') }} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">✅ تایید</button>
          <button onClick={() => { setBatchMode('status'); setBatchValue('مشکل-دار') }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">❌ مشکل دار</button>
          <button onClick={() => { setBatchMode('status'); setBatchValue('در-حال-بررسی') }} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600">⏳ در حال بررسی</button>
          <button onClick={() => setBatchMode('tag')} className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800">🏷️ افزودن تگ</button>
          <button onClick={() => { setSelectedIds(new Set()); setSelectAll(false); setSelectAllBook(false) }} className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-xs">✕ لغو</button>
        </div>
      )}

      {/* Batch Modal */}
      {batchMode && batchMode !== 'delete' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="text-sm font-bold">
            {batchMode === 'status' ? 'تغییر وضعیت به:' : 'افزودن تگ:'}
          </span>
          {batchMode === 'status' ? (
            <select value={batchValue} onChange={e => setBatchValue(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="تایید-شده">✅ تایید شده</option>
              <option value="مشکل-دار">❌ مشکل دار</option>
              <option value="در-حال-بررسی">⏳ در حال بررسی</option>
            </select>
          ) : (
            <input value={batchValue} onChange={e => setBatchValue(e.target.value)} placeholder="نام تگ..." className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          )}
          <button onClick={handleBatchAction} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium">اعمال</button>
          <button onClick={() => { setBatchMode(null); setBatchValue('') }} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">انصراف</button>
        </div>
      )}

      {/* Select All Buttons */}
      <div className="flex gap-3 mb-3 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
          <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-primary-500" />
          همه این صفحه ({questions.length})
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
          <input type="checkbox" checked={selectAllBook} onChange={toggleSelectAllBook} className="w-4 h-4 rounded accent-primary-500" />
          همه سوالات این درس ({total})
        </label>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300"><span className="text-5xl mb-4 block">📭</span><p className="text-gray-500">سوالی یافت نشد</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-bold text-gray-500">
                  <th className="w-10 py-3 px-2 text-center">#</th>
                  <th className="w-8 py-3 px-1 text-center"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded accent-primary-500" /></th>
                  <th className="py-3 px-3 text-right">صورت سوال</th>
                  <th className="py-3 px-2 text-center w-20">نوع</th>
                  <th className="py-3 px-2 text-center w-16">سختی</th>
                  <th className="py-3 px-2 text-center w-24">وضعیت</th>
                  <th className="py-3 px-2 text-center w-16">تگ‌ها</th>
                  <th className="py-3 px-2 text-center w-16">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any, idx: number) => (
                  <tr key={q._id} className={`border-b border-gray-100 hover:bg-gray-50/50 text-sm ${selectedIds.has(q._id) ? 'bg-primary-50/50' : ''}`}>
                    <td className="py-3 px-2 text-center text-gray-400 text-xs">{(page - 1) * 50 + idx + 1}</td>
                    <td className="py-3 px-1 text-center">
                      <input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => toggleSelect(q._id)} className="w-3.5 h-3.5 rounded accent-primary-500" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="cursor-pointer hover:text-primary-600 font-medium text-gray-800" onClick={() => { setSelectedQuestion(q); setShowPreview(true) }}>
                        {stripHtml(q.question).substring(0, 100)}{stripHtml(q.question).length > 100 ? '...' : ''}
                        {q.is_composite && <span className="text-indigo-500 mr-1 text-xs">🔗{q.sub?.length || 0}</span>}
                      </div>
                      {showAnswers && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {renderAnswer(q)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_STYLES[q.type] || 'bg-gray-50'}`}>{q.type}</span></td>
                    <td className={`py-3 px-2 text-center text-xs font-medium ${DIFFICULTY_STYLES[q.difficulty] || ''}`}>{q.difficulty}</td>
                    <td className="py-3 px-2 text-center">
                      <select value={q.status || 'در-حال-بررسی'} onChange={e => handleStatusChange(q._id, e.target.value)}
                        className={`text-[10px] px-1.5 py-1 rounded-full border font-medium cursor-pointer outline-none ${STATUS_STYLES[q.status || 'در-حال-بررسی']}`}>
                        <option value="در-حال-بررسی">⏳ در حال بررسی</option>
                        <option value="تایید-شده">✅ تایید شده</option>
                        <option value="مشکل-دار">❌ مشکل دار</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(q.tags || []).slice(0, 2).map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{t}</span>
                        ))}
                        {(q.tags || []).length > 2 && <span className="text-[10px] text-gray-400">+{q.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => { setSelectedQuestion(q); setShowPreview(true) }} className="text-primary-500 hover:bg-primary-50 px-1.5 py-0.5 rounded text-xs">👁️</button>
                        <button onClick={() => onEditQuestion?.(q)} className="text-green-500 hover:bg-green-50 px-1.5 py-0.5 rounded text-xs">✏️</button>
                        <button onClick={() => handleDelete(q._id)} className="text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded text-xs">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
          {getPageNumbers().map((p, i) => typeof p === 'string' ? <span key={i} className="w-9 h-9 flex items-center justify-center text-gray-400">...</span> : <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>{p}</button>)}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>
        </div>
      )}

      <div className="text-center mt-2 text-xs text-gray-400">صفحه {page} از {totalPages} | مجموع: {total} سوال | هر صفحه: ۵۰ سوال</div>

      {/* Preview Modal */}
      {showPreview && selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowPreview(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-[90%] max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl" dir="rtl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[(selectedQuestion as any).type] || 'bg-gray-50'}`}>{(selectedQuestion as any).type}</span>
                <span className={`mr-2 text-xs font-medium ${DIFFICULTY_STYLES[(selectedQuestion as any).difficulty] || ''}`}>{(selectedQuestion as any).difficulty}</span>
                <span className={`mr-2 px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLES[(selectedQuestion as any).status || 'در-حال-بررسی']}`}>{STATUS_LABELS[(selectedQuestion as any).status || 'در-حال-بررسی']}</span>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-xl text-sm leading-loose" dangerouslySetInnerHTML={{ __html: (selectedQuestion as any).question }} />
            {renderAnswer(selectedQuestion)}
            {((selectedQuestion as any).page_number?.length > 0) && <div className="mt-3 text-xs text-gray-400">صفحات: {(selectedQuestion as any).page_number.join('، ')}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonQuestionsPage
