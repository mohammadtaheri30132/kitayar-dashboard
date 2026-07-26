import React, { useEffect, useRef, useState } from 'react'
import 'mathlive'
import type { MathfieldElement } from 'mathlive'

interface Props {
  onInsert: (latex: string) => void
}

const MathInsertPanel: React.FC<Props> = ({ onInsert }) => {
  const mfRef = useRef<MathfieldElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    const mf = mfRef.current
    if (!mf) return
    const handler = () => setValue(mf.value)
    mf.addEventListener('input', handler)
    setTimeout(() => mf.focus(), 50)
    return () => mf.removeEventListener('input', handler)
  }, [])

  const handleInsert = () => {
    if (!value.trim()) return
    onInsert(value)
    if (mfRef.current) mfRef.current.value = ''
    setValue('')
  }

  return (
    <div className="math-insert-panel">
      <div className="math-insert-panel-header">افزودن فرمول ریاضی</div>
      <math-field ref={mfRef} style={{ width: '100%', fontSize: '1.3rem' }} />
      <div className="math-insert-panel-preview" dir="ltr">
        {value || 'فرمول خود را تایپ کنید'}
      </div>
      <div className="math-insert-panel-actions">
        <button type="button" className="btn btn-primary" onClick={handleInsert}>
          افزودن به متن
        </button>
      </div>
    </div>
  )
}

export default MathInsertPanel