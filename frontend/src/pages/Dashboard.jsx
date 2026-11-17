import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { batchApi, scheduleApi, feeApi, attendanceApi } from '../api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Users, Calendar, CreditCard, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user, isAdmin, isTutor, isParent, isStudent } = useAuth();
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [batchRes, sessionRes] = await Promise.all([
          batchApi.getMyBatches(),
          scheduleApi.getSessions({ start_date: new Date().toISOString().split('T')[0] }),
        ]);
        setBatches(batchRes.data || []);
        setSessions(
          Array.isArray(sessionRes.data)
            ? sessionRes.data
            : sessionRes.data?.results || []
        );

        if (isAdmin) {
          const feeRes = await feeApi.getSummary();
          setFeeSummary(feeRes.data);
        } else if (isStudent) {
          const statsRes = await attendanceApi.getStudentStats();
          setStudentStats(statsRes.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
        <StatCard
          title="Active Batches"
          value={batches.length}
          icon={Users}
          change="Group & 1-on-1"
          color="blue"
        />

        <StatCard
          title="Upcoming Sessions"
          value={sessions.length}
          icon={Calendar}
          change="Next 7 Days"
          color="purple"
        />

        {isAdmin && feeSummary && (
          <>
            <StatCard
              title="Collected Fees"
              value={`Rs. ${feeSummary.total_collected.toLocaleString()}`}
              icon={CreditCard}
              change={`Pending: Rs. ${feeSummary.total_pending.toLocaleString()}`}
              color="green"
            />
            <StatCard
              title="Unpaid Invoices"
              value={feeSummary.unpaid_invoices}
              icon={AlertTriangle}
              change={`${feeSummary.partially_paid_invoices} partially paid`}
              color="amber"
            />
          </>
        )}

        {(isStudent || isParent) && (
          <StatCard
            title="Attendance Rate"
            value={studentStats ? `${studentStats.attendance_percentage}%` : '96%'}
            icon={CheckCircle2}
            change="Across active subjects"
            color="green"
          />
        )}

        {isTutor && (
          <StatCard
            title="Conducted Hours"
            value="18.5 hrs"
            icon={Clock}
            change="This calendar month"
            color="amber"
          />
        )}
      </div>

      {/* Two Column Section: Upcoming Schedule & Enrolled Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Class Sessions */}
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

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">No upcoming classes scheduled</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{session.batch?.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {session.session_date} • {session.start_time} - {session.end_time} • {session.room_or_link || 'Room 101'}
                      </p>
                      {session.topic_covered && (
                        <p className="text-xs text-blue-700 mt-1 font-medium bg-blue-50/70 inline-block px-2 py-0.5 rounded">
                          Topic: {session.topic_covered}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'COMPLETED' ? 'success' : 'primary'}>
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Batches / Courses */}
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
            {batches.slice(0, 4).map((b) => (
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
