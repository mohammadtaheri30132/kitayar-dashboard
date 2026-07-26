import React, { useMemo, useState } from 'react'
import QuestionEditor from './QuestionEditor'
import PreviewRenderer from './PreviewRenderer'

export interface EssayQuestionPayload {
  type: 'essay'
  title: string
  hasBody: boolean
  body: string | null
}

const EssayQuestionForm: React.FC = () => {
  const [title, setTitle] = useState('')
  const [hasBody, setHasBody] = useState(false)
  const [body, setBody] = useState('')

  const payload: EssayQuestionPayload = useMemo(
    () => ({
      type: 'essay',
      title,
      hasBody,
      body: hasBody ? body : null,
    }),
    [title, hasBody, body],
  )

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  }

  return (
    <div className="essay-question-page" dir="rtl">
      <h2>سوال تشریحی</h2>

      <section style={{ marginBottom: 24 }}>
        <h3>صورت سوال (title)</h3>
        <QuestionEditor
          storageKey="ketabia-essay-title"
          placeholderText="صورت سوال را اینجا بنویسید..."
          onChange={setTitle}
        />
      </section>

      <section style={{ marginBottom: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: 'fit-content' }}>
          <input type="checkbox" checked={hasBody} onChange={(e) => setHasBody(e.target.checked)} />
          این سوال بدنه (body) دارد
        </label>

        {hasBody && (
          <div style={{ marginTop: 12 }}>
            <h3>بدنه سوال (body)</h3>
            <QuestionEditor
              storageKey="ketabia-essay-body"
              placeholderText="بدنه سوال را اینجا بنویسید..."
              onChange={setBody}
            />
          </div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>پیش‌نمایش</h3>
        <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#4a3b2a' }}>صورت سوال:</div>
        <PreviewRenderer html={title} />
        {hasBody && (
          <>
            <div style={{ margin: '12px 0 8px', fontWeight: 'bold', color: '#4a3b2a' }}>بدنه:</div>
            <PreviewRenderer html={body} />
          </>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>خروجی JSON (آنچه به API ارسال می‌شود)</h3>
          <button type="button" className="btn btn-secondary" onClick={handleCopyJson}>
            کپی JSON
          </button>
        </div>
        <pre
          dir="ltr"
          style={{
            background: '#2b2b2b',
            color: '#e8e8e8',
            padding: 14,
            borderRadius: 8,
            overflowX: 'auto',
            fontSize: 13,
            lineHeight: 1.6,
            maxHeight: 400,
          }}
        >
          {JSON.stringify(payload, null, 2)}
        </pre>
      </section>
    </div>
  )
}

export default EssayQuestionForm