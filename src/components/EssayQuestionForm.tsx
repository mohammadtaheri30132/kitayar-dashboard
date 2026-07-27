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
    () => ({ type: 'essay', title, hasBody, body: hasBody ? body : null }),
    [title, hasBody, body],
  )

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  }

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">📄 سوال تشریحی</h2>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4">صورت سوال (title)</h3>
        <QuestionEditor storageKey="ketabia-essay-title" placeholderText="صورت سوال را اینجا بنویسید..." onChange={setTitle} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={hasBody} onChange={(e) => setHasBody(e.target.checked)} className="w-4 h-4 rounded accent-primary-500" />
          <span className="text-sm font-medium text-gray-700">این سوال بدنه (body) دارد</span>
        </label>
        {hasBody && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4">بدنه سوال (body)</h3>
            <QuestionEditor storageKey="ketabia-essay-body" placeholderText="بدنه سوال را اینجا بنویسید..." onChange={setBody} />
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4">پیش‌نمایش</h3>
        <span className="text-xs font-medium text-gray-500">صورت سوال:</span>
        <div className="mt-1 mb-3"><PreviewRenderer html={title} /></div>
        {hasBody && (
          <>
            <span className="text-xs font-medium text-gray-500">بدنه:</span>
            <div className="mt-1"><PreviewRenderer html={body} /></div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">خروجی JSON</h3>
          <button type="button" onClick={handleCopyJson} className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
            📋 کپی JSON
          </button>
        </div>
        <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed max-h-64" dir="ltr">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default EssayQuestionForm