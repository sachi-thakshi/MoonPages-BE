import { Request, Response } from "express"
import { Role, User } from "../models/user.model"
import { Book, BookStatus, IBook } from "../models/book.model"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

interface PopulatedBook extends Omit<IBook, "author"> {
  author: {
    _id: mongoose.Types.ObjectId
    firstName: string
    lastName: string
  }
}

export const getAdminDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalAuthors,
      totalAdmins,
      totalBooks,
      pendingBooks,
      publishedBooks,
      rejectedBooks
    ] = await Promise.all([
      User.countDocuments({ roles: "USER" }),
      User.countDocuments({ roles: "AUTHOR" }),
      User.countDocuments({ roles: "ADMIN" }),
      Book.countDocuments(),
      Book.countDocuments({ status: BookStatus.PENDING }),
      Book.countDocuments({ status: BookStatus.PUBLISHED }),
      Book.countDocuments({ status: BookStatus.REJECTED })
    ])

    res.status(200).json({
      success: true,
      stats: {
        users: totalUsers,
        authors: totalAuthors,
        admins: totalAdmins,
        books: totalBooks,
        pendingBooks,
        publishedBooks,
        rejectedBooks
      }
    })
    console.log({ totalUsers, totalAuthors, totalAdmins, totalBooks })
  } catch (error) {
    console.error("Admin dashboard error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard stats"
    })
  }
}

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await User.find({ roles: Role.ADMIN }).select("-password")
    res.json({ success: true, admins })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Failed to fetch admins" })
  }
}

export const addAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roles: [Role.ADMIN],
    })

    res.json({ success: true, admin })
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to add admin" })
  }
}

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params
    const { firstName, lastName, email } = req.body

    const admin = await User.findById(adminId);
    if (!admin || !admin.roles.includes(Role.ADMIN)) {
      return res.status(404).json({ success: false, message: "Admin not found" })
    }

    admin.firstName = firstName || admin.firstName
    admin.lastName = lastName || admin.lastName
    admin.email = email || admin.email

    await admin.save()

    res.json({ success: true, admin })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Failed to update admin" })
  }
}

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params

    const admin = await User.findById(adminId)
    if (!admin || !admin.roles.includes(Role.ADMIN)) {
      return res.status(404).json({ success: false, message: "Admin not found" })
    }

    await User.deleteOne({ _id: adminId })

    res.json({ success: true, message: "Admin deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Failed to delete admin" })
  }
}

export const getAuthors = async (req: Request, res: Response) => {
  try {
    const authors = await User.find({ roles: "AUTHOR" }).lean()

    const authorsWithBooks = await Promise.all(
      authors.map(async (author) => {
        const books = await Book.find({ author: author._id }).select("title status")
        return { ...author, books }
      })
    );

    res.json({ success: true, authors: authorsWithBooks })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Failed to fetch authors" })
  }
}

export const deleteAuthor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const author = await User.findById(id)
    if (!author) return res.status(404).json({ success: false, message: "Author not found" })

    await Book.deleteMany({ author: author._id })

    await author.deleteOne()

    res.json({ success: true, message: "Author deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Failed to delete author" })
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ roles: Role.USER })
      .select("_id firstName lastName email roles profilePic")

    res.json({ success: true, users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Failed to fetch users" })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ success: false, message: "User not found" })

    await user.deleteOne()

    res.json({ success: true, message: "User deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Failed to delete user" })
  }
}

export const getBooks = async (req: Request, res: Response) => {
  try {
    const books = await Book.find()
      .populate("author", "firstName lastName") 
      .lean<PopulatedBook[]>()

    const formattedBooks = books.map((b) => ({
      _id: b._id,
      title: b.title,
      authorName: `${b.author.firstName} ${b.author.lastName}`,
      status: b.status,
      totalWordCount: b.totalWordCount,
      categories: b.categories,
    }))

    res.json({ success: true, books: formattedBooks })
  } catch (err) {
    console.error("Failed to fetch books:", err)
    res.status(500).json({ success: false, message: "Failed to fetch books" })
  }
}