import React, { useRef, useState } from 'react'
import type { Shape, ShapeType } from '../types/drawing'

interface Props {
  shapes: Shape[]
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  width: number
  height: number
  background?: string | null
  tool: ShapeType | 'select'
  color: string
  strokeWidth: number
  fontFamily: string
  fontSize: number
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  onFinishPolygon: () => void
  polygonDraft: [number, number][]
  setPolygonDraft: React.Dispatch<React.SetStateAction<[number, number][]>>
}

function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): [number, number] {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return [0, 0]
  const p = pt.matrixTransform(ctm.inverse())
  return [p.x, p.y]
}

const DrawingCanvas: React.FC<Props> = ({
  shapes, setShapes, width, height, background, tool, color, strokeWidth,
  fontFamily, fontSize, selectedId, setSelectedId, onFinishPolygon, polygonDraft, setPolygonDraft,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draft, setDraft] = useState<Shape | null>(null)
  const dragRef = useRef<{ shapeId: string; last: [number, number] } | null>(null)
  const resizeRef = useRef<{ shapeId: string } | null>(null)

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const [x, y] = getSvgPoint(svgRef.current, e.clientX, e.clientY)

    if (tool === 'select') {
      const selectedShape = shapes.find((s) => s.id === selectedId)
      if (selectedShape && selectedShape.type === 'image') {
        const [, [x2, y2]] = selectedShape.points
        if (Math.hypot(x - x2, y - y2) < 12) {
          resizeRef.current = { shapeId: selectedShape.id }
          ;(e.target as Element).setPointerCapture(e.pointerId)
          return
        }
      }
      const hit = [...shapes].reverse().find((s) => isNearShape(s, x, y))
      setSelectedId(hit ? hit.id : null)
      if (hit) dragRef.current = { shapeId: hit.id, last: [x, y] }
      return
    }

    if (tool === 'polygon') {
      setPolygonDraft((prev) => [...prev, [x, y]])
      return
    }

    if (tool === 'text') {
      const value = window.prompt('متن را وارد کنید:', '')
      if (value && value.trim().length > 0) {
        const id = `text-${Date.now()}`
        setShapes((prev) => [...prev, { id, type: 'text', points: [[x, y]], color, strokeWidth, text: value, fontSize, fontFamily }])
      }
      return
    }

    const id = `shape-${Date.now()}`
    if (tool === 'freehand') {
      setDraft({ id, type: 'freehand', points: [[x, y]], color, strokeWidth })
    } else {
      setDraft({ id, type: tool, points: [[x, y], [x, y]], color, strokeWidth })
    }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const [x, y] = getSvgPoint(svgRef.current, e.clientX, e.clientY)

    if (tool === 'select' && resizeRef.current) {
      setShapes((prev) => prev.map((s) => (s.id === resizeRef.current!.shapeId ? { ...s, points: [s.points[0], [x, y]] } : s)))
      return
    }

    if (tool === 'select' && dragRef.current) {
      const [lastX, lastY] = dragRef.current.last
      const dx = x - lastX
      const dy = y - lastY
      dragRef.current.last = [x, y]
      setShapes((prev) => prev.map((s) => (s.id === dragRef.current!.shapeId ? { ...s, points: s.points.map(([px, py]) => [px + dx, py + dy] as [number, number]) } : s)))
      return
    }

    if (!draft) return
    if (draft.type === 'freehand') {
      setDraft({ ...draft, points: [...draft.points, [x, y]] })
    } else {
      setDraft({ ...draft, points: [draft.points[0], [x, y]] })
    }
  }

  const handlePointerUp = () => {
    if (tool === 'select') { dragRef.current = null; resizeRef.current = null; return }
    if (draft) { setShapes((prev) => [...prev, draft]); setDraft(null) }
  }

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'polygon' && polygonDraft.length >= 3) { onFinishPolygon(); return }
    if (tool === 'select' && svgRef.current) {
      const [x, y] = getSvgPoint(svgRef.current, e.clientX, e.clientY)
      const hit = [...shapes].reverse().find((s) => s.type === 'text' && isNearShape(s, x, y))
      if (hit) {
        const newText = window.prompt('ویرایش متن:', hit.text || '')
        if (newText !== null) setShapes((prev) => prev.map((s) => (s.id === hit.id ? { ...s, text: newText } : s)))
      }
    }
  }

  const renderShape = (s: Shape) => {
    const isSelected = s.id === selectedId
    const commonProps = { stroke: s.color, strokeWidth: s.strokeWidth, fill: 'none' as const }
    const selectedStyle = isSelected ? { strokeDasharray: '4 2', filter: 'drop-shadow(0 0 3px #007BFF)' } : {}

    if (s.type === 'freehand') {
      const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
      return <path key={s.id} d={d} {...commonProps} style={selectedStyle} strokeLinecap="round" strokeLinejoin="round" />
    }
    if (s.type === 'line' || s.type === 'arrow') {
      const [[x1, y1], [x2, y2]] = s.points
      return <line key={s.id} x1={x1} y1={y1} x2={x2} y2={y2} {...commonProps} style={selectedStyle} markerEnd={s.type === 'arrow' ? 'url(#arrowhead-editor)' : undefined} />
    }
    if (s.type === 'rect') {
      const [[x1, y1], [x2, y2]] = s.points
      return <rect key={s.id} x={Math.min(x1, x2)} y={Math.min(y1, y2)} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} {...commonProps} style={selectedStyle} />
    }
    if (s.type === 'ellipse') {
      const [[x1, y1], [x2, y2]] = s.points
      return <ellipse key={s.id} cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} rx={Math.abs(x2 - x1) / 2} ry={Math.abs(y2 - y1) / 2} {...commonProps} style={selectedStyle} />
    }
    if (s.type === 'polygon') {
      const pts = s.points.map((p) => p.join(',')).join(' ')
      const Tag = s.closed ? 'polygon' : 'polyline'
      return <Tag key={s.id} points={pts} {...commonProps} style={selectedStyle} strokeLinejoin="round" />
    }
    if (s.type === 'text') {
      const [[x, y]] = s.points
      const lines = (s.text || '').split('\n')
      return (
        <text key={s.id} x={x} y={y} fill={s.color} fontSize={s.fontSize || 18} fontFamily={s.fontFamily || 'IRANSans, Tahoma, sans-serif'} fontWeight={s.bold ? 'bold' : 'normal'} fontStyle={s.italic ? 'italic' : 'normal'} direction="rtl" style={isSelected ? { filter: 'drop-shadow(0 0 2px #007BFF)' } : undefined}>
          {lines.map((line, i) => (<tspan key={i} x={x} dy={i === 0 ? 0 : (s.fontSize || 18) * 1.3}>{line}</tspan>))}
        </text>
      )
    }
    if (s.type === 'image') {
      const [[x1, y1], [x2, y2]] = s.points
      return <image key={s.id} href={s.src} x={Math.min(x1, x2)} y={Math.min(y1, y2)} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} preserveAspectRatio="xMidYMid meet" style={isSelected ? { outline: '2px dashed #007BFF', outlineOffset: '2px' } : undefined} />
    }
    return null
  }

  const selectedShape = shapes.find((s) => s.id === selectedId)

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className="bg-white border border-gray-200 rounded-lg touch-none max-h-[500px]"
      style={{ cursor: tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <defs>
        <marker id="arrowhead-editor" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
      </defs>

      {background && <image href={background} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid meet" />}

      {shapes.map(renderShape)}
      {draft && renderShape(draft)}

      {selectedShape && selectedShape.type === 'image' && (
        <circle cx={selectedShape.points[1][0]} cy={selectedShape.points[1][1]} r={6} fill="#007BFF" stroke="#fff" strokeWidth={1.5} style={{ cursor: 'nwse-resize' }} />
      )}

      {polygonDraft.length > 0 && (
        <polyline points={polygonDraft.map((p) => p.join(',')).join(' ')} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray="4 3" />
      )}
      {polygonDraft.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#007BFF" />
      ))}
    </svg>
  )
}

function isNearShape(s: Shape, x: number, y: number): boolean {
  const threshold = 10
  if (s.type === 'rect' || s.type === 'ellipse' || s.type === 'image') {
    const [[x1, y1], [x2, y2]] = s.points
    const minX = Math.min(x1, x2) - threshold
    const maxX = Math.max(x1, x2) + threshold
    const minY = Math.min(y1, y2) - threshold
    const maxY = Math.max(y1, y2) + threshold
    return x >= minX && x <= maxX && y >= minY && y <= maxY
  }
  if (s.type === 'text') {
    const [[tx, ty]] = s.points
    const fz = s.fontSize || 18
    const lines = (s.text || '').split('\n')
    const wEst = Math.max(1, ...lines.map((l) => l.length)) * fz * 0.55
    const hEst = lines.length * fz * 1.3
    return x >= tx - threshold && x <= tx + wEst + threshold && y >= ty - fz - threshold && y <= ty + hEst + threshold
  }
  return s.points.some(([px, py]) => Math.hypot(px - x, py - y) < threshold + s.strokeWidth * 2)
}

export default DrawingCanvas