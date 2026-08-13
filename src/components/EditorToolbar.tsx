import React, { useRef, useState } from 'react'
import { Editor } from '@tiptap/react'

interface Props {
  editor: Editor | null
  mathPanelOpen: boolean
  onToggleMathPanel: () => void
  onInsertImage: (src: string) => void
  onOpenDrawing: () => void
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']

const TEXT_COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777']
const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa']

const EditorToolbar: React.FC<Props> = ({ editor, mathPanelOpen, onOpenDrawing, onToggleMathPanel, onInsertImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false)
  const [tableMenuOpen, setTableMenuOpen] = useState(false)

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

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
    ? '2'
    : editor.isActive('heading', { level: 3 })
    ? '3'
    : 'p'

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'p') {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run()
    }
  }

  const handleSetLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('آدرس لینک را وارد کنید:', prev)
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const handleInsertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const btnClass = (active = false, disabled = false) =>
    `px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150
     ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
     ${active ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-800'}`

  const divider = <span className="w-px h-6 bg-gray-200 mx-0.5 self-center" />

  const isInTable = editor.isActive('table')

  return (
    <div className="flex items-center gap-1 flex-wrap px-3 py-2.5 bg-gray-50 border-b border-gray-200 rounded-t-xl relative">
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

      {/* تیتر */}
      <select
        value={currentHeading}
        onChange={handleHeadingChange}
        title="تیتر"
        className="px-2 py-1.5 rounded-md text-sm bg-white border border-gray-200 text-gray-700
                   focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none cursor-pointer"
      >
        <option value="p">متن عادی</option>
        <option value="1">تیتر ۱</option>
        <option value="2">تیتر ۲</option>
        <option value="3">تیتر ۳</option>
      </select>

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

      {/* Bold / Italic / Underline / Strike */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="پررنگ (Ctrl+B)">
        <span className="font-bold">B</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="کج (Ctrl+I)">
        <span className="italic">I</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="زیرخط (Ctrl+U)">
        <span className="underline">U</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="خط‌خورده">
        <span className="line-through">S</span>
      </button>

      {divider}

      {/* رنگ متن */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setColorPickerOpen((v) => !v); setHighlightPickerOpen(false); setTableMenuOpen(false) }}
          className={btnClass(colorPickerOpen)}
          title="رنگ متن"
        >
          <span className="flex flex-col items-center leading-none">
            <span className="font-bold text-sm">A</span>
            <span className="w-4 h-1 rounded-sm mt-0.5" style={{ background: editor.getAttributes('textStyle').color || '#111827' }} />
          </span>
        </button>
        {colorPickerOpen && (
          <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-20">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { editor.chain().focus().setColor(c).run(); setColorPickerOpen(false) }}
                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                style={{ background: c }}
                title={c}
              />
            ))}
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetColor().run(); setColorPickerOpen(false) }}
              className="w-6 h-6 rounded-full border border-gray-300 bg-white text-[10px] text-gray-500 flex items-center justify-center"
              title="حذف رنگ"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* هایلایت */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setHighlightPickerOpen((v) => !v); setColorPickerOpen(false); setTableMenuOpen(false) }}
          className={btnClass(highlightPickerOpen || editor.isActive('highlight'))}
          title="هایلایت"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
          </svg>
        </button>
        {highlightPickerOpen && (
          <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-20">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setHighlightPickerOpen(false) }}
                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                style={{ background: c }}
                title={c}
              />
            ))}
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetHighlight().run(); setHighlightPickerOpen(false) }}
              className="w-6 h-6 rounded-full border border-gray-300 bg-white text-[10px] text-gray-500 flex items-center justify-center"
              title="حذف هایلایت"
            >
              ✕
            </button>
          </div>
        )}
      </div>

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

      {/* لیست‌ها */}
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
      <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={btnClass(editor.isActive('taskList'))} title="چک‌لیست">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </button>

      {divider}

      {/* نقل‌قول / کد / خط افقی */}
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="نقل‌قول">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="بلوک کد">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass()} title="خط افقی">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </button>

      {divider}

      {/* لینک */}
      <button type="button" onClick={handleSetLink} className={btnClass(editor.isActive('link'))} title="افزودن لینک">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>

      {/* جدول */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setTableMenuOpen((v) => !v); setColorPickerOpen(false); setHighlightPickerOpen(false) }}
          className={btnClass(tableMenuOpen || isInTable)}
          title="جدول"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </button>
        {tableMenuOpen && (
          <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5 z-20 min-w-[170px]" dir="rtl">
            <button type="button" onClick={() => { handleInsertTable(); setTableMenuOpen(false) }} className="px-3 py-1.5 text-xs text-right rounded-md hover:bg-gray-100">
              ➕ درج جدول ۳×۳
            </button>
            {isInTable && (
              <>
                <span className="h-px bg-gray-200 my-1" />
                <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-3 py-1.5 text-xs text-right rounded-md hover:bg-gray-100">
                  افزودن ردیف
                </button>
                <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-3 py-1.5 text-xs text-right rounded-md hover:bg-gray-100 text-red-600">
                  حذف ردیف
                </button>
                <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-3 py-1.5 text-xs text-right rounded-md hover:bg-gray-100">
                  افزودن ستون
                </button>
                <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-3 py-1.5 text-xs text-right rounded-md hover:bg-gray-100 text-red-600">
                  حذف ستون
                </button>
                <span className="h-px bg-gray-200 my-1" />
                <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-3 py-1.5 text-xs text-right rounded-md hover:bg-red-50 text-red-600 font-medium">
                  🗑 حذف کل جدول
                </button>
              </>
            )}
          </div>
        )}
      </div>

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