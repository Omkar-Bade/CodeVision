/**
 * Footer.jsx
 *
 * Professional footer for CodeVision — project info, team, contact, tech stack.
 * Matches the site's developer-platform theme (LeetCode / HackerRank style).
 * Responsive: horizontal on desktop, stacked on mobile.
 */

const TEAM = [
  {
    name: 'Shahid',
    role: 'Market Analyst & Requirement Analyst',
    linkedin: 'https://www.linkedin.com/in/shahid-bagwan-54851332a/?originalSubdomain=in',
    github: 'https://github.com/shahidbagwan085-ui',
  },
  {
    name: 'Diksha',
    role: 'Database Integration',
    linkedin: 'https://www.linkedin.com/in/diksha-ghatte-0695bb327?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    github: 'https://github.com/ghattediksha-ship-it',
  },
  {
    name: 'Omkar',
    role: 'Frontend & Backend Developer',
    linkedin: 'https://www.linkedin.com/in/omkar-bade-85951132a',
    github: 'https://github.com/Omkar-Bade',
  },
]

const TECH_STACK = [
  { label: 'Frontend', items: ['React', 'Tailwind CSS', 'Monaco Editor'] },
  { label: 'Backend', items: ['Node.js', 'Python Execution Service'] },
  { label: 'Database', items: ['Supabase'] },
]

function FooterLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 hover:text-blue-400 transition-colors duration-150 text-sm"
    >
      {children}
    </a>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-[#1F2937] bg-[#111827]">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* 1. Project Information */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs font-mono">CV</span>
              </div>
              <span className="font-bold text-base font-mono text-white">
                Code<span className="text-blue-400">Vision</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Programming Concept Visualizer
            </p>
            <p className="text-gray-500 text-xs leading-relaxed mb-6">
              CodeVision is an educational platform that helps students understand how Python
              programs execute internally through step-by-step visualization, memory tracking,
              and interactive code analysis.
            </p>
            <p className="text-gray-600 text-xs">
              © 2026 CodeVision – All rights reserved
            </p>
          </div>

          {/* 2. Team Members */}
          <div>
            <h3 className="text-gray-300 font-semibold text-sm mb-4 uppercase tracking-wider">
              Team
            </h3>
            <div className="space-y-4">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="bg-[#0B1120]/50 border border-[#1F2937] rounded-lg p-3"
                >
                  <p className="text-white font-medium text-sm">{member.name}</p>
                  <p className="text-gray-500 text-xs mb-2">{member.role}</p>
                  <div className="flex gap-3">
                    <FooterLink href={member.linkedin}>LinkedIn</FooterLink>
                    <FooterLink href={member.github}>GitHub</FooterLink>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Contact */}
          <div>
            <h3 className="text-gray-300 font-semibold text-sm mb-4 uppercase tracking-wider">
              Contact Us
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Email</p>
                <a
                  href="mailto:contact@codevision.dev"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-150"
                >
                  contact@codevision.dev
                </a>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Phone</p>
                <span className="text-gray-400">+91 98765 43210</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Location</p>
                <span className="text-gray-400">India</span>
              </div>
            </div>
          </div>

          {/* 4. Tech Stack */}
          <div>
            <h3 className="text-gray-300 font-semibold text-sm mb-4 uppercase tracking-wider">
              Technology Stack
            </h3>
            <div className="space-y-4">
              {TECH_STACK.map(({ label, items }) => (
                <div key={label}>
                  <p className="text-gray-500 text-xs mb-2">{label}</p>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item} className="text-gray-400 text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
