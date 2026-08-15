import React from 'react'
import { FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, buildHeightOptions, MIN_BLOCK_HEIGHT, HEIGHT_ADJUSTABLE_TYPES } from '../../types/question-builder-additions'
import type { BuilderQuestion, BuilderSettings } from '../../types/question-builder'

interface Props {
  question: BuilderQuestion
  settings: BuilderSettings
  onUpdate: (patch: Partial<BuilderQuestion>) => void
  onSwap: () => void
  onClose: () => void
}

// پاپ‌آوری که با کلیک روی ⚙️ یک سوال باز می‌شود: تنظیمات اختصاصی همان سوال.
// همه‌چیز select است — بدون اسپینر/اسلایدر که در UI مشکل داشت.
const QuestionSettingsPopover: React.FC<Props> = ({ question, settings, onUpdate, onSwap, onClose }) => {
  const heightAdjustable = HEIGHT_ADJUSTABLE_TYPES.includes(question.type)
  const defaultHeight = settings.defaultHeightByType?.[question.type] ?? 70
  const currentHeight = question.blockHeight ?? defaultHeight
  const currentFontSize = question.fontSize ?? settings.baseFontSize ?? 13

  // گزینه‌های ارتفاع حول پیش‌فرضِ همین نوع سوال ساخته می‌شود؛
  // اگر مقدار فعلی داخل این بازه نبود (مثلاً قبلاً دستی ست شده)، خودش هم به لیست اضافه می‌شود تا select گم نشود.
  const heightOptions = React.useMemo(() => {
    const opts = buildHeightOptions(defaultHeight)
    if (!opts.includes(currentHeight)) {
      return Array.from(new Set([...opts, currentHeight])).sort((a, b) => a - b)
    }
    return opts
  }, [defaultHeight, currentHeight])

  const fontSizeOptions = React.useMemo(() => {
    if (!FONT_SIZE_OPTIONS.includes(currentFontSize)) {
      return Array.from(new Set([...FONT_SIZE_OPTIONS, currentFontSize])).sort((a, b) => a - b)
    }
    return FONT_SIZE_OPTIONS
  }, [currentFontSize])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[3300] print:hidden" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-5 w-[95%] max-w-sm shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-gray-800">⚙️ تنظیمات این سوال</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          {/* فونت فمیلی */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">فونت</label>
            <select
              value={question.fontFamily || ''}
              onChange={e => onUpdate({ fontFamily: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">پیش‌فرض برگه</option>
              {FONT_FAMILY_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* سایز فونت */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">سایز فونت</label>
            <select
              value={currentFontSize}
              onChange={e => onUpdate({ fontSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              {fontSizeOptions.map(size => (
                <option key={size} value={size}>{size} px</option>
              ))}
            </select>
          </div>

          {/* ارتفاع بلوک سوال — فقط برای تشریحی و کوتاه‌پاسخ؛ بقیه انواع همیشه به‌اندازه محتوای واقعی‌شان هستند */}
          {heightAdjustable && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                ارتفاع بلوک سوال (px)
              </label>
              <select
                value={currentHeight}
                onChange={e => onUpdate({ blockHeight: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {heightOptions.map(h => (
                  <option key={h} value={h}>
                    {h} px{h === defaultHeight ? ' (پیش‌فرض)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                فقط ارتفاع بلوک این سوال تغییر می‌کند — سایز متن دست‌نخورده می‌ماند. حداقل {MIN_BLOCK_HEIGHT}px.
              </p>
            </div>
          )}

          {/* خط‌چین جای خالی */}
          {question.type === 'جاخالی' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!question.noDashLine}
                onChange={e => onUpdate({ noDashLine: !e.target.checked })}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-700">نمایش خط‌چین برای جای خالی</span>
            </label>
          )}

          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={onSwap}
              className="px-3 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              🔁 جایگزینی این سوال
            </button>
            <button
              onClick={() => onUpdate({ fontFamily: undefined, fontSize: undefined, blockHeight: undefined })}
              className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              بازنشانی
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionSettingsPopover