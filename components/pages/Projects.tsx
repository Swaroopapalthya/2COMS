'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api-client'

const schema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectName: z.string().min(2, 'Project name is required'),
  projectType: z.enum(['ON_SITE', 'OFF_SITE']),
  trainingRequired: z.boolean(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Project {
  id: string
  projectName: string
  projectType: string
  trainingRequired: boolean
  description?: string
  client?: { id: string; companyName: string }
  trainings?: unknown[]
  _count?: { trainees: number }
  createdAt: string
}

interface Client {
  id: string
  companyName: string
}

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  const isManager = user?.role === 'ACCOUNT_MANAGER'

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { projectType: 'ON_SITE', trainingRequired: false },
  })

  const selectedType = watch('projectType')

  const fetchData = async () => {
    try {
      const [projectsRes] = await Promise.all([
        api.get('/api/projects'),
        isManager ? api.get('/api/clients').then(r => setClients(r.data)) : Promise.resolve(),
      ])
      setProjects(projectsRes.data)
    } catch {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError('')
    try {
      if (data.projectType === 'ON_SITE') data.trainingRequired = true
      await api.post('/api/projects', data)
      reset()
      setShowModal(false)
      fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    try {
      await api.delete(`/api/projects/${id}`)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Failed to delete project')
    }
  }

  const filtered = projects.filter(p => {
    const matchSearch = p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.companyName.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'ALL' || p.projectType === filterType
    return matchSearch && matchType
  })

  const getTypeBadge = (type: string) => (
    <span className={`badge ${type === 'ON_SITE' ? 'badge-blue' : 'badge-cyan'}`}>
      {type === 'ON_SITE' ? '🏙️ On-site' : '🌐 Off-site'}
    </span>
  )

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}><span className="gradient-text">Projects</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Manage your project lifecycle</p>
        </div>
        {isManager && <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          className="form-input"
          placeholder="🔍 Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        {['ALL', 'ON_SITE', 'OFF_SITE'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: filterType === t ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: filterType === t ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)',
            color: filterType === t ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            {t === 'ALL' ? 'All Types' : t === 'ON_SITE' ? '🏙️ On-site' : '🌐 Off-site'}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto' }} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          <p style={{ fontSize: 16 }}>No projects found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map(project => (
            <div key={project.id} className="glass-card glass-card-hover" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: project.projectType === 'ON_SITE'
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))'
                    : 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(14,165,233,0.2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {project.projectType === 'ON_SITE' ? '🏙️' : '🌐'}
                </div>
                {getTypeBadge(project.projectType)}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                <a href={`/projects/${project.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                  {project.projectName}
                </a>
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                {project.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {project.client && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>🏢</span>{project.client.companyName}
                  </div>
                )}
                <span className={`badge ${project.trainingRequired ? 'badge-amber' : 'badge-gray'}`}>
                  {project.trainingRequired ? '🎓 Training required' : '📋 No training'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {project._count?.trainees || 0} trainee(s)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`/projects/${project.id}/workflow`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, color: 'var(--accent-purple)', textDecoration: 'none',
                    padding: '5px 10px', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 7,
                  }}>
                    🔧 Workflow
                  </a>
                  <a href={`/projects/${project.id}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, color: 'var(--accent-blue-light)', textDecoration: 'none',
                    padding: '5px 10px', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 7,
                  }}>
                    View →
                  </a>
                  {isManager && (
                    <button className="btn-danger" onClick={() => handleDelete(project.id)} style={{ fontSize: 12, padding: '5px 10px' }}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); reset() } }}>
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create New Project</h2>
              <button onClick={() => { setShowModal(false); reset() }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Client *</label>
                <select {...register('clientId')} className="form-select">
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
                {errors.clientId && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.clientId.message}</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Project Name *</label>
                <input {...register('projectName')} className="form-input" placeholder="e.g. Digital Transformation 2025" />
                {errors.projectName && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.projectName.message}</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Project Type *</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['ON_SITE', 'OFF_SITE'].map(type => (
                    <label key={type} style={{
                      flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      background: selectedType === type ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)',
                      border: `1px solid ${selectedType === type ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                      color: selectedType === type ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                      textAlign: 'center', fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                    }}>
                      <input {...register('projectType')} type="radio" value={type} style={{ display: 'none' }} />
                      {type === 'ON_SITE' ? '🏙️ On-site' : '🌐 Off-site'}
                    </label>
                  ))}
                </div>
                {selectedType === 'ON_SITE' && (
                  <p style={{ fontSize: 12, color: 'var(--accent-amber)', marginTop: 6 }}>
                    ⚠️ On-site projects require at least 2 trainings.
                  </p>
                )}
              </div>

              {selectedType === 'OFF_SITE' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <input {...register('trainingRequired')} type="checkbox" />
                    Training Required
                  </label>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Description</label>
                <textarea {...register('description')} className="form-input" rows={3} placeholder="Brief project description..." style={{ resize: 'vertical' }} />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); reset() }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
