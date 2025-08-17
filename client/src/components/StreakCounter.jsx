import React from 'react';
import { Flame, Trophy, Calendar, Target } from 'lucide-react';

const StreakCounter = ({ streakData }) => {
  if (!streakData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  const getStreakEmoji = (count) => {
    if (count >= 30) return '🔥';
    if (count >= 14) return '💪';
    if (count >= 7) return '⚡';
    if (count >= 3) return '🌟';
    return '🚀';
  };

  const getStreakMessage = (count) => {
    if (count === 0) return "Start your streak today!";
    if (count === 1) return "Great start! Keep it up!";
    if (count < 7) return "Building momentum!";
    if (count < 14) return "You're on fire!";
    if (count < 30) return "Incredible dedication!";
    return "Legendary streak!";
  };

  const getMotivationalTip = (count) => {
    if (count === 0) return "Log your first study session to start building your streak.";
    if (count < 3) return "Study for just 30 minutes today to keep your streak alive.";
    if (count < 7) return "You're building a great habit! Don't break the chain.";
    if (count < 14) return "Two weeks is within reach. Stay consistent!";
    return "You're a study machine! Keep pushing forward.";
  };

  return (
    <div className="p-6">
      {/* Main Streak Display */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">
          {getStreakEmoji(streakData.streakCount)}
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {streakData.streakCount}
        </div>
        <div className="text-lg text-gray-600 mb-1">
          Day{streakData.streakCount !== 1 ? 's' : ''} Streak
        </div>
        <div className="text-sm font-medium text-blue-600">
          {getStreakMessage(streakData.streakCount)}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <Trophy className="text-orange-500 mx-auto mb-2" size={24} />
          <div className="text-lg font-bold text-gray-900">
            {streakData.longestStreak}
          </div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <Calendar className="text-green-500 mx-auto mb-2" size={24} />
          <div className="text-lg font-bold text-gray-900">
            {streakData.totalStudyDays}
          </div>
          <div className="text-xs text-gray-600">Total Days</div>
        </div>
      </div>

      {/* Last Active */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="text-gray-500" size={16} />
          <span className="text-sm font-medium text-gray-700">Last Active</span>
        </div>
        <div className="text-sm text-gray-600">
          {new Date(streakData.lastActiveDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> {getMotivationalTip(streakData.streakCount)}
        </div>
      </div>

      {/* Progress Bar for Next Milestone */}
      {streakData.streakCount < 30 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-600">Next milestone</span>
            <span className="text-xs font-medium text-gray-900">
              {streakData.streakCount < 7 ? '7 days' : 
               streakData.streakCount < 14 ? '14 days' : 
               streakData.streakCount < 30 ? '30 days' : '100 days'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${streakData.streakCount < 7 ? 
                  (streakData.streakCount / 7) * 100 :
                  streakData.streakCount < 14 ?
                  (streakData.streakCount / 14) * 100 :
                  streakData.streakCount < 30 ?
                  (streakData.streakCount / 30) * 100 :
                  100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakCounter;
