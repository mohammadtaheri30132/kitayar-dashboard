import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import DrawingComponent from '../components/DrawingComponent'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    drawingBlock: {
      insertDrawing: (options: {
        shapesJson: string
        svgMarkup: string
        width: number
        height: number
        background?: string | null
        outputWidth?: number
        outputHeight?: number
        mode?: 'inline' | 'block'
      }) => ReturnType
    }
  }
}

const DrawingNode = Node.create({
  name: 'drawingBlock',
  // inline شد تا بشه بین دو تکه متن (داخل یک پاراگراف) قرارش داد
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      shapesJson: {
        default: '[]',
        parseHTML: (el) => el.getAttribute('data-shapes') || '[]',
        renderHTML: (attrs) => ({ 'data-shapes': attrs.shapesJson }),
      },
      background: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-bg'),
        renderHTML: (attrs) => (attrs.background ? { 'data-bg': attrs.background } : {}),
      },
      width: {
        default: 600,
        parseHTML: (el) => Number(el.getAttribute('data-width')) || 600,
        renderHTML: (attrs) => ({ 'data-width': attrs.width }),
      },
      height: {
        default: 400,
        parseHTML: (el) => Number(el.getAttribute('data-height')) || 400,
        renderHTML: (attrs) => ({ 'data-height': attrs.height }),
      },
      svgMarkup: {
        default: '',
        parseHTML: (el) => decodeURIComponent(el.getAttribute('data-svg-encoded') || ''),
        renderHTML: (attrs) => ({ 'data-svg-encoded': encodeURIComponent(attrs.svgMarkup || '') }),
      },
      // سایز نمایشی نهایی (می‌تواند با width/height بومِ طراحی متفاوت باشد)
      outputWidth: {
        default: 600,
        parseHTML: (el) => Number(el.getAttribute('data-output-width')) || 600,
        renderHTML: (attrs) => ({ 'data-output-width': attrs.outputWidth }),
      },
      outputHeight: {
        default: 400,
        parseHTML: (el) => Number(el.getAttribute('data-output-height')) || 400,
        renderHTML: (attrs) => ({ 'data-output-height': attrs.outputHeight }),
      },
      // 'inline' یعنی بین متن قرار می‌گیرد، 'block' یعنی خط مستقل
      mode: {
        default: 'block',
        parseHTML: (el) => (el.getAttribute('data-mode') as 'inline' | 'block') || 'block',
        renderHTML: (attrs) => ({ 'data-mode': attrs.mode }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="drawing-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'drawing-block' }),
      ['span', { style: 'display:contents' }, 0],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingComponent)
  },

  addCommands() {
    return {
      insertDrawing:
        (options) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { mode: 'block', outputWidth: options.width, outputHeight: options.height, ...options },
            })
            .run(),
    }
  },
})

export default DrawingNode