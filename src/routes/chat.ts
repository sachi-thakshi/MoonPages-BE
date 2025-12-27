import express from 'express';
import { handleChat } from '../controllers/chat.controller'

const router = express.Router()

router.post('/', handleChat)

export default router