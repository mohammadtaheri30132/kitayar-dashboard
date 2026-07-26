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
    <section className="editor-section">
      <h3>گزینه‌ها</h3>
      {draft.options.map((opt, idx) => (
        <div key={idx} className="option-row">
          <input type="radio" name="mc-answer" checked={opt !== '' && draft.answer === opt} onChange={() => setField('answer', opt)} />
          <input
            type="text"
            className="text-input"
            value={opt}
            onChange={(e) => handleOptionChange(idx, e.target.value)}
            placeholder={`گزینه ${idx + 1}`}
          />
          <button type="button" className="btn btn-secondary" onClick={() => handleRemoveOption(idx)}>
            حذف
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={handleAddOption}>
        + افزودن گزینه
      </button>
      <p className="hint-text">گزینه‌ی صحیح را با کلیک روی دایره‌ی کنارش مشخص کنید.</p>
    </section>
  )
}

export default MultipleChoiceAnswer