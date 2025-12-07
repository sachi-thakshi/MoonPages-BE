import { Request, Response } from "express";
import { User } from "../models/user.model";
import cloudinary from "../utils/cloudinary";
import { AUthRequest } from "../middleware/auth";

export const updateUser = async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const { firstName, lastName, email } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email },
      { new: true }
    ).select("firstName lastName email roles profilePic")

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ 
        success: true, 
        message: "User updated successfully",
        user: updatedUser.toObject() 
    })
    console.log("USER ID FROM TOKEN:", req.user.id)
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Failed to update user", error: err })
  }
}

export const deleteUser = async (req: any, res: Response) => {
  try {
    const userId = req.user.id

    const result = await User.findByIdAndDelete(userId)

    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    res.status(200).json({ success: true, message: "Account deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err })
  }
}

export const uploadProfilePic = async (req: any, res: Response) => {
  try {
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const uploadToCloudinary = (fileBuffer: Buffer) => {
      return new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "user_profiles" },
          (error, result) => {
            if (error) return reject(error)
            if (!result?.secure_url) return reject("No URL returned from Cloudinary")
            resolve(result.secure_url)
          }
        )
        stream.end(fileBuffer)
      })
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: imageUrl },
      { new: true } 
    ).select("firstName lastName email roles profilePic")

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated",
      user: updatedUser.toObject(),
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading profile picture", error })
  }
}

export const getAllDetails = async (req: AUthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const user = await User.findById(req.user.id).select(
    "email roles firstName lastName profilePic"
  )

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    })
  }

  res.status(200).json({ 
    message: "ok", 
    data: user.toObject() 
  })
}