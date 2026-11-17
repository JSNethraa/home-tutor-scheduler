import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, scheduleApi } from '../api';
import { Badge } from '../components/Badge';
import { CheckSquare, Save, Calendar, UserCheck, AlertCircle, Clock } from 'lucide-react';

export const AttendancePage = () => {
  const { isTutor, isAdmin, isParent, isStudent } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionSheet, setSessionSheet] = useState(null);
  const [students, setStudents] = useState([]);
  const [topicCovered, setTopicCovered] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Student stats view state
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await scheduleApi.getSessions();
        const sessionList = res.data.results || res.data || [];
        setSessions(sessionList);
        if (sessionList.length > 0) {
          setSelectedSessionId(sessionList[0].id);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
      }
    };

    fetchSessions();

    if (isStudent || isParent) {
      attendanceApi.getStudentStats().then((res) => setStats(res.data)).catch(() => {});
    }
  }, [isStudent, isParent]);

  useEffect(() => {
    if (!selectedSessionId) return;

    const loadSheet = async () => {
      setLoading(true);
      setSuccessMsg('');
      try {
        const res = await attendanceApi.getSessionSheet(selectedSessionId);
        setSessionSheet(res.data);
        setStudents(res.data.students || []);
        setTopicCovered(res.data.topic_covered || '');
      } catch (err) {
        console.error('Error loading session sheet:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSheet();
  }, [selectedSessionId]);

  const handleStatusChange = (studentId, status) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, current_status: status } : s))
    );
  };

  const handleRemarkChange = (studentId, remark) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks: remark } : s))
    );
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const payload = {
        session_id: parseInt(selectedSessionId),
        topic_covered: topicCovered,
        session_status: 'COMPLETED',
        records: students.map((s) => ({
          student_id: s.student_id,
          status: s.current_status,
          remarks: s.remarks,
        })),
      };
      await attendanceApi.submitBulk(payload);
      setSuccessMsg('Attendance records successfully saved and session marked as completed!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Log student presence, track punctuality, and generate attendance compliance metrics.
          </p>
        </div>

        {stats && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Attendance Score</p>
              <p className="text-lg font-bold text-green-600">{stats.attendance_percentage}%</p>
            </div>
            <div className="text-xs text-gray-500 border-l border-gray-100 pl-3 space-y-0.5">
              <div>Present: <span className="font-semibold text-gray-800">{stats.present_count}</span></div>
              <div>Absent: <span className="font-semibold text-red-600">{stats.absent_count}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Session Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Select Class Session
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.session_date} — {s.batch?.name} ({s.start_time} to {s.end_time}) [{s.status}]
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Roster */}
      {sessionSheet && (
        <form onSubmit={handleSaveAttendance} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{sessionSheet.batch_name}</h2>
                <Badge variant={sessionSheet.session_status === 'COMPLETED' ? 'success' : 'primary'} size="xs">
                  {sessionSheet.session_status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Date: <span className="font-semibold text-gray-700">{sessionSheet.session_date}</span>
              </p>
            </div>

            {(isTutor || isAdmin) && (
              <button
                type="submit"
                disabled={saving || students.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Attendance Sheet'}</span>
              </button>
            )}
          </div>

          {successMsg && (
            <div className="p-4 bg-green-50 border-b border-green-100 text-green-800 text-sm font-medium flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Topic Covered Input */}
          {(isTutor || isAdmin) && (
            <div className="p-6 border-b border-gray-100 bg-white">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Class Syllabus / Topic Covered Today
              </label>
              <input
                type="text"
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                placeholder="e.g. Chapter 3: Laws of Motion, Friction Numerical Examples"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-gray-400">Loading student roster...</div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No students currently enrolled in this batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Grade</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Tutor Remarks / Punctuality Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((st) => (
                    <tr key={st.student_id} className="hover:bg-gray-50/60 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {st.student_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {st.grade_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                          {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((stType) => {
                            const active = st.current_status === stType;
                            const colors = {
                              PRESENT: active ? 'bg-green-600 text-white font-semibold' : 'text-gray-600 hover:text-gray-900',
                              ABSENT: active ? 'bg-red-600 text-white font-semibold' : 'text-gray-600 hover:text-gray-900',
                              LATE: active ? 'bg-amber-500 text-white font-semibold' : 'text-gray-600 hover:text-gray-900',
                              EXCUSED: active ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:text-gray-900',
                            };
                            return (
                              <button
                                key={stType}
                                type="button"
                                disabled={!(isTutor || isAdmin)}
                                onClick={() => handleStatusChange(st.student_id, stType)}
                                className={`px-2.5 py-1 text-xs rounded-md transition ${colors[stType]}`}
                              >
                                {stType}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          disabled={!(isTutor || isAdmin)}
                          value={st.remarks || ''}
                          onChange={(e) => handleRemarkChange(st.student_id, e.target.value)}
                          placeholder="e.g. Arrived on time, answered board questions"
                          className="w-full max-w-sm px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
