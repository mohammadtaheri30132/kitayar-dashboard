export type ShapeType =
  | 'freehand'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'
  | 'polygon'
  | 'text'
  | 'image'

export interface Shape {
  id: string
  type: ShapeType
  points: [number, number][]
  color: string
  strokeWidth: number
  closed?: boolean // برای چندضلعی

  // --- فقط برای type === 'text' ---
  text?: string
  fontSize?: number
  fontFamily?: string
  bold?: boolean
  italic?: boolean

  // --- فقط برای type === 'image' (شیء قابل جابجایی/تغییر اندازه) ---
  src?: string
}