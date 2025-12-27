import mongoose, { Schema, Document } from 'mongoose'

export enum BookStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    PUBLISHED = 'PUBLISHED',
    REJECTED = 'REJECTED'
}

export interface IChapter {
    chapterNumber: number
    title: string
    content: string 
    wordCount: number
    isDraft: boolean
}

export interface IBook extends Document {
    author: mongoose.Types.ObjectId | { firstName: string; lastName: string }
    title: string
    description: string
    chapters: IChapter[]
    status: BookStatus
    totalWordCount: number
    coverImageUrl?: string
    categories: [{ type: String, trim: true }]
}

const bookSchema = new Schema<IBook>({
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    
    chapters: [{
        chapterNumber: { type: Number, required: true },
        title: { type: String, required: true },
        content: { type: String, default: '' },
        wordCount: { type: Number, default: 0 },
        isDraft: { type: Boolean, default: true },
    }],

    categories: [{ type: String, trim: true }],

    status: { 
        type: String, 
        enum: Object.values(BookStatus), 
        default: BookStatus.DRAFT 
    },
    totalWordCount: { type: Number, default: 0 },
    coverImageUrl: { type: String, default: '' },
}, { timestamps: true })

bookSchema.index({
  title: "text",
  description: "text",
  categories: "text",
  "chapters.title": "text",
  "chapters.content": "text"
})

export const Book = mongoose.model<IBook>('Book', bookSchema)