import { useState, useRef, useEffect, useCallback } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  icon?: string
}

const SelectField = ({ label, options, value, onChange, placeholder = 'انتخاب کنید...', disabled = false, icon }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  // محاسبه موقعیت dropdown
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // آپدیت موقعیت dropdown موقع باز شدن و اسکرول
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true)
        window.removeEventListener('resize', updateDropdownPosition)
      }
    }
  }, [isOpen, updateDropdownPosition])

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        updateDropdownPosition()
      }
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-300 mb-1.5">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-right rounded-xl border transition-all
          ${disabled
            ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
            : isOpen
              ? 'bg-slate-900 border-primary-500 ring-4 ring-primary-500/15'
              : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600 hover:shadow-sm'
          }`}
      >
        {icon && <span className="text-lg shrink-0">{icon}</span>}
        <span className={`flex-1 truncate ${selectedOption ? 'text-slate-100 font-medium' : 'text-slate-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* اوورلی شفاف برای گرفتن کلیک بیرون */}
      {isOpen && !disabled && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* لیست dropdown با position fixed */}
      {isOpen && !disabled && (
        <div
          style={dropdownStyle}
          className="bg-[#0F172A] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">موردی یافت نشد</div>
            )}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-right transition-colors
                  ${option.value === value
                    ? 'bg-primary-500/20 text-primary-300 font-medium'
                    : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
              >
                {option.value === value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500 shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className={option.value !== value ? 'mr-7' : ''}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectField