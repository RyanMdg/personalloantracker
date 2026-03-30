import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'

export default function BorrowerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [borrower, setBorrower] = useState(null)
  const [loans, setLoans] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ item_name: '', total_price: '', monthly_amount: '', months: '', start_date: '' })

  useEffect(() => { load() }, [id])

  async function load() {
    const [{ data: b }, { data: l }, { data: p }] = await Promise.all([
      supabase.from('borrowers').select('*').eq('id', id).single(),
      supabase.from('loans').select('*').eq('borrower_id', id).order('created_at', { ascending: false }),
      supabase.from('payments').select('loan_id, month_number'),
    ])
    setBorrower(b)
    setLoans(l || [])
    setPayments(p || [])
    setLoading(false)
  }

  function paidCount(loanId) {
    return payments.filter(p => p.loan_id === loanId).length
  }

  function loanStatus(loan) {
    const paid = paidCount(loan.id)
    if (paid >= loan.months) return 'Completed'
    const paidNums = new Set(payments.filter(p => p.loan_id === loan.id).map(p => p.month_number))
    const start = new Date(loan.start_date)
    const today = new Date()
    for (let n = 1; n <= loan.months; n++) {
      if (!paidNums.has(n)) {
        const due = new Date(start)
        due.setMonth(due.getMonth() + n - 1)
        due.setDate(due.getDate() + 7)
        if (today > due) return 'Overdue'
        break
      }
    }
    return 'Active'
  }

  async function addLoan(e) {
    e.preventDefault()
    if (!form.item_name.trim() || !form.monthly_amount || !form.months || !form.start_date) return
    setSaving(true)
    const { error } = await supabase.from('loans').insert({
      borrower_id: id,
      item_name: form.item_name.trim(),
      total_price: form.total_price ? Number(form.total_price) : null,
      monthly_amount: Number(form.monthly_amount),
      months: Number(form.months),
      start_date: form.start_date,
    })
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    toast('Loan added')
    setForm({ item_name: '', total_price: '', monthly_amount: '', months: '', start_date: '' })
    setShowModal(false)
    setSaving(false)
    load()
  }

  const statusStyles = {
    Completed: 'bg-emerald-50 text-emerald-700',
    Overdue: 'bg-red-50 text-red-600',
    Active: 'bg-zinc-100 text-zinc-600',
  }

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-zinc-400 text-sm">Loading...</div>
  if (!borrower) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-zinc-400 text-sm">Not found.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <button onClick={() => navigate('/borrowers')} className="text-sm text-zinc-400 hover:text-black mb-6 flex items-center gap-1">
        ← Back
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-semibold flex-shrink-0">
          {borrower.name[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{borrower.name}</h1>
          {borrower.contact && <p className="text-sm text-zinc-400 mt-0.5">{borrower.contact}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Loans</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          + Add Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <p className="text-sm text-zinc-400">No loans yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {loans.map(loan => {
            const paid = paidCount(loan.id)
            const status = loanStatus(loan)
            return (
              <div
                key={loan.id}
                onClick={() => navigate(`/loans/${loan.id}`)}
                className="flex items-center gap-4 border border-zinc-200 rounded-2xl px-5 py-4 cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{loan.item_name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ₱{Number(loan.monthly_amount).toLocaleString()}/mo · {paid}/{loan.months} months paid
                  </p>
                  {loan.total_price && (
                    <p className="text-xs text-zinc-400">Total: ₱{Number(loan.total_price).toLocaleString()}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[status]}`}>{status}</span>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <Modal title="Add Loan" onClose={() => setShowModal(false)}>
          <form onSubmit={addLoan} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Item Name</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                value={form.item_name}
                onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                placeholder="e.g. MacBook Air M2"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Total Price (optional)</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                  type="number"
                  value={form.total_price}
                  onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))}
                  placeholder="₱0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Monthly Amount</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                  type="number"
                  required
                  value={form.monthly_amount}
                  onChange={e => setForm(f => ({ ...f, monthly_amount: e.target.value }))}
                  placeholder="₱0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">No. of Months</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                  type="number"
                  required
                  min="1"
                  value={form.months}
                  onChange={e => setForm(f => ({ ...f, months: e.target.value }))}
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Start Date</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-zinc-200 text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Loan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
