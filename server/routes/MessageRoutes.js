import express from 'express';
import { getConversation, getUserConversations, markMessagesAsRead } from '../controllers/messageController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/messages/conversation/:userId1/:userId2 → Get conversation between two users
router.get('/conversation/:userId1/:userId2', authMiddleware, getConversation);

// GET /api/messages/conversations/:userId → Get all conversations for a user
router.get('/conversations/:userId', authMiddleware, getUserConversations);

// PUT /api/messages/read/:senderId → Mark messages as read
router.put('/read/:senderId', authMiddleware, markMessagesAsRead);

export default router;
