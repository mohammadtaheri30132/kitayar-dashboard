import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import {TextStyle} from '@tiptap/extension-text-style'
import { FontSize } from '../extensions/FontSize'
import MathInline from '../extensions/MathInline'
import ResizableImage from '../extensions/ResizableImage'
import InlineImage from '../extensions/InlineImage'
import EditorToolbar from './EditorToolbar'
import MathInsertPanel from './MathInsertPanel'
import ImageSizeModal from './ImageSizeModal'
import { SAMPLE_CONTENT } from '../sampleContent'
import DrawingNode from '../extensions/DrawingNode'
import DrawingModal from './DrawingModal'

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
    content: content ?? (typeof window !== 'undefined' ? localStorage.getItem(storageKey) || '' : ''),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
      localStorage.setItem(storageKey, html)
    },
    editorProps: {
      attributes: {
        dir: 'rtl',
        class: 'question-editor-content',
      },
    },
  })

  useEffect(() => {
    if (editor) {
      onChange?.(editor.getHTML())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

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
    if (!pendingImageSrc) return
    if (mode === 'inline') {
      editor?.chain().focus().setInlineImage({ src: pendingImageSrc, width, height }).run()
    } else {
      editor?.chain().focus().setResizableImage({ src: pendingImageSrc, width, height, align: 'center' }).run()
    }
    setPendingImageSrc(null)
  }

  return (
    <div className="question-editor-wrapper">
      {showSampleButton && (
        <button
          type="button"
          onClick={() => editor?.commands.setContent(SAMPLE_CONTENT)}
          style={{ margin: '8px 0' }}
        >
          بارگذاری نمونه سوالات
        </button>
      )}

      <EditorToolbar
        editor={editor}
        mathPanelOpen={mathPanelOpen}
        onToggleMathPanel={() => setMathPanelOpen((v) => !v)}
        onInsertImage={handleImageSelected}
        onOpenDrawing={() => setDrawingModalOpen(true)}
      />

      {drawingModalOpen && (
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
      )}

      {mathPanelOpen && <MathInsertPanel onInsert={handleInsertMath} />}

      <EditorContent editor={editor} />

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