import { Request, Response } from "express"
import { Book, IBook, IChapter } from "../models/book.model"
import { AUthRequest } from "../middleware/auth"
import cloudinary from "../utils/cloudinary"

const checkAuthorRole = (user: any): boolean => {
    return user?.roles?.includes('AUTHOR')
}

export const createBook = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied. Author role required." })
        }

        const authorId = req.user.id

        const {
            title,
            description = "",
            categories = [],
            chapters = []
        }: {
            title: string
            description?: string
            categories?: string[]
            chapters?: { title?: string; content?: string }[]
        } = req.body

        if (!title) {
            return res.status(400).json({ message: "Book title is required." })
        }

        const preparedChapters: IChapter[] =
            chapters.length > 0
                ? chapters.map((ch: { title?: string; content?: string }, i: number) => ({
                      chapterNumber: i + 1,
                      title: ch.title?.trim() || `Chapter ${i + 1}`,
                      content: ch.content?.trim() || "",
                      wordCount: ch.content ? ch.content.trim().split(/\s+/).length : 0,
                      isDraft: true,
                  }))
                : [
                      {
                          chapterNumber: 1,
                          title: "Chapter 1: Title",
                          content: "",
                          wordCount: 0,
                          isDraft: true,
                      },
                  ]

        const totalWordCount = preparedChapters.reduce((sum, chap) => sum + chap.wordCount, 0)

        const newBook = await Book.create({
            author: authorId,
            title: title.trim(),
            description: description.trim(),
            categories,
            chapters: preparedChapters,
            totalWordCount,
        })

        res.status(201).json({ success: true, book: newBook })
    } catch (err) {
        console.error("Create book error:", err)
        res.status(500).json({ message: "Failed to create book." })
    }
}

export const getAuthorBooks = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied. Author role required." })
        }
        
        const authorId = req.user.id
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const skip = (page - 1) * limit

        const [books, totalBooks] = await Promise.all([
            Book.find({ author: authorId })
                .select('title status totalWordCount createdAt updatedAt chapters.chapterNumber chapters.title coverImageUrl categories') 
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            Book.countDocuments({ author: authorId })
        ])

        res.status(200).json({
            success: true,
            books,
            pagination: {
                totalPages: Math.ceil(totalBooks / limit),
                currentPage: page,
                totalItems: totalBooks,
                limit: limit
            }
        })

    } catch (err) {
        console.error("Fetch books error:", err)
        res.status(500).json({ message: "Failed to fetch books." })
    }
}

export const getChapter = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied." })
        }
        
        const { bookId, chapterNumber } = req.params
        const numChapter = parseInt(chapterNumber)

        const book = await Book.findOne({ _id: bookId, author: req.user.id })
        if (!book) {
            return res.status(404).json({ message: "Book not found." })
        }

        const chapter = book.chapters.find(c => c.chapterNumber === numChapter)
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found." })
        }

        res.status(200).json({ success: true, chapter })
        
    } catch (err) {
        console.error("Fetch chapter error:", err)
        res.status(500).json({ message: "Failed to retrieve chapter." })
    }
}

export const addChapter = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied. Author role required." })
        }

        const { bookId } = req.params
        const { title, content, isDraft = true } = req.body

        const book = await Book.findOne({ _id: bookId, author: req.user.id })
        if (!book) return res.status(404).json({ message: "Book not found." })

        const maxChapter = book.chapters.length > 0 
            ? Math.max(...book.chapters.map(c => c.chapterNumber))
            : 0

        const newChapterNumber = maxChapter + 1
        const newChapterTitle = title || `Chapter ${newChapterNumber}`
        const newContent = content || ""
        const wordCount = newContent.trim().split(/\s+/).length

        const newChapter: IChapter = {
            chapterNumber: newChapterNumber,
            title: newChapterTitle,
            content: newContent,
            wordCount: wordCount,
            isDraft: isDraft,
        } as unknown as IChapter 

        book.chapters.push(newChapter)
        book.totalWordCount = book.chapters.reduce((sum, c) => sum + c.wordCount, 0)
        
        await book.save()

        res.status(201).json({ success: true, chapter: newChapter })
    } catch (err) {
        console.error("Add chapter error:", err)
        res.status(500).json({ message: "Failed to add chapter." })
    }
}

export const updateChapterByNumber = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied." })
        }
        
        const { bookId, chapterNumber } = req.params
        const { title, content, isDraft } = req.body 
        const numChapter = parseInt(chapterNumber)

        if (isNaN(numChapter) || numChapter < 1) {
            return res.status(400).json({ message: "Invalid chapter number provided." })
        }
        
        const wordCount = content ? content.trim().split(/\s+/).length : undefined 
        
        const setUpdates: { [key: string]: any } = {}
        if (title !== undefined) setUpdates['chapters.$[chap].title'] = title
        if (content !== undefined) setUpdates['chapters.$[chap].content'] = content
        if (isDraft !== undefined) setUpdates['chapters.$[chap].isDraft'] = isDraft
        if (wordCount !== undefined) setUpdates['chapters.$[chap].wordCount'] = wordCount

        if (Object.keys(setUpdates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update." })
        }
        
        const updatedBook = await Book.findOneAndUpdate(
            { 
                _id: bookId, 
                author: req.user.id,
                'chapters.chapterNumber': numChapter 
            },
            {
                $set: setUpdates,
            },
            {
                new: true,
                arrayFilters: [{ 'chap.chapterNumber': numChapter }],
                select: 'totalWordCount chapters' 
            }
        ) as IBook | null

        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found or chapter number is incorrect." })
        }

        updatedBook.totalWordCount = updatedBook.chapters.reduce((sum, chap) => sum + chap.wordCount, 0)
        await updatedBook.save()
        
        res.status(200).json({ 
            success: true, 
            chapter: updatedBook.chapters.find(c => c.chapterNumber === numChapter) 
        })

    } catch (err) {
        console.error("Update chapter error:", err)
        res.status(500).json({ message: "Failed to update chapter." })
    }
}

export const uploadBookCover = async (req: AUthRequest, res: Response) => {

    const uploadToCloudinary = (fileBuffer: Buffer) => {
        return new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "book_covers", resource_type: "auto" }, 
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary Stream Error:", error)
                        return reject(error)
                    }
                    if (!result || !result.secure_url) {
                        return reject("Cloudinary upload failed: Missing secure URL.")
                    }
                    resolve(result.secure_url)
                }
            )
            stream.end(fileBuffer)
        })
    }

    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied. Author role required." })
        }
        
        const { bookId } = req.params

        if (!req.file) {
            return res.status(400).json({ message: "No cover image file uploaded." })
        }

        const imageUrl = await uploadToCloudinary(req.file.buffer) 

        const updatedBook = await Book.findOneAndUpdate(
            { _id: bookId, author: req.user.id },
            { coverImageUrl: imageUrl },
            { new: true, select: 'title coverImageUrl totalWordCount chapters' }
        ) as IBook | null

        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found or access denied." })
        }

        res.status(200).json({ 
            success: true, 
            message: "Book cover uploaded successfully.",
            book: updatedBook.toObject() 
        })

    } catch (err) {
        console.error("Book cover upload error:", err)
        res.status(500).json({ message: "Failed to upload book cover." })
    }
}

export const updateBookCategories = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied. Author role required." })
        }

        const { bookId } = req.params
        const { categories } = req.body

        if (!Array.isArray(categories)) {
            return res.status(400).json({ message: "Categories must be an array of strings." })
        }

        const updatedBook = await Book.findOneAndUpdate(
            { _id: bookId, author: req.user.id },
            { categories },
            { new: true }
        )

        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found or access denied." })
        }

        res.status(200).json({
            success: true,
            message: "Categories updated successfully.",
            categories: updatedBook.categories
        })

    } catch (err) {
        console.error("Update categories error:", err);
        res.status(500).json({ message: "Failed to update categories." })
    }
}

export const getFullBook = async (req: AUthRequest, res: Response) => {
    try {
        const { bookId } = req.params;

        const book = await Book.findById(bookId).select(
            "title description coverImageUrl categories chapters status totalWordCount createdAt updatedAt"
        );

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found." });
        }

        res.status(200).json({ success: true, book });
    } catch (err) {
        console.error("Get full book error:", err);
        res.status(500).json({ success: false, message: "Failed to load book." });
    }
}

export const updateBookStatus = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied. Author role required." })
        }

        const { bookId } = req.params
        const { status } = req.body 

        if (!status) {
            return res.status(400).json({ message: "Book status is required." })
        }

        const updatedBook = await Book.findOneAndUpdate(
            { _id: bookId, author: req.user.id },
            { status: status }, 
            { new: true, select: 'status title' } 
        )

        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found or access denied." })
        }

        res.status(200).json({
            success: true,
            message: "Book status updated successfully.",
            status: updatedBook.status
        })

    } catch (err) {
        console.error("Update book status error:", err);
        res.status(500).json({ message: "Failed to update book status." })
    }
}

export const deleteBook = async (req: AUthRequest, res: Response) => {
    try {
        if (!req.user || !checkAuthorRole(req.user)) {
            return res.status(403).json({ message: "Access denied. Author role required." })
        }

        const { bookId } = req.params

        const deletedBook = await Book.findOneAndDelete({ 
            _id: bookId, 
            author: req.user.id 
        })

        if (!deletedBook) {
            return res.status(404).json({ message: "Book not found or access denied." })
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Book deleted successfully.", 
            deletedBookId: bookId 
        })

    } catch (err) {
        console.error("Delete book error:", err)
        res.status(500).json({ message: "Failed to delete book." })
    }
}
