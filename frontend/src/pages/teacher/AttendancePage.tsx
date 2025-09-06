import React, { useState } from 'react';
import { FaUserCheck, FaCalendarAlt, FaSave, FaUsers, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useAuth, useDocumentTitle, useNotifications } from '@/hooks';
import { useGetClassStudentsQuery } from '@/store/api/academicApi';
import { useMarkAttendanceMutation, useGetTodayAttendanceQuery } from '@/store/api/attendanceApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { success: notifySuccess, error: notifyError } = useNotifications();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});

  useDocumentTitle('Mark Attendance - Teacher Portal');

  const {
    data: studentsData,
    isLoading: studentsLoading
  } = useGetClassStudentsQuery(selectedClass, { skip: !selectedClass });

  const {
    data: existingAttendance,
    isLoading: attendanceLoading
  } = useGetTodayAttendanceQuery({
    classId: selectedClass,
    date: selectedDate
  }, { skip: !selectedClass });

  const [markAttendance, { isLoading: savingAttendance }] = useMarkAttendanceMutation();

  const students = studentsData?.data || [];

  // Initialize attendance records when students load
  React.useEffect(() => {
    if (students.length > 0) {
      const initialRecords: Record<string, AttendanceRecord> = {};
      students.forEach(student => {
        const existingRecord = existingAttendance?.data?.find(
          (record: any) => record.studentId === student._id
        );
        initialRecords[student._id] = {
          studentId: student._id,
          status: existingRecord?.status || 'present',
          remarks: existingRecord?.remarks || ''
        };
      });
      setAttendanceRecords(initialRecords);
    }
  }, [students, existingAttendance]);

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || Object.keys(attendanceRecords).length === 0) {
      notifyError('Please select a class and mark attendance');
      return;
    }

    try {
      await markAttendance({
        classId: selectedClass,
        date: selectedDate,
        attendanceRecords: Object.values(attendanceRecords)
      }).unwrap();
      notifySuccess('Attendance saved successfully!');
    } catch (error) {
      notifyError('Failed to save attendance. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAttendanceStats = () => {
    const records = Object.values(attendanceRecords);
    return {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length
    };
  };

  const stats = getAttendanceStats();

  if (studentsLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaUserCheck className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
              <p className="text-gray-600">Record student attendance for the day</p>
            </div>
          </div>
          {stats.total > 0 && (
            <button
              onClick={handleSaveAttendance}
              disabled={savingAttendance}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FaSave />
              <span>{savingAttendance ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class...</option>
              <option value="class1">Form 1 East</option>
              <option value="class2">Form 1 West</option>
              <option value="class3">Form 2 North</option>
              <option value="class4">Form 2 South</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <FaUsers className="mx-auto text-gray-600 mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <FaCheckCircle className="mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold text-green-900">{stats.present}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <FaTimesCircle className="mx-auto text-red-600 mb-1" />
              <p className="text-lg font-bold text-red-900">{stats.absent}</p>
              <p className="text-xs text-red-600">Absent</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <FaUserCheck className="mx-auto text-yellow-600 mb-1" />
              <p className="text-lg font-bold text-yellow-900">{stats.late}</p>
              <p className="text-xs text-yellow-600">Late</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <FaUserCheck className="mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold text-blue-900">{stats.excused}</p>
              <p className="text-xs text-blue-600">Excused</p>
            </div>
          </div>
        )}
      </div>

      {/* Attendance List */}
      {!selectedClass ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FaUserCheck className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Select a Class</h3>
          <p className="text-gray-500 mt-2">Choose a class from the dropdown above to start marking attendance.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FaUsers className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No Students Found</h3>
          <p className="text-gray-500 mt-2">This class doesn't have any enrolled students.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900">Students Attendance</h3>
            <p className="text-sm text-gray-600">{selectedDate} - {students.length} students</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {students.map((student) => {
              const record = attendanceRecords[student._id];
              return (
                <div key={student._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{student.admissionNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Status Buttons */}
                      <div className="flex space-x-2">
                        {['present', 'absent', 'late', 'excused'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student._id, status as AttendanceRecord['status'])}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                              record?.status === status
                                ? getStatusColor(status)
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Remarks Input */}
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={record?.remarks || ''}
                        onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                        className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
