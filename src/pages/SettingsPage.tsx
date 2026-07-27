import { useEffect, useState } from 'react'
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
  const [formData, setFormData] = useState({ name: '', code: '', description: '', order: 1, icon: '📖', parentId: '' })

  const icons = ['📐', '📖', '🔬', '🌍', '🧪', '⚡', '📿', '🌟', '💻', '🎨', '🏛️', '🗺️']

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
    setFormData({ name: '', code: '', description: '', order: 1, icon: '📖', parentId: pId })
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
    })
    setShowForm(true)
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
        const data = { name: formData.name, code: formData.code || formData.name.slice(0, 3).toUpperCase(), description: formData.description, order: formData.order }
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
          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group ${getTypeColor(node.type)}`}
          style={{ paddingRight: `${depth * 24 + 16}px` }}
          onClick={() => isExpandable && toggleNode(path)}
        >
          {/* Expand icon */}
          {isExpandable ? (
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              {node.loading ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-gray-400 transition-transform ${node.expanded ? 'rotate-90' : ''}`}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </span>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          {/* Type icon */}
          <span className="text-lg shrink-0">
            {node.type === 'book' ? (node.data.icon || '📖') : getTypeIcon(node.type)}
          </span>

          {/* Name */}
          <span className="flex-1 text-sm font-medium text-gray-800 truncate">
            {node.data.name}
          </span>

          {/* Badge */}
          {badge && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
              {badge}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {node.type === 'book' ? (
              <button onClick={(e) => { e.stopPropagation(); openEditForm('book', node.data) }}
                className="p-1 hover:bg-primary-50 rounded text-primary-500 text-xs" title="ویرایش">✏️</button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); openCreateForm(node.type, node.data._id) }}
                className="p-1 hover:bg-green-50 rounded text-green-500 text-xs" title="افزودن زیرمجموعه">➕</button>
            )}
            {node.type !== 'book' && (
              <button onClick={(e) => { e.stopPropagation(); openEditForm(node.type as any, node.data) }}
                className="p-1 hover:bg-primary-50 rounded text-primary-500 text-xs" title="ویرایش">✏️</button>
            )}
            <button onClick={(e) => { e.stopPropagation(); handleDelete(node.type, node.data._id) }}
              className="p-1 hover:bg-red-50 rounded text-red-500 text-xs" title="حذف">🗑️</button>
          </div>
        </div>

        {/* Children */}
        {node.expanded && node.children && (
          <div className="border-t border-gray-50">
            {node.children.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-xs" style={{ paddingRight: `${depth * 24 + 40}px` }}>
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
    <div className="max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⚙️ تنظیمات</h2>
          <p className="text-sm text-gray-500">مدیریت ساختار آموزشی (دوره → رشته → پایه → درس)</p>
        </div>
        <button onClick={() => openCreateForm()} className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 shadow-sm transition-colors">
          + افزودن دوره جدید
        </button>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="flex justify-center py-32">
          <svg className="animate-spin h-10 w-10 text-primary-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <span className="text-6xl mb-4 block">📚</span>
          <p className="text-gray-500 mb-4">هیچ دوره‌ای تعریف نشده است</p>
          <button onClick={() => openCreateForm()} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600">
            + ایجاد اولین دوره
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-[90%] max-w-lg shadow-2xl" dir="rtl">
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{getTypeIcon(formType)}</span>
              <h3 className="text-lg font-bold text-gray-800">
                {editId ? '✏️ ویرایش' : '➕ ایجاد'} {getTypeLabel(formType)}
              </h3>
            </div>

            <div className="space-y-4">
              {/* نام */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">نام *</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
                  placeholder={formType === 'course' ? 'مثلاً: دوره ابتدایی' : formType === 'field' ? 'مثلاً: علوم تجربی' : formType === 'grade' ? 'مثلاً: پایه دهم' : 'مثلاً: ریاضی دهم'}
                />
              </div>

              {/* کد - فقط دوره */}
              {formType === 'course' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">کد (انگلیسی)</label>
                  <input
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none"
                    placeholder="مثلاً: ELEMENTARY"
                  />
                </div>
              )}

              {/* توضیحات - فقط دوره */}
              {formType === 'course' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">توضیحات</label>
                  <input
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none"
                  />
                </div>
              )}

              {/* آیکون - فقط درس */}
              {formType === 'book' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">آیکون</label>
                  <div className="flex flex-wrap gap-2">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                          formData.icon === icon
                            ? 'border-primary-500 bg-primary-50 scale-110 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:scale-105'
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
                <label className="block text-xs font-bold text-gray-600 mb-1.5">ترتیب نمایش</label>
                <input
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={e => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
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
