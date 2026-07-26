import { useQuestionStore } from '../../store/useQuestionStore'

const FillBlankAnswer = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  return (
    <section className="editor-section">
      <h3>پاسخ جای خالی</h3>
      <p className="hint-text">در متن صورت سوال، جای خالی را با نقطه‌چین (......) مشخص کنید.</p>
      <input
        type="text"
        className="text-input"
        value={draft.answer}
        onChange={(e) => setField('answer', e.target.value)}
        placeholder="پاسخ صحیح جای خالی"
      />
    </section>
  )
}

export default FillBlankAnswer