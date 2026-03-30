import { useLightbox } from '../context/LightboxContext'

export default function Lightbox() {
  const { src, closeLightbox } = useLightbox()
  if (!src) return null

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={closeLightbox}
    >
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={closeLightbox}
          className="absolute -top-10 right-0 text-white text-sm font-medium hover:text-zinc-300"
        >
          Close ✕
        </button>
        <img src={src} alt="Receipt" className="w-full rounded-lg object-contain max-h-[80vh]" />
      </div>
    </div>
  )
}
