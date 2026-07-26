export type QuestionType =
  | 'گسترده-پاسخ'
  | 'کوتاه-پاسخ'
  | 'جاخالی'
  | 'صحیح-غلط'
  | 'تستی'
  | 'جورکردنی'

export type Difficulty = 'ساده' | 'متوسط' | 'دشوار'

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
  page_number: number | ''
  answer: string
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  'گسترده-پاسخ': 'تشریحی (گسترده‌پاسخ)',
  'کوتاه-پاسخ': 'کوتاه‌پاسخ',
  'جاخالی': 'جای خالی',
  'صحیح-غلط': 'صحیح / غلط',
  'تستی': 'چندگزینه‌ای (تستی)',
  'جورکردنی': 'جورکردنی',
}

export const TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  'گسترده-پاسخ': 'پاسخ تشریحی و کامل با ادیتور متنی',
  'کوتاه-پاسخ': 'پاسخ کوتاه با ادیتور متنی',
  'جاخالی': 'صورت سوال با یک جای خالی مشخص‌شده با نقطه‌چین',
  'صحیح-غلط': 'گزاره‌ای که باید صحیح یا غلط بودنش مشخص شود',
  'تستی': 'سوال با چند گزینه و یک پاسخ صحیح',
  'جورکردنی': 'ارتباط‌دادن موارد دو ستون به هم',
}

export const ALL_TYPES: QuestionType[] = [
  'تستی',
  'جاخالی',
  'صحیح-غلط',
  'کوتاه-پاسخ',
  'گسترده-پاسخ',
  'جورکردنی',
]