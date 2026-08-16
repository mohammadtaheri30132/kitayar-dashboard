// ==============================
// انواع سوال
// ==============================
export type QuestionType =
  | 'تستی'
  | 'جاخالی'
  | 'صحیح-غلط'
  | 'کوتاه-پاسخ'
  | 'گسترده-پاسخ'
  | 'جورکردنی'
  | 'انتخاب-کلمه'

export interface BuilderQuestion {
  _id?: string
  question_id?: string
  type: QuestionType
  difficulty?: string
  question: string
  mainQuestion?: string
  options?: string[]
  matching_left?: string[]
  matching_right?: string[]
  answer?: string
  page_number?: (string | number)[]
  source_image?: string
  has_image?: boolean
  bookName?: string
  gradeName?: string
  courseName?: string
  score?: string
}

// ==============================
// هدر برگه امتحان
// ==============================
export interface HeaderField {
  label: string
  value: string
}

export interface BuilderHeader {
  id: string
  title: string
  subtitle?: string
  fields?: HeaderField[]
  layout?: 'simple' | 'standard-1' | 'standard-2' | 'standard-4' | 'custom'
  standard1?: HeaderStandard1Fields
  standard2?: HeaderStandard2Fields
  standard4?: HeaderStandard4Fields
  custom?: CustomHeaderConfig
}

// ---------- فیلدهای هدر «استاندارد ۱» ----------
export interface HeaderStandard1Fields {
  studentName: string
  schoolName: string
  pageCount: string
  pageNumber: string
  centerText: string
  examDate: string
  examStartTime: string
  examDuration: string
  questionCount: string
  scoreNumeric: string
  stampText: string
  examSubject: string
  scoreWritten: string
  bottomText: string
  bottomPageLabel: string
  bismillah: string
}

// ---------- فیلدهای هدر «استاندارد ۲» ----------
export interface HeaderStandard2Fields {
  bismillah: string
  rightLabel1: string
  rightLabel2: string
  rightLabel3: string
  rightLabel4: string
  rightLabel5: string
  centerText: string
  leftLabel1: string
  leftLabel2: string
  leftLabel3: string
  leftLabel4: string
  leftLabel5: string
  rightSignName: string
  rightScoreNumeric: string
  rightDate: string
  rightScoreWritten: string
  confirmLabel: string
  leftSignName: string
  leftScoreNumeric: string
  leftDate: string
  leftScoreWritten: string
}

// ---------- فیلدهای هدر «استاندارد ۴ / مینیمال» ----------
export interface HeaderStandard4Fields {
  centerLine1: string
  centerLine2: string
  centerLine3: string
  rightLabel1: string
  rightLabel2: string
  rightLabel3: string
  rightLabel4: string
  leftLabel1: string
  leftLabel2: string
  leftLabel3: string
  questionCountLabel: string
  pageCountLabel: string
  bottomSignLabel: string
  bottomScoreNumeric: string
  bottomScoreWritten: string
}

// ---------- هدر «کاستوم» — قابل‌ساخت توسط کاربر ----------
export interface CustomHeaderTextItem {
  id: string
  text: string
}

export interface CustomHeaderRound {
  id: string
  label: string             // مثلاً «نوبت اول (تصحیح اول)»
  signLabel: string         // نام و امضای مصحح/دبیر:
  dateLabel: string         // تاریخ:
  scoreNumericLabel: string // نمره به عدد:
  scoreWrittenLabel: string // نمره به حروف:
}

export interface CustomHeaderConfig {
  /** خطوط مرکز سربرگ (اطلاعات سازمانی و آزمون) */
  centerLines: string[]
  /** ستون راست — مشخصات دانش‌آموز */
  studentItems: CustomHeaderTextItem[]
  /** ستون چپ — مشخصات اجرایی و فنی آزمون */
  examItems: CustomHeaderTextItem[]
  hasStamp: boolean
  stampText: string
  /** جدول ثبت نمرات و بازبینی */
  rounds: CustomHeaderRound[]
  /** پاورقی — خالی یعنی نمایش داده نشود */
  footerText: string
}

// ==============================
// فرمت برچسب گزینه‌ها
// ==============================
export type OptionLabelFormat = 'fa-alphabet' | 'en-alphabet' | 'fa-number' | 'en-number' | 'fa-word'

export const OPTION_LABEL_FORMATS: { value: OptionLabelFormat; label: string }[] = [
  { value: 'fa-alphabet', label: 'الف، ب، ج، د' },
  { value: 'en-alphabet', label: 'a, b, c, d' },
  { value: 'fa-number', label: '۱، ۲، ۳، ۴' },
  { value: 'en-number', label: '1, 2, 3, 4' },
  { value: 'fa-word', label: 'اول، دوم، سوم' },
]

export const toPersianDigits = (val: number | string): string => {
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(val).replace(/[0-9]/g, d => fa[+d])
}

export function getOptionLabel(index: number, format: OptionLabelFormat): string {
  const faAlphabet = ['الف', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح']
  const enAlphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const faWords = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم', 'هشتم']

  switch (format) {
    case 'fa-alphabet':
      return faAlphabet[index] ?? toPersianDigits(index + 1)
    case 'en-alphabet':
      return enAlphabet[index] ?? String(index + 1)
    case 'fa-number':
      return toPersianDigits(index + 1)
    case 'en-number':
      return String(index + 1)
    case 'fa-word':
      return faWords[index] ?? toPersianDigits(index + 1)
    default:
      return toPersianDigits(index + 1)
  }
}

// ==============================
// تنظیمات نمایش برگه
// ==============================
export interface BuilderSettings {
  optionLabelFormat: OptionLabelFormat
  optionsLayout: 'inline' | 'grid'
  groupingMode: 'grouped' | 'individual'
  showScore: boolean
  showQuestionNumber: boolean
  showBismillah: boolean
  footerText: string
}

export const DEFAULT_SETTINGS: BuilderSettings = {
  optionLabelFormat: 'fa-alphabet',
  optionsLayout: 'inline',
  groupingMode: 'individual',
  showScore: true,
  showQuestionNumber: true,
  showBismillah: false,
  footerText: 'موفق و سرفراز باشید',
}

// ==============================
// وضعیت کامل ذخیره‌شونده در localStorage
// ==============================
export interface BuilderState {
  headerId: string | null
  questions: BuilderQuestion[]
  settings?: BuilderSettings
  selectedCourseId?: string
  selectedFieldId?: string
  selectedGradeId?: string
  selectedBookId?: string
  selectedCourseName?: string
  selectedFieldName?: string
  selectedGradeName?: string
  selectedBookName?: string
}

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

// ---------- متن‌های نمونه دستور سوال ----------
export const GROUP_INSTRUCTION_SAMPLES: Record<string, string[]> = {
  'تستی': [
    'کدام گزینه پاسخ صحیح است؟',
    'گزینه صحیح را انتخاب کنید.',
    'کدام مورد صحیح می‌باشد؟',
    'پاسخ درست را مشخص کنید.',
  ],
  'صحیح-غلط': [
    'عبارت زیر درست است یا نادرست؟',
    'درست یا نادرست بودن عبارت زیر را مشخص کنید.',
    'درستی یا نادرستی جمله زیر را تعیین کنید.',
    'مشخص کنید عبارت زیر صحیح است یا غلط.',
  ],
  'جاخالی': [
    'جاهای خالی را با کلمه مناسب کامل کنید.',
    'عبارت‌های زیر را با کلمات مناسب کامل کنید.',
    'کلمه مناسب را در جای خالی بنویسید.',
    'جای خالی را با پاسخ صحیح پر کنید.',
  ],
  'گسترده-پاسخ': [
    'به سؤال زیر به‌طور کامل پاسخ دهید.',
    'پاسخ خود را به‌صورت تشریحی بنویسید.',
    'سؤال زیر را توضیح دهید.',
    'پاسخ خود را با ذکر دلیل بیان کنید.',
  ],
  'کوتاه-پاسخ': [
    'پاسخ کوتاه و دقیق خود را بنویسید.',
    'به سؤال زیر کوتاه پاسخ دهید.',
    'پاسخ صحیح را در جای مشخص‌شده بنویسید.',
    'پاسخ سؤال را در یک عبارت کوتاه بیان کنید.',
  ],
  'جورکردنی': [
    'موارد ستون «الف» را به گزینه مناسب در ستون «ب» وصل کنید.',
    'موارد مرتبط را به یکدیگر متصل کنید.',
    'هر مورد را با پاسخ مناسب خود تطبیق دهید.',
    'موارد ستون‌های زیر را با یکدیگر مطابقت دهید.',
  ],
  'انتخاب-کلمه': [
    'کلمه مناسب را از میان گزینه‌ها انتخاب کنید.',
    'کلمه صحیح را انتخاب و در جای خود قرار دهید.',
  ],
}

// ---------- فیلدهای جدید BuilderQuestion ----------
export interface BuilderQuestionOverrides {
  fontSize?: number
  fontFamily?: string
  scale?: number
  noDashLine?: boolean
  editedQuestionHtml?: string
}

// ---------- فیلدهای جدید BuilderSettings ----------
export interface BuilderSettingsAdditions {
  defaultScoreByType: Record<string, string>
  globalFontFamily: string
  rowColumnWidth: ColumnWidthSetting
  scoreColumnWidth: ColumnWidthSetting
  groupInstructions: Record<string, string>
}

export const DEFAULT_SETTINGS_ADDITIONS: BuilderSettingsAdditions = {
  defaultScoreByType: { ...DEFAULT_SCORE_BY_TYPE },
  globalFontFamily: 'inherit',
  rowColumnWidth: { preset: 'standard' },
  scoreColumnWidth: { preset: 'standard' },
  groupInstructions: {},
}

// ---------- لیست فونت‌های پیشنهادی ----------
export const FONT_FAMILY_OPTIONS: { label: string; value: string }[] = [
  { label: 'پیش‌فرض سیستم', value: 'inherit' },
  { label: 'ایران‌سنس', value: "'IRANSans', Tahoma, sans-serif" },
  { label: 'وزیر', value: "'Vazirmatn', Tahoma, sans-serif" },
  { label: 'بی‌نازنین', value: "'B Nazanin', Tahoma, sans-serif" },
  { label: 'میتراپیک', value: "'Mitra', Tahoma, sans-serif" },
]