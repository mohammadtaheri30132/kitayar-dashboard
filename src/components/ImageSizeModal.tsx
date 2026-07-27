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
  const [naturalRatio, setNaturalRatio] = useState(0.6)
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl p-6 w-[90%] max-w-[480px] shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">تنظیم اندازه تصویر</h3>

        <img
          src={src}
          alt=""
          className="max-w-full max-h-40 block mx-auto mb-4 rounded-lg object-contain bg-gray-50"
        />

        {/* پریست‌ها */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-600 mb-2 block">اندازه‌های پیشنهادی:</span>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePreset(p.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${width === p.value
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ابعاد دلخواه */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-600 mb-2 block">اندازه دلخواه (پیکسل):</span>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">عرض</label>
              <input
                type="number"
                value={width}
                min={MIN_SIZE}
                max={MAX_SIZE}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setLocked((v) => !v)}
              title={locked ? 'قفل نسبت ابعاد فعال' : 'قفل نسبت ابعاد غیرفعال'}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg shrink-0 transition-all
                ${locked ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {locked ? '🔒' : '🔓'}
            </button>

            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">ارتفاع</label>
              <input
                type="number"
                value={height}
                min={MIN_SIZE}
                max={MAX_SIZE}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* حالت نمایش */}
        {showModeSelector && (
          <div className="mb-5">
            <span className="text-sm font-medium text-gray-600 mb-2 block">نحوهٔ قرارگیری:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('inline')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${mode === 'inline' ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                درون متن
              </button>
              <button
                type="button"
                onClick={() => setMode('block')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${mode === 'block' ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                سطر مجزا
              </button>
            </div>
          </div>
        )}

        {/* دکمه‌ها */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ width, height, mode })}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            تایید
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageSizeModal