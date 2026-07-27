import { useQuestionStore } from '../store/useQuestionStore'

const MetaFieldsPanel = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  if (!draft.type) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
        <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-xs">⚙</span>
        اطلاعات تکمیلی
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">شماره درس</label>
          <input
            type="number"
            min={1}
            value={draft.lesson_id}
            onChange={(e) => setField('lesson_id', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                       focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
            placeholder="مثلاً ۵"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">شماره صفحه</label>
          <input
            type="number"
            min={1}
            value={draft.page_number}
            onChange={(e) => setField('page_number', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                       focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
            placeholder="مثلاً ۴۲"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">تصویر منبع</label>
          <input
            type="text"
            value={draft.source_image}
            onChange={(e) => setField('source_image', e.target.value)}
            className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                       focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all"
            placeholder="نام فایل تصویر"
          />
        </div>
      </div>
    </div>
  )
}

export default MetaFieldsPanel