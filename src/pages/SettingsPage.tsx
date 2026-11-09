import { useEffect, useState, useRef } from 'react'
import { courseService, fieldService, gradeService, bookService } from '../services/courseService'
import { settingsCourseService, settingsFieldService, settingsGradeService, settingsBookService } from '../services/settingsService'
import type { CourseData, FieldData, GradeData, BookData } from '../services/courseService'
import toast from 'react-hot-toast'

// ==================== Types ====================
type ViewMode = 'list' | 'create' | 'edit'

interface TreeNode {
  type: 'course' | 'field' | 'grade' | 'book'
  data: any
  children?: TreeNode[]
  expanded?: boolean
  loaded?: boolean
  loading?: boolean
}

// ==================== Component ====================
const SettingsPage = () => {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'course' | 'field' | 'grade' | 'book'>('course')
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', description: '', order: 1, icon: '📖', parentId: '', image: '', color: '#38BDF8' })
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const icons = ['📐', '📖', '🔬', '🌍', '🧪', '⚡', '📿', '🌟', '💻', '🎨', '🏛️', '🗺️']
  const coursePresetColors = [
    { name: 'آبی آسمانی', hex: '#38BDF8' },
    { name: 'بنفش', hex: '#A855E8' },
    { name: 'سبز زمردی', hex: '#10B981' },
    { name: 'نارنجی / کهربایی', hex: '#F59E0B' },
    { name: 'صورتی', hex: '#EC4899' },
    { name: 'نیلی / ایندیگو', hex: '#6366F1' },
    { name: 'فیروزه‌ای', hex: '#06B6D4' },
    { name: 'مرجانی / سرخ', hex: '#EF4444' },
    { name: 'سبز کله‌غازی', hex: '#14B8A6' },
  ]

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return ''
    if (imagePath.startsWith('http')) return imagePath
    const backendBase = window.location.hostname === 'localhost' ? 'http://localhost:5001' : `http://${window.location.hostname}:5001`
    return `${backendBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
  }

  // ==================== Load Root ====================
  useEffect(() => {
    loadTree()
  }, [])

  const loadTree = async () => {
    setLoading(true)
    try {
      const res = await courseService.getAll()
      if (res.success) {
        const nodes: TreeNode[] = res.data.map((course: CourseData) => ({
          type: 'course' as const,
          data: course,
          expanded: false,
          loaded: false,
        }))
        setTree(nodes)
      }
    } catch (err) {
      toast.error('❌ خطا در دریافت داده‌ها')
    } finally {
      setLoading(false)
    }
  }

  // ==================== Toggle Expand & Load Children ====================
  const toggleNode = async (path: number[]) => {
    const newTree = [...tree]
    let current = newTree
    
    // مسیر رو دنبال کن تا به نود مورد نظر برسیم
    let target: TreeNode | null = null
    for (let i = 0; i < path.length; i++) {
      target = current[path[i]]
      if (i < path.length - 1) {
        current = target.children || []
      }
    }

    if (!target) return

    // Toggle expand
    target.expanded = !target.expanded

    // اگر باز شده و children لود نشده، لود کن
    if (target.expanded && !target.loaded) {
      target.loading = true
      setTree([...newTree])

      try {
        let children: TreeNode[] = []

        if (target.type === 'course') {
          const res = await fieldService.getByCourse(target.data._id)
          if (res.success) {
            children = res.data.map((field: FieldData) => ({
              type: 'field' as const,
              data: field,
              expanded: false,
              loaded: false,
            }))
          }
        } else if (target.type === 'field') {
          const courseId = target.data.course?._id || target.data.course
          const res = await gradeService.getByCourse(courseId, target.data._id)
          if (res.success) {
            children = res.data.map((grade: GradeData) => ({
              type: 'grade' as const,
              data: grade,
              expanded: false,
              loaded: false,
            }))
          }
        } else if (target.type === 'grade') {
          const res = await bookService.getByGrade(target.data._id)
          if (res.success) {
            children = res.data.map((book: BookData) => ({
              type: 'book' as const,
              data: book,
            }))
          }
        }

        target.children = children
        target.loaded = true
      } catch (err) {
        toast.error('❌ خطا در دریافت زیرمجموعه‌ها')
      } finally {
        target.loading = false
      }
    }

    setTree([...newTree])
  }

  // ==================== CRUD Operations ====================
  const openCreateForm = (parentType?: string, parentId?: string) => {
    let type: 'course' | 'field' | 'grade' | 'book' = 'course'
    let pId = ''

    if (parentType === 'course') {
      type = 'field'
      pId = parentId || ''
    } else if (parentType === 'field') {
      type = 'grade'
      pId = parentId || ''
    } else if (parentType === 'grade') {
      type = 'book'
      pId = parentId || ''
    }

    setFormType(type)
    setEditId(null)
    setFormData({ name: '', code: '', description: '', order: 1, icon: '📖', parentId: pId, image: '', color: '#38BDF8' })
    setShowForm(true)
  }

  const openEditForm = (type: 'course' | 'field' | 'grade' | 'book', item: any) => {
    setFormType(type)
    setEditId(item._id)
    setFormData({
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      order: item.order || 1,
      icon: item.icon || '📖',
      parentId: item.course?._id || item.course || item.field?._id || item.field || item.grade || '',
      image: item.image || '',
      color: item.color || '#38BDF8',
    })
    setShowForm(true)
  }

  const handleCourseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('⚠️ فقط فایل‌های تصویری مجاز هستند')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('⚠️ حداکثر حجم فایل ۱۰ مگابایت است')
      return
    }

    try {
      setUploadingImage(true)
      const res = await settingsCourseService.uploadImage(file)
      if (res.success && res.url) {
        setFormData(prev => ({ ...prev, image: res.url }))
        toast.success('✅ تصویر دوره با موفقیت بارگذاری شد')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '❌ خطا در بارگذاری تصویر')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (type: string, id: string) => {
    const labels: Record<string, string> = {
      course: 'دوره و تمام زیرمجموعه‌هایش',
      field: 'رشته و پایه‌های مرتبط',
      grade: 'پایه و درس‌های مرتبط',
      book: 'درس',
    }

    if (!confirm(`⚠️ آیا از حذف این ${labels[type] || 'آیتم'} اطمینان دارید؟`)) return

    try {
      let res
      if (type === 'course') res = await settingsCourseService.delete(id)
      else if (type === 'field') res = await settingsFieldService.delete(id)
      else if (type === 'grade') res = await settingsGradeService.delete(id)
      else if (type === 'book') res = await settingsBookService.delete(id)

      if (res?.success) {
        toast.success('✅ حذف شد')
        loadTree() // ریلود کامل درخت
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '❌ خطا')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('⚠️ نام الزامی است')
      return
    }

    try {
      let res
      if (formType === 'course') {
        const data = { 
          name: formData.name, 
          code: formData.code || formData.name.slice(0, 3).toUpperCase(), 
          description: formData.description, 
          order: formData.order,
          image: formData.image || null,
          color: formData.color || '#38BDF8',
        }
        res = editId ? await settingsCourseService.update(editId, data) : await settingsCourseService.create(data)
      } else if (formType === 'field') {
        const data = { name: formData.name, course: formData.parentId, order: formData.order }
        res = editId ? await settingsFieldService.update(editId, { name: formData.name, order: formData.order }) : await settingsFieldService.create(data)
      } else if (formType === 'grade') {
        // course رو باید از parent field استخراج کنیم - ولی چون توی tree داریم، از formData.parentId استفاده می‌کنیم
        const courseId = tree.find(c => c.data._id === formData.parentId)?.data._id || 
          tree.flatMap(c => c.children || []).find(f => f?.data?._id === formData.parentId)?.data?.course
        const data = { name: formData.name, course: courseId || formData.parentId, field: formData.parentId, order: formData.order }
        res = editId ? await settingsGradeService.update(editId, { name: formData.name, order: formData.order }) : await settingsGradeService.create(data)
      } else if (formType === 'book') {
        const data = { name: formData.name, grade: formData.parentId, order: formData.order, icon: formData.icon }
        res = editId ? await settingsBookService.update(editId, { name: formData.name, order: formData.order, icon: formData.icon }) : await settingsBookService.create(data)
      }

      if (res?.success) {
        toast.success(editId ? '✅ ویرایش شد' : '✅ ایجاد شد')
        setShowForm(false)
        loadTree()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '❌ خطا')
    }
  }

  // ==================== Render Tree ====================
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return '📚'
      case 'field': return '🎯'
      case 'grade': return '🏫'
      case 'book': return '📖'
      default: return '📄'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return 'دوره'
      case 'field': return 'رشته'
      case 'grade': return 'پایه'
      case 'book': return 'درس'
      default: return ''
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'border-r-4 border-r-green-500'
      case 'field': return 'border-r-4 border-r-primary-500'
      case 'grade': return 'border-r-4 border-r-orange-500'
      case 'book': return 'border-r-4 border-r-purple-500'
      default: return ''
    }
  }

  const renderNode = (node: TreeNode, path: number[], depth: number) => {
    const isExpandable = node.type !== 'book'
    const hasChildren = node.children && node.children.length > 0
    const badge = node.type === 'course' ? node.data.code : 
                  node.type === 'book' ? (node.data.totalQuestions || 0) + ' سوال' : ''

    return (
      <div key={node.data._id + path.join('-')}>
        <div
          className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer group ${getTypeColor(node.type)}`}
          style={{ paddingRight: `${depth * 24 + 16}px` }}
          onClick={() => isExpandable && toggleNode(path)}
        >
          {/* Expand icon */}
          {isExpandable ? (
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              {node.loading ? (
                <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-slate-500 transition-transform ${node.expanded ? 'rotate-90 text-indigo-400' : ''}`}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </span>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          {/* Type icon */}
          {node.type === 'course' && node.data.image ? (
            <img 
              src={getImageUrl(node.data.image)} 
              alt={node.data.name} 
              className="w-6 h-6 rounded-md object-contain shrink-0 bg-slate-900 border border-slate-700 p-0.5" 
            />
          ) : (
            <span className="text-lg shrink-0">
              {node.type === 'book' ? (node.data.icon || '📖') : getTypeIcon(node.type)}
            </span>
          )}

          {/* Name */}
          <span className="flex-1 text-xs font-semibold text-slate-200 truncate">
            {node.data.name}
          </span>

          {/* Course Color Pill */}
          {node.type === 'course' && (
            <div
              className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/60 shadow-sm"
              title={`رنگ باکس: ${node.data.color || '#38BDF8'}`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/25 shadow-sm shrink-0"
                style={{ backgroundColor: node.data.color || '#38BDF8' }}
              />
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {node.data.color || '#38BDF8'}
              </span>
            </div>
          )}

          {/* Badge */}
          {badge && (
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700/60 font-mono shrink-0">
              {badge}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {node.type === 'book' ? (
              <button onClick={(e) => { e.stopPropagation(); openEditForm('book', node.data) }}
                className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-indigo-400 text-xs transition" title="ویرایش">✏️</button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); openCreateForm(node.type, node.data._id) }}
                className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-400 text-xs transition" title="افزودن زیرمجموعه">➕</button>
            )}
            {node.type !== 'book' && (
              <button onClick={(e) => { e.stopPropagation(); openEditForm(node.type as any, node.data) }}
                className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-indigo-400 text-xs transition" title="ویرایش">✏️</button>
            )}
            <button onClick={(e) => { e.stopPropagation(); handleDelete(node.type, node.data._id) }}
              className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-400 text-xs transition" title="حذف">🗑️</button>
          </div>
        </div>

        {/* Children */}
        {node.expanded && node.children && (
          <div className="border-t border-slate-800/40">
            {node.children.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs" style={{ paddingRight: `${depth * 24 + 40}px` }}>
                {getTypeLabel(node.type === 'course' ? 'field' : node.type === 'field' ? 'grade' : 'book')}‌ای وجود ندارد
              </div>
            ) : (
              node.children.map((child, idx) => renderNode(child, [...path, idx], depth + 1))
            )}
          </div>
        )}
      </div>
    )
  }

  // ==================== Main Render ====================
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>⚙️</span>
            <span>تنظیمات ساختار آموزشی</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت ساختار دوره‌ها، رشته‌ها، پایه‌ها و کتاب‌های درسی سامانه</p>
        </div>
        <button
          onClick={() => openCreateForm()}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition active:scale-95"
        >
          + افزودن دوره جدید
        </button>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">در حال بارگذاری درخت آموزشی...</p>
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800">
          <span className="text-6xl mb-4 block opacity-50">📚</span>
          <p className="text-slate-400 mb-4 text-xs font-medium">هیچ دوره‌ای تعریف نشده است</p>
          <button
            onClick={() => openCreateForm()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
          >
            + ایجاد اولین دوره
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-xl divide-y divide-slate-800/50">
          {tree.map((node, idx) => renderNode(node, [idx], 0))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-xs text-gray-500 justify-center">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm" /> دوره</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary-500 rounded-sm" /> رشته</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-500 rounded-sm" /> پایه</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-500 rounded-sm" /> درس</div>
      </div>

      {/* ==================== Modal Form ==================== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] backdrop-blur-md" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-[90%] max-w-lg shadow-2xl text-slate-100" dir="rtl">
            
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <span className="text-2xl">{getTypeIcon(formType)}</span>
              <h3 className="text-base font-bold text-white">
                {editId ? '✏️ ویرایش' : '➕ ایجاد'} {getTypeLabel(formType)}
              </h3>
            </div>

            <div className="space-y-4">
              {/* نام */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام *</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder={formType === 'course' ? 'مثلاً: دوره ابتدایی' : formType === 'field' ? 'مثلاً: علوم تجربی' : formType === 'grade' ? 'مثلاً: پایه دهم' : 'مثلاً: ریاضی دهم'}
                />
              </div>

              {/* کد - فقط دوره */}
              {formType === 'course' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">کد (انگلیسی)</label>
                  <input
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
                    placeholder="مثلاً: ELEMENTARY"
                  />
                </div>
              )}

              {/* توضیحات - فقط دوره */}
              {formType === 'course' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">توضیحات</label>
                  <input
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* رنگ باکس محتوای آموزشی - فقط دوره */}
              {formType === 'course' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <span>🎨</span>
                      <span>رنگ باکس محتوای آموزشی (اپلیکیشن)</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700/60 text-indigo-400">
                      {formData.color || '#38BDF8'}
                    </span>
                  </div>

                  {/* پالت رنگ‌های آماده */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {coursePresetColors.map(preset => {
                      const isSelected = (formData.color || '').toLowerCase() === preset.hex.toLowerCase()
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: preset.hex }))}
                          className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${
                            isSelected
                              ? 'border-white scale-110 shadow-lg shadow-black/40 ring-2 ring-indigo-500/50'
                              : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* انتخابگر سفارشی و پیش‌نمایش زنده */}
                  <div className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
                    <div className="relative shrink-0 flex items-center">
                      <input
                        type="color"
                        value={formData.color || '#38BDF8'}
                        onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                        title="انتخاب رنگ سفارشی"
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#38BDF8"
                      className="w-28 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:border-indigo-500 outline-none shrink-0"
                    />

                    {/* کارت پیش‌نمایش در موبایل */}
                    <div
                      className="flex-1 flex flex-col justify-center px-3 py-2 rounded-xl border transition-colors min-w-0"
                      style={{
                        backgroundColor: `${formData.color || '#38BDF8'}18`,
                        borderColor: `${formData.color || '#38BDF8'}40`,
                      }}
                    >
                      <span className="text-xs font-bold truncate" style={{ color: formData.color || '#38BDF8' }}>
                        پیش‌نمایش در اپ
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        پس‌زمینه و بوردر نرم
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* تصویر ۳ بعدی دوره - فقط دوره */}
              {formType === 'course' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">تصویر دوره (آیکون ۳ بعدی)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCourseImageUpload}
                  />

                  {formData.image ? (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img
                          src={getImageUrl(formData.image)}
                          alt="Course preview"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 font-semibold truncate mb-1">تصویر بارگذاری شده</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{formData.image}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-semibold"
                        >
                          {uploadingImage ? 'در حال آپلود...' : 'تغییر'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="px-3 py-1.5 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors border border-rose-500/30 font-semibold"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploadingImage && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-4 text-center cursor-pointer transition-all"
                    >
                      {uploadingImage ? (
                        <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 py-2">
                          <span className="animate-spin text-base">⏳</span>
                          در حال بارگذاری تصویر...
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          <span className="text-3xl block">🖼️</span>
                          <p className="text-xs text-slate-300 font-semibold">برای انتخاب و آپلود تصویر کلیک کنید</p>
                          <p className="text-[10px] text-slate-500">فرمت‌های PNG، JPG، WebP، SVG (حداکثر ۱۰ مگابایت)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* آیکون - فقط درس */}
              {formType === 'book' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">آیکون</label>
                  <div className="flex flex-wrap gap-2">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 text-xl rounded-xl border transition-all ${
                          formData.icon === icon
                            ? 'border-indigo-500 bg-indigo-500/20 scale-110 shadow-sm'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:scale-105'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ترتیب */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">ترتیب نمایش</label>
                <input
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={e => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800 rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
              >
                {editId ? '💾 ذخیره تغییرات' : '✅ ایجاد'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
