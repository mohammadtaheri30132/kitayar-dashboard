import { useState } from 'react'
import { useQuestionStore } from '../../store/useQuestionStore'
import { ALL_TYPES, TYPE_LABELS } from '../../types/question'
import type { SubQuestion } from '../../types/question'
import SelectField from '../SelectField'
import QuestionEditor from '../QuestionEditor'

const SUB_TYPES = ALL_TYPES.filter(t => t !== 'ترکیبی')

const CompositeAnswer = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)
  const [subs, setSubs] = useState<SubQuestion[]>(draft.sub || [])

  const updateSubs = (newSubs: SubQuestion[]) => {
    setSubs(newSubs)
    setField('sub' as any, newSubs as any)
  }

  const addSub = () => {
    const letter = String.fromCharCode(97 + subs.length) // a, b, c, ...
    updateSubs([...subs, {
      sub_id: letter,
      type: 'کوتاه-پاسخ',
      question: '',
      options: [],
      page_number: [],
      answer: '',
    }])
  }

  const removeSub = (idx: number) => {
    updateSubs(subs.filter((_, i) => i !== idx))
  }

  const updateSub = (idx: number, field: keyof SubQuestion, value: any) => {
    const newSubs = [...subs]
    ;(newSubs[idx] as any)[field] = value

    // اگه type عوض شد، options رو ریست کن
    if (field === 'type') {
      if (!['تستی', 'انتخاب-کلمه'].includes(value)) {
        newSubs[idx].options = []
      }
    }

    updateSubs(newSubs)
  }

  const handlePageChange = (idx: number, val: string) => {
    const nums = val.split(/[,،و\s]+/).map(Number).filter(n => !isNaN(n) && n > 0)
    updateSub(idx, 'page_number', nums)
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-2">زیرسوالات (ترکیبی)</h3>
      <p className="text-xs text-gray-500 mb-4">صورت سوال اصلی در بخش "صورت سوال" وارد می‌شود. زیرسوالات را اینجا تعریف کنید.</p>

      {subs.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-3">هیچ زیرسوالی تعریف نشده</p>
          <button onClick={addSub} className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600">
            + افزودن اولین زیرسوال
          </button>
        </div>
      )}

      <div className="space-y-6">
        {subs.map((sub, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {sub.sub_id}
                </span>
                <SelectField
                  label=""
                  options={SUB_TYPES.map(t => ({ value: t, label: TYPE_LABELS[t] }))}
                  value={sub.type}
                  onChange={v => updateSub(idx, 'type', v)}
                  placeholder="نوع زیرسوال"
                />
              </div>
              <button onClick={() => removeSub(idx)}
                className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg text-sm">✕ حذف</button>
            </div>

            {/* متن زیرسوال */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">متن زیرسوال</label>
              <QuestionEditor
                key={`sub-${idx}-${sub.sub_id}`}
                content={sub.question}
                storageKey={`composite-sub-${draft.question_id}-${idx}`}
                placeholderText="متن زیرسوال..."
                onChange={html => updateSub(idx, 'question', html)}
              />
            </div>

            {/* گزینه‌ها (برای تستی و انتخاب کلمه) */}
            {['تستی', 'انتخاب-کلمه'].includes(sub.type) && (
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">گزینه‌ها</label>
                {(sub.options || []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const newOpts = [...(sub.options || [])]
                        newOpts[oi] = e.target.value
                        updateSub(idx, 'options', newOpts)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder={`گزینه ${oi + 1}`}
                    />
                    <button onClick={() => {
                      const newOpts = (sub.options || []).filter((_, i) => i !== oi)
                      updateSub(idx, 'options', newOpts)
                    }} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
                <button onClick={() => updateSub(idx, 'options', [...(sub.options || []), ''])}
                  className="text-xs text-primary-600 hover:underline mt-1">
                  + افزودن گزینه
                </button>
              </div>
            )}

            {/* شماره صفحه */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">شماره صفحه</label>
              <input
                type="text"
                value={(sub.page_number || []).join('، ')}
                onChange={e => handlePageChange(idx, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="مثلاً ۴، ۸"
              />
            </div>

            {/* پاسخ */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">
                پاسخ
                {sub.type === 'تستی' && <span className="text-gray-400 font-normal"> (متن گزینه صحیح را وارد کنید)</span>}
              </label>
              {['گسترده-پاسخ', 'کوتاه-پاسخ'].includes(sub.type) ? (
                <QuestionEditor
                  key={`sub-answer-${idx}-${sub.sub_id}`}
                  content={sub.answer}
                  storageKey={`composite-sub-answer-${draft.question_id}-${idx}`}
                  placeholderText="پاسخ..."
                  onChange={html => updateSub(idx, 'answer', html)}
                />
              ) : (
                <input
                  type="text"
                  value={sub.answer}
                  onChange={e => updateSub(idx, 'answer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="پاسخ صحیح"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {subs.length > 0 && (
        <button onClick={addSub} className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100">
          + افزودن زیرسوال
        </button>
      )}
    </div>
  )
}

export default CompositeAnswer
