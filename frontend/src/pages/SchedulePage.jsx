import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { scheduleApi, batchApi } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Calendar, Plus, Clock, AlertCircle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

export const SchedulePage = () => {
  const { isAdmin, isTutor } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isConflictCheckOpen, setIsConflictCheckOpen] = useState(false);

  // New session form
  const [newSession, setNewSession] = useState({
    batch_id: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '17:00',
    end_time: '18:30',
    topic_covered: '',
    room_or_link: 'Room 101',
  });

  // Conflict tester state
  const [conflictForm, setConflictForm] = useState({
    batch_id: '',
    tutor_id: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '17:00',
    end_time: '18:30',
    room_or_link: 'Room 101',
  });
  const [conflictResult, setConflictResult] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionRes, batchRes] = await Promise.all([
        scheduleApi.getSessions(),
        batchApi.getMyBatches(),
      ]);
      setSessions(sessionRes.data.results || sessionRes.data || []);
      setBatches(batchRes.data || []);
      if (batchRes.data.length > 0) {
        setNewSession((prev) => ({ ...prev, batch_id: batchRes.data[0].id }));
        setConflictForm((prev) => ({
          ...prev,
          batch_id: batchRes.data[0].id,
          tutor_id: batchRes.data[0].tutor?.id || 1,
        }));
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await scheduleApi.createSession(newSession);
      setIsScheduleOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to schedule class.');
    }
  };

  const handleRunConflictCheck = async (e) => {
    e.preventDefault();
    setCheckingConflict(true);
    setConflictResult(null);
    try {
      const res = await scheduleApi.checkConflict(conflictForm);
      setConflictResult(res.data);
    } catch (err) {
      alert('Error evaluating conflicts.');
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleGenerateRules = async (batchId) => {
    if (!confirm('Auto-generate upcoming 4 weeks of sessions for this batch based on recurring rules?')) return;
    try {
      const res = await scheduleApi.generateFromRules(batchId, 4);
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to auto-generate sessions.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Timetable & Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time schedule calendar with automated tutor conflict prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(isAdmin || isTutor) && (
            <button
              onClick={() => setIsConflictCheckOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 text-sm font-semibold rounded-xl hover:bg-amber-100 transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Test Conflict Engine</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-generation banner for Admin */}
      {isAdmin && batches.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-indigo-900">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Quick Session Generator: Populate the next 4 weeks from weekly recurring schedule rules.</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              id="gen-batch-select"
              className="bg-white border border-indigo-200 text-xs rounded-lg px-2.5 py-1.5 font-medium"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('gen-batch-select');
                handleGenerateRules(el.value);
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Scheduled Class Occurrences</h2>
          <span className="text-xs text-gray-500 font-medium">{sessions.length} sessions listed</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading schedule...</div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">No class sessions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Batch / Course</th>
                  <th className="px-6 py-3.5">Tutor</th>
                  <th className="px-6 py-3.5">Location / Room</th>
                  <th className="px-6 py-3.5">Topic</th>
                  <th className="px-6 py-3.5">Attendance</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/70 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{s.session_date}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{s.start_time} - {s.end_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                      {s.batch?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.tutor?.user?.full_name || 'Assigned Tutor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 font-mono">
                        {s.room_or_link || 'Room 101'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700 max-w-xs truncate">
                      {s.topic_covered || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.attendance_taken ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3.5 h-3.5" /> Marked
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={s.status === 'COMPLETED' ? 'success' : 'primary'} size="xs">
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Session Modal */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule New Class Session">
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Batch</label>
            <select
              required
              value={newSession.batch_id}
              onChange={(e) => setNewSession({ ...newSession, batch_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.tutor?.user?.full_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Date</label>
              <input
                type="date"
                required
                value={newSession.session_date}
                onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Start Time</label>
              <input
                type="time"
                required
                value={newSession.start_time}
                onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">End Time</label>
              <input
                type="time"
                required
                value={newSession.end_time}
                onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Room / Address / Link</label>
            <input
              type="text"
              value={newSession.room_or_link}
              onChange={(e) => setNewSession({ ...newSession, room_or_link: e.target.value })}
              placeholder="e.g. Room 101 or Student Home"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Topic / Chapter</label>
            <input
              type="text"
              value={newSession.topic_covered}
              onChange={(e) => setNewSession({ ...newSession, topic_covered: e.target.value })}
              placeholder="e.g. Chapter 4: Electric Circuits & Resistance"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Schedule Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Conflict Detection Engine Modal */}
      <Modal
        isOpen={isConflictCheckOpen}
        onClose={() => setIsConflictCheckOpen(false)}
        title="Scheduling Conflict Resolution Engine"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRunConflictCheck} className="space-y-4">
          <p className="text-xs text-gray-500">
            This module executes real-time collision detection against tutor availability, student enrollment overlaps, and classroom occupancy.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tutor ID</label>
              <input
                type="number"
                required
                value={conflictForm.tutor_id}
                onChange={(e) => setConflictForm({ ...conflictForm, tutor_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Session Date</label>
              <input
                type="date"
                required
                value={conflictForm.session_date}
                onChange={(e) => setConflictForm({ ...conflictForm, session_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Start Time</label>
              <input
                type="time"
                required
                value={conflictForm.start_time}
                onChange={(e) => setConflictForm({ ...conflictForm, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">End Time</label>
              <input
                type="time"
                required
                value={conflictForm.end_time}
                onChange={(e) => setConflictForm({ ...conflictForm, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Classroom / Room No.</label>
            <input
              type="text"
              value={conflictForm.room_or_link}
              onChange={(e) => setConflictForm({ ...conflictForm, room_or_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={checkingConflict}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
          >
            {checkingConflict ? 'Analyzing Database for Clashes...' : 'Run Conflict Check'}
          </button>

          {/* Results Output */}
          {conflictResult && (
            <div className={`mt-4 p-4 rounded-xl border ${conflictResult.has_conflict ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {conflictResult.has_conflict ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">Conflict Detected! Scheduling collision found:</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">No Conflicts: Tutor, students, and classroom are available!</span>
                  </>
                )}
              </div>

              {conflictResult.has_conflict && (
                <ul className="mt-2.5 space-y-1.5 text-xs text-red-700 list-disc list-inside">
                  {conflictResult.conflicts.map((c, idx) => (
                    <li key={idx}><span className="font-semibold">{c.type}:</span> {c.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
