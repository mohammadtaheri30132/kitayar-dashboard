import React, { useState } from 'react'
import type { BuilderHeader, CustomHeaderConfig, CustomHeaderRound } from '../../types/question-builder'
import { FOOTER_NOTE_PRESETS } from '../../types/question-builder-additions'

interface Props {
  onSave: (header: BuilderHeader) => void
  onClose: () => void
}

interface ChecklistItem {
  id: string
  text: string
  enabled: boolean
}

interface RoundState extends CustomHeaderRound {
  enabled: boolean
}

const uid = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_CENTER: ChecklistItem[] = [
  { id: uid(), text: 'باسمه تعالی', enabled: true },
  { id: uid(), text: 'اداره کل آموزش و پرورش استان ....... - اداره آموزش و پرورش شهرستان/منطقه .......', enabled: true },
  { id: uid(), text: 'دبیرستان/دبستان/آموزشگاه .......', enabled: true },
  { id: uid(), text: 'دوره اول متوسطه - پایه هفتم', enabled: true },
  { id: uid(), text: 'آزمون ریاضی - نوبت هماهنگ', enabled: true },
  { id: uid(), text: 'دی‌ماه ۱۴۰۳ - نوبت صبح', enabled: true },
]

const DEFAULT_STUDENT: ChecklistItem[] = [
  { id: uid(), text: 'نام و نام خانوادگی:', enabled: true },
  { id: uid(), text: 'نام پدر:', enabled: true },
  { id: uid(), text: 'شماره داوطلب / کد دانش‌آموزی:', enabled: true },
  { id: uid(), text: 'شماره کلاس / رشته تحصیلی:', enabled: true },
]

const DEFAULT_EXAM: ChecklistItem[] = [
  { id: uid(), text: 'تاریخ برگزاری امتحان:', enabled: true },
  { id: uid(), text: 'ساعت شروع امتحان:', enabled: true },
  { id: uid(), text: 'مدت زمان پاسخ‌گویی (دقیقه):', enabled: true },
  { id: uid(), text: 'تعداد کل صفحات: — شماره صفحه: —', enabled: true },
  { id: uid(), text: 'تعداد کل سؤالات:', enabled: true },
  { id: uid(), text: 'نام دبیر / طراح سؤال:', enabled: true },
]

const DEFAULT_ROUNDS: RoundState[] = [
  {
    id: uid(), enabled: true,
    label: 'نوبت اول (تصحیح اول)',
    signLabel: 'نام و امضای مصحح/دبیر:',
    dateLabel: 'تاریخ:',
    scoreNumericLabel: 'نمره به عدد:',
    scoreWrittenLabel: 'نمره به حروف:',
  },
  {
    id: uid(), enabled: true,
    label: 'نوبت تجدیدنظر (تصحیح دوم)',
    signLabel: 'نام و امضای مصحح/دبیر:',
    dateLabel: 'تاریخ:',
    scoreNumericLabel: 'نمره به عدد:',
    scoreWrittenLabel: 'نمره به حروف:',
  },
]

const CustomHeaderModal: React.FC<Props> = ({ onSave, onClose }) => {
  const [headerName, setHeaderName] = useState('هدر کاستوم')
  const [center, setCenter] = useState<ChecklistItem[]>(DEFAULT_CENTER)
  const [student, setStudent] = useState<ChecklistItem[]>(DEFAULT_STUDENT)
  const [exam, setExam] = useState<ChecklistItem[]>(DEFAULT_EXAM)
  const [stampEnabled, setStampEnabled] = useState(true)
  const [stampText, setStampText] = useState('محل مهر آموزشگاه')
  const [rounds, setRounds] = useState<RoundState[]>(DEFAULT_ROUNDS)
  const [footerEnabled, setFooterEnabled] = useState(true)
  const [footerText, setFooterText] = useState(FOOTER_NOTE_PRESETS[0])

  const updateItem = (
    list: ChecklistItem[],
    setList: (v: ChecklistItem[]) => void,
    id: string,
    patch: Partial<ChecklistItem>,
  ) => setList(list.map(i => (i.id === id ? { ...i, ...patch } : i)))

  const removeItem = (list: ChecklistItem[], setList: (v: ChecklistItem[]) => void, id: string) =>
    setList(list.filter(i => i.id !== id))

  const addItem = (setList: (updater: (prev: ChecklistItem[]) => ChecklistItem[]) => void) =>
    setList(prev => [...prev, { id: uid(), text: '', enabled: true }])

  const renderSection = (
    title: string,
    list: ChecklistItem[],
    setList: (v: ChecklistItem[]) => void,
  ) => (
    <div className="mb-5">
      <h4 className="text-sm font-bold text-gray-700 mb-2">{title}</h4>
      <div className="space-y-2">
        {list.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={e => updateItem(list, setList, item.id, { enabled: e.target.checked })}
              className="w-4 h-4 accent-primary-500 shrink-0"
            />
            <input
              value={item.text}
              onChange={e => updateItem(list, setList, item.id, { text: e.target.value })}
              placeholder="متن این مورد..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
              disabled={!item.enabled}
            />
            <button
              type="button"
              onClick={() => removeItem(list, setList, item.id)}
              className="text-red-400 hover:text-red-600 text-xs shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addItem(setList as any)}
        className="text-xs text-primary-600 hover:underline mt-2"
      >
        + افزودن فیلد
      </button>
    </div>
  )

  const updateRound = (id: string, patch: Partial<RoundState>) =>
    setRounds(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))

  const handleSubmit = () => {
    const config: CustomHeaderConfig = {
      centerLines: center.filter(i => i.enabled && i.text.trim()).map(i => i.text),
      studentItems: student.filter(i => i.enabled && i.text.trim()).map(i => ({ id: i.id, text: i.text })),
      examItems: exam.filter(i => i.enabled && i.text.trim()).map(i => ({ id: i.id, text: i.text })),
      hasStamp: stampEnabled,
      stampText,
      rounds: rounds
        .filter(r => r.enabled)
        .map(r => ({
          id: r.id,
          label: r.label,
          signLabel: r.signLabel,
          dateLabel: r.dateLabel,
          scoreNumericLabel: r.scoreNumericLabel,
          scoreWrittenLabel: r.scoreWrittenLabel,
        })),
      footerText: footerEnabled ? footerText : '',
    }

    const header: BuilderHeader = {
      id: `header-${Date.now()}`,
      title: headerName.trim() || 'هدر کاستوم',
      fields: [],
      layout: 'custom',
      custom: config,
    }

    onSave(header)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3300] p-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        dir="rtl"
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-800">🧩 ساخت هدر کاستوم</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5">
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 mb-1">نام این هدر (برای شناسایی در لیست هدرها)</label>
            <input
              value={headerName}
              onChange={e => setHeaderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="مثلاً: هدر آزمون نوبت اول"
            />
          </div>

          {renderSection('۱. اطلاعات سازمانی و آزمون (مرکز سربرگ)', center, setCenter)}
          {renderSection('۲. مشخصات دانش‌آموز (ستون راست)', student, setStudent)}
          {renderSection('۳. مشخصات اجرایی و فنی آزمون (ستون چپ)', exam, setExam)}

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={stampEnabled}
                onChange={e => setStampEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary-500"
              />
              <span className="text-sm font-bold text-gray-700">کادر اختصاصی مهر مدرسه / آموزشگاه</span>
            </div>
            <input
              value={stampText}
              onChange={e => setStampText(e.target.value)}
              disabled={!stampEnabled}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
            />
          </div>

          <div className="mb-5">
            <h4 className="text-sm font-bold text-gray-700 mb-2">۴. جدول ثبت نمرات و بازبینی</h4>
            <div className="space-y-3">
              {rounds.map(r => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={e => updateRound(r.id, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-primary-500 shrink-0"
                    />
                    <input
                      value={r.label}
                      onChange={e => updateRound(r.id, { label: e.target.value })}
                      disabled={!r.enabled}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold disabled:bg-gray-50"
                    />
                  </div>
                  {r.enabled && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-6">
                      <input value={r.signLabel} onChange={e => updateRound(r.id, { signLabel: e.target.value })} className="px-2 py-1 border border-gray-200 rounded text-xs" placeholder="برچسب نام و امضا" />
                      <input value={r.dateLabel} onChange={e => updateRound(r.id, { dateLabel: e.target.value })} className="px-2 py-1 border border-gray-200 rounded text-xs" placeholder="برچسب تاریخ" />
                      <input value={r.scoreNumericLabel} onChange={e => updateRound(r.id, { scoreNumericLabel: e.target.value })} className="px-2 py-1 border border-gray-200 rounded text-xs" placeholder="برچسب نمره به عدد" />
                      <input value={r.scoreWrittenLabel} onChange={e => updateRound(r.id, { scoreWrittenLabel: e.target.value })} className="px-2 py-1 border border-gray-200 rounded text-xs" placeholder="برچسب نمره به حروف" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRounds(prev => [...prev, {
                id: uid(), enabled: true, label: 'نوبت جدید',
                signLabel: 'نام و امضای مصحح/دبیر:', dateLabel: 'تاریخ:',
                scoreNumericLabel: 'نمره به عدد:', scoreWrittenLabel: 'نمره به حروف:',
              }])}
              className="text-xs text-primary-600 hover:underline mt-2"
            >
              + افزودن نوبت تصحیح
            </button>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={footerEnabled}
                onChange={e => setFooterEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary-500"
              />
              <span className="text-sm font-bold text-gray-700">پاورقی هدر (حدیث / پیام تربیتی / نکات مهم آزمون)</span>
            </div>
            {footerEnabled && (
              <div className="space-y-2">
                <select
                  onChange={e => setFooterText(e.target.value)}
                  value={FOOTER_NOTE_PRESETS.includes(footerText) ? footerText : ''}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  {FOOTER_NOTE_PRESETS.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                  <option value="">— متن دلخواه —</option>
                </select>
                <textarea
                  value={footerText}
                  onChange={e => setFooterText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">انصراف</button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">ثبت و افزودن هدر</button>
        </div>
      </div>
    </div>
  )
}

export default CustomHeaderModal