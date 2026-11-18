import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { CreditCard, Plus, CheckCircle2, Clock, DollarSign } from 'lucide-react';

// ── Mock Data ─────────────────────────────────────────────────────────────────
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

const INIT_INVOICES = [
  { id: 1, invoice_number: 'INV-001', student_name: 'Rohit Sharma',  batch_name: 'Maths 1-on-1',    billing_month: 'October 2026',  amount_due: 4000, amount_paid: 4000, status: 'PAID',          due_date: '2026-10-10', payment_date: '2026-10-08' },
  { id: 2, invoice_number: 'INV-002', student_name: 'Priya Patel',   batch_name: 'Physics Batch A',  billing_month: 'October 2026',  amount_due: 2500, amount_paid: 1000, status: 'PARTIAL',       due_date: '2026-10-10', payment_date: null },
  { id: 3, invoice_number: 'INV-003', student_name: 'Arjun Verma',   batch_name: 'Chemistry Group',  billing_month: 'October 2026',  amount_due: 2200, amount_paid: 0,    status: 'UNPAID',        due_date: '2026-10-10', payment_date: null },
  { id: 4, invoice_number: 'INV-004', student_name: 'Rohit Sharma',  batch_name: 'Maths 1-on-1',    billing_month: 'November 2026', amount_due: 4000, amount_paid: 4000, status: 'PAID',          due_date: '2026-11-10', payment_date: '2026-11-07' },
  { id: 5, invoice_number: 'INV-005', student_name: 'Priya Patel',   batch_name: 'Physics Batch A',  billing_month: 'November 2026', amount_due: 2500, amount_paid: 0,    status: 'UNPAID',        due_date: '2026-11-10', payment_date: null },
];

const SUMMARY = { total_collected: 9000, total_pending: 4700, unpaid_invoices: 2, partially_paid_invoices: 1 };

const statusVariant = { PAID: 'success', PARTIAL: 'warning', UNPAID: 'danger', OVERDUE: 'danger' };

export const FeesPage = () => {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState(INIT_INVOICES);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [newInvoice, setNewInvoice] = useState({
    student_id: '4', batch_id: '1',
    invoice_number: `INV-${Date.now().toString().slice(-4)}`,
    billing_month: 'November 2026',
    amount_due: 2500,
    due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
  });

  const [payForm, setPayForm] = useState({ amount_paid: 2500, payment_date: new Date().toISOString().split('T')[0], payment_method: 'UPI', transaction_reference: '' });

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const student = MOCK_STUDENTS.find(s => s.id === parseInt(newInvoice.student_id));
    const batch   = MOCK_BATCHES.find(b => b.id === parseInt(newInvoice.batch_id));
    setInvoices(prev => [{
      id: Date.now(),
      invoice_number: newInvoice.invoice_number,
      student_name: student?.name,
      batch_name: batch?.name,
      billing_month: newInvoice.billing_month,
      amount_due: parseFloat(newInvoice.amount_due),
      amount_paid: 0, status: 'UNPAID',
      due_date: newInvoice.due_date, payment_date: null,
    }, ...prev]);
    setIsInvoiceModalOpen(false);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const paid = parseFloat(payForm.amount_paid);
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== selectedInvoice.id) return inv;
      const totalPaid = inv.amount_paid + paid;
      return { ...inv, amount_paid: totalPaid, status: totalPaid >= inv.amount_due ? 'PAID' : 'PARTIAL', payment_date: payForm.payment_date };
    }));
    setIsPayModalOpen(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Installments</h1>
          <p className="text-sm text-gray-500 mt-1">Track fee invoices and record student payments.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `Rs. ${SUMMARY.total_collected.toLocaleString()}`, color: 'bg-green-50 text-green-700' },
          { label: 'Total Pending',   value: `Rs. ${SUMMARY.total_pending.toLocaleString()}`,   color: 'bg-red-50 text-red-700'   },
          { label: 'Unpaid',          value: invoices.filter(i => i.status === 'UNPAID').length, color: 'bg-amber-50 text-amber-700'},
          { label: 'Total Invoices',  value: invoices.length,                                   color: 'bg-blue-50 text-blue-700' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-2xl p-4`}>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-gray-900">Fee Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Batch</th>
                <th className="px-5 py-3.5">Month</th>
                <th className="px-5 py-3.5">Amount Due</th>
                <th className="px-5 py-3.5">Paid</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Due Date</th>
                {isAdmin && <th className="px-5 py-3.5">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{inv.invoice_number}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{inv.student_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{inv.batch_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{inv.billing_month}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">Rs. {inv.amount_due.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-green-700 font-semibold">Rs. {inv.amount_paid.toLocaleString()}</td>
                  <td className="px-5 py-3.5"><Badge variant={statusVariant[inv.status] || 'default'} size="xs">{inv.status}</Badge></td>
                  <td className="px-5 py-3.5 text-gray-600">{inv.due_date}</td>
                  {isAdmin && (
                    <td className="px-5 py-3.5">
                      {inv.status !== 'PAID' && (
                        <button onClick={() => { setSelectedInvoice(inv); setPayForm(p => ({ ...p, amount_paid: inv.amount_due - inv.amount_paid })); setIsPayModalOpen(true); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-semibold rounded-lg transition">
                          <DollarSign className="w-3.5 h-3.5" /> Record Payment
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Create Fee Invoice" maxWidth="max-w-md">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Student</label>
            <select value={newInvoice.student_id} onChange={e => setNewInvoice(p => ({ ...p, student_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MOCK_STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Batch</label>
            <select value={newInvoice.batch_id} onChange={e => setNewInvoice(p => ({ ...p, batch_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MOCK_BATCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Billing Month</label>
              <input type="text" value={newInvoice.billing_month} onChange={e => setNewInvoice(p => ({ ...p, billing_month: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Amount Due (Rs.)</label>
              <input type="number" value={newInvoice.amount_due} onChange={e => setNewInvoice(p => ({ ...p, amount_due: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Due Date</label>
              <input type="date" value={newInvoice.due_date} onChange={e => setNewInvoice(p => ({ ...p, due_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Invoice #</label>
              <input type="text" value={newInvoice.invoice_number} onChange={e => setNewInvoice(p => ({ ...p, invoice_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsInvoiceModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">Create Invoice</button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Record Payment" maxWidth="max-w-sm">
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-900">
              <p className="font-bold">{selectedInvoice.student_name}</p>
              <p className="text-xs text-blue-700 mt-0.5">{selectedInvoice.batch_name} — {selectedInvoice.billing_month}</p>
              <p className="text-xs mt-1">Remaining: <strong>Rs. {(selectedInvoice.amount_due - selectedInvoice.amount_paid).toLocaleString()}</strong></p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Amount Paid (Rs.)</label>
              <input type="number" value={payForm.amount_paid} onChange={e => setPayForm(p => ({ ...p, amount_paid: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payment Method</label>
              <select value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payment Date</label>
              <input type="date" value={payForm.payment_date} onChange={e => setPayForm(p => ({ ...p, payment_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsPayModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button type="submit"
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition">Save Payment</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
