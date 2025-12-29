import { Request, Response } from "express"
import { IUSER, Role, User } from "../models/user.model"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "../utils/tokens"
import { AUthRequest } from "../middleware/auth"
import jwt from "jsonwebtoken"

import dotenv from "dotenv"
dotenv. config()

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const registerUser = async (req: Request, res: Response) => {
  try {
    console.log("Raw Request Body:", req.body)

    const { firstname, lastname , email, password, role} = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" })
    }

    const hash = await bcrypt.hash(password, 10)

    const normalizedRole = role ? (role as string).toUpperCase() : Role.USER

    const validRoleValues = Object.values(Role)

    if (!validRoleValues.includes(normalizedRole as Role)) {
      return res.status(400).json({ message: "Invalid role value" })
    }
    
    const userRoles = [normalizedRole as Role];

    const user = await User.create({
      firstName: firstname,
      lastName: lastname,
      email,
      password: hash,
      roles: userRoles
    })

    const accessToken = signAccessToken(user as IUSER)
    const refreshToken = signRefreshToken(user as IUSER)

    res.status(201).json({
      message: "User registed",
      data: { 
        email: user.email, 
        roles: user.roles,
        accessToken,
        refreshToken
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const existingUser = (await User.findOne({ email })) as IUSER | null
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, existingUser.password)
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const accessToken = signAccessToken(existingUser)
    const refreshToken = signRefreshToken(existingUser)

    res.status(200).json({
      message: "success",
      data: {
        email: existingUser.email,
        roles: existingUser.roles,
        accessToken,
        refreshToken
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await User.create({
      email,
      password: hash,
      roles: [Role.ADMIN]
    })

    const accessToken = signAccessToken(user as IUSER)
    const refreshToken = signRefreshToken(user as IUSER)

    res.status(201).json({
      message: "Admin registed",
      data: { 
        email: user.email, 
        roles: user.roles,
        accessToken,
        refreshToken 
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal server error"
    })
  }
}

export const getMyProfile = async (req: AUthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  const user = await User.findById(req.user.id).select("-password")

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    })
  }

  const { email, roles, _id } = user as IUSER

  res.status(200).json({ message: "ok", data: { id: _id, email, roles } })
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ message: "Token required" })
    }

    const payload: any = jwt.verify(token, JWT_REFRESH_SECRET)

    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(403).json({ message: "User not found" })
    }

    const newAccessToken = signAccessToken(user)

    res.status(200).json({
      accessToken: newAccessToken
    })
  } catch {
    res.status(403).json({
      message: "Invalid or expired refresh token"
    })
  }
}

