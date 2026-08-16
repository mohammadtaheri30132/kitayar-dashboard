/**
 * ================================================================
 * این فایل را جداگانه اضافه نکن! محتویاتش را داخل
 * src/types/question-builder.ts موجودت "merge" کن.
 * ================================================================
 */

import type { HeaderStandard1Fields, HeaderStandard2Fields, HeaderStandard4Fields } from './question-builder'
export { GROUP_INSTRUCTION_SAMPLES } from './question-builder'

// ---------- ترتیب استاندارد گروه‌بندی سوالات ----------
export const QUESTION_TYPE_ORDER: string[] = [
  'تستی',
  'صحیح-غلط',
  'جاخالی',
  'جورکردنی',
  'کوتاه-پاسخ',
  'گسترده-پاسخ',
  'انتخاب-کلمه',
]

export const sortByQuestionTypeOrder = <T extends { type: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const ai = QUESTION_TYPE_ORDER.indexOf(a.type)
    const bi = QUESTION_TYPE_ORDER.indexOf(b.type)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

// ---------- بارم پیش‌فرض هر نوع سوال ----------
export const DEFAULT_SCORE_BY_TYPE: Record<string, string> = {
  'تستی': '0.25',
  'صحیح-غلط': '0.25',
  'جاخالی': '0.5',
  'جورکردنی': '0.5',
  'کوتاه-پاسخ': '0.5',
  'گسترده-پاسخ': '1',
  'انتخاب-کلمه': '0.25',
}

// ---------- عرض ستون‌های ردیف/بارم ----------
export type ColumnWidthPreset = 'xs' | 'sm' | 'standard'
export interface ColumnWidthSetting {
  preset: ColumnWidthPreset | 'custom'
  customPx?: number
}
export const COLUMN_WIDTH_PRESET_PX: Record<ColumnWidthPreset, number> = {
  xs: 28,
  sm: 36,
  standard: 44,
}
export const resolveColumnWidth = (setting: ColumnWidthSetting | undefined, fallback: number): number => {
  if (!setting) return fallback
  if (setting.preset === 'custom') return setting.customPx || fallback
  return COLUMN_WIDTH_PRESET_PX[setting.preset]
}

// ---------- قالب‌های آماده هدر ----------
export interface HeaderTemplate {
  key: string
  label: string
  icon: string
  description: string
  build: () => {
    title: string
    subtitle?: string
    fields: { label: string; value: string }[]
    layout?: 'simple' | 'standard-1' | 'standard-2' | 'standard-4'
    standard1?: HeaderStandard1Fields
    standard2?: HeaderStandard2Fields
    standard4?: HeaderStandard4Fields
  }
}

export const HEADER_TEMPLATES: HeaderTemplate[] = [
  {
    key: 'standard',
    label: 'استاندارد',
    icon: '📄',
    description: 'نام، تاریخ و مدت آزمون',
    build: () => ({
      title: 'آزمون',
      subtitle: '',
      fields: [
        { label: 'نام و نام خانوادگی', value: '' },
        { label: 'تاریخ', value: '' },
        { label: 'مدت', value: '۶۰ دقیقه' },
      ],
    }),
  },
  {
    key: 'standard-1',
    label: 'استاندارد ۱',
    icon: '🏛️',
    description: 'سربرگ رسمی آزمون هماهنگ با محل مهر، نمره و امضا',
    build: () => ({
      title: '',
      fields: [],
      layout: 'standard-1',
      standard1: {
        studentName: 'نام ونام خانوادگی دانش آموز:',
        schoolName: 'نام آموزشگاه :',
        pageCount: 'تعداد صفحات :۳',
        pageNumber: 'شماره صفحه : ۱',
        centerText:
          'اداره کل آموزش و پرورش استان تهران<br/>سوالات آزمون هماهنگ دانش آموزان<br/>پایه هفتم دوره اول متوسطه<br/>آزمون ریاضی نوبت صبح<br/>آذر ماه ۱۴۰۳',
        examDate: 'تاریخ امتحان: ۱۴۰۳/۹/۱۰',
        examStartTime: 'ساعت شروع امتحان : ۸ صبح',
        examDuration: 'وقت آزمون:  ۸۵ دقیقه',
        questionCount: 'تعدادسوال: ۱۷ سوال',
        scoreNumeric: 'نمره با عدد:',
        stampText: 'محل مهر آموزشگاه',
        examSubject: 'امتحان درس : ریاضی',
        scoreWritten: 'نمره با حروف:',
        bottomText: 'امام علی (ع) : از آنان مباشید که بدون زحمت و تلاش امید به عاقبتی نیک دارند.',
        bottomPageLabel: 'صفحه اول',
        bismillah: 'باسمه تعالی',
      },
    }),
  },
  {
    key: 'standard-2',
    label: 'استاندارد ۲',
    icon: '🏫',
    description: 'سربرگ اداره آموزش و پرورش با مشخصات دانش‌آموز و بلوک تأیید دبیر',
    build: () => ({
      title: '',
      fields: [],
      layout: 'standard-2',
      standard2: {
        bismillah: 'باسمه تعالی',
        rightLabel1: 'نام:',
        rightLabel2: 'نام خانوادگی:',
        rightLabel3: 'نام پدر:',
        rightLabel4: 'نام درس:',
        rightLabel5: 'پایه:',
        centerText:
          'اداره کل آموزش و پرورش استان تهران<br/>کارشناسی سنجش و ارزشیابی تحصیلی<br/>اداره آموزش و پرورش شهرستان<br/>دبیرستان',
        leftLabel1: 'نوبت امتحانی: دی ماه',
        leftLabel2: 'تاریخ امتحان:',
        leftLabel3: 'مدت امتحان: ۹۰ دقیقه',
        leftLabel4: 'نام دبیر:',
        leftLabel5: 'شماره صفحه:',
        rightSignName: 'نام و نام خانوادگی دبیر:',
        rightScoreNumeric: 'نمره به عدد',
        rightDate: 'تاریخ وامضا:',
        rightScoreWritten: 'نمره به حروف',
        confirmLabel: 'تأیید',
        leftSignName: 'نام و نام خانوادگی دبیر:',
        leftScoreNumeric: 'نمره به عدد',
        leftDate: 'تاریخ وامضا:',
        leftScoreWritten: 'نمره به حروف',
      },
    }),
  },
  {
    key: 'standard-3',
    label: 'استاندارد ۳',
    icon: '📝',
    description: 'سربرگ آزمون هماهنگ با مشخصات دانش‌آموز و بلوک تأیید دبیر (نمونه فرشتگان)',
    build: () => ({
      title: '',
      fields: [],
      layout: 'standard-2',
      standard2: {
        bismillah: 'باسمه تعالی',
        rightLabel1: 'نام:',
        rightLabel2: 'نام خانوادگی:',
        rightLabel3: 'نام پدر:',
        rightLabel4: 'نام درس:',
        rightLabel5: 'پایه:',
        centerText:
          'اداره کل آموزش و پرورش استان فارس<br/>کارشناسی سنجش و ارزشیابی تحصیلی و تربیتی...<br/>اداره آموزش و پرورش شهرستان مرودشت<br/>دبیرستان غیر دولتی فرشتگان (دوره اول)',
        leftLabel1: 'نوبت امتحانی: دی ماه',
        leftLabel2: 'تاریخ امتحان: ۱۴۰۱/۱۰/۱۷',
        leftLabel3: 'مدت امتحان: ۹۰ دقیقه',
        leftLabel4: 'نام دبیر: فاطمه صحرایی',
        leftLabel5: 'شماره صفحه:',
        rightSignName: 'نام و نام خانوادگی دبیر:',
        rightScoreNumeric: 'نمره به عدد',
        rightDate: 'تاریخ و امضا:',
        rightScoreWritten: 'نمره به حروف',
        confirmLabel: 'تأیید',
        leftSignName: 'نام و نام خانوادگی دبیر:',
        leftScoreNumeric: 'نمره به عدد',
        leftDate: 'تاریخ وامضا:',
        leftScoreWritten: 'نمره به حروف',
      },
    }),
  },
  {
    key: 'minimal',
    label: 'مینیمال',
    icon: '🗂️',
    description: 'سربرگ ساده اداره کل با ستون درس/دانش‌آموز و زمان‌بندی آزمون',
    build: () => ({
      title: '',
      fields: [],
      layout: 'standard-4',
      standard4: {
        centerLine1: 'باسمه تعالی',
        centerLine2: 'اداره کل آموزش و پرورش کرمانشاه',
        centerLine3: 'نوبت اول ۱۴۰۰-۱۴۰۱',
        rightLabel1: 'سئوالات درس: ریاضی',
        rightLabel2: 'نام ونام خانوادگی:',
        rightLabel3: 'نام مدرسه :',
        rightLabel4: 'پایه تحصیلی: هفتم',
        leftLabel1: 'زمان آزمون :',
        leftLabel2: 'ساعت برگزاری:',
        leftLabel3: 'تاریخ امتحان:',
        questionCountLabel: 'تعداد سئوال: ۱۳',
        pageCountLabel: 'تعداد صفحه: ۲',
        bottomSignLabel: 'نام ونام خانوادگی دبیر و امضا:',
        bottomScoreNumeric: 'نمره با عدد:',
        bottomScoreWritten: 'نمره باحروف:',
      },
    }),
  },
  {
    key: 'formal',
    label: 'رسمی (با آرم)',
    icon: '🏫',
    description: 'مناسب برای سربرگ رسمی مدرسه',
    build: () => ({
      title: 'به نام خدا',
      subtitle: 'آموزش و پرورش',
      fields: [
        { label: 'نام آموزشگاه', value: '' },
        { label: 'نام دانش‌آموز', value: '' },
        { label: 'کلاس', value: '' },
        { label: 'تاریخ', value: '' },
        { label: 'مدت', value: '' },
        { label: 'نام دبیر', value: '' },
      ],
    }),
  },
  {
    key: 'simple',
    label: 'ساده',
    icon: '✏️',
    description: 'فقط عنوان، بدون فیلد اضافه',
    build: () => ({
      title: 'آزمون',
      subtitle: '',
      fields: [],
    }),
  },
  {
    key: 'two-column',
    label: 'دو ستونه',
    icon: '▦',
    description: 'نمره و ردیف در کنار مشخصات',
    build: () => ({
      title: 'برگه آزمون',
      subtitle: '',
      fields: [
        { label: 'نام و نام خانوادگی', value: '' },
        { label: 'شماره دانش‌آموزی', value: '' },
        { label: 'تاریخ', value: '' },
        { label: 'مدت زمان', value: '' },
        { label: 'نمره', value: '' },
        { label: 'امضای دبیر', value: '' },
      ],
    }),
  },
]

// ---------- نمونه‌های رایج متن پاورقی هدر ----------
export const FOOTER_NOTE_PRESETS: string[] = [
  'استفاده از ماشین‌حساب، موبایل و هرگونه وسیله کمکی در جلسه امتحان ممنوع است.',
  'به سؤالات به‌ترتیب صورت سؤال پاسخ دهید و از خط‌خوردگی زیاد خودداری کنید.',
  'خوانا و مرتب بنویسید؛ به پاسخ‌های ناخوانا نمره تعلق نمی‌گیرد.',
  'امام علی (ع): از آنان مباشید که بدون زحمت و تلاش امید به عاقبتی نیک دارند.',
  'موفق و پیروز باشید.',
]

// ---------- ارتفاع پیش‌فرض بلوک هر نوع سوال (px) ----------
export const DEFAULT_HEIGHT_BY_TYPE: Record<string, number> = {
  'تستی': 80,
  'صحیح-غلط': 70,
  'جاخالی': 70,
  'جورکردنی': 130,
  'کوتاه-پاسخ': 70,
  'گسترده-پاسخ': 150,
  'انتخاب-کلمه': 70,
}
export const MIN_BLOCK_HEIGHT = 40

export const HEIGHT_ADJUSTABLE_TYPES: string[] = ['گسترده-پاسخ', 'کوتاه-پاسخ']

export const buildHeightOptions = (base: number): number[] => {
  const offsets = [-15, -10, -5, 0, 5, 10, 15, 20, 25]
  const values = offsets.map(o => Math.max(MIN_BLOCK_HEIGHT, base + o))
  return Array.from(new Set(values)).sort((a, b) => a - b)
}

export const FONT_SIZE_OPTIONS: number[] = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24]

export const QUESTION_DIVIDER_DEFAULT = true

export interface BuilderQuestionOverrides {
  fontSize?: number
  fontFamily?: string
  blockHeight?: number
  noDashLine?: boolean
  editedQuestionHtml?: string
}

export interface BuilderSettingsAdditions {
  defaultScoreByType: Record<string, string>
  defaultHeightByType: Record<string, number>
  questionsFontFamily: string
  headerFontFamily: string
  groupTitleFontFamily: string
  baseFontSize: number
  rowColumnWidth: ColumnWidthSetting
  scoreColumnWidth: ColumnWidthSetting
  groupInstructions: Record<string, string>
  essayAnswerLines: boolean
  shortAnswerLine: boolean
  questionDivider: boolean
}

export const EXAM_FONT_NAZANIN = "'B Nazanin', Tahoma, sans-serif"
export const EXAM_FONT_MITRA = "'B Mitra', Tahoma, sans-serif"
export const EXAM_FONT_MITRA_BOLD = "'B Mitra Bold', Tahoma, sans-serif"
export const EXAM_FONT_TITR_BOLD = "'B Titr Bold', Tahoma, sans-serif"

export const DEFAULT_SETTINGS_ADDITIONS: BuilderSettingsAdditions = {
  defaultScoreByType: { ...DEFAULT_SCORE_BY_TYPE },
  defaultHeightByType: { ...DEFAULT_HEIGHT_BY_TYPE },
  questionsFontFamily: EXAM_FONT_NAZANIN,
  headerFontFamily: EXAM_FONT_NAZANIN,
  groupTitleFontFamily: EXAM_FONT_TITR_BOLD,
  baseFontSize: 13,
  rowColumnWidth: { preset: 'standard' },
  scoreColumnWidth: { preset: 'standard' },
  groupInstructions: {},
  essayAnswerLines: true,
  shortAnswerLine: true,
  questionDivider: QUESTION_DIVIDER_DEFAULT,
}

export const FONT_FAMILY_OPTIONS: { label: string; value: string }[] = [
  { label: 'بی‌نازنین (B Nazanin)', value: EXAM_FONT_NAZANIN },
  { label: 'میترا (B Mitra)', value: EXAM_FONT_MITRA },
  { label: 'میترا بولد (B Mitra Bold)', value: EXAM_FONT_MITRA_BOLD },
  { label: 'تیتر بولد (B Titr Bold)', value: EXAM_FONT_TITR_BOLD },
]