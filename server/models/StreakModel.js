import mongoose from 'mongoose';

const streakSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    streakCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    totalStudyDays: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Index for efficient querying
streakSchema.index({ userId: 1 });
streakSchema.index({ streakCount: -1 });

const Streak = mongoose.model('Streak', streakSchema);
export default Streak;
