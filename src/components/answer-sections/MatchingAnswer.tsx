import { useQuestionStore } from '../../store/useQuestionStore'

const MatchingAnswer = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setMatchingLeft = useQuestionStore((s) => s.setMatchingLeft)
  const setMatchingRight = useQuestionStore((s) => s.setMatchingRight)
  const setField = useQuestionStore((s) => s.setField)

  const pairCount = Math.max(draft.matching_left.length, draft.matching_right.length)

  const recomputeAnswer = (left: string[], right: string[]) => {
    const pairs = left
      .map((l, i) => (l.trim() || right[i]?.trim() ? `${l} ← ${right[i] ?? ''}` : ''))
      .filter(Boolean)
    setField('answer', pairs.join('، '))
  }

  const handleAddPair = () => {
    setMatchingLeft([...draft.matching_left, ''])
    setMatchingRight([...draft.matching_right, ''])
  }

  const handleRemovePair = (idx: number) => {
    const left = draft.matching_left.filter((_, i) => i !== idx)
    const right = draft.matching_right.filter((_, i) => i !== idx)
    setMatchingLeft(left)
    setMatchingRight(right)
    recomputeAnswer(left, right)
  }

  const handleLeftChange = (idx: number, value: string) => {
    const left = [...draft.matching_left]
    left[idx] = value
    setMatchingLeft(left)
    recomputeAnswer(left, draft.matching_right)
  }

  const handleRightChange = (idx: number, value: string) => {
    const right = [...draft.matching_right]
    right[idx] = value
    setMatchingRight(right)
    recomputeAnswer(draft.matching_left, right)
  }

  return (
    <section className="editor-section">
      <h3>موارد جورکردنی</h3>
      {Array.from({ length: pairCount }).map((_, idx) => (
        <div key={idx} className="matching-row">
          <input
            type="text"
            className="text-input"
            value={draft.matching_left[idx] || ''}
            onChange={(e) => handleLeftChange(idx, e.target.value)}
            placeholder="ستون اول"
          />
          <span className="matching-arrow">←</span>
          <input
            type="text"
            className="text-input"
            value={draft.matching_right[idx] || ''}
            onChange={(e) => handleRightChange(idx, e.target.value)}
            placeholder="ستون دوم"
          />
          <button type="button" className="btn btn-secondary" onClick={() => handleRemovePair(idx)}>
            حذف
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={handleAddPair}>
        + افزودن جفت
      </button>
      {draft.answer && <p className="hint-text">پاسخ خودکار: {draft.answer}</p>}
    </section>
  )
}

export default MatchingAnswer