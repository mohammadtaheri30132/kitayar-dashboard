/**
 * ================================================================
 * این فایل را جداگانه اضافه نکن! محتویاتش را داخل
 * src/types/question-builder.ts موجودت "merge" کن.
 * هرچیزی که این‌جاست، اضافه‌شونده به تایپ‌های فعلی توست
 * (BuilderQuestion / BuilderHeader / BuilderSettings / DEFAULT_SETTINGS)
 * ================================================================
 */

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
  build: () => { title: string; subtitle?: string; fields: { label: string; value: string }[] }
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

// فقط این دو نوع سوال «ارتفاع قابل‌تنظیم» دارند — بقیه همیشه به‌اندازه محتوای واقعی‌شان رندر می‌شوند
export const HEIGHT_ADJUSTABLE_TYPES: string[] = ['گسترده-پاسخ', 'کوتاه-پاسخ']

// گزینه‌های ارتفاع بلوک برای select — حول یک مقدار پایه (پیش‌فرض نوع سوال یا مقدار فعلی)
// مثلاً برای پایه ۱۵۰: 135، 140، 145، 150، 155، 160، 165، 170، 175
export const buildHeightOptions = (base: number): number[] => {
  const offsets = [-15, -10, -5, 0, 5, 10, 15, 20, 25]
  const values = offsets.map(o => Math.max(MIN_BLOCK_HEIGHT, base + o))
  return Array.from(new Set(values)).sort((a, b) => a - b)
}

// لیست سایزهای رایج فونت برای select
export const FONT_SIZE_OPTIONS: number[] = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24]

// ---------- حالت خط جداکننده بین سوالات ----------
// خط جداکننده بین بخش‌ها (گروه‌ها) تحت هر شرایطی نمایش داده می‌شود.
// این تنظیم فقط مربوط به خط جداکننده بین سوالات داخل یک بخش است.
export const QUESTION_DIVIDER_DEFAULT = true

// ---------- فیلدهای جدید BuilderQuestion (اضافه به تایپ فعلی) ----------
export interface BuilderQuestionOverrides {
  fontSize?: number        // px — سایز فونت اختصاصی این سوال
  fontFamily?: string      // فونت اختصاصی این سوال
  blockHeight?: number     // px — حداقل ارتفاع بلوک این سوال (نه بزرگ‌نمایی محتوا)
  noDashLine?: boolean     // برای نوع «جاخالی» — true یعنی بدون خط‌چین
  editedQuestionHtml?: string  // اگر کاربر متن سوال را در پیش‌نمایش ادیت کرد
}
// یعنی در question-builder.ts:
// export interface BuilderQuestion extends BuilderQuestionOverrides { ... بقیه فیلدهای قبلی }

// ---------- فیلدهای جدید BuilderSettings (اضافه به تایپ فعلی) ----------
export interface BuilderSettingsAdditions {
  defaultScoreByType: Record<string, string>
  defaultHeightByType: Record<string, number>
  questionsFontFamily: string   // فونت پیش‌فرض متن سوالات — پیش‌فرض: B Nazanin
  headerFontFamily: string      // فونت جدول هدر برگه (عنوان/فیلدها) — پیش‌فرض: B Nazanin
  groupTitleFontFamily: string  // فونت عنوان بخش‌بندی (نوار بولد بالای هر بخش) — پیش‌فرض: B Titr Bold
  baseFontSize: number       // سایز پایه فونت سوالات، px
  rowColumnWidth: ColumnWidthSetting
  scoreColumnWidth: ColumnWidthSetting
  groupInstructions: Record<string, string> // متن دستورِ زیر هر گروه، به تفکیک نوع
  essayAnswerLines: boolean   // برای سوالات تشریحی: خط‌دار باشد یا نه
  shortAnswerLine: boolean    // برای سوالات کوتاه‌پاسخ: خط‌چین داشته باشد یا نه
  questionDivider: boolean    // خط جداکننده بین هر سوال (خط جداکننده بین بخش‌ها همیشه هست، مستقل از این)
}
// یعنی در question-builder.ts:
// export interface BuilderSettings extends BuilderSettingsAdditions { ... بقیه فیلدهای قبلی }
// نکته: showQuestionNumber و showScore از قبل در BuilderSettings موجودت هستند —
// همان‌ها را برای نمایش/عدم‌نمایش ستون «ردیف» و «بارم» استفاده کن (چیز جدیدی برایشان نساختیم).
// نکته مهاجرت: globalFontFamily قبلی حذف و با questionsFontFamily جایگزین شد.

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
// یعنی در DEFAULT_SETTINGS موجودت این‌ها را هم spread کن:
// export const DEFAULT_SETTINGS: BuilderSettings = { ...DEFAULT_SETTINGS_ADDITIONS, /* بقیه فیلدهای قبلی */ }

// ---------- فونت‌های قابل‌انتخاب برای سوال‌ها/هدر/عنوان بخش (همان‌هایی که در fonts.css تعریف کردیم) ----------
export const FONT_FAMILY_OPTIONS: { label: string; value: string }[] = [
  { label: 'بی‌نازنین (B Nazanin)', value: EXAM_FONT_NAZANIN },
  { label: 'میترا (B Mitra)', value: EXAM_FONT_MITRA },
  { label: 'میترا بولد (B Mitra Bold)', value: EXAM_FONT_MITRA_BOLD },
  { label: 'تیتر بولد (B Titr Bold)', value: EXAM_FONT_TITR_BOLD },
]