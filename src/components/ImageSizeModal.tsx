import React, { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  initialWidth?: number
  initialMode?: 'inline' | 'block'
  showModeSelector?: boolean
  onConfirm: (opts: { width: number; height: number; mode: 'inline' | 'block' }) => void
  onCancel: () => void
}

const PRESETS = [
  { label: 'کوچک', value: 150 },
  { label: 'متوسط', value: 300 },
  { label: 'بزرگ', value: 500 },
]

const MIN_SIZE = 40
const MAX_SIZE = 900

const ImageSizeModal: React.FC<Props> = ({
  src,
  initialWidth = 300,
  initialMode = 'block',
  showModeSelector = false,
  onConfirm,
  onCancel,
}) => {
  const [naturalRatio, setNaturalRatio] = useState(0.6) // height / width
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(Math.round(initialWidth * 0.6))
  const [locked, setLocked] = useState(true)
  const [mode, setMode] = useState<'inline' | 'block'>(initialMode)
  const initializedRef = useRef(false)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      const ratio = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 0.6
      setNaturalRatio(ratio)
      if (!initializedRef.current) {
        setHeight(Math.round(initialWidth * ratio))
        initializedRef.current = true
      }
    }
    img.src = src
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  const clamp = (v: number) => Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(v || 0)))

  const handleWidthChange = (val: number) => {
    const w = clamp(val)
    setWidth(w)
    if (locked) setHeight(clamp(w * naturalRatio))
  }

  const handleHeightChange = (val: number) => {
    const h = clamp(val)
    setHeight(h)
    if (locked && naturalRatio > 0) setWidth(clamp(h / naturalRatio))
  }

  const handlePreset = (val: number) => {
    setWidth(val)
    setHeight(clamp(val * naturalRatio))
  }

  return (
    <div className="math-modal-overlay" onClick={onCancel}>
      <div className="math-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="math-modal-title">تنظیم اندازه تصویر</h3>

        <img
          src={src}
          alt=""
          style={{ maxWidth: '100%', maxHeight: 160, display: 'block', margin: '0 auto 14px', borderRadius: 8 }}
        />

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6, fontSize: '0.9rem' }}>اندازه‌های پیشنهادی:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`btn ${width === p.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePreset(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6, fontSize: '0.9rem' }}>اندازه دلخواه (پیکسل):</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#777', display: 'block', marginBottom: 4 }}>عرض</label>
              <input
                type="number"
                value={width}
                min={MIN_SIZE}
                max={MAX_SIZE}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbb994',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setLocked((v) => !v)}
              title={locked ? 'قفل نسبت ابعاد فعال است (کلیک برای غیرفعال کردن)' : 'قفل نسبت ابعاد غیرفعال است'}
              style={{
                border: '1px solid #cbb994',
                borderRadius: 6,
                background: locked ? '#b8935a' : '#fff',
                color: locked ? '#fff' : '#4a3b2a',
                width: 36,
                height: 36,
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: '1rem',
              }}
            >
              {locked ? '🔒' : '🔓'}
            </button>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#777', display: 'block', marginBottom: 4 }}>ارتفاع</label>
              <input
                type="number"
                value={height}
                min={MIN_SIZE}
                max={MAX_SIZE}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbb994',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
        </div>

        {showModeSelector && (
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
        )}

        <div className="math-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            انصراف
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm({ width, height, mode })}>
            تایید
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageSizeModal