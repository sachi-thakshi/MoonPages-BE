import { Response } from "express"
import mongoose from "mongoose"
import { AUthRequest } from "../middleware/auth"
import { UserBook } from "../models/userBook.model"
import { Book } from "../models/book.model"

const checkBookExists = async (bookId: string) => {
    return Book.exists({ _id: bookId })
}

const getOrCreateUserBook = async (userId: string, bookId: string) => {
    return UserBook.findOneAndUpdate(
        { user: userId, book: bookId },
        { $setOnInsert: { user: userId, book: bookId } },
        { upsert: true, new: true }
    )
    .populate('comments.user', '_id firstName lastName profilePic')
    .populate({
        path: 'book',
        select: 'title author coverImageUrl categories chapters', 
        populate: {
            path: 'author',
            select: 'firstName lastName', 
        }
    })
}

export const getUserBookData = async (req: AUthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required." })
    
    const { bookId } = req.params
    
    try {
        const userBook = await getOrCreateUserBook(req.user.id, bookId)
        
        res.status(200).json({
            success: true,
            data: userBook,
        })
    } catch (err) {
        console.error("Fetch UserBookData error:", err)
        res.status(500).json({ message: "Failed to load user book data." })
    }
}

export const updateBookmark = async (req: AUthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required." })

    const { bookId } = req.params
    const { chapterNumber } = req.body

    try {
        const updatedUserBook = await UserBook.findOneAndUpdate(
            { user: req.user.id, book: bookId },
            { bookmarkChapter: chapterNumber, lastRead: new Date() }, 
            { new: true, upsert: true }
        )

        res.status(200).json({
            success: true,
            bookmarkChapter: updatedUserBook.bookmarkChapter,
        })
    } catch (err) {
        console.error("Update Bookmark error:", err)
        res.status(500).json({ message: "Failed to save bookmark." })
    }
}

export const addHighlight = async (req: AUthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required." })

    const { bookId } = req.params
    const { chapterNumber, text, startOffset, endOffset } = req.body

    if (!chapterNumber || !text || startOffset === undefined || endOffset === undefined) {
        return res.status(400).json({ message: "Missing highlight data." })
    }

    try {
        const newHighlight = { chapterNumber, text, startOffset, endOffset }
        
        const updatedUserBook = await UserBook.findOneAndUpdate(
            { user: req.user.id, book: bookId },
            { $push: { highlights: newHighlight } },
            { new: true, upsert: true }
        )

        const savedHighlight = updatedUserBook.highlights.find(h => 
            h.chapterNumber === chapterNumber && 
            h.text === text.substring(0, 50) && 
            h.startOffset === startOffset
        )

        res.status(201).json({
            success: true,
            highlight: savedHighlight || newHighlight,
        })

    } catch (err) {
        console.error("Add Highlight error:", err)
        res.status(500).json({ message: "Failed to save highlight." })
    }
}

export const deleteHighlight = async (req: AUthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required." })

    const { bookId, highlightId } = req.params

    try {
        if (!mongoose.Types.ObjectId.isValid(highlightId)) {
            return res.status(400).json({ message: "Invalid highlight ID." })
        }

        const updatedUserBook = await UserBook.findOneAndUpdate(
            { user: req.user.id, book: bookId },
            { $pull: { highlights: { _id: highlightId } } }, 
            { new: true }
        )

        if (!updatedUserBook) {
            return res.status(404).json({ message: "User data not found for this book." })
        }

        res.status(200).json({
            success: true,
            message: "Highlight deleted successfully.",
            deletedHighlightId: highlightId,
        })

    } catch (err) {
        console.error("Delete Highlight error:", err)
        res.status(500).json({ message: "Failed to delete highlight." })
    }
}

export const addComment = async (req: AUthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required." })

    const { bookId } = req.params
    const { content, chapterNumber } = req.body

    if (!content.trim()) {
        return res.status(400).json({ message: "Comment content cannot be empty." })
    }

    try {
        const newComment = {
            user: req.user.id,
            content: content.trim(),
            chapterNumber: chapterNumber || undefined,
        }

        const updatedUserBook = await UserBook.findOneAndUpdate(
            { user: req.user.id, book: bookId },
            { $push: { comments: newComment } },
            { new: true, upsert: true }
        ).populate('comments.user', 'firstName lastName profilePic')

        const savedComment = updatedUserBook.comments.slice(-1)[0]

        res.status(201).json({
            success: true,
            comment: savedComment,
        })

    } catch (err) {
        console.error("Add Comment error:", err)
        res.status(500).json({ message: "Failed to post comment." })
    }
}

export const deleteComment = async (req: AUthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required." })

    const { bookId, commentId } = req.params

    try {
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment ID." })
        }

        const updatedUserBook = await UserBook.findOneAndUpdate(
            { user: req.user.id, book: bookId },
            { $pull: { comments: { _id: commentId, user: req.user.id } } },
            { new: true }
        )

        if (!updatedUserBook) {
            return res.status(404).json({ message: "User data not found for this book." })
        }

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully.",
            deletedCommentId: commentId,
        })

    } catch (err) {
        console.error("Delete Comment error:", err)
        res.status(500).json({ message: "Failed to delete comment." })
    }
}

export const getUserLibrary = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const library = await UserBook.find({ user: req.user.id })
            .populate({
                path: 'book',
                select: 'title author coverImageUrl chapters description',
               
            })
            .sort({ updatedAt: -1 })

        // Filter out any records where the book might have been deleted
        const activeLibrary = library.filter(item => item.book !== null)

        res.status(200).json({
            success: true,
            library: activeLibrary
        })
    } catch (err) {
        console.error("Fetch User Library error:", err)
        res.status(500).json({ message: "Failed to load your library." })
    }
}