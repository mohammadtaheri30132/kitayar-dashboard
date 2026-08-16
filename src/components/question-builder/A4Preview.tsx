import React, { useState } from 'react'
import type {
  BuilderQuestion, BuilderHeader, BuilderSettings,
  HeaderStandard1Fields, HeaderStandard2Fields, HeaderStandard4Fields,
  CustomHeaderConfig,
} from '../../types/question-builder'
import { getOptionLabel, toPersianDigits } from '../../types/question-builder'
import {
  resolveColumnWidth,
  GROUP_INSTRUCTION_SAMPLES,
  DEFAULT_HEIGHT_BY_TYPE,
  HEIGHT_ADJUSTABLE_TYPES,
} from '../../types/question-builder-additions'
import QuestionPreviewModal from './QuestionPreviewModal'
import QuestionSettingsPopover from './QuestionSettingsPopover'
import GroupInstructionModal from './GroupInstructionModal'
import EditableText from './EditableText'

interface Props {
  headers: BuilderHeader[]
  selectedHeaderId: string | null
  questions: BuilderQuestion[]
  settings: BuilderSettings
  onRemoveQuestion: (id: string) => void
  onMoveQuestion: (id: string, direction: 'up' | 'down') => void
  onUpdateScore: (id: string, score: string) => void
  onUpdateQuestion: (id: string, patch: Partial<BuilderQuestion>) => void
  onSwapQuestion: (id: string) => void
  onUpdateHeaderField: (headerId: string, kind: 'title' | 'subtitle' | 'footer', value: string) => void
  onUpdateHeaderCell: (headerId: string, fieldIndex: number, value: string) => void
  onUpdateHeaderStandard1: (headerId: string, field: keyof HeaderStandard1Fields, value: string) => void
  onUpdateHeaderStandard2: (headerId: string, field: keyof HeaderStandard2Fields, value: string) => void
  onUpdateHeaderStandard4: (headerId: string, field: keyof HeaderStandard4Fields, value: string) => void
  onUpdateHeaderCustom: (headerId: string, updater: (cfg: CustomHeaderConfig) => CustomHeaderConfig) => void
  onUpdateGroupInstruction: (type: string, text: string) => void
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

const stripHtml = (html: string) => {
  if (!html) return ''
  const d = document.createElement('div')
  d.innerHTML = html
  return d.textContent || ''
}

const A4Preview: React.FC<Props> = ({
  headers,
  selectedHeaderId,
  questions,
  settings,
  onRemoveQuestion,
  onMoveQuestion,
  onUpdateScore,
  onUpdateQuestion,
  onSwapQuestion,
  onUpdateHeaderField,
  onUpdateHeaderCell,
  onUpdateHeaderStandard1,
  onUpdateHeaderStandard2,
  onUpdateHeaderStandard4,
  onUpdateHeaderCustom,
  onUpdateGroupInstruction,
}) => {
  const selectedHeader = headers.find(h => h.id === selectedHeaderId)
  const [previewQuestion, setPreviewQuestion] = useState<BuilderQuestion | null>(null)
  const [settingsQuestionId, setSettingsQuestionId] = useState<string | null>(null)
  const settingsQuestion = settingsQuestionId ? questions.find(q => q._id === settingsQuestionId) ?? null : null
  const [editingGroupType, setEditingGroupType] = useState<string | null>(null)

  const rowColW = resolveColumnWidth(settings.rowColumnWidth, 40)
  const scoreColW = resolveColumnWidth(settings.scoreColumnWidth, 64)

  const showRowColumn = settings.showQuestionNumber
  const showScoreColumn = settings.showScore
  const showInlineNumber = !showRowColumn
  const rowDividerOn = settings.questionDivider !== false

  const groupedQuestions = React.useMemo(() => {
    if (settings.groupingMode !== 'grouped') return null
    const groups: Record<string, BuilderQuestion[]> = {}
    questions.forEach(q => {
      if (!groups[q.type]) groups[q.type] = []
      groups[q.type].push(q)
    })
    const entries = Object.entries(groups)
    const order = ['تستی', 'صحیح-غلط', 'جاخالی', 'جورکردنی', 'کوتاه-پاسخ', 'گسترده-پاسخ', 'انتخاب-کلمه']
    entries.sort((a, b) => {
      const ai = order.indexOf(a[0]); const bi = order.indexOf(b[0])
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    return entries
  }, [questions, settings.groupingMode])

  const headerFieldRows = () => {
    if (!selectedHeader?.fields || selectedHeader.fields.length === 0) return []
    const perRow = 3
    const rows: { label: string; value: string; idx: number }[][] = []
    const withIdx = selectedHeader.fields.map((f, idx) => ({ ...f, idx }))
    for (let i = 0; i < withIdx.length; i += perRow) rows.push(withIdx.slice(i, i + perRow))
    return rows
  }

  const questionFontStyle = (q: BuilderQuestion): React.CSSProperties => ({
    fontFamily: q.fontFamily || settings.questionsFontFamily || undefined,
    fontSize: `${q.fontSize ?? settings.baseFontSize ?? 13}px`,
  })

  const isHeightAdjustable = (type: string) => HEIGHT_ADJUSTABLE_TYPES.includes(type)

  const getBlockHeight = (q: BuilderQuestion): number | undefined => {
    if (!isHeightAdjustable(q.type)) return undefined
    return q.blockHeight ?? settings.defaultHeightByType?.[q.type] ?? DEFAULT_HEIGHT_BY_TYPE[q.type] ?? 70
  }

  const getGroupInstruction = (type: string): string => {
    const saved = settings.groupInstructions?.[type]
    if (saved) return saved
    return GROUP_INSTRUCTION_SAMPLES[type]?.[0] || ''
  }

  const renderQuestionBody = (q: BuilderQuestion, rowNumber: number) => (
    <div className="leading-8 text-gray-900" style={questionFontStyle(q)}>
      {showInlineNumber && (
        <span className="font-bold ml-1">{toPersianDigits(rowNumber)}.</span>
      )}

      {q.mainQuestion && (
        <div className="font-bold text-gray-800 mb-1.5">{stripHtml(q.mainQuestion)}</div>
      )}

      <EditableText
        as="div"
        html={q.editedQuestionHtml ?? q.question}
        onChange={html => onUpdateQuestion(q._id!, { editedQuestionHtml: html })}
        className="[&_p]:inline [&_p]:m-0 [&_p]:leading-8 inline-block"
      />

      {q.type === 'صحیح-غلط' && (
        <div className="flex items-center gap-8 mt-2 flex-wrap">
          {(q.options && q.options.length > 0 ? q.options : ['صحیح', 'غلط']).map((opt, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-gray-700 inline-block shrink-0" />
              <span>{opt}</span>
            </span>
          ))}
        </div>
      )}

      {q.options && q.options.length > 0 && q.type !== 'صحیح-غلط' && (
        settings.optionsLayout === 'grid' ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mt-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-baseline gap-1.5">
                <span className="font-bold shrink-0">{getOptionLabel(oi, settings.optionLabelFormat)})</span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-8 gap-y-1.5 mt-2">
            {q.options.map((opt, oi) => (
              <span key={oi} className="whitespace-nowrap">
                <span className="font-bold">{getOptionLabel(oi, settings.optionLabelFormat)})</span> {opt}
              </span>
            ))}
          </div>
        )
      )}

      {q.matching_left && q.matching_left.length > 0 && q.matching_right && q.matching_right.length > 0 && (
        <table className="mt-2.5 w-full border-collapse border border-gray-500 text-[12.5px]">
          <thead>
            <tr>
              <th className="border border-gray-500 bg-gray-50 py-1 px-2 w-1/2 font-bold">ستون الف</th>
              <th className="border border-gray-500 bg-gray-50 py-1 px-2 w-1/2 font-bold">ستون ب</th>
            </tr>
          </thead>
          <tbody>
            {q.matching_left.map((l, i) => (
              <tr key={i}>
                <td className="border border-gray-400 px-2 py-1">{l}</td>
                <td className="border border-gray-400 px-2 py-1">{q.matching_right?.[i] ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {q.type === 'کوتاه-پاسخ' && settings.shortAnswerLine && (
        <div className="mt-3 border-b border-dotted border-gray-500 h-6" />
      )}
      {q.type === 'کوتاه-پاسخ' && !settings.shortAnswerLine && <div className="mt-3 h-6" />}

      {q.type === 'گسترده-پاسخ' && settings.essayAnswerLines && (
        <div className="mt-3 space-y-4">
          {[0, 1, 2].map(i => <div key={i} className="border-b border-dotted border-gray-500 h-6" />)}
        </div>
      )}
      {q.type === 'گسترده-پاسخ' && !settings.essayAnswerLines && <div className="mt-4 h-16" />}

      {q.type === 'جاخالی' && !q.noDashLine && (
        <p className="text-[11px] text-gray-400 mt-1 print:hidden">(خط‌چین جای خالی داخل متن سوال رعایت می‌شود)</p>
      )}
    </div>
  )

  const renderRow = (
    q: BuilderQuestion,
    rowNumber: number,
    canMoveUp: boolean,
    canMoveDown: boolean,
    suppressTopBorder: boolean,
    suppressBottomBorder: boolean,
  ) => {
    const cellStyle: React.CSSProperties = {
      ...(suppressTopBorder ? { borderTop: 'none' } : {}),
      ...(suppressBottomBorder ? { borderBottom: 'none' } : {}),
    }
    return (
      <tr key={q._id} className="group align-top" style={{ breakInside: 'avoid' }}>
        {showRowColumn && (
          <td className="border border-gray-800 text-center font-bold align-middle text-sm" style={{ width: rowColW, ...cellStyle }}>
            {toPersianDigits(rowNumber)}
          </td>
        )}

        <td
          className="border border-gray-800 px-3 py-2.5 align-top relative"
          style={cellStyle}
        >
          <div className="absolute -top-3 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-10">
            <button onClick={e => { e.stopPropagation(); onMoveQuestion(q._id!, 'up') }} disabled={!canMoveUp}
              className="bg-white border border-gray-300 rounded-full w-6 h-6 text-xs shadow-sm disabled:opacity-30">↑</button>
            <button onClick={e => { e.stopPropagation(); onMoveQuestion(q._id!, 'down') }} disabled={!canMoveDown}
              className="bg-white border border-gray-300 rounded-full w-6 h-6 text-xs shadow-sm disabled:opacity-30">↓</button>
            <button onClick={e => { e.stopPropagation(); setSettingsQuestionId(q._id!) }}
              className="bg-white border border-gray-300 rounded-full w-6 h-6 text-xs shadow-sm">⚙️</button>
            <button onClick={e => { e.stopPropagation(); onRemoveQuestion(q._id!) }}
              className="bg-red-500 text-white rounded-full w-6 h-6 text-xs shadow-sm">✕</button>
          </div>

          <div
            className="cursor-pointer"
            style={getBlockHeight(q) !== undefined ? { height: getBlockHeight(q), overflow: 'hidden' } : undefined}
            onClick={() => setPreviewQuestion(q)}
          >
            {renderQuestionBody(q, rowNumber)}
          </div>
        </td>

        {showScoreColumn && (
          <td className="border border-gray-800 text-center align-middle py-1" style={{ width: scoreColW, ...cellStyle }}>
            <input
              type="text"
              value={q.score || ''}
              onChange={e => onUpdateScore(q._id!, e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="—"
              className="w-full text-center bg-transparent outline-none font-bold text-sm print:hidden"
            />
            <span className="hidden print:inline font-bold text-sm">{q.score || '—'}</span>
          </td>
        )}
      </tr>
    )
  }

  let globalRow = 0

  const stdCell = (
    value: string,
    onChange: (v: string) => void,
    extraClass = '',
  ) => (
    <td className={`border border-gray-800 px-2 py-1.5 text-xs align-middle ${extraClass}`}>
      <EditableText as="span" html={value} onChange={onChange} />
    </td>
  )

  return (
    <div
      className="bg-white rounded-2xl border border-gray-300 p-6 shadow-inner print:border-0 print:shadow-none print:p-0 print:rounded-none"
      dir="rtl"
      style={{ fontFamily: settings.questionsFontFamily || undefined }}
    >
      <div className="a4-sheet bg-white border border-gray-200 rounded-sm mx-auto max-w-[794px] min-h-[1123px] p-8 shadow-md print:border-0 print:shadow-none print:p-[8mm] print:min-h-0 print:max-w-none print:mx-0">
        {settings.showBismillah && (
          <p className="text-center text-sm font-bold text-gray-700 mb-2">بسمه تعالی</p>
        )}

        {/* هدر «استاندارد ۱» */}
        {selectedHeader && selectedHeader.layout === 'standard-1' && selectedHeader.standard1 && (
          <div className="mb-4">
            <table className="w-full border-collapse border-2 border-gray-800 text-sm" style={{ fontFamily: settings.headerFontFamily || undefined }}>
              <tbody>
                <tr>
                  <td className="border border-gray-800 text-center font-bold py-1.5 text-sm" colSpan={5}>
                    <EditableText
                      as="span"
                      html={selectedHeader.standard1.bismillah}
                      onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'bismillah', v)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.studentName} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'studentName', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[13px] leading-6 align-middle" rowSpan={4}>
                    <EditableText as="div" html={selectedHeader.standard1.centerText} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'centerText', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle" colSpan={2}>
                    <EditableText as="span" html={selectedHeader.standard1.examDate} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'examDate', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-xs align-middle" colSpan={2} rowSpan={3}>
                    <EditableText as="div" html={selectedHeader.standard1.stampText} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'stampText', v)} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.schoolName} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'schoolName', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle" colSpan={2}>
                    <EditableText as="span" html={selectedHeader.standard1.examStartTime} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'examStartTime', v)} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.pageCount} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'pageCount', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle" colSpan={2}>
                    <EditableText as="span" html={selectedHeader.standard1.examDuration} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'examDuration', v)} />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.pageNumber} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'pageNumber', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.questionCount} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'questionCount', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.scoreNumeric} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'scoreNumeric', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.examSubject} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'examSubject', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-xs align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.scoreWritten} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'scoreWritten', v)} />
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border-2 border-t-0 border-gray-800 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-800 px-2 py-1.5 text-center align-middle">
                    <EditableText as="span" html={selectedHeader.standard1.bottomText} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'bottomText', v)} />
                  </td>
                  <td className="border border-gray-800 px-2 py-1.5 text-center font-bold align-middle w-28">
                    <EditableText as="span" html={selectedHeader.standard1.bottomPageLabel} onChange={v => onUpdateHeaderStandard1(selectedHeader.id, 'bottomPageLabel', v)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* هدر «استاندارد ۲» و «استاندارد ۳» */}
        {selectedHeader && selectedHeader.layout === 'standard-2' && selectedHeader.standard2 && (
          <div className="mb-4">
            {(() => {
              const s2 = selectedHeader.standard2 as HeaderStandard2Fields
              const upd = (field: keyof HeaderStandard2Fields, v: string) => onUpdateHeaderStandard2(selectedHeader.id, field, v)
              return (
                <>
                  <table className="w-full border-collapse border-2 border-gray-800 text-sm" style={{ fontFamily: settings.headerFontFamily || undefined }}>
                    <tbody>
                      <tr>
                        <td className="border border-gray-800 text-center font-bold py-1.5 text-sm" colSpan={3}>
                          <EditableText as="span" html={s2.bismillah} onChange={v => upd('bismillah', v)} />
                        </td>
                      </tr>
                      <tr>
                        {stdCell(s2.rightLabel1, v => upd('rightLabel1', v))}
                        <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[13px] leading-6 align-middle" rowSpan={5}>
                          <EditableText as="div" html={s2.centerText} onChange={v => upd('centerText', v)} />
                        </td>
                        {stdCell(s2.leftLabel1, v => upd('leftLabel1', v))}
                      </tr>
                      <tr>
                        {stdCell(s2.rightLabel2, v => upd('rightLabel2', v))}
                        {stdCell(s2.leftLabel2, v => upd('leftLabel2', v))}
                      </tr>
                      <tr>
                        {stdCell(s2.rightLabel3, v => upd('rightLabel3', v))}
                        {stdCell(s2.leftLabel3, v => upd('leftLabel3', v))}
                      </tr>
                      <tr>
                        {stdCell(s2.rightLabel4, v => upd('rightLabel4', v))}
                        {stdCell(s2.leftLabel4, v => upd('leftLabel4', v))}
                      </tr>
                      <tr>
                        {stdCell(s2.rightLabel5, v => upd('rightLabel5', v))}
                        {stdCell(s2.leftLabel5, v => upd('leftLabel5', v))}
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border-2 border-t-0 border-gray-800 text-xs">
                    <tbody>
                      <tr>
                        {stdCell(s2.rightSignName, v => upd('rightSignName', v))}
                        {stdCell(s2.rightScoreNumeric, v => upd('rightScoreNumeric', v), 'text-center')}
                        <td className="border border-gray-800 px-1 py-1.5 text-center align-middle w-8" rowSpan={2}>
                          <span style={{ writingMode: 'vertical-rl' }} className="inline-block">
                            <EditableText
                              as="span"
                              html={s2.confirmLabel}
                              onChange={v => upd('confirmLabel', v)}
                            />
                          </span>
                        </td>
                        {stdCell(s2.leftScoreNumeric, v => upd('leftScoreNumeric', v), 'text-center')}
                        {stdCell(s2.leftSignName, v => upd('leftSignName', v))}
                      </tr>
                      <tr>
                        {stdCell(s2.rightDate, v => upd('rightDate', v))}
                        {stdCell(s2.rightScoreWritten, v => upd('rightScoreWritten', v), 'text-center')}
                        {stdCell(s2.leftScoreWritten, v => upd('leftScoreWritten', v), 'text-center')}
                        {stdCell(s2.leftDate, v => upd('leftDate', v))}
                      </tr>
                    </tbody>
                  </table>
                </>
              )
            })()}
          </div>
        )}

        {/* هدر «مینیمال» (استاندارد ۴) */}
        {selectedHeader && selectedHeader.layout === 'standard-4' && selectedHeader.standard4 && (
          <div className="mb-4">
            {(() => {
              const s4 = selectedHeader.standard4 as HeaderStandard4Fields
              const upd = (field: keyof HeaderStandard4Fields, v: string) => onUpdateHeaderStandard4(selectedHeader.id, field, v)
              return (
                <>
                  <table className="w-full border-collapse border-2 border-gray-800 text-sm" style={{ fontFamily: settings.headerFontFamily || undefined }}>
                    <tbody>
                      <tr>
                        {stdCell(s4.rightLabel1, v => upd('rightLabel1', v))}
                        <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[13px] leading-6 align-middle" rowSpan={3}>
                          <EditableText as="span" html={s4.centerLine1} onChange={v => upd('centerLine1', v)} className="block" />
                          <EditableText as="span" html={s4.centerLine2} onChange={v => upd('centerLine2', v)} className="block" />
                          <EditableText as="span" html={s4.centerLine3} onChange={v => upd('centerLine3', v)} className="block font-normal text-xs" />
                        </td>
                        {stdCell(s4.leftLabel1, v => upd('leftLabel1', v))}
                      </tr>
                      <tr>
                        {stdCell(s4.rightLabel2, v => upd('rightLabel2', v))}
                        {stdCell(s4.leftLabel2, v => upd('leftLabel2', v))}
                      </tr>
                      <tr>
                        {stdCell(s4.rightLabel3, v => upd('rightLabel3', v))}
                        {stdCell(s4.leftLabel3, v => upd('leftLabel3', v))}
                      </tr>
                      <tr>
                        {stdCell(s4.rightLabel4, v => upd('rightLabel4', v))}
                        {stdCell(s4.questionCountLabel, v => upd('questionCountLabel', v))}
                        {stdCell(s4.pageCountLabel, v => upd('pageCountLabel', v))}
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border-2 border-t-0 border-gray-800 text-xs">
                    <tbody>
                      <tr>
                        {stdCell(s4.bottomSignLabel, v => upd('bottomSignLabel', v))}
                        {stdCell(s4.bottomScoreNumeric, v => upd('bottomScoreNumeric', v), 'text-center')}
                        {stdCell(s4.bottomScoreWritten, v => upd('bottomScoreWritten', v), 'text-center')}
                      </tr>
                    </tbody>
                  </table>
                </>
              )
            })()}
          </div>
        )}

        {/* هدر «کاستوم» — ساخته‌شده توسط کاربر */}
        {selectedHeader && selectedHeader.layout === 'custom' && selectedHeader.custom && (
          <div className="mb-4">
            {(() => {
              const cfg = selectedHeader.custom as CustomHeaderConfig
              const headerId = selectedHeader.id

              const updCenter = (idx: number, v: string) =>
                onUpdateHeaderCustom(headerId, c => ({
                  ...c,
                  centerLines: c.centerLines.map((l, i) => (i === idx ? v : l)),
                }))
              const updStudent = (idx: number, v: string) =>
                onUpdateHeaderCustom(headerId, c => ({
                  ...c,
                  studentItems: c.studentItems.map((it, i) => (i === idx ? { ...it, text: v } : it)),
                }))
              const updExam = (idx: number, v: string) =>
                onUpdateHeaderCustom(headerId, c => ({
                  ...c,
                  examItems: c.examItems.map((it, i) => (i === idx ? { ...it, text: v } : it)),
                }))
              const updStamp = (v: string) =>
                onUpdateHeaderCustom(headerId, c => ({ ...c, stampText: v }))
              const updRound = (idx: number, field: 'label' | 'signLabel' | 'dateLabel' | 'scoreNumericLabel' | 'scoreWrittenLabel', v: string) =>
                onUpdateHeaderCustom(headerId, c => ({
                  ...c,
                  rounds: c.rounds.map((r, i) => (i === idx ? { ...r, [field]: v } : r)),
                }))
              const updFooter = (v: string) =>
                onUpdateHeaderCustom(headerId, c => ({ ...c, footerText: v }))

              const rowCount = Math.max(cfg.studentItems.length, cfg.examItems.length, 1)

              return (
                <>
                  <table className="w-full border-collapse border-2 border-gray-800 text-sm" style={{ fontFamily: settings.headerFontFamily || undefined }}>
                    <tbody>
                      {Array.from({ length: rowCount }).map((_, i) => (
                        <tr key={i}>
                          {cfg.studentItems[i] ? (
                            stdCell(cfg.studentItems[i].text, v => updStudent(i, v))
                          ) : (
                            <td className="border border-gray-800 px-2 py-1.5" />
                          )}

                          {i === 0 && (
                            <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[13px] leading-6 align-middle" rowSpan={rowCount}>
                              {cfg.centerLines.map((line, ci) => (
                                <EditableText
                                  key={ci}
                                  as="span"
                                  html={line}
                                  onChange={v => updCenter(ci, v)}
                                  className="block"
                                />
                              ))}
                            </td>
                          )}

                          {cfg.examItems[i] ? (
                            stdCell(cfg.examItems[i].text, v => updExam(i, v))
                          ) : (
                            <td className="border border-gray-800 px-2 py-1.5" />
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {cfg.hasStamp && (
                    <table className="w-full border-collapse border-2 border-t-0 border-gray-800 text-xs">
                      <tbody>
                        <tr>
                          <td className="border border-gray-800 px-2 py-2 text-center font-bold align-middle">
                            <EditableText as="span" html={cfg.stampText} onChange={updStamp} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {cfg.rounds.length > 0 && (
                    <table className="w-full border-collapse border-2 border-t-0 border-gray-800 text-xs">
                      <tbody>
                        {cfg.rounds.map((r, ri) => (
                          <tr key={r.id}>
                            <td className="border border-gray-800 px-2 py-1.5 font-bold align-middle w-32">
                              <EditableText as="span" html={r.label} onChange={v => updRound(ri, 'label', v)} />
                            </td>
                            <td className="border border-gray-800 px-2 py-1.5 align-middle">
                              <EditableText as="span" html={r.signLabel} onChange={v => updRound(ri, 'signLabel', v)} />
                            </td>
                            <td className="border border-gray-800 px-2 py-1.5 align-middle">
                              <EditableText as="span" html={r.dateLabel} onChange={v => updRound(ri, 'dateLabel', v)} />
                            </td>
                            <td className="border border-gray-800 px-2 py-1.5 text-center align-middle">
                              <EditableText as="span" html={r.scoreNumericLabel} onChange={v => updRound(ri, 'scoreNumericLabel', v)} />
                            </td>
                            <td className="border border-gray-800 px-2 py-1.5 text-center align-middle">
                              <EditableText as="span" html={r.scoreWrittenLabel} onChange={v => updRound(ri, 'scoreWrittenLabel', v)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {cfg.footerText && (
                    <p className="text-center text-xs text-gray-600 mt-2 px-2">
                      <EditableText as="span" html={cfg.footerText} onChange={updFooter} />
                    </p>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* هدر ساده (قالب‌های قبلی: standard / formal / simple / two-column) */}
        {selectedHeader &&
          selectedHeader.layout !== 'standard-1' &&
          selectedHeader.layout !== 'standard-2' &&
          selectedHeader.layout !== 'standard-4' &&
          selectedHeader.layout !== 'custom' && (
          <table className="w-full border-collapse border-2 border-gray-800 text-sm mb-4" style={{ fontFamily: settings.headerFontFamily || undefined }}>
            <tbody>
              <tr>
                <td className="border border-gray-800 text-center font-bold py-2 text-base">
                  <EditableText
                    as="span"
                    html={selectedHeader.title}
                    onChange={v => onUpdateHeaderField(selectedHeader.id, 'title', v)}
                  />
                  {selectedHeader.subtitle !== undefined && (
                    <span className="font-normal text-sm text-gray-600 mr-2">
                      (<EditableText as="span" html={selectedHeader.subtitle || ''} onChange={v => onUpdateHeaderField(selectedHeader.id, 'subtitle', v)} />)
                    </span>
                  )}
                </td>
              </tr>
              {headerFieldRows().map((row, ri) => (
                <tr key={ri}>
                  {row.map(f => (
                    <td key={f.idx} className="border border-gray-800 px-3 py-2 text-xs align-top" style={{ width: `${100 / row.length}%` }}>
                      <span className="font-bold text-gray-700">{f.label}:</span>{' '}
                      <EditableText
                        as="span"
                        html={f.value || ''}
                        placeholder="..........................."
                        onChange={v => onUpdateHeaderCell(selectedHeader.id, f.idx, v)}
                        className="text-gray-800"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {questions.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <p className="text-6xl mb-4">📄</p>
            <p>سوالی اضافه نشده است</p>
          </div>
        ) : (
          <table className="w-full border-collapse border-2 border-gray-800" dir="rtl">
            <thead>
              <tr>
                {showRowColumn && (
                  <th className="border border-gray-800 bg-gray-100 text-xs font-bold py-1.5" style={{ width: rowColW }}>ردیف</th>
                )}
                <th className="border border-gray-800 bg-gray-100 text-sm font-bold py-1.5">« سوالات »</th>
                {showScoreColumn && (
                  <th className="border border-gray-800 bg-gray-100 text-xs font-bold py-1.5" style={{ width: scoreColW }}>بارم</th>
                )}
              </tr>
            </thead>
            <tbody>
              {settings.groupingMode === 'grouped' && groupedQuestions
                ? groupedQuestions.map(([type, typeQuestions]) => (
                    <React.Fragment key={type}>
                      <tr
                        className="cursor-pointer hover:bg-gray-100 print:cursor-default"
                        onClick={() => setEditingGroupType(type)}
                      >
                        {showRowColumn && (
                          <td className="border border-gray-800" style={{ width: rowColW, borderBottom: 'none' }} />
                        )}
                        <td
                          className="border border-gray-800 text-center font-bold text-sm text-gray-800 py-1.5 px-3"
                          style={{ borderBottom: 'none', fontFamily: settings.groupTitleFontFamily || undefined }}
                        >
                          {getGroupInstruction(type)}
                        </td>
                        {showScoreColumn && (
                          <td className="border border-gray-800" style={{ width: scoreColW, borderBottom: 'none' }} />
                        )}
                      </tr>
                      {typeQuestions.map((q, i) => {
                        globalRow += 1
                        const suppressTopBorder = i === 0 || !rowDividerOn
                        const suppressBottomBorder = !rowDividerOn && i < typeQuestions.length - 1
                        return renderRow(q, globalRow, i > 0, i < typeQuestions.length - 1, suppressTopBorder, suppressBottomBorder)
                      })}
                    </React.Fragment>
                  ))
                : questions.map((q, idx) => {
                    globalRow += 1
                    const isFirstOfRun = idx === 0 || questions[idx - 1].type !== q.type
                    const isLastOfRun = idx === questions.length - 1 || questions[idx + 1].type !== q.type
                    const suppressTopBorder = !isFirstOfRun && !rowDividerOn
                    const suppressBottomBorder = !isLastOfRun && !rowDividerOn
                    return renderRow(q, globalRow, idx > 0, idx < questions.length - 1, suppressTopBorder, suppressBottomBorder)
                  })}
            </tbody>
          </table>
        )}

        {questions.length > 0 && settings.footerText && (
          <p className="text-center text-sm font-bold text-gray-700 mt-6">
            « <EditableText as="span" html={settings.footerText} onChange={() => { /* footer از تنظیمات میاد، فقط نمایشیه */ }} /> »
          </p>
        )}
      </div>

      {previewQuestion && (
        <QuestionPreviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} />
      )}

      {settingsQuestion && (
        <QuestionSettingsPopover
          question={settingsQuestion}
          settings={settings}
          onUpdate={patch => onUpdateQuestion(settingsQuestion._id!, patch)}
          onSwap={() => { onSwapQuestion(settingsQuestion._id!); setSettingsQuestionId(null) }}
          onClose={() => setSettingsQuestionId(null)}
        />
      )}

      {editingGroupType && (
        <GroupInstructionModal
          type={editingGroupType}
          typeLabel={TYPE_LABELS_MAP[editingGroupType] || editingGroupType}
          currentText={settings.groupInstructions?.[editingGroupType] || ''}
          onSave={text => onUpdateGroupInstruction(editingGroupType, text)}
          onClose={() => setEditingGroupType(null)}
        />
      )}
    </div>
  )
}

export default A4Preview