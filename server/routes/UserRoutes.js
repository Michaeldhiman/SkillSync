import express from 'express'
import multer from 'multer'
import { getUsers, registerUser, authUser, updateProfile } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Files will be stored in uploads folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  }
})

// Public routes
router.get('/', getUsers)                // GET all users
router.post('/signup', registerUser)     // Register new user
router.post('/login', authUser)          // Login user

// Protected routes
router.get('/profile', protect, (req, res) => {
  res.json(req.user)
})

// Profile update route with file upload support
router.post('/profile/update', protect, upload.single('profilePicture'), updateProfile)

export default router
