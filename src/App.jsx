import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Toast from './components/Toast'
import Lightbox from './components/Lightbox'
import Dashboard from './pages/Dashboard'
import Borrowers from './pages/Borrowers'
import BorrowerDetail from './pages/BorrowerDetail'
import LoanDetail from './pages/LoanDetail'
import { ToastProvider } from './context/ToastContext'
import { LightboxProvider } from './context/LightboxContext'

export default function App() {
  return (
    <ToastProvider>
      <LightboxProvider>
        <div className="min-h-screen bg-white">
          <Nav />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/borrowers" element={<Borrowers />} />
              <Route path="/borrowers/:id" element={<BorrowerDetail />} />
              <Route path="/loans/:id" element={<LoanDetail />} />
            </Routes>
          </main>
          <Toast />
          <Lightbox />
        </div>
      </LightboxProvider>
    </ToastProvider>
  )
}
