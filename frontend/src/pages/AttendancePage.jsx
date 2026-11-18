import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  CheckSquare, Save, Calendar, UserCheck, Clock,
  Users, ChevronRight, CheckCircle2,
} from 'lucide-react';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SESSIONS = [
  { id: 1, batch: { id: 1, name: 'Physics Batch A' },      session_date: '2026-11-18', start_time: '09:00', end_time: '10:30', status: 'SCHEDULED' },
  { id: 2, batch: { id: 2, name: 'Maths 1-on-1 (Rohit)' }, session_date: '2026-11-18', start_time: '11:00', end_time: '12:00', status: 'SCHEDULED' },
  { id: 3, batch: { id: 3, name: 'Chemistry Group' },       session_date: '2026-11-19', start_time: '14:00', end_time: '15:30', status: 'SCHEDULED' },
];

const MOCK_BATCHES = [
  {
    id: 1, name: 'Physics Batch A', subject: 'Physics',
    enrolled_students: [
      { id: 1, student_id: 4, student_name: 'Rohit Sharma', grade_level: 'Grade 10', attendance_stats: { percentage: 96, present: 24, total: 25 } },
      { id: 2, student_id: 5, student_name: 'Priya Patel',  grade_level: 'Grade 10', attendance_stats: { percentage: 90, present: 18, total: 20 } },
    ],
  },
  {
    id: 2, name: 'Maths 1-on-1 (Rohit)', subject: 'Maths',
    enrolled_students: [
      { id: 3, student_id: 4, student_name: 'Rohit Sharma', grade_level: 'Grade 10', attendance_stats: { percentage: 100, present: 12, total: 12 } },
    ],
  },
  {
    id: 3, name: 'Chemistry Group', subject: 'Chemistry',
    enrolled_students: [
      { id: 4, student_id: 6, student_name: 'Arjun Verma',  grade_level: 'Grade 11', attendance_stats: { percentage: 82, present: 14, total: 17 } },
      { id: 5, student_id: 8, student_name: 'Anjali Singh', grade_level: 'Grade 9',  attendance_stats: { percentage: 94, present: 16, total: 17 } },
    ],
  },
];

const INIT_RECORDS = {
  4: [ // Rohit's records
    { id: 1, session_date: '2026-11-01', session_time: '09:00–10:30', topic_covered: 'Laws of Motion',    status: 'PRESENT', remarks: 'On time, active participation' },
    { id: 2, session_date: '2026-11-05', session_time: '09:00–10:30', topic_covered: 'Work & Energy',     status: 'PRESENT', remarks: '' },
    { id: 3, session_date: '2026-11-08', session_time: '09:00–10:30', topic_covered: 'Friction',          status: 'ABSENT',  remarks: 'Sick leave' },
    { id: 4, session_date: '2026-11-12', session_time: '09:00–10:30', topic_covered: 'Circular Motion',   status: 'PRESENT', remarks: '' },
    { id: 5, session_date: '2026-11-15', session_time: '09:00–10:30', topic_covered: 'Gravitation',       status: 'LATE',    remarks: 'Arrived 15 min late' },
  ],
  5: [ // Priya's records
    { id: 6, session_date: '2026-11-01', session_time: '09:00–10:30', topic_covered: 'Laws of Motion',    status: 'PRESENT', remarks: '' },
    { id: 7, session_date: '2026-11-05', session_time: '09:00–10:30', topic_covered: 'Work & Energy',     status: 'ABSENT',  remarks: '' },
    { id: 8, session_date: '2026-11-08', session_time: '09:00–10:30', topic_covered: 'Friction',          status: 'PRESENT', remarks: '' },
  ],
  6: [ // Arjun's records
    { id: 9,  session_date: '2026-11-02', session_time: '14:00–15:30', topic_covered: 'Atomic Structure',  status: 'PRESENT', remarks: '' },
    { id: 10, session_date: '2026-11-06', session_time: '14:00–15:30', topic_covered: 'Periodic Table',    status: 'ABSENT',  remarks: 'No notice' },
    { id: 11, session_date: '2026-11-09', session_time: '14:00–15:30', topic_covered: 'Chemical Bonding',  status: 'PRESENT', remarks: '' },
  ],
  8: [ // Anjali's records
    { id: 12, session_date: '2026-11-02', session_time: '14:00–15:30', topic_covered: 'Atomic Structure',  status: 'PRESENT', remarks: '' },
    { id: 13, session_date: '2026-11-06', session_time: '14:00–15:30', topic_covered: 'Periodic Table',    status: 'PRESENT', remarks: 'Excellent questions!' },
  ],
};

const computeStats = (records) => {
  const total   = records.length;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const absent  = records.filter(r => r.status === 'ABSENT').length;
  const late    = records.filter(r => r.status === 'LATE').length;
  const excused = records.filter(r => r.status === 'EXCUSED').length;
  return { total_sessions: total, present_count: present, absent_count: absent, late_count: late, excused_count: excused, attendance_percentage: total ? Math.round((present / total) * 100) : 100 };
};

export const AttendancePage = () => {
  const { user, isTutor, isAdmin, isParent, isStudent } = useAuth();

  const [activeTab, setActiveTab] = useState(isStudent || isParent ? 'track' : 'mark');

  // Mark tab state
  const [selectedSessionId, setSelectedSessionId] = useState(MOCK_SESSIONS[0]?.id || '');
  const [topicCovered, setTopicCovered]           = useState('');
  const [students, setStudents]                   = useState(
    MOCK_BATCHES[0]?.enrolled_students.map(s => ({ ...s, current_status: 'PRESENT', remarks: '' })) || []
  );
  const [successMsg, setSuccessMsg]               = useState('');

  // Track tab state
  const [selectedBatchId, setSelectedBatchId]           = useState(MOCK_BATCHES[0]?.id);
  const [selectedStudentForTrack, setSelectedStudentForTrack] = useState(null);
  const [allRecords, setAllRecords]                     = useState(INIT_RECORDS);
  const [trackingStats, setTrackingStats]               = useState(null);

  // Status edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord]     = useState(null);
  const [newStatus, setNewStatus]             = useState('PRESENT');
  const [statusRemarks, setStatusRemarks]     = useState('');
  const [assistedBy, setAssistedBy]           = useState('');
  const [trackerSuccessMsg, setTrackerSuccessMsg] = useState('');

  const currentBatch = MOCK_BATCHES.find(b => b.id === parseInt(selectedBatchId));

  // Load session when session changes in mark tab
  const handleSessionChange = (sid) => {
    setSelectedSessionId(sid);
    const session = MOCK_SESSIONS.find(s => s.id === parseInt(sid));
    const batch   = MOCK_BATCHES.find(b => b.id === session?.batch?.id);
    setStudents(batch?.enrolled_students.map(s => ({ ...s, current_status: 'PRESENT', remarks: '' })) || []);
    setSuccessMsg('');
  };

  const handleSaveAttendance = (e) => {
    e.preventDefault();
    setSuccessMsg('Attendance records successfully saved and session marked as completed!');
  };

  const loadStudentRecords = (st, batchId) => {
    setSelectedStudentForTrack(st);
    const recs = allRecords[st.student_id] || [];
    setTrackingStats(computeStats(recs));
    setTrackerSuccessMsg('');
  };

  const handleBatchSelectChange = (val) => {
    setSelectedBatchId(val);
    setSelectedStudentForTrack(null);
    setTrackingStats(null);
    setTrackerSuccessMsg('');
  };

  const trackingRecords = selectedStudentForTrack ? (allRecords[selectedStudentForTrack.student_id] || []) : [];

  const handleOpenEditStatus = (rec) => {
    setEditingRecord(rec);
    setNewStatus(rec.status);
    setStatusRemarks(rec.remarks || '');
    setAssistedBy('Tutor Ramesh (Lead Instructor)');
    setIsEditModalOpen(true);
  };

  const handleSaveStatusChange = (e) => {
    e.preventDefault();
    if (!editingRecord || !selectedStudentForTrack) return;
    const sid = selectedStudentForTrack.student_id;
    const updated = { ...editingRecord, status: newStatus, remarks: statusRemarks };
    setAllRecords(prev => ({ ...prev, [sid]: prev[sid].map(r => r.id === editingRecord.id ? updated : r) }));
    setTrackingStats(computeStats(allRecords[sid].map(r => r.id === editingRecord.id ? updated : r)));
    setTrackerSuccessMsg(`Attendance status for ${editingRecord.session_date} updated to ${newStatus}!`);
    setIsEditModalOpen(false);
  };

  const statusColors = {
    PRESENT: 'active ? bg-green-600 text-white : text-gray-600',
    ABSENT:  'active ? bg-red-600 text-white : text-gray-600',
    LATE:    'active ? bg-amber-500 text-white : text-gray-600',
    EXCUSED: 'active ? bg-blue-600 text-white : text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Track enrolled student attendance, check session status, and adjust records.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        {(isTutor || isAdmin) && (
          <button type="button" onClick={() => setActiveTab('mark')}
            className={`pb-3 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${activeTab === 'mark' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            <CheckSquare className="w-4 h-4" /> Mark Class Attendance
          </button>
        )}
        <button type="button" onClick={() => setActiveTab('track')}
          className={`pb-3 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${activeTab === 'track' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <Calendar className="w-4 h-4" /> {isStudent ? 'My Enrolled Attendance Tracker' : 'Track Student Attendance History'}
        </button>
      </div>

      {/* TAB 1: MARK */}
      {activeTab === 'mark' && (isTutor || isAdmin) && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Scheduled Class Session</label>
            <select value={selectedSessionId} onChange={e => handleSessionChange(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MOCK_SESSIONS.map(s => (
                <option key={s.id} value={s.id}>{s.session_date} — {s.batch?.name} ({s.start_time}–{s.end_time})</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSaveAttendance} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-gray-900">Attendance Sheet</h2>
              <button type="submit" disabled={students.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Attendance Sheet
              </button>
            </div>

            {successMsg && (
              <div className="p-4 bg-green-50 border-b border-green-100 text-green-800 text-sm font-medium flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" /> {successMsg}
              </div>
            )}

            <div className="p-6 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Class Syllabus / Topic Covered Today</label>
              <input type="text" value={topicCovered} onChange={e => setTopicCovered(e.target.value)}
                placeholder="e.g. Chapter 3: Laws of Motion"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>

            {students.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No students enrolled in this batch.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Grade</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(st => (
                      <tr key={st.student_id} className="hover:bg-gray-50/60 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{st.student_name}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{st.grade_level}</td>
                        <td className="px-6 py-4">
                          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                            {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(type => {
                              const active = st.current_status === type;
                              const cls = {
                                PRESENT: active ? 'bg-green-600 text-white font-semibold' : 'text-gray-600 hover:text-gray-900',
                                ABSENT:  active ? 'bg-red-600 text-white font-semibold'   : 'text-gray-600 hover:text-gray-900',
                                LATE:    active ? 'bg-amber-500 text-white font-semibold' : 'text-gray-600 hover:text-gray-900',
                                EXCUSED: active ? 'bg-blue-600 text-white font-semibold'  : 'text-gray-600 hover:text-gray-900',
                              }[type];
                              return (
                                <button key={type} type="button"
                                  onClick={() => setStudents(prev => prev.map(s => s.student_id === st.student_id ? { ...s, current_status: type } : s))}
                                  className={`px-2.5 py-1 text-xs rounded-md transition ${cls}`}>
                                  {type}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={st.remarks || ''}
                            onChange={e => setStudents(prev => prev.map(s => s.student_id === st.student_id ? { ...s, remarks: e.target.value } : s))}
                            placeholder="e.g. Arrived on time"
                            className="w-full max-w-sm px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: TRACK */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {trackerSuccessMsg && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" /> {trackerSuccessMsg}
              </div>
              <button onClick={() => setTrackerSuccessMsg('')} className="text-xs text-green-700 underline font-normal">Dismiss</button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Batch / Course</label>
            <select value={selectedBatchId} onChange={e => handleBatchSelectChange(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MOCK_BATCHES.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.enrolled_students.length} students) — {b.subject}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Enrolled Students
              </h2>
              {!currentBatch?.enrolled_students?.length ? (
                <div className="py-8 text-center text-xs text-gray-400">No students enrolled.</div>
              ) : (
                <div className="space-y-2">
                  {currentBatch.enrolled_students.map(st => {
                    const isSelected = selectedStudentForTrack?.student_id === st.student_id;
                    const att = st.attendance_stats || { percentage: 100, present: 0, total: 0 };
                    return (
                      <button key={st.id} type="button" onClick={() => loadStudentRecords(st, selectedBatchId)}
                        className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${isSelected ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' : 'bg-gray-50/70 hover:bg-gray-100/80 border-gray-200'}`}>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{st.student_name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant={att.percentage >= 85 ? 'success' : att.percentage >= 70 ? 'warning' : 'danger'} size="xs">{att.percentage}%</Badge>
                            <span className="text-[10px] text-gray-500">{att.present}/{att.total} classes</span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {!selectedStudentForTrack ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p>Click on any enrolled student to track their detailed attendance records.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{selectedStudentForTrack.student_name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Grade: {selectedStudentForTrack.grade_level} • Batch: {currentBatch?.name}</p>
                    </div>
                    {trackingStats && (
                      <Badge variant={trackingStats.attendance_percentage >= 85 ? 'success' : trackingStats.attendance_percentage >= 70 ? 'warning' : 'danger'} size="md">
                        {trackingStats.attendance_percentage}% Attendance Rate
                      </Badge>
                    )}
                  </div>

                  {trackingStats && (
                    <div className="grid grid-cols-4 gap-3 text-center">
                      {[
                        { label: 'Total',   value: trackingStats.total_sessions,   bg: 'bg-gray-50',   text: 'text-gray-900' },
                        { label: 'Present', value: trackingStats.present_count,    bg: 'bg-green-50',  text: 'text-green-700' },
                        { label: 'Absent',  value: trackingStats.absent_count,     bg: 'bg-red-50',    text: 'text-red-700' },
                        { label: 'Late/Exc',value: (trackingStats.late_count || 0) + (trackingStats.excused_count || 0), bg: 'bg-amber-50', text: 'text-amber-700' },
                      ].map(c => (
                        <div key={c.label} className={`p-3 ${c.bg} rounded-xl border border-gray-100`}>
                          <p className={`text-[10px] font-bold uppercase ${c.text} opacity-70`}>{c.label}</p>
                          <p className={`text-base font-bold ${c.text} mt-0.5`}>{c.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border border-gray-100 rounded-xl overflow-hidden mt-4">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase flex items-center justify-between">
                      <span>Class Attendance History Log</span>
                      <span className="text-[11px] font-normal text-gray-500">{trackingRecords.length} sessions logged</span>
                    </div>
                    {trackingRecords.length === 0 ? (
                      <div className="py-10 text-center text-xs text-gray-400">No session records found for this student.</div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                            <tr>
                              <th className="px-3.5 py-2">Date & Time</th>
                              <th className="px-3.5 py-2">Topic Covered</th>
                              <th className="px-3.5 py-2">Status</th>
                              <th className="px-3.5 py-2">Remarks</th>
                              <th className="px-3.5 py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {trackingRecords.map(rec => (
                              <tr key={rec.id} className="hover:bg-gray-50/50 transition">
                                <td className="px-3.5 py-2.5 whitespace-nowrap font-semibold text-gray-900">
                                  {rec.session_date}
                                  <span className="block text-[10px] font-normal text-gray-400">{rec.session_time}</span>
                                </td>
                                <td className="px-3.5 py-2.5 text-gray-600 max-w-xs truncate">{rec.topic_covered || '—'}</td>
                                <td className="px-3.5 py-2.5 whitespace-nowrap">
                                  <Badge variant={rec.status === 'PRESENT' ? 'success' : rec.status === 'ABSENT' ? 'danger' : rec.status === 'LATE' ? 'warning' : 'primary'} size="xs">
                                    {rec.status}
                                  </Badge>
                                </td>
                                <td className="px-3.5 py-2.5 text-gray-500 italic max-w-xs truncate">{rec.remarks || '—'}</td>
                                <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                                  <button type="button" onClick={() => handleOpenEditStatus(rec)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg shadow-sm transition">
                                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                    {isStudent ? 'Change with Help' : 'Change Status'}
                                  </button>
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

      {/* Status Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Change Attendance Status & Record" maxWidth="max-w-md">
        {editingRecord && (
          <form onSubmit={handleSaveStatusChange} className="space-y-4">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{selectedStudentForTrack?.student_name}</span>
                <span className="font-semibold text-blue-700">{editingRecord.session_date}</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">Topic: <span className="font-medium">{editingRecord.topic_covered || 'General Session'}</span></p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-gray-500 text-[11px]">Current Status:</span>
                <Badge variant={editingRecord.status === 'PRESENT' ? 'success' : editingRecord.status === 'ABSENT' ? 'danger' : 'warning'} size="xs">{editingRecord.status}</Badge>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select New Status</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'PRESENT', label: 'Present', color: 'border-green-500 bg-green-50 text-green-700' },
                  { val: 'ABSENT',  label: 'Absent',  color: 'border-red-500 bg-red-50 text-red-700'       },
                  { val: 'LATE',    label: 'Late',    color: 'border-amber-500 bg-amber-50 text-amber-700'  },
                  { val: 'EXCUSED', label: 'Excused', color: 'border-blue-500 bg-blue-50 text-blue-700'    },
                ].map(opt => (
                  <button key={opt.val} type="button" onClick={() => setNewStatus(opt.val)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${newStatus === opt.val ? `${opt.color} ring-2 ring-blue-400/30` : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <span>{opt.label}</span>
                    {newStatus === opt.val && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Remarks</label>
              <input type="text" value={statusRemarks} onChange={e => setStatusRemarks(e.target.value)} placeholder="e.g. Medical leave, confirmed by parent"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">User / Tutor Assisting with Change</label>
              <input type="text" required value={assistedBy} onChange={e => setAssistedBy(e.target.value)} placeholder="e.g. Tutor Ramesh / Admin User"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <p className="text-[10px] text-gray-400 mt-1">Records the authority who verified this status adjustment.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">Save Change</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
