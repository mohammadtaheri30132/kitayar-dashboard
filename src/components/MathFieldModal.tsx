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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="math-modal-overlay" onClick={onClose}>
      <div className="math-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="math-modal-title">ویرایش فرمول ریاضی</h3>

        <math-field ref={mfRef} style={{ width: '100%', fontSize: '1.5rem' }} />

        <div className="math-modal-latex-preview" dir="ltr">
          {value || 'فرمولی وارد نشده'}
        </div>

        <div className="math-modal-actions">
          {onDelete && (
            <button type="button" className="btn btn-danger" onClick={onDelete}>
              حذف فرمول
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            انصراف
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(value)}>
            تایید
          </button>
        </div>
      </div>
    </div>
  )
}

export default MathFieldModal