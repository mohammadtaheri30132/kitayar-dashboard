import QuestionEditor from '../QuestionEditor'
import { useQuestionStore } from '../../store/useQuestionStore'

const RichAnswerEditor = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  return (
    <section className="editor-section">
      <h3>پاسخ</h3>
      <QuestionEditor
        key={draft.question_id}
        storageKey={`qmaker-answer-${draft.question_id}`}
        placeholderText="پاسخ را بنویسید..."
        onChange={(html) => setField('answer', html)}
      />
    </section>
  )
}

export default RichAnswerEditor