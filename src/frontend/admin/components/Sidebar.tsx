import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Layers, LogOut, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../../backend/contexts/AuthContext'
import logoWhite from '../../../assets/images/CTRLBuild-White.png'
import logoBlack from '../../../assets/images/CTRLBuild-Black.png'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  theme?: 'dark' | 'light'
}

const navItems = [
  { to: '/admin/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/portfolios', label: 'Portfolio',  icon: FolderOpen },
  { to: '/admin/stacks',     label: 'Stacks',     icon: Layers },
]

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <a href="/admin/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-mark">CB</div>
        <span className="sidebar-logo-text">CTRLBUILD</span>
      </a>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={16} />
            <span className="sidebar-nav-label">{label}</span>
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        {/* Visit Site */}
        <a
          href="https://www.ctrl-build.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-nav-item"
          title={collapsed ? 'Visit Site' : undefined}
        >
          <ExternalLink size={16} />
          <span className="sidebar-nav-label">Visit Site</span>
        </a>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="sidebar-nav-item"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} />
          <span className="sidebar-nav-label">Logout</span>
        </button>

        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}
