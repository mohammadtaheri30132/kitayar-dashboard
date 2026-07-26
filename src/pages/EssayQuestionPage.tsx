import { useMemo } from 'react'
import QuestionEditor from '../components/QuestionEditor'
import PreviewRenderer from '../components/PreviewRenderer'
import { useQuestionStore } from '../store/useQuestionStore'
import { downloadJson } from '../utils/downloadJson'
import { summarizeForPreview } from '../utils/summarizeHtmlForPreview'

export interface EssayQuestionPayload {
  type: 'essay'
  title: string
  hasBody: boolean
  body: string | null
}

const EssayQuestionPage = () => {
  const title = useQuestionStore((s) => s.title)
  const hasBody = useQuestionStore((s) => s.hasBody)
  const body = useQuestionStore((s) => s.body)
  const setTitle = useQuestionStore((s) => s.setTitle)
  const setHasBody = useQuestionStore((s) => s.setHasBody)
  const setBody = useQuestionStore((s) => s.setBody)

  const payload: EssayQuestionPayload = useMemo(
    () => ({ type: 'essay', title, hasBody, body: hasBody ? body : null }),
    [title, hasBody, body],
  )

  // فقط برای نمایش روی صفحه؛ base64ها خلاصه می‌شوند تا مرورگر هنگ نکند
  const previewSummary = useMemo(
    () => ({
      type: payload.type,
      title: summarizeForPreview(payload.title),
      hasBody: payload.hasBody,
      body: payload.body ? summarizeForPreview(payload.body) : null,
    }),
    [payload],
  )

  const approxSizeKb = useMemo(() => (JSON.stringify(payload).length / 1024).toFixed(1), [payload])

  return (
    <div className="essay-question-page" dir="rtl">
      <h2>سوال تشریحی</h2>

      <section className="editor-section">
        <h3>صورت سوال (title)</h3>
        <QuestionEditor storageKey="ketabia-essay-title" placeholderText="صورت سوال را اینجا بنویسید..." onChange={setTitle} />
      </section>

      <section className="editor-section">
        <label className="checkbox-label">
          <input type="checkbox" checked={hasBody} onChange={(e) => setHasBody(e.target.checked)} />
          این سوال بدنه (body) دارد
        </label>

        {hasBody && (
          <div style={{ marginTop: 12 }}>
            <h3>بدنه سوال (body)</h3>
            <QuestionEditor storageKey="ketabia-essay-body" placeholderText="بدنه سوال را اینجا بنویسید..." onChange={setBody} />
          </div>
        )}
      </section>

      <section className="preview-section">
        <h3>پیش‌نمایش</h3>
        <div className="preview-label">صورت سوال:</div>
        <PreviewRenderer html={title} />
        {hasBody && (
          <>
            <div className="preview-label">بدنه:</div>
            <PreviewRenderer html={body} />
          </>
        )}
      </section>

      <section className="json-section">
        <div className="json-section-header">
          <h3>خروجی JSON</h3>
          <button type="button" className="btn btn-primary" onClick={() => downloadJson(payload, 'essay-question.json')}>
            ⬇ دانلود JSON کامل
          </button>
        </div>
        <div className="json-summary-meta">حجم تقریبی داده: {approxSizeKb} کیلوبایت</div>
        <pre className="json-summary" dir="ltr">
          {JSON.stringify(previewSummary, null, 2)}
        </pre>
      </section>
    </div>
  )
}

export default EssayQuestionPage