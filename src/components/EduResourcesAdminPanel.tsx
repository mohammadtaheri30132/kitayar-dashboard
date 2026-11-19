import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { EDU_ADMIN_TOKENS as T } from '../theme/eduAdminTokens'
import {
  eduContentService,
  type EduBookItem,
  type EduChapterItem,
  type EduFieldItem,
  type EduGradeItem,
  type EduLevelItem,
} from '../services/eduContentService'

interface Props {
  levels: EduLevelItem[]
  grades: EduGradeItem[]
  fields: EduFieldItem[]
  books: EduBookItem[]
  initialBookId?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  main_pdf: 'کتاب اصلی (PDF)',
  step_by_step: 'گام‌به‌گام (PDF)',
  note: 'جزوه آموزشی',
  video: 'ویدیو آموزشی',
  custom: 'بخش کاستوم',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  pdf: 'فایل PDF',
  video: 'ویدیو (MP4 / لینک)',
  text: 'متن / مقاله آموزشی',
  image: 'تصویر',
  link: 'لینک خارجی',
}

export default function EduResourcesAdminPanel({
  levels,
  grades,
  fields,
  books,
  initialBookId,
}: Props) {
  const [levelId, setLevelId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [bookId, setBookId] = useState(initialBookId || '')

  const [chapters, setChapters] = useState<EduChapterItem[]>([])
  const [questionBooks, setQuestionBooks] = useState<any[]>([])
  const [linkedQuestionBookId, setLinkedQuestionBookId] = useState('')

  const [customSections, setCustomSections] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Custom section creator form
  const [secTitle, setSecTitle] = useState('')
  const [secDesc, setSecDesc] = useState('')
  const [secIcon, setSecIcon] = useState('sparkles')
  const [secScope, setSecScope] = useState<'level' | 'grade' | 'book'>('level')
  const [savingSec, setSavingSec] = useState(false)

  // Resource creator form
  const [resCategory, setResCategory] = useState<'main_pdf' | 'step_by_step' | 'note' | 'video' | 'custom'>('main_pdf')
  const [resContentType, setResContentType] = useState<'pdf' | 'video' | 'text' | 'image' | 'link'>('pdf')
  const [resCustomSecId, setResCustomSecId] = useState('')
  const [resChapterId, setResChapterId] = useState('')
  const [resLessonId, setResLessonId] = useState('')
  const [resTitle, setResTitle] = useState('')
  const [resDesc, setResDesc] = useState('')
  const [resFileUrl, setResFileUrl] = useState('')
  const [resTextContent, setResTextContent] = useState('')
  const [resFile, setResFile] = useState<File | null>(null)
  const [savingRes, setSavingRes] = useState(false)

  // Sync initial selections cleanly
  useEffect(() => {
    if (initialBookId) {
      const b = books.find((x) => x._id === initialBookId)
      if (b) {
        const lvId = typeof b.levelId === 'object' ? b.levelId._id : b.levelId
        const grId = typeof b.gradeId === 'object' ? b.gradeId._id : b.gradeId
        const flId = b.fieldId ? (typeof b.fieldId === 'object' ? b.fieldId._id : b.fieldId) : ''
        setLevelId(lvId)
        setGradeId(grId)
        setFieldId(flId)
        setBookId(b._id)
        return
      }
    }
    if (!levelId && levels.length > 0) setLevelId(levels[0]._id)
  }, [initialBookId, levels, books])

  const filteredGrades = useMemo(
    () => grades.filter((g) => String(g.levelId) === String(levelId)),
    [grades, levelId]
  )
  const filteredFields = useMemo(
    () => fields.filter((f) => String(f.levelId) === String(levelId)),
    [fields, levelId]
  )
  const filteredBooks = useMemo(
    () =>
      books.filter((b) => {
        const bLv = typeof b.levelId === 'object' ? b.levelId._id : b.levelId
        const bGr = typeof b.gradeId === 'object' ? b.gradeId._id : b.gradeId
        const bFl = b.fieldId ? (typeof b.fieldId === 'object' ? b.fieldId._id : b.fieldId) : ''
        if (levelId && String(bLv) !== String(levelId)) return false
        if (gradeId && String(bGr) !== String(gradeId)) return false
        if (fieldId && String(bFl) !== String(fieldId)) return false
        return true
      }),
    [books, levelId, gradeId, fieldId]
  )

  useEffect(() => {
    eduContentService
      .getQuestionBooks()
      .then((res) => setQuestionBooks(res.data || []))
      .catch(() => {})
  }, [])

  const loadScopeData = async () => {
    if (!levelId) return
    setLoading(true)
    try {
      const [secRes, resRes] = await Promise.all([
        eduContentService.listCustomSections({ levelId }),
        eduContentService.listResources({
          levelId,
          ...(bookId ? { bookId } : {}),
        }),
      ])
      setCustomSections(secRes.data || [])
      setResources(resRes.data || [])

      if (bookId) {
        const bkRes = await eduContentService.getBookDetail(bookId)
        const bk = bkRes.data
        setChapters(bk?.chapters || [])
        setLinkedQuestionBookId(bk?.linkedQuestionBookId || '')
      } else {
        setChapters([])
        setLinkedQuestionBookId('')
      }
    } catch {
      toast.error('خطا در دریافت منابع و بخش‌های کاستوم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScopeData()
  }, [levelId, gradeId, fieldId, bookId])

  const selectedChapterLessons = useMemo(() => {
    const ch = chapters.find((c) => c._id === resChapterId)
    return ch?.lessons || []
  }, [chapters, resChapterId])

  const handleSaveQuestionLink = async () => {
    if (!bookId) return
    try {
      await eduContentService.updateBook(bookId, {
        linkedQuestionBookId: linkedQuestionBookId || null,
      })
      toast.success('اتصال بانک سوال کتاب ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره اتصال بانک سوال')
    }
  }

  const handleCreateCustomSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secTitle.trim() || !levelId) {
      toast.error('عنوان بخش و دوره را وارد کنید')
      return
    }
    if (secScope === 'grade' && !gradeId) {
      toast.error('لطفاً پایه را انتخاب کنید')
      return
    }
    if (secScope === 'book' && !bookId) {
      toast.error('لطفاً کتاب را انتخاب کنید')
      return
    }

    setSavingSec(true)
    try {
      await eduContentService.createCustomSection({
        title: secTitle.trim(),
        description: secDesc.trim(),
        icon: secIcon,
        levelId,
        gradeId: secScope === 'grade' || secScope === 'book' ? gradeId || null : null,
        fieldId: (secScope === 'grade' || secScope === 'book') && fieldId ? fieldId : null,
        bookId: secScope === 'book' ? bookId || null : null,
      })
      toast.success(`بخش کاستوم «${secTitle}» ایجاد شد`)
      setSecTitle('')
      setSecDesc('')
      await loadScopeData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ساخت بخش کاستوم')
    } finally {
      setSavingSec(false)
    }
  }

  const handleDeleteCustomSection = async (id: string, title: string) => {
    if (!confirm(`آیا از حذف بخش کاستوم «${title}» و تمام مطالب داخل آن مطمئن هستید؟`)) return
    try {
      await eduContentService.deleteCustomSection(id)
      toast.success('بخش کاستوم حذف شد')
      await loadScopeData()
    } catch {
      toast.error('خطا در حذف بخش کاستوم')
    }
  }

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!levelId || !resTitle.trim()) {
      toast.error('عنوان مطلب و دوره الزامی است')
      return
    }
    if (resCategory !== 'custom' && !bookId) {
      toast.error('برای کتاب اصلی، گام‌به‌گام، جزوه و ویدیو حتماً کتاب را انتخاب کنید')
      return
    }
    if (resCategory === 'custom' && !resCustomSecId) {
      toast.error('بخش کاستوم موردنظر را انتخاب کنید')
      return
    }

    setSavingRes(true)
    try {
      await eduContentService.createResource({
        category: resCategory,
        customSectionId: resCategory === 'custom' ? resCustomSecId : null,
        contentType:
          resCategory === 'main_pdf' || resCategory === 'step_by_step'
            ? 'pdf'
            : resCategory === 'video'
              ? 'video'
              : resContentType,
        levelId,
        gradeId: gradeId || null,
        fieldId: fieldId || null,
        bookId: bookId || null,
        chapterId: resChapterId || null,
        lessonId: resLessonId || null,
        title: resTitle.trim(),
        description: resDesc.trim(),
        fileUrl: resFileUrl.trim(),
        textContent: resTextContent,
        file: resFile,
      })
      toast.success('منبع آموزشی با موفقیت ذخیره شد')
      setResTitle('')
      setResDesc('')
      setResFileUrl('')
      setResTextContent('')
      setResFile(null)
      await loadScopeData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ثبت منبع')
    } finally {
      setSavingRes(false)
    }
  }

  const handleDeleteResource = async (id: string) => {
    try {
      await eduContentService.deleteResource(id)
      toast.success('منبع حذف شد')
      await loadScopeData()
    } catch {
      toast.error('خطا در حذف منبع')
    }
  }

  return (
    <div className="space-y-6">
      {/* Scope Selector */}
      <div className={`${T.surfaceCard} p-5 space-y-4`}>
        <h3 className="text-base font-extrabold text-white">
          🎯 انتخاب درس / کتاب یا مقطع برای افزودن فایل‌ها، ویدیوها و بخش‌های کاستوم
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">دوره (مقطع)</label>
            <select
              value={levelId}
              onChange={(e) => {
                setLevelId(e.target.value)
                setGradeId('')
                setFieldId('')
                setBookId('')
              }}
              className={T.inputClass}
            >
              <option value="">انتخاب دوره...</option>
              {levels.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">پایه (اختیاری برای کاستوم)</label>
            <select
              value={gradeId}
              onChange={(e) => {
                setGradeId(e.target.value)
                setBookId('')
              }}
              className={T.inputClass}
            >
              <option value="">همه پایه‌های این دوره</option>
              {filteredGrades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {filteredFields.length > 0 && (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">رشته</label>
              <select
                value={fieldId}
                onChange={(e) => {
                  setFieldId(e.target.value)
                  setBookId('')
                }}
                className={T.inputClass}
              >
                <option value="">همه رشته‌ها</option>
                {filteredFields.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">کتاب / درس</label>
            <select
              value={bookId}
              onChange={(e) => {
                setBookId(e.target.value)
                setResChapterId('')
                setResLessonId('')
              }}
              className={T.inputClass}
            >
              <option value="">(بدون کتاب خاص — کل دوره/پایه)</option>
              {filteredBooks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Bank Manual Linker */}
        {bookId && (
          <div className={`${T.surfaceSubCard} p-3 flex flex-wrap items-center gap-3`}>
            <span className="text-xs font-bold text-indigo-300">
              📝 اتصال به بانک نمونه سوال کیتایار:
            </span>
            <select
              value={linkedQuestionBookId}
              onChange={(e) => setLinkedQuestionBookId(e.target.value)}
              className={`${T.inputClass} max-w-xs`}
            >
              <option value="">تطبیق خودکار هوشمند بر اساس نام و پایه</option>
              {questionBooks.map((qb) => (
                <option key={qb._id} value={qb._id}>
                  {qb.name} ({qb.gradeName}) — {qb.totalQuestions} سوال
                </option>
              ))}
            </select>
            <button type="button" onClick={handleSaveQuestionLink} className={T.btnSuccess}>
              ذخیره اتصال بانک سوال
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Custom Sections Creator */}
        <div className={`${T.surfaceCard} p-5 space-y-4`}>
          <h3 className="text-sm font-extrabold text-amber-300">
            ✨ ساخت بخش کاستوم (مثلاً «کاربرد» برای ابتدایی یا هر کتاب)
          </h3>
          <form onSubmit={handleCreateCustomSection} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={secTitle}
                onChange={(e) => setSecTitle(e.target.value)}
                placeholder="عنوان بخش (مثلاً: کاربرد، آزمایشگاه، نکات طلایی)"
                className={T.inputClass}
              />
              <select
                value={secScope}
                onChange={(e) => setSecScope(e.target.value as any)}
                className={T.inputClass}
              >
                <option value="level">اعمال برای کل دوره انتخاب‌شده</option>
                <option value="grade">اعمال فقط برای پایه انتخاب‌شده</option>
                <option value="book">اعمال فقط برای کتاب انتخاب‌شده</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={secDesc}
                onChange={(e) => setSecDesc(e.target.value)}
                placeholder="توضیح کوتاه برای دانش‌آموز..."
                className={T.inputClass}
              />
              <select value={secIcon} onChange={(e) => setSecIcon(e.target.value)} className={T.inputClass}>
                <option value="sparkles">آیکون: ستاره و ایده</option>
                <option value="layers">آیکون: لایه‌ها و بخش</option>
                <option value="book">آیکون: کتابچه</option>
                <option value="video">آیکون: ویدیو</option>
                <option value="flask">آیکون: آزمایش و کاربرد</option>
              </select>
            </div>
            <button type="submit" disabled={savingSec} className={T.btnPrimary}>
              {savingSec ? 'در حال ثبت...' : '+ ایجاد بخش کاستوم'}
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-xs font-bold text-slate-300">
              بخش‌های کاستوم تعریف‌شده در این دوره ({customSections.length}):
            </div>
            {customSections.length === 0 ? (
              <div className="text-xs text-slate-500 py-3">هنوز بخش کاستومی برای این دوره ساخته نشده است.</div>
            ) : (
              customSections.map((sec) => (
                <div key={sec._id} className={`${T.surfaceSubCard} p-3 flex items-center justify-between gap-2`}>
                  <div>
                    <div className="text-xs font-bold text-white">{sec.title}</div>
                    <div className="text-[11px] text-slate-400">
                      محدوده: {sec.bookId?.title ? `کتاب ${sec.bookId.title}` : sec.gradeId?.name ? `پایه ${sec.gradeId.name}` : `کل ${sec.levelId?.name || 'دوره'}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomSection(sec._id, sec.title)}
                    className={T.btnDanger}
                  >
                    حذف
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Resource Uploader (PDF / Step-by-Step / Notes / Video / Custom Item) */}
        <div className={`${T.surfaceCard} p-5 space-y-4`}>
          <h3 className="text-sm font-extrabold text-emerald-300">
            📤 افزودن کتاب اصلی، گام‌به‌گام، جزوه، ویدیو یا مطلب کاستوم
          </h3>
          <form onSubmit={handleCreateResource} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">بخش مقصد در اپلیکیشن</label>
                <select
                  value={resCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any
                    setResCategory(cat)
                    if (cat === 'main_pdf' || cat === 'step_by_step' || cat === 'note') setResContentType('pdf')
                    if (cat === 'video') setResContentType('video')
                  }}
                  className={T.inputClass}
                >
                  <option value="main_pdf">📕 کتاب اصلی (PDF)</option>
                  <option value="step_by_step">📘 گام‌به‌گام (PDF)</option>
                  <option value="note">📝 جزوه آموزشی</option>
                  <option value="video">🎬 ویدیو آموزشی</option>
                  <option value="custom">✨ بخش کاستوم (شخصی‌سازی‌شده)</option>
                </select>
              </div>

              {resCategory === 'custom' ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">کدام بخش کاستوم؟</label>
                  <select
                    value={resCustomSecId}
                    onChange={(e) => setResCustomSecId(e.target.value)}
                    className={T.inputClass}
                  >
                    <option value="">انتخاب بخش کاستوم...</option>
                    {customSections.map((sec) => (
                      <option key={sec._id} value={sec._id}>
                        {sec.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">نوع محتوا</label>
                  <select
                    value={
                      resCategory === 'main_pdf' || resCategory === 'step_by_step'
                        ? 'pdf'
                        : resCategory === 'video'
                          ? 'video'
                          : resContentType
                    }
                    onChange={(e) => setResContentType(e.target.value as any)}
                    disabled={resCategory === 'main_pdf' || resCategory === 'step_by_step' || resCategory === 'video'}
                    className={T.inputClass}
                  >
                    {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {resCategory === 'custom' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">نوع مطلب داخل بخش کاستوم</label>
                <select
                  value={resContentType}
                  onChange={(e) => setResContentType(e.target.value as any)}
                  className={T.inputClass}
                >
                  {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {bookId && chapters.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={resChapterId}
                  onChange={(e) => {
                    setResChapterId(e.target.value)
                    setResLessonId('')
                  }}
                  className={T.inputClass}
                >
                  <option value="">کل کتاب (بدون محدودیت فصل)</option>
                  {chapters.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <select
                  value={resLessonId}
                  onChange={(e) => setResLessonId(e.target.value)}
                  className={T.inputClass}
                >
                  <option value="">همه دروس</option>
                  {selectedChapterLessons.map((ls) => (
                    <option key={ls._id} value={ls._id}>
                      {ls.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              placeholder="عنوان (مثلاً: فایل کتاب درسی ریاضی، یا ویدیو حل تمرین فصل ۱)..."
              className={T.inputClass}
            />
            <input
              type="text"
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
              placeholder="توضیحات (مثلاً مدرس، مباحث یا راهنمای استفاده)..."
              className={T.inputClass}
            />

            {resContentType === 'text' ? (
              <textarea
                rows={4}
                value={resTextContent}
                onChange={(e) => setResTextContent(e.target.value)}
                placeholder="متن کامل آموزشی..."
                className={T.inputClass}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">آپلود مستقیم فایل (تا ۵۰MB)</label>
                  <input
                    type="file"
                    accept={
                      resContentType === 'pdf'
                        ? '.pdf,application/pdf'
                        : resContentType === 'video'
                          ? 'video/*'
                          : 'image/*'
                    }
                    onChange={(e) => setResFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-300 file:ml-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">یا لینک مستقیم فایل (URL)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={resFileUrl}
                    onChange={(e) => setResFileUrl(e.target.value)}
                    placeholder="https://..."
                    className={T.inputClass}
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={savingRes} className={T.btnSuccess}>
              {savingRes ? 'در حال آپلود و ثبت...' : '+ ثبت منبع آموزشی'}
            </button>
          </form>
        </div>
      </div>

      {/* Existing Resources List */}
      <div className={`${T.surfaceCard} p-5 space-y-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white">
            📚 لیست منابع و فایل‌های ثبت‌شده ({resources.length})
          </h3>
          {loading && <span className="text-xs text-slate-400">در حال بارگذاری...</span>}
        </div>

        {resources.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">
            برای این محدوده هنوز فایل یا مطلبی ثبت نشده است. از فرم بالا اضافه کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resources.map((r) => (
              <div key={r._id} className={`${T.surfaceSubCard} p-3.5 flex items-start justify-between gap-3`}>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${T.badgeInfo}`}>
                      {r.customSectionId?.title
                        ? `کاستوم: ${r.customSectionId.title}`
                        : CATEGORY_LABELS[r.category] || r.category}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${T.badgePurple}`}>
                      {CONTENT_TYPE_LABELS[r.contentType] || r.contentType}
                    </span>
                    {r.bookId?.title && (
                      <span className="text-[10px] text-emerald-300">کتاب: {r.bookId.title}</span>
                    )}
                    {r.chapterId?.title && (
                      <span className="text-[10px] text-slate-400">• {r.chapterId.title}</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white truncate">{r.title}</div>
                  {r.description && <div className="text-[11px] text-slate-400">{r.description}</div>}
                  {r.fileUrl && (
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-[11px] text-sky-400 hover:underline truncate max-w-full"
                    >
                      مشاهده / دانلود فایل
                    </a>
                  )}
                </div>
                <button type="button" onClick={() => handleDeleteResource(r._id)} className={T.btnDanger}>
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
