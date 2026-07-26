import React, { useRef, useState } from 'react'
import DrawingCanvas from './DrawingCanvas'
import type { Shape, ShapeType } from '../types/drawing'
import { buildAxesShapes, buildTrapezoidShape, buildTriangleShape, serializeShapesToSvg } from '../utils/serializeShapesToSvg'

export type DrawingOutputMode = 'inline' | 'block'

interface Props {
  initialShapes?: Shape[]
  initialBackground?: string | null
  width?: number
  height?: number
  initialOutputWidth?: number
  initialOutputHeight?: number
  initialMode?: DrawingOutputMode
  onSave: (data: {
    shapes: Shape[]
    svgMarkup: string
    width: number
    height: number
    background: string | null
    outputWidth: number
    outputHeight: number
    mode: DrawingOutputMode
  }) => void
  onCancel: () => void
}

const COLORS = ['#2b2b2b', '#e5484d', '#2f6fed', '#1a9e5c', '#b8935a']
const TOOLS: { id: ShapeType | 'select'; label: string; icon: string }[] = [
  { id: 'select', label: 'انتخاب / جابجایی', icon: '✥' },
  { id: 'freehand', label: 'قلم آزاد', icon: '✏️' },
  { id: 'line', label: 'خط', icon: '╱' },
  { id: 'arrow', label: 'فلش', icon: '→' },
  { id: 'rect', label: 'مستطیل', icon: '▭' },
  { id: 'ellipse', label: 'بیضی / دایره', icon: '◯' },
  { id: 'polygon', label: 'چندضلعی (کلیک‌های متوالی)', icon: '△' },
  { id: 'text', label: 'افزودن متن', icon: 'T' },
]

const FONT_FAMILIES = [
  { label: 'پیش‌فرض', value: 'IRANSans, Tahoma, sans-serif' },
  { label: 'B Nazanin', value: '"B Nazanin", Tahoma, sans-serif' },
  { label: 'Vazirmatn', value: 'Vazirmatn, Tahoma, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'سریف', value: 'Georgia, serif' },
  { label: 'تک‌فاصله', value: '"Courier New", monospace' },
]

const A4_WIDTH = 794 // عرض یک برگه A4 در ۹۶dpi
const MIN_HEIGHT = 100

type Preset = 'question' | 'square' | 'landscape' | 'portrait' | 'custom'
const PRESETS: Record<Exclude<Preset, 'custom'>, { label: string; w: number; h: number }> = {
  question: { label: 'ابعاد یک سوال (عرض A4)', w: A4_WIDTH, h: 150 },
  square: { label: 'مربع', w: 400, h: 400 },
  landscape: { label: 'افقی', w: 600, h: 400 },
  portrait: { label: 'عمودی', w: 400, h: 600 },
}

const DrawingModal: React.FC<Props> = ({
  initialShapes = [],
  initialBackground = null,
  width,
  height,
  initialOutputWidth,
  initialOutputHeight,
  initialMode = 'block',
  onSave,
  onCancel,
}) => {
  const [shapes, setShapes] = useState<Shape[]>(initialShapes)
  const [history, setHistory] = useState<Shape[][]>([])
  const [tool, setTool] = useState<ShapeType | 'select'>('freehand')
  const [color, setColor] = useState('#2b2b2b')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [background, setBackground] = useState<string | null>(initialBackground)
  const [polygonDraft, setPolygonDraft] = useState<[number, number][]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectImageInputRef = useRef<HTMLInputElement>(null)

  // --- ابعاد بومِ طراحی ---
  const [preset, setPreset] = useState<Preset>(width || height ? 'custom' : 'question')
  const [canvasWidth, setCanvasWidth] = useState<number>(width || PRESETS.question.w)
  const [canvasHeight, setCanvasHeight] = useState<number>(height || PRESETS.question.h)

  // --- تنظیمات متن جدید ---
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value)
  const [fontSize, setFontSize] = useState(18)

  // --- تنظیمات خروجی ---
  const [outputWidth, setOutputWidth] = useState<number>(initialOutputWidth || canvasWidth)
  const [outputHeight, setOutputHeight] = useState<number>(initialOutputHeight || canvasHeight)
  const [mode, setMode] = useState<DrawingOutputMode>(initialMode)
  const [lockRatio, setLockRatio] = useState(true)

  const applyPreset = (p: Preset) => {
    setPreset(p)
    if (p !== 'custom') {
      const { w, h } = PRESETS[p]
      setCanvasWidth(w)
      setCanvasHeight(h)
      setOutputWidth(w)
      setOutputHeight(h)
    }
  }

  const handleCanvasWidthChange = (v: number) => {
    setPreset('custom')
    setCanvasWidth(Math.max(50, v))
  }
  const handleCanvasHeightChange = (v: number) => {
    setPreset('custom')
    setCanvasHeight(Math.max(MIN_HEIGHT, v))
  }
  const handleGrowHeight = () => {
    setPreset('custom')
    setCanvasHeight((h) => h + 100)
  }

  const ratio = canvasWidth / canvasHeight
  const handleOutputWidthChange = (v: number) => {
    setOutputWidth(v)
    if (lockRatio) setOutputHeight(Math.round(v / ratio))
  }
  const handleOutputHeightChange = (v: number) => {
    setOutputHeight(v)
    if (lockRatio) setOutputWidth(Math.round(v * ratio))
  }

  const pushHistory = () => setHistory((h) => [...h, shapes])

  const setShapesTracked: typeof setShapes = (updater) => {
    pushHistory()
    setShapes(updater as any)
  }

  const handleUndo = () => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setShapes(prev)
      return h.slice(0, -1)
    })
  }

  const handleClear = () => {
    pushHistory()
    setShapes([])
    setSelectedId(null)
  }

  const handleDeleteSelected = () => {
    if (!selectedId) return
    pushHistory()
    setShapes((prev) => prev.filter((s) => s.id !== selectedId))
    setSelectedId(null)
  }

  const handleFinishPolygon = () => {
    if (polygonDraft.length < 3) return
    pushHistory()
    setShapes((prev) => [
      ...prev,
      { id: `poly-${Date.now()}`, type: 'polygon', closed: true, points: polygonDraft, color, strokeWidth },
    ])
    setPolygonDraft([])
  }

  const handleAddAxes = () => {
    pushHistory()
    setShapes((prev) => [...prev, ...buildAxesShapes(canvasWidth, canvasHeight, color)])
  }

  const handleAddTrapezoid = () => {
    pushHistory()
    setShapes((prev) => [...prev, buildTrapezoidShape(canvasWidth, canvasHeight, color)])
  }

  const handleAddTriangle = () => {
    pushHistory()
    setShapes((prev) => [...prev, buildTriangleShape(canvasWidth, canvasHeight, color)])
  }

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setBackground(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // افزودن عکس به‌عنوان شیءِ قابل‌جابجایی/تغییر‌اندازه (متفاوت از پس‌زمینه)
  const handleObjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        pushHistory()
        const iw = 200
        const ih = 150
        const cx = canvasWidth / 2
        const cy = canvasHeight / 2
        setShapes((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}`,
            type: 'image',
            color: '#000000',
            strokeWidth: 0,
            points: [
              [cx - iw / 2, cy - ih / 2],
              [cx + iw / 2, cy + ih / 2],
            ],
            src: reader.result as string,
          },
        ])
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const updateSelectedText = (patch: Partial<Shape>) => {
    if (!selectedId) return
    pushHistory()
    setShapes((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)))
  }

  const handleSave = () => {
    const svgMarkup = serializeShapesToSvg(shapes, canvasWidth, canvasHeight, background, outputWidth, outputHeight)
    onSave({ shapes, svgMarkup, width: canvasWidth, height: canvasHeight, background, outputWidth, outputHeight, mode })
  }

  const selectedShape = shapes.find((s) => s.id === selectedId)

  return (
    <div className="drawing-panel" style={{ border: '1px solid #d8c9b0', borderRadius: 8, padding: 12, marginBottom: 10, background: '#fffaf3' }}>
      <h3 className="math-modal-title" style={{ marginTop: 0 }}>طراحی شکل / نمودار</h3>

      {/* ابعاد بوم */}
      <div className="drawing-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          اندازه بوم:
          <select value={preset} onChange={(e) => applyPreset(e.target.value as Preset)}>
            <option value="question">{PRESETS.question.label}</option>
            <option value="square">{PRESETS.square.label}</option>
            <option value="landscape">{PRESETS.landscape.label}</option>
            <option value="portrait">{PRESETS.portrait.label}</option>
            <option value="custom">سفارشی</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          عرض بوم:
          <input
            type="number"
            min={50}
            value={canvasWidth}
            onChange={(e) => handleCanvasWidthChange(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          ارتفاع بوم:
          <input
            type="number"
            min={MIN_HEIGHT}
            value={canvasHeight}
            onChange={(e) => handleCanvasHeightChange(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <button type="button" className="btn btn-secondary" onClick={handleGrowHeight}>
          + افزایش ارتفاع (۱۰۰px)
        </button>
      </div>

      <div className="drawing-toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`drawing-tool-btn${tool === t.id ? ' active' : ''}`}
            title={t.label}
            onClick={() => {
              setTool(t.id)
              setPolygonDraft([])
            }}
          >
            {t.icon}
          </button>
        ))}

        {tool === 'polygon' && polygonDraft.length >= 3 && (
          <button type="button" className="btn btn-secondary" onClick={handleFinishPolygon}>
            پایان شکل
          </button>
        )}

        <span className="toolbar-divider" />

        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            title={c}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: c,
              border: color === c ? '2px solid #4a3b2a' : '1px solid #ccc',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}

        <input
          type="range"
          min={1}
          max={8}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          title="ضخامت خط"
          style={{ width: 70 }}
        />
      </div>

      {/* تنظیمات متنِ جدید (وقتی ابزار متن فعال است) */}
      {tool === 'text' && (
        <div className="drawing-toolbar">
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} title="فونت">
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={8}
            max={96}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            title="سایز فونت"
            style={{ width: 60 }}
          />
        </div>
      )}

      {/* ویرایش متنِ انتخاب‌شده */}
      {selectedShape && selectedShape.type === 'text' && (
        <div className="drawing-toolbar">
          <select
            value={selectedShape.fontFamily}
            onChange={(e) => updateSelectedText({ fontFamily: e.target.value })}
            title="فونت"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={8}
            max={96}
            value={selectedShape.fontSize}
            onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })}
            title="سایز فونت"
            style={{ width: 60 }}
          />
          <button
            type="button"
            className={`btn btn-secondary${selectedShape.bold ? ' active' : ''}`}
            onClick={() => updateSelectedText({ bold: !selectedShape.bold })}
          >
            B
          </button>
          <button
            type="button"
            className={`btn btn-secondary${selectedShape.italic ? ' active' : ''}`}
            onClick={() => updateSelectedText({ italic: !selectedShape.italic })}
          >
            I
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const newText = window.prompt('ویرایش متن:', selectedShape.text || '')
              if (newText !== null) updateSelectedText({ text: newText })
            }}
          >
            ویرایش متن
          </button>
        </div>
      )}

      <div className="drawing-toolbar">
        <button type="button" className="btn btn-secondary" onClick={handleAddAxes}>
          + محور مختصات
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleAddTrapezoid}>
          + ذوذنقه
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleAddTriangle}>
          + مثلث
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => objectImageInputRef.current?.click()}>
          🖼 افزودن عکس (شیء قابل جابجایی)
        </button>
        <input
          ref={objectImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleObjectImageUpload}
        />
        <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
          🖼 پس‌زمینه (تمام‌بوم)
        </button>
        {background && (
          <button type="button" className="btn btn-secondary" onClick={() => setBackground(null)}>
            حذف پس‌زمینه
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBackgroundUpload} />

        <span className="toolbar-divider" />

        <button type="button" className="btn btn-secondary" onClick={handleUndo} disabled={history.length === 0}>
          ↶ واگرد
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleDeleteSelected} disabled={!selectedId}>
          حذف انتخاب‌شده
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          پاک کردن همه
        </button>
      </div>

      <DrawingCanvas
        shapes={shapes}
        setShapes={setShapesTracked}
        width={canvasWidth}
        height={canvasHeight}
        background={background}
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        fontFamily={fontFamily}
        fontSize={fontSize}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        onFinishPolygon={handleFinishPolygon}
        polygonDraft={polygonDraft}
        setPolygonDraft={setPolygonDraft}
      />

      {/* تنظیمات خروجی نهایی */}
      <div className="drawing-toolbar" style={{ marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          عرض خروجی:
          <input
            type="number"
            min={20}
            value={outputWidth}
            onChange={(e) => handleOutputWidthChange(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          ارتفاع خروجی:
          <input
            type="number"
            min={20}
            value={outputHeight}
            onChange={(e) => handleOutputHeightChange(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
          حفظ نسبت ابعاد
        </label>

        <span className="toolbar-divider" />

        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="radio" name="drawing-mode" checked={mode === 'inline'} onChange={() => setMode('inline')} />
          درون‌خط (بین دو متن)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="radio" name="drawing-mode" checked={mode === 'block'} onChange={() => setMode('block')} />
          بلوک (خط جدا)
        </label>
      </div>

      <div className="math-modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          انصراف
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          درج در متن
        </button>
      </div>
    </div>
  )
}

export default DrawingModal