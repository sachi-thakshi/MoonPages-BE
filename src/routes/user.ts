import { Router } from "express"
import { authenticate } from "../middleware/auth"
import { upload } from "../middleware/upload";
import { updateUser, deleteUser, uploadProfilePic, getAllDetails } from "../controllers/user.controller";

import { 
    getUserBookData, 
    updateBookmark,
    addHighlight,
    deleteHighlight,
    addComment,
    deleteComment,
    getUserLibrary
} from '../controllers/userBook.controller';

const router = Router()

// Update user info
router.put("/update", authenticate, updateUser)

// Delete account
router.delete("/delete", authenticate, deleteUser)

// Upload profile image
router.post("/upload-profile", authenticate, upload.single("profilePic"), uploadProfilePic)

router.get("/details", authenticate, getAllDetails)

//Fetch all user data (bookmark, highlights, comments) for a book
router.get('/reading/data/:bookId', authenticate, getUserBookData)

// Update reading bookmark (chapterNumber)
router.patch('/reading/bookmark/:bookId', authenticate, updateBookmark)

// Add a new highlight
router.post('/reading/highlight/:bookId', authenticate, addHighlight)

// Remove a highlight by ID
router.delete('/reading/highlight/:bookId/:highlightId', authenticate, deleteHighlight)

// Add a new comment (book-level or chapter-level)
router.post('/reading/comment/:bookId', authenticate, addComment)

// Remove a comment by ID
router.delete('/reading/comment/:bookId/:commentId', authenticate, deleteComment)

router.get('/reading/library', authenticate, getUserLibrary)

export default router