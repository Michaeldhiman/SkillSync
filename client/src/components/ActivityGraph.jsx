import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

const ActivityGraph = ({ studyData }) => {
  const [chartType, setChartType] = React.useState('bar');

  if (!studyData || !studyData.studyLogs) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Process data for weekly view
  const processWeeklyData = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = weekDays.map(day => ({ day, hours: 0, sessions: 0 }));

    studyData.studyLogs.forEach(log => {
      const logDate = new Date(log.date);
      const dayIndex = logDate.getDay();
      weekData[dayIndex].hours += log.hours;
      weekData[dayIndex].sessions += 1;
    });

    return weekData;
  };

  // Process data for subject breakdown
  const processSubjectData = () => {
    const subjectMap = {};
    
    studyData.studyLogs.forEach(log => {
      if (subjectMap[log.subject]) {
        subjectMap[log.subject].hours += log.hours;
        subjectMap[log.subject].sessions += 1;
      } else {
        subjectMap[log.subject] = {
          subject: log.subject,
          hours: log.hours,
          sessions: 1
        };
      }
    });

    return Object.values(subjectMap).sort((a, b) => b.hours - a.hours);
  };

  const weeklyData = processWeeklyData();
  const subjectData = processSubjectData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'hours' ? 
                `${entry.value.toFixed(1)} hours` : 
                `${entry.value} sessions`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      {/* Chart Type Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
              chartType === 'bar' 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BarChart3 size={16} />
            Weekly
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
              chartType === 'line' 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TrendingUp size={16} />
            Subjects
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="hours" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="Hours"
              />
            </BarChart>
          ) : (
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="subject" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="hours" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="Hours"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {studyData.summary.totalHours?.toFixed(1) || '0'}
          </div>
          <div className="text-xs text-gray-600">Total Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {studyData.summary.totalSessions || '0'}
          </div>
          <div className="text-xs text-gray-600">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {studyData.summary.subjects?.length || '0'}
          </div>
          <div className="text-xs text-gray-600">Subjects</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {studyData.summary.totalHours ? 
              (studyData.summary.totalHours / studyData.summary.totalSessions).toFixed(1) : 
              '0'
            }
          </div>
          <div className="text-xs text-gray-600">Avg/Session</div>
        </div>
      </div>
    </div>
  );
};

export default ActivityGraph;
