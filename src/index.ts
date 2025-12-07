import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import authRouter from "./routes/auth"
import userRouter from "./routes/user"

dotenv.config()

const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI as string

const app = express()

app.use(express.json())
app.use(
    cors({
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    })
)

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url)
  next()
})

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/user", userRouter)

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("DB Connected")
    })
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })

app.listen(PORT, () => {
    console.log("Server is running")
})