import express from 'express';
import { addStudyLog, getStudyLogs, getUserStreak } from '../controllers/studyController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/study/log → Add a new study session
router.post('/log', authMiddleware, addStudyLog);

// GET /api/study/logs/:userId → Fetch weekly/monthly study logs
router.get('/logs/:userId', authMiddleware, getStudyLogs);

// GET /api/study/streak/:userId → Get user streak information
router.get('/streak/:userId', authMiddleware, getUserStreak);

export default router;
