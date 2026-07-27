import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  html: string
}

const PreviewRenderer: React.FC<Props> = ({ html }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const mathSpans = container.querySelectorAll<HTMLElement>('span[data-type="math-inline"]')
    mathSpans.forEach((span) => {
      const latex = span.getAttribute('data-latex') || ''
      try {
        katex.render(latex, span, { throwOnError: false, displayMode: false })
      } catch {
        span.textContent = latex
      }
      span.setAttribute('dir', 'ltr')
      span.style.display = 'inline-block'
      span.style.unicodeBidi = 'isolate'
      span.style.margin = '0 3px'
    })
  }, [html])

  if (!html) {
    return (
      <div className="preview-box text-gray-400 text-sm flex items-center justify-center" dir="rtl">
        محتوایی برای پیش‌نمایش وجود ندارد
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="border border-dashed border-gray-300 rounded-lg p-4 min-h-[60px] text-gray-800 leading-loose"
      dir="rtl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default PreviewRenderer