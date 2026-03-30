export default function PaymentGrid({ months, payments }) {
  const paidSet = new Set(payments.map(p => p.month_number))

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Array.from({ length: months }, (_, i) => i + 1).map(n => (
        <div
          key={n}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-medium border transition-colors
            ${paidSet.has(n)
              ? 'bg-black text-white border-black'
              : 'bg-white text-zinc-400 border-zinc-200'
            }`}
        >
          <span>{n}</span>
          {paidSet.has(n) && <span className="text-[9px] leading-none mt-0.5">✓</span>}
        </div>
      ))}
    </div>
  )
}
