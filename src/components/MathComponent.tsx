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
      className={`math-inline-wrapper${selected ? ' is-selected' : ''}`}
      style={{ unicodeBidi: 'isolate' }}
    >
      <span
        ref={spanRef}
        className="math-inline-render"
        dir="ltr"
        contentEditable={false}
        onDoubleClick={() => setEditing(true)}
        title="برای ویرایش دابل کلیک کنید"
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