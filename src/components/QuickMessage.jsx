import { useToast } from '../context/ToastContext'

function getMonthLabel(monthNumber, startDate) {
  const d = new Date(startDate)
  d.setDate(1)
  d.setMonth(d.getMonth() + monthNumber - 1)
  return d.toLocaleString('en-PH', { month: 'long', year: 'numeric' })
}

export default function QuickMessage({ loan, borrower, payments }) {
  const { toast } = useToast()

  const paidSet = new Set(payments.map(p => p.month_number))
  const lastPaid = payments[payments.length - 1] ?? null

  if (!lastPaid) return null

  const message = `Hi! I already paid for my ${loan.item_name} — Month ${lastPaid.month_number} (${getMonthLabel(lastPaid.month_number, loan.start_date)}). ${lastPaid.month_number}/${loan.months} months done.`

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    toast('Message copied')
  }

  const copyReceiptLink = async () => {
    if (lastPaid.receipt_url) {
      await navigator.clipboard.writeText(lastPaid.receipt_url)
      toast('Receipt link copied')
    } else {
      toast('No receipt uploaded for this payment', 'error')
    }
  }

  const openMessenger = () => window.open('https://www.messenger.com', '_blank')

  return (
    <div className="border border-zinc-200 rounded-2xl p-5">
      <span className="text-sm font-semibold">Quick Message</span>

      <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-sans bg-zinc-50 rounded-xl p-4 leading-relaxed mt-3 mb-4">
        {message}
      </pre>

      <div className="flex gap-2">
        <button
          onClick={copyMessage}
          className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Copy Message
        </button>
        <button
          onClick={copyReceiptLink}
          className="flex-1 border border-zinc-200 text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
        >
          Copy Receipt Link
        </button>
        <button
          onClick={openMessenger}
          className="flex-1 border border-zinc-200 text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
        >
          Open Messenger
        </button>
      </div>
    </div>
  )
}
