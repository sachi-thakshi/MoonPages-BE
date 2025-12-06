import { Request, Response } from "express";
import { User } from "../models/user.model";
import cloudinary from "../utils/cloudinary";

export const updateUser = async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const { username, email } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true }
    )

    res.json({ success: true, user: updatedUser })
    console.log("USER ID FROM TOKEN:", req.user.id)
  } catch (err) {
    res.status(500).json({ message: "Failed to update user", error: err })
  }
}

export const deleteUser = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId)

    res.json({ success: true, message: "Account deleted" })
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

    // Wrap upload_stream in a Promise -> can await it
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
      { new: true } // Return the updated document
    );

    res.status(200).json({
      success: true,
      message: "Profile picture updated",
      profilePic: imageUrl,
      user: updatedUser,
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading profile picture", error })
  }
}