import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'

export default function Borrowers() {
  const [borrowers, setBorrowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('borrowers').select('*').order('name')
    setBorrowers(data || [])
    setLoading(false)
  }

  async function addBorrower(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('borrowers').insert({ name: form.name.trim(), contact: form.contact.trim() || null })
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    toast('Borrower added')
    setForm({ name: '', contact: '' })
    setShowModal(false)
    setSaving(false)
    load()
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-zinc-400 text-sm">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Borrowers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          + Add Borrower
        </button>
      </div>

      {borrowers.length === 0 ? (
        <p className="text-sm text-zinc-400">No borrowers yet. Add one to get started.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {borrowers.map(b => (
            <div
              key={b.id}
              onClick={() => navigate(`/borrowers/${b.id}`)}
              className="flex items-center gap-4 border border-zinc-200 rounded-2xl px-5 py-4 cursor-pointer hover:bg-zinc-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {b.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{b.name}</p>
                {b.contact && <p className="text-xs text-zinc-400 mt-0.5">{b.contact}</p>}
              </div>
              <span className="text-zinc-300 text-sm">→</span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Borrower" onClose={() => setShowModal(false)}>
          <form onSubmit={addBorrower} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Name</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Contact (optional)</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                placeholder="Phone / Messenger"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-zinc-200 text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Borrower'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
