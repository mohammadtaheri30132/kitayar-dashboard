import { useQuestionStore } from '../store/useQuestionStore'

const MetaFieldsPanel = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  if (!draft.type) return null

  // تبدیل page_number به رشته برای نمایش
  const pageNumberStr = Array.isArray(draft.page_number) 
    ? draft.page_number.join('، ') 
    : (draft.page_number || '')

  const handlePageNumberChange = (value: string) => {
    // پشتیبانی از فرمت‌های مختلف: "5"، "5, 8"، "4-7"
    const trimmed = value.trim()
    if (!trimmed) {
      setField('page_number', [])
      return
    }

    // حالت range: "4-8"
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1])
      const end = parseInt(rangeMatch[2])
      if (start > 0 && end >= start) {
        setField('page_number', Array.from({ length: end - start + 1 }, (_, i) => start + i))
        return
      }
    }

    // جدا کردن با کاما، "و"، یا فاصله
    const parts = trimmed.split(/[,،و\s]+/).filter(Boolean)
    const numbers = parts.map(p => parseInt(p)).filter(n => !isNaN(n) && n > 0)
    setField('page_number', numbers)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <h3 className="text-sm font-bold text-gray-700 mb-5">⚙️ اطلاعات تکمیلی</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">شماره درس</label>
          <input
            type="number" min={1}
            value={draft.lesson_id}
            onChange={(e) => setField('lesson_id', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none"
            placeholder="مثلاً ۵"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            شماره صفحه(ها)
            <span className="text-gray-400 font-normal text-xs mr-1">(مثلاً: ۴، ۸ یا ۴-۷)</span>
          </label>
          <input
            type="text"
            value={pageNumberStr}
            onChange={(e) => handlePageNumberChange(e.target.value)}
            className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none"
            placeholder="مثلاً ۴۲ یا ۴، ۸"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">تصویر منبع</label>
          <input
            type="text"
            value={draft.source_image}
            onChange={(e) => setField('source_image', e.target.value)}
            className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none"
            placeholder="نام فایل"
          />
        </div>
      </div>
    </div>
  )
}

export default MetaFieldsPanel
