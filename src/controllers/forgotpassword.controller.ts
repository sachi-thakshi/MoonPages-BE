import crypto from "crypto"
import { User } from "../models/user.model"
import { sendEmail } from "../utils/sendEmail"
import { Request, Response } from "express"
import bcrypt from "bcryptjs"

export const forgotPassword = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const resetToken = crypto.randomBytes(32).toString("hex")

        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex")

        user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000)

        await user.save()

        const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173"

        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`

        await sendEmail(
            user.email,
            "MoonPages Password Reset",
            `
            <h3>Hello ${user.firstName}</h3>
            <p>You requested a password reset.</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>This link expires in 15 minutes.</p>
            `
        )

        return res.json({
            success: true,
            message: "Password reset link sent",
        })
    } catch (error) {
        console.error("Forgot password error:", error)
        return res.status(500).json({ message: "Server error" })
    }
}

export const resetPassword = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const { token } = req.params
        const { password } = req.body

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex")

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        })

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" })
        }

        user.password = await bcrypt.hash(password, 10)
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save()

        return res.json({
            success: true,
            message: "Password reset successful",
        })
        
    } catch (error) {
        console.error("Reset password error:", error)
        return res.status(500).json({ message: "Server error" })
    }
}
