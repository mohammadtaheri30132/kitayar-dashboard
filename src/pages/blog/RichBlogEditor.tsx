import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import CharacterCount from '@tiptap/extension-character-count'
import ResizableImage from '../../extensions/ResizableImage'
import WordPressMediaLibrary from './WordPressMediaLibrary'
import type { SelectedMediaPayload } from './WordPressMediaLibrary'
import '../../components/question-editor.css'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Link2,
  Unlink,
  ImagePlus,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  Maximize2,
  Minimize2,
  FileCode,
  Lightbulb,
  Plus,
  Trash2,
} from './BlogIcons'

interface Props {
  value: string
  onChange: (html: string) => void
}

/**
 * Converts legacy plain-text/Markdown blog articles into clean HTML
 * when loaded in the visual editor for the first time.
 */
export function normalizeBlogContentToHtml(raw: string): string {
  const trimmed = (raw || '').trim()
  if (!trimmed) return ''
  if (/<(p|h1|h2|h3|h4|div|ul|ol|table|blockquote|img)\b/i.test(trimmed)) {
    return trimmed
  }

  const formatInline = (text: string) =>
    text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  return trimmed
    .split(/\n\n+/)
    .map((block) => {
      const b = block.trim()
      if (b.startsWith('### ')) return `<h3>${formatInline(b.slice(4))}</h3>`
      if (b.startsWith('## ')) return `<h2>${formatInline(b.slice(3))}</h2>`
      if (b.startsWith('# ')) return `<h2>${formatInline(b.slice(2))}</h2>`
      if (b.startsWith('- ')) {
        const items = b
          .split('\n')
          .map((line) => `<li>${formatInline(line.replace(/^-\s*/, '').trim())}</li>`)
          .join('')
        return `<ul>${items}</ul>`
      }
      if (/^\d+[.)]\s/.test(b)) {
        const items = b
          .split('\n')
          .map((line) => `<li>${formatInline(line.replace(/^\d+[.)]\s*/, '').trim())}</li>`)
          .join('')
        return `<ol>${items}</ol>`
      }
      return `<p>${formatInline(b.replace(/\n/g, '<br/>'))}</p>`
    })
    .join('')
}

const TEXT_COLORS = ['#0f172a', '#1d4ed8', '#047857', '#b91c1c', '#7c3aed', '#c2410c']
const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecdd3', '#e9d5ff']

export const RichBlogEditor: React.FC<Props> = ({ value, onChange }) => {
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [htmlMode, setHtmlMode] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkNoFollow, setLinkNoFollow] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder:
          'متن مقاله را اینجا بنویسید... برای سئو بهتر از زیرعنوان‌های H2 و H3، لیست‌ها و تصاویر دارای تگ Alt استفاده کنید.',
      }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline font-semibold',
          target: '_blank',
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: 'rounded-2xl my-4 max-w-full' },
      }),
    ],
    content: normalizeBlogContentToHtml(value),
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        dir: 'rtl',
        class:
          'prose prose-slate max-w-none min-h-[420px] px-6 py-5 outline-none text-slate-800 leading-loose text-sm sm:text-base',
      },
    },
  })

  // Sync external post switching (e.g. clicking Edit on another article)
  useEffect(() => {
    if (!editor) return
    const normalized = normalizeBlogContentToHtml(value)
    if (normalized !== editor.getHTML()) {
      editor.commands.setContent(normalized, { emitUpdate: false })
    }
  }, [value, editor])

  const handleInsertMedia = (media: SelectedMediaPayload) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .setResizableImage({
        src: media.url,
        alt: media.alt,
        width: media.width || 680,
        align: media.align || 'center',
        mode: 'block',
      })
      .run()

    if (media.caption?.trim()) {
      editor
        .chain()
        .focus()
        .insertContent(`<p style="text-align: center"><em>${media.caption.trim()}</em></p>`)
        .run()
    }
  }

  const handleOpenLinkDialog = () => {
    if (!editor) return
    const attrs = editor.getAttributes('link')
    setLinkUrl(attrs.href || 'https://')
    setLinkNoFollow(String(attrs.rel || '').includes('nofollow'))
    setLinkModalOpen(true)
  }

  const handleApplyLink = () => {
    if (!editor) return
    const cleanUrl = linkUrl.trim()
    if (!cleanUrl || cleanUrl === 'https://') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: cleanUrl,
          target: '_blank',
          rel: linkNoFollow ? 'nofollow noopener' : 'noopener',
        })
        .run()
    }
    setLinkModalOpen(false)
  }

  const insertKeyTipCallout = () => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertContent(
        `<blockquote><p><strong>💡 نکته کلیدی آموزشی:</strong> متن نکته مهم یا جمع‌بندی کاربردی این بخش را اینجا بنویسید تا توجه خواننده جلب شود.</p></blockquote><p></p>`
      )
      .run()
  }

  // Live metrics
  const plainText = (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = plainText ? plainText.split(/\s+/).length : 0
  const charCount = plainText.length
  const headingCount = ((value || '').match(/<h[2-4]\b/gi) || []).length
  const linkCount = ((value || '').match(/<a\b/gi) || []).length
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200))

  const currentHeadingValue = editor?.isActive('heading', { level: 2 })
    ? 'h2'
    : editor?.isActive('heading', { level: 3 })
    ? 'h3'
    : editor?.isActive('heading', { level: 4 })
    ? 'h4'
    : 'p'

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[90] bg-slate-100 p-4 sm:p-6 flex flex-col overflow-hidden'
          : 'w-full'
      }
      dir="rtl"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col flex-1 overflow-hidden">
        {/* WordPress Top Action Strip */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMediaModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-600/20 transition"
            >
              <ImagePlus size={15} />
              <span>افزودن پرونده چندرسانه‌ای</span>
            </button>

            <button
              type="button"
              onClick={insertKeyTipCallout}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Lightbulb size={14} className="text-amber-600" />
              <span>درج باکس نکته آموزشی</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHtmlMode(!htmlMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                htmlMode
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileCode size={14} />
              <span>{htmlMode ? 'نمای دیداری' : 'ویرایش کد HTML'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              title="حالت تمرکز تمام‌صفحه"
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            >
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>

        {/* Rich Formatting Toolbar */}
        {!htmlMode && editor && (
          <div className="px-3 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center gap-1 sticky top-0 z-10">
            {/* Heading Selector */}
            <select
              value={currentHeadingValue}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'p') editor.chain().focus().setParagraph().run()
                if (v === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run()
                if (v === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run()
                if (v === 'h4') editor.chain().focus().toggleHeading({ level: 4 }).run()
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 ml-1"
              title="ساختار تیتربندی سئو (تگ H1 به صورت خودکار به عنوان اصلی مقاله اختصاص دارد)"
            >
              <option value="p">پاراگراف معمولی</option>
              <option value="h2">تیتر اصلی بخش (H2 سئو)</option>
              <option value="h3">زیرعنوان فرعی (H3)</option>
              <option value="h4">زیرعنوان جزئی (H4)</option>
            </select>

            <span className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Text Styles */}
            <ToolbarBtn
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="ضخیم (Bold)"
            >
              <Bold size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="مورب (Italic)"
            >
              <Italic size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="زیرخط‌دار"
            >
              <UnderlineIcon size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="خط‌خورده"
            >
              <Strikethrough size={15} />
            </ToolbarBtn>

            {/* Color Swatches */}
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 mx-0.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  className="w-4 h-4 rounded-full border border-white shadow-2xs hover:scale-110 transition"
                  style={{ backgroundColor: c }}
                  title="رنگ متن"
                />
              ))}
            </div>

            {/* Highlight Swatches */}
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 mx-0.5">
              <Highlighter size={13} className="text-slate-400" />
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                  className="w-4 h-4 rounded border border-slate-300 hover:scale-110 transition"
                  style={{ backgroundColor: c }}
                  title="هایلایت متن"
                />
              ))}
            </div>

            <span className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Alignment */}
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="راست‌چین"
            >
              <AlignRight size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="وسط‌چین"
            >
              <AlignCenter size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="چپ‌چین"
            >
              <AlignLeft size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              title="هم‌تراز (Justify)"
            >
              <AlignJustify size={15} />
            </ToolbarBtn>

            <span className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Lists & Blocks */}
            <ToolbarBtn
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="لیست نقطه‌ای"
            >
              <List size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="لیست شماره‌دار"
            >
              <ListOrdered size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive('taskList')}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="چک‌لیست"
            >
              <CheckSquare size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="نقل‌قول"
            >
              <Quote size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="بلوک کد"
            >
              <Code2 size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              active={false}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="خط جداکننده افقی"
            >
              <Minus size={15} />
            </ToolbarBtn>

            <span className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Links */}
            <ToolbarBtn
              active={editor.isActive('link')}
              onClick={handleOpenLinkDialog}
              title="درج یا ویرایش لینک سئو"
            >
              <Link2 size={15} />
            </ToolbarBtn>
            {editor.isActive('link') && (
              <ToolbarBtn
                active={false}
                onClick={() => editor.chain().focus().unsetLink().run()}
                title="حذف لینک"
              >
                <Unlink size={15} />
              </ToolbarBtn>
            )}

            {/* Tables */}
            <ToolbarBtn
              active={editor.isActive('table')}
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              title="درج جدول ۳×۳"
            >
              <TableIcon size={15} />
            </ToolbarBtn>

            {editor.isActive('table') && (
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="text-blue-700 hover:underline flex items-center gap-0.5 font-bold"
                >
                  <Plus size={11} /> سطر
                </button>
                <span className="text-blue-300">|</span>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="text-blue-700 hover:underline flex items-center gap-0.5 font-bold"
                >
                  <Plus size={11} /> ستون
                </button>
                <span className="text-blue-300">|</span>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="text-rose-600 hover:underline flex items-center gap-0.5 font-bold"
                >
                  <Trash2 size={11} /> جدول
                </button>
              </div>
            )}

            <div className="mr-auto flex items-center gap-1">
              <ToolbarBtn
                active={false}
                onClick={() => editor.chain().focus().undo().run()}
                title="بازگشت (Undo)"
              >
                <Undo2 size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                active={false}
                onClick={() => editor.chain().focus().redo().run()}
                title="تکرار (Redo)"
              >
                <Redo2 size={15} />
              </ToolbarBtn>
            </div>
          </div>
        )}

        {/* Link Insert Inline Bar */}
        {linkModalOpen && (
          <div className="px-4 py-2.5 bg-blue-50/90 border-b border-blue-200 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-blue-900">آدرس پیوند (URL):</span>
            <input
              type="url"
              dir="ltr"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://kitayar.ir/exam/create"
              className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs text-slate-800 focus:outline-none"
            />
            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={linkNoFollow}
                onChange={(e) => setLinkNoFollow(e.target.checked)}
                className="rounded"
              />
              <span>لینک خارجی `rel="nofollow"`</span>
            </label>
            <button
              type="button"
              onClick={handleApplyLink}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
            >
              ثبت پیوند
            </button>
            <button
              type="button"
              onClick={() => setLinkModalOpen(false)}
              className="px-2.5 py-1.5 rounded-lg bg-white text-slate-600 border border-slate-200"
            >
              انصراف
            </button>
          </div>
        )}

        {/* Editor Canvas / HTML Source View */}
        <div className="flex-1 overflow-y-auto bg-white blog-tiptap-surface">
          {htmlMode ? (
            <textarea
              dir="ltr"
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                editor?.commands.setContent(e.target.value, { emitUpdate: false })
              }}
              className="w-full min-h-[420px] p-5 font-mono text-xs bg-slate-950 text-emerald-300 focus:outline-none leading-relaxed"
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        {/* Bottom WordPress Status Bar */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              تعداد کلمات: <strong className="text-slate-800">{wordCount}</strong>
            </span>
            <span>•</span>
            <span>
              کاراکترها: <strong className="text-slate-800">{charCount}</strong>
            </span>
            <span>•</span>
            <span>
              زیرعنوان‌ها (H2-H4): <strong className="text-slate-800">{headingCount}</strong>
            </span>
            <span>•</span>
            <span>
              لینک‌ها: <strong className="text-slate-800">{linkCount}</strong>
            </span>
          </div>
          <div className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
            زمان تخمینی مطالعه: {readingMinutes} دقیقه
          </div>
        </div>
      </div>

      {/* Scoped Typography Polish inside Editor */}
      <style>{`
        .blog-tiptap-surface .ProseMirror h2 {
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          margin-top: 1.5rem;
          margin-bottom: 0.65rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .blog-tiptap-surface .ProseMirror h3 {
          font-size: 1.12rem;
          font-weight: 800;
          color: #1e3a8a;
          margin-top: 1.2rem;
          margin-bottom: 0.5rem;
        }
        .blog-tiptap-surface .ProseMirror h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #334155;
          margin-top: 1rem;
          margin-bottom: 0.4rem;
        }
        .blog-tiptap-surface .ProseMirror p {
          margin-bottom: 0.85rem;
          line-height: 2;
        }
        .blog-tiptap-surface .ProseMirror blockquote {
          border-right: 4px solid #2563eb;
          background: #eff6ff;
          padding: 0.85rem 1.1rem;
          border-radius: 0.85rem;
          color: #1e293b;
          margin: 1rem 0;
        }
        .blog-tiptap-surface .ProseMirror ul {
          list-style-type: disc;
          padding-right: 1.5rem;
          margin-bottom: 1rem;
        }
        .blog-tiptap-surface .ProseMirror ol {
          list-style-type: decimal;
          padding-right: 1.5rem;
          margin-bottom: 1rem;
        }
        .blog-tiptap-surface .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .blog-tiptap-surface .ProseMirror th,
        .blog-tiptap-surface .ProseMirror td {
          border: 1px solid #cbd5e1;
          padding: 0.55rem 0.75rem;
          text-align: right;
        }
        .blog-tiptap-surface .ProseMirror th {
          background: #f8fafc;
          font-weight: 800;
        }
      `}</style>

      {/* WordPress Media Picker Modal */}
      <WordPressMediaLibrary
        mode="modal"
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={handleInsertMedia}
        selectButtonLabel="درج تصویر در متن مقاله"
        showInsertDisplaySettings
      />
    </div>
  )
}

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition ${
        active
          ? 'bg-blue-600 text-white shadow-2xs'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

export default RichBlogEditor
