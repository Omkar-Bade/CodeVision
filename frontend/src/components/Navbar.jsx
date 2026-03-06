import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Home',       path: '/'           },
  { label: 'Visualizer', path: '/visualizer' },
  { label: 'Courses',    path: '/courses'    },
  { label: 'Notes',      path: '/notes'      },
  { label: 'Tutorials',  path: '/tutorials'  },
]

export default function Navbar() {
  const { pathname }   = useLocation()
  const navigate       = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try { await signOut() } catch (_) { /* ignore */ }
    navigate('/login')
  }

  // Derive display name: prefer user metadata name, fallback to email prefix
  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? ''
  const initials    = displayName.slice(0, 2).toUpperCase()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center
                    bg-[#111827] border-b border-[#1F2937]">
      <div className="w-full max-w-screen-xl mx-auto px-5 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center
                          transition-colors duration-150 group-hover:bg-blue-500">
            <span className="text-white font-bold text-xs font-mono tracking-tight">CV</span>
          </div>
          <span className="font-bold text-base font-mono text-white tracking-tight">
            Code<span className="text-blue-400">Vision</span>
          </span>
        </Link>

        {/* Nav links + Auth */}
        <div className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ label, path }) => {
            const active = pathname === path
            return (
              <Link key={path} to={path}>
                <span className={`nav-link ${active ? 'nav-link-active' : ''}`}>
                  {label}
                </span>
              </Link>
            )
          })}

          <div className="flex items-center gap-2 ml-3 pl-3 border-l border-[#1F2937]">
            {user ? (
              /* ── Logged-in state ── */
              <>
                {/* Avatar chip */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg
                                bg-[#0B1120] border border-[#374151]">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center
                                  text-white text-[10px] font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="text-gray-300 text-xs font-mono max-w-[120px] truncate">
                    {displayName}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm border border-[#374151] text-gray-400
                             hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors duration-150"
                >
                  Sign Out
                </button>
              </>
            ) : (
              /* ── Logged-out state ── */
              <>
                <Link to="/login"
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors duration-150">
                  Log In
                </Link>
                <Link to="/register"
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg
                             font-medium transition-colors duration-150">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </nav>
  )
}
