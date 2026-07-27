import React, { useEffect, useRef, useState } from 'react'
import 'mathlive'
import type { MathfieldElement } from 'mathlive'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>
    }
  }
}

interface Props {
  initialLatex: string
  onClose: () => void
  onSave: (latex: string) => void
  onDelete?: () => void
}

const MathFieldModal: React.FC<Props> = ({ initialLatex, onClose, onSave, onDelete }) => {
  const mfRef = useRef<MathfieldElement>(null)
  const [value, setValue] = useState(initialLatex)

  useEffect(() => {
    const mf = mfRef.current
    if (!mf) return
    mf.value = initialLatex
    const handler = () => setValue(mf.value)
    mf.addEventListener('input', handler)
    setTimeout(() => mf.focus(), 50)
    return () => mf.removeEventListener('input', handler)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-[90%] max-w-[520px] shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">ویرایش فرمول ریاضی</h3>

        <math-field
          ref={mfRef}
          className="w-full text-xl"
          style={{ direction: 'ltr', minHeight: '50px' }}
        />

        <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono text-gray-500 min-h-[28px]" dir="ltr">
          {value || 'فرمولی وارد نشده'}
        </div>

        <div className="flex justify-between items-center mt-5">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-danger-500 rounded-lg hover:bg-danger-600 transition-colors"
            >
              حذف فرمول
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={() => onSave(value)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
            >
              تایید
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MathFieldModal