import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Users, Plus, UserPlus, BookOpen, CheckCircle2, X, UserCheck } from 'lucide-react';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_TUTORS = [
  { id: 2, name: 'Ramesh Kumar' },
  { id: 7, name: 'Sunita Mehra' },
];

const MOCK_STUDENTS_POOL = [
  { id: 4, name: 'Rohit Sharma',  grade_level: 'Grade 10' },
  { id: 5, name: 'Priya Patel',   grade_level: 'Grade 10' },
  { id: 6, name: 'Arjun Verma',   grade_level: 'Grade 11' },
  { id: 8, name: 'Anjali Singh',  grade_level: 'Grade 9'  },
  { id: 9, name: 'Karan Mehta',   grade_level: 'Grade 11' },
];

const INIT_BATCHES = [
  {
    id: 1, name: 'Physics Batch A', batch_type: 'COACHING_GROUP', subject: 'Physics',
    grade_level: 'Grade 10', monthly_fee: 2500, start_date: '2026-09-01',
    tutor: { user: { full_name: 'Ramesh Kumar' } },
    enrolled_students: [
      { id: 1, student_id: 4, student_name: 'Rohit Sharma',  grade_level: 'Grade 10', attendance_stats: { percentage: 96, present: 24, total: 25 } },
      { id: 2, student_id: 5, student_name: 'Priya Patel',   grade_level: 'Grade 10', attendance_stats: { percentage: 90, present: 18, total: 20 } },
    ],
    enrolled_count: 2, description: 'Group coaching for Physics, covering CBSE syllabus.',
  },
  {
    id: 2, name: 'Maths 1-on-1 (Rohit)', batch_type: 'HOME_TUTOR_1ON1', subject: 'Maths',
    grade_level: 'Grade 10', monthly_fee: 4000, start_date: '2026-09-15',
    tutor: { user: { full_name: 'Ramesh Kumar' } },
    enrolled_students: [
      { id: 3, student_id: 4, student_name: 'Rohit Sharma',  grade_level: 'Grade 10', attendance_stats: { percentage: 100, present: 12, total: 12 } },
    ],
    enrolled_count: 1, description: 'Private home tutoring for Maths.',
  },
  {
    id: 3, name: 'Chemistry Group', batch_type: 'COACHING_GROUP', subject: 'Chemistry',
    grade_level: 'Grade 11', monthly_fee: 2200, start_date: '2026-09-01',
    tutor: { user: { full_name: 'Sunita Mehra' } },
    enrolled_students: [
      { id: 4, student_id: 6, student_name: 'Arjun Verma',  grade_level: 'Grade 11', attendance_stats: { percentage: 82, present: 14, total: 17 } },
      { id: 5, student_id: 8, student_name: 'Anjali Singh', grade_level: 'Grade 9',  attendance_stats: { percentage: 94, present: 16, total: 17 } },
    ],
    enrolled_count: 2, description: 'Chemistry coaching for Class 11 students.',
  },
];

export const BatchesPage = () => {
  const { isAdmin, isTutor } = useAuth();
  const [batches, setBatches]       = useState(INIT_BATCHES);
  const [isCreateOpen, setIsCreateOpen]   = useState(false);
  const [isEnrollOpen, setIsEnrollOpen]   = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // New batch form
  const [newBatch, setNewBatch] = useState({
    name: '', batch_type: 'COACHING_GROUP', subject: '', grade_level: 'Grade 10',
    tutor_id: '2', capacity: 15, monthly_fee: 2500,
    start_date: new Date().toISOString().split('T')[0], description: '',
  });

  // Enroll form
  const [enrollForm, setEnrollForm] = useState({ student_id: '', student_name: '', grade_level: 'Grade 10' });

  const handleCreateBatch = (e) => {
    e.preventDefault();
    const tutor = MOCK_TUTORS.find(t => t.id === parseInt(newBatch.tutor_id));
    setBatches(prev => [{
      id: Date.now(),
      ...newBatch,
      monthly_fee: parseFloat(newBatch.monthly_fee),
      capacity: parseInt(newBatch.capacity),
      tutor: { user: { full_name: tutor?.name } },
      enrolled_students: [], enrolled_count: 0,
    }, ...prev]);
    setIsCreateOpen(false);
    setNewBatch({ name: '', batch_type: 'COACHING_GROUP', subject: '', grade_level: 'Grade 10', tutor_id: '2', capacity: 15, monthly_fee: 2500, start_date: new Date().toISOString().split('T')[0], description: '' });
  };

  const handleEnroll = (e) => {
    e.preventDefault();
    if (!selectedBatch || !enrollForm.student_name.trim()) return;
    const newStudent = {
      id: Date.now(),
      student_id: Date.now(),
      student_name: enrollForm.student_name.trim(),
      grade_level: enrollForm.grade_level,
      attendance_stats: { percentage: 100, present: 0, total: 0 },
    };
    setBatches(prev => prev.map(b =>
      b.id === selectedBatch.id
        ? { ...b, enrolled_students: [...b.enrolled_students, newStudent], enrolled_count: b.enrolled_count + 1 }
        : b
    ));
    setIsEnrollOpen(false);
    setEnrollForm({ student_id: '', student_name: '', grade_level: 'Grade 10' });
  };

  const handleUnenroll = (batchId, studentId) => {
    setBatches(prev => prev.map(b =>
      b.id === batchId
        ? { ...b, enrolled_students: b.enrolled_students.filter(s => s.student_id !== studentId), enrolled_count: b.enrolled_count - 1 }
        : b
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches & Classes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage coaching batches, enroll students, and track progress.</p>
        </div>
        {(isAdmin || isTutor) && (
          <button onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition">
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Batches',  value: batches.length,                                                               color: 'bg-blue-50 text-blue-700'   },
          { label: 'Group Batches',  value: batches.filter(b => b.batch_type === 'COACHING_GROUP').length,                color: 'bg-indigo-50 text-indigo-700' },
          { label: '1-on-1 Classes', value: batches.filter(b => b.batch_type === 'HOME_TUTOR_1ON1').length,               color: 'bg-purple-50 text-purple-700' },
          { label: 'Total Students', value: batches.reduce((s, b) => s + (b.enrolled_count || 0), 0),                   color: 'bg-green-50 text-green-700'  },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-2xl p-4`}>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Batch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {batches.map(batch => (
          <div key={batch.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900">{batch.name}</h3>
                  <Badge variant={batch.batch_type === 'HOME_TUTOR_1ON1' ? 'purple' : 'primary'} size="xs">
                    {batch.batch_type === 'HOME_TUTOR_1ON1' ? '1-on-1' : 'Group'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {batch.subject} • {batch.grade_level} • Rs. {batch.monthly_fee}/mo
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tutor: {batch.tutor?.user?.full_name} • Started: {batch.start_date}
                </p>
              </div>
              {(isAdmin || isTutor) && (
                <button
                  onClick={() => { setSelectedBatch(batch); setIsEnrollOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Enroll Student
                </button>
              )}
            </div>

            {/* Enrolled Students */}
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Enrolled Students ({batch.enrolled_count})
              </p>
              {batch.enrolled_students.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">No students enrolled yet.</p>
              ) : (
                <div className="space-y-2">
                  {batch.enrolled_students.map(st => {
                    const att = st.attendance_stats || { percentage: 100, present: 0, total: 0 };
                    return (
                      <div key={st.id} className="flex items-center justify-between p-2.5 bg-gray-50/70 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{st.student_name}</p>
                          <p className="text-[11px] text-gray-500">{st.grade_level}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={att.percentage >= 85 ? 'success' : att.percentage >= 70 ? 'warning' : 'danger'} size="xs">
                            {att.percentage}% ({att.present}/{att.total})
                          </Badge>
                          {(isAdmin || isTutor) && (
                            <button
                              onClick={() => handleUnenroll(batch.id, st.student_id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                              title="Remove student"
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
        ))}
      </div>

      {/* Create Batch Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Batch" maxWidth="max-w-lg">
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Batch Name</label>
              <input required type="text" value={newBatch.name} onChange={e => setNewBatch(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Physics Batch B"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
              <select value={newBatch.batch_type} onChange={e => setNewBatch(p => ({ ...p, batch_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="COACHING_GROUP">Group Coaching</option>
                <option value="HOME_TUTOR_1ON1">Home Tutor 1-on-1</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
              <input required type="text" value={newBatch.subject} onChange={e => setNewBatch(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Maths"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Grade Level</label>
              <input type="text" value={newBatch.grade_level} onChange={e => setNewBatch(p => ({ ...p, grade_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Monthly Fee (Rs.)</label>
              <input type="number" value={newBatch.monthly_fee} onChange={e => setNewBatch(p => ({ ...p, monthly_fee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date</label>
              <input type="date" value={newBatch.start_date} onChange={e => setNewBatch(p => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tutor</label>
              <select value={newBatch.tutor_id} onChange={e => setNewBatch(p => ({ ...p, tutor_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MOCK_TUTORS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
              <textarea rows={2} value={newBatch.description} onChange={e => setNewBatch(p => ({ ...p, description: e.target.value }))} placeholder="Optional batch description..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsCreateOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">Create Batch</button>
          </div>
        </form>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} title={`Enroll Student — ${selectedBatch?.name}`} maxWidth="max-w-sm">
        <form onSubmit={handleEnroll} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Student Name</label>
            <input required type="text" value={enrollForm.student_name}
              onChange={e => setEnrollForm(p => ({ ...p, student_name: e.target.value }))}
              placeholder="Enter student's full name"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Grade Level</label>
            <input type="text" value={enrollForm.grade_level}
              onChange={e => setEnrollForm(p => ({ ...p, grade_level: e.target.value }))}
              placeholder="e.g. Grade 10"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEnrollOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4" /> Enroll
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
