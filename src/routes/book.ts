import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { upload } from '../middleware/upload'

import { 
    createBook, 
    getAuthorBooks,
    getChapter,
    addChapter,
    updateChapterByNumber,
    uploadBookCover,
    updateBookCategories,
    getFullBook, 
    updateBookStatus,
    deleteBook,
    getPublishedBooks
} from '../controllers/book.controller'

const router = Router()

router.post('/', authenticate, createBook)

router.get('/', authenticate, getAuthorBooks) 

router.post('/:bookId/chapter', authenticate, addChapter)

router.get('/chapter/:bookId/:chapterNumber', getChapter)

router.patch('/chapter/:bookId/:chapterNumber', authenticate, updateChapterByNumber)

router.get('/published', getPublishedBooks)

router.get('/:bookId', authenticate, getFullBook)

router.post('/:bookId/cover', authenticate, upload.single('bookCover'), uploadBookCover)

router.patch("/:bookId/categories", authenticate, updateBookCategories)

router.patch("/:bookId/status", authenticate, updateBookStatus)

router.delete('/:bookId', authenticate, deleteBook)
 
export default router