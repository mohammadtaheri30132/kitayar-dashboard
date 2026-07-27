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
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">موارد جورکردنی</h3>

      {pairCount === 0 && (
        <div className="text-center py-6 text-gray-400">
          <p className="text-sm mb-2">هنوز جفتی اضافه نشده</p>
          <button
            type="button"
            onClick={handleAddPair}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50
                       rounded-lg hover:bg-primary-100 transition-colors"
          >
            + افزودن اولین جفت
          </button>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: pairCount }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <input
              type="text"
              value={draft.matching_left[idx] || ''}
              onChange={(e) => handleLeftChange(idx, e.target.value)}
              placeholder="ستون اول"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                         outline-none transition-all"
            />
            <span className="text-primary-500 font-bold text-lg shrink-0">→</span>
            <input
              type="text"
              value={draft.matching_right[idx] || ''}
              onChange={(e) => handleRightChange(idx, e.target.value)}
              placeholder="ستون دوم"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                         outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => handleRemovePair(idx)}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-danger-500
                         hover:bg-danger-50 rounded-lg transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {pairCount > 0 && (
        <button
          type="button"
          onClick={handleAddPair}
          className="mt-3 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50
                     rounded-lg hover:bg-primary-100 transition-colors"
        >
          + افزودن جفت
        </button>
      )}

      {draft.answer && (
        <p className="text-xs text-gray-500 mt-3 bg-gray-50 p-3 rounded-lg">
          پاسخ خودکار: <span className="font-mono text-gray-700">{draft.answer}</span>
        </p>
      )}
    </div>
  )
}

export default MatchingAnswer