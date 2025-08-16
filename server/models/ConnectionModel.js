import mongoose from 'mongoose'

const connectionSchema = mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

// Create compound index to prevent duplicate requests and improve query performance
connectionSchema.index({ fromUser: 1, toUser: 1 }, { unique: true })

// Index for efficient status queries
connectionSchema.index({ status: 1 })

// Index for user-specific queries
connectionSchema.index({ fromUser: 1, status: 1 })
connectionSchema.index({ toUser: 1, status: 1 })

const Connection = mongoose.model('Connection', connectionSchema)
export default Connection
