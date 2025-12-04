import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string

export interface AUthRequest extends Request {
  user?: any
}

export const authenticate  = (
    req: AUthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided "})
    }
    const token = authHeader.split(" ")[1]

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.user = payload
        next()
    } catch (err) {
        console.error(err)
        res.status(403).json({
            message: "Invalid or expire token"
        })
    }
}