import { useMemo } from 'react'
import type { ComponentType } from 'react'
import QuestionEditor from '../components/QuestionEditor'
import PreviewRenderer from '../components/PreviewRenderer'
import MetaFieldsPanel from '../components/MetaFieldsPanel'
import RichAnswerEditor from '../components/answer-sections/RichAnswerEditor'
import TrueFalseAnswer from '../components/answer-sections/TrueFalseAnswer'
import FillBlankAnswer from '../components/answer-sections/FillBlankAnswer'
import MultipleChoiceAnswer from '../components/answer-sections/MultipleChoiceAnswer'
import MatchingAnswer from '../components/answer-sections/MatchingAnswer'
import { useQuestionStore } from '../store/useQuestionStore'
import { downloadJson } from '../utils/downloadJson'
import { summarizeForPreview } from '../utils/summarizeHtmlForPreview'
import { TYPE_LABELS } from '../types/question'
import type { QuestionType } from '../types/question'

const ANSWER_SECTION: Record<QuestionType, ComponentType> = {
  'گسترده-پاسخ': RichAnswerEditor,
  'کوتاه-پاسخ': RichAnswerEditor,
  'جاخالی': FillBlankAnswer,
  'صحیح-غلط': TrueFalseAnswer,
  'تستی': MultipleChoiceAnswer,
  'جورکردنی': MatchingAnswer,
}

const QuestionFormPage = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)
  const resetDraft = useQuestionStore((s) => s.resetDraft)

  const previewSummary = useMemo(
    () => ({
      ...draft,
      question: summarizeForPreview(draft.question),
      answer: summarizeForPreview(draft.answer),
    }),
    [draft],
  )

  if (!draft.type) return null
  const AnswerSection = ANSWER_SECTION[draft.type]

  const isValid = draft.question.trim().length > 0 && draft.lesson_id !== '' && draft.page_number !== '' && draft.answer.trim().length > 0

  const handleSubmit = () => {
    if (!isValid) {
      window.alert('لطفاً صورت سوال، شماره درس، شماره صفحه و پاسخ را تکمیل کنید.')
      return
    }
    // TODO: اینجا باید به سمت API ارسال شود، مثلاً:
    // await fetch('/api/questions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(draft) })
    downloadJson(draft, `${draft.question_id}.json`)
    resetDraft()
  }

  return (
    <div className="question-form-page" dir="rtl">
      <div className="form-header">
        <h2>{TYPE_LABELS[draft.type]}</h2>
        <button type="button" className="btn btn-secondary" onClick={resetDraft}>
          ← تغییر نوع سوال
        </button>
      </div>

      <MetaFieldsPanel />

      <section className="editor-section">
        <h3>صورت سوال</h3>
        <QuestionEditor
          key={draft.question_id}
          storageKey={`qmaker-stem-${draft.question_id}`}
          placeholderText="صورت سوال را اینجا بنویسید..."
          onChange={(html) => setField('question', html)}
        />
      </section>

      <AnswerSection />

      <section className="preview-section">
        <h3>پیش‌نمایش صورت سوال</h3>
        <PreviewRenderer html={draft.question} />
      </section>

      <section className="json-section">
        <div className="json-section-header">
          <h3>خروجی JSON</h3>
          <button type="button" className="btn btn-secondary" onClick={() => downloadJson(draft, `${draft.question_id}.json`)}>
            ⬇ دانلود JSON
          </button>
        </div>
        <pre className="json-summary" dir="ltr">
          {JSON.stringify(previewSummary, null, 2)}
        </pre>
      </section>

      <div className="form-actions">
        <button type="button" className="btn btn-primary btn-large" onClick={handleSubmit}>
          ✓ افزودن سوال
        </button>
      </div>
    </div>
  )
}

export default QuestionFormPage