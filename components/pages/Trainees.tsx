'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '@/lib/api-client'
import { useAuthStore } from '@/store/authStore'

interface Trainee {
  id: string
  name: string
  email: string
  phone?: string
  skills: string[]
  trainingStatus: string
  certificationStatus: boolean
  project?: { id: string; projectName: string; client?: { companyName: string } }
  interviews: { id: string; status: string; scheduledAt: string }[]
}

const schema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  skills: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-blue',
  TRAINING: 'badge-purple',
  CERTIFIED: 'badge-green',
  INTERVIEWING: 'badge-amber',
  HIRED: 'badge-green',
}

export default function TraineesPage() {
  const { user } = useAuthStore()
  const isManager = user?.role === 'ACCOUNT_MANAGER'
  const [trainees, setTrainees] = useState<Trainee[]>([])
  const [projects, setProjects] = useState<{ id: string; projectName: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fetchData = async () => {
    try {
      const [traineesRes, projectsRes] = await Promise.all([
        api.get('/api/trainees'),
        api.get('/api/projects'),
      ])
      setTrainees(traineesRes.data)
      setProjects(projectsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/trainees', {
        ...data,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      reset()
      setShowModal(false)
      fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to add trainee')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, trainingStatus: string) => {
    try {
      await api.put(`/api/trainees/${id}`, { trainingStatus })
      setTrainees(prev => prev.map(t => t.id === id ? { ...t, trainingStatus } : t))
    } catch {
      alert('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trainee?')) return
    try {
      await api.delete(`/api/trainees/${id}`)
      setTrainees(prev => prev.filter(t => t.id !== id))
    } catch {
      alert('Failed to delete trainee')
    }
  }

  const filtered = trainees.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || t.trainingStatus === filterStatus
    return matchSearch && matchStatus
  })

  const statuses = ['ALL', 'ACTIVE', 'TRAINING', 'CERTIFIED', 'INTERVIEWING', 'HIRED']

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}><span className="gradient-text">Trainees</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Track trainee progress and status</p>
        </div>
        {isManager && <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Trainee</button>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="🔍 Search trainees..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: filterStatus === s ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: filterStatus === s ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)',
              color: filterStatus === s ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto' }} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <p>No trainees found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Trainee</th>
                <th>Project</th>
                <th>Skills</th>
                <th>Training Status</th>
                <th>Certified</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(trainee => (
                <tr key={trainee.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'white', fontSize: 14, flexShrink: 0,
                      }}>
                        {trainee.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{trainee.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trainee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {trainee.project?.projectName || '—'}
                    {trainee.project?.client && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trainee.project.client.companyName}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {trainee.skills.slice(0, 2).map(skill => (
                        <span key={skill} className="badge badge-gray" style={{ fontSize: 11 }}>{skill}</span>
                      ))}
                      {trainee.skills.length > 2 && <span className="badge badge-gray" style={{ fontSize: 11 }}>+{trainee.skills.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    {isManager ? (
                      <select
                        value={trainee.trainingStatus}
                        onChange={e => updateStatus(trainee.id, e.target.value)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}
                      >
                        {['ACTIVE', 'TRAINING', 'CERTIFIED', 'INTERVIEWING', 'HIRED'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge ${STATUS_BADGE[trainee.trainingStatus] || 'badge-gray'}`} style={{ fontSize: 11 }}>
                        {trainee.trainingStatus}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${trainee.certificationStatus ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                      {trainee.certificationStatus ? '✅ Certified' : '⏳ Pending'}
                    </span>
                  </td>
                  {isManager && (
                    <td>
                      <button className="btn-danger" onClick={() => handleDelete(trainee.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); reset() } }}>
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add Trainee</h2>
              <button onClick={() => { setShowModal(false); reset() }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Project *</label>
                <select {...register('projectId')} className="form-select">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
                {errors.projectId && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>Required</p>}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Full Name *</label>
                <input {...register('name')} className="form-input" placeholder="Alice Johnson" />
                {errors.name && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.name.message}</p>}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Email *</label>
                <input {...register('email')} className="form-input" type="email" placeholder="alice@example.com" />
                {errors.email && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Phone</label>
                <input {...register('phone')} className="form-input" placeholder="+91 98765 43210" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Skills (comma separated)</label>
                <input {...register('skills')} className="form-input" placeholder="JavaScript, Python, SQL" />
              </div>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); reset() }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Trainee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
