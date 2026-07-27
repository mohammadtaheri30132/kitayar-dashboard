import { useEffect } from 'react'
import QuestionEditor from '../QuestionEditor'
import { useQuestionStore } from '../../store/useQuestionStore'

const RichAnswerEditor = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  // اگر answer به صورت متن ساده است (نه HTML)، تبدیل به HTML کن
  useEffect(() => {
    if (draft.answer && !draft.answer.includes('<') && !draft.answer.includes('>')) {
      // متن ساده است - میتونیم بذاریم همون باشه یا تبدیل به پاراگراف کنیم
      // فعلاً کاری نمیکنیم - QuestionEditor خودش متن رو قبول میکنه
    }
  }, [])

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-4">پاسخ</h3>
      <QuestionEditor
        key={draft.question_id}
        content={draft.answer || ''}
        storageKey={`qmaker-answer-${draft.question_id}`}
        placeholderText="پاسخ را بنویسید..."
        onChange={(html) => setField('answer', html)}
      />
    </div>
  )
}

export default RichAnswerEditor
