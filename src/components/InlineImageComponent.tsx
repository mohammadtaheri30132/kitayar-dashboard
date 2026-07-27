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
      className="inline-block align-middle relative"
      style={{ width: `${width}px` }}
    >
      {selected && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-white border border-gray-200
                     rounded-lg px-1.5 py-1 shadow-lg z-10"
          contentEditable={false}
        >
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
            onClick={() => deleteNode()}
            className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            title="حذف"
          >
            ✕
          </button>
        </div>
      )}

      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        className={`w-full rounded-md cursor-pointer object-contain bg-gray-50
          ${height ? '' : 'h-auto'}
          ${selected ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
        style={height ? { height: `${height}px` } : undefined}
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