import { useToast } from '../context/ToastContext'

export default function Toast() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in slide-in-from-right-4 duration-200
            ${t.type === 'error' ? 'bg-black text-white border border-red-500' : 'bg-black text-white'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
