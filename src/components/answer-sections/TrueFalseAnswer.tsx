import { useQuestionStore } from '../../store/useQuestionStore'

const TrueFalseAnswer = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  return (
    <section className="editor-section">
      <h3>پاسخ صحیح</h3>
      <div className="radio-row">
        <label>
          <input type="radio" name="tf-answer" checked={draft.answer === 'صحیح'} onChange={() => setField('answer', 'صحیح')} />
          صحیح
        </label>
        <label>
          <input type="radio" name="tf-answer" checked={draft.answer === 'غلط'} onChange={() => setField('answer', 'غلط')} />
          غلط
        </label>
      </div>
    </section>
  )
}

export default TrueFalseAnswer