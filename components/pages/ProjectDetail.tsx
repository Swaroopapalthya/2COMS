'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api-client'
import { useAuthStore } from '@/store/authStore'

interface Training { id: string; trainingType: string; paymentSource: string; certificationRequired: boolean; vendor: { name: string } }
interface Trainee { id: string; name: string; email: string; trainingStatus: string; certificationStatus: boolean }
interface Project {
  id: string
  projectName: string
  projectType: string
  trainingRequired: boolean
  description?: string
  client?: { companyName: string; contacts: { contactName: string; email: string; role: string }[] }
  trainings: Training[]
  trainees: Trainee[]
}

const trainingTypeLabelMap: Record<string, string> = {
  COMPUTER_SKILLS: '💻 Computer Skills',
  BUSINESS_SKILLS: '📊 Business Skills',
  LOGIC_SKILLS: '🧠 Logic Skills',
}
const paymentSourceMap: Record<string, string> = {
  ABC_CORP: '🏦 ABC Corp',
  CLIENT: '🏢 Client',
  TRAINEE: '👤 Trainee',
}
const statusColorMap: Record<string, string> = {
  ACTIVE: 'badge-blue',
  TRAINING: 'badge-purple',
  CERTIFIED: 'badge-green',
  INTERVIEWING: 'badge-amber',
  HIRED: 'badge-green',
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const isManager = user?.role === 'ACCOUNT_MANAGER'

  useEffect(() => {
    api.get(`/api/projects/${id}`)
      .then(r => setProject(r.data))
      .catch(() => router.push('/projects'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} className="animate-spin" />
    </div>
  )

  if (!project) return null

  const onSiteWarning = project.projectType === 'ON_SITE' && project.trainings.length < 2

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <button onClick={() => router.push('/projects')} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 13, marginBottom: 8, padding: 0,
          }}>
            ← Back to Projects
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>
            <span className="gradient-text">{project.projectName}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            {project.client?.companyName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`badge ${project.projectType === 'ON_SITE' ? 'badge-blue' : 'badge-cyan'}`} style={{ fontSize: 13, padding: '8px 14px' }}>
            {project.projectType === 'ON_SITE' ? '🏙️ On-site' : '🌐 Off-site'}
          </span>
          {isManager && (
            <a href={`/projects/${id}/workflow`} className="btn-primary" style={{ textDecoration: 'none' }}>
              🔧 Workflow Builder
            </a>
          )}
        </div>
      </div>

      {/* Warning */}
      {onSiteWarning && (
        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
          color: '#fbbf24', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          ⚠️ <strong>Business Rule:</strong> On-site projects require at least 2 trainings. Currently has {project.trainings.length}.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Project Info */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📋 Project Details</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              { label: 'Type', value: project.projectType === 'ON_SITE' ? '🏙️ On-site' : '🌐 Off-site' },
              { label: 'Training Required', value: project.trainingRequired ? '✅ Yes' : '❌ No' },
              { label: 'Description', value: project.description || 'None' },
              { label: 'Client', value: project.client?.companyName || 'N/A' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Client Contacts */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>👤 Client Contacts</h2>
          {(project.client?.contacts || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No contacts added.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {project.client?.contacts.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'white', fontSize: 13, flexShrink: 0,
                  }}>
                    {c.contactName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.contactName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email} · {c.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trainings */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>🎓 Trainings ({project.trainings.length})</h2>
            {isManager && (
              <a href="/trainings" style={{ fontSize: 13, color: 'var(--accent-blue-light)', textDecoration: 'none' }}>
                + Add Training
              </a>
            )}
          </div>
          {project.trainings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No trainings assigned.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {project.trainings.map(t => (
                <div key={t.id} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{trainingTypeLabelMap[t.trainingType] || t.trainingType}</span>
                    {t.certificationRequired && <span className="badge badge-amber" style={{ fontSize: 11 }}>🏆 Cert required</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Vendor: {t.vendor.name} · {paymentSourceMap[t.paymentSource]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trainees */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>👥 Trainees ({project.trainees.length})</h2>
            {isManager && (
              <a href="/trainees" style={{ fontSize: 13, color: 'var(--accent-blue-light)', textDecoration: 'none' }}>
                + Add Trainee
              </a>
            )}
          </div>
          {project.trainees.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No trainees assigned.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {project.trainees.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'white', fontSize: 12, flexShrink: 0,
                    }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.email}</div>
                    </div>
                  </div>
                  <span className={`badge ${statusColorMap[t.trainingStatus] || 'badge-gray'}`} style={{ fontSize: 11 }}>
                    {t.trainingStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
