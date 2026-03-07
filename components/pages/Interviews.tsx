'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '@/lib/api-client'
import { useAuthStore } from '@/store/authStore'

interface Interview {
  id: string
  status: 'INTERVIEW' | 'SHORTLISTED' | 'OFFER_LETTER' | 'HIRED' | 'REJECTED'
  scheduledAt: string
  notes?: string
  trainee: {
    id: string
    name: string
    email: string
    project?: { projectName: string; client?: { companyName: string } }
  }
}

const schema = z.object({
  traineeId: z.string().min(1, 'Trainee required'),
  scheduledAt: z.string().min(1, 'Date required'),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const PIPELINE_STAGES: Array<{ key: Interview['status']; label: string; icon: string; color: string; bg: string; border: string }> = [
  { key: 'INTERVIEW', label: 'Interview', icon: '💼', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
  { key: 'SHORTLISTED', label: 'Shortlisted', icon: '⭐', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
  { key: 'OFFER_LETTER', label: 'Offer Letter', icon: '📄', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  { key: 'HIRED', label: 'Hired', icon: '🎉', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  { key: 'REJECTED', label: 'Rejected', icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
]

export default function InterviewsPage() {
  const { user } = useAuthStore()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [trainees, setTrainees] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const fetchData = async () => {
    try {
      const [interviewsRes, traineesRes] = await Promise.all([
        api.get('/api/interviews'),
        api.get('/api/trainees'),
      ])
      setInterviews(interviewsRes.data)
      setTrainees(traineesRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/interviews', data)
      reset()
      setShowModal(false)
      fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to schedule interview')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: Interview['status']) => {
    try {
      await api.put(`/api/interviews/${id}`, { status })
      setInterviews(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    } catch {
      alert('Failed to update status')
    }
  }

  if (loading) return (
    <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} className="animate-spin" />
    </div>
  )

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}><span className="gradient-text">Hiring Pipeline</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Track interviews and hiring decisions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Schedule Interview</button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        {PIPELINE_STAGES.map(stage => {
          const count = interviews.filter(i => i.status === stage.key).length
          return (
            <div key={stage.key} style={{
              flex: 1, minWidth: 130, padding: '16px 18px',
              background: stage.bg, border: `1px solid ${stage.border}`,
              borderRadius: 14, textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stage.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stage.color }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{stage.label}</div>
            </div>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {PIPELINE_STAGES.map(stage => {
          const stageInterviews = interviews.filter(i => i.status === stage.key)
          return (
            <div key={stage.key} className="kanban-col" style={{ minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span>{stage.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{
                  marginLeft: 'auto', background: stage.bg, border: `1px solid ${stage.border}`,
                  color: stage.color, borderRadius: '50%', width: 22, height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                }}>
                  {stageInterviews.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stageInterviews.length === 0 ? (
                  <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No candidates
                  </div>
                ) : stageInterviews.map(interview => (
                  <div key={interview.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '14px',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {interview.trainee.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {interview.trainee.email}
                    </div>
                    {interview.trainee.project && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                        📁 {interview.trainee.project.projectName}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      📅 {new Date(interview.scheduledAt).toLocaleDateString()}
                    </div>
                    {interview.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 8px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 10, lineHeight: 1.5 }}>
                        {interview.notes}
                      </div>
                    )}

                    {/* Move to next stage */}
                    {stage.key !== 'HIRED' && stage.key !== 'REJECTED' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => {
                            const stages: Interview['status'][] = ['INTERVIEW', 'SHORTLISTED', 'OFFER_LETTER', 'HIRED']
                            const idx = stages.indexOf(stage.key as Interview['status'])
                            if (idx < stages.length - 1) updateStatus(interview.id, stages[idx + 1])
                          }}
                          style={{
                            flex: 1, padding: '5px 6px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            background: stage.bg, border: `1px solid ${stage.border}`, color: stage.color,
                            cursor: 'pointer',
                          }}
                        >
                          → Move Up
                        </button>
                        <button
                          onClick={() => updateStatus(interview.id, 'REJECTED')}
                          style={{
                            padding: '5px 8px', borderRadius: 7, fontSize: 11,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); reset() } }}>
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Schedule Interview</h2>
              <button onClick={() => { setShowModal(false); reset() }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Trainee *</label>
                <select {...register('traineeId')} className="form-select">
                  <option value="">Select trainee...</option>
                  {trainees.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.traineeId && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.traineeId.message}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Interview Date & Time *</label>
                <input {...register('scheduledAt')} className="form-input" type="datetime-local" />
                {errors.scheduledAt && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.scheduledAt.message}</p>}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Notes</label>
                <textarea {...register('notes')} className="form-input" rows={3} placeholder="Interview notes, instructions..." style={{ resize: 'vertical' }} />
              </div>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); reset() }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Scheduling...' : 'Schedule Interview'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
