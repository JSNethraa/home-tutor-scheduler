import client from './client';

export const authApi = {
  login: (username, password) => client.post('/auth/login/', { username, password }),
  getMe: () => client.get('/auth/me/'),
  changePassword: (data) => client.post('/auth/change-password/', data),
};

export const batchApi = {
  getAll: (params) => client.get('/batches/', { params }),
  getMyBatches: () => client.get('/batches/my_batches/'),
  getById: (id) => client.get(`/batches/${id}/`),
  create: (data) => client.post('/batches/', data),
  update: (id, data) => client.put(`/batches/${id}/`, data),
  enrollStudent: (batchId, payload) =>
    client.post(`/batches/${batchId}/enroll/`, typeof payload === 'object' ? payload : { student_id: payload }),
  unenrollStudent: (batchId, studentId) => client.post(`/batches/${batchId}/unenroll/`, { student_id: studentId }),
};

export const scheduleApi = {
  getSessions: (params) => client.get('/scheduling/sessions/', { params }),
  createSession: (data) => client.post('/scheduling/sessions/', data),
  updateSession: (id, data) => client.put(`/scheduling/sessions/${id}/`, data),
  checkConflict: (data) => client.post('/scheduling/check-conflict/', data),
  generateFromRules: (batchId, weeksAhead = 4) =>
    client.post('/scheduling/sessions/generate_from_rules/', { batch_id: batchId, weeks_ahead: weeksAhead }),
};

export const attendanceApi = {
  getRecords: (params) => client.get('/attendance/', { params }),
  getSessionSheet: (sessionId) => client.get('/attendance/session_sheet/', { params: { session_id: sessionId } }),
  submitBulk: (data) => client.post('/attendance/bulk_mark/', data),
  getStudentStats: (studentId, batchId) => client.get('/attendance/student_stats/', { params: { student_id: studentId, batch_id: batchId } }),
  updateRecord: (recordId, data) => client.patch(`/attendance/${recordId}/`, data),
  changeStatus: (recordId, data) => client.post(`/attendance/${recordId}/change_status/`, data),
};

export const feeApi = {
  getInvoices: (params) => client.get('/fees/invoices/', { params }),
  createInvoice: (data) => client.post('/fees/invoices/', data),
  recordPayment: (invoiceId, data) => client.post(`/fees/invoices/${invoiceId}/record_payment/`, data),
  getSummary: () => client.get('/fees/invoices/summary/'),
  downloadReceiptUrl: (paymentId) => {
    const token = localStorage.getItem('access_token');
    return `${client.defaults.baseURL}/fees/receipts/${paymentId}/download/${token ? `?token=${token}` : ''}`;
  },
};

export const reportApi = {
  getAssessments: (params) => client.get('/reports/assessments/', { params }),
  createAssessment: (data) => client.post('/reports/assessments/', data),
  recordResult: (data) => client.post('/reports/results/', data),
  getProgressReports: (params) => client.get('/reports/progress-reports/', { params }),
  createProgressReport: (data) => client.post('/reports/progress-reports/', data),
  autoCalculate: (studentId, batchId, periodStart, periodEnd) => client.post('/reports/progress-reports/auto_calculate/', { student_id: studentId, batch_id: batchId, period_start: periodStart, period_end: periodEnd }),
  downloadPdfUrl: (reportId) => {
    const token = localStorage.getItem('access_token');
    return `${client.defaults.baseURL}/reports/progress-reports/${reportId}/download_pdf/${token ? `?token=${token}` : ''}`;
  },
};

export const userApi = {
  getTutors: () => client.get('/accounts/tutors/'),
  getStudents: () => client.get('/accounts/students/'),
  getParents: () => client.get('/accounts/parents/'),
};
