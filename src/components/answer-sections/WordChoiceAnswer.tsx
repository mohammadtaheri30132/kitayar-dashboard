import { useQuestionStore } from '../../store/useQuestionStore'

const WordChoiceAnswer = () => {
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

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">گزینه‌های انتخاب کلمه</h3>
      <p className="text-xs text-gray-500 mb-4">کلماتی که دانش‌آموز باید از بین آنها انتخاب کند را وارد کنید و گزینه صحیح را مشخص کنید.</p>
      <div className="space-y-3">
        {draft.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setField('answer', opt)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${opt !== '' && draft.answer === opt ? 'border-primary-500 bg-primary-500' : 'border-gray-300 hover:border-primary-400'}`}>
              {opt !== '' && draft.answer === opt && <span className="w-2 h-2 bg-white rounded-full" />}
            </button>
            <input type="text" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`کلمه ${idx + 1}`}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none" />
            <button type="button" onClick={() => { setOptions(draft.options.filter((_, i) => i !== idx)); if (draft.answer === opt) setField('answer', '') }}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setOptions([...draft.options, ''])}
        className="mt-3 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100">
        + افزودن کلمه
      </button>
    </div>
  )
}

export default WordChoiceAnswer
