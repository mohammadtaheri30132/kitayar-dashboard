export type QuestionType =
  | 'گسترده-پاسخ' | 'کوتاه-پاسخ' | 'جاخالی' | 'صحیح-غلط'
  | 'تستی' | 'جورکردنی' | 'انتخاب-کلمه' | 'ترکیبی'

export type Difficulty = 'ساده' | 'متوسط' | 'دشوار'

export interface SubQuestion {
  sub_id: string
  type: QuestionType
  question: string
  options: string[]
  page_number: number[]
  answer: string
}

export interface QuestionDraft {
  question_id: string
  source_image: string
  type: QuestionType | null
  difficulty: Difficulty
  question: string
  options: string[]
  matching_left: string[]
  matching_right: string[]
  lesson_id: number | ''
  page_number: number[] | ''
  answer: string
  is_composite?: boolean
  sub?: SubQuestion[]
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  'گسترده-پاسخ': 'تشریحی (گسترده‌پاسخ)',
  'کوتاه-پاسخ': 'کوتاه‌پاسخ',
  'جاخالی': 'جای خالی',
  'صحیح-غلط': 'صحیح / غلط',
  'تستی': 'چندگزینه‌ای (تستی)',
  'جورکردنی': 'جورکردنی',
  'انتخاب-کلمه': 'انتخاب کلمه',
  'ترکیبی': 'ترکیبی (چند بخشی)',
}

export const TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  'گسترده-پاسخ': 'پاسخ تشریحی و کامل با ادیتور متنی',
  'کوتاه-پاسخ': 'پاسخ کوتاه با ادیتور متنی',
  'جاخالی': 'صورت سوال با یک جای خالی',
  'صحیح-غلط': 'گزاره صحیح یا غلط',
  'تستی': 'چند گزینه با یک پاسخ صحیح',
  'جورکردنی': 'ارتباط دو ستون',
  'انتخاب-کلمه': 'انتخاب کلمه صحیح از گزینه‌ها',
  'ترکیبی': 'صورت سوال اصلی + چند زیرسوال از انواع مختلف',
}

export const ALL_TYPES: QuestionType[] = [
  'تستی', 'انتخاب-کلمه', 'جاخالی', 'صحیح-غلط',
  'کوتاه-پاسخ', 'گسترده-پاسخ', 'جورکردنی', 'ترکیبی',
]
