import type { Shape } from '../types/drawing'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function shapeToSvgElement(shape: Shape): string {
  const { type, points, color, strokeWidth, closed } = shape
  const s = `stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"`

  if (type === 'freehand') {
    if (points.length < 2) return ''
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
    return `<path d="${d}" ${s} />`
  }

  if (type === 'line' || type === 'arrow') {
    const [[x1, y1], [x2, y2]] = points
    const marker = type === 'arrow' ? `marker-end="url(#arrowhead-${color.replace('#', '')})"` : ''
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${s} ${marker} />`
  }

  if (type === 'rect') {
    const [[x1, y1], [x2, y2]] = points
    const x = Math.min(x1, x2)
    const y = Math.min(y1, y2)
    return `<rect x="${x}" y="${y}" width="${Math.abs(x2 - x1)}" height="${Math.abs(y2 - y1)}" ${s} />`
  }

  if (type === 'ellipse') {
    const [[x1, y1], [x2, y2]] = points
    return `<ellipse cx="${(x1 + x2) / 2}" cy="${(y1 + y2) / 2}" rx="${Math.abs(x2 - x1) / 2}" ry="${Math.abs(y2 - y1) / 2}" ${s} />`
  }

  if (type === 'polygon') {
    const pts = points.map((p) => `${p[0]},${p[1]}`).join(' ')
    return `<${closed ? 'polygon' : 'polyline'} points="${pts}" ${s} />`
  }

  if (type === 'text') {
    const [[x, y]] = points
    const fontSize = shape.fontSize || 18
    const fontFamily = shape.fontFamily || 'IRANSans, Tahoma, sans-serif'
    const weight = shape.bold ? 'bold' : 'normal'
    const style = shape.italic ? 'italic' : 'normal'
    const lines = (shape.text || '').split('\n')
    const tspans = lines
      .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : fontSize * 1.3}">${escapeXml(line)}</tspan>`)
      .join('')
    return `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${weight}" font-style="${style}" direction="rtl">${tspans}</text>`
  }

  if (type === 'image') {
    const [[x1, y1], [x2, y2]] = points
    return `<image href="${shape.src}" x="${Math.min(x1, x2)}" y="${Math.min(y1, y2)}" width="${Math.abs(x2 - x1)}" height="${Math.abs(y2 - y1)}" preserveAspectRatio="xMidYMid meet" />`
  }

  return ''
}

/**
 * width/height: سایز واقعی بومِ طراحی (سیستم مختصات viewBox).
 * displayWidth/displayHeight: سایز نمایشی نهایی خروجی (اگر ندهید، برابر width/height است).
 */
export function serializeShapesToSvg(
  shapes: Shape[],
  width: number,
  height: number,
  background?: string | null,
  displayWidth?: number,
  displayHeight?: number,
): string {
  const colors = Array.from(new Set(shapes.filter((s) => s.type === 'arrow').map((s) => s.color)))
  const markers = colors
    .map(
      (c) => `<marker id="arrowhead-${c.replace('#', '')}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="${c}" />
      </marker>`,
    )
    .join('')

  const bg = background
    ? `<image href="${background}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />`
    : ''

  const body = shapes.map(shapeToSvgElement).join('\n')

  const dw = displayWidth || width
  const dh = displayHeight || height

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:${dw}px;height:${dh}px;max-width:100%;display:block;">
    <defs>${markers}</defs>
    ${bg}
    ${body}
  </svg>`
}

// پریست محور مختصات
export function buildAxesShapes(width: number, height: number, color = '#333333'): Shape[] {
  const cx = width / 2
  const cy = height / 2
  const pad = 30
  const shapes: Shape[] = [
    { id: 'axis-x', type: 'arrow', points: [[pad, cy], [width - pad, cy]], color, strokeWidth: 2 },
    { id: 'axis-y', type: 'arrow', points: [[cx, height - pad], [cx, pad]], color, strokeWidth: 2 },
  ]
  const step = 30
  for (let x = cx - step; x > pad; x -= step) {
    shapes.push({ id: `tx-${x}`, type: 'line', points: [[x, cy - 4], [x, cy + 4]], color, strokeWidth: 1.5 })
  }
  for (let x = cx + step; x < width - pad; x += step) {
    shapes.push({ id: `tx-${x}`, type: 'line', points: [[x, cy - 4], [x, cy + 4]], color, strokeWidth: 1.5 })
  }
  for (let y = cy - step; y > pad; y -= step) {
    shapes.push({ id: `ty-${y}`, type: 'line', points: [[cx - 4, y], [cx + 4, y]], color, strokeWidth: 1.5 })
  }
  for (let y = cy + step; y < height - pad; y += step) {
    shapes.push({ id: `ty-${y}`, type: 'line', points: [[cx - 4, y], [cx + 4, y]], color, strokeWidth: 1.5 })
  }
  return shapes
}

export function buildTrapezoidShape(width: number, height: number, color = '#333333'): Shape {
  const cx = width / 2
  const cy = height / 2
  return {
    id: `trapezoid-${Date.now()}`,
    type: 'polygon',
    closed: true,
    color,
    strokeWidth: 2,
    points: [
      [cx - 80, cy + 50],
      [cx + 80, cy + 50],
      [cx + 40, cy - 50],
      [cx - 40, cy - 50],
    ],
  }
}

export function buildTriangleShape(width: number, height: number, color = '#333333'): Shape {
  const cx = width / 2
  const cy = height / 2
  return {
    id: `triangle-${Date.now()}`,
    type: 'polygon',
    closed: true,
    color,
    strokeWidth: 2,
    points: [
      [cx, cy - 60],
      [cx + 70, cy + 50],
      [cx - 70, cy + 50],
    ],
  }
}