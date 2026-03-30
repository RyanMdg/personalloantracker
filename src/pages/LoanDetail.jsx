import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadReceipt } from '../lib/cloudinary'
import { useToast } from '../context/ToastContext'
import { useLightbox } from '../context/LightboxContext'
import Modal from '../components/Modal'
import PaymentGrid from '../components/PaymentGrid'
import QuickMessage from '../components/QuickMessage'

function getMonthLabel(monthNumber, startDate) {
  const d = new Date(startDate)
  d.setDate(1)
  d.setMonth(d.getMonth() + monthNumber - 1)
  return d.toLocaleString('en-PH', { month: 'long', year: 'numeric' })
}

export default function LoanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { openLightbox } = useLightbox()
  const [loan, setLoan] = useState(null)
  const [borrower, setBorrower] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [form, setForm] = useState({ month_number: '', payment_date: '', notes: '' })
  const [editPayment, setEditPayment] = useState(null)
  const [editForm, setEditForm] = useState({ payment_date: '', notes: '' })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: l } = await supabase.from('loans').select('*').eq('id', id).single()
    if (!l) { setLoading(false); return }
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('borrowers').select('*').eq('id', l.borrower_id).single(),
      supabase.from('payments').select('*').eq('loan_id', id).order('month_number'),
    ])
    setLoan(l)
    setBorrower(b)
    setPayments(p || [])
    setLoading(false)
    const paidSet = new Set((p || []).map(x => x.month_number))
    for (let n = 1; n <= l.months; n++) {
      if (!paidSet.has(n)) { setForm(f => ({ ...f, month_number: String(n) })); break }
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  function openEdit(p) {
    setEditPayment(p)
    setEditForm({ payment_date: p.payment_date, notes: p.notes || '' })
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editForm.payment_date) return
    setEditSaving(true)
    const { error } = await supabase.from('payments').update({
      payment_date: editForm.payment_date,
      notes: editForm.notes.trim() || null,
    }).eq('id', editPayment.id)
    if (error) { toast(error.message, 'error'); setEditSaving(false); return }
    toast('Payment updated')
    setEditPayment(null)
    setEditSaving(false)
    load()
  }

  async function logPayment(e) {
    e.preventDefault()
    if (!form.month_number || !form.payment_date) return
    const paidSet = new Set(payments.map(p => p.month_number))
    if (paidSet.has(Number(form.month_number))) { toast('This month is already paid', 'error'); return }
    setSaving(true)
    let receipt_url = null
    if (receiptFile) {
      try {
        setUploading(true)
        receipt_url = await uploadReceipt(receiptFile)
        setUploading(false)
      } catch {
        toast('Receipt upload failed', 'error')
        setSaving(false)
        setUploading(false)
        return
      }
    }
    const { error } = await supabase.from('payments').insert({
      loan_id: id,
      month_number: Number(form.month_number),
      payment_date: form.payment_date,
      receipt_url,
      notes: form.notes.trim() || null,
    })
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    toast('Payment logged')
    setShowModal(false)
    setReceiptFile(null)
    setReceiptPreview(null)
    setSaving(false)
    load()
  }

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-zinc-400 text-sm">Loading...</div>
  if (!loan) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-zinc-400 text-sm">Not found.</div>

  const paidCount = payments.length
  const remaining = loan.months - paidCount
  const amountPaid = paidCount * Number(loan.monthly_amount)
  const amountLeft = remaining * Number(loan.monthly_amount)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <button onClick={() => navigate(`/borrowers/${loan.borrower_id}`)} className="text-sm text-zinc-400 hover:text-black mb-6 flex items-center gap-1">
        ← Back
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{loan.item_name}</h1>
          {borrower && <p className="text-sm text-zinc-400 mt-1">{borrower.name}</p>}
        </div>
        {remaining > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Log Payment
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Monthly', value: `₱${Number(loan.monthly_amount).toLocaleString()}` },
          { label: 'Progress', value: `${paidCount}/${loan.months}` },
          { label: 'Remaining', value: `₱${amountLeft.toLocaleString()}` },
          { label: 'Amount Paid', value: `₱${amountPaid.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="border border-zinc-200 rounded-2xl p-4">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1.5">{s.label}</p>
            <p className="text-lg font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">Payment Progress</h2>
        <PaymentGrid months={loan.months} payments={payments} />
      </section>

      {borrower && (
        <section className="mb-10">
          <QuickMessage loan={loan} borrower={borrower} payments={payments} />
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-zinc-400">No payments logged yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-4 border border-zinc-200 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Month {p.month_number} — {getMonthLabel(p.month_number, loan.start_date)}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(p.payment_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {p.notes && ` · ${p.notes}`}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs text-zinc-400 hover:text-black px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors flex-shrink-0"
                >
                  Edit
                </button>
                {p.receipt_url ? (
                  <button onClick={() => openLightbox(p.receipt_url)} className="flex-shrink-0">
                    <img src={p.receipt_url} alt="Receipt" className="w-12 h-12 object-cover rounded-lg border border-zinc-200 hover:opacity-80 transition-opacity" />
                  </button>
                ) : (
                  <span className="text-xs text-zinc-300">No receipt</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <Modal title="Log Payment" onClose={() => setShowModal(false)}>
          <form onSubmit={logPayment} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Month</label>
                <select
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
                  value={form.month_number}
                  onChange={e => setForm(f => ({ ...f, month_number: e.target.value }))}
                >
                  <option value="">Select month</option>
                  {Array.from({ length: loan.months }, (_, i) => i + 1).map(n => {
                    const paid = new Set(payments.map(p => p.month_number)).has(n)
                    return (
                      <option key={n} value={n} disabled={paid}>
                        Month {n} — {getMonthLabel(n, loan.start_date)}{paid ? ' ✓' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Payment Date</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                  type="date"
                  required
                  value={form.payment_date}
                  onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Notes (optional)</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Receipt Photo (optional)</label>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl border border-zinc-200" />
                ) : (
                  <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center hover:border-zinc-400 transition-colors">
                    <p className="text-sm text-zinc-400">Tap to upload receipt</p>
                    <p className="text-xs text-zinc-300 mt-1">JPG, PNG supported</p>
                  </div>
                )}
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-zinc-200 text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50">
                {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Log Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {editPayment && (
        <Modal title="Edit Payment" onClose={() => setEditPayment(null)}>
          <form onSubmit={saveEdit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Payment Date</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                type="date"
                required
                value={editForm.payment_date}
                onChange={e => setEditForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Notes (optional)</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes..."
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEditPayment(null)} className="flex-1 border border-zinc-200 text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={editSaving} className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50">
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
