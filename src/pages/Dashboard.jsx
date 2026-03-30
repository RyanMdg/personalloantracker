import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [overdue, setOverdue] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: loans }, { data: payments }, { data: borrowers }] = await Promise.all([
      supabase.from('loans').select('*'),
      supabase.from('payments').select('*, loans(item_name, monthly_amount, months, start_date, borrower_id)').order('payment_date', { ascending: false }),
      supabase.from('borrowers').select('*'),
    ])

    const allLoans = loans || []
    const allPayments = payments || []
    const allBorrowers = borrowers || []

    const activeLoans = allLoans.filter(l => {
      const paid = allPayments.filter(p => p.loan_id === l.id).length
      return paid < l.months
    })

    const totalOutstanding = activeLoans.reduce((sum, l) => {
      const paid = allPayments.filter(p => p.loan_id === l.id).length
      return sum + (l.months - paid) * Number(l.monthly_amount)
    }, 0)

    const today = new Date()
    const overdueList = []
    for (const loan of activeLoans) {
      const paidNums = new Set(allPayments.filter(p => p.loan_id === loan.id).map(p => p.month_number))
      const start = new Date(loan.start_date)
      const borrower = allBorrowers.find(b => b.id === loan.borrower_id)
      for (let n = 1; n <= loan.months; n++) {
        if (!paidNums.has(n)) {
          const due = new Date(start)
          due.setMonth(due.getMonth() + n - 1)
          due.setDate(due.getDate() + 7)
          if (today > due) overdueList.push({ loan, borrowerName: borrower?.name || '—', month: n })
          break
        }
      }
    }

    setStats({ borrowers: allBorrowers.length, activeLoans: activeLoans.length, totalOutstanding })
    setOverdue(overdueList.slice(0, 5))
    setRecent(allPayments.slice(0, 5))
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-zinc-400 text-sm">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Borrowers', value: stats.borrowers },
          { label: 'Active Loans', value: stats.activeLoans },
          { label: 'Total Outstanding', value: `₱${stats.totalOutstanding.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">Overdue</h2>
          {overdue.length === 0 ? (
            <p className="text-sm text-zinc-400">No overdue payments.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {overdue.map((o, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/loans/${o.loan.id}`)}
                  className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{o.borrowerName}</p>
                    <p className="text-xs text-zinc-400">{o.loan.item_name} — Month {o.month}</p>
                  </div>
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Overdue</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">Recent Payments</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-400">No payments logged yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/loans/${p.loan_id}`)}
                  className="flex items-center justify-between border border-zinc-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{p.loans?.item_name}</p>
                    <p className="text-xs text-zinc-400">
                      Month {p.month_number} — {new Date(p.payment_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">Paid</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
