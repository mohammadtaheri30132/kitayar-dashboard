import { useQuestionStore } from '../../store/useQuestionStore'

const FillBlankAnswer = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-2">پاسخ جای خالی</h3>
      <p className="text-xs text-gray-500 mb-3">در متن صورت سوال، جای خالی را با نقطه‌چین (......) مشخص کنید.</p>
      <input
        type="text"
        value={draft.answer}
        onChange={(e) => setField('answer', e.target.value)}
        placeholder="پاسخ صحیح جای خالی"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                   focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                   outline-none transition-all"
      />
    </div>
  )
}

export default FillBlankAnswer