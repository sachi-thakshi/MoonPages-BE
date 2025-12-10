import { Router } from "express";
import { generateContent } from "../controllers/ai.controller"

const router = Router()

router.post("/generate", generateContent)

export default router