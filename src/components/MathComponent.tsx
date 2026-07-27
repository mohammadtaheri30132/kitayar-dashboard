import React, { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import MathFieldModal from './MathFieldModal'

const MathComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const spanRef = useRef<HTMLSpanElement>(null)
  const [editing, setEditing] = useState(false)
  const latex = (node.attrs.latex as string) || ''

  useEffect(() => {
    if (!spanRef.current) return
    try {
      katex.render(latex || '\\,', spanRef.current, {
        throwOnError: false,
        displayMode: false,
      })
    } catch {
      spanRef.current.textContent = latex
    }
  }, [latex])

  return (
    <NodeViewWrapper
      as="span"
      className={`inline-block align-middle px-1 py-0.5 mx-0.5 rounded-md cursor-pointer transition-all
        ${selected ? 'bg-warning-100 ring-1 ring-warning-400' : 'hover:bg-gray-100'}`}
      style={{ unicodeBidi: 'isolate' }}
    >
      <span
        ref={spanRef}
        dir="ltr"
        contentEditable={false}
        onDoubleClick={() => setEditing(true)}
        title="دابل کلیک برای ویرایش"
      />
      {editing && (
        <MathFieldModal
          initialLatex={latex}
          onClose={() => setEditing(false)}
          onSave={(newLatex) => {
            updateAttributes({ latex: newLatex })
            setEditing(false)
          }}
          onDelete={() => {
            deleteNode()
            setEditing(false)
          }}
        />
      )}
    </NodeViewWrapper>
  )
}

export default MathComponent