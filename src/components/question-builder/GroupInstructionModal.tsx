import React, { useState } from 'react'
import { GROUP_INSTRUCTION_SAMPLES } from '../../types/question-builder-additions'

interface Props {
  type: string
  typeLabel: string
  currentText: string
  onSave: (text: string) => void
  onClose: () => void
}

// وقتی روی متن گروه («تشریحی (۷ سوال)») کلیک می‌شود، این مدال باز می‌شود
// و کاربر یا یکی از متن‌های نمونه را انتخاب می‌کند یا متن دلخواه می‌نویسد.
const GroupInstructionModal: React.FC<Props> = ({ type, typeLabel, currentText, onSave, onClose }) => {
  const [text, setText] = useState(currentText || '')
  const samples = GROUP_INSTRUCTION_SAMPLES[type] || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3200]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-[95%] max-w-lg shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">📝 متن دستور بخش «{typeLabel}»</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {samples.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">متن‌های نمونه:</p>
            <div className="flex flex-col gap-1.5">
              {samples.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setText(s)}
                  className={`text-right px-3 py-2 rounded-lg text-sm border transition-colors ${
                    text === s ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">یا متن دلخواه:</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
            placeholder="متن دستور این بخش را بنویسید..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-5">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">انصراف</button>
          <button
            onClick={() => { onSave(text.trim()); onClose() }}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600"
          >
            💾 ذخیره
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupInstructionModal