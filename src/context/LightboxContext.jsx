import { createContext, useContext, useState } from 'react'

const LightboxContext = createContext(null)

export function LightboxProvider({ children }) {
  const [src, setSrc] = useState(null)

  const openLightbox = (url) => setSrc(url)
  const closeLightbox = () => setSrc(null)

  return (
    <LightboxContext.Provider value={{ src, openLightbox, closeLightbox }}>
      {children}
    </LightboxContext.Provider>
  )
}

export function useLightbox() {
  return useContext(LightboxContext)
}
