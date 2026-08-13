import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ResizableImageComponent from '../components/ResizableImageComponent'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: {
        src: string
        alt?: string
        width?: number
        height?: number
        align?: 'left' | 'center' | 'right'
        mode?: 'inline' | 'block'
      }) => ReturnType
    }
  }
}

type ImgAttrs = {
  width: number
  height: number | null
  align: 'left' | 'center' | 'right'
  mode: 'inline' | 'block'
}

// یک‌جا محاسبه می‌شه تا استایل تداخل/تکرار نداشته باشه
function buildImageStyle(attrs: ImgAttrs): string {
  const { width, height, align, mode } = attrs
  const heightRule = height ? `height:${height}px;` : 'height:auto;'

  if (mode === 'inline') {
    // درون‌خط: کنار متن قرار می‌گیره، وسط‌چین عمودی با خط متن
    return `width:${width}px;${heightRule}display:inline-block;vertical-align:middle;max-width:100%;`
  }

  const margin =
    align === 'left'
      ? 'margin-inline-start:0;margin-inline-end:auto;'
      : align === 'right'
      ? 'margin-inline-start:auto;margin-inline-end:0;'
      : 'margin-inline:auto;'

  return `width:${width}px;${heightRule}display:block;${margin}max-width:100%;`
}

const ResizableImage = Image.extend({
  name: 'resizableImage',
  inline: true,
  group: 'inline',
  selectable: true,

  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),

      width: {
        default: 300,
        parseHTML: (el) => {
          const w = el.style.width || el.getAttribute('width')
          return w ? parseInt(w, 10) : 300
        },
        renderHTML: (attributes) => ({
          style: buildImageStyle(attributes as ImgAttrs),
          'data-align': attributes.align,
          'data-mode': attributes.mode,
        }),
      },

      height: {
        default: null,
        parseHTML: (el) => {
          const h = el.style.height || el.getAttribute('height')
          return h ? parseInt(h, 10) : null
        },
        // استایل توسط width محاسبه می‌شه، اینجا چیزی اضافه نمی‌کنیم
        renderHTML: () => ({}),
      },

      align: {
        default: 'center',
        parseHTML: (el) => (el.getAttribute('data-align') as ImgAttrs['align']) || 'center',
        renderHTML: () => ({}),
      },

      mode: {
        default: 'block',
        parseHTML: (el) => (el.getAttribute('data-mode') as ImgAttrs['mode']) || 'block',
        renderHTML: () => ({}),
      },

      alt: {
        default: null,
        parseHTML: (el) => el.getAttribute('alt'),
        renderHTML: (attributes) => (attributes.alt ? { alt: attributes.alt } : {}),
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
          chain()
            .insertContent({
              type: this.name,
              attrs: {
                width: 300,
                height: null,
                align: 'center',
                mode: 'block',
                ...options,
              },
            })
            .run(),
    }
  },

  // این بخش رفتار Backspace رو قطعی می‌کنه، بدون وابستگی به اینکه کرسر
  // دقیقاً با کلیک ماوس کجای صفحه قرار گرفته (که در گره‌های atom همیشه دقیق نیست).
  // addKeyboardShortcuts() {
  //   return {
  //     Backspace: () => {
  //       const { state } = this.editor
  //       const { selection } = state
  //       if (!selection.empty) return false

  //       const { $from } = selection
  //       const nodeBefore = $from.nodeBefore
  //       if (!nodeBefore || nodeBefore.type.name !== this.name) return false

  //       const nodePos = $from.pos - nodeBefore.nodeSize

  //       // اگه عکس روی «بلوک» (سطر جدا) بود: اولین Backspace فقط برش می‌گردونه
  //       // به حالت inline (دقیقاً همون «کشیدنش از سطر دوم به سطر اول»)، پاکش نمی‌کنه.
  //       if (nodeBefore.attrs.mode === 'block') {
  //         return this.editor
  //           .chain()
  //           .command(({ tr }) => {
  //             tr.setNodeMarkup(nodePos, undefined, { ...nodeBefore.attrs, mode: 'inline' })
  //             return true
  //           })
  //           .setTextSelection(nodePos + nodeBefore.nodeSize)
  //           .run()
  //       }

  //       // اگه از قبل inline بود: طبق رفتار استاندارد اتم‌ها، اول انتخابش کن
  //       // (Backspace بعدی واقعاً حذفش می‌کنه) به‌جای حذف ناگهانی و بی‌هشدار.
  //       return this.editor.chain().setNodeSelection(nodePos).run()
  //     },
  //   }
  // },
})

export default ResizableImage