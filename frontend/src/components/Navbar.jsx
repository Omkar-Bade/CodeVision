import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

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
    <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center
                    bg-vs-surface/95 backdrop-blur border-b border-vs-border">
      <div className="w-full max-w-screen-xl mx-auto px-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-vs-blue flex items-center justify-center
                          shadow-blue-glow group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-xs font-mono">CV</span>
          </div>
          <span className="font-bold text-lg font-mono text-white">
            Code<span className="text-vs-blue">Vision</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ label, path }) => {
            const active = pathname === path
            return (
              <Link key={path} to={path}>
                <motion.span
                  className={`inline-block px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150
                    ${active
                      ? 'bg-vs-blue text-white'
                      : 'text-vs-text hover:text-white hover:bg-vs-border'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {label}
                </motion.span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
