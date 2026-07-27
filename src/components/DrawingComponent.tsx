import React, { useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import DrawingModal from './DrawingModal'
import type { DrawingOutputMode } from './DrawingModal'
import { serializeShapesToSvg } from '../utils/serializeShapesToSvg'
import type { Shape } from '../types/drawing'

const DrawingComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const [editing, setEditing] = useState(false)
  const shapesJson = node.attrs.shapesJson as string
  const background = node.attrs.background as string | null
  const width = node.attrs.width as number
  const height = node.attrs.height as number
  const svgMarkup = node.attrs.svgMarkup as string
  const outputWidth = (node.attrs.outputWidth as number) || width
  const outputHeight = (node.attrs.outputHeight as number) || height
  const mode = (node.attrs.mode as DrawingOutputMode) || 'block'

  let shapes: Shape[] = []
  try { shapes = JSON.parse(shapesJson) } catch { shapes = [] }

  const wrapperStyle: React.CSSProperties = mode === 'inline'
    ? { display: 'inline-block', verticalAlign: 'middle', width: outputWidth, maxWidth: '100%' }
    : { display: 'block', width: '100%', maxWidth: outputWidth }

  return (
    <NodeViewWrapper as="span" className={`relative ${selected ? 'block' : ''}`} style={wrapperStyle}>
      {selected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-white border border-gray-200 rounded-lg px-1.5 py-1 shadow-lg z-10" contentEditable={false}>
          <button type="button" onClick={() => setEditing(true)} className="px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100" title="ویرایش">
            ✏️ ویرایش
          </button>
          <button type="button" onClick={() => deleteNode()} className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:bg-red-50" title="حذف">
            ✕
          </button>
        </div>
      )}

      <span
        contentEditable={false}
        onClick={() => setEditing(true)}
        className={`block cursor-pointer rounded-lg overflow-hidden ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
        dangerouslySetInnerHTML={{
          __html: svgMarkup || serializeShapesToSvg(shapes, width, height, background, outputWidth, outputHeight),
        }}
      />

      {editing && (
        <div contentEditable={false} className="block">
          <DrawingModal
            initialShapes={shapes}
            initialBackground={background}
            width={width}
            height={height}
            initialOutputWidth={outputWidth}
            initialOutputHeight={outputHeight}
            initialMode={mode}
            onCancel={() => setEditing(false)}
            onSave={({ shapes: newShapes, svgMarkup: newSvg, width: w, height: h, background: newBg, outputWidth: ow, outputHeight: oh, mode: newMode }) => {
              updateAttributes({
                shapesJson: JSON.stringify(newShapes),
                svgMarkup: newSvg,
                width: w, height: h,
                background: newBg,
                outputWidth: ow, outputHeight: oh,
                mode: newMode,
              })
              setEditing(false)
            }}
          />
        </div>
      )}
    </NodeViewWrapper>
  )
}

export default DrawingComponent