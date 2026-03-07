'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api-client'
import { useAuthStore } from '@/store/authStore'

interface ClientDetail {
  id: string
  companyName: string
  contacts: { id: string; contactName: string; email: string; role: string }[]
  projects: {
    id: string
    projectName: string
    projectType: string
    trainingRequired: boolean
    trainings: { trainingType: string }[]
    _count?: { trainees: number }
  }[]
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/clients/${id}`)
      .then(r => setClient(r.data))
      .catch(() => router.push('/clients'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: 40, display: 'flex', justifyContent: 'center', minHeight: 400, alignItems: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} className="animate-spin" />
    </div>
  )

  if (!client) return null

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => router.push('/clients')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 8, padding: 0 }}>
          ← Back to Clients
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          <span className="gradient-text">{client.companyName}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
          {client.projects.length} project(s) · {client.contacts.length} contact(s)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Contacts */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>👤 Contacts</h2>
          {client.contacts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No contacts.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {client.contacts.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'white', fontSize: 14, flexShrink: 0,
                  }}>
                    {c.contactName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.contactName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email} · <span style={{ color: 'var(--accent-purple)' }}>{c.role}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📁 Projects</h2>
          {client.projects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No projects yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {client.projects.map(p => (
                <a key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', transition: 'all 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-blue)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.projectName}</div>
                      <span className={`badge ${p.projectType === 'ON_SITE' ? 'badge-blue' : 'badge-cyan'}`} style={{ fontSize: 10 }}>
                        {p.projectType === 'ON_SITE' ? 'On-site' : 'Off-site'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.trainings?.length || 0} training(s)
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
