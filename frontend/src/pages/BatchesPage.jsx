import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { batchApi, userApi } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Users, Plus, UserPlus, BookOpen, Calendar, CheckCircle } from 'lucide-react';

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
  const [selectedStudentId, setSelectedStudentId] = useState('');

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
    if (!selectedBatch || !selectedStudentId) return;
    try {
      await batchApi.enrollStudent(selectedBatch.id, selectedStudentId);
      setIsEnrollOpen(false);
      setSelectedStudentId('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll student.');
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
                </div>

                {isAdmin && (
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedBatch(batch);
                        setIsEnrollOpen(true);
                      }}
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
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Student</label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.full_name || s.user?.username} ({s.grade_level})
                </option>
              ))}
            </select>
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
              Confirm Enrollment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
