import React from 'react'
import { HEADER_TEMPLATES } from '../../types/question-builder-additions'
import type { BuilderHeader } from '../../types/question-builder'

interface Props {
  onSelect: (header: BuilderHeader) => void
  onClose: () => void
}

// وقتی کاربر روی «هدر» کلیک می‌کند این مدال باز می‌شود؛
// یک لیست ۴تایی از قالب‌های هدر نشان می‌دهد و انتخاب، بلافاصله هدر می‌سازد.
const HeaderTypeModal: React.FC<Props> = ({ onSelect, onClose }) => {
  const handlePick = (templateKey: string) => {
    const tpl = HEADER_TEMPLATES.find(t => t.key === templateKey)
    if (!tpl) return
    const built = tpl.build()
    const header: BuilderHeader = {
      id: `header-${Date.now()}`,
      title: built.title,
      subtitle: built.subtitle,
      fields: built.fields,
    }
    onSelect(header)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3200]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-[95%] max-w-xl shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">📋 انتخاب نوع هدر</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HEADER_TEMPLATES.map(tpl => (
            <button
              key={tpl.key}
              onClick={() => handlePick(tpl.key)}
              className="text-right p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              <p className="text-2xl mb-1">{tpl.icon}</p>
              <p className="text-sm font-bold text-gray-800">{tpl.label}</p>
              <p className="text-xs text-gray-500 mt-1">{tpl.description}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          بعد از انتخاب می‌توانی فیلدهای هدر را از داخل جعبهٔ «هدرها» ویرایش کنی.
        </p>
      </div>
    </div>
  )
}

export default HeaderTypeModal