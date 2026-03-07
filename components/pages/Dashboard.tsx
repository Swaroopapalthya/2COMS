'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api-client'

interface Stats {
  clients: number
  projects: number
  vendors: number
  trainees: number
  trainings: number
  interviews: number
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats>({ clients: 0, projects: 0, vendors: 0, trainees: 0, trainings: 0, interviews: 0 })
  const [loading, setLoading] = useState(true)
  const [recentProjects, setRecentProjects] = useState<unknown[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, traineesRes] = await Promise.allSettled([
          api.get('/api/projects'),
          api.get('/api/trainees'),
        ])

        const projects = projectsRes.status === 'fulfilled' ? projectsRes.value.data : []
        const trainees = traineesRes.status === 'fulfilled' ? traineesRes.value.data : []

        let clients = 0
        let vendors = 0
        let trainings = 0

        if (user?.role === 'ACCOUNT_MANAGER') {
          const [clientsRes, vendorsRes, trainingsRes] = await Promise.allSettled([
            api.get('/api/clients'),
            api.get('/api/vendors'),
            api.get('/api/trainings'),
          ])
          clients = clientsRes.status === 'fulfilled' ? clientsRes.value.data.length : 0
          vendors = vendorsRes.status === 'fulfilled' ? vendorsRes.value.data.length : 0
          trainings = trainingsRes.status === 'fulfilled' ? trainingsRes.value.data.length : 0
        }

        setStats({
          clients,
          projects: projects.length,
          vendors,
          trainees: trainees.length,
          trainings,
          interviews: 0,
        })
        setRecentProjects(projects.slice(0, 5))
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const statCards = user?.role === 'ACCOUNT_MANAGER'
    ? [
        { label: 'Total Clients', value: stats.clients, icon: '🏢', color: 'var(--accent-blue)', bg: 'rgba(99,102,241,0.1)' },
        { label: 'Total Projects', value: stats.projects, icon: '📁', color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.1)' },
        { label: 'Vendors', value: stats.vendors, icon: '🤝', color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.1)' },
        { label: 'Trainees', value: stats.trainees, icon: '👥', color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)' },
        { label: 'Trainings', value: stats.trainings, icon: '🎓', color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)' },
      ]
    : [
        { label: 'Projects', value: stats.projects, icon: '📁', color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.1)' },
        { label: 'Trainees', value: stats.trainees, icon: '👥', color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)' },
      ]

  const getProjectTypeBadge = (type: string) => (
    <span className={`badge ${type === 'ON_SITE' ? 'badge-blue' : 'badge-cyan'}`}>
      {type === 'ON_SITE' ? '🏙️ On-site' : '🌐 Off-site'}
    </span>
  )

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Welcome back,&nbsp;
          <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>
          {user?.role === 'ACCOUNT_MANAGER'
            ? "Here's an overview of your workforce management platform."
            : `Here's the status of your projects and trainees.`
          }
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statCards.length}, 1fr)`, gap: 20, marginBottom: 40 }}>
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {card.icon}
              </div>
              <span className="badge badge-green" style={{ fontSize: 11 }}>↑ Active</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: card.color, lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Projects</h2>
          <a href="/projects" style={{ color: 'var(--accent-blue-light)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
            View all →
          </a>
        </div>

        {recentProjects.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            No projects yet. Create your first project!
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client</th>
                <th>Type</th>
                <th>Training</th>
                <th>Trainees</th>
              </tr>
            </thead>
            <tbody>
              {(recentProjects as Array<{
                id: string
                projectName: string
                client?: { companyName: string }
                projectType: string
                trainingRequired: boolean
                _count?: { trainees: number }
              }>).map(project => (
                <tr key={project.id}>
                  <td>
                    <a href={`/projects/${project.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                      {project.projectName}
                    </a>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{project.client?.companyName || '—'}</td>
                  <td>{getProjectTypeBadge(project.projectType)}</td>
                  <td>
                    <span className={`badge ${project.trainingRequired ? 'badge-green' : 'badge-gray'}`}>
                      {project.trainingRequired ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{project._count?.trainees || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Workflow Tip */}
      {user?.role === 'ACCOUNT_MANAGER' && (
        <div style={{
          marginTop: 24, padding: '20px 24px',
          background: 'var(--gradient-card)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 32 }}>🔧</div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Build Workflows for Projects</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Use the drag-and-drop Workflow Builder to define the lifecycle of your projects.
              Go to any project and click <strong style={{ color: 'var(--accent-blue-light)' }}>Workflow Builder</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
