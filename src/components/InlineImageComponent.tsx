import React, { useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import ImageSizeModal from './ImageSizeModal'

const InlineImageComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const width = (node.attrs.width as number) || 200
  const height = (node.attrs.height as number) || null

  return (
    <NodeViewWrapper
      as="span"
      className={`resizable-image-wrapper${selected ? ' is-selected' : ''}`}
      style={{ display: 'inline-block', width: `${width}px`, verticalAlign: 'middle', position: 'relative' }}
    >
      {selected && (
        <div className="image-floating-toolbar" contentEditable={false}>
          <button type="button" onClick={() => setModalOpen(true)} title="تغییر اندازه دقیق">
            📐
          </button>
          <button type="button" className="delete-btn" onClick={() => deleteNode()} title="حذف عکس">
            ✕
          </button>
        </div>
      )}

      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={{ width: '100%', height: height ? `${height}px` : 'auto', display: 'inline-block', cursor: 'pointer' }}
        draggable={false}
        onClick={() => setModalOpen(true)}
      />

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

export default InlineImageComponent