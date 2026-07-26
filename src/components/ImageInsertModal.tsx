// components/ImageInsertModal.tsx
import React, { useState } from 'react'

interface Props {
  src: string
  onConfirm: (opts: { width: number; mode: 'inline' | 'block' }) => void
  onCancel: () => void
}

const SIZES = [
  { label: 'کوچک', value: 150 },
  { label: 'متوسط', value: 300 },
  { label: 'بزرگ', value: 500 },
]

const ImageInsertModal: React.FC<Props> = ({ src, onConfirm, onCancel }) => {
  const [width, setWidth] = useState(300)
  const [mode, setMode] = useState<'inline' | 'block'>('block')

  return (
    <div className="math-modal-overlay">
      <div className="math-modal">
        <h3 className="math-modal-title">افزودن تصویر</h3>

        <img
          src={src}
          alt=""
          style={{ maxWidth: '100%', maxHeight: 160, display: 'block', margin: '0 auto 14px' }}
        />

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6, fontSize: '0.9rem' }}>اندازه:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`btn ${width === s.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setWidth(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6, fontSize: '0.9rem' }}>نحوه‌ی قرارگیری:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn ${mode === 'inline' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('inline')}
            >
              درون متن (inline)
            </button>
            <button
              type="button"
              className={`btn ${mode === 'block' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('block')}
            >
              سطر مجزا (block)
            </button>
          </div>
        </div>

        <div className="math-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            انصراف
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm({ width, mode })}>
            درج تصویر
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageInsertModal