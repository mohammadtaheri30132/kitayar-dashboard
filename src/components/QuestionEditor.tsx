import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontSize } from '../extensions/FontSize'
import MathInline from '../extensions/MathInline'
import ResizableImage from '../extensions/ResizableImage'
import InlineImage from '../extensions/InlineImage'
import DrawingNode from '../extensions/DrawingNode'
import EditorToolbar from './EditorToolbar'
import MathInsertPanel from './MathInsertPanel'
import ImageSizeModal from './ImageSizeModal'
import DrawingModal from './DrawingModal'
import { SAMPLE_CONTENT } from '../sampleContent'

interface Props {
  content?: string
  onChange?: (html: string) => void
  storageKey?: string
  placeholderText?: string
  showSampleButton?: boolean
}

const QuestionEditor: React.FC<Props> = ({
  content,
  onChange,
  storageKey = 'ketabia-question-draft',
  placeholderText = 'متن را اینجا بنویسید...',
  showSampleButton = false,
}) => {
  const [drawingModalOpen, setDrawingModalOpen] = useState(false)
  const [mathPanelOpen, setMathPanelOpen] = useState(false)
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null)

  // محتوای اولیه: content داده شده > localStorage > خالی
  const initialContent = content || (typeof window !== 'undefined' ? localStorage.getItem(storageKey) || '' : '')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: placeholderText }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Subscript,
      Superscript,
      TextStyle,
      FontSize,
      MathInline,
      ResizableImage,
      InlineImage,
      DrawingNode,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
      localStorage.setItem(storageKey, html)
    },
    editorProps: {
      attributes: {
        dir: 'rtl',
        class: 'prose prose-sm max-w-none min-h-[220px] px-4 py-3 outline-none text-gray-800 leading-loose',
      },
    },
  })

  // اگر content از props عوض شد، ادیتور رو آپدیت کن
  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  useEffect(() => {
    if (editor) onChange?.(editor.getHTML())
  }, [editor])

  const handleInsertMath = (latex: string) => {
    editor?.chain().focus().insertMath(latex).run()
  }

  const handleImageSelected = (src: string) => setPendingImageSrc(src)

  const handleConfirmImageInsert = ({ width, height, mode }: { width: number; height: number; mode: 'inline' | 'block' }) => {
    if (!pendingImageSrc) return
    if (mode === 'inline') {
      editor?.chain().focus().setInlineImage({ src: pendingImageSrc, width, height }).run()
    } else {
      editor?.chain().focus().setResizableImage({ src: pendingImageSrc, width, height, align: 'center' }).run()
    }
    setPendingImageSrc(null)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {showSampleButton && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <button onClick={() => editor?.commands.setContent(SAMPLE_CONTENT)}
            className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100">
            بارگذاری نمونه
          </button>
        </div>
      )}

      <EditorToolbar editor={editor} mathPanelOpen={mathPanelOpen}
        onToggleMathPanel={() => setMathPanelOpen(v => !v)}
        onInsertImage={handleImageSelected}
        onOpenDrawing={() => setDrawingModalOpen(true)} />

      {drawingModalOpen && (
        <div className="border-b border-gray-200">
          <DrawingModal
            onCancel={() => setDrawingModalOpen(false)}
            onSave={({ shapes, svgMarkup, width, height, background, outputWidth, outputHeight, mode }) => {
              editor?.chain().focus().insertDrawing({ shapesJson: JSON.stringify(shapes), svgMarkup, width, height, background, outputWidth, outputHeight, mode }).run()
              setDrawingModalOpen(false)
            }}
          />
        </div>
      )}

      {mathPanelOpen && <MathInsertPanel onInsert={handleInsertMath} />}

      <EditorContent editor={editor} className="question-editor-content" />

      {pendingImageSrc && (
        <ImageSizeModal src={pendingImageSrc} initialWidth={300} showModeSelector
          onConfirm={handleConfirmImageInsert} onCancel={() => setPendingImageSrc(null)} />
      )}
    </div>
  )
}

export default QuestionEditor
