import { Request, Response } from 'express'
import { Question } from '../models/Question.js'
import { Book } from '../models/Book.js'
import { Grade } from '../models/Grade.js'
import { Course } from '../models/Course.js'
import { AuthRequest } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'
import { v4 as uuidv4 } from 'uuid'

const DIFFICULTY_MAP: Record<string, string> = { 'سخت': 'دشوار', 'hard': 'دشوار', 'difficult': 'دشوار', 'easy': 'ساده', 'آسان': 'ساده', 'medium': 'متوسط', 'normal': 'متوسط' }
const TYPE_ALIASES: Record<string, string> = {
  'انتخاب کلمه': 'انتخاب-کلمه', 'انتخاب‌کلمه': 'انتخاب-کلمه', 'چندگزینه ای': 'تستی', 'چندگزینه‌ای': 'تستی',
  'چند گزینه ای': 'تستی', 'تست': 'تستی', 'صحیح غلط': 'صحیح-غلط', 'صحیح و غلط': 'صحیح-غلط',
  'جای خالی': 'جاخالی', 'جای‌خالی': 'جاخالی', 'جا خالی': 'جاخالی',
  'کوتاه پاسخ': 'کوتاه-پاسخ', 'کوتاه': 'کوتاه-پاسخ', 'گسترده پاسخ': 'گسترده-پاسخ', 'گسترده': 'گسترده-پاسخ', 'تشریحی': 'گسترده-پاسخ',
  'جور کردنی': 'جورکردنی', 'جور': 'جورکردنی', 'انتخاب': 'انتخاب-کلمه',
}
const VALID_TYPES = ['تستی', 'جاخالی', 'صحیح-غلط', 'کوتاه-پاسخ', 'گسترده-پاسخ', 'جورکردنی', 'انتخاب-کلمه', 'ترکیبی']
const VALID_DIFFICULTIES = ['ساده', 'متوسط', 'دشوار']
const VALID_STATUSES = ['در-حال-بررسی', 'تایید-شده', 'مشکل-دار']

// تایپ‌هایی که چک تکراری براشون انجام نمیشه
const SKIP_DUPLICATE_CHECK_TYPES = ['جورکردنی']

function normalizeDifficulty(input: any): string | null {
  if (!input) return null
  const str = String(input).trim()
  if (VALID_DIFFICULTIES.includes(str)) return str
  const lower = str.toLowerCase().replace(/\s+/g, '')
  for (const [k, v] of Object.entries(DIFFICULTY_MAP)) { if (k.toLowerCase().replace(/\s+/g, '') === lower) return v }
  return null
}

function normalizeType(input: any, hasSub: boolean = false): string | null {
  if (!input) return hasSub ? 'ترکیبی' : null
  const str = String(input).trim()
  if (hasSub) return 'ترکیبی'
  if (VALID_TYPES.includes(str)) return str
  const cleaned = str.replace(/\s+/g, ' ').trim()
  if (TYPE_ALIASES[cleaned]) return TYPE_ALIASES[cleaned]
  const lower = cleaned.toLowerCase()
  for (const [k, v] of Object.entries(TYPE_ALIASES)) { if (k.toLowerCase() === lower) return v }
  return null
}

function normalizeQuestion(question: any, type: string): string {
  if (question && String(question).trim()) return String(question).trim()
  if (type === 'جورکردنی') return '<p dir="rtl">موارد ستون «الف» را با گزینه‌های مناسب از ستون «ب» تطبیق دهید.</p>'
  if (type === 'صحیح-غلط') return '<p dir="rtl">درستی یا نادرستی عبارت زیر را مشخص کنید.</p>'
  return ''
}

function parsePageNumbers(input: any): number[] {
  if (input === undefined || input === null || input === '') return []
  if (Array.isArray(input)) return input.map(Number).filter(n => !isNaN(n) && n > 0)
  let str = String(input).trim(); if (!str) return []
  const rangeMatch = str.match(/^(\d+)\s*-\s*(\d+)$/)
  if (rangeMatch) { const s = parseInt(rangeMatch[1]), e = parseInt(rangeMatch[2]); if (s > 0 && e >= s) return Array.from({ length: e - s + 1 }, (_, i) => s + i) }
  return str.split(/[,،و/\\\s]+/).filter(Boolean).map(p => parseInt(p.replace(/[^\d]/g, ''))).filter(n => !isNaN(n) && n > 0)
}

function processSubQuestions(subs: any[]): any[] {
  if (!subs || !Array.isArray(subs)) return []
  return subs.map(s => ({ sub_id: s.sub_id || String.fromCharCode(97 + Math.floor(Math.random() * 26)), type: normalizeType(s.type, false) || 'کوتاه-پاسخ', question: s.question || '', options: s.options || [], page_number: parsePageNumbers(s.page_number), answer: s.answer || '' }))
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

async function isDuplicate(question: string, type: string, bookId: string): Promise<boolean> {
  // جورکردنی و ترکیبی چک نشن
  if (SKIP_DUPLICATE_CHECK_TYPES.includes(type)) return false
  const stripped = stripHtml(question)
  const existing = await Question.findOne({ book: bookId, type, isActive: true, question: { $regex: stripped.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } })
  return !!existing
}

// ==================== Force Import ====================
export const forceImportQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = req.body
    const bookId = q.book || req.body.bookId
    if (!bookId) { res.status(400).json({ success: false, message: '⚠️ درس الزامی است' }); return }

    const hasSub = q.sub && Array.isArray(q.sub) && q.sub.length > 0
    const type = normalizeType(q.type, hasSub) || 'تستی'
    const difficulty = normalizeDifficulty(q.difficulty) || 'متوسط'
    const question = normalizeQuestion(q.question, type) || q.question || ''

    const book = await Book.findById(bookId).populate('grade')
    if (!book) { res.status(404).json({ success: false, message: '⚠️ درس یافت نشد' }); return }
    const grade = await Grade.findById(book.grade)

    // force import: Generate new question_id to avoid duplicate key
    const newId = uuidv4()

    const created = await Question.create({
      question_id: newId, book: bookId, grade: book.grade, course: grade?.course,
      type, difficulty, question,
      options: q.options || [], matching_left: q.matching_left || [], matching_right: q.matching_right || [],
      answer: type === 'ترکیبی' ? '' : (q.answer || ''),
      lesson_id: q.lesson_id || 1, page_number: parsePageNumbers(q.page_number),
      source_image: q.source_image || '', createdBy: req.user!._id,
      is_composite: type === 'ترکیبی', sub: type === 'ترکیبی' ? processSubQuestions(q.sub) : [],
      status: 'در-حال-بررسی', tags: [],
    })

    await Book.findByIdAndUpdate(bookId, { $inc: { totalQuestions: 1 } })
    if (grade) { await Grade.findByIdAndUpdate(grade._id, { $inc: { totalQuestions: 1 } }); await Course.findByIdAndUpdate(grade.course, { $inc: { totalQuestions: 1 } }) }

    res.status(201).json({ success: true, message: '✅ سوال با شناسه جدید اضافه شد', data: created })
  } catch (error: any) {
    logger.error('❌ force import:', error.message)
    res.status(500).json({ success: false, message: '❌ خطا در افزودن اجباری' })
  }
}

// ==================== controllers ====================

export const getQuestionsByBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params
    const { page = '1', limit = '50', type, difficulty, status, search } = req.query
    const pageNum = parseInt(page as string) || 1, limitNum = parseInt(limit as string) || 50, skip = (pageNum - 1) * limitNum
    const filter: any = { book: bookId, isActive: true }
    if (type && type !== 'همه') filter.type = type
    if (difficulty) filter.difficulty = difficulty
    if (status && status !== 'همه') filter.status = status
    if (search) filter.question = { $regex: search, $options: 'i' }
    const [questions, total] = await Promise.all([Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).select('-__v').lean(), Question.countDocuments(filter)])
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
    const { answer, book: bookId, question_id, sub, tags } = req.body
    if (!bookId) { res.status(400).json({ success: false, message: '⚠️ درس الزامی است' }); return }
    const hasSub = sub && Array.isArray(sub) && sub.length > 0
    const type = normalizeType(req.body.type, hasSub)
    if (!type) { res.status(400).json({ success: false, message: '⚠️ نوع سوال نامعتبر' }); return }
    const difficulty = normalizeDifficulty(req.body.difficulty)
    if (!difficulty) { res.status(400).json({ success: false, message: '⚠️ درجه سختی نامعتبر' }); return }
    const question = normalizeQuestion(req.body.question, type)
    if (!question) { res.status(400).json({ success: false, message: '⚠️ صورت سوال الزامی است' }); return }
    if (question_id) { const ex = await Question.findOne({ question_id }); if (ex) { res.status(409).json({ success: false, message: '⚠️ شناسه تکراری' }); return } }
    const dup = await isDuplicate(question, type, bookId)
    if (dup) { res.status(409).json({ success: false, message: '⚠️ سوال تکراری' }); return }
    const book = await Book.findById(bookId).populate('grade')
    if (!book) { res.status(404).json({ success: false, message: '⚠️ درس یافت نشد' }); return }
    const grade = await Grade.findById(book.grade).populate('course')
    const questionTags = Array.isArray(tags) ? tags.filter((t: any) => String(t).trim()) : []
    await Question.create({
      question_id: question_id || uuidv4(), book: bookId, grade: grade?._id || book.grade, course: grade?.course,
      type, difficulty, question, options: req.body.options || [], matching_left: req.body.matching_left || [], matching_right: req.body.matching_right || [],
      answer: type === 'ترکیبی' ? '' : (answer || ''), lesson_id: req.body.lesson_id || 1, page_number: parsePageNumbers(req.body.page_number),
      source_image: req.body.source_image || '', createdBy: req.user!._id, is_composite: type === 'ترکیبی', sub: type === 'ترکیبی' ? processSubQuestions(sub) : [],
      status: 'در-حال-بررسی', tags: questionTags,
    })
    await Book.findByIdAndUpdate(bookId, { $inc: { totalQuestions: 1 } })
    if (grade) { await Grade.findByIdAndUpdate(grade._id, { $inc: { totalQuestions: 1 } }); await Course.findByIdAndUpdate(grade.course, { $inc: { totalQuestions: 1 } }) }
    res.status(201).json({ success: true, message: '✅ سوال ایجاد شد' })
  } catch (error: any) { if (error.code === 11000) { res.status(409).json({ success: false, message: '⚠️ شناسه تکراری' }); return }; logger.error('❌', error.message); res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const batchUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids, action, value } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) { res.status(400).json({ success: false, message: '⚠️ شناسه‌ها الزامی است' }); return }
    let update: any = {}
    switch (action) {
      case 'status': if (!value || !VALID_STATUSES.includes(value)) { res.status(400).json({ success: false, message: '⚠️ وضعیت نامعتبر' }); return }; update.status = value; break
      case 'add-tag': if (!value || !String(value).trim()) { res.status(400).json({ success: false, message: '⚠️ تگ الزامی است' }); return }; update = { $addToSet: { tags: String(value).trim() } }; break
      case 'remove-tag': if (!value || !String(value).trim()) { res.status(400).json({ success: false, message: '⚠️ تگ الزامی است' }); return }; update = { $pull: { tags: String(value).trim() } }; break
      case 'delete': await Question.updateMany({ _id: { $in: ids } }, { isActive: false }); res.json({ success: true, message: `✅ ${ids.length} سوال حذف شدند` }); return
      default: res.status(400).json({ success: false, message: '⚠️ عملیات نامعتبر' }); return
    }
    await Question.updateMany({ _id: { $in: ids } }, update)
    const msgs: Record<string, string> = { 'status': `✅ وضعیت ${ids.length} سوال تغییر کرد`, 'add-tag': `✅ تگ اضافه شد`, 'remove-tag': `✅ تگ حذف شد` }
    res.json({ success: true, message: msgs[action] || '✅ انجام شد' })
  } catch (e: any) { logger.error('❌', e.message); res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const updateQuestionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    if (!status || !VALID_STATUSES.includes(status)) { res.status(400).json({ success: false, message: '⚠️ وضعیت نامعتبر' }); return }
    const q = await Question.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!q) { res.status(404).json({ success: false, message: '⚠️ سوال یافت نشد' }); return }
    res.json({ success: true, message: '✅ وضعیت بروز شد', data: q })
  } catch (e: any) { res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const updateQuestionTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try { const { tags } = req.body; if (!Array.isArray(tags)) { res.status(400).json({ success: false, message: '⚠️ تگ‌ها باید آرایه باشند' }); return }; const q = await Question.findByIdAndUpdate(req.params.id, { tags }, { new: true }); if (!q) { res.status(404).json({ success: false, message: '⚠️ سوال یافت نشد' }); return }; res.json({ success: true, message: '✅ تگ‌ها بروز شد', data: q }) } catch (e: any) { res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = await Question.findById(req.params.id); if (!q) { res.status(404).json({ success: false, message: '⚠️ سوال یافت نشد' }); return }
    const allowed = ['options', 'matching_left', 'matching_right', 'answer', 'lesson_id', 'source_image']; allowed.forEach(f => { if (req.body[f] !== undefined) (q as any)[f] = req.body[f] })
    if (req.body.type) { const hasSub = req.body.sub && Array.isArray(req.body.sub) && req.body.sub.length > 0; const t = normalizeType(req.body.type, hasSub); if (!t) { res.status(400).json({ success: false, message: '⚠️ نوع سوال نامعتبر' }); return }; q.type = t }
    if (req.body.difficulty) { const d = normalizeDifficulty(req.body.difficulty); if (!d) { res.status(400).json({ success: false, message: '⚠️ سختی نامعتبر' }); return }; q.difficulty = d }
    if (req.body.question !== undefined) q.question = normalizeQuestion(req.body.question, q.type)
    if (req.body.page_number !== undefined) q.page_number = parsePageNumbers(req.body.page_number)
    if (req.body.tags !== undefined) q.tags = Array.isArray(req.body.tags) ? req.body.tags : []
    q.is_composite = q.type === 'ترکیبی'; if (q.is_composite) { q.sub = processSubQuestions(req.body.sub); if (!req.body.answer) q.answer = '' }
    await q.save(); res.json({ success: true, message: '✅ ویرایش شد', data: q })
  } catch (e: any) { res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try { const q = await Question.findById(req.params.id); if (!q) { res.status(404).json({ success: false, message: '⚠️ سوال یافت نشد' }); return }; await q.deleteOne(); await Book.findByIdAndUpdate(q.book, { $inc: { totalQuestions: -1 } }); await Grade.findByIdAndUpdate(q.grade, { $inc: { totalQuestions: -1 } }); await Course.findByIdAndUpdate(q.course, { $inc: { totalQuestions: -1 } }); res.json({ success: true, message: '✅ حذف شد' }) } catch (e: any) { res.status(500).json({ success: false, message: '❌ خطا' }) }
}

export const importQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questions, bookId } = req.body
    if (bookId && questions && Array.isArray(questions)) {
      let success = 0; const failed: any[] = []
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        try {
          const hasSub = q.sub && Array.isArray(q.sub) && q.sub.length > 0
          const actualType = normalizeType(q.type, hasSub)
          if (!actualType) { failed.push({ index: i + 1, question_id: q.question_id || 'بدون شناسه', type: q.type || '(خالی)', question: (q.question || '').substring(0, 200), fullJson: JSON.stringify(q, null, 2), reason: `نوع سوال "${q.type}" نامعتبر است`, errorType: 'INVALID_TYPE' }); continue }
          const actualDifficulty = normalizeDifficulty(q.difficulty)
          if (!actualDifficulty) { failed.push({ index: i + 1, question_id: q.question_id || 'بدون شناسه', type: actualType, question: (q.question || '').substring(0, 200), fullJson: JSON.stringify(q, null, 2), reason: `درجه سختی "${q.difficulty}" نامعتبر است`, errorType: 'INVALID_DIFFICULTY' }); continue }
          const actualQuestion = normalizeQuestion(q.question, actualType)
          if (!actualQuestion) { failed.push({ index: i + 1, question_id: q.question_id || 'بدون شناسه', type: actualType, question: '(خالی)', fullJson: JSON.stringify(q, null, 2), reason: 'صورت سوال خالی است', errorType: 'EMPTY_QUESTION' }); continue }
          if (q.question_id) { const ex = await Question.findOne({ question_id: q.question_id }); if (ex) { failed.push({ index: i + 1, question_id: q.question_id, type: actualType, question: actualQuestion.substring(0, 200), fullJson: JSON.stringify(q, null, 2), reason: 'شناسه تکراری', errorType: 'DUPLICATE_ID' }); continue } }
          
          // چک تکراری (اسکیپ برای جورکردنی)
          const dup = await isDuplicate(actualQuestion, actualType, bookId)
          if (dup) {
            failed.push({ index: i + 1, question_id: q.question_id || 'بدون شناسه', type: actualType, question: actualQuestion.substring(0, 200), fullJson: JSON.stringify(q, null, 2), reason: 'صورت سوال + نوع تکراری', errorType: 'DUPLICATE_CONTENT', canForce: true })
            continue
          }

          const book = await Book.findById(bookId).populate('grade')
          if (!book) { failed.push({ index: i + 1, question_id: q.question_id || 'بدون شناسه', type: actualType, question: actualQuestion.substring(0, 200), fullJson: JSON.stringify(q, null, 2), reason: 'درس یافت نشد', errorType: 'BOOK_NOT_FOUND' }); continue }
          const grade = await Grade.findById(book.grade)
          await Question.create({
            question_id: q.question_id || uuidv4(), book: bookId, grade: book.grade, course: grade?.course,
            type: actualType, difficulty: actualDifficulty, question: actualQuestion,
            options: q.options || [], matching_left: q.matching_left || [], matching_right: q.matching_right || [],
            answer: actualType === 'ترکیبی' ? '' : (q.answer || ''),
            lesson_id: q.lesson_id || 1, page_number: parsePageNumbers(q.page_number),
            source_image: q.source_image || '', createdBy: req.user!._id,
            is_composite: actualType === 'ترکیبی', sub: actualType === 'ترکیبی' ? processSubQuestions(q.sub) : [],
            status: 'در-حال-بررسی', tags: [],
          })
          success++
        } catch (err: any) {
          let reason = err.message || 'خطای ناشناخته', errorType = 'UNKNOWN'
          if (err.code === 11000) { reason = 'کلید تکراری'; errorType = 'DUPLICATE_KEY' }
          else if (err.name === 'ValidationError') { reason = `خطای اعتبارسنجی: ${Object.values(err.errors || {}).map((e: any) => e.message).join('، ')}`; errorType = 'VALIDATION' }
          failed.push({ index: i + 1, question_id: q.question_id || 'بدون شناسه', type: q.type || 'نامشخص', question: (q.question || '').substring(0, 200), fullJson: JSON.stringify(q, null, 2), reason, errorType })
        }
      }
      const count = await Question.countDocuments({ book: bookId, isActive: true })
      const book = await Book.findByIdAndUpdate(bookId, { totalQuestions: count })
      if (book) { await Grade.findByIdAndUpdate(book.grade, { totalQuestions: await Question.countDocuments({ grade: book.grade, isActive: true }) }); const g = await Grade.findById(book.grade); if (g) await Course.findByIdAndUpdate(g.course, { totalQuestions: await Question.countDocuments({ course: g.course, isActive: true }) }) }
      logger.info(`✅ ایمپورت: ${success} موفق, ${failed.length} ناموفق`)
      res.json({ success: true, message: `✅ ${success} سوال import شد`, data: { success, failed: failed.length, total: questions.length, failedItems: failed } })
      return
    }
    res.status(400).json({ success: false, message: '⚠️ فرمت نامعتبر' })
  } catch (e: any) { logger.error('❌', e.message); res.status(500).json({ success: false, message: '❌ خطا' }) }
}
