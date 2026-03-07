'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '@/lib/api-client'
import { useAuthStore } from '@/store/authStore'

interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  trainingTypes: string[]
  _count?: { trainings: number }
}

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  trainingTypes: z.array(z.enum(['COMPUTER_SKILLS', 'BUSINESS_SKILLS', 'LOGIC_SKILLS'])).min(1, 'Select at least one'),
})
type FormData = z.infer<typeof schema>

const TRAINING_TYPES = [
  { value: 'COMPUTER_SKILLS', label: '💻 Computer Skills' },
  { value: 'BUSINESS_SKILLS', label: '📊 Business Skills' },
  { value: 'LOGIC_SKILLS', label: '🧠 Logic Skills' },
]

export default function VendorsPage() {
  const { user } = useAuthStore()
  const isManager = user?.role === 'ACCOUNT_MANAGER'
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { trainingTypes: [] },
  })

  const fetchVendors = async () => {
    try {
      const res = await api.get('/api/vendors')
      setVendors(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVendors() }, [])

  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  const onSubmit = async (data: FormData) => {
    if (selectedTypes.length === 0) { setError('Select at least one training type'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/api/vendors', { ...data, trainingTypes: selectedTypes })
      reset()
      setSelectedTypes([])
      setShowModal(false)
      fetchVendors()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to create vendor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor?')) return
    try {
      await api.delete(`/api/vendors/${id}`)
      setVendors(prev => prev.filter(v => v.id !== id))
    } catch {
      alert('Failed to delete vendor')
    }
  }

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}><span className="gradient-text">Vendors</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Training service providers</p>
        </div>
        {isManager && <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Vendor</button>}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto' }} className="animate-spin" />
        </div>
      ) : vendors.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
          <p style={{ fontSize: 16 }}>No vendors yet.</p>
          {isManager && <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>+ Add First Vendor</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {vendors.map(vendor => (
            <div key={vendor.id} className="glass-card glass-card-hover" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'white', fontSize: 18,
                }}>
                  {vendor.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{vendor.name}</div>
                  {vendor.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vendor.email}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {vendor.trainingTypes.map(type => (
                  <span key={type} className="badge badge-purple" style={{ fontSize: 11 }}>
                    {TRAINING_TYPES.find(t => t.value === type)?.label || type}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {vendor._count?.trainings || 0} training(s)
                </span>
                {isManager && (
                  <button className="btn-danger" onClick={() => handleDelete(vendor.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); reset(); setSelectedTypes([]) } }}>
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add New Vendor</h2>
              <button onClick={() => { setShowModal(false); reset(); setSelectedTypes([]) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Vendor Name *</label>
                <input {...register('name')} className="form-input" placeholder="TechSkills Academy" />
                {errors.name && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.name.message}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Email</label>
                <input {...register('email')} className="form-input" type="email" placeholder="vendor@example.com" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Phone</label>
                <input {...register('phone')} className="form-input" placeholder="+91 98765 43210" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Training Types *</label>
                <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                  {TRAINING_TYPES.map(type => (
                    <label key={type.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      background: selectedTypes.includes(type.value) ? 'rgba(139,92,246,0.1)' : 'var(--bg-secondary)',
                      border: `1px solid ${selectedTypes.includes(type.value) ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                      transition: 'all 0.15s',
                    }}>
                      <input type="checkbox" checked={selectedTypes.includes(type.value)} onChange={() => toggleType(type.value)} style={{ display: 'none' }} />
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, border: `2px solid ${selectedTypes.includes(type.value) ? '#8b5cf6' : 'var(--border)'}`,
                        background: selectedTypes.includes(type.value) ? '#8b5cf6' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {selectedTypes.includes(type.value) && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, color: selectedTypes.includes(type.value) ? '#a78bfa' : 'var(--text-secondary)' }}>
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); reset(); setSelectedTypes([]) }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Vendor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
