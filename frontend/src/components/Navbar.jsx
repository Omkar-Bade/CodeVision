import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Home',       path: '/'           },
  { label: 'Visualizer', path: '/visualizer' },
  { label: 'Courses',    path: '/courses'    },
  { label: 'Notes',      path: '/notes'      },
  { label: 'Tutorials',  path: '/tutorials'  },
]

export default function Navbar() {
  const { pathname } = useLocation()

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
      </div>
    </nav>
  )
}
