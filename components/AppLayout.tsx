'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

const managerNav = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/clients', icon: '🏢', label: 'Clients' },
  { href: '/projects', icon: '📁', label: 'Projects' },
  { href: '/vendors', icon: '🤝', label: 'Vendors' },
  { href: '/trainings', icon: '🎓', label: 'Trainings' },
  { href: '/trainees', icon: '👥', label: 'Trainees' },
  { href: '/interviews', icon: '💼', label: 'Pipeline' },
]

const clientNav = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/projects', icon: '📁', label: 'Projects' },
  { href: '/trainees', icon: '👥', label: 'Trainees' },
  { href: '/interviews', icon: '💼', label: 'Pipeline' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} className="animate-spin" />
      </div>
    )
  }

  const nav = user?.role === 'ACCOUNT_MANAGER' ? managerNav : clientNav

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>2COMS</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Workforce Platform</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'var(--bg-card)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: user?.role === 'ACCOUNT_MANAGER'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: user?.role === 'ACCOUNT_MANAGER' ? 'var(--accent-blue-light)' : 'var(--accent-cyan)', marginTop: 1 }}>
                {user?.role === 'ACCOUNT_MANAGER' ? 'Account Manager' : 'Client'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          {nav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                  }
                }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }} />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'
            ;(e.currentTarget as HTMLElement).style.color = '#f87171'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          }}
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 260, flex: 1, minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  )
}
