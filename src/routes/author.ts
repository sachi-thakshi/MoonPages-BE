import { Router } from "express"
import { 
    deleteAuthorReply,
    getAuthorDashboardData, 
    getBookCommentsForAuthor, 
    postAuthorReply
} from '../controllers/author.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/dashboard-stats', authenticate, getAuthorDashboardData)
router.get('/book/:bookId/comments', authenticate, getBookCommentsForAuthor)
router.post('/book/:bookId/comment/:commentId/reply', authenticate, postAuthorReply)
router.delete('/book/:bookId/comment/:commentId/reply', authenticate, deleteAuthorReply)

export default router