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

  return <div ref={containerRef} className="preview-box" dir="rtl" dangerouslySetInnerHTML={{ __html: html }} />
}

export default PreviewRenderer