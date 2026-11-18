import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, scheduleApi, batchApi } from '../api';
import { Badge } from '../components/Badge';
import { CheckSquare, Save, Calendar, UserCheck, AlertCircle, Clock, Users, ChevronRight } from 'lucide-react';

export const AttendancePage = () => {
  const { isTutor, isAdmin, isParent, isStudent } = useAuth();

  // Tab mode: 'mark' | 'track'
  const [activeTab, setActiveTab] = useState('mark');

  // Mark Session State
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionSheet, setSessionSheet] = useState(null);
  const [students, setStudents] = useState([]);
  const [topicCovered, setTopicCovered] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Overall student stats (for logged in student / parent)
  const [stats, setStats] = useState(null);

  // Student Attendance Tracker State
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStudentForTrack, setSelectedStudentForTrack] = useState(null);
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [trackingStats, setTrackingStats] = useState(null);
  const [loadingTrackRecords, setLoadingTrackRecords] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, batchRes] = await Promise.all([
          scheduleApi.getSessions(),
          batchApi.getMyBatches(),
        ]);
        const sessionList = sessionRes.data.results || sessionRes.data || [];
        setSessions(sessionList);
        if (sessionList.length > 0) {
          setSelectedSessionId(sessionList[0].id);
        }

        const batchList = batchRes.data || [];
        setBatches(batchList);
        if (batchList.length > 0) {
          setSelectedBatchId(batchList[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();

    if (isStudent || isParent) {
      attendanceApi.getStudentStats().then((res) => setStats(res.data)).catch(() => {});
    }
  }, [isStudent, isParent]);

  // Load session sheet when selectedSessionId changes
  useEffect(() => {
    if (!selectedSessionId || activeTab !== 'mark') return;

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
  }, [selectedSessionId, activeTab]);

  // Load student tracking records
  const handleSelectStudentForTrack = async (st) => {
    setSelectedStudentForTrack(st);
    setLoadingTrackRecords(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        attendanceApi.getRecords({ student_id: st.student_id, batch_id: selectedBatchId }),
        attendanceApi.getStudentStats(st.student_id, selectedBatchId),
      ]);
      setTrackingRecords(recordsRes.data.results || recordsRes.data || []);
      setTrackingStats(statsRes.data);
    } catch (err) {
      console.error('Error loading student attendance records:', err);
    } finally {
      setLoadingTrackRecords(false);
    }
  };

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

  const currentBatch = batches.find((b) => b.id === parseInt(selectedBatchId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Log student presence, track individual attendance compliance, and view historical class logs.
          </p>
        </div>

        {stats && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">My Attendance Score</p>
              <p className="text-lg font-bold text-green-600">{stats.attendance_percentage}%</p>
            </div>
            <div className="text-xs text-gray-500 border-l border-gray-100 pl-3 space-y-0.5">
              <div>Present: <span className="font-semibold text-gray-800">{stats.present_count}</span></div>
              <div>Absent: <span className="font-semibold text-red-600">{stats.absent_count}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('mark')}
          className={`pb-3 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === 'mark'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('track')}
          className={`pb-3 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === 'track'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Track Student Attendance History</span>
        </button>
      </div>

      {/* TAB 1: MARK DAILY SESSION ATTENDANCE */}
      {activeTab === 'mark' && (
        <div className="space-y-6">
          {/* Session Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Scheduled Class Session
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
      )}

      {/* TAB 2: TRACK STUDENT ATTENDANCE HISTORY */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* Select Batch */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Batch / Course to Track
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedStudentForTrack(null);
                setTrackingRecords([]);
                setTrackingStats(null);
              }}
              className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.enrolled_count} students)
                </option>
              ))}
            </select>
          </div>

          {/* Enrolled Students in Selected Batch */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Students Roster List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Enrolled Students</span>
              </h2>

              {(!currentBatch?.enrolled_students || currentBatch.enrolled_students.length === 0) ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No students currently enrolled in this batch.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentBatch.enrolled_students.map((st) => {
                    const isSelected = selectedStudentForTrack?.student_id === st.student_id;
                    const att = st.attendance_stats || { percentage: 100, present: 0, total: 0 };
                    const attVariant = att.percentage >= 85 ? 'success' : att.percentage >= 70 ? 'warning' : 'danger';

                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectStudentForTrack(st)}
                        className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                            : 'bg-gray-50/70 hover:bg-gray-100/80 border-gray-200'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">{st.student_name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant={attVariant} size="xs">
                              {att.percentage}%
                            </Badge>
                            <span className="text-[10px] text-gray-500">
                              {att.present}/{att.total} classes
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Detailed Attendance Records for Selected Student */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {!selectedStudentForTrack ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p>Click on any enrolled student to track their detailed attendance records.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {selectedStudentForTrack.student_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Grade: {selectedStudentForTrack.grade_level} • Batch: {currentBatch?.name}
                      </p>
                    </div>

                    {trackingStats && (
                      <Badge
                        variant={
                          trackingStats.attendance_percentage >= 85
                            ? 'success'
                            : trackingStats.attendance_percentage >= 70
                            ? 'warning'
                            : 'danger'
                        }
                        size="md"
                      >
                        {trackingStats.attendance_percentage}% Attendance Rate
                      </Badge>
                    )}
                  </div>

                  {/* Summary Metric Counters */}
                  {trackingStats && (
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Conducted</p>
                        <p className="text-base font-bold text-gray-900 mt-0.5">{trackingStats.total_sessions}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-[10px] font-bold text-green-700 uppercase">Present</p>
                        <p className="text-base font-bold text-green-700 mt-0.5">{trackingStats.present_count}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-[10px] font-bold text-red-700 uppercase">Absent</p>
                        <p className="text-base font-bold text-red-700 mt-0.5">{trackingStats.absent_count}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-700 uppercase">Late / Excused</p>
                        <p className="text-base font-bold text-amber-700 mt-0.5">
                          {(trackingStats.late_count || 0) + (trackingStats.excused_count || 0)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Attendance Log Table */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden mt-4">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase">
                      Class Attendance History Log
                    </div>

                    {loadingTrackRecords ? (
                      <div className="py-10 text-center text-xs text-gray-400">Loading session history...</div>
                    ) : trackingRecords.length === 0 ? (
                      <div className="py-10 text-center text-xs text-gray-400">
                        No session attendance records found for this student.
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                            <tr>
                              <th className="px-3.5 py-2">Date & Time</th>
                              <th className="px-3.5 py-2">Topic Covered</th>
                              <th className="px-3.5 py-2">Status</th>
                              <th className="px-3.5 py-2">Tutor Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {trackingRecords.map((rec) => (
                              <tr key={rec.id} className="hover:bg-gray-50/50 transition">
                                <td className="px-3.5 py-2.5 whitespace-nowrap font-semibold text-gray-900">
                                  {rec.session_date}
                                  <span className="block text-[10px] font-normal text-gray-400">{rec.session_time}</span>
                                </td>
                                <td className="px-3.5 py-2.5 text-gray-600 max-w-xs truncate">
                                  {rec.topic_covered || '—'}
                                </td>
                                <td className="px-3.5 py-2.5 whitespace-nowrap">
                                  <Badge
                                    variant={
                                      rec.status === 'PRESENT'
                                        ? 'success'
                                        : rec.status === 'ABSENT'
                                        ? 'danger'
                                        : rec.status === 'LATE'
                                        ? 'warning'
                                        : 'primary'
                                    }
                                    size="xs"
                                  >
                                    {rec.status}
                                  </Badge>
                                </td>
                                <td className="px-3.5 py-2.5 text-gray-500 italic max-w-xs truncate">
                                  {rec.remarks || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
