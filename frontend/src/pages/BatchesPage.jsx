import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { batchApi, userApi, attendanceApi } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Users, Plus, UserPlus, BookOpen, Calendar, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';

export const BatchesPage = () => {
  const { isAdmin } = useAuth();
  const [batches, setBatches] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Attendance tracking modal state
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [selectedTrackStudent, setSelectedTrackStudent] = useState(null);
  const [selectedTrackBatch, setSelectedTrackBatch] = useState(null);
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [trackingStats, setTrackingStats] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // New batch form state
  const [newBatch, setNewBatch] = useState({
    name: '',
    batch_type: 'COACHING_GROUP',
    subject: '',
    grade_level: 'Grade 10',
    tutor_id: '',
    capacity: 15,
    monthly_fee: 2500,
    start_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Enroll form state
  const [enrollForm, setEnrollForm] = useState({
    student_name: '',
    student_id: '',
    grade_level: '',
    phone_number: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await batchApi.getAll();
      setBatches(res.data.results || res.data || []);

      if (isAdmin) {
        const [tutorRes, studentRes] = await Promise.all([
          userApi.getTutors(),
          userApi.getStudents(),
        ]);
        setTutors(tutorRes.data.results || tutorRes.data || []);
        setStudents(studentRes.data.results || studentRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await batchApi.create(newBatch);
      setIsCreateOpen(false);
      setNewBatch({
        name: '',
        batch_type: 'COACHING_GROUP',
        subject: '',
        grade_level: 'Grade 10',
        tutor_id: '',
        capacity: 15,
        monthly_fee: 2500,
        start_date: new Date().toISOString().split('T')[0],
        description: '',
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create batch.');
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedBatch || !enrollForm.student_name.trim()) {
      alert('Please enter a student name to enroll.');
      return;
    }
    try {
      const res = await batchApi.enrollStudent(selectedBatch.id, {
        student_name: enrollForm.student_name.trim(),
        student_id: enrollForm.student_id ? parseInt(enrollForm.student_id) : undefined,
        grade_level: enrollForm.grade_level.trim(),
        phone_number: enrollForm.phone_number.trim(),
      });
      alert(res.data?.message || 'Student enrolled successfully!');
      setIsEnrollOpen(false);
      setEnrollForm({ student_name: '', student_id: '', grade_level: '', phone_number: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll student.');
    }
  };

  const handleOpenEnroll = (batch) => {
    setSelectedBatch(batch);
    setEnrollForm({
      student_name: '',
      student_id: '',
      grade_level: batch.grade_level || 'Grade 10',
      phone_number: '',
    });
    setIsEnrollOpen(true);
  };

  const handleOpenTracking = async (student, batch) => {
    setSelectedTrackStudent(student);
    setSelectedTrackBatch(batch);
    setIsTrackingOpen(true);
    setLoadingTracking(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        attendanceApi.getRecords({ student_id: student.student_id, batch_id: batch.id }),
        attendanceApi.getStudentStats(student.student_id, batch.id),
      ]);
      setTrackingRecords(recordsRes.data.results || recordsRes.data || []);
      setTrackingStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching attendance tracking:', err);
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleUnenrollStudent = async (batchId, studentId, studentName) => {
    if (!confirm(`Are you sure you want to drop ${studentName} from this batch?`)) return;
    try {
      await batchApi.unenrollStudent(batchId, studentId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unenroll student.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches & Coaching Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage multi-student coaching batches and 1-on-1 personalized home tutoring groups.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </button>
        )}
      </div>

      {/* Grid of Batches */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading batches...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => {
            const isHome1on1 = batch.batch_type === 'HOME_TUTOR_1ON1';
            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={isHome1on1 ? 'purple' : 'primary'} size="xs">
                      {isHome1on1 ? 'Home Tutor (1-on-1)' : 'Coaching Batch'}
                    </Badge>
                    <Badge variant={batch.status === 'ACTIVE' ? 'success' : 'default'} size="xs">
                      {batch.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug">{batch.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Grade: <span className="font-semibold text-gray-700">{batch.grade_level}</span> • Subject: <span className="font-semibold text-gray-700">{batch.subject}</span>
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Lead Tutor:</span>
                      <span className="font-semibold text-gray-800">
                        {batch.tutor?.user?.full_name || 'Assigned Tutor'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Monthly Fee:</span>
                      <span className="font-semibold text-green-700">Rs. {batch.monthly_fee}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Capacity & Enrolled:</span>
                      <span className={`font-semibold ${batch.is_full ? 'text-amber-600' : 'text-blue-600'}`}>
                        {batch.enrolled_count} / {batch.capacity} students
                      </span>
                    </div>
                  </div>

                  {/* Enrolled Students Directory */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Enrolled Students ({batch.enrolled_students?.length || 0})</span>
                      </span>
                    </div>

                    {(!batch.enrolled_students || batch.enrolled_students.length === 0) ? (
                      <p className="text-xs text-gray-400 italic py-1">No students currently enrolled.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {batch.enrolled_students.map((st) => {
                          const att = st.attendance_stats || { percentage: 100, present: 0, total: 0 };
                          const attVariant = att.percentage >= 85 ? 'success' : att.percentage >= 70 ? 'warning' : 'danger';
                          return (
                            <div
                              key={st.id}
                              className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{st.student_name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge variant={attVariant} size="xs">
                                    {att.percentage}%
                                  </Badge>
                                  <span className="text-[10px] text-gray-400">
                                    ({att.present}/{att.total} classes)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenTracking(st, batch)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg shadow-2xs transition"
                                  title="Track Detailed Attendance Records"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Track</span>
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleUnenrollStudent(batch.id, st.student_id, st.student_name)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                                    title="Unenroll student from batch"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEnroll(batch)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Enroll Student</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Batch Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Batch / Home Tutoring">
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Batch Name</label>
            <input
              type="text"
              required
              value={newBatch.name}
              onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
              placeholder="e.g. Class 11 Physics Board Prep"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Type</label>
              <select
                value={newBatch.batch_type}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewBatch({
                    ...newBatch,
                    batch_type: val,
                    capacity: val === 'HOME_TUTOR_1ON1' ? 1 : 15,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="COACHING_GROUP">Coaching Group</option>
                <option value="HOME_TUTOR_1ON1">Home Tutor (1-on-1)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject</label>
              <input
                type="text"
                required
                value={newBatch.subject}
                onChange={(e) => setNewBatch({ ...newBatch, subject: e.target.value })}
                placeholder="e.g. Mathematics"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Grade Level</label>
              <input
                type="text"
                required
                value={newBatch.grade_level}
                onChange={(e) => setNewBatch({ ...newBatch, grade_level: e.target.value })}
                placeholder="e.g. Grade 10"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Lead Tutor</label>
              <select
                required
                value={newBatch.tutor_id}
                onChange={(e) => setNewBatch({ ...newBatch, tutor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Select Tutor</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user?.full_name || t.user?.username} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Max Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={newBatch.capacity}
                onChange={(e) => setNewBatch({ ...newBatch, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Monthly Fee (Rs.)</label>
              <input
                type="number"
                min="0"
                required
                value={newBatch.monthly_fee}
                onChange={(e) => setNewBatch({ ...newBatch, monthly_fee: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Save Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        title={`Enroll Student into "${selectedBatch?.name}"`}
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="registered-students-list"
              value={enrollForm.student_name}
              onChange={(e) => {
                const val = e.target.value;
                const matched = students.find(
                  (s) => (s.user?.full_name || s.user?.username).toLowerCase() === val.toLowerCase()
                );
                setEnrollForm((prev) => ({
                  ...prev,
                  student_name: val,
                  student_id: matched ? matched.id : '',
                  grade_level: matched?.grade_level || prev.grade_level || selectedBatch?.grade_level || '',
                }));
              }}
              placeholder="Type student name (e.g. Rahul Sharma)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="registered-students-list">
              {students.map((s) => (
                <option key={s.id} value={s.user?.full_name || s.user?.username}>
                  Grade: {s.grade_level}
                </option>
              ))}
            </datalist>
            <p className="text-[11px] text-gray-400 mt-1">
              Enter any new student's name, or choose from registered students.
            </p>
          </div>

          {/* Quick select chip pills */}
          {students.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Quick Select Registered Student:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                {students.map((s) => {
                  const sName = s.user?.full_name || s.user?.username;
                  const isSelected =
                    enrollForm.student_id === s.id ||
                    enrollForm.student_name.toLowerCase() === sName.toLowerCase();
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setEnrollForm({
                          student_name: sName,
                          student_id: s.id,
                          grade_level: s.grade_level,
                          phone_number: s.user?.phone_number || '',
                        })
                      }
                      className={`px-2.5 py-1 rounded text-xs transition border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      {sName} ({s.grade_level})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Grade / Level</label>
              <input
                type="text"
                value={enrollForm.grade_level}
                onChange={(e) => setEnrollForm({ ...enrollForm, grade_level: e.target.value })}
                placeholder="e.g. Grade 10"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Contact Phone (Optional)</label>
              <input
                type="text"
                value={enrollForm.phone_number}
                onChange={(e) => setEnrollForm({ ...enrollForm, phone_number: e.target.value })}
                placeholder="e.g. +91-9876543210"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEnrollOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Attendance Tracking Modal */}
      <Modal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        title={`Attendance Tracking: ${selectedTrackStudent?.student_name || 'Student'}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
            <div>
              <span className="font-semibold text-gray-700">Batch:</span> {selectedTrackBatch?.name}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Grade:</span> {selectedTrackStudent?.grade_level}
            </div>
          </div>

          {/* Quick Stats Grid */}
          {trackingStats && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400">Total Classes</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{trackingStats.total_sessions}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-[10px] uppercase font-bold text-green-700">Present</p>
                <p className="text-lg font-bold text-green-700 mt-0.5">{trackingStats.present_count}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] uppercase font-bold text-amber-700">Late / Excused</p>
                <p className="text-lg font-bold text-amber-700 mt-0.5">
                  {(trackingStats.late_count || 0) + (trackingStats.excused_count || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] uppercase font-bold text-blue-700">Attendance Rate</p>
                <p className="text-lg font-bold text-blue-700 mt-0.5">{trackingStats.attendance_percentage}%</p>
              </div>
            </div>
          )}

          {/* Records Table */}
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider flex items-center justify-between">
              <span>Session Attendance History</span>
              <span className="text-[11px] font-normal text-gray-500">{trackingRecords.length} sessions logged</span>
            </div>
            {loadingTracking ? (
              <div className="py-10 text-center text-xs text-gray-400">Loading attendance history...</div>
            ) : trackingRecords.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                No class attendance recorded yet for this student in this batch.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                    <tr>
                      <th className="px-3.5 py-2">Date & Time</th>
                      <th className="px-3.5 py-2">Topic Covered</th>
                      <th className="px-3.5 py-2">Status</th>
                      <th className="px-3.5 py-2">Remarks</th>
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

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsTrackingOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
