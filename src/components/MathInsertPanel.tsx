import React, { useEffect, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import 'mathlive'
import type { MathfieldElement } from 'mathlive'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>
    }
  }
}

interface Props {
  onInsert: (latex: string) => void
}

interface Symbol {
  label: string
  latex: string
}

interface SymbolGroup {
  title: string
  items: Symbol[]
}

// =====================================================================
// لیست کامل نمادها به تفکیک دسته.
// برای حذف یک نماد: فقط همون خطش رو کامنت کن (// اول خط بذار).
// برای حذف کل یک دسته: از آرایه‌ی SYMBOL_GROUPS پایین صفحه اون گروه رو حذف/کامنت کن.
// =====================================================================

const GROUP_BASIC: SymbolGroup = {
  title: 'پایه',
  items: [
    { label: 'x²', latex: 'x^{2}' },
    { label: 'x³', latex: 'x^{3}' },
    { label: 'xⁿ', latex: 'x^{n}' },
    { label: 'x₁', latex: 'x_{1}' },
    { label: 'xₙ', latex: 'x_{n}' },
    { label: 'x/y', latex: '\\frac{x}{y}' },
    { label: '¹/₂', latex: '\\frac{1}{2}' },
    { label: '√x', latex: '\\sqrt{x}' },
    { label: 'ⁿ√x', latex: '\\sqrt[n]{x}' },
    { label: '³√x', latex: '\\sqrt[3]{x}' },
    { label: '±', latex: '\\pm' },
    { label: '∓', latex: '\\mp' },
    { label: '×', latex: '\\times' },
    { label: '÷', latex: '\\div' },
    { label: '·', latex: '\\cdot' },
    { label: '%', latex: '\\%' },
    { label: '!', latex: '!' },
    { label: '|x|', latex: '\\left|x\\right|' },
    { label: '(x)', latex: '\\left(x\\right)' },
    { label: '[x]', latex: '\\left[x\\right]' },
  ],
}

const GROUP_COMPARISON: SymbolGroup = {
  title: 'مقایسه و تساوی',
  items: [
    { label: '=', latex: '=' },
    { label: '≠', latex: '\\neq' },
    { label: '<', latex: '<' },
    { label: '>', latex: '>' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' },
    { label: '≈', latex: '\\approx' },
    { label: '≡', latex: '\\equiv' },
    { label: '∝', latex: '\\propto' },
    { label: '≪', latex: '\\ll' },
    { label: '≫', latex: '\\gg' },
  ],
}

const GROUP_GREEK_LOWER: SymbolGroup = {
  title: 'حروف یونانی (کوچک)',
  items: [
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: 'γ', latex: '\\gamma' },
    { label: 'δ', latex: '\\delta' },
    { label: 'ε', latex: '\\epsilon' },
    { label: 'ζ', latex: '\\zeta' },
    { label: 'η', latex: '\\eta' },
    { label: 'θ', latex: '\\theta' },
    { label: 'λ', latex: '\\lambda' },
    { label: 'μ', latex: '\\mu' },
    { label: 'ν', latex: '\\nu' },
    { label: 'ξ', latex: '\\xi' },
    { label: 'π', latex: '\\pi' },
    { label: 'ρ', latex: '\\rho' },
    { label: 'σ', latex: '\\sigma' },
    { label: 'τ', latex: '\\tau' },
    { label: 'φ', latex: '\\phi' },
    { label: 'χ', latex: '\\chi' },
    { label: 'ψ', latex: '\\psi' },
    { label: 'ω', latex: '\\omega' },
  ],
}

const GROUP_GREEK_UPPER: SymbolGroup = {
  title: 'حروف یونانی (بزرگ)',
  items: [
    { label: 'Γ', latex: '\\Gamma' },
    { label: 'Δ', latex: '\\Delta' },
    { label: 'Θ', latex: '\\Theta' },
    { label: 'Λ', latex: '\\Lambda' },
    { label: 'Ξ', latex: '\\Xi' },
    { label: 'Π', latex: '\\Pi' },
    { label: 'Σ', latex: '\\Sigma' },
    { label: 'Φ', latex: '\\Phi' },
    { label: 'Ψ', latex: '\\Psi' },
    { label: 'Ω', latex: '\\Omega' },
  ],
}

const GROUP_CALCULUS: SymbolGroup = {
  title: 'حسابان (مشتق، انتگرال، حد)',
  items: [
    { label: '∑', latex: '\\sum_{i=1}^{n}' },
    { label: '∏', latex: '\\prod_{i=1}^{n}' },
    { label: '∫', latex: '\\int_{a}^{b}' },
    { label: '∬', latex: '\\iint' },
    { label: '∭', latex: '\\iiint' },
    { label: '∮', latex: '\\oint' },
    { label: 'lim', latex: '\\lim_{x \\to a}' },
    { label: 'd/dx', latex: '\\frac{d}{dx}' },
    { label: '∂/∂x', latex: '\\frac{\\partial}{\\partial x}' },
    { label: "f'", latex: "f'(x)" },
    { label: "f''", latex: "f''(x)" },
    { label: '∇', latex: '\\nabla' },
    { label: '∞', latex: '\\infty' },
  ],
}

const GROUP_TRIG: SymbolGroup = {
  title: 'مثلثات',
  items: [
    { label: 'sin', latex: '\\sin(x)' },
    { label: 'cos', latex: '\\cos(x)' },
    { label: 'tan', latex: '\\tan(x)' },
    { label: 'cot', latex: '\\cot(x)' },
    { label: 'sec', latex: '\\sec(x)' },
    { label: 'csc', latex: '\\csc(x)' },
    { label: 'sin⁻¹', latex: '\\sin^{-1}(x)' },
    { label: 'cos⁻¹', latex: '\\cos^{-1}(x)' },
    { label: 'tan⁻¹', latex: '\\tan^{-1}(x)' },
  ],
}

const GROUP_LOG_EXP: SymbolGroup = {
  title: 'لگاریتم و توان',
  items: [
    { label: 'log', latex: '\\log(x)' },
    { label: 'logₐ', latex: '\\log_{a}(x)' },
    { label: 'ln', latex: '\\ln(x)' },
    { label: 'eˣ', latex: 'e^{x}' },
    { label: 'aˣ', latex: 'a^{x}' },
  ],
}

const GROUP_SETS_LOGIC: SymbolGroup = {
  title: 'مجموعه‌ها و منطق',
  items: [
    { label: '∈', latex: '\\in' },
    { label: '∉', latex: '\\notin' },
    { label: '⊂', latex: '\\subset' },
    { label: '⊆', latex: '\\subseteq' },
    { label: '⊃', latex: '\\supset' },
    { label: '∪', latex: '\\cup' },
    { label: '∩', latex: '\\cap' },
    { label: '∅', latex: '\\emptyset' },
    { label: 'ℝ', latex: '\\mathbb{R}' },
    { label: 'ℕ', latex: '\\mathbb{N}' },
    { label: 'ℤ', latex: '\\mathbb{Z}' },
    { label: 'ℚ', latex: '\\mathbb{Q}' },
    { label: '∀', latex: '\\forall' },
    { label: '∃', latex: '\\exists' },
    { label: '¬', latex: '\\neg' },
    { label: '∧', latex: '\\land' },
    { label: '∨', latex: '\\lor' },
    { label: '⇒', latex: '\\Rightarrow' },
    { label: '⇔', latex: '\\Leftrightarrow' },
  ],
}

const GROUP_ARROWS: SymbolGroup = {
  title: 'فلش‌ها',
  items: [
    { label: '→', latex: '\\rightarrow' },
    { label: '←', latex: '\\leftarrow' },
    { label: '↔', latex: '\\leftrightarrow' },
    { label: '↑', latex: '\\uparrow' },
    { label: '↓', latex: '\\downarrow' },
  ],
}

const GROUP_MATRIX_VECTOR: SymbolGroup = {
  title: 'ماتریس و بردار',
  items: [
    { label: '2×2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: '3×3', latex: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
    { label: '|A|', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
    { label: 'vec', latex: '\\vec{v}' },
    { label: 'v̂', latex: '\\hat{v}' },
  ],
}

// =====================================================================
// آرایه‌ی نهایی گروه‌ها — دقیقاً همون ترتیبی که به‌صورت تب توی پنل نمایش داده می‌شن.
// برای حذف یک دسته‌ی کامل، خطش رو از این آرایه حذف/کامنت کن.
// =====================================================================
const SYMBOL_GROUPS: SymbolGroup[] = [
  GROUP_BASIC, // پایه: توان، جذر، کسر، قدرمطلق و...
  GROUP_COMPARISON, // مقایسه: =، ≠، ≤، ≥ و...
  GROUP_GREEK_LOWER, // حروف یونانی کوچک: α β γ ...
  GROUP_GREEK_UPPER, // حروف یونانی بزرگ: Σ Δ Ω ...
  GROUP_CALCULUS, // حسابان: مشتق، انتگرال، حد، سیگما
  GROUP_TRIG, // مثلثات: sin, cos, tan ...
  GROUP_LOG_EXP, // لگاریتم و توان نمایی
  GROUP_SETS_LOGIC, // مجموعه‌ها و منطق: ∈ ∪ ∩ ∀ ∃ ...
  GROUP_ARROWS, // فلش‌ها
  GROUP_MATRIX_VECTOR, // ماتریس و بردار
]

const MathInsertPanel: React.FC<Props> = ({ onInsert }) => {
  const mfRef = useRef<MathfieldElement>(null)
  const previewRef = useRef<HTMLSpanElement>(null)
  const [latex, setLatex] = useState('')
  const [activeGroup, setActiveGroup] = useState(0)

  useEffect(() => {
    const mf = mfRef.current
    if (!mf) return
    const handler = () => setLatex(mf.value)
    mf.addEventListener('input', handler)
    return () => mf.removeEventListener('input', handler)
  }, [])

  useEffect(() => {
    if (!previewRef.current) return
    try {
      katex.render(latex || '\\,', previewRef.current, { throwOnError: false, displayMode: false })
    } catch {
      if (previewRef.current) previewRef.current.textContent = latex
    }
  }, [latex])

  const handleQuickInsert = (snippet: string) => {
    const mf = mfRef.current
    if (!mf) return
    mf.insert(snippet)
    mf.focus()
    setLatex(mf.value)
  }

  const handleInsert = () => {
    if (!latex.trim()) return
    onInsert(latex)
    setLatex('')
    if (mfRef.current) mfRef.current.value = ''
  }

  const currentItems = SYMBOL_GROUPS[activeGroup]?.items || []

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3" dir="rtl">
      {/* تب دسته‌ها */}
      <div className="flex flex-wrap items-center gap-1 mb-2 pb-2 border-b border-gray-200">
        {SYMBOL_GROUPS.map((group, idx) => (
          <button
            key={group.title}
            type="button"
            onClick={() => setActiveGroup(idx)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap
              ${activeGroup === idx
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          >
            {group.title}
          </button>
        ))}
      </div>

      {/* نمادهای دسته‌ی فعال */}
      <div className="flex flex-wrap items-center gap-1 mb-2 max-h-32 overflow-y-auto">
        {currentItems.map((s) => (
          <button
            key={s.label + s.latex}
            type="button"
            onClick={() => handleQuickInsert(s.latex)}
            className="min-w-[36px] h-9 px-1.5 flex items-center justify-center rounded-lg bg-white border border-gray-200
                       text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all"
            title={s.latex}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 mb-2">
        <math-field
          ref={mfRef}
          className="w-full text-lg"
          style={{ direction: 'ltr', minHeight: '40px' }}
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 shrink-0">پیش‌نمایش:</span>
        <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg min-h-[36px] flex items-center" dir="ltr">
          <span ref={previewRef} />
        </div>
        <button
          type="button"
          onClick={handleInsert}
          disabled={!latex.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          درج فرمول
        </button>
      </div>
    </div>
  )
}

export default MathInsertPanel