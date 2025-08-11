import express from 'express'
import { getUsers, registerUser, authUser } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/', getUsers)                // GET all users
router.post('/signup', registerUser)     // Register new user
router.post('/login', authUser)          // Login user

// Protected route example
router.get('/profile', protect, (req, res) => {
  res.json(req.user)
})

export default router
