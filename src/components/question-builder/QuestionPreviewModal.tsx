import React from 'react'
import type { BuilderQuestion } from '../../types/question-builder'

interface Props {
  question: BuilderQuestion
  onClose: () => void
}

const TYPE_STYLES: Record<string, string> = {
  'تستی': 'bg-blue-50 text-blue-700',
  'جاخالی': 'bg-orange-50 text-orange-700',
  'صحیح-غلط': 'bg-purple-50 text-purple-700',
  'کوتاه-پاسخ': 'bg-green-50 text-green-700',
  'گسترده-پاسخ': 'bg-teal-50 text-teal-700',
  'جورکردنی': 'bg-pink-50 text-pink-700',
  'انتخاب-کلمه': 'bg-cyan-50 text-cyan-700',
}

const stripHtml = (html: string) => { if (!html) return ''; const d = document.createElement('div'); d.innerHTML = html; return d.textContent || '' }

const QuestionPreviewModal: React.FC<Props> = ({ question, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2500]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-[90%] max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" dir="rtl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[question.type] || 'bg-gray-50'}`}>{question.type}</span>
            <span className="mr-2 text-xs text-gray-500">{question.difficulty}</span>
            {question.bookName && <span className="mr-2 text-xs text-gray-400">📖 {question.bookName}</span>}
            {question.gradeName && <span className="mr-2 text-xs text-gray-400">🏫 {question.gradeName}</span>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {question.mainQuestion && (
          <div className="mb-3 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-800">
            <p className="text-xs font-bold text-indigo-500 mb-1">📑 سوال اصلی:</p>
            <div dangerouslySetInnerHTML={{ __html: question.mainQuestion }} />
          </div>
        )}

        <div className="mb-4 p-4 bg-gray-50 rounded-xl text-sm leading-loose" dangerouslySetInnerHTML={{ __html: question.question }} />

        {question.options && question.options.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 mb-2">گزینه‌ها:</p>
            {question.options.map((opt, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm ${opt === question.answer ? 'bg-green-50 border border-green-300 font-medium text-green-800' : 'bg-gray-50 border border-gray-200'}`}>
                {i + 1}. {opt} {opt === question.answer && '✅'}
              </div>
            ))}
          </div>
        )}

        {question.matching_left && question.matching_left.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-500">ستون الف:</p>
              {question.matching_left.map((l, i) => <div key={i} className="bg-gray-50 rounded px-2 py-1 text-sm">{l}</div>)}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-500">ستون ب:</p>
              {question.matching_right?.map((r, i) => <div key={i} className="bg-gray-50 rounded px-2 py-1 text-sm">{r}</div>)}
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-800 text-gray-200 rounded-xl text-xs font-mono" dir="ltr">
          <span className="text-gray-400">answer:</span> {stripHtml(question.answer || '(خالی)')}
        </div>

        {question.page_number && question.page_number.length > 0 && (
          <div className="mt-3 text-xs text-gray-400">صفحات: {question.page_number.join('، ')}</div>
        )}
      </div>
    </div>
  )
}

export default QuestionPreviewModal
