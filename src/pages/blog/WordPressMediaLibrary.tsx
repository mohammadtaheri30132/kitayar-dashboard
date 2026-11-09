import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  UploadCloud,
  Image as ImageIcon,
  Search,
  Check,
  Copy,
  Trash2,
  X,
  AlertTriangle,
  Sparkles,
  Save,
  HardDrive,
} from './BlogIcons'
import type { BlogMediaItem } from '../../services/blogAdminService'
import {
  fetchBlogMedia,
  uploadBlogMedia,
  updateBlogMedia,
  deleteBlogMedia,
} from '../../services/blogAdminService'

export interface SelectedMediaPayload {
  url: string
  alt: string
  title: string
  caption: string
  width: number
  align: 'center' | 'right' | 'left'
}

interface Props {
  mode: 'modal' | 'page'
  isOpen?: boolean
  onClose?: () => void
  onSelect?: (media: SelectedMediaPayload) => void
  selectButtonLabel?: string
  showInsertDisplaySettings?: boolean
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '۰ بایت'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const WordPressMediaLibrary: React.FC<Props> = ({
  mode,
  isOpen = true,
  onClose,
  onSelect,
  selectButtonLabel = 'درج در نوشته',
  showInsertDisplaySettings = false,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')
  const [items, setItems] = useState<BlogMediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ totalFiles: 0, missingAltCount: 0, totalBytes: 0 })

  const [selected, setSelected] = useState<BlogMediaItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)

  // Insert options (WordPress Attachment Display Settings)
  const [insertWidth, setInsertWidth] = useState<number>(680)
  const [insertAlign, setInsertAlign] = useState<'center' | 'right' | 'left'>('center')

  const loadMedia = useCallback(async (q = search) => {
    try {
      setLoading(true)
      const res = await fetchBlogMedia({ search: q, limit: 60 })
      setItems(res.data || [])
      if (res.stats) setStats(res.stats)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در بارگذاری کتابخانه رسانه')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    if (mode === 'modal' && !isOpen) return
    loadMedia('')
  }, [mode, isOpen])

  const handleSelectCard = (item: BlogMediaItem) => {
    setSelected(item)
    setEditTitle(item.title || '')
    setEditAlt(item.alt || '')
    setEditCaption(item.caption || '')
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return
      try {
        setUploading(true)
        setUploadProgress(5)
        const res = await uploadBlogMedia(acceptedFiles, (pct) => setUploadProgress(pct))
        toast.success(res.message || 'تصاویر با موفقیت آپلود شدند')
        const uploaded = res.data || []
        setItems((prev) => [...uploaded, ...prev])
        if (uploaded[0]) {
          handleSelectCard(uploaded[0])
        }
        setActiveTab('library')
        loadMedia('')
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'خطا در آپلود فایل تصویری')
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [loadMedia]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 15 * 1024 * 1024,
  })

  const handleSaveMeta = async () => {
    if (!selected) return
    try {
      setSavingMeta(true)
      const res = await updateBlogMedia(selected._id, {
        title: editTitle,
        alt: editAlt,
        caption: editCaption,
      })
      const updated = res.data
      setSelected(updated)
      setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)))
      toast.success('اطلاعات سئو تصویر ذخیره شد')
      loadMedia(search)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ذخیره مشخصات تصویر')
    } finally {
      setSavingMeta(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm('آیا از حذف دائمی این تصویر از سرور اطمینان دارید؟')) return
    try {
      await deleteBlogMedia(selected._id)
      toast.success('تصویر حذف شد')
      setItems((prev) => prev.filter((it) => it._id !== selected._id))
      setSelected(null)
      loadMedia(search)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در حذف تصویر')
    }
  }

  const handleConfirmSelection = async () => {
    if (!selected || !onSelect) return
    // Auto-save unsaved alt/title edits before inserting so SEO metadata stays in sync
    if (
      editAlt !== (selected.alt || '') ||
      editTitle !== (selected.title || '') ||
      editCaption !== (selected.caption || '')
    ) {
      try {
        await updateBlogMedia(selected._id, {
          title: editTitle,
          alt: editAlt,
          caption: editCaption,
        })
      } catch {
        // continue inserting even if background meta update fails
      }
    }
    onSelect({
      url: selected.url,
      alt: editAlt || editTitle || '',
      title: editTitle,
      caption: editCaption,
      width: insertWidth,
      align: insertAlign,
    })
    onClose?.()
  }

  const copyDirectUrl = () => {
    if (!selected) return
    const fullUrl = selected.url.startsWith('http')
      ? selected.url
      : `https://kitayar.ir${selected.url}`
    navigator.clipboard.writeText(fullUrl)
    toast.success('آدرس مستقیم تصویر کپی شد')
  }

  if (mode === 'modal' && !isOpen) return null

  const bodyContent = (
    <div
      className={`bg-white flex flex-col font-sans text-right ${
        mode === 'modal'
          ? 'w-full max-w-6xl h-[86vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden'
          : 'w-full min-h-[72vh] rounded-2xl border border-slate-200 shadow-xs overflow-hidden'
      }`}
      dir="rtl"
    >
      {/* Top WordPress Header & Tabs */}
      <div className="bg-slate-900 text-white px-5 pt-4 pb-0 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/25 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                کتابخانه پرونده‌های چندرسانه‌ای (سبک وردپرس)
              </h3>
              <p className="text-[11px] text-slate-400">
                مدیریت متمرکز تصاویر مقالات، تگ Alt سئو و درج مستقیم در ویرایشگر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-[11px] bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="flex items-center gap-1 text-slate-300">
                <HardDrive size={13} className="text-blue-400" />
                <span>{stats.totalFiles} پرونده</span>
                <span className="text-slate-500">({formatFileSize(stats.totalBytes)})</span>
              </span>
              {stats.missingAltCount > 0 && (
                <span className="flex items-center gap-1 text-amber-300 border-r border-slate-700 pr-2.5">
                  <AlertTriangle size={12} />
                  <span>{stats.missingAltCount} بدون متن جایگزین Alt</span>
                </span>
              )}
            </div>

            {mode === 'modal' && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UploadCloud size={15} />
            <span>بارگذاری پرونده‌ها</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'library'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon size={15} />
            <span>کتابخانه رسانه ({items.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {activeTab === 'upload' ? (
        <div className="flex-1 p-6 sm:p-10 flex flex-col items-center justify-center bg-slate-50">
          <div
            {...getRootProps()}
            className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
                : 'border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/30'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <UploadCloud size={32} />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-800 mb-2">
              {isDragActive
                ? 'پرونده‌ها را اینجا رها کنید...'
                : 'تصاویر را بکشید و اینجا رها کنید یا کلیک کنید'}
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              پشتیبانی از بارگذاری همزمان چند تصویر (JPG, PNG, WebP, GIF) • حداکثر حجم هر تصویر: ۱۵ مگابایت
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20">
              انتخاب پرونده‌ها از سیستم
            </span>

            {uploading && (
              <div className="mt-6 max-w-sm mx-auto space-y-2">
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-blue-700">در حال بارگذاری... {uploadProgress}%</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200/80 text-amber-800 px-4 py-2.5 rounded-xl">
            <Sparkles size={15} className="text-amber-600 shrink-0" />
            <span>
              نکته طلایی سئو: نام فایل قبل از آپلود به صورت خودکار به عنوان اولیه و متن جایگزین تبدیل می‌شود و بلافاصله قابل ویرایش است.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-white">
          {/* Left/Right: Media Grid */}
          <div className="flex-1 flex flex-col min-h-0 border-l border-slate-200">
            {/* Filter / Search Bar */}
            <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    loadMedia(e.target.value)
                  }}
                  placeholder="جستجوی تصویر بر اساس نام، عنوان یا تگ Alt..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <UploadCloud size={14} />
                <span>آپلود تصویر جدید</span>
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400">در حال بارگذاری تصاویر...</div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ImageIcon size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">هنوز تصویری در کتابخانه رسانه وجود ندارد</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    اولین تصویر را بارگذاری کنید
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {items.map((item) => {
                    const isSelected = selected?._id === item._id
                    const missingAlt = !item.alt || !item.alt.trim()
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleSelectCard(item)}
                        className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all bg-slate-100 text-right ${
                          isSelected
                            ? 'border-blue-600 ring-4 ring-blue-500/20 scale-[0.99]'
                            : 'border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.alt || item.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />

                        {isSelected && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}

                        {missingAlt && (
                          <span
                            title="فاقد متن جایگزین (Alt) برای سئو"
                            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-white text-[9px] font-bold"
                          >
                            بدون Alt
                          </span>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] font-bold text-white truncate">
                            {item.title || item.originalName}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* WordPress Right-Side Attachment Details Inspector */}
          <div className="w-full lg:w-84 xl:w-92 bg-slate-50/90 p-4 flex flex-col justify-between overflow-y-auto shrink-0">
            {!selected ? (
              <div className="my-auto text-center py-12 px-4 space-y-2 text-slate-400">
                <ImageIcon size={34} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">جزئیات پیوست و سئو تصویر</p>
                <p className="text-[11px] leading-relaxed">
                  روی یکی از تصاویر کلیک کنید تا پیش‌نمایش، لینک مستقیم و تنظیمات تگ Alt سئو آن نمایش داده شود.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2.5">
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    <img
                      src={selected.url}
                      alt={editAlt || editTitle}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="font-mono truncate max-w-[160px]" dir="ltr">
                      {selected.filename}
                    </span>
                    <span>{formatFileSize(selected.size)}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={copyDirectUrl}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Copy size={12} />
                      <span>کپی لینک تصویر</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <Trash2 size={12} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>

                {/* SEO Metadata Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      متن جایگزین (Alt سئو گوگل) *
                    </label>
                    <input
                      type="text"
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                      placeholder="توضیح دقیق تصویر همراه با کلمه کلیدی..."
                      className={`w-full px-3 py-2 rounded-xl border text-xs bg-white focus:outline-none ${
                        !editAlt.trim()
                          ? 'border-amber-300 focus:border-amber-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    {!editAlt.trim() && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        ⚠️ نوشتن متن جایگزین برای رتبه گرفتن در Google Images ضروری است.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      عنوان تصویر (Title)
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      زیرنویس تصویر در مقاله (Caption)
                    </label>
                    <textarea
                      rows={2}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      placeholder="توضیح اختیاری زیر عکس..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveMeta}
                    disabled={savingMeta}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Save size={13} />
                    <span>{savingMeta ? 'در حال ذخیره...' : 'ذخیره مشخصات سئو تصویر'}</span>
                  </button>
                </div>

                {/* Display Settings when inserting into editor */}
                {showInsertDisplaySettings && (
                  <div className="pt-3 border-t border-slate-200 space-y-2.5">
                    <p className="text-[11px] font-black text-slate-700">تنظیمات نمایش در متن مقاله</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">چینش تصویر</label>
                        <select
                          value={insertAlign}
                          onChange={(e) => setInsertAlign(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        >
                          <option value="center">وسط‌چین</option>
                          <option value="right">راست‌چین</option>
                          <option value="left">چپ‌چین</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">اندازه اولیه</label>
                        <select
                          value={insertWidth}
                          onChange={(e) => setInsertWidth(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        >
                          <option value={760}>کامل (۷۶۰px)</option>
                          <option value={560}>متوسط (۵۶۰px)</option>
                          <option value={340}>کوچک (۳۴۰px)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {onSelect && (
              <div className="pt-4 mt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={!selected}
                  onClick={handleConfirmSelection}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-black shadow-lg shadow-blue-600/20 transition"
                >
                  {selectButtonLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (mode === 'page') return bodyContent

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      {bodyContent}
    </div>
  )
}

export default WordPressMediaLibrary
