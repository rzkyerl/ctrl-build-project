import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar }  from './Topbar'
import '../style/admin.css'

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('ad-sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('ad-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  // Apply initial theme
  useEffect(() => {
    const theme = localStorage.getItem('ad-theme') || 'dark'
    const root  = document.getElementById('admin-root')
    if (root) root.dataset.theme = theme
  }, [])

  return (
    <div id="admin-root" className="admin-root" data-theme="dark">
      <div className="admin-shell">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
        <div className={`admin-main${collapsed ? ' collapsed' : ''}`}>
          <Topbar />
          <main className="admin-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
