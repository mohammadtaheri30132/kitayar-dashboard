import React, { useState } from 'react'
import type { BuilderSettings } from '../../types/question-builder'
import { OPTION_LABEL_FORMATS, getOptionLabel } from '../../types/question-builder'
import {
  FONT_FAMILY_OPTIONS,
  DEFAULT_SCORE_BY_TYPE,
  DEFAULT_HEIGHT_BY_TYPE,
  COLUMN_WIDTH_PRESET_PX,
  MIN_BLOCK_HEIGHT,
  HEIGHT_ADJUSTABLE_TYPES,
  type ColumnWidthSetting,
} from '../../types/question-builder-additions'

interface Props {
  settings: BuilderSettings
  onSave: (settings: BuilderSettings) => void
  onApplyScoreToAll: () => void
  onClose: () => void
}

const TYPE_LABELS_MAP: Record<string, string> = {
  'تستی': 'تستی',
  'جاخالی': 'جای خالی',
  'صحیح-غلط': 'صحیح/غلط',
  'کوتاه-پاسخ': 'کوتاه پاسخ',
  'گسترده-پاسخ': 'تشریحی',
  'جورکردنی': 'جورکردنی',
  'انتخاب-کلمه': 'انتخاب کلمه',
}

const ColumnWidthPicker: React.FC<{
  label: string
  value: ColumnWidthSetting
  onChange: (v: ColumnWidthSetting) => void
}> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    <div className="flex items-center gap-2 flex-wrap">
      {(['xs', 'sm', 'standard'] as const).map(preset => (
        <button
          key={preset}
          onClick={() => onChange({ preset })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            value.preset === preset ? 'bg-primary-500 text-white border-primary-500' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {preset === 'xs' ? `خیلی کوچک (${COLUMN_WIDTH_PRESET_PX.xs}px)` : preset === 'sm' ? `کوچک (${COLUMN_WIDTH_PRESET_PX.sm}px)` : `استاندارد (${COLUMN_WIDTH_PRESET_PX.standard}px)`}
        </button>
      ))}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange({ preset: 'custom', customPx: value.customPx || 44 })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            value.preset === 'custom' ? 'bg-primary-500 text-white border-primary-500' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          دلخواه
        </button>
        {value.preset === 'custom' && (
          <input
            type="number"
            min={16}
            max={200}
            value={value.customPx ?? 44}
            onChange={e => onChange({ preset: 'custom', customPx: Number(e.target.value) })}
            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs"
          />
        )}
      </div>
    </div>
  </div>
)

const BuilderSettingsModal: React.FC<Props> = ({ settings, onSave, onApplyScoreToAll, onClose }) => {
  const [localSettings, setLocalSettings] = useState<BuilderSettings>(settings)

  const update = <K extends keyof BuilderSettings>(key: K, value: BuilderSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateScoreForType = (type: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      defaultScoreByType: { ...(prev.defaultScoreByType || DEFAULT_SCORE_BY_TYPE), [type]: value },
    }))
  }

  const updateHeightForType = (type: string, value: number) => {
    const clamped = Math.max(MIN_BLOCK_HEIGHT, Math.round(value) || MIN_BLOCK_HEIGHT)
    setLocalSettings(prev => ({
      ...prev,
      defaultHeightByType: { ...(prev.defaultHeightByType || DEFAULT_HEIGHT_BY_TYPE), [type]: clamped },
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">⚙️ تنظیمات سوال ساز</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* فونت‌ها به تفکیک بخش */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">🔠 فونت‌ها به تفکیک بخش</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">فونت سوالات (پیش‌فرض همه سوالات)</label>
              <select
                value={localSettings.questionsFontFamily}
                onChange={e => update('questionsFontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {FONT_FAMILY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">فونت جدول هدر برگه</label>
              <select
                value={localSettings.headerFontFamily}
                onChange={e => update('headerFontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {FONT_FAMILY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">فونت عنوان بخش‌بندی سوالات</label>
              <select
                value={localSettings.groupTitleFontFamily}
                onChange={e => update('groupTitleFontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {FONT_FAMILY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">سایز پایه فونت سوالات (px)</label>
              <input
                type="number"
                min={10}
                max={20}
                value={localSettings.baseFontSize ?? 13}
                onChange={e => update('baseFontSize', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">هر سوال هم می‌تواند از داخل تنظیمات خودش فونت اختصاصی جدا از این پیش‌فرض داشته باشد.</p>
        </div>

        {/* بارم پیش‌فرض هر نوع سوال */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">🎯 بارم پیش‌فرض هر نوع سوال</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.keys(TYPE_LABELS_MAP).map(type => (
              <div key={type}>
                <label className="block text-xs text-gray-600 mb-1">{TYPE_LABELS_MAP[type]}</label>
                <input
                  type="text"
                  value={localSettings.defaultScoreByType?.[type] ?? DEFAULT_SCORE_BY_TYPE[type] ?? ''}
                  onChange={e => updateScoreForType(type, e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => { onSave(localSettings); onApplyScoreToAll() }}
            className="mt-3 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-100"
          >
            ↺ اعمال این بارم‌ها روی همه سوالات فعلی
          </button>
        </div>

        {/* عرض ستون‌های ردیف و بارم */}
        <div className="mb-6 space-y-4">
          <h4 className="text-sm font-bold text-gray-700">📏 عرض ستون‌ها</h4>
          <ColumnWidthPicker label="ستون «ردیف»" value={localSettings.rowColumnWidth} onChange={v => update('rowColumnWidth', v)} />
          <ColumnWidthPicker label="ستون «بارم»" value={localSettings.scoreColumnWidth} onChange={v => update('scoreColumnWidth', v)} />
        </div>

        {/* ارتفاع پیش‌فرض هر نوع سوال */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📏 ارتفاع پیش‌فرض بلوک (px)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HEIGHT_ADJUSTABLE_TYPES.map(type => (
              <div key={type}>
                <label className="block text-xs text-gray-600 mb-1">{TYPE_LABELS_MAP[type]}</label>
                <input
                  type="number"
                  min={MIN_BLOCK_HEIGHT}
                  value={localSettings.defaultHeightByType?.[type] ?? DEFAULT_HEIGHT_BY_TYPE[type] ?? MIN_BLOCK_HEIGHT}
                  onChange={e => updateHeightForType(type, Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ارتفاع فقط برای تشریحی و کوتاه‌پاسخ قابل تنظیم است — بقیه انواع سوال همیشه دقیقاً به‌اندازه محتوای واقعی‌شان رندر می‌شوند.
          </p>
        </div>

        {/* پاسخ تشریحی و کوتاه‌پاسخ */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">✍️ خط‌چین پاسخ</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.essayAnswerLines}
                onChange={e => update('essayAnswerLines', e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-700">نمایش خط‌چین برای پاسخ سوالات تشریحی</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.shortAnswerLine}
                onChange={e => update('shortAnswerLine', e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-700">نمایش خط‌چین برای پاسخ سوالات کوتاه‌پاسخ</span>
            </label>
          </div>
        </div>

        {/* حالت نمایش ستون‌ها و جداکننده‌ها — یکجا، بدون تداخل با بخش دیگری */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">🧱 ستون‌ها و خط جداکننده</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.showQuestionNumber}
                onChange={e => update('showQuestionNumber', e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-700">نمایش ستون «ردیف»</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.showScore}
                onChange={e => update('showScore', e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-700">نمایش ستون «بارم»</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.questionDivider}
                onChange={e => update('questionDivider', e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="text-sm text-gray-700">نمایش خط جداکننده بین هر سوال</span>
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            هر سه مستقل از هم قابل تنظیم‌اند — مثلاً می‌توانی ردیف را خاموش کنی ولی بارم روشن بماند، یا برعکس.
            اگر ستون «ردیف» خاموش باشد، شماره سوال خودکار داخل متن سوال نوشته می‌شود.
            خط جداکننده بین بخش‌ها (گروه‌ها) همیشه و مستقل از این تنظیم نمایش داده می‌شود.
          </p>
        </div>

        {/* فرمت گزینه‌ها */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">🔤 فرمت گزینه‌های چهارگزینه‌ای</h4>
          <div className="flex flex-wrap gap-2">
            {OPTION_LABEL_FORMATS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update('optionLabelFormat', opt.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  localSettings.optionLabelFormat === opt.value
                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm">
            <p className="text-xs text-gray-500 mb-2">پیش‌نمایش:</p>
            <div className="flex gap-6 flex-wrap">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className="text-xs text-gray-700">
                  <span className="font-bold">{getOptionLabel(i, localSettings.optionLabelFormat)})</span> گزینه {i + 1}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* چیدمان گزینه‌ها */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📐 چیدمان گزینه‌های تستی</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => update('optionsLayout', 'inline')}
              className={`p-3 rounded-xl text-right transition-all border ${localSettings.optionsLayout === 'inline' ? 'bg-primary-50 border-primary-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <p className="text-sm font-medium text-gray-800">➖ خطی (استاندارد برگه امتحان)</p>
              <p className="text-xs text-gray-500 mt-0.5">همه گزینه‌ها پشت‌سرهم روی یک خط، مثل نمونه‌های واقعی</p>
            </button>
            <button
              onClick={() => update('optionsLayout', 'grid')}
              className={`p-3 rounded-xl text-right transition-all border ${localSettings.optionsLayout === 'grid' ? 'bg-primary-50 border-primary-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <p className="text-sm font-medium text-gray-800">▦ گرید دو ستونه</p>
              <p className="text-xs text-gray-500 mt-0.5">هر گزینه در یک خط جدا، دو ستون کنار هم</p>
            </button>
          </div>
        </div>

        {/* حالت نمایش */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📦 حالت نمایش سوالات</h4>
          <div className="flex gap-2">
            <button
              onClick={() => update('groupingMode', 'grouped')}
              className={`flex-1 p-3 rounded-xl text-center transition-all border ${localSettings.groupingMode === 'grouped' ? 'bg-primary-50 border-primary-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <p className="text-sm font-medium text-gray-800">📁 گروهی</p>
              <p className="text-xs text-gray-500 mt-0.5">سوالات هم‌نوع زیر یک عنوان بخش قرار می‌گیرند</p>
            </button>
            <button
              onClick={() => update('groupingMode', 'individual')}
              className={`flex-1 p-3 rounded-xl text-center transition-all border ${localSettings.groupingMode === 'individual' ? 'bg-primary-50 border-primary-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <p className="text-sm font-medium text-gray-800">📄 پشت‌سرهم</p>
              <p className="text-xs text-gray-500 mt-0.5">همه سوالات با شماره پیوسته، بدون بخش‌بندی</p>
            </button>
          </div>
        </div>

        {/* سربرگ و پابرگ */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📝 سربرگ و پابرگ</h4>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={localSettings.showBismillah} onChange={e => update('showBismillah', e.target.checked)} className="w-4 h-4 rounded accent-primary-500" />
            <span className="text-sm text-gray-700">نمایش «بسمه تعالی» در بالای صفحه</span>
          </label>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">متن پایانی برگه (خالی بگذارید تا نمایش داده نشود)</label>
            <input
              value={localSettings.footerText}
              onChange={e => update('footerText', e.target.value)}
              placeholder="موفق و سرفراز باشید"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">انصراف</button>
          <button onClick={() => { onSave(localSettings); onClose() }} className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600">💾 ذخیره</button>
        </div>
      </div>
    </div>
  )
}

export default BuilderSettingsModal