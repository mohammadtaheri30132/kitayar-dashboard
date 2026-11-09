import { useEffect, useState } from 'react'
import { questionService } from '../services/questionService'
import type { QuestionData } from '../services/questionService'
import toast from 'react-hot-toast'

interface Props {
  courseId?: string; courseName?: string
  fieldId?: string; fieldName?: string
  gradeId?: string; gradeName?: string
  bookId?: string; subjectName?: string
  onBack?: () => void
  onCreateQuestion?: () => void
  onEditQuestion?: (q: QuestionData) => void
  onViewQuestion?: (q: QuestionData) => void
}

const TYPE_STYLES: Record<string, string> = {
  'تستی': 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  'جاخالی': 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  'صحیح-غلط': 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  'کوتاه-پاسخ': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  'گسترده-پاسخ': 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
  'جورکردنی': 'bg-pink-500/15 text-pink-300 border border-pink-500/30',
  'انتخاب-کلمه': 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
}
const DIFFICULTY_STYLES: Record<string, string> = {
  'ساده': 'text-emerald-400',
  'متوسط': 'text-amber-400',
  'دشوار': 'text-rose-400',
}
const STATUS_STYLES: Record<string, string> = {
  'در-حال-بررسی': 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  'تایید-شده': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  'مشکل-دار': 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
}
const STATUS_LABELS: Record<string, string> = { 'در-حال-بررسی': 'در حال بررسی', 'تایید-شده': 'تایید شده', 'مشکل-دار': 'مشکل دار' }

const LessonQuestionsPage = ({ courseName = '', gradeName = '', subjectName = '', bookId, onBack, onCreateQuestion, onEditQuestion, onViewQuestion }: Props) => {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('همه')
  const [filterStatus, setFilterStatus] = useState('همه')
  const [filterHasImage, setFilterHasImage] = useState('همه')
  const [filterHasMainQuestion, setFilterHasMainQuestion] = useState('همه')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [selectAllBook, setSelectAllBook] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [showBatchTagInput, setShowBatchTagInput] = useState(false)
  const [batchTagValue, setBatchTagValue] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { if (bookId) fetchQuestions() }, [bookId, page, filterType, filterStatus, filterHasImage, filterHasMainQuestion])

  const fetchQuestions = async () => {
    if (!bookId) return
    setIsLoading(true)
    try {
      const params: any = { page, limit: 50 }
      if (filterType !== 'همه') params.type = filterType
      if (filterStatus !== 'همه') params.status = filterStatus
      if (filterHasImage !== 'همه') params.hasImage = filterHasImage
      if (filterHasMainQuestion !== 'همه') params.hasMainQuestion = filterHasMainQuestion
      if (search) params.search = search
      const res = await questionService.getByBook(bookId, params)
      if (res.success) { setQuestions(res.data); setTotalPages(res.totalPages); setTotal(res.total) }
    } catch { toast.error('❌ خطا') } finally { setIsLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!id) { toast.error('❌ شناسه نامعتبر'); return }
    if (!confirm('⚠️ حذف؟')) return
    try { await questionService.delete(id); toast.success('✅ حذف شد'); fetchQuestions() } catch (e: any) { toast.error(e.response?.data?.message || '❌ خطا') }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await questionService.updateStatus(id, status); toast.success('✅ وضعیت تغییر کرد'); fetchQuestions() } catch (e: any) { toast.error('❌ خطا') }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds); next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next); setSelectAll(false); setSelectAllBook(false)
  }

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false) }
    else { setSelectedIds(new Set(questions.map(q => q._id!).filter(Boolean))); setSelectAll(true) }
  }

  const toggleSelectAllBook = async () => {
    if (selectAllBook) { setSelectedIds(new Set()); setSelectAllBook(false); setSelectAll(false); return }
    try {
      const res = await questionService.getByBook(bookId!, { limit: 9999 })
      if (res.success) { setSelectedIds(new Set(res.data.map((q: any) => q._id).filter(Boolean))); setSelectAllBook(true); setSelectAll(true) }
    } catch { toast.error('❌ خطا') }
  }

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) { toast.error('⚠️ هیچ سوالی انتخاب نشده'); return }
    if (!confirm(`⚠️ ${ids.length} سوال حذف شوند؟`)) return
    try {
      const res = await questionService.batchUpdate(ids, 'delete')
      if (res.success) { toast.success(`✅ ${ids.length} سوال حذف شدند`); setSelectedIds(new Set()); setSelectAll(false); setSelectAllBook(false); fetchQuestions() }
    } catch (e: any) { toast.error(e.response?.data?.message || '❌ خطا') }
  }

  const handleBatchStatus = async (status: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) { toast.error('⚠️ هیچ سوالی انتخاب نشده'); return }
    try {
      const res = await questionService.batchUpdate(ids, 'status', status)
      if (res.success) { toast.success(res.message); setSelectedIds(new Set()); setSelectAll(false); setSelectAllBook(false); fetchQuestions() }
    } catch (e: any) { toast.error(e.response?.data?.message || '❌ خطا') }
  }

  const handleBatchAddTag = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) { toast.error('⚠️ هیچ سوالی انتخاب نشده'); return }
    if (!batchTagValue.trim()) { toast.error('⚠️ نام تگ را وارد کنید'); return }
    try {
      const res = await questionService.batchUpdate(ids, 'add-tag', batchTagValue.trim())
      if (res.success) { toast.success(res.message); setSelectedIds(new Set()); setBatchTagValue(''); setShowBatchTagInput(false); fetchQuestions() }
    } catch (e: any) { toast.error(e.response?.data?.message || '❌ خطا') }
  }

  const stripHtml = (html: string) => { if (!html) return ''; const d = document.createElement('div'); d.innerHTML = html; return d.textContent || '' }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else { pages.push(1); if (page > 3) pages.push('...'); const s = Math.max(2, page - 1), e = Math.min(totalPages - 1, page + 1); for (let i = s; i <= e; i++) pages.push(i); if (page < totalPages - 2) pages.push('...'); pages.push(totalPages) }
    return pages
  }

  const renderAnswer = (q: any) => {
    if (q.options?.length > 0) {
      return <div className="flex gap-2 mt-2 flex-wrap">{q.options.map((opt: string, i: number) => (<span key={i} className={`px-2 py-0.5 rounded text-xs ${opt === q.answer ? 'bg-green-200 text-green-800 font-bold' : 'bg-gray-100 text-gray-600'}`}>{opt}</span>))}</div>
    }
    return <div className="mt-2 text-xs text-gray-600">پاسخ: <span className="font-medium" dangerouslySetInnerHTML={{ __html: q.answer || '—' }} /></div>
  }

  return (
    <div className="max-w-full mx-auto" dir="rtl">
      {/* Breadcrumb - قابل کلیک */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 flex-wrap">
        {onBack && (
          <button onClick={onBack} className="hover:text-slate-200 hover:bg-slate-800 rounded-lg p-1 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
        <button onClick={onBack} className="hover:text-indigo-400 hover:underline transition-colors font-semibold">📚 {courseName}</button>
        <span className="text-slate-600">/</span>
        <button onClick={onBack} className="hover:text-indigo-400 hover:underline transition-colors font-semibold">🏫 {gradeName}</button>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-bold">📖 {subjectName}</span>
      </div>

      <div className="flex items-center justify-between mb-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-white">{subjectName}</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">{(total || 0).toLocaleString('fa-IR')} سوال موجود</p>
        </div>
        <button
          onClick={onCreateQuestion}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition active:scale-95"
        >
          + افزودن سوال جدید
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900/70 rounded-2xl border border-slate-800/80 p-3.5 mb-4 flex flex-wrap gap-2.5 items-center backdrop-blur-xl">
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchQuestions() }} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو در متن سوال..."
            className="flex-1 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition">
            جستجو
          </button>
        </form>

        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500"
        >
          <option value="همه">همه انواع</option>
          <option value="تستی">تستی</option><option value="جاخالی">جای خالی</option><option value="صحیح-غلط">صحیح/غلط</option>
          <option value="کوتاه-پاسخ">کوتاه پاسخ</option><option value="گسترده-پاسخ">تشریحی</option><option value="جورکردنی">جورکردنی</option>
          <option value="انتخاب-کلمه">انتخاب کلمه</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500"
        >
          <option value="همه">همه وضعیت‌ها</option>
          <option value="در-حال-بررسی">در حال بررسی</option>
          <option value="تایید-شده">تایید شده</option>
          <option value="مشکل-دار">مشکل دار</option>
        </select>

        <select
          value={filterHasImage}
          onChange={e => { setFilterHasImage(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500"
        >
          <option value="همه">همه (عکس/بدون عکس)</option>
          <option value="true">🖼️ دارای عکس</option>
          <option value="false">📄 بدون عکس</option>
        </select>

        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
            showAnswers
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          {showAnswers ? '📋 مخفی کردن پاسخ‌ها' : '📋 نمایش پاسخ‌ها'}
        </button>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-3.5 mb-4 shadow-lg">
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="font-bold text-indigo-300">{selectedIds.size} سوال انتخاب شده:</span>
            <button onClick={handleBatchDelete} className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500">🗑️ حذف</button>
            <button onClick={() => handleBatchStatus('تایید-شده')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500">✅ تایید</button>
            <button onClick={() => handleBatchStatus('مشکل-دار')} className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500">❌ مشکل دار</button>
            <button onClick={() => handleBatchStatus('در-حال-بررسی')} className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-500">⏳ بررسی</button>
            <button onClick={() => setShowBatchTagInput(!showBatchTagInput)} className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium hover:bg-slate-700">🏷️ تگ</button>
            <button onClick={() => { setSelectedIds(new Set()); setSelectAll(false); setSelectAllBook(false); setShowBatchTagInput(false) }} className="px-3 py-1.5 text-slate-400 hover:text-white rounded-xl text-xs">✕ لغو</button>
          </div>
          {showBatchTagInput && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-indigo-500/20">
              <input
                value={batchTagValue}
                onChange={e => setBatchTagValue(e.target.value)}
                placeholder="نام برچسب جدید..."
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 flex-1 outline-none"
                onKeyDown={e => e.key === 'Enter' && handleBatchAddTag()}
              />
              <button onClick={handleBatchAddTag} className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">اعمال</button>
            </div>
          )}
        </div>
      )}

      {/* Select All */}
      <div className="flex gap-4 mb-3 text-xs text-slate-400">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
          <input type="checkbox" checked={selectAll && questions.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-indigo-500" />
          <span>همه این صفحه ({questions.length})</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
          <input type="checkbox" checked={selectAllBook} onChange={toggleSelectAllBook} className="w-4 h-4 rounded accent-indigo-500" />
          <span>همه این کتاب ({(total || 0).toLocaleString('fa-IR')})</span>
        </label>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>در حال دریافت سوالات درس...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
          <span className="text-5xl mb-3 block opacity-50">📭</span>
          <span>سوالی برای این درس یافت نشد</span>
        </div>
      ) : (
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800/80 text-slate-400">
                <tr className="text-xs font-bold text-gray-500">
                  <th className="w-10 py-3 px-2 text-center">#</th>
                  <th className="w-8 py-3 px-1 text-center"><input type="checkbox" checked={selectAll && questions.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded accent-primary-500" /></th>
                  <th className="py-3 px-3 text-right">صورت سوال</th>
                  <th className="py-3 px-2 text-center w-20">نوع</th>
                  <th className="py-3 px-2 text-center w-16">سختی</th>
                  <th className="py-3 px-2 text-center w-16">تصویر</th>
                  <th className="py-3 px-2 text-center w-24">وضعیت</th>
                  <th className="py-3 px-2 text-center w-16">تگ‌ها</th>
                  <th className="py-3 px-2 text-center w-20">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any, idx: number) => (
                  <tr key={q._id || idx} className={`border-b border-slate-800/40 hover:bg-slate-800/30 text-xs transition ${selectedIds.has(q._id) ? 'bg-indigo-950/40' : ''}`}>
                    <td className="py-3 px-2 text-center text-slate-500 font-mono text-[11px]">{(page - 1) * 50 + idx + 1}</td>
                    <td className="py-3 px-1 text-center"><input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => q._id && toggleSelect(q._id)} className="w-3.5 h-3.5 rounded accent-indigo-500" /></td>
                    <td className="py-3 px-3">
                      {q.mainQuestion && (
                        <div className="text-[11px] text-indigo-400 mb-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2 py-0.5 inline-block">📑 {stripHtml(q.mainQuestion).substring(0, 60)}</div>
                      )}
                      <div className="cursor-pointer hover:text-indigo-400 font-medium text-slate-200 transition" onClick={() => onViewQuestion?.(q)}>
                        {stripHtml(q.question).substring(0, 100)}{stripHtml(q.question).length > 100 ? '...' : ''}
                      </div>
                      {showAnswers && <div className="mt-2 pt-2 border-t border-slate-800/80 text-slate-400">{renderAnswer(q)}</div>}
                    </td>
                    <td className="py-3 px-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_STYLES[q.type] || 'bg-slate-800 text-slate-400'}`}>{q.type}</span></td>
                    <td className={`py-3 px-2 text-center text-xs font-bold ${DIFFICULTY_STYLES[q.difficulty] || ''}`}>{q.difficulty}</td>
                    <td className="py-3 px-2 text-center">{q.has_image ? <span className="text-base" title="دارای تصویر">🖼️</span> : <span className="text-slate-600" title="بدون تصویر">—</span>}</td>
                    <td className="py-3 px-2 text-center"><select value={q.status || 'در-حال-بررسی'} onChange={e => handleStatusChange(q._id, e.target.value)} className={`text-[10px] px-2 py-1 rounded-full border font-bold cursor-pointer outline-none bg-slate-900 ${STATUS_STYLES[q.status || 'در-حال-بررسی']}`}><option value="در-حال-بررسی">⏳ بررسی</option><option value="تایید-شده">✅ تایید</option><option value="مشکل-دار">❌ مشکل</option></select></td>
                    <td className="py-3 px-2"><div className="flex flex-wrap gap-1 justify-center">{(q.tags || []).slice(0, 2).map((t: string) => <span key={t} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono border border-slate-700/60">{t}</span>)}{(q.tags || []).length > 2 && <span className="text-[10px] text-slate-500">+{q.tags.length - 2}</span>}</div></td>
                    <td className="py-3 px-2"><div className="flex gap-1 justify-center"><button onClick={() => onViewQuestion?.(q)} className="text-indigo-400 hover:bg-indigo-500/20 p-1 rounded-lg text-xs transition">👁️</button><button onClick={() => onEditQuestion?.(q)} className="text-emerald-400 hover:bg-emerald-500/20 p-1 rounded-lg text-xs transition">✏️</button><button onClick={() => q._id && handleDelete(q._id)} className="text-rose-400 hover:bg-rose-500/20 p-1 rounded-lg text-xs transition">🗑️</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
          {getPageNumbers().map((p, i) => typeof p === 'string' ? <span key={i} className="w-8 h-8 flex items-center justify-center text-slate-500 text-xs">...</span> : <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-xl text-xs font-bold transition ${page === p ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{p}</button>)}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>
        </div>
      )}
      <div className="text-center mt-2 text-[11px] text-slate-500 font-mono">صفحه {page} از {totalPages} | {(total || 0).toLocaleString('fa-IR')} سوال موجود</div>

      {/* Preview Modal */}
      {showPreview && selectedQuestion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] backdrop-blur-md" onClick={() => setShowPreview(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-[90%] max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl text-slate-100 custom-scrollbar" dir="rtl">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
              <div><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[(selectedQuestion as any).type] || 'bg-slate-800 text-slate-400'}`}>{(selectedQuestion as any).type}</span><span className={`mr-2 text-xs font-bold ${DIFFICULTY_STYLES[(selectedQuestion as any).difficulty] || ''}`}>{(selectedQuestion as any).difficulty}</span><span className={`mr-2 px-2.5 py-0.5 rounded-full text-xs border ${STATUS_STYLES[(selectedQuestion as any).status || 'در-حال-بررسی']}`}>{STATUS_LABELS[(selectedQuestion as any).status || 'در-حال-بررسی']}</span>{(selectedQuestion as any).has_image && <span className="mr-2 text-base">🖼️</span>}</div>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition">✕</button>
            </div>
            {(selectedQuestion as any).mainQuestion && <div className="mb-3 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-800"><p className="text-xs font-bold text-indigo-500 mb-1">📑 سوال اصلی:</p><div dangerouslySetInnerHTML={{ __html: (selectedQuestion as any).mainQuestion }} /></div>}
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
