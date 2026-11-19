import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { EDU_ADMIN_TOKENS as T } from '../theme/eduAdminTokens'
import {
  eduContentService,
  type EduBookItem,
  type EduChapterItem,
  type EduFieldItem,
  type EduGradeItem,
  type EduLessonItem,
  type EduLevelItem,
  type EduStatsData,
  type ImportMode,
} from '../services/eduContentService'
import EduResourcesAdminPanel from '../components/EduResourcesAdminPanel'

type ActiveTab = 'tree' | 'resources' | 'import-export' | 'media' | 'audit'

const IMAGE_TYPE_LABELS: Record<string, string> = {
  real_cover: 'جلد واقعی کتاب',
  graphic: 'تصویر گرافیکی آموزشی',
  placeholder: 'تصویر جایگزین موقت',
  none: 'بدون تصویر',
}

const IMAGE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  approved: { label: 'تأیید شده', cls: T.badgeSuccess },
  pending: { label: 'در انتظار تأیید', cls: T.badgeWarning },
  needs_image: { label: 'نیازمند تصویر', cls: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' },
}

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url.startsWith('/') ? url : `/${url}`
}

const toFa = (n: number | string) => Number(n || 0).toLocaleString('fa-IR')

export default function EduContentManagementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tree')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EduStatsData | null>(null)

  const [levels, setLevels] = useState<EduLevelItem[]>([])
  const [grades, setGrades] = useState<EduGradeItem[]>([])
  const [fields, setFields] = useState<EduFieldItem[]>([])
  const [books, setBooks] = useState<EduBookItem[]>([])

  // Filters
  const [filterLevelId, setFilterLevelId] = useState('')
  const [filterGradeId, setFilterGradeId] = useState('')
  const [filterFieldId, setFilterFieldId] = useState('')
  const [filterStructure, setFilterStructure] = useState('')
  const [filterImageStatus, setFilterImageStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected Book Detail drawer/modal state
  const [selectedBook, setSelectedBook] = useState<EduBookItem | null>(null)
  const [loadingBookDetail, setLoadingBookDetail] = useState(false)
  const [resourceFocusBookId, setResourceFocusBookId] = useState('')

  // Modal state for taxonomy add/edit
  const [entityModal, setEntityModal] = useState<{
    type: 'level' | 'grade' | 'field' | 'book' | 'chapter' | 'lesson'
    mode: 'create' | 'edit'
    item?: any
    parentId?: string
  } | null>(null)
  const [modalForm, setModalForm] = useState<any>({})
  const [savingModal, setSavingModal] = useState(false)

  // Import / Export / Backup state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [confirmReplaceChecked, setConfirmReplaceChecked] = useState(false)
  const [exportScope, setExportScope] = useState<'all' | 'level' | 'grade' | 'field' | 'book'>('all')
  const [exportTargetId, setExportTargetId] = useState('')
  const [backups, setBackups] = useState<any[]>([])
  const [backupLabel, setBackupLabel] = useState('')

  // Media manager state
  const [mediaEntityFilter, setMediaEntityFilter] = useState<'all' | 'needs_image' | 'taxonomy' | 'books'>('needs_image')
  const [uploadTarget, setUploadTarget] = useState<{ entityType: 'level' | 'grade' | 'field' | 'book'; id: string; title: string } | null>(null)
  const [uploadImageType, setUploadImageType] = useState<'real_cover' | 'graphic' | 'placeholder'>('real_cover')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [statsRes, treeRes] = await Promise.all([
        eduContentService.getStats(),
        eduContentService.getTree({
          levelId: filterLevelId || undefined,
          gradeId: filterGradeId || undefined,
          fieldId: filterFieldId || undefined,
          structure: filterStructure || undefined,
          imageStatus: filterImageStatus || undefined,
          q: searchQuery.trim() || undefined,
        }),
      ])
      if (statsRes.success) setStats(statsRes.data)
      if (treeRes.success) {
        setLevels(treeRes.data.levels || [])
        setGrades(treeRes.data.grades || [])
        setFields(treeRes.data.fields || [])
        setBooks(treeRes.data.books || [])
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در دریافت اطلاعات آموزشی')
    } finally {
      setLoading(false)
    }
  }

  const loadBackups = async () => {
    try {
      const res = await eduContentService.getBackups()
      if (res.success) setBackups(res.data || [])
    } catch {
      // ignored
    }
  }

  const loadLogs = async () => {
    try {
      const res = await eduContentService.getAuditLogs(60)
      if (res.success) setAuditLogs(res.data || [])
    } catch {
      // ignored
    }
  }

  useEffect(() => {
    loadAll()
  }, [filterLevelId, filterGradeId, filterFieldId, filterStructure, filterImageStatus])

  useEffect(() => {
    if (activeTab === 'import-export') loadBackups()
    if (activeTab === 'audit') loadLogs()
  }, [activeTab])

  const levelMap = useMemo(() => new Map(levels.map((l) => [l._id, l])), [levels])
  const gradeMap = useMemo(() => new Map(grades.map((g) => [g._id, g])), [grades])
  const fieldMap = useMemo(() => new Map(fields.map((f) => [f._id, f])), [fields])

  const filteredGrades = useMemo(
    () => (filterLevelId ? grades.filter((g) => g.levelId === filterLevelId) : grades),
    [grades, filterLevelId]
  )
  const filteredFields = useMemo(
    () => (filterLevelId ? fields.filter((f) => f.levelId === filterLevelId) : fields),
    [fields, filterLevelId]
  )

  const openBookDetail = async (bookId: string) => {
    setLoadingBookDetail(true)
    try {
      const res = await eduContentService.getBookDetail(bookId)
      if (res.success) setSelectedBook(res.data)
    } catch {
      toast.error('خطا در بارگذاری سرفصل‌های کتاب')
    } finally {
      setLoadingBookDetail(false)
    }
  }

  const openModal = (
    type: 'level' | 'grade' | 'field' | 'book' | 'chapter' | 'lesson',
    mode: 'create' | 'edit',
    item?: any,
    parentId?: string
  ) => {
    setEntityModal({ type, mode, item, parentId })
    if (mode === 'edit' && item) {
      setModalForm({
        name: item.name || '',
        title: item.title || '',
        jsonKey: item.jsonKey || '',
        code: item.code || '',
        numericOrder: item.numericOrder || 1,
        levelId: typeof item.levelId === 'object' ? item.levelId?._id : item.levelId || levels[0]?._id || '',
        gradeId: typeof item.gradeId === 'object' ? item.gradeId?._id : item.gradeId || '',
        fieldId: typeof item.fieldId === 'object' ? item.fieldId?._id : item.fieldId || '',
        structure: item.structure || 'chapter',
        keywordsText: (item.keywords || []).join('، '),
        order: item.order || 1,
        isActive: item.isActive !== false,
      })
    } else {
      setModalForm({
        name: '',
        title: '',
        jsonKey: '',
        code: '',
        numericOrder: 1,
        levelId: filterLevelId || levels[0]?._id || '',
        gradeId: filterGradeId || filteredGrades[0]?._id || '',
        fieldId: '',
        structure: 'chapter',
        keywordsText: '',
        order: 1,
        isActive: true,
      })
    }
  }

  const parseKeywords = (raw: string) =>
    String(raw || '')
      .split(/[،,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)

  const handleSaveModal = async () => {
    if (!entityModal) return
    setSavingModal(true)
    try {
      const { type, mode, item, parentId } = entityModal
      const kws = parseKeywords(modalForm.keywordsText)
      if (type === 'level') {
        if (mode === 'create') await eduContentService.createLevel({ name: modalForm.name, code: modalForm.code, isActive: modalForm.isActive })
        else await eduContentService.updateLevel(item._id, { name: modalForm.name, code: modalForm.code, isActive: modalForm.isActive, order: Number(modalForm.order) })
      } else if (type === 'grade') {
        if (mode === 'create') await eduContentService.createGrade({ name: modalForm.name, levelId: modalForm.levelId, numericOrder: Number(modalForm.numericOrder), isActive: modalForm.isActive })
        else await eduContentService.updateGrade(item._id, { name: modalForm.name, levelId: modalForm.levelId, numericOrder: Number(modalForm.numericOrder), isActive: modalForm.isActive })
      } else if (type === 'field') {
        if (mode === 'create') await eduContentService.createField({ name: modalForm.name, levelId: modalForm.levelId, isActive: modalForm.isActive })
        else await eduContentService.updateField(item._id, { name: modalForm.name, levelId: modalForm.levelId, isActive: modalForm.isActive })
      } else if (type === 'book') {
        const payload = {
          title: modalForm.title,
          levelId: modalForm.levelId,
          gradeId: modalForm.gradeId,
          fieldId: modalForm.fieldId || null,
          structure: modalForm.structure,
          keywords: kws,
          isActive: modalForm.isActive,
        }
        if (mode === 'create') await eduContentService.createBook(payload)
        else await eduContentService.updateBook(item._id, payload)
      } else if (type === 'chapter') {
        const payload = { title: modalForm.title, jsonKey: modalForm.jsonKey || modalForm.title, keywords: kws, isActive: modalForm.isActive }
        if (mode === 'create' && parentId) await eduContentService.createChapter(parentId, payload)
        else await eduContentService.updateChapter(item._id, payload)
      } else if (type === 'lesson') {
        const payload = { title: modalForm.title, jsonKey: modalForm.jsonKey || modalForm.title, keywords: kws, isActive: modalForm.isActive }
        if (mode === 'create' && parentId) await eduContentService.createLesson(parentId, payload)
        else await eduContentService.updateLesson(item._id, payload)
      }

      toast.success('تغییرات با موفقیت در دیتابیس ذخیره شد')
      setEntityModal(null)
      await loadAll()
      if (selectedBook?._id) await openBookDetail(selectedBook._id)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ذخیره‌سازی')
    } finally {
      setSavingModal(false)
    }
  }

  const handleDelete = async (
    type: 'level' | 'grade' | 'field' | 'book' | 'chapter' | 'lesson',
    id: string,
    title: string
  ) => {
    if (!window.confirm(`آیا از حذف «${title}» مطمئن هستید؟`)) return
    try {
      if (type === 'level') await eduContentService.deleteLevel(id, true)
      else if (type === 'grade') await eduContentService.deleteGrade(id, true)
      else if (type === 'field') await eduContentService.deleteField(id, true)
      else if (type === 'book') {
        await eduContentService.deleteBook(id, true)
        if (selectedBook?._id === id) setSelectedBook(null)
      } else if (type === 'chapter') await eduContentService.deleteChapter(id)
      else if (type === 'lesson') await eduContentService.deleteLesson(id)
      toast.success(`«${title}» حذف شد`)
      await loadAll()
      if (selectedBook?._id && type !== 'book') await openBookDetail(selectedBook._id)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در حذف مورد')
    }
  }

  const handleToggleActive = async (type: 'level' | 'grade' | 'field' | 'book' | 'chapter' | 'lesson', item: any) => {
    try {
      const next = !(item.isActive !== false)
      if (type === 'level') await eduContentService.updateLevel(item._id, { isActive: next })
      else if (type === 'grade') await eduContentService.updateGrade(item._id, { isActive: next })
      else if (type === 'field') await eduContentService.updateField(item._id, { isActive: next })
      else if (type === 'book') await eduContentService.updateBook(item._id, { isActive: next })
      else if (type === 'chapter') await eduContentService.updateChapter(item._id, { isActive: next })
      else if (type === 'lesson') await eduContentService.updateLesson(item._id, { isActive: next })
      toast.success(next ? 'مورد فعال شد' : 'مورد غیرفعال شد (سوابق حفظ می‌شوند)')
      await loadAll()
      if (selectedBook?._id) await openBookDetail(selectedBook._id)
    } catch {
      toast.error('خطا در تغییر وضعیت')
    }
  }

  const moveChapter = async (idx: number, dir: -1 | 1) => {
    if (!selectedBook?.chapters) return
    const list = [...selectedBook.chapters]
    const target = idx + dir
    if (target < 0 || target >= list.length) return
    ;[list[idx], list[target]] = [list[target], list[idx]]
    setSelectedBook({ ...selectedBook, chapters: list })
    try {
      await eduContentService.reorderChapters(
        selectedBook._id,
        list.map((c) => c._id)
      )
      toast.success('ترتیب فصل‌ها ذخیره شد')
    } catch {
      toast.error('خطا در ثبت ترتیب')
      await openBookDetail(selectedBook._id)
    }
  }

  const handlePreviewFile = async () => {
    if (!importFile) {
      toast.error('ابتدا یک فایل JSON انتخاب کنید')
      return
    }
    setPreviewing(true)
    try {
      const res = await eduContentService.previewImportFile(importFile)
      setPreviewData(res.data)
      if (res.success) toast.success('فایل JSON تحلیل شد و پیش‌نمایش آماده است')
      else toast.error(res.message || 'فایل JSON دارای خطا است')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در تحلیل فایل JSON')
    } finally {
      setPreviewing(false)
    }
  }

  const handleApplyImport = async () => {
    if (!importFile) return
    if (importMode === 'replace_all' && !confirmReplaceChecked) {
      toast.error('برای جایگزینی کامل باید تأییدیه را علامت بزنید')
      return
    }
    setImporting(true)
    try {
      const res = await eduContentService.applyImportFile(importFile, importMode, confirmReplaceChecked)
      if (res.success) {
        toast.success('ورود اطلاعات با موفقیت در دیتابیس ذخیره شد')
        setPreviewData(null)
        setImportFile(null)
        setConfirmReplaceChecked(false)
        await loadAll()
        await loadBackups()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در اعمال تغییرات JSON')
    } finally {
      setImporting(false)
    }
  }

  const handleExportDownload = async (custom?: { scope: 'book' | 'chapters'; id?: string; chapterIds?: string[]; filename?: string }) => {
    try {
      const scope = custom?.scope || exportScope
      const id = custom?.id || (scope === 'all' ? undefined : exportTargetId)
      if (scope !== 'all' && scope !== 'chapters' && !id) {
        toast.error('مورد مورد نظر برای خروجی را انتخاب کنید')
        return
      }
      const res = await eduContentService.exportJson({ scope, id, chapterIds: custom?.chapterIds })
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = custom?.filename || `nokita-edu-${scope}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`فایل JSON خروجی (${toFa(res.count)} کتاب) آماده و دانلود شد`)
    } catch {
      toast.error('خطا در تولید خروجی JSON')
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!uploadTarget) return
    try {
      await eduContentService.uploadImage(uploadTarget.entityType, uploadTarget.id, file, {
        imageType: uploadImageType,
        status: 'approved',
        source: 'admin_upload',
      })
      toast.success('تصویر با موفقیت ذخیره و تأیید شد')
      setUploadTarget(null)
      await loadAll()
      if (selectedBook?._id === uploadTarget.id) await openBookDetail(selectedBook._id)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در آپلود تصویر')
    }
  }

  const mediaEntities = useMemo(() => {
    const items: Array<{ entityType: 'level' | 'grade' | 'field' | 'book'; item: any; displayTitle: string; subtitle: string }> = [
      ...levels.map((l) => ({ entityType: 'level' as const, item: l, displayTitle: `مقطع: ${l.name}`, subtitle: l.code })),
      ...grades.map((g) => ({
        entityType: 'grade' as const,
        item: g,
        displayTitle: `پایه ${g.name}`,
        subtitle: levelMap.get(g.levelId)?.name || '',
      })),
      ...fields.map((f) => ({
        entityType: 'field' as const,
        item: f,
        displayTitle: `رشته ${f.name}`,
        subtitle: levelMap.get(f.levelId)?.name || '',
      })),
      ...books.map((b) => {
        const gObj = typeof b.gradeId === 'string' ? gradeMap.get(b.gradeId) : b.gradeId
        const lObj = typeof b.levelId === 'string' ? levelMap.get(b.levelId) : b.levelId
        const fObj = typeof b.fieldId === 'string' ? fieldMap.get(b.fieldId) : b.fieldId
        return {
          entityType: 'book' as const,
          item: b,
          displayTitle: b.title,
          subtitle: `${lObj?.name || ''} • پایه ${gObj?.name || ''}${fObj?.name ? ` • رشته ${fObj.name}` : ''}`,
        }
      }),
    ]
    if (mediaEntityFilter === 'needs_image') return items.filter((x) => !x.item.image?.url || x.item.image.status === 'needs_image')
    if (mediaEntityFilter === 'taxonomy') return items.filter((x) => x.entityType !== 'book')
    if (mediaEntityFilter === 'books') return items.filter((x) => x.entityType === 'book')
    return items
  }, [levels, grades, fields, books, mediaEntityFilter, levelMap, gradeMap, fieldMap])

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Top Stats */}
      <div className={`${T.surfaceCard} p-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">🏛️</span>
              <span>مدیریت مرکزی بانک اطلاعات آموزشی نوکیتا</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              دیتابیس واحد و مرجع اصلی برای پنل ادمین، دستیار دانش‌آموز و برنامه‌ریز تحصیلی هوشمند — با حفظ ساختار واقعی کتاب‌ها و کلمات کلیدی
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'tree', label: 'درخت و مدیریت محتوا', icon: '🌳' },
              { id: 'resources', label: 'منابع، فایل‌ها و کاستوم', icon: '📂' },
              { id: 'import-export', label: 'ورود / خروجی JSON و بکاپ', icon: '🔁' },
              { id: 'media', label: `مدیریت تصاویر (${toFa(stats?.needsImageCount || 0)} نیازمند)`, icon: '🖼️' },
              { id: 'audit', label: 'تاریخچه تغییرات', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Metrics strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-5 pt-4 border-t border-slate-800/80">
            {[
              { label: 'مقاطع', val: stats.levels, cls: 'text-amber-300' },
              { label: 'پایه‌ها', val: stats.grades, cls: 'text-sky-300' },
              { label: 'رشته‌ها', val: stats.fields, cls: 'text-purple-300' },
              { label: 'کل کتاب‌ها', val: stats.books, sub: `${toFa(stats.chapterBooks)} فصلی • ${toFa(stats.lessonBooks)} درسی`, cls: 'text-emerald-300' },
              { label: 'فصل‌ها / بخش‌ها', val: stats.chapters, cls: 'text-indigo-300' },
              { label: 'درس‌های زیرمجموعه', val: stats.lessons, cls: 'text-cyan-300' },
              { label: 'نیازمند تصویر', val: stats.needsImageCount, cls: 'text-rose-300' },
            ].map((m) => (
              <div key={m.label} className={`${T.surfaceSubCard} p-3 text-center`}>
                <div className={`text-xl font-black tabular-nums ${m.cls}`}>{toFa(m.val)}</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{m.label}</div>
                {m.sub && <div className="text-[10px] text-slate-500 mt-0.5">{m.sub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: HIERARCHICAL TREE & CRUD */}
      {activeTab === 'tree' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Taxonomy Sidebar Controls */}
          <div className="xl:col-span-4 space-y-4">
            {/* Levels */}
            <div className={`${T.surfaceCard} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">۱. مقاطع تحصیلی</h3>
                <button type="button" onClick={() => openModal('level', 'create')} className={T.btnPrimary}>
                  + مقطع جدید
                </button>
              </div>
              <div className="space-y-2">
                {levels.map((lvl) => (
                  <div
                    key={lvl._id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      filterLevelId === lvl._id ? 'bg-indigo-600/20 border-indigo-500/60' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => {
                      setFilterLevelId(filterLevelId === lvl._id ? '' : lvl._id)
                      setFilterGradeId('')
                      setFilterFieldId('')
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {lvl.image?.url ? (
                        <img src={resolveMediaUrl(lvl.image.url)} alt={lvl.name} className="w-10 h-7 rounded-lg object-cover shrink-0" />
                      ) : (
                        <span className="w-10 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs">🏫</span>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{lvl.name}</span>
                          {!lvl.isActive && <span className="text-[10px] text-rose-400">(غیرفعال)</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">{lvl.code}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => handleToggleActive('level', lvl)} className="p-1.5 rounded-lg hover:bg-slate-800 text-xs" title="فعال/غیرفعال">
                        {lvl.isActive ? '🟢' : '⚪'}
                      </button>
                      <button type="button" onClick={() => openModal('level', 'edit', lvl)} className="p-1.5 rounded-lg hover:bg-slate-800 text-xs" title="ویرایش">
                        ✏️
                      </button>
                      <button type="button" onClick={() => handleDelete('level', lvl._id, lvl.name)} className="p-1.5 rounded-lg hover:bg-rose-950/60 text-xs" title="حذف">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grades */}
            <div className={`${T.surfaceCard} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">۲. پایه‌های تحصیلی</h3>
                <button type="button" onClick={() => openModal('grade', 'create')} className={T.btnPrimary}>
                  + پایه جدید
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pe-1">
                {filteredGrades.map((grd) => (
                  <div
                    key={grd._id}
                    onClick={() => setFilterGradeId(filterGradeId === grd._id ? '' : grd._id)}
                    className={`p-2 rounded-xl border cursor-pointer transition flex items-center justify-between gap-1 ${
                      filterGradeId === grd._id ? 'bg-sky-600/20 border-sky-500/60' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">پایه {grd.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{levelMap.get(grd.levelId)?.name}</div>
                    </div>
                    <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => openModal('grade', 'edit', grd)} className="p-1 hover:bg-slate-800 rounded text-[11px]">
                        ✏️
                      </button>
                      <button type="button" onClick={() => handleDelete('grade', grd._id, grd.name)} className="p-1 hover:bg-rose-950/50 rounded text-[11px]">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fields (Only when fields exist — never fabricated!) */}
            <div className={`${T.surfaceCard} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">۳. رشته‌های تحصیلی</h3>
                <button type="button" onClick={() => openModal('field', 'create')} className={T.btnPrimary}>
                  + رشته جدید
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                فقط برای مقاطع دارای رشته (بدون ساخت رشته فرضی برای ابتدایی و متوسطه اول)
              </p>
              <div className="space-y-2">
                {filteredFields.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-3">این مقطع بدون رشته تعریف شده است.</div>
                ) : (
                  filteredFields.map((fld) => (
                    <div
                      key={fld._id}
                      onClick={() => setFilterFieldId(filterFieldId === fld._id ? '' : fld._id)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                        filterFieldId === fld._id ? 'bg-purple-600/20 border-purple-500/60' : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">
                        رشته {fld.name}
                        <span className="text-[10px] text-slate-400 font-normal ms-2">({levelMap.get(fld.levelId)?.name})</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => openModal('field', 'edit', fld)} className="p-1 hover:bg-slate-800 rounded text-xs">
                          ✏️
                        </button>
                        <button type="button" onClick={() => handleDelete('field', fld._id, fld.name)} className="p-1 hover:bg-rose-950/50 rounded text-xs">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Books + Chapters/Lessons Management Area */}
          <div className="xl:col-span-8 space-y-4">
            {/* Search & Filters Bar */}
            <div className={`${T.surfaceCard} p-4 space-y-3`}>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadAll()}
                    placeholder="جستجو در نام کتاب، پایه، رشته، فصل، درس یا کلمات کلیدی..."
                    className={T.inputClass}
                  />
                  <button type="button" onClick={loadAll} className={T.btnPrimary}>
                    🔍 جستجو
                  </button>
                </div>
                <button type="button" onClick={() => openModal('book', 'create')} className={T.btnSuccess}>
                  + افزودن کتاب جدید
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select value={filterStructure} onChange={(e) => setFilterStructure(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
                  <option value="">همه ساختارها (فصلی و درسی)</option>
                  <option value="chapter">فقط ساختار فصل‌محور (chapter)</option>
                  <option value="lesson">فقط ساختار درسمحور (lesson)</option>
                </select>
                <select value={filterImageStatus} onChange={(e) => setFilterImageStatus(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
                  <option value="">همه وضعیت‌های تصویر</option>
                  <option value="needs_image">نیازمند تصویر</option>
                  <option value="approved">تصویر تأیید شده</option>
                </select>
                {(filterLevelId || filterGradeId || filterFieldId || filterStructure || filterImageStatus || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterLevelId('')
                      setFilterGradeId('')
                      setFilterFieldId('')
                      setFilterStructure('')
                      setFilterImageStatus('')
                      setSearchQuery('')
                    }}
                    className={T.btnGhost}
                  >
                    ✕ پاک کردن فیلترها
                  </button>
                )}
                <span className="text-xs text-slate-400 ms-auto">نمایش {toFa(books.length)} کتاب</span>
              </div>
            </div>

            {/* Book List / Detail Split */}
            {selectedBook ? (
              <div className={`${T.surfaceCard} p-5 space-y-5`}>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setSelectedBook(null)} className={T.btnGhost}>
                      → بازگشت به لیست کتاب‌ها
                    </button>
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <span>{selectedBook.title}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${selectedBook.structure === 'chapter' ? T.badgeInfo : T.badgePurple}`}>
                          {selectedBook.structure === 'chapter' ? 'ساختار فصل‌محور' : 'ساختار درسمحور'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        شناسه پایدار: <code className="text-[11px] text-indigo-300">{selectedBook.stableId}</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleExportDownload({
                          scope: 'book',
                          id: selectedBook._id,
                          filename: `book-${selectedBook.title}.json`,
                        })
                      }
                      className={T.btnGhost}
                    >
                      📤 خروجی JSON کتاب
                    </button>
                    <button type="button" onClick={() => openModal('chapter', 'create', undefined, selectedBook._id)} className={T.btnPrimary}>
                      + افزودن {selectedBook.structure === 'lesson' ? 'درس' : 'فصل / بخش'}
                    </button>
                  </div>
                </div>

                {loadingBookDetail ? (
                  <div className="py-10 text-center text-slate-400 text-sm">در حال بارگذاری فصل‌ها و درس‌ها...</div>
                ) : (selectedBook.chapters || []).length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-sm">هیچ فصل یا درسی برای این کتاب ثبت نشده است.</div>
                ) : (
                  <div className="space-y-3">
                    {(selectedBook.chapters || []).map((ch: EduChapterItem, idx: number) => (
                      <div key={ch._id} className={`${T.surfaceSubCard} p-4 space-y-3`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                                {ch.jsonKey}
                              </span>
                              <span className="text-sm font-bold text-white">{ch.title}</span>
                              {ch.hasEmptyLessons && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${T.badgeMuted}`}>
                                  بدون زیرمجموعه درس (ساختار اصلی حفظ شده)
                                </span>
                              )}
                              {ch.isActive === false && (
                                <span className="text-[10px] text-rose-400 font-bold">(غیرفعال)</span>
                              )}
                            </div>
                            {ch.keywords && ch.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {ch.keywords.map((kw) => (
                                  <span key={kw} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/70">
                                    #{kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => moveChapter(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-xs disabled:opacity-30" title="انتقال به بالا">
                              ▲
                            </button>
                            <button type="button" onClick={() => moveChapter(idx, 1)} disabled={idx === (selectedBook.chapters?.length || 0) - 1} className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-xs disabled:opacity-30" title="انتقال به پایین">
                              ▼
                            </button>
                            <button type="button" onClick={() => openModal('lesson', 'create', undefined, ch._id)} className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 text-[11px] font-bold hover:bg-emerald-600/30">
                              + درس زیرمجموعه
                            </button>
                            <button type="button" onClick={() => handleToggleActive('chapter', ch)} className="p-1.5 rounded-lg hover:bg-slate-800 text-xs">
                              {ch.isActive !== false ? '🟢' : '⚪'}
                            </button>
                            <button type="button" onClick={() => openModal('chapter', 'edit', ch, selectedBook._id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-xs">
                              ✏️
                            </button>
                            <button type="button" onClick={() => handleDelete('chapter', ch._id, ch.title)} className="p-1.5 rounded-lg hover:bg-rose-950/60 text-xs">
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Nested Lessons */}
                        {ch.lessons && ch.lessons.length > 0 && (
                          <div className="ps-4 border-s-2 border-indigo-500/30 space-y-2 pt-1">
                            {ch.lessons.map((ls: EduLessonItem) => (
                              <div key={ls._id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                    <span className="text-indigo-400">[{ls.jsonKey}]</span>
                                    <span>{ls.title}</span>
                                    {ls.isActive === false && <span className="text-[10px] text-rose-400">(غیرفعال)</span>}
                                  </div>
                                  {ls.keywords && ls.keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {ls.keywords.map((kw) => (
                                        <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                                          {kw}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button type="button" onClick={() => handleToggleActive('lesson', ls)} className="p-1 rounded hover:bg-slate-800 text-xs">
                                    {ls.isActive !== false ? '🟢' : '⚪'}
                                  </button>
                                  <button type="button" onClick={() => openModal('lesson', 'edit', ls, ch._id)} className="p-1 rounded hover:bg-slate-800 text-xs">
                                    ✏️
                                  </button>
                                  <button type="button" onClick={() => handleDelete('lesson', ls._id, ls.title)} className="p-1 rounded hover:bg-rose-950/60 text-xs">
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : loading ? (
              <div className={`${T.surfaceCard} p-12 text-center text-slate-400 text-sm`}>در حال بارگذاری کتاب‌ها...</div>
            ) : books.length === 0 ? (
              <div className={`${T.surfaceCard} p-12 text-center text-slate-400 text-sm`}>کتابی با این فیلتر یافت نشد.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {books.map((book) => {
                  const lvl = levelMap.get(String(book.levelId))
                  const grd = gradeMap.get(String(book.gradeId))
                  const fld = book.fieldId ? fieldMap.get(String(book.fieldId)) : null
                  const imgMeta = IMAGE_STATUS_LABELS[book.image?.status || 'needs_image']

                  return (
                    <div key={book._id} className={`${T.surfaceCard} p-4 flex flex-col justify-between gap-3 hover:border-indigo-500/40 transition`}>
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {book.image?.url ? (
                            <img src={resolveMediaUrl(book.image.url)} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl opacity-50">📘</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-extrabold text-white truncate">{book.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${imgMeta.cls}`}>
                              {imgMeta.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {lvl?.name} • پایه {grd?.name} {fld ? `• رشته ${fld.name}` : ''}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md ${book.structure === 'chapter' ? T.badgeInfo : T.badgePurple}`}>
                              {book.structure === 'chapter' ? 'فصل‌محور' : 'درسمحور'}
                            </span>
                            <span className="text-[11px] text-slate-300">
                              {toFa(book.chaptersCount || 0)} بخش • {toFa(book.lessonsCount || 0)} درس زیرمجموعه
                            </span>
                            {book.isActive === false && (
                              <span className="text-[10px] text-rose-400 font-bold">(غیرفعال)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <button type="button" onClick={() => openBookDetail(book._id)} className={T.btnPrimary}>
                          👁️ سرفصل‌ها
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setResourceFocusBookId(book._id)
                              setActiveTab('resources')
                            }}
                            className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-xs text-emerald-300"
                            title="مدیریت PDF، گام‌به‌گام، جزوه، ویدیو و کاستوم"
                          >
                            📂
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setUploadTarget({ entityType: 'book', id: book._id, title: `${book.title} (${grd?.name || ''})` })
                            }
                            className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs"
                            title="تغییر تصویر"
                          >
                            🖼️
                          </button>
                          <button type="button" onClick={() => handleToggleActive('book', book)} className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs" title="فعال/غیرفعال">
                            {book.isActive !== false ? '🟢' : '⚪'}
                          </button>
                          <button type="button" onClick={() => openModal('book', 'edit', book)} className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs" title="ویرایش">
                            ✏️
                          </button>
                          <button type="button" onClick={() => handleDelete('book', book._id, book.title)} className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-xs" title="حذف">
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT / EXPORT / BACKUP */}
      {activeTab === 'import-export' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Import Card */}
          <div className={`${T.surfaceCard} p-5 space-y-4`}>
            <h3 className="text-base font-extrabold text-white">📥 ورود فایل JSON با پیش‌نمایش و تشخیص تغییرات</h3>
            <p className="text-xs text-slate-400">
              ساختار فایل قبل از ثبت اعتبارسنجی می‌شود و موارد جدید، تکراری، تغییرکرده و حذف‌شده نمایش داده می‌شوند.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  setImportFile(e.target.files?.[0] || null)
                  setPreviewData(null)
                }}
                className="text-xs text-slate-300 file:me-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-bold"
              />
              <button type="button" onClick={handlePreviewFile} disabled={!importFile || previewing} className={T.btnPrimary}>
                {previewing ? 'در حال تحلیل...' : '🔍 تحلیل و پیش‌نمایش تغییرات'}
              </button>
            </div>

            {previewData && (
              <div className={`${T.surfaceSubCard} p-4 space-y-3`}>
                {!previewData.valid ? (
                  <div className="text-rose-300 text-xs space-y-1">
                    <div className="font-bold">❌ خطاهای اعتبارسنجی فایل JSON:</div>
                    {(previewData.errors || []).slice(0, 10).map((e: string, i: number) => (
                      <div key={i}>• {e}</div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <div className="font-black text-emerald-300">{toFa(previewData.diff?.newBooks?.length || 0)}</div>
                        <div className="text-slate-400">کتاب جدید</div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="font-black text-amber-300">{toFa(previewData.diff?.changedBooks?.length || 0)}</div>
                        <div className="text-slate-400">تغییریافته</div>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                        <div className="font-black text-rose-300">{toFa(previewData.diff?.removedBooks?.length || 0)}</div>
                        <div className="text-slate-400">حذف‌شده (نسبت به فایل)</div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div>• کل کتاب‌های فایل: {toFa(previewData.summary?.rawBookCount)} (یکتا: {toFa(previewData.summary?.uniqueBookCount)})</div>
                      <div>• موارد تکراری داخل فایل: {toFa(previewData.duplicatesInFile?.length || 0)} مورد</div>
                      <div>• فصل‌ها: {toFa(previewData.summary?.chapters)} | درس‌ها: {toFa(previewData.summary?.lessons)} | کلمات کلیدی: {toFa(previewData.summary?.keywordsCount)}</div>
                      <div>• بخش‌های بدون درس/کلیدواژه: {toFa(previewData.incompleteItemsCount || 0)} مورد (بدون ساخت داده فرضی حفظ می‌شوند)</div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-xs font-bold text-slate-200 block">حالت ورود اطلاعات:</label>
                      <select value={importMode} onChange={(e) => setImportMode(e.target.value as ImportMode)} className={T.inputClass}>
                        <option value="add_new">افزودن اطلاعات جدید (بدون تغییر اطلاعات قبلی)</option>
                        <option value="update_existing">به‌روزرسانی اطلاعات موجود (فقط رکوردهای هم‌شناسه)</option>
                        <option value="merge">ادغام کامل (افزودن جدید + به‌روزرسانی بدون حذف قبلی‌ها)</option>
                        <option value="replace_all">جایگزینی کامل بانک با فایل جدید (همراه با بکاپ خودکار)</option>
                      </select>

                      {importMode === 'replace_all' && (
                        <label className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                          <input type="checkbox" checked={confirmReplaceChecked} onChange={(e) => setConfirmReplaceChecked(e.target.checked)} />
                          <span>تأیید می‌کنم پس از تهیه نسخه پشتیبان خودکار، کل اطلاعات جایگزین شوند.</span>
                        </label>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={handleApplyImport} disabled={importing} className={T.btnSuccess}>
                          {importing ? 'در حال ذخیره‌سازی...' : '✅ تأیید و ثبت در دیتابیس'}
                        </button>
                        <button type="button" onClick={() => setPreviewData(null)} className={T.btnGhost}>
                          انصراف
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Export + Backups Card */}
          <div className="space-y-5">
            <div className={`${T.surfaceCard} p-5 space-y-4`}>
              <h3 className="text-base font-extrabold text-white">📤 خروجی استاندارد JSON</h3>
              <p className="text-xs text-slate-400">
                فایل خروجی دارای ساختار استاندارد و شناسه یکتا بوده و مستقیماً مجدداً قابل Import است.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={exportScope}
                  onChange={(e) => {
                    setExportScope(e.target.value as any)
                    setExportTargetId('')
                  }}
                  className={T.inputClass}
                >
                  <option value="all">کل بانک اطلاعات آموزشی</option>
                  <option value="level">یک مقطع تحصیلی</option>
                  <option value="grade">یک پایه تحصیلی</option>
                  <option value="field">یک رشته تحصیلی</option>
                  <option value="book">یک کتاب مشخص</option>
                </select>

                {exportScope !== 'all' && (
                  <select value={exportTargetId} onChange={(e) => setExportTargetId(e.target.value)} className={T.inputClass}>
                    <option value="">انتخاب کنید...</option>
                    {exportScope === 'level' && levels.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                    {exportScope === 'grade' && grades.map((g) => <option key={g._id} value={g._id}>پایه {g.name}</option>)}
                    {exportScope === 'field' && fields.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                    {exportScope === 'book' && books.map((b) => <option key={b._id} value={b._id}>{b.title}</option>)}
                  </select>
                )}
              </div>

              <button type="button" onClick={() => handleExportDownload()} className={T.btnPrimary}>
                ⬇️ دانلود فایل JSON خروجی
              </button>
            </div>

            {/* Backup & Restore */}
            <div className={`${T.surfaceCard} p-5 space-y-4`}>
              <h3 className="text-base font-extrabold text-white">💾 پشتیبان‌گیری و بازیابی نسخه‌ها</h3>
              <div className="flex gap-2">
                <input
                  value={backupLabel}
                  onChange={(e) => setBackupLabel(e.target.value)}
                  placeholder="عنوان نسخه پشتیبان (اختیاری)..."
                  className={T.inputClass}
                />
                <button
                  type="button"
                  onClick={async () => {
                    await eduContentService.createBackup(backupLabel)
                    setBackupLabel('')
                    toast.success('نسخه پشتیبان ذخیره شد')
                    await loadBackups()
                  }}
                  className={T.btnSuccess}
                >
                  + ساخت بکاپ
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backups.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">هنوز نسخه پشتیبانی ثبت نشده است.</div>
                ) : (
                  backups.map((b) => (
                    <div key={b._id} className={`${T.surfaceSubCard} p-3 flex items-center justify-between gap-2`}>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{b.label}</div>
                        <div className="text-[10px] text-slate-400">
                          {toFa(b.stats?.books)} کتاب • {toFa(b.stats?.chapters)} فصل • {new Date(b.createdAt).toLocaleString('fa-IR')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`آیا نسخه «${b.label}» بازگردانی شود؟`)) return
                          await eduContentService.restoreBackup(b._id)
                          toast.success('نسخه پشتیبان بازگردانی شد')
                          await loadAll()
                        }}
                        className={T.btnPrimary}
                      >
                        ♻️ بازگردانی
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDIA MANAGER */}
      {activeTab === 'media' && (
        <div className={`${T.surfaceCard} p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white">🖼️ مدیریت تصاویر مقاطع، پایه‌ها، رشته‌ها و جلد کتاب‌ها</h3>
              <p className="text-xs text-slate-400 mt-1">
                برای مقاطع و پایه‌ها تصویر گرافیکی استاندارد ساخته شده است؛ کتاب‌های بدون جلد واقعی با وضعیت «نیازمند تصویر» مشخص شده‌اند تا جلد واقعی یا جایگزین تأییدشده بارگذاری کنید.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'needs_image', label: 'نیازمند تصویر' },
                { id: 'books', label: 'همه کتاب‌ها' },
                { id: 'taxonomy', label: 'مقاطع و پایه‌ها' },
                { id: 'all', label: 'همه موارد' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMediaEntityFilter(f.id as any)}
                  className={mediaEntityFilter === f.id ? T.btnPrimary : T.btnGhost}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {mediaEntities.map(({ entityType, item, displayTitle, subtitle }) => {
              const st = IMAGE_STATUS_LABELS[item.image?.status || 'needs_image']
              return (
                <div key={`${entityType}-${item._id}`} className={`${T.surfaceSubCard} p-3.5 flex flex-col justify-between gap-3`}>
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image?.url ? (
                        <img src={resolveMediaUrl(item.image.url)} alt={displayTitle} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl text-slate-600">🖼️</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs font-bold text-white truncate">{displayTitle}</div>
                      <div className="text-[11px] text-slate-400 truncate">{subtitle}</div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      <div className="text-[10px] text-slate-500">نوع: {IMAGE_TYPE_LABELS[item.image?.imageType || 'none']}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadImageType(entityType === 'book' ? 'real_cover' : 'graphic')
                        setUploadTarget({ entityType, id: item._id, title: displayTitle })
                      }}
                      className={T.btnPrimary}
                    >
                      ⬆️ بارگذاری / تغییر تصویر
                    </button>
                    {item.image?.url && (
                      <button
                        type="button"
                        onClick={async () => {
                          await eduContentService.removeImage(entityType, item._id)
                          toast.success('تصویر حذف شد')
                          await loadAll()
                        }}
                        className={T.btnDanger}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RESOURCES, VIDEOS, PDFs & CUSTOM SECTIONS */}
      {activeTab === 'resources' && (
        <EduResourcesAdminPanel
          levels={levels}
          grades={grades}
          fields={fields}
          books={books}
          initialBookId={resourceFocusBookId}
        />
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className={`${T.surfaceCard} p-5 space-y-4`}>
          <h3 className="text-base font-extrabold text-white">📜 تاریخچه تغییرات بانک اطلاعات آموزشی</h3>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">لاگی ثبت نشده است.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log._id} className={`${T.surfaceSubCard} p-3 flex flex-wrap items-center justify-between gap-2 text-xs`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${T.badgeInfo}`}>{log.action}</span>
                    <span className="font-semibold text-white">{log.summary}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    توسط {log.actorName} • {new Date(log.createdAt).toLocaleString('fa-IR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {entityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${T.surfaceCard} w-full max-w-lg p-5 space-y-4`}>
            <h3 className="text-base font-extrabold text-white">
              {entityModal.mode === 'create' ? 'افزودن' : 'ویرایش'} {entityModal.type}
            </h3>

            {(entityModal.type === 'level' || entityModal.type === 'grade' || entityModal.type === 'field') && (
              <input
                value={modalForm.name || ''}
                onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                placeholder="عنوان..."
                className={T.inputClass}
              />
            )}

            {(entityModal.type === 'book' || entityModal.type === 'chapter' || entityModal.type === 'lesson') && (
              <input
                value={modalForm.title || ''}
                onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                placeholder="عنوان..."
                className={T.inputClass}
              />
            )}

            {(entityModal.type === 'chapter' || entityModal.type === 'lesson') && (
              <input
                value={modalForm.jsonKey || ''}
                onChange={(e) => setModalForm({ ...modalForm, jsonKey: e.target.value })}
                placeholder="کلید نمایشی (مثلاً فصل 1 یا درس 1)"
                className={T.inputClass}
              />
            )}

            {(entityModal.type === 'grade' || entityModal.type === 'field' || entityModal.type === 'book') && (
              <select value={modalForm.levelId || ''} onChange={(e) => setModalForm({ ...modalForm, levelId: e.target.value })} className={T.inputClass}>
                <option value="">انتخاب مقطع...</option>
                {levels.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            )}

            {entityModal.type === 'book' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <select value={modalForm.gradeId || ''} onChange={(e) => setModalForm({ ...modalForm, gradeId: e.target.value })} className={T.inputClass}>
                    <option value="">انتخاب پایه...</option>
                    {grades.map((g) => <option key={g._id} value={g._id}>پایه {g.name}</option>)}
                  </select>
                  <select value={modalForm.fieldId || ''} onChange={(e) => setModalForm({ ...modalForm, fieldId: e.target.value })} className={T.inputClass}>
                    <option value="">بدون رشته (مقطع عمومی)</option>
                    {fields.map((f) => <option key={f._id} value={f._id}>رشته {f.name}</option>)}
                  </select>
                </div>
                <select value={modalForm.structure} onChange={(e) => setModalForm({ ...modalForm, structure: e.target.value })} className={T.inputClass}>
                  <option value="chapter">ساختار فصل‌محور (chapter)</option>
                  <option value="lesson">ساختار درسمحور (lesson)</option>
                </select>
              </>
            )}

            {(entityModal.type === 'book' || entityModal.type === 'chapter' || entityModal.type === 'lesson') && (
              <textarea
                rows={3}
                value={modalForm.keywordsText || ''}
                onChange={(e) => setModalForm({ ...modalForm, keywordsText: e.target.value })}
                placeholder="کلمات کلیدی (با کاما یا خط جدید جدا کنید)..."
                className={T.inputClass}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEntityModal(null)} className={T.btnGhost}>
                انصراف
              </button>
              <button type="button" onClick={handleSaveModal} disabled={savingModal} className={T.btnSuccess}>
                {savingModal ? 'در حال ذخیره...' : 'ذخیره در دیتابیس'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Image Modal */}
      {uploadTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${T.surfaceCard} w-full max-w-md p-5 space-y-4`}>
            <h3 className="text-base font-extrabold text-white">آپلود تصویر برای «{uploadTarget.title}»</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">نوع تصویر:</label>
              <select value={uploadImageType} onChange={(e) => setUploadImageType(e.target.value as any)} className={T.inputClass}>
                <option value="real_cover">جلد واقعی کتاب درسی</option>
                <option value="graphic">تصویر گرافیکی آموزشی</option>
                <option value="placeholder">تصویر جایگزین موقت (به‌عنوان جلد واقعی معرفی نمی‌شود)</option>
              </select>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file)
              }}
              className="text-xs text-slate-300 file:me-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-bold"
            />
            <div className="flex justify-end">
              <button type="button" onClick={() => setUploadTarget(null)} className={T.btnGhost}>
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
