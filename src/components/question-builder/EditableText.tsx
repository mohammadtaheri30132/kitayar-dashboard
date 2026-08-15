import React, { useRef, useEffect } from 'react'

interface Props {
  html: string
  onChange: (html: string) => void
  className?: string
  placeholder?: string
  as?: 'span' | 'div' | 'p'
  style?: React.CSSProperties
}

// یک المان قابل‌ادیت درون‌خطی برای پیش‌نمایش A4.
// کاربر مستقیماً روی برگه کلیک می‌کند و متن را تغییر می‌دهد؛
// فقط هنگام blur تغییرات به state اصلی می‌رود (برای جلوگیری از rerender در حین تایپ).
const EditableText: React.FC<Props> = ({ html, onChange, className = '', placeholder, as = 'span', style }) => {
  const ref = useRef<HTMLElement | null>(null)
  const Tag = as as any

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html || ''
    }
    // فقط موقع مقداردهی اولیه یا تغییر از بیرون sync می‌شود، نه هر رندر
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html])

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onBlur={() => onChange(ref.current?.innerHTML || '')}
      data-placeholder={placeholder}
      className={`outline-none focus:bg-yellow-50 focus:ring-1 focus:ring-primary-300 rounded px-0.5 print:focus:bg-transparent print:focus:ring-0 ${className}`}
      style={style}
    />
  )
}

export default EditableText