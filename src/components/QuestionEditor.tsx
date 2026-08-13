import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
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
import { FontSize } from '../extensions/FontSize'
import MathInline from '../extensions/MathInline'
import DrawingNode from '../extensions/DrawingNode'
import ResizableImage from '../extensions/ResizableImage'
import EditorToolbar from './EditorToolbar'
import MathInsertPanel from './MathInsertPanel'
import ImageSizeModal from './ImageSizeModal'
import DrawingModal from './DrawingModal'
import './question-editor.css'

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // heading/blockquote/codeBlock/horizontalRule/strike همه از StarterKit میان
      }),
      Underline,
      Placeholder.configure({ placeholder: placeholderText }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Subscript,
      Superscript,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'question-editor-link', target: '_blank', rel: 'noopener noreferrer' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      // تصویر قابل تغییر سایز، align و inline/block - واقعا inline در schema
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: 'question-editor-image' },
      }),
      MathInline,
      DrawingNode,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, html)
        } catch {}
      }
    },
    editorProps: {
      attributes: {
        dir: 'rtl',
        class: 'prose prose-sm max-w-none min-h-[220px] px-4 py-3 outline-none text-gray-800 leading-loose',
      },
    },
  })

  // وقتی content از props تغییر کرد
  useEffect(() => {
    if (!editor) return
    if (content !== undefined && content !== null && content !== '') {
      const currentContent = editor.getHTML()
      if (content !== currentContent) {
        editor.commands.setContent(content, { emitUpdate: false })
      }
    }
  }, [content, editor])

  const handleInsertMath = (latex: string) => {
    editor?.chain().focus().insertMath(latex).run()
  }

  const handleImageSelected = (src: string) => {
    setPendingImageSrc(src)
  }

  const handleConfirmImageInsert = ({
    width,
    height,
    mode,
  }: {
    width: number
    height: number
    mode: 'inline' | 'block'
  }) => {
    if (!pendingImageSrc || !editor) return
    editor
      .chain()
      .focus()
      .setResizableImage({
        src: pendingImageSrc,
        width,
        height,
        mode,
        align: 'center',
      })
      .run()
    setPendingImageSrc(null)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <EditorToolbar
        editor={editor}
        mathPanelOpen={mathPanelOpen}
        onToggleMathPanel={() => setMathPanelOpen((v) => !v)}
        onInsertImage={handleImageSelected}
        onOpenDrawing={() => setDrawingModalOpen(true)}
      />

      {drawingModalOpen && (
        <div className="border-b border-gray-200">
          <DrawingModal
            onCancel={() => setDrawingModalOpen(false)}
            onSave={({ shapes, svgMarkup, width, height, background, outputWidth, outputHeight, mode }) => {
              editor
                ?.chain()
                .focus()
                .insertDrawing({
                  shapesJson: JSON.stringify(shapes),
                  svgMarkup,
                  width,
                  height,
                  background,
                  outputWidth,
                  outputHeight,
                  mode,
                })
                .run()
              setDrawingModalOpen(false)
            }}
          />
        </div>
      )}

      {mathPanelOpen && <MathInsertPanel onInsert={handleInsertMath} />}

      <EditorContent editor={editor} className="question-editor-content" />

      {editor && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
          <span>{editor.storage.characterCount.characters()} کاراکتر · {editor.storage.characterCount.words()} کلمه</span>
        </div>
      )}

      {pendingImageSrc && (
        <ImageSizeModal
          src={pendingImageSrc}
          initialWidth={300}
          showModeSelector
          onConfirm={handleConfirmImageInsert}
          onCancel={() => setPendingImageSrc(null)}
        />
      )}
    </div>
  )
}

export default QuestionEditor