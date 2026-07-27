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
  { id: 'select', label: 'انتخاب', icon: '✥' },
  { id: 'freehand', label: 'قلم آزاد', icon: '✏️' },
  { id: 'line', label: 'خط', icon: '╱' },
  { id: 'arrow', label: 'فلش', icon: '→' },
  { id: 'rect', label: 'مستطیل', icon: '▭' },
  { id: 'ellipse', label: 'بیضی', icon: '◯' },
  { id: 'polygon', label: 'چندضلعی', icon: '⬠' },
  { id: 'text', label: 'متن', icon: 'T' },
]

const FONT_FAMILIES = [
  { label: 'پیش‌فرض', value: 'IRANSans, Tahoma, sans-serif' },
  { label: 'B Nazanin', value: '"B Nazanin", Tahoma, sans-serif' },
  { label: 'Vazirmatn', value: 'Vazirmatn, Tahoma, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'سریف', value: 'Georgia, serif' },
  { label: 'تک‌فاصله', value: '"Courier New", monospace' },
]

const A4_WIDTH = 794
const MIN_HEIGHT = 100

type Preset = 'question' | 'square' | 'landscape' | 'portrait' | 'custom'
const PRESETS: Record<Exclude<Preset, 'custom'>, { label: string; w: number; h: number }> = {
  question: { label: 'ابعاد سوال (عرض A4)', w: A4_WIDTH, h: 150 },
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

  const [preset, setPreset] = useState<Preset>(width || height ? 'custom' : 'question')
  const [canvasWidth, setCanvasWidth] = useState<number>(width || PRESETS.question.w)
  const [canvasHeight, setCanvasHeight] = useState<number>(height || PRESETS.question.h)

  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value)
  const [fontSize, setFontSize] = useState(18)

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
            points: [[cx - iw / 2, cy - ih / 2], [cx + iw / 2, cy + ih / 2]],
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

  const btnSm = 'px-2.5 py-1.5 text-xs font-medium rounded-md transition-all'
  const btnTool = (active: boolean) =>
    `w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all
     ${active ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-2">
      <h3 className="text-sm font-bold text-gray-700 mb-3">🎨 طراحی شکل / نمودار</h3>

      {/* ابعاد بوم */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">اندازه بوم:</span>
        <select
          value={preset}
          onChange={(e) => applyPreset(e.target.value as Preset)}
          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white"
        >
          {Object.entries(PRESETS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
          <option value="custom">سفارشی</option>
        </select>
        <input type="number" min={50} value={canvasWidth} onChange={(e) => { setPreset('custom'); setCanvasWidth(Math.max(50, Number(e.target.value))) }} className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md" title="عرض" />
        <span className="text-xs text-gray-400">×</span>
        <input type="number" min={MIN_HEIGHT} value={canvasHeight} onChange={(e) => { setPreset('custom'); setCanvasHeight(Math.max(MIN_HEIGHT, Number(e.target.value))) }} className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md" title="ارتفاع" />
        <button type="button" onClick={() => { setPreset('custom'); setCanvasHeight((h) => h + 100) }} className={`${btnSm} bg-gray-200 text-gray-700 hover:bg-gray-300`}>
          +۱۰۰ ارتفاع
        </button>
      </div>

      {/* ابزارها */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {TOOLS.map((t) => (
          <button key={t.id} type="button" className={btnTool(tool === t.id)} title={t.label} onClick={() => { setTool(t.id); setPolygonDraft([]) }}>
            {t.icon}
          </button>
        ))}
        {tool === 'polygon' && polygonDraft.length >= 3 && (
          <button type="button" onClick={handleFinishPolygon} className={`${btnSm} bg-green-500 text-white hover:bg-green-600`}>
            پایان شکل
          </button>
        )}
        <span className="w-px h-6 bg-gray-200 mx-1" />

        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            title={c}
            className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
            style={{ background: c }}
          />
        ))}

        <input type="range" min={1} max={8} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} title="ضخامت" className="w-16" />
      </div>

      {/* تنظیمات متن */}
      {tool === 'text' && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="px-2 py-1 text-xs border border-gray-200 rounded-md">
            {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <input type="number" min={8} max={96} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-14 px-2 py-1 text-xs border border-gray-200 rounded-md" title="سایز" />
        </div>
      )}

      {selectedShape?.type === 'text' && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select value={selectedShape.fontFamily} onChange={(e) => updateSelectedText({ fontFamily: e.target.value })} className="px-2 py-1 text-xs border border-gray-200 rounded-md">
            {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <input type="number" min={8} max={96} value={selectedShape.fontSize} onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })} className="w-14 px-2 py-1 text-xs border border-gray-200 rounded-md" />
          <button type="button" onClick={() => updateSelectedText({ bold: !selectedShape.bold })} className={`${btnSm} ${selectedShape.bold ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200'}`}>B</button>
          <button type="button" onClick={() => updateSelectedText({ italic: !selectedShape.italic })} className={`${btnSm} ${selectedShape.italic ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200'}`}>I</button>
          <button type="button" onClick={() => { const t = window.prompt('متن:', selectedShape.text || ''); if (t !== null) updateSelectedText({ text: t }) }} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100`}>ویرایش متن</button>
        </div>
      )}

      {/* دکمه‌های کمکی */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        <button type="button" onClick={() => { pushHistory(); setShapes((prev) => [...prev, ...buildAxesShapes(canvasWidth, canvasHeight, color)]) }} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100`}>+ محور مختصات</button>
        <button type="button" onClick={() => { pushHistory(); setShapes((prev) => [...prev, buildTrapezoidShape(canvasWidth, canvasHeight, color)]) }} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100`}>+ ذوزنقه</button>
        <button type="button" onClick={() => { pushHistory(); setShapes((prev) => [...prev, buildTriangleShape(canvasWidth, canvasHeight, color)]) }} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100`}>+ مثلث</button>
        <button type="button" onClick={() => objectImageInputRef.current?.click()} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100`}>🖼 عکس شیء</button>
        <input ref={objectImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleObjectImageUpload} />
        <button type="button" onClick={() => fileInputRef.current?.click()} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100`}>🖼 پس‌زمینه</button>
        {background && <button type="button" onClick={() => setBackground(null)} className={`${btnSm} bg-red-50 text-red-600 hover:bg-red-100`}>حذف پس‌زمینه</button>}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
        <span className="flex-1" />
        <button type="button" onClick={handleUndo} disabled={history.length === 0} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40`}>↶ واگرد</button>
        <button type="button" onClick={handleDeleteSelected} disabled={!selectedId} className={`${btnSm} bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40`}>حذف</button>
        <button type="button" onClick={handleClear} className={`${btnSm} bg-red-50 text-red-600 hover:bg-red-100`}>پاک کردن همه</button>
      </div>

      {/* بوم طراحی */}
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

      {/* تنظیمات خروجی */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500">خروجی:</span>
        <input type="number" min={20} value={outputWidth} onChange={(e) => handleOutputWidthChange(Number(e.target.value))} className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md" title="عرض خروجی" />
        <span className="text-xs text-gray-400">×</span>
        <input type="number" min={20} value={outputHeight} onChange={(e) => handleOutputHeightChange(Number(e.target.value))} className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md" title="ارتفاع خروجی" />
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} className="w-3.5 h-3.5" />
          حفظ نسبت
        </label>
        <span className="w-px h-4 bg-gray-200" />
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input type="radio" name="dmode" checked={mode === 'inline'} onChange={() => setMode('inline')} className="w-3.5 h-3.5" />
          درون‌خط
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input type="radio" name="dmode" checked={mode === 'block'} onChange={() => setMode('block')} className="w-3.5 h-3.5" />
          بلوک
        </label>
      </div>

      {/* دکمه‌های نهایی */}
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          انصراف
        </button>
        <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors">
          درج در متن
        </button>
      </div>
    </div>
  )
}

export default DrawingModal