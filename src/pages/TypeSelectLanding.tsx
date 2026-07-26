import { useQuestionStore } from '../store/useQuestionStore'
import { ALL_TYPES, TYPE_LABELS, TYPE_DESCRIPTIONS } from '../types/question'

const TYPE_ICONS: Record<string, string> = {
  'گسترده-پاسخ': '📄',
  'کوتاه-پاسخ': '✍️',
  'جاخالی': '📝',
  'صحیح-غلط': '✅',
  'تستی': '🔘',
  'جورکردنی': '🔗',
}

const TypeSelectLanding = () => {
  const setType = useQuestionStore((s) => s.setType)

  return (
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ایجاد سوال جدید</h2>
        <p className="text-gray-500">نوع سوال مورد نظر خود را انتخاب کنید</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className="group bg-white border border-gray-200 rounded-xl p-6 text-right
                       hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100/50
                       hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <span className="text-3xl mb-3 block">{TYPE_ICONS[t]}</span>
            <div className="font-bold text-gray-800 mb-1 group-hover:text-primary-600 transition-colors">
              {TYPE_LABELS[t]}
            </div>
            <div className="text-sm text-gray-500 leading-relaxed">
              {TYPE_DESCRIPTIONS[t]}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TypeSelectLanding