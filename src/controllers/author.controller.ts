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