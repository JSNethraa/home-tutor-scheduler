import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Users, Calendar, CreditCard, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SESSIONS = [
  { id: 1, batch: { name: 'Physics Batch A' }, session_date: '2026-11-19', start_time: '09:00', end_time: '10:30', room_or_link: 'Room 101', status: 'SCHEDULED', topic_covered: 'Laws of Motion' },
  { id: 2, batch: { name: 'Maths 1-on-1 (Rohit)' }, session_date: '2026-11-19', start_time: '11:00', end_time: '12:00', room_or_link: 'Home Visit', status: 'SCHEDULED', topic_covered: 'Quadratic Equations' },
  { id: 3, batch: { name: 'Chemistry Group' }, session_date: '2026-11-20', start_time: '14:00', end_time: '15:30', room_or_link: 'Room 203', status: 'SCHEDULED', topic_covered: 'Periodic Table' },
  { id: 4, batch: { name: 'Biology Batch B' }, session_date: '2026-11-21', start_time: '10:00', end_time: '11:30', room_or_link: 'Room 102', status: 'COMPLETED', topic_covered: 'Cell Division' },
];

const MOCK_BATCHES = [
  { id: 1, name: 'Physics Batch A',      subject: 'Physics',   monthly_fee: 2500, batch_type: 'COACHING_GROUP' },
  { id: 2, name: 'Maths 1-on-1 (Rohit)',subject: 'Maths',     monthly_fee: 4000, batch_type: 'HOME_TUTOR_1ON1' },
  { id: 3, name: 'Chemistry Group',      subject: 'Chemistry', monthly_fee: 2200, batch_type: 'COACHING_GROUP' },
  { id: 4, name: 'Biology Batch B',      subject: 'Biology',   monthly_fee: 2000, batch_type: 'COACHING_GROUP' },
];

const FEE_SUMMARY = { total_collected: 48000, total_pending: 12000, unpaid_invoices: 4, partially_paid_invoices: 2 };

export const Dashboard = () => {
  const { user, isAdmin, isTutor, isParent, isStudent } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-blue-700/60 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              {user?.role} Portal
            </span>
            <h1 className="text-2xl font-bold">Welcome back, {user?.full_name || user?.username}!</h1>
            <p className="text-blue-100 text-sm mt-1">
              Here is your operations overview for today's tutoring batches and classes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(isStudent || isParent) && (
              <Link
                to="/attendance"
                className="px-4 py-2.5 bg-blue-700/80 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center gap-1.5 border border-blue-500/50"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Track Attendance</span>
              </Link>
            )}
            <Link
              to="/schedule"
              className="px-4 py-2.5 bg-white text-blue-900 rounded-xl font-semibold text-sm hover:bg-blue-50 transition shadow-sm flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>View Timetable</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Batches"     value={MOCK_BATCHES.length} icon={Users}        change="Group & 1-on-1"           color="blue"   />
        <StatCard title="Upcoming Sessions"  value={MOCK_SESSIONS.length} icon={Calendar}    change="Next 7 Days"              color="purple" />

        {isAdmin && (
          <>
            <StatCard title="Collected Fees"   value={`Rs. ${FEE_SUMMARY.total_collected.toLocaleString()}`} icon={CreditCard}  change={`Pending: Rs. ${FEE_SUMMARY.total_pending.toLocaleString()}`} color="green" />
            <StatCard title="Unpaid Invoices"  value={FEE_SUMMARY.unpaid_invoices}                           icon={AlertTriangle} change={`${FEE_SUMMARY.partially_paid_invoices} partially paid`}      color="amber" />
          </>
        )}

        {(isStudent || isParent) && (
          <StatCard title="Attendance Rate" value="96%" icon={CheckCircle2} change="Across active subjects" color="green" />
        )}

        {isTutor && (
          <StatCard title="Conducted Hours" value="18.5 hrs" icon={Clock} change="This calendar month" color="amber" />
        )}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Upcoming Class Sessions</h2>
              <p className="text-xs text-gray-500">Scheduled classes requiring attendance or preparation</p>
            </div>
            <Link to="/schedule" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>All Sessions</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {MOCK_SESSIONS.slice(0, 5).map((session) => (
              <div key={session.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{session.batch?.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {session.session_date} • {session.start_time} - {session.end_time} • {session.room_or_link}
                    </p>
                    {session.topic_covered && (
                      <p className="text-xs text-blue-700 mt-1 font-medium bg-blue-50/70 inline-block px-2 py-0.5 rounded">
                        Topic: {session.topic_covered}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={session.status === 'COMPLETED' ? 'success' : 'primary'}>
                  {session.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Active Batches */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Batches</h2>
              <p className="text-xs text-gray-500">Active enrollments</p>
            </div>
            <Link to="/batches" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {MOCK_BATCHES.slice(0, 4).map((b) => (
              <div key={b.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{b.name}</h4>
                  <Badge variant={b.batch_type === 'HOME_TUTOR_1ON1' ? 'purple' : 'default'} size="xs">
                    {b.batch_type === 'HOME_TUTOR_1ON1' ? '1-on-1' : 'Batch'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Subject: {b.subject}</span>
                  <span>Fee: Rs. {b.monthly_fee}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
