import React, { useRef, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import ImageSizeModal from './ImageSizeModal'

const MIN_WIDTH = 60
const MAX_WIDTH = 900

type Align = 'left' | 'center' | 'right'
type Mode = 'inline' | 'block'

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
  const align = ((node.attrs.align as Align) || 'center') as Align
  const mode = ((node.attrs.mode as Mode) || 'block') as Mode

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

  const handleEditAlt = () => {
    const value = window.prompt('متن جایگزین تصویر (alt):', node.attrs.alt || '')
    if (value !== null) updateAttributes({ alt: value })
  }

  // نکته: گره در schema همیشه inline است (برای اینکه بشه قبل/بعدش تایپ یا جابجاش کرد).
  // «mode» فقط با CSS ظاهرش رو کنترل می‌کنه: block یعنی با display:block مجبورش می‌کنیم سطر جدا بگیره
  // (دقیقاً مثل <img> در HTML که خودش inline است ولی با CSS بلاک می‌شه)، inline یعنی کنار متن بمونه.
  const wrapperStyle: React.CSSProperties =
    mode === 'inline'
      ? { display: 'inline-block', verticalAlign: 'middle', width: `${width}px`, maxWidth: '100%' }
      : {
          display: 'block',
          width: `${width}px`,
          maxWidth: '100%',
          marginRight: align === 'right' || align === 'center' ? 'auto' : 0,
          marginLeft: align === 'left' || align === 'center' ? 'auto' : 0,
        }

  return (
  <NodeViewWrapper
  as="span"
  draggable
  data-drag-handle
  className={`relative max-w-full inline-block align-middle select-none ${
    mode === 'block' ? 'my-1' : 'mx-1'
  }`}
  style={{
    ...wrapperStyle,
    cursor: selected ? 'grab' : 'pointer',
  }}
>
      {/* تولبار شناور */}
      {selected && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-white border border-gray-200
                     rounded-lg px-1.5 py-1 shadow-lg z-10 whitespace-nowrap"
          contentEditable={false}
        >
          {mode === 'block' && (
            <>
              <button
                type="button"
                onClick={() => updateAttributes({ align: 'right' })}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors
                  ${align === 'right' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="راست‌چین"
              >
                ⇥
              </button>
              <button
                type="button"
                onClick={() => updateAttributes({ align: 'center' })}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors
                  ${align === 'center' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="وسط‌چین"
              >
                ⇔
              </button>
              <button
                type="button"
                onClick={() => updateAttributes({ align: 'left' })}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors
                  ${align === 'left' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="چپ‌چین"
              >
                ⇤
              </button>
              <span className="w-px bg-gray-200 my-1" />
            </>
          )}

          <button
            type="button"
            onClick={() => updateAttributes({ mode: mode === 'inline' ? 'block' : 'inline' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors
              ${mode === 'inline' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title={mode === 'inline' ? 'تبدیل به بلوک (سطر مجزا)' : 'تبدیل به درون‌خط'}
          >
            {mode === 'inline' ? '⇄ درون‌خط' : '⇄ بلوک'}
          </button>

          <span className="w-px bg-gray-200 my-1" />

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-2 py-1 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            title="تغییر اندازه"
          >
            📐
          </button>
          <button
            type="button"
            onClick={handleEditAlt}
            className="px-2 py-1 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            title="متن جایگزین (alt)"
          >
            🏷
          </button>
          <button
            type="button"
            onClick={() => deleteNode()}
            className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            title="حذف"
          >
            ✕
          </button>
        </div>
      )}

      <img
          ref={imgRef}
  src={node.attrs.src}
  alt={node.attrs.alt || ''}
  className={`w-full rounded-lg cursor-grab object-contain bg-gray-50
    ${height ? '' : 'h-auto'}
    ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
  style={height ? { height: `${height}px` } : undefined}
  draggable={false}
  onDoubleClick={() => setModalOpen(true)}
  title="برای جابه‌جایی بکشید"
   
      />

      {/* دستگیره‌های تغییر اندازه */}
      {selected && (
        <>
          <div
            className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-ew-resize shadow z-10"
            onMouseDown={(e) => startResize(e, 'left')}
          />
          <div
            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-ew-resize shadow z-10"
            onMouseDown={(e) => startResize(e, 'right')}
          />
        </>
      )}

      {resizing && <div className="fixed inset-0 z-[999] cursor-ew-resize" />}

      {modalOpen && (
        <ImageSizeModal
          src={node.attrs.src}
          initialWidth={width}
          initialMode={mode}
          showModeSelector
          onCancel={() => setModalOpen(false)}
          onConfirm={({ width: w, height: h, mode: m }) => {
            updateAttributes({ width: w, height: h, mode: m })
            setModalOpen(false)
          }}
        />
      )}
    </NodeViewWrapper>
  )
}

export default ResizableImageComponent