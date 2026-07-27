import { useQuestionStore } from '../../store/useQuestionStore'

const MultipleChoiceAnswer = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setOptions = useQuestionStore((s) => s.setOptions)
  const setField = useQuestionStore((s) => s.setField)

  const handleOptionChange = (idx: number, value: string) => {
    const oldValue = draft.options[idx]
    const next = [...draft.options]
    next[idx] = value
    setOptions(next)
    if (draft.answer === oldValue) setField('answer', value)
  }

  const handleAddOption = () => setOptions([...draft.options, ''])
  const handleRemoveOption = (idx: number) => {
    const removed = draft.options[idx]
    setOptions(draft.options.filter((_, i) => i !== idx))
    if (draft.answer === removed) setField('answer', '')
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">گزینه‌ها</h3>

      {draft.options.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <p className="text-sm mb-2">هنوز گزینه‌ای اضافه نشده</p>
          <button
            type="button"
            onClick={handleAddOption}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50
                       rounded-lg hover:bg-primary-100 transition-colors"
          >
            + افزودن گزینه اول
          </button>
        </div>
      )}

      <div className="space-y-3">
        {draft.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setField('answer', opt)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${opt !== '' && draft.answer === opt
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 hover:border-primary-400'}`}
            >
              {opt !== '' && draft.answer === opt && (
                <span className="w-2 h-2 bg-white rounded-full" />
              )}
            </button>

            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`گزینه ${idx + 1}`}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                         outline-none transition-all"
            />

            <button
              type="button"
              onClick={() => handleRemoveOption(idx)}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-danger-500
                         hover:bg-danger-50 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {draft.options.length > 0 && (
        <button
          type="button"
          onClick={handleAddOption}
          className="mt-3 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50
                     rounded-lg hover:bg-primary-100 transition-colors"
        >
          + افزودن گزینه
        </button>
      )}

      <p className="text-xs text-gray-500 mt-3">گزینهٔ صحیح را با کلیک روی دایرهٔ کنارش مشخص کنید.</p>
    </div>
  )
}

export default MultipleChoiceAnswer