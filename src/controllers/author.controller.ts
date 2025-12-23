import { Response } from "express";
import { AUthRequest } from "../middleware/auth";
import { Book } from "../models/book.model";
import { UserBook } from "../models/userBook.model";

export const getAuthorDashboardData = async (req: AUthRequest, res: Response) => {
    try {
        const authorId = req.user.id

        const authorBooks = await Book.find({ author: authorId }).select('_id')
        const bookIds = authorBooks.map(b => b._id)

        const publishedBooksCount = await Book.countDocuments({ 
            author: authorId, 
            status: 'PUBLISHED' 
        })

        const totalReaders = await UserBook.countDocuments({ 
            book: { $in: bookIds } 
        })

        const userBooksWithComments = await UserBook.find({ 
            book: { $in: bookIds },
            'comments.0': { $exists: true }
        })
        .populate('comments.user', 'firstName lastName profilePic')
        .populate('book', 'title')
        .select('comments book')
        .lean()

        const allComments = userBooksWithComments.flatMap(ub => 
            ub.comments.map(c => {
                const userObj = c.user as any
                const bookObj = ub.book as any

                return {
                    ...c, 
                    bookTitle: bookObj?.title || "Unknown Book",
                    userName: userObj ? `${userObj.firstName} ${userObj.lastName}` : "Deleted User",
                    userAvatar: userObj ? (userObj.firstName[0] + (userObj.lastName ? userObj.lastName[0] : "")) : "??"
                }
            })
        )

        const recentComments = allComments
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)

        res.status(200).json({
            success: true,
            stats: {
                publishedBooks: publishedBooksCount,
                totalReaders: totalReaders,
                totalComments: allComments.length
            },
            recentComments
        })
    } catch (err) {
        console.error("Dashboard Stats Error:", err)
        res.status(500).json({ message: "Failed to fetch dashboard data" })
    }
}

export const getBookCommentsForAuthor = async (req: AUthRequest, res: Response) => {
    try {
        const { bookId } = req.params
        const authorId = req.user.id

        const book = await Book.findOne({ _id: bookId, author: authorId })
        if (!book) {
            return res.status(403).json({ message: "You are not the author of this book." })
        }

        const userBooks = await UserBook.find({ 
            book: bookId, 
            'comments.0': { $exists: true } 
        })
        .populate('comments.user', 'firstName lastName profilePic')
        .lean()

        const allComments = userBooks.flatMap(ub => ub.comments)

        allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        res.status(200).json({
            success: true,
            comments: allComments
        })
    } catch (err) {
        console.error("Fetch book comments error:", err)
        res.status(500).json({ message: "Failed to load reader comments." })
    }
}

export const postAuthorReply = async (req: AUthRequest, res: Response) => {
    try {
        const { bookId, commentId } = req.params
        const { replyText } = req.body
        const authorId = req.user.id

        const book = await Book.findOne({ _id: bookId, author: authorId })
        if (!book) return res.status(403).json({ message: "Unauthorized" })

        const updatedUserBook = await UserBook.findOneAndUpdate(
            { "comments._id": commentId },
            { 
                $set: { 
                    "comments.$.authorReply": replyText, 
                    "comments.$.repliedAt": new Date() 
                } 
            },
            { new: true }
        )

        if (!updatedUserBook) return res.status(404).json({ message: "Comment not found" })

        res.status(200).json({ success: true, message: "Reply posted successfully" })
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
}

export const deleteAuthorReply = async (req: AUthRequest, res: Response) => {
    try {
        const { bookId, commentId } = req.params
        const authorId = req.user.id

        const book = await Book.findOne({ _id: bookId, author: authorId })
        if (!book) return res.status(403).json({ message: "Unauthorized" })

        const updatedUserBook = await UserBook.findOneAndUpdate(
            { "comments._id": commentId },
            { 
                $set: { 
                    "comments.$.authorReply": null, 
                    "comments.$.repliedAt": null 
                } 
            },
            { new: true }
        )

        res.status(200).json({ success: true, message: "Reply deleted successfully" })
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
}