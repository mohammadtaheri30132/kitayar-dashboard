import { useQuestionStore } from '../../store/useQuestionStore'

const TrueFalseAnswer = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">پاسخ صحیح</h3>
      <div className="flex gap-4">
        <label
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all
            ${draft.answer === 'صحیح'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-gray-300'}`}
        >
          <input
            type="radio"
            name="tf-answer"
            checked={draft.answer === 'صحیح'}
            onChange={() => setField('answer', 'صحیح')}
            className="hidden"
          />
          <span className="text-lg">✅</span>
          <span className="font-medium">صحیح</span>
        </label>

        <label
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all
            ${draft.answer === 'غلط'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 hover:border-gray-300'}`}
        >
          <input
            type="radio"
            name="tf-answer"
            checked={draft.answer === 'غلط'}
            onChange={() => setField('answer', 'غلط')}
            className="hidden"
          />
          <span className="text-lg">❌</span>
          <span className="font-medium">غلط</span>
        </label>
      </div>
    </div>
  )
}

export default TrueFalseAnswer