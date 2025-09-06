import React, { useState } from 'react';
import { FaClock, FaCalendarAlt, FaBook, FaUsers, FaFilter } from 'react-icons/fa';
import { useAuth, useDocumentTitle } from '@/hooks';
import { useGetTeacherTimetableQuery } from '@/store/api/timetableApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  useDocumentTitle('My Timetable - Teacher Portal');

  const {
    data: timetableData,
    isLoading,
    error,
    refetch
  } = useGetTeacherTimetableQuery({
    teacherId: user?.profileId,
    week: selectedWeek,
    academicYear
  });

  const timetable = timetableData?.data || {};

  const timeSlots = [
    { id: '1', time: '8:00 - 8:40', label: 'Period 1' },
    { id: '2', time: '8:40 - 9:20', label: 'Period 2' },
    { id: '3', time: '9:20 - 10:00', label: 'Period 3' },
    { id: '4', time: '10:00 - 10:40', label: 'Period 4' },
    { id: 'break1', time: '10:40 - 11:00', label: 'Break', isBreak: true },
    { id: '5', time: '11:00 - 11:40', label: 'Period 5' },
    { id: '6', time: '11:40 - 12:20', label: 'Period 6' },
    { id: '7', time: '12:20 - 1:00', label: 'Period 7' },
    { id: 'break2', time: '1:00 - 2:00', label: 'Lunch Break', isBreak: true },
    { id: '8', time: '2:00 - 2:40', label: 'Period 8' },
    { id: '9', time: '2:40 - 3:20', label: 'Period 9' },
    { id: '10', time: '3:20 - 4:00', label: 'Period 10' }
  ];

  const weekDays = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday'
  ];

  const getSubjectColor = (subject: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ];
    const hash = subject.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getLessonForSlot = (day: string, timeSlotId: string) => {
    return timetable[day]?.find((lesson: any) => lesson.timeSlotId === timeSlotId);
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return timetable[today] || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error Loading Timetable</h3>
        <p className="text-red-600 mt-2">Unable to load your timetable. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaClock className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
              <p className="text-gray-600">Your weekly teaching schedule</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week Starting</label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[2024, 2023, 2022].map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaFilter />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Schedule Quick View */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <FaCalendarAlt className="text-blue-600" />
          <span>Today's Schedule</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getTodaySchedule().length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No classes scheduled for today
            </div>
          ) : (
            getTodaySchedule().map((lesson: any, index: number) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${getSubjectColor(lesson.subject?.name || 'Unknown')}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{lesson.subject?.name}</h3>
                  <span className="text-sm opacity-75">{lesson.timeSlot?.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  <FaUsers />
                  <span>{lesson.class?.name} {lesson.class?.stream}</span>
                </div>
                {lesson.room && (
                  <div className="mt-1 text-sm opacity-75">
                    Room: {lesson.room}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Timetable */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Time
                </th>
                {weekDays.map(day => (
                  <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map(slot => (
                <tr key={slot.id} className={slot.isBreak ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r">
                    <div>
                      <div className="font-semibold">{slot.label}</div>
                      <div className="text-xs text-gray-500">{slot.time}</div>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    if (slot.isBreak) {
                      return (
                        <td key={day} className="px-4 py-3 text-center text-sm text-gray-500">
                          {slot.label}
                        </td>
                      );
                    }

                    const lesson = getLessonForSlot(day, slot.id);
                    return (
                      <td key={day} className="px-4 py-3">
                        {lesson ? (
                          <div className={`p-2 rounded border text-xs ${getSubjectColor(lesson.subject?.name || 'Unknown')}`}>
                            <div className="font-semibold truncate">{lesson.subject?.name}</div>
                            <div className="truncate">{lesson.class?.name} {lesson.class?.stream}</div>
                            {lesson.room && (
                              <div className="opacity-75">Room {lesson.room}</div>
                            )}
                          </div>
                        ) : (
                          <div className="h-16 flex items-center justify-center text-gray-400 text-xs">
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;
