import StudyLog from '../models/StudyLogModel.js';
import Streak from '../models/StreakModel.js';
import User from '../models/UserModel.js';

// Add a new study session
export const addStudyLog = async (req, res) => {
  try {
    const { subject, hours, date, notes, difficulty } = req.body;
    const userId = req.user._id;

    // Validation
    if (!subject || !hours) {
      return res.status(400).json({ message: 'Subject and hours are required' });
    }

    if (hours < 0.1 || hours > 24) {
      return res.status(400).json({ message: 'Hours must be between 0.1 and 24' });
    }

    // Create study log
    const studyLog = new StudyLog({
      userId,
      subject: subject.trim(),
      hours: parseFloat(hours),
      date: date ? new Date(date) : new Date(),
      notes: notes?.trim(),
      difficulty
    });

    await studyLog.save();

    // Update streak
    await updateUserStreak(userId, studyLog.date);

    res.status(201).json({
      message: 'Study session logged successfully',
      studyLog
    });

  } catch (error) {
    console.error('Add study log error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get study logs for a user
export const getStudyLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'week', page = 1, limit = 20 } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get study logs with pagination
    const studyLogs = await StudyLog.find({
      userId,
      date: { $gte: startDate, $lte: now }
    })
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Get summary statistics
    const totalHours = await StudyLog.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hours' },
          totalSessions: { $sum: 1 },
          subjects: { $addToSet: '$subject' }
        }
      }
    ]);

    const summary = totalHours[0] || { totalHours: 0, totalSessions: 0, subjects: [] };

    res.json({
      studyLogs,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(studyLogs.length / limit)
      }
    });

  } catch (error) {
    console.error('Get study logs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user streak information
export const getUserStreak = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let streak = await Streak.findOne({ userId });
    
    if (!streak) {
      // Create initial streak record
      streak = new Streak({ userId });
      await streak.save();
    }

    // Check if streak needs to be updated (if last active was yesterday or earlier)
    const today = new Date();
    const lastActive = new Date(streak.lastActiveDate);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      // Streak broken
      streak.streakCount = 0;
    }

    res.json(streak);

  } catch (error) {
    console.error('Get user streak error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to update user streak
const updateUserStreak = async (userId, studyDate) => {
  try {
    let streak = await Streak.findOne({ userId });
    
    if (!streak) {
      streak = new Streak({ userId });
    }

    const today = new Date(studyDate);
    const lastActive = new Date(streak.lastActiveDate);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no streak change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      streak.streakCount += 1;
      streak.totalStudyDays += 1;
    } else if (daysDiff > 1) {
      // Streak broken, reset
      streak.streakCount = 1;
      streak.totalStudyDays += 1;
    }

    // Update longest streak if current is higher
    if (streak.streakCount > streak.longestStreak) {
      streak.longestStreak = streak.streakCount;
    }

    streak.lastActiveDate = today;
    await streak.save();

  } catch (error) {
    console.error('Update streak error:', error);
  }
};
