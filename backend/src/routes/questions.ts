import { Router } from 'express'
import { getQuestionsByBook, getQuestionById, createQuestion, updateQuestion, deleteQuestion, importQuestions } from '../controllers/questionController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/book/:bookId', protect, getQuestionsByBook)
router.get('/:id', protect, getQuestionById)
router.post('/', protect, createQuestion)
router.put('/:id', protect, updateQuestion)
router.delete('/:id', protect, deleteQuestion)
router.post('/import', protect, importQuestions)

export default router
