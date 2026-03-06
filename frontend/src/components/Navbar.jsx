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
  const { pathname }    = useLocation()
  const navigate        = useNavigate()
  const { user, logoutUser } = useAuth()

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

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

        {/* Nav links */}
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
        </div>

        {/* Auth section */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* User info chip */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                              bg-[#1F2937] border border-[#374151] text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center
                                text-white text-xs font-bold shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-300 max-w-[100px] truncate">{user.name}</span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-gray-400 border border-[#374151]
                           rounded-lg hover:bg-[#1F2937] hover:text-white
                           transition-colors duration-150"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white
                           transition-colors duration-150"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500
                           rounded-lg transition-colors duration-150"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
