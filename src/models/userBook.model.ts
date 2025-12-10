import mongoose, { Schema, Document } from 'mongoose'

interface IHighlight {
    _id: mongoose.Schema.Types.ObjectId
    chapterNumber: number
    text: string
    startOffset: number
    endOffset: number
    createdAt: Date
}

interface IComment {
    _id: mongoose.Schema.Types.ObjectId
    user: mongoose.Schema.Types.ObjectId
    content: string
    chapterNumber?: number
    createdAt: Date
}

export interface IUserBook extends Document {
    user: mongoose.Schema.Types.ObjectId
    book: mongoose.Schema.Types.ObjectId
    bookmarkChapter: number | null
    highlights: IHighlight[]
    comments: IComment[]
    lastRead: Date
}

const HighlightSchema: Schema = new Schema({
    chapterNumber: { type: Number, required: true },
    text: { type: String, required: true },
    startOffset: { type: Number, required: true },
    endOffset: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
})

const CommentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    chapterNumber: { type: Number },
    createdAt: { type: Date, default: Date.now },
})

const UserBookSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    bookmarkChapter: { type: Number, default: null },
    highlights: [HighlightSchema],
    comments: [CommentSchema],
    lastRead: { type: Date, default: Date.now },
}, { timestamps: true })

UserBookSchema.index({ user: 1, book: 1 }, { unique: true })

export const UserBook = mongoose.model<IUserBook>('UserBook', UserBookSchema)