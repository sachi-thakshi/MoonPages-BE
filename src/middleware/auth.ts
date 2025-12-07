import { NextFunction, Request, Response } from "express"
import jwt, { TokenExpiredError } from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string

interface MyJwtPayload extends jwt.JwtPayload {
  sub: string;     
  roles: string[];
}

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
        console.log("No token found")
        return res.status(401).json({ message: "No token provided "})
    }
    const token = authHeader.split(' ')[1]

    try {
        const payload = jwt.verify(token, JWT_SECRET) as MyJwtPayload
        req.user = {
            id: payload.sub,   
            roles: payload.roles
        };
        // req.user = payload
        next()
    } catch (err) {
        console.error(err)

        if (err instanceof TokenExpiredError) {
            return res.status(401).json({ 
                message: "Access token expired.",
            })
        }

        res.status(403).json({
            message: "Invalid token"
        })
    }
}