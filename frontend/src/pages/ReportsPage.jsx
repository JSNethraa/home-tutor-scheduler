import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportApi, batchApi, userApi } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FileText, Plus, Download, Sparkles, Award, TrendingUp, CheckCircle } from 'lucide-react';

export const ReportsPage = () => {
  const { isTutor, isAdmin, isParent, isStudent } = useAuth();
  const [reports, setReports] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoCalculating, setAutoCalculating] = useState(false);

  // New report form
  const [formData, setFormData] = useState({
    student_id: '',
    batch_id: '',
    period_start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    attendance_percentage: 95.0,
    average_test_score: 90.0,
    tutor_remarks: '',
    strengths: '',
    areas_for_improvement: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const repRes = await reportApi.getProgressReports();
      setReports(repRes.data.results || repRes.data || []);

      if (isAdmin || isTutor) {
        const [bRes, sRes] = await Promise.all([
          batchApi.getMyBatches(),
          userApi.getStudents(),
        ]);
        const batchList = bRes.data || [];
        const studentList = sRes.data.results || sRes.data || [];
        setBatches(batchList);
        setStudents(studentList);
        if (batchList.length > 0 && studentList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            batch_id: batchList[0].id,
            student_id: studentList[0].id,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAutoCalculate = async () => {
    if (!formData.student_id || !formData.batch_id) {
      alert('Please select both Student and Batch first.');
      return;
    }
    setAutoCalculating(true);
    try {
      const res = await reportApi.autoCalculate(formData.student_id, formData.batch_id);
      setFormData((prev) => ({
        ...prev,
        attendance_percentage: res.data.attendance_percentage,
        average_test_score: res.data.average_test_score,
      }));
    } catch (err) {
      alert('Could not compute real-time metrics.');
    } finally {
      setAutoCalculating(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await reportApi.createProgressReport(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate progress report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Progress Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Official periodic student evaluation cards with automated attendance, assessment grades, and downloadable PDF cards.
          </p>
        </div>

        {(isTutor || isAdmin) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Progress Card</span>
          </button>
        )}
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading progress reports...</div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm bg-white rounded-2xl border border-gray-100">
          No progress reports published yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <span>Period:</span>
                    <span className="font-semibold text-gray-700">{rep.period_start} to {rep.period_end}</span>
                  </div>
                  <Badge variant="primary" size="xs">
                    {rep.batch?.subject || 'Academics'}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  {rep.student?.user?.full_name || 'Student'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Course: <span className="font-semibold text-gray-800">{rep.batch?.name}</span>
                </p>

                {/* Score Gauges */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-green-800 uppercase tracking-wider">Attendance</p>
                      <p className="text-lg font-bold text-green-700">{rep.attendance_percentage}%</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                    <Award className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Test Average</p>
                      <p className="text-lg font-bold text-blue-700">{rep.average_test_score}%</p>
                    </div>
                  </div>
                </div>

                {/* Qualitative Remarks */}
                <div className="space-y-2 text-xs text-gray-600 mt-2 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                  <p>
                    <span className="font-bold text-gray-800">Tutor Remarks:</span> {rep.tutor_remarks}
                  </p>
                  {rep.strengths && (
                    <p>
                      <span className="font-bold text-green-700">Strengths:</span> {rep.strengths}
                    </p>
                  )}
                  {rep.areas_for_improvement && (
                    <p>
                      <span className="font-bold text-amber-700">Improvement:</span> {rep.areas_for_improvement}
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end">
                <a
                  href={reportApi.downloadPdfUrl(rep.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Progress Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Academic Progress Card"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Student</label>
              <select
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user?.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Batch / Course</label>
              <select
                required
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Period Start</label>
              <input
                type="date"
                required
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Period End</label>
              <input
                type="date"
                required
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Auto Calculate Button */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <span className="text-xs text-blue-900 font-medium">
              Auto-calculate attendance & test averages from records:
            </span>
            <button
              type="button"
              onClick={handleAutoCalculate}
              disabled={autoCalculating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{autoCalculating ? 'Computing...' : 'Calculate Now'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Attendance Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.attendance_percentage}
                onChange={(e) => setFormData({ ...formData, attendance_percentage: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Test Average (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.average_test_score}
                onChange={(e) => setFormData({ ...formData, average_test_score: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tutor Feedback & General Remarks</label>
            <textarea
              required
              rows={2}
              value={formData.tutor_remarks}
              onChange={(e) => setFormData({ ...formData, tutor_remarks: e.target.value })}
              placeholder="e.g. Demonstrates strong analytical interest, active in answering board questions."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Key Strengths</label>
              <input
                type="text"
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                placeholder="e.g. Formula derivations, regular homework submission"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Areas for Improvement</label>
              <input
                type="text"
                value={formData.areas_for_improvement}
                onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                placeholder="e.g. Numerical step-by-step presentation"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Publish Progress Report Card
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
