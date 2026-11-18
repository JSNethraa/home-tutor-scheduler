import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Calendar, Plus, Clock, CheckCircle, Sparkles } from 'lucide-react';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_BATCHES = [
  { id: 1, name: 'Physics Batch A',       tutor_id: 2 },
  { id: 2, name: 'Maths 1-on-1 (Rohit)', tutor_id: 2 },
  { id: 3, name: 'Chemistry Group',       tutor_id: 2 },
  { id: 4, name: 'Biology Batch B',       tutor_id: 2 },
];

const INIT_SESSIONS = [
  { id: 1, batch: { id: 1, name: 'Physics Batch A' },      session_date: '2026-11-19', start_time: '09:00', end_time: '10:30', room_or_link: 'Room 101', status: 'SCHEDULED', topic_covered: 'Laws of Motion' },
  { id: 2, batch: { id: 2, name: 'Maths 1-on-1 (Rohit)' },session_date: '2026-11-19', start_time: '11:00', end_time: '12:00', room_or_link: 'Home Visit',status: 'SCHEDULED', topic_covered: 'Quadratic Equations' },
  { id: 3, batch: { id: 3, name: 'Chemistry Group' },      session_date: '2026-11-20', start_time: '14:00', end_time: '15:30', room_or_link: 'Room 203', status: 'SCHEDULED', topic_covered: 'Periodic Table' },
  { id: 4, batch: { id: 4, name: 'Biology Batch B' },      session_date: '2026-11-21', start_time: '10:00', end_time: '11:30', room_or_link: 'Room 102', status: 'COMPLETED', topic_covered: 'Cell Division' },
  { id: 5, batch: { id: 1, name: 'Physics Batch A' },      session_date: '2026-11-22', start_time: '09:00', end_time: '10:30', room_or_link: 'Room 101', status: 'SCHEDULED', topic_covered: 'Work & Energy' },
];

export const SchedulePage = () => {
  const { isAdmin, isTutor } = useAuth();
  const [sessions, setSessions] = useState(INIT_SESSIONS);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const [newSession, setNewSession] = useState({
    batch_id: '1',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '17:00',
    end_time: '18:30',
    topic_covered: '',
    room_or_link: 'Room 101',
  });

  const handleAddSession = (e) => {
    e.preventDefault();
    const batch = MOCK_BATCHES.find(b => b.id === parseInt(newSession.batch_id));
    const created = {
      id: Date.now(),
      batch: { id: batch?.id, name: batch?.name },
      session_date: newSession.session_date,
      start_time: newSession.start_time,
      end_time: newSession.end_time,
      room_or_link: newSession.room_or_link,
      topic_covered: newSession.topic_covered,
      status: 'SCHEDULED',
    };
    setSessions(prev => [created, ...prev]);
    setIsScheduleOpen(false);
    setNewSession({ batch_id: '1', session_date: new Date().toISOString().split('T')[0], start_time: '17:00', end_time: '18:30', topic_covered: '', room_or_link: 'Room 101' });
  };

  const statusColors = { SCHEDULED: 'primary', COMPLETED: 'success', CANCELLED: 'danger', RESCHEDULED: 'warning' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule & Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all class sessions across batches.</p>
        </div>
        {(isAdmin || isTutor) && (
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Schedule Session
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions',   value: sessions.length,                                      color: 'bg-blue-50 text-blue-700' },
          { label: 'Scheduled',        value: sessions.filter(s => s.status === 'SCHEDULED').length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Completed',        value: sessions.filter(s => s.status === 'COMPLETED').length, color: 'bg-green-50 text-green-700' },
          { label: 'Total Batches',    value: MOCK_BATCHES.length,                                   color: 'bg-purple-50 text-purple-700' },
        ].map(card => (
          <div key={card.label} className={`${card.color} rounded-2xl p-4 font-semibold`}>
            <p className="text-xs uppercase tracking-wider opacity-70">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-gray-900">All Class Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Batch</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Room / Link</th>
                <th className="px-5 py-3.5">Topic</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{s.batch?.name}</td>
                  <td className="px-5 py-3.5 text-gray-700">{s.session_date}</td>
                  <td className="px-5 py-3.5 text-gray-700">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" />{s.start_time}–{s.end_time}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{s.room_or_link}</td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">{s.topic_covered || '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusColors[s.status] || 'default'} size="xs">{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Session Modal */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule New Session" maxWidth="max-w-lg">
        <form onSubmit={handleAddSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Batch</label>
            <select value={newSession.batch_id} onChange={e => setNewSession(p => ({ ...p, batch_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MOCK_BATCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date</label>
              <input type="date" value={newSession.session_date} onChange={e => setNewSession(p => ({ ...p, session_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Room / Link</label>
              <input type="text" value={newSession.room_or_link} onChange={e => setNewSession(p => ({ ...p, room_or_link: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Time</label>
              <input type="time" value={newSession.start_time} onChange={e => setNewSession(p => ({ ...p, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Time</label>
              <input type="time" value={newSession.end_time} onChange={e => setNewSession(p => ({ ...p, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Topic Covered</label>
            <input type="text" value={newSession.topic_covered} onChange={e => setNewSession(p => ({ ...p, topic_covered: e.target.value }))}
              placeholder="e.g. Chapter 3: Newton's Laws"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsScheduleOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">Add Session</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
