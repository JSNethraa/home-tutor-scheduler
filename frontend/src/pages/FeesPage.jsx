import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { feeApi, batchApi, userApi } from '../api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { CreditCard, Plus, Download, DollarSign, CheckCircle2, Clock } from 'lucide-react';

export const FeesPage = () => {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState({
    student_id: '',
    batch_id: '',
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    billing_month: 'November 2026',
    amount_due: 2500,
    due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
  });

  // Record Payment Form
  const [payForm, setPayForm] = useState({
    amount_paid: 2500,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI',
    transaction_reference: '',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const invRes = await feeApi.getInvoices();
      setInvoices(invRes.data.results || invRes.data || []);

      if (isAdmin) {
        const [sumRes, bRes, sRes] = await Promise.all([
          feeApi.getSummary(),
          batchApi.getAll(),
          userApi.getStudents(),
        ]);
        setSummary(sumRes.data);
        setBatches(bRes.data.results || bRes.data || []);
        setStudents(sRes.data.results || sRes.data || []);
      }
    } catch (err) {
      console.error('Error loading fee records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await feeApi.createInvoice(newInvoice);
      setIsInvoiceModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate invoice.');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await feeApi.recordPayment(selectedInvoice.id, payForm);
      setIsPayModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record installment payment.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Installments & Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track tuition fee invoices, multi-part installment collections, and PDF receipts.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Billed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {summary.total_billed.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Rs. {summary.total_collected.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outstanding Balance</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">Rs. {summary.total_pending.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Fee Invoices & Payments</h2>
          <span className="text-xs text-gray-500 font-medium">{invoices.length} records</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading invoice statements...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">No fee invoices recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Batch</th>
                  <th className="px-6 py-3.5">Month</th>
                  <th className="px-6 py-3.5">Amount Due</th>
                  <th className="px-6 py-3.5">Paid</th>
                  <th className="px-6 py-3.5">Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isPartial = inv.status === 'PARTIALLY_PAID';
                  const latestPayment = inv.payments && inv.payments.length > 0 ? inv.payments[0] : null;

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900 whitespace-nowrap">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {inv.student?.user?.full_name || 'Student'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {inv.batch?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {inv.billing_month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        Rs. {inv.amount_due}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                        Rs. {inv.total_paid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-amber-600">
                        Rs. {inv.balance_remaining}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={isPaid ? 'success' : isPartial ? 'warning' : 'danger'} size="xs">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && isAdmin && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPayForm({ ...payForm, amount_paid: inv.balance_remaining });
                                setIsPayModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition"
                            >
                              Pay Installment
                            </button>
                          )}

                          {latestPayment && (
                            <a
                              href={feeApi.downloadReceiptUrl(latestPayment.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                              title="Download ReportLab PDF Receipt"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Receipt PDF</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment for Invoice ${selectedInvoice?.invoice_number}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-600 space-y-1">
            <div>Student: <span className="font-semibold text-gray-800">{selectedInvoice?.student?.user?.full_name}</span></div>
            <div>Remaining Balance: <span className="font-semibold text-amber-600">Rs. {selectedInvoice?.balance_remaining}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Amount Paid (Rs.)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={payForm.amount_paid}
                onChange={(e) => setPayForm({ ...payForm, amount_paid: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Payment Method</label>
              <select
                value={payForm.payment_method}
                onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Transaction Ref / UTR</label>
              <input
                type="text"
                placeholder="e.g. UPI-REF-998811"
                value={payForm.transaction_reference}
                onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow-sm"
            >
              Confirm Payment & Generate Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate Tuition Fee Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Student</label>
              <select
                required
                value={newInvoice.student_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user?.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Batch</label>
              <select
                required
                value={newInvoice.batch_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, batch_id: e.target.value })}
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
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Billing Month</label>
              <input
                type="text"
                required
                value={newInvoice.billing_month}
                onChange={(e) => setNewInvoice({ ...newInvoice, billing_month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Fee Amount (Rs.)</label>
              <input
                type="number"
                min="0"
                required
                value={newInvoice.amount_due}
                onChange={(e) => setNewInvoice({ ...newInvoice, amount_due: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Generate Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
