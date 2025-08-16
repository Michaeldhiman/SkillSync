import Connection from '../models/ConnectionModel.js'
import User from '../models/UserModel.js'
import mongoose from 'mongoose'

// Send connection request
const sendConnectionRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body

    // Input validation
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ 
        message: 'Both fromUserId and toUserId are required' 
      })
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(fromUserId) || !mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID format' 
      })
    }

    // Prevent self-connection
    if (fromUserId === toUserId) {
      return res.status(400).json({ 
        message: 'Cannot send connection request to yourself' 
      })
    }

    // Verify both users exist
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId).select('_id name'),
      User.findById(toUserId).select('_id name')
    ])

    if (!fromUser) {
      return res.status(404).json({ 
        message: 'Sender user not found' 
      })
    }

    if (!toUser) {
      return res.status(404).json({ 
        message: 'Recipient user not found' 
      })
    }

    // Check for existing connection request (in either direction)
    const existingConnection = await Connection.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId }
      ]
    })

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return res.status(409).json({ 
          message: 'A connection request is already pending between these users' 
        })
      } else if (existingConnection.status === 'accepted') {
        return res.status(409).json({ 
          message: 'Users are already connected' 
        })
      } else if (existingConnection.status === 'rejected') {
        // Allow sending new request after rejection - delete old rejected request
        await Connection.deleteOne({ _id: existingConnection._id })
      }
    }

    // Create new connection request
    const newConnection = await Connection.create({
      fromUser: fromUserId,
      toUser: toUserId,
      status: 'pending'
    })

    res.status(201).json({
      message: 'Connection request sent',
      connectionId: newConnection._id,
      connection: {
        _id: newConnection._id,
        fromUser: fromUser.name,
        toUser: toUser.name,
        status: newConnection.status,
        createdAt: newConnection.createdAt
      }
    })

  } catch (error) {
    console.error('Send connection request error:', error)
    
    // Handle duplicate key error (in case index constraint is hit)
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Connection request already exists between these users' 
      })
    }

    res.status(500).json({ 
      message: 'Server error while sending connection request' 
    })
  }
}

// Get user's connection requests (received)
const getReceivedRequests = async (req, res) => {
  try {
    const userId = req.user._id

    const requests = await Connection.find({
      toUser: userId
    })
    .populate('fromUser', 'name email skills goals profilePicture')
    .sort({ createdAt: -1 })

    res.json({
      message: `Found ${requests.length} requests`,
      requests
    })

  } catch (error) {
    console.error('Get received requests error:', error)
    res.status(500).json({ 
      message: 'Server error while fetching connection requests' 
    })
  }
}

// Get user's sent connection requests
const getSentRequests = async (req, res) => {
  try {
    const userId = req.user._id

    const requests = await Connection.find({
      fromUser: userId
    })
    .populate('toUser', 'name email skills goals profilePicture')
    .sort({ createdAt: -1 })

    res.json({
      message: `Found ${requests.length} sent requests`,
      requests
    })

  } catch (error) {
    console.error('Get sent requests error:', error)
    res.status(500).json({ 
      message: 'Server error while fetching sent requests' 
    })
  }
}

// Respond to connection request (accept/reject)
const respondToRequest = async (req, res) => {
  try {
    const { connectionId } = req.params
    const { action } = req.body // 'accept' or 'reject'
    const userId = req.user._id

    // Validate input
    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ 
        message: 'Action must be either "accept" or "reject"' 
      })
    }

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({ 
        message: 'Invalid connection ID format' 
      })
    }

    // Find the connection request
    const connection = await Connection.findOne({
      _id: connectionId,
      toUser: userId,
      status: 'pending'
    }).populate('fromUser', 'name email')

    if (!connection) {
      return res.status(404).json({ 
        message: 'Connection request not found or already processed' 
      })
    }

    // Update connection status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected'
    connection.status = newStatus
    await connection.save()

    res.json({
      message: `Connection request ${newStatus}`,
      connection: {
        _id: connection._id,
        fromUser: connection.fromUser.name,
        status: connection.status,
        updatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Respond to request error:', error)
    res.status(500).json({ 
      message: 'Server error while responding to connection request' 
    })
  }
}

export { 
  sendConnectionRequest, 
  getReceivedRequests, 
  getSentRequests, 
  respondToRequest 
}
