import { Request, Response } from "express"
import axios from "axios"

export const generateContent = async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("Gemini API Key Loaded:", !!apiKey)

    if (!apiKey) {
        return res.status(500).json({
            message: "Server configuration error: AI key not found."
        })
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`

         const aiResponse = await axios.post(
            url,
            {
                contents: [
                    {
                        parts: [{ text: req.body.prompt || "" }]
                    }
                ]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        )

        const genratedContent = aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No data"

        res.status(200).json({ data: genratedContent })

    } catch (err: any) {
        if (err.response) {
            console.error("Gemini API Error Status:", err.response.status)
            console.error("Gemini API Error Data:", err.response.data)
            
            return res.status(500).json({ 
                 message: "AI service rejected the request (Check server logs for 403/429)." 
            })
        }
        
        console.error("Axios/Internal Server Error:", err.message);
        res.status(500).json({
            message: "Failed to generate AI content due to an unhandled internal server error."
        })
    }
}