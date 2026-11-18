import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FileText, Plus, Award, TrendingUp, CheckCircle } from 'lucide-react';

const MOCK_STUDENTS = [
  { id: 4, name: 'Rohit Sharma' },
  { id: 5, name: 'Priya Patel' },
  { id: 6, name: 'Arjun Verma' },
];

const MOCK_BATCHES = [
  { id: 1, name: 'Physics Batch A' },
  { id: 2, name: 'Maths 1-on-1 (Rohit)' },
  { id: 3, name: 'Chemistry Group' },
  { id: 4, name: 'Biology Batch B' },
];

const INIT_REPORTS = [
  { id: 1, student_name: 'Rohit Sharma',  batch_name: 'Maths 1-on-1',   period_start: '2026-10-01', period_end: '2026-10-31', attendance_percentage: 96.0, average_test_score: 88.5, grade: 'A', tutor_remarks: 'Excellent progress, very attentive.',     strengths: 'Strong algebra skills', areas_for_improvement: 'Geometry practice' },
  { id: 2, student_name: 'Priya Patel',   batch_name: 'Physics Batch A', period_start: '2026-10-01', period_end: '2026-10-31', attendance_percentage: 90.0, average_test_score: 76.0, grade: 'B', tutor_remarks: 'Good effort, needs more problem solving.', strengths: 'Theory understanding',  areas_for_improvement: 'Numerical problems' },
  { id: 3, student_name: 'Arjun Verma',   batch_name: 'Chemistry Group', period_start: '2026-10-01', period_end: '2026-10-31', attendance_percentage: 82.0, average_test_score: 65.0, grade: 'C', tutor_remarks: 'Needs to focus more during sessions.',     strengths: 'Lab experiments',       areas_for_improvement: 'Theory concepts' },
];

const gradeVariant = { A: 'success', B: 'primary', C: 'warning', D: 'danger' };

export const ReportsPage = () => {
  const { isTutor, isAdmin, isParent, isStudent } = useAuth();
  const [reports, setReports] = useState(INIT_REPORTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '4', batch_id: '1',
    period_start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    attendance_percentage: 95.0,
    average_test_score: 85.0,
    tutor_remarks: '',
    strengths: '',
    areas_for_improvement: '',
  });

  const getGrade = (score) => score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';

  const handleCreate = (e) => {
    e.preventDefault();
    const student = MOCK_STUDENTS.find(s => s.id === parseInt(formData.student_id));
    const batch   = MOCK_BATCHES.find(b => b.id === parseInt(formData.batch_id));
    setReports(prev => [{
      id: Date.now(),
      student_name: student?.name,
      batch_name: batch?.name,
      period_start: formData.period_start,
      period_end: formData.period_end,
      attendance_percentage: parseFloat(formData.attendance_percentage),
      average_test_score: parseFloat(formData.average_test_score),
      grade: getGrade(parseFloat(formData.average_test_score)),
      tutor_remarks: formData.tutor_remarks,
      strengths: formData.strengths,
      areas_for_improvement: formData.areas_for_improvement,
    }, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Student performance summaries and tutor evaluations.</p>
        </div>
        {(isAdmin || isTutor) && (
          <button onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition">
            <Plus className="w-4 h-4" /> Create Report
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length,                                                 color: 'bg-blue-50 text-blue-700'   },
          { label: 'Grade A',       value: reports.filter(r => r.grade === 'A').length,                   color: 'bg-green-50 text-green-700'  },
          { label: 'Grade B',       value: reports.filter(r => r.grade === 'B').length,                   color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Avg Attendance',value: `${(reports.reduce((s,r) => s + r.attendance_percentage, 0) / (reports.length || 1)).toFixed(1)}%`, color: 'bg-purple-50 text-purple-700' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-2xl p-4`}>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Reports table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-gray-900">Progress Report Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Batch</th>
                <th className="px-5 py-3.5">Period</th>
                <th className="px-5 py-3.5">Attendance</th>
                <th className="px-5 py-3.5">Avg Score</th>
                <th className="px-5 py-3.5">Grade</th>
                <th className="px-5 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{r.student_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{r.batch_name}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{r.period_start} → {r.period_end}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-bold ${r.attendance_percentage >= 85 ? 'text-green-700' : r.attendance_percentage >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {r.attendance_percentage}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{r.average_test_score}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={gradeVariant[r.grade] || 'default'} size="xs">{r.grade}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setSelectedReport(r); setIsDetailOpen(true); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline-offset-2 hover:underline">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Report Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Progress Report" maxWidth="max-w-lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Student</label>
              <select value={formData.student_id} onChange={e => setFormData(p => ({ ...p, student_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MOCK_STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Batch</label>
              <select value={formData.batch_id} onChange={e => setFormData(p => ({ ...p, batch_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MOCK_BATCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Period Start</label>
              <input type="date" value={formData.period_start} onChange={e => setFormData(p => ({ ...p, period_start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Period End</label>
              <input type="date" value={formData.period_end} onChange={e => setFormData(p => ({ ...p, period_end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Attendance %</label>
              <input type="number" value={formData.attendance_percentage} onChange={e => setFormData(p => ({ ...p, attendance_percentage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Avg Test Score</label>
              <input type="number" value={formData.average_test_score} onChange={e => setFormData(p => ({ ...p, average_test_score: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tutor Remarks</label>
            <textarea rows={2} value={formData.tutor_remarks} onChange={e => setFormData(p => ({ ...p, tutor_remarks: e.target.value }))} placeholder="Overall performance remarks..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Strengths</label>
              <input type="text" value={formData.strengths} onChange={e => setFormData(p => ({ ...p, strengths: e.target.value }))} placeholder="e.g. Algebra, Theory"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Areas to Improve</label>
              <input type="text" value={formData.areas_for_improvement} onChange={e => setFormData(p => ({ ...p, areas_for_improvement: e.target.value }))} placeholder="e.g. Geometry, Speed"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">Create Report</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Report Details" maxWidth="max-w-md">
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">{selectedReport.student_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedReport.batch_name} • {selectedReport.period_start} → {selectedReport.period_end}</p>
              </div>
              <Badge variant={gradeVariant[selectedReport.grade] || 'default'} size="md">Grade {selectedReport.grade}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-xl text-center">
                <p className="text-xs font-bold text-green-700 uppercase">Attendance</p>
                <p className="text-xl font-bold text-green-700 mt-1">{selectedReport.attendance_percentage}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <p className="text-xs font-bold text-blue-700 uppercase">Avg Score</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{selectedReport.average_test_score}</p>
              </div>
            </div>
            {selectedReport.tutor_remarks && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-700 uppercase mb-1">Tutor Remarks</p>
                <p className="text-sm text-gray-600">{selectedReport.tutor_remarks}</p>
              </div>
            )}
            {selectedReport.strengths && (
              <div>
                <p className="text-xs font-bold text-green-700 uppercase mb-1 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Strengths</p>
                <p className="text-sm text-gray-700">{selectedReport.strengths}</p>
              </div>
            )}
            {selectedReport.areas_for_improvement && (
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Areas to Improve</p>
                <p className="text-sm text-gray-700">{selectedReport.areas_for_improvement}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
