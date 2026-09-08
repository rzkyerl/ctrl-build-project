import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, ChevronDown, LogOut, User } from 'lucide-react'
import { useAuth } from '../../../backend/contexts/AuthContext'

export const Topbar: React.FC = () => {
  const { user, logout }          = useAuth()
  const navigate                  = useNavigate()
  const [theme, setTheme]         = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ad-theme') as 'dark' | 'light') || 'dark'
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Apply theme to admin root
  useEffect(() => {
    const root = document.getElementById('admin-root')
    if (root) root.dataset.theme = theme
    localStorage.setItem('ad-theme', theme)
  }, [theme])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/admin/login', { replace: true })
  }

  // Get initials from email
  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase()
  }

  const displayName = user?.displayName || user?.email || 'Admin'
  const initials    = user?.email ? getInitials(user.email) : 'AD'

  return (
    <header className="admin-topbar">
      {/* Theme toggle */}
      <button
        className="topbar-theme-toggle"
        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Profile dropdown */}
      <div className="topbar-profile" ref={dropdownRef}>
        <button
          className="topbar-profile-btn"
          onClick={() => setDropdownOpen(o => !o)}
        >
          <div className="topbar-avatar">{initials}</div>
          <span className="topbar-profile-name">{displayName}</span>
          <ChevronDown size={13} />
        </button>

        {dropdownOpen && (
          <div className="topbar-dropdown">
            <div className="topbar-dropdown-info">
              <div className="topbar-profile-name" style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                {user?.displayName || 'Admin'}
              </div>
              <div className="topbar-dropdown-email">{user?.email}</div>
            </div>

            <button className="topbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
              <User size={13} />
              Profile
            </button>

            <button className="topbar-dropdown-item danger" onClick={handleLogout}>
              <LogOut size={13} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
