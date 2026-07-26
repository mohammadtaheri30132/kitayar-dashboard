import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ResizableImageComponent from '../components/ResizableImageComponent'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: { src: string; alt?: string; width?: number; height?: number; align?: string }) => ReturnType
    }
  }
}

const ResizableImage = Image.extend({
  name: 'resizableImage',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 300,
        renderHTML: (attributes) => ({ style: `width:${attributes.width}px` }),
      },
      height: {
        default: null,
        renderHTML: (attributes) => (attributes.height ? { style: `height:${attributes.height}px` } : {}),
      },
      align: {
        default: 'center',
        renderHTML: (attributes) => {
          const margin =
            attributes.align === 'left'
              ? 'margin-inline-end:auto'
              : attributes.align === 'right'
              ? 'margin-inline-start:auto'
              : 'margin-inline:auto'
          const heightRule = attributes.height ? `height:${attributes.height}px;` : 'height:auto;'
          return { style: `width:${attributes.width}px;${heightRule}display:block;${margin}` }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: options }).run(),
    }
  },
})

export default ResizableImage