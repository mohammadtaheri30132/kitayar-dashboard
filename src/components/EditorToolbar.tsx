import React, { useRef } from 'react'
import { Editor } from '@tiptap/react'

interface Props {
  editor: Editor | null
  mathPanelOpen: boolean
  onToggleMathPanel: () => void
  onInsertImage: (src: string) => void
  onOpenDrawing: () => void
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']

const EditorToolbar: React.FC<Props> = ({ editor, mathPanelOpen, onOpenDrawing, onToggleMathPanel, onInsertImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onInsertImage(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const currentFontSize = editor.getAttributes('textStyle').fontSize || 'default'

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'default') {
      editor.chain().focus().unsetFontSize().run()
    } else {
      editor.chain().focus().setFontSize(value).run()
    }
  }

  return (
    <div className="editor-toolbar">
      <button type="button" onClick={() => editor.chain().focus().undo().run()} title="واگرد">
        ↷
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} title="ازنو">
        ↶
      </button>
      <button type="button" className="image-btn" onClick={onOpenDrawing}>
        ✏️ طراحی / نمودار
      </button>

      <span className="toolbar-divider" />

      <button
        type="button"
        className={editor.isActive('bold') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        type="button"
        className={editor.isActive('italic') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </button>
      <button
        type="button"
        className={editor.isActive('underline') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </button>

      <span className="toolbar-divider" />

      {/* منوی سایز فونت */}
      <select value={currentFontSize} onChange={handleFontSizeChange} title="اندازه فونت" style={{ minWidth: 90 }}>
        <option value="default">اندازه پیش‌فرض</option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size.replace('px', '')}
          </option>
        ))}
      </select>

      <span className="toolbar-divider" />

      <button
        type="button"
        className={editor.isActive('superscript') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        title="توان (بالانویس)"
      >
        x²
      </button>
      <button
        type="button"
        className={editor.isActive('subscript') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        title="اندیس (پایین‌نویس)"
      >
        x₂
      </button>

      <span className="toolbar-divider" />

      <button
        type="button"
        className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="راست‌چین"
      >
        ☰˒
      </button>
      <button
        type="button"
        className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="وسط‌چین"
      >
        ☰
      </button>
      <button
        type="button"
        className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="چپ‌چین"
      >
        ˒☰
      </button>

      <span className="toolbar-divider" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        لیست
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        لیست شماره‌دار
      </button>

      <button
        type="button"
        className={`math-btn${mathPanelOpen ? ' active' : ''}`}
        onClick={onToggleMathPanel}
      >
        ∑ فرمول
      </button>

      <button type="button" className="image-btn" onClick={() => fileInputRef.current?.click()}>
        🖼 افزودن عکس
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}

export default EditorToolbar