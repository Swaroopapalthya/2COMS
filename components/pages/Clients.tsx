'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api-client'

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Valid email required'),
  contactRole: z.string().min(1, 'Role is required'),
})
type FormData = z.infer<typeof schema>

interface Client {
  id: string
  companyName: string
  contacts: { id: string; contactName: string; email: string; role: string }[]
  _count?: { projects: number }
  createdAt: string
}

export default function ClientsPage() {
  const { user } = useAuthStore()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const isManager = user?.role === 'ACCOUNT_MANAGER'

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fetchClients = async () => {
    try {
      const res = await api.get('/api/clients')
      setClients(res.data)
    } catch {
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/clients', {
        companyName: data.companyName,
        contacts: [{
          contactName: data.contactName,
          email: data.contactEmail,
          role: data.contactRole,
        }],
      })
      reset()
      setShowModal(false)
      fetchClients()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client and all associated data?')) return
    try {
      await api.delete(`/api/clients/${id}`)
      setClients(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Failed to delete client')
    }
  }

  const filtered = clients.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '40px' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>
            <span className="gradient-text">Clients</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            Manage your client accounts and contacts
          </p>
        </div>
        {isManager && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add Client
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          className="form-input"
          placeholder="🔍 Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto' }} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <p style={{ fontSize: 16 }}>{search ? 'No clients match your search.' : 'No clients yet.'}</p>
            {isManager && !search && (
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                + Add First Client
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Primary Contact</th>
                <th>Contact Role</th>
                <th>Projects</th>
                <th>Created</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'white', fontSize: 14, flexShrink: 0,
                      }}>
                        {client.companyName[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{client.companyName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {client.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {client.contacts[0]?.contactName || '—'}
                    {client.contacts[0] && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.contacts[0].email}</div>
                    )}
                  </td>
                  <td>
                    {client.contacts[0] ? (
                      <span className="badge badge-purple">{client.contacts[0].role}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className="badge badge-blue">{client._count?.projects || 0} projects</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  {isManager && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={`/clients/${client.id}`} style={{ fontSize: 12, color: 'var(--accent-blue-light)', textDecoration: 'none', padding: '4px 10px', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6 }}>
                          View
                        </a>
                        <button className="btn-danger" onClick={() => handleDelete(client.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); reset() } }}>
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add New Client</h2>
              <button onClick={() => { setShowModal(false); reset() }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ marginBottom: 18 }}>
                <label className="form-label">Company Name *</label>
                <input {...register('companyName')} className="form-input" placeholder="ACME Corporation" />
                {errors.companyName && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.companyName.message}</p>}
              </div>

              <div style={{ padding: '16px', background: 'rgba(99,102,241,0.05)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)', marginBottom: 18 }}>
                <p style={{ fontSize: 12, color: 'var(--accent-blue-light)', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Contact</p>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Contact Name *</label>
                  <input {...register('contactName')} className="form-input" placeholder="John Smith" />
                  {errors.contactName && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.contactName.message}</p>}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Email *</label>
                  <input {...register('contactEmail')} className="form-input" type="email" placeholder="john@acme.com" />
                  {errors.contactEmail && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.contactEmail.message}</p>}
                </div>
                <div>
                  <label className="form-label">Role *</label>
                  <input {...register('contactRole')} className="form-input" placeholder="e.g. HR Manager, CTO" />
                  {errors.contactRole && <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{errors.contactRole.message}</p>}
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); reset() }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
