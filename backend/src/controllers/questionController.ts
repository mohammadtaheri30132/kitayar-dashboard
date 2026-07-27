import { Request, Response } from 'express'
import { Question } from '../models/Question.js'
import { Book } from '../models/Book.js'
import { Grade } from '../models/Grade.js'
import { Course } from '../models/Course.js'
import { AuthRequest } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'
import { v4 as uuidv4 } from 'uuid'

// ==================== نرمال‌سازی مقادیر ====================

const DIFFICULTY_MAP: Record<string, string> = {
  'سخت': 'دشوار', 'hard': 'دشوار', 'difficult': 'دشوار',
  'easy': 'ساده', 'آسان': 'ساده',
  'medium': 'متوسط', 'normal': 'متوسط',
}

// نگاشت type های معروف ولی با فرمت‌های متفاوت
const TYPE_ALIASES: Record<string, string> = {
  'انتخاب کلمه': 'انتخاب-کلمه', 'انتخاب‌کلمه': 'انتخاب-کلمه',
  'چندگزینه ای': 'تستی', 'چندگزینه‌ای': 'تستی', 'چند گزینه ای': 'تستی',
  'چند گزینه‌ای': 'تستی', 'تست': 'تستی',
  'صحیح غلط': 'صحیح-غلط', 'صحیح و غلط': 'صحیح-غلط',
  'جای خالی': 'جاخالی', 'جای‌خالی': 'جاخالی', 'جا خالی': 'جاخالی',
  'کوتاه پاسخ': 'کوتاه-پاسخ', 'کوتاه': 'کوتاه-پاسخ',
  'گسترده پاسخ': 'گسترده-پاسخ', 'گسترده': 'گسترده-پاسخ', 'تشریحی': 'گسترده-پاسخ',
  'جور کردنی': 'جورکردنی', 'جور': 'جورکردنی',
  'انتخاب': 'انتخاب-کلمه',
}

const VALID_TYPES = ['تستی', 'جاخالی', 'صحیح-غلط', 'کوتاه-پاسخ', 'گسترده-پاسخ', 'جورکردنی', 'انتخاب-کلمه', 'ترکیبی']
const VALID_DIFFICULTIES = ['ساده', 'متوسط', 'دشوار']

/**
 * نرمال‌سازی difficulty:
 * - اگر دقیقاً معتبر بود → همون
 * - اگر توی MAP بود → معادلش
 * - در غیر اینصورت → null (یعنی نامعتبر)
 */
function normalizeDifficulty(input: any): string | null {
  if (!input) return null
  const str = String(input).trim()
  if (VALID_DIFFICULTIES.includes(str)) return str
  
  // چک با ignore case و space
  const lower = str.toLowerCase().replace(/\s+/g, '')
  for (const [key, value] of Object.entries(DIFFICULTY_MAP)) {
    if (key.toLowerCase().replace(/\s+/g, '') === lower) return value
  }
  
  return null
}

/**
 * نرمال‌سازی type:
 * - اگر دقیقاً معتبر بود → همون
 * - اگر توی ALIASES بود → معادلش
 * - برای ترکیبی: اگه sub داره → ترکیبی
 * - در غیر اینصورت → null (یعنی نامعتبر - خطای ساختاری)
 */
function normalizeType(input: any, hasSub: boolean = false): string | null {
  if (!input) {
    if (hasSub) return 'ترکیبی'
    return null
  }
  
  const str = String(input).trim()
  
  // اگه sub داره، همیشه ترکیبی
  if (hasSub) return 'ترکیبی'
  
  // اگر دقیقاً توی لیست معتبره
  if (VALID_TYPES.includes(str)) return str
  
  // چک alias ها
  const cleaned = str.replace(/\s+/g, ' ').trim()
  if (TYPE_ALIASES[cleaned]) return TYPE_ALIASES[cleaned]
  
  // چک با ignore case
  const lower = cleaned.toLowerCase()
  for (const [key, value] of Object.entries(TYPE_ALIASES)) {
    if (key.toLowerCase() === lower) return value
  }
  
  // نامعتبر
  return null
}

/**
 * نرمال‌سازی question:
 * - برای جورکردنی خالی → متن پیش‌فرض
 * - برای صحیح-غلط خالی → متن پیش‌فرض
 */
function normalizeQuestion(question: any, type: string): string {
  if (question && String(question).trim()) return String(question).trim()
  
  if (type === 'جورکردنی') {
    return '<p dir="rtl">موارد ستون «الف» را با گزینه‌های مناسب از ستون «ب» تطبیق دهید.</p>'
  }
  if (type === 'صحیح-غلط') {
    return '<p dir="rtl">درستی یا نادرستی عبارت زیر را مشخص کنید.</p>'
  }
  
  return ''
}

// ==================== helpers ====================

function parsePageNumbers(input: any): number[] {
  if (input === undefined || input === null || input === '') return []
  if (Array.isArray(input)) return input.map(Number).filter(n => !isNaN(n) && n > 0)
  let str = String(input).trim()
  if (!str) return []
  const rangeMatch = str.match(/^(\d+)\s*-\s*(\d+)$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]), end = parseInt(rangeMatch[2])
    if (start > 0 && end >= start) return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  const parts = str.split(/[,،و/\\\s]+/).filter(Boolean)
  return parts.map(p => parseInt(p.replace(/[^\d]/g, ''))).filter(n => !isNaN(n) && n > 0)
}

function processSubQuestions(subs: any[]): any[] {
  if (!subs || !Array.isArray(subs)) return []
  return subs.map(s => ({
    sub_id: s.sub_id || String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    type: normalizeType(s.type, false) || 'کوتاه-پاسخ', // sub type fallback به کوتاه-پاسخ
    question: s.question || '',
    options: s.options || [],
    page_number: parsePageNumbers(s.page_number),
    answer: s.answer || '',
  }))
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
}

async function isDuplicate(question: string, type: string, bookId: string): Promise<boolean> {
  const stripped = stripHtml(question)
  const existing = await Question.findOne({
    book: bookId,
    type: type,
    question: { $regex: stripped.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    isActive: true,
  })
  return !!existing
}

// ==================== controllers ====================

export const getQuestionsByBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params
    const { page = '1', limit = '20', type, difficulty, search } = req.query
    const pageNum = parseInt(page as string) || 1, limitNum = parseInt(limit as string) || 20, skip = (pageNum - 1) * limitNum
    const filter: any = { book: bookId, isActive: true }
    if (type && type !== 'همه') filter.type = type
    if (difficulty) filter.difficulty = difficulty
    if (search) filter.question = { $regex: search, $options: 'i' }
    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).select('-__v').lean(),
      Question.countDocuments(filter),
    ])
    res.json({ success: true, count: questions.length, total, totalPages: Math.ceil(total / limitNum), currentPage: pageNum, data: questions })
  } catch (e: any) { logger.error('❌', e.message); res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = await Question.findById(req.params.id).populate('book grade course createdBy', 'name icon code fullName username')
    if (!q) { res.status(404).json({ success: false, message: '⚠️ سوال یافت نشد' }); return }
    res.json({ success: true, data: q })
  } catch (e: any) { res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answer, book: bookId, question_id, sub } = req.body
    if (!bookId) { res.status(400).json({ success: false, message: '⚠️ درس الزامی است' }); return }

    const hasSub = sub && Array.isArray(sub) && sub.length > 0
    const type = normalizeType(req.body.type, hasSub)
    
    if (!type) { res.status(400).json({ success: false, message: `⚠️ نوع سوال "${req.body.type}" نامعتبر است`, error: 'INVALID_TYPE' }); return }
    
    const difficulty = normalizeDifficulty(req.body.difficulty)
    if (!difficulty) { res.status(400).json({ success: false, message: `⚠️ درجه سختی "${req.body.difficulty}" نامعتبر است`, error: 'INVALID_DIFFICULTY' }); return }

    const question = normalizeQuestion(req.body.question, type)
    if (!question) { res.status(400).json({ success: false, message: '⚠️ صورت سوال الزامی است' }); return }

    if (question_id) {
      const existing = await Question.findOne({ question_id })
      if (existing) { res.status(409).json({ success: false, message: '⚠️ شناسه تکراری' }); return }
    }

    const dup = await isDuplicate(question, type, bookId)
    if (dup) { res.status(409).json({ success: false, message: '⚠️ سوال تکراری' }); return }

    const book = await Book.findById(bookId).populate('grade')
    if (!book) { res.status(404).json({ success: false, message: '⚠️ درس یافت نشد' }); return }
    const grade = await Grade.findById(book.grade).populate('course')

    await Question.create({
      question_id: question_id || uuidv4(), book: bookId, grade: grade?._id || book.grade, course: grade?.course,
      type, difficulty, question,
      options: req.body.options || [], matching_left: req.body.matching_left || [], matching_right: req.body.matching_right || [],
      answer: type === 'ترکیبی' ? '' : (answer || ''),
      lesson_id: req.body.lesson_id || 1, page_number: parsePageNumbers(req.body.page_number),
      source_image: req.body.source_image || '', createdBy: req.user!._id,
      is_composite: type === 'ترکیبی',
      sub: type === 'ترکیبی' ? processSubQuestions(sub) : [],
    })
    await Book.findByIdAndUpdate(bookId, { $inc: { totalQuestions: 1 } })
    if (grade) {
      await Grade.findByIdAndUpdate(grade._id, { $inc: { totalQuestions: 1 } })
      await Course.findByIdAndUpdate(grade.course, { $inc: { totalQuestions: 1 } })
    }
    res.status(201).json({ success: true, message: '✅ سوال ایجاد شد', data: {} })
  } catch (error: any) {
    if (error.code === 11000) { res.status(409).json({ success: false, message: '⚠️ شناسه تکراری' }); return }
    logger.error('❌', error.message); res.status(500).json({ success: false, message: '❌ خطا' })
  }
}

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = await Question.findById(req.params.id)
    if (!q) { res.status(404).json({ success: false, message: '⚠️ سوال یافت نشد' }); return }
    const allowed = ['options', 'matching_left', 'matching_right', 'answer', 'lesson_id', 'source_image']
    allowed.forEach(f => { if (req.body[f] !== undefined) (q as any)[f] = req.body[f] })
    if (req.body.type) {
      const hasSub = req.body.sub && Array.isArray(req.body.sub) && req.body.sub.length > 0
      const t = normalizeType(req.body.type, hasSub)
      if (!t) { res.status(400).json({ success: false, message: `⚠️ نوع سوال "${req.body.type}" نامعتبر است` }); return }
      q.type = t
    }
    if (req.body.difficulty) {
      const d = normalizeDifficulty(req.body.difficulty)
      if (!d) { res.status(400).json({ success: false, message: `⚠️ درجه سختی "${req.body.difficulty}" نامعتبر است` }); return }
      q.difficulty = d
    }
    if (req.body.question !== undefined) q.question = normalizeQuestion(req.body.question, q.type)
    if (req.body.page_number !== undefined) q.page_number = parsePageNumbers(req.body.page_number)
    q.is_composite = q.type === 'ترکیبی'
    if (q.is_composite) { q.sub = processSubQuestions(req.body.sub); if (!req.body.answer) q.answer = '' }
    await q.save()
    res.json({ success: true, message: '✅ ویرایش شد', data: q })
  } catch (e: any) { res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = await Question.findById(req.params.id)
    if (!q) { res.status(404).json({ success: false, message: '⚠️ سوال یافت نشد' }); return }
    await Book.findByIdAndUpdate(q.book, { $inc: { totalQuestions: -1 } })
    await Grade.findByIdAndUpdate(q.grade, { $inc: { totalQuestions: -1 } })
    await Course.findByIdAndUpdate(q.course, { $inc: { totalQuestions: -1 } })
    await q.deleteOne()
    res.json({ success: true, message: '✅ حذف شد' })
  } catch (e: any) { res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const importQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questions, bookId } = req.body
    if (bookId && questions && Array.isArray(questions)) {
      let success = 0
      const failed: any[] = []

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        try {
          const hasSub = q.sub && Array.isArray(q.sub) && q.sub.length > 0
          const actualType = normalizeType(q.type, hasSub)
          
          // خطای ساختاری: type نامعتبر
          if (!actualType) {
            failed.push({
              index: i + 1, question_id: q.question_id || 'بدون شناسه',
              type: q.type || '(خالی)', question: (q.question || '').substring(0, 200),
              fullJson: JSON.stringify(q, null, 2),
              reason: `نوع سوال "${q.type}" نامعتبر است. انواع معتبر: ${VALID_TYPES.join('، ')}`,
              errorType: 'INVALID_TYPE',
            })
            continue
          }

          const actualDifficulty = normalizeDifficulty(q.difficulty)
          
          // خطای ساختاری: difficulty نامعتبر
          if (!actualDifficulty) {
            failed.push({
              index: i + 1, question_id: q.question_id || 'بدون شناسه',
              type: actualType, question: (q.question || '').substring(0, 200),
              fullJson: JSON.stringify(q, null, 2),
              reason: `درجه سختی "${q.difficulty}" نامعتبر است. مقادیر معتبر: ساده، متوسط، دشوار`,
              errorType: 'INVALID_DIFFICULTY',
            })
            continue
          }

          const actualQuestion = normalizeQuestion(q.question, actualType)
          if (!actualQuestion) {
            failed.push({
              index: i + 1, question_id: q.question_id || 'بدون شناسه', type: actualType,
              question: '(خالی)', fullJson: JSON.stringify(q, null, 2),
              reason: 'صورت سوال خالی است',
              errorType: 'EMPTY_QUESTION',
            })
            continue
          }

          // چک تکراری question_id
          if (q.question_id) {
            const existingId = await Question.findOne({ question_id: q.question_id })
            if (existingId) {
              failed.push({
                index: i + 1, question_id: q.question_id, type: actualType,
                question: actualQuestion.substring(0, 200), fullJson: JSON.stringify(q, null, 2),
                reason: 'شناسه تکراری - قبلاً در دیتابیس ثبت شده', errorType: 'DUPLICATE_ID',
              })
              continue
            }
          }

          // چک تکراری question + type + book
          const dup = await isDuplicate(actualQuestion, actualType, bookId)
          if (dup) {
            failed.push({
              index: i + 1, question_id: q.question_id || 'بدون شناسه', type: actualType,
              question: actualQuestion.substring(0, 200), fullJson: JSON.stringify(q, null, 2),
              reason: `صورت سوال + نوع "${actualType}" تکراری است`, errorType: 'DUPLICATE_CONTENT',
            })
            continue
          }

          const book = await Book.findById(bookId).populate('grade')
          if (!book) {
            failed.push({
              index: i + 1, question_id: q.question_id || 'بدون شناسه', type: actualType,
              question: actualQuestion.substring(0, 200), fullJson: JSON.stringify(q, null, 2),
              reason: 'درس انتخاب شده یافت نشد', errorType: 'BOOK_NOT_FOUND',
            })
            continue
          }

          const grade = await Grade.findById(book.grade)

          await Question.create({
            question_id: q.question_id || uuidv4(), book: bookId, grade: book.grade, course: grade?.course,
            type: actualType, difficulty: actualDifficulty, question: actualQuestion,
            options: q.options || [], matching_left: q.matching_left || [], matching_right: q.matching_right || [],
            answer: actualType === 'ترکیبی' ? '' : (q.answer || ''),
            lesson_id: q.lesson_id || 1, page_number: parsePageNumbers(q.page_number),
            source_image: q.source_image || '', createdBy: req.user!._id,
            is_composite: actualType === 'ترکیبی',
            sub: actualType === 'ترکیبی' ? processSubQuestions(q.sub) : [],
          })
          success++
        } catch (err: any) {
          let reason = err.message || 'خطای ناشناخته', errorType = 'UNKNOWN'
          if (err.code === 11000) { reason = 'کلید تکراری'; errorType = 'DUPLICATE_KEY' }
          else if (err.name === 'ValidationError') {
            const msgs = Object.values(err.errors || {}).map((e: any) => e.message).join('، ')
            reason = `خطای اعتبارسنجی: ${msgs}`; errorType = 'VALIDATION'
          }
          failed.push({
            index: i + 1, question_id: q.question_id || 'بدون شناسه',
            type: q.type || 'نامشخص', question: (q.question || '').substring(0, 200),
            fullJson: JSON.stringify(q, null, 2), reason, errorType,
          })
        }
      }

      const count = await Question.countDocuments({ book: bookId, isActive: true })
      const book = await Book.findByIdAndUpdate(bookId, { totalQuestions: count })
      if (book) {
        await Grade.findByIdAndUpdate(book.grade, { totalQuestions: await Question.countDocuments({ grade: book.grade, isActive: true }) })
        const g = await Grade.findById(book.grade)
        if (g) await Course.findByIdAndUpdate(g.course, { totalQuestions: await Question.countDocuments({ course: g.course, isActive: true }) })
      }

      logger.info(`✅ ایمپورت: ${success} موفق, ${failed.length} ناموفق`)
      res.json({
        success: true,
        message: `✅ ${success} سوال import شد (${failed.length} ناموفق)`,
        data: { success, failed: failed.length, total: questions.length, failedItems: failed },
      })
      return
    }
    res.status(400).json({ success: false, message: '⚠️ فرمت نامعتبر' })
  } catch (e: any) { logger.error('❌', e.message); res.status(500).json({ success: false, message: '❌ خطا' }) }
}
