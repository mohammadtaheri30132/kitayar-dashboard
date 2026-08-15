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
// تنظیمات نمایش برگه (طراحی جدولی واقعی امتحان)
// ==============================
export interface BuilderSettings {
  optionLabelFormat: OptionLabelFormat
  /** گزینه‌ها در یک خط پشت‌سرهم (مثل برگه امتحان واقعی) یا در گرید دوستونه */
  optionsLayout: 'inline' | 'grid'
  groupingMode: 'grouped' | 'individual'
  showScore: boolean
  showQuestionNumber: boolean
  showBismillah: boolean
  /** متن پایانی زیر جدول، مثلاً «موفق و سرفراز باشید». خالی = نمایش داده نشود */
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

// ---------- قالب‌های آماده هدر (۴ نوع) ----------
export interface HeaderTemplate {
  key: string
  label: string
  icon: string
  description: string
  build: () => Partial<BuilderHeader>
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
  description: 'سربرگ رسمی آزمون هماهنگ با محل مهر و امضا',
  build: () => ({
    title: '',
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
      bismillahRight: 'بسمه تعالی',
      bismillahLeft: 'بسمه تعالی',
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

// ---------- متن‌های نمونه دستور سوال (به تفکیک نوع) ----------
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

// ---------- فیلدهای جدید BuilderQuestion (اضافه به تایپ فعلی) ----------
export interface BuilderQuestionOverrides {
  fontSize?: number        // px — سایز فونت اختصاصی این سوال
  fontFamily?: string      // فونت اختصاصی این سوال
  scale?: number           // 0.8 تا 1.4 — بزرگ/کوچک کردن کل بلوک سوال
  noDashLine?: boolean     // برای نوع «جاخالی» — true یعنی بدون خط‌چین
  editedQuestionHtml?: string  // اگر کاربر متن سوال را در پیش‌نمایش ادیت کرد
}
// یعنی در question-builder.ts:
// export interface BuilderQuestion extends BuilderQuestionOverrides { ... بقیه فیلدهای قبلی }

// ---------- فیلدهای جدید BuilderSettings (اضافه به تایپ فعلی) ----------
export interface BuilderSettingsAdditions {
  defaultScoreByType: Record<string, string>
  globalFontFamily: string
  rowColumnWidth: ColumnWidthSetting
  scoreColumnWidth: ColumnWidthSetting
  groupInstructions: Record<string, string> // متن دستورِ زیر هر گروه، به تفکیک نوع
}
// یعنی در question-builder.ts:
// export interface BuilderSettings extends BuilderSettingsAdditions { ... بقیه فیلدهای قبلی }

export const DEFAULT_SETTINGS_ADDITIONS: BuilderSettingsAdditions = {
  defaultScoreByType: { ...DEFAULT_SCORE_BY_TYPE },
  globalFontFamily: 'inherit',
  rowColumnWidth: { preset: 'standard' },
  scoreColumnWidth: { preset: 'standard' },
  groupInstructions: {},
}
// یعنی در DEFAULT_SETTINGS موجودت این‌ها را هم spread کن:
// export const DEFAULT_SETTINGS: BuilderSettings = { ...DEFAULT_SETTINGS_ADDITIONS, /* بقیه فیلدهای قبلی */ }

// ---------- لیست فونت‌های پیشنهادی ----------
export const FONT_FAMILY_OPTIONS: { label: string; value: string }[] = [
  { label: 'پیش‌فرض سیستم', value: 'inherit' },
  { label: 'ایران‌سنس', value: "'IRANSans', Tahoma, sans-serif" },
  { label: 'وزیر', value: "'Vazirmatn', Tahoma, sans-serif" },
  { label: 'بی‌نازنین', value: "'B Nazanin', Tahoma, sans-serif" },
  { label: 'میتراپیک', value: "'Mitra', Tahoma, sans-serif" },
]