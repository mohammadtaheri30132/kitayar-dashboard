import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import InlineImageComponent from '../components/InlineImageComponent'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineImage: {
      setInlineImage: (options: { src: string; alt?: string; width?: number; height?: number }) => ReturnType
    }
  }
}

const InlineImage = Image.extend({
  name: 'inlineImage',
  inline: true,
  group: 'inline',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 200,
        renderHTML: (attributes) => ({ style: `width:${attributes.width}px` }),
      },
      height: {
        default: null,
        renderHTML: (attributes) => (attributes.height ? { style: `height:${attributes.height}px` } : {}),
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineImageComponent)
  },

  addCommands() {
    return {
      setInlineImage:
        (options) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: options }).run(),
    }
  },
})

export default InlineImage