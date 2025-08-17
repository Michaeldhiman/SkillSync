import mongoose from 'mongoose';

const studyLogSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0.1,
      max: 24
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    }
  },
  { timestamps: true }
);

// Index for efficient querying
studyLogSchema.index({ userId: 1, date: -1 });
studyLogSchema.index({ userId: 1, subject: 1 });

const StudyLog = mongoose.model('StudyLog', studyLogSchema);
export default StudyLog;
