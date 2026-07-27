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

  const btnClass = (active = false) =>
    `px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150
     ${active ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-800'}`

  const divider = <span className="w-px h-6 bg-gray-200 mx-0.5 self-center" />

  return (
    <div className="flex items-center gap-1 flex-wrap px-3 py-2.5 bg-gray-50 border-b border-gray-200 rounded-t-xl">
      {/* واگرد / ازنو */}
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass()} title="واگرد (Ctrl+Z)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass()} title="ازنو (Ctrl+Y)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>

      {divider}

      {/* طراحی */}
      <button type="button" onClick={onOpenDrawing} className={btnClass()} title="طراحی / نمودار">
        <span className="flex items-center gap-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="hidden sm:inline text-xs">طراحی</span>
        </span>
      </button>

      {divider}

      {/* Bold / Italic / Underline */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="پررنگ (Ctrl+B)">
        <span className="font-bold">B</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="کج (Ctrl+I)">
        <span className="italic">I</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="زیرخط (Ctrl+U)">
        <span className="underline">U</span>
      </button>

      {divider}

      {/* سایز فونت */}
      <select
        value={currentFontSize}
        onChange={handleFontSizeChange}
        title="اندازه فونت"
        className="px-2 py-1.5 rounded-md text-sm bg-white border border-gray-200 text-gray-700
                   focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none cursor-pointer"
      >
        <option value="default">اندازه</option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>{size.replace('px', '')}</option>
        ))}
      </select>

      {divider}

      {/* بالا/پایین‌نویس */}
      <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={btnClass(editor.isActive('superscript'))} title="توان">
        x²
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={btnClass(editor.isActive('subscript'))} title="اندیس">
        x₂
      </button>

      {divider}

      {/* تراز متن */}
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="راست‌چین">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="10" x2="9" y2="10" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="9" y2="18" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="وسط‌چین">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="6" /><line x1="21" y1="10" x2="3" y2="10" /><line x1="18" y1="14" x2="6" y2="14" /><line x1="21" y1="18" x2="3" y2="18" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="چپ‌چین">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="10" x2="15" y2="10" /><line x1="3" y1="14" x2="21" y2="14" /><line x1="3" y1="18" x2="15" y2="18" />
        </svg>
      </button>

      {divider}

      {/* لیست */}
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="لیست">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="لیست شماره‌دار">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
      </button>

      {/* جداکننده انتهایی - دکمه‌های ویژه */}
      <span className="flex-1" />

      {/* فرمول */}
      <button
        type="button"
        onClick={onToggleMathPanel}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center gap-1
          ${mathPanelOpen ? 'bg-primary-500 text-white shadow-sm' : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'}`}
        title="فرمول ریاضی"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19h16" /><path d="M4 5h16" /><circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" /><path d="M10 12h4" />
        </svg>
        <span className="hidden sm:inline">فرمول</span>
      </button>

      {/* افزودن عکس */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150
                   text-primary-600 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-1"
        title="افزودن عکس"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="hidden sm:inline">عکس</span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

export default EditorToolbar