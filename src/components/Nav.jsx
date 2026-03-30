import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-widest uppercase">LoanTracker</span>
        <nav className="flex gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-black' : 'text-zinc-400 hover:text-black'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/borrowers"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-black' : 'text-zinc-400 hover:text-black'}`
            }
          >
            Borrowers
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
