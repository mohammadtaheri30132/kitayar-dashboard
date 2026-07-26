import React, { useRef, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import ImageSizeModal from './ImageSizeModal'

const MIN_WIDTH = 60
const MAX_WIDTH = 900

const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const imgRef = useRef<HTMLImageElement>(null)
  const [resizing, setResizing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const width = (node.attrs.width as number) || 300
  const height = (node.attrs.height as number) || null
  const align = (node.attrs.align as string) || 'center'

  const startResize = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    setResizing(true)
    const startX = e.clientX
    const startWidth = width
    const aspect = imgRef.current
      ? imgRef.current.naturalHeight / imgRef.current.naturalWidth
      : 0.6

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const signedDelta = direction === 'right' ? delta : -delta
      let newWidth = startWidth + signedDelta
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
      if (imgRef.current) {
        imgRef.current.style.width = `${newWidth}px`
        imgRef.current.style.height = `${Math.round(newWidth * aspect)}px`
      }
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      const delta = upEvent.clientX - startX
      const signedDelta = direction === 'right' ? delta : -delta
      let finalWidth = startWidth + signedDelta
      finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, finalWidth))
      updateAttributes({ width: Math.round(finalWidth), height: Math.round(finalWidth * aspect) })
      setResizing(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const alignStyle: React.CSSProperties = {
    marginInlineStart: align === 'right' ? 'auto' : align === 'center' ? 'auto' : 0,
    marginInlineEnd: align === 'left' ? 'auto' : align === 'center' ? 'auto' : 0,
  }

  return (
    <NodeViewWrapper
      as="div"
      className={`resizable-image-wrapper${selected ? ' is-selected' : ''}`}
      style={{ width: `${width}px`, ...alignStyle }}
    >
      {selected && (
        <div className="image-floating-toolbar" contentEditable={false}>
          <button
            type="button"
            className={align === 'right' ? 'active' : ''}
            onClick={() => updateAttributes({ align: 'right' })}
            title="راست‌چین"
          >
            ⇥
          </button>
          <button
            type="button"
            className={align === 'center' ? 'active' : ''}
            onClick={() => updateAttributes({ align: 'center' })}
            title="وسط‌چین"
          >
            ⇔
          </button>
          <button
            type="button"
            className={align === 'left' ? 'active' : ''}
            onClick={() => updateAttributes({ align: 'left' })}
            title="چپ‌چین"
          >
            ⇤
          </button>
          <button type="button" onClick={() => setModalOpen(true)} title="تغییر اندازه دقیق">
            📐
          </button>
          <button type="button" className="delete-btn" onClick={() => deleteNode()} title="حذف عکس">
            ✕
          </button>
        </div>
      )}

      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={{ width: '100%', height: height ? `${height}px` : 'auto', display: 'block', cursor: 'pointer' }}
        draggable={false}
        onClick={() => setModalOpen(true)}
      />

      {selected && (
        <>
          <div className="resize-handle resize-handle-start" onMouseDown={(e) => startResize(e, 'left')} />
          <div className="resize-handle resize-handle-end" onMouseDown={(e) => startResize(e, 'right')} />
        </>
      )}

      {resizing && <div className="resize-overlay-guard" />}

      {modalOpen && (
        <ImageSizeModal
          src={node.attrs.src}
          initialWidth={width}
          showModeSelector={false}
          onCancel={() => setModalOpen(false)}
          onConfirm={({ width: w, height: h }) => {
            updateAttributes({ width: w, height: h })
            setModalOpen(false)
          }}
        />
      )}
    </NodeViewWrapper>
  )
}

export default ResizableImageComponent