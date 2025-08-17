import express from 'express'
import { 
  sendConnectionRequest, 
  getReceivedRequests, 
  getSentRequests, 
  respondToRequest 
} from '../controllers/connectionController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// All connection routes require authentication
router.use(authMiddleware)

// Send connection request
router.post('/connect-request', sendConnectionRequest)

// Get received connection requests (pending)
router.get('/requests/received', getReceivedRequests)

// Get sent connection requests
router.get('/requests/sent', getSentRequests)

// Respond to connection request (accept/reject)
router.put('/requests/:connectionId/respond', respondToRequest)

export default router
