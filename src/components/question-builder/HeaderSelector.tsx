import { useState } from 'react'

interface HeaderItem {
  id: string
  title: string
  subtitle?: string
  fields?: { label: string; value: string }[]
}

interface Props {
  headers: HeaderItem[]
  selectedHeaderId: string | null
  onSelect: (id: string) => void
  onAddHeader: (header: HeaderItem) => void
  onDeleteHeader: (id: string) => void
}

const HeaderSelector: React.FC<Props> = ({ headers, selectedHeaderId, onSelect, onAddHeader, onDeleteHeader }) => {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [fields, setFields] = useState<{ label: string; value: string }[]>([])

  const handleAddField = () => setFields([...fields, { label: '', value: '' }])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAddHeader({
      id: `header-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      fields: fields.filter(f => f.label.trim() && f.value.trim()),
    })
    setTitle('')
    setSubtitle('')
    setFields([])
    setShowForm(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700">📋 هدرها</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100">
          {showForm ? '✕ بستن' : '+ هدر جدید'}
        </button>
      </div>

      {/* فرم افزودن هدر */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">عنوان هدر *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="مثلاً: آزمون ریاضی نیمسال اول" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">زیرعنوان</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="اختیاری" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">فیلدهای اضافه (مثلاً: نام دانش‌آموز، تاریخ)</label>
            {fields.map((f, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input value={f.label} onChange={e => { const n = [...fields]; n[idx].label = e.target.value; setFields(n) }} placeholder="برچسب" className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                <input value={f.value} onChange={e => { const n = [...fields]; n[idx].value = e.target.value; setFields(n) }} placeholder="مقدار" className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                <button type="button" onClick={() => setFields(fields.filter((_, i) => i !== idx))} className="text-red-500 px-2">✕</button>
              </div>
            ))}
            <button type="button" onClick={handleAddField} className="text-xs text-primary-600 hover:underline">+ فیلد</button>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium">ذخیره هدر</button>
        </form>
      )}

      {/* لیست هدرها */}
      <div className="flex flex-wrap gap-2">
        {headers.length === 0 && <p className="text-xs text-gray-400">هیچ هدری تعریف نشده</p>}
        {headers.map(h => (
          <div key={h.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${selectedHeaderId === h.id ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <button onClick={() => onSelect(h.id)} className="text-sm font-medium text-gray-700">
              {h.title}
            </button>
            <button onClick={() => onDeleteHeader(h.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeaderSelector
