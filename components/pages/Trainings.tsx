'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '@/lib/api-client'
import { useAuthStore } from '@/store/authStore'

interface Training {
  id: string
  trainingType: string
  paymentSource: string
  certificationRequired: boolean
  startDate?: string
  endDate?: string
  vendor: { id: string; name: string }
  project: { id: string; projectName: string; client?: { companyName: string } }
}

const schema = z.object({
  projectId: z.string().min(1, 'Project required'),
  vendorId: z.string().min(1, 'Vendor required'),
  trainingType: z.enum(['COMPUTER_SKILLS', 'BUSINESS_SKILLS', 'LOGIC_SKILLS']),
  paymentSource: z.enum(['ABC_CORP', 'CLIENT', 'TRAINEE']),
  certificationRequired: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const TRAINING_LABELS: Record<string, string> = {
  COMPUTER_SKILLS: '💻 Computer Skills',
  BUSINESS_SKILLS: '📊 Business Skills',
  LOGIC_SKILLS: '🧠 Logic Skills',
}
const PAYMENT_LABELS: Record<string, string> = {
  ABC_CORP: '🏦 ABC Corp',
  CLIENT: '🏢 Client',
  TRAINEE: '👤 Trainee',
}

export default function TrainingsPage() {
  const { user } = useAuthStore()
  const isManager = user?.role === 'ACCOUNT_MANAGER'
  const [trainings, setTrainings] = useState<Training[]>([])
  const [projects, setProjects] = useState<{ id: string; projectName: string }[]>([])
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { certificationRequired: false },
  })

  const fetchData = async () => {
    try {
      const [trainingsRes, projectsRes, vendorsRes] = await Promise.all([
        api.get('/api/trainings'),
        api.get('/api/projects'),
        api.get('/api/vendors'),
      ])
      setTrainings(trainingsRes.data)
      setProjects(projectsRes.data)
      setVendors(vendorsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/trainings', data)
      reset()
      setShowModal(false)
      fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to create training')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}><span className="gradient-text">Trainings</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Assign and manage training programs</p>
        </div>
        {isManager && <button className="btn-primary" onClick={() => setShowModal(true)}>+ Assign Training</button>}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto' }} className="animate-spin" />
          </div>
        ) : trainings.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <p>No trainings assigned yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Training Type</th>
                <th>Project</th>
                <th>Vendor</th>
                <th>Payment</th>
                <th>Certification</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {trainings.map(training => (
                <tr key={training.id}>
                  <td>
                    <span className="badge badge-purple">{TRAINING_LABELS[training.trainingType]}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{training.project.projectName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{training.project.client?.companyName}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{training.vendor.name}</td>
                  <td>
                    <span className="badge badge-cyan">{PAYMENT_LABELS[training.paymentSource]}</span>
                  </td>
                  <td>
                    <span className={`badge ${training.certificationRequired ? 'badge-amber' : 'badge-gray'}`}>
                      {training.certificationRequired ? '🏆 Required' : 'Not Required'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {training.startDate ? new Date(training.startDate).toLocaleDateString() : '—'}
                    {training.startDate && training.endDate ? ' → ' : ''}
                    {training.endDate ? new Date(training.endDate).toLocaleDateString() : ''}
                  </td>
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
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Assign Training</h2>
              <button onClick={() => { setShowModal(false); reset() }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Project *</label>
                <select {...register('projectId')} className="form-select">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
                {errors.projectId && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.projectId.message}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Vendor *</label>
                <select {...register('vendorId')} className="form-select">
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                {errors.vendorId && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.vendorId.message}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Training Type *</label>
                <select {...register('trainingType')} className="form-select">
                  <option value="COMPUTER_SKILLS">💻 Computer Skills</option>
                  <option value="BUSINESS_SKILLS">📊 Business Skills</option>
                  <option value="LOGIC_SKILLS">🧠 Logic Skills</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Payment Source *</label>
                <select {...register('paymentSource')} className="form-select">
                  <option value="ABC_CORP">🏦 ABC Corp</option>
                  <option value="CLIENT">🏢 Client</option>
                  <option value="TRAINEE">👤 Trainee</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="form-label">Start Date</label>
                  <input {...register('startDate')} className="form-input" type="date" />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input {...register('endDate')} className="form-input" type="date" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <input {...register('certificationRequired')} type="checkbox" />
                Certification Required
              </label>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); reset() }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Assigning...' : 'Assign Training'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
