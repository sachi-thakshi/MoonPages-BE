import { Request, Response } from 'express'
import OpenAI from 'openai'
import { Book } from '../models/book.model'

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1", 
})

export const handleChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message }: { message: string } = req.body

    const books = await Book.find({ status: 'PUBLISHED' }).limit(5).select('title description')
    const bookContext = books.map(b => `Book: ${b.title}. Description: ${b.description}`).join('\n')

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", 
      messages: [
        { 
          role: "system", 
          content: `You are the MoonPages assistant. Help users find books from our library: \n${bookContext}` 
        },
        { role: "user", content: message }
      ],
    })

    res.json({ reply: completion.choices[0].message.content })
  } catch (error: any) {
    console.error("Groq Chat Error:", error);
    res.status(500).json({ reply: "I'm having a quick nap. Please try again in a moment!" })
  }
}