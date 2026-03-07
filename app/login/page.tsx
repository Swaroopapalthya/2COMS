'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api-client'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/login', data)
      setAuth(res.data.user, res.data.token)
      router.push('/dashboard')
    } catch (err: unknown) {
      console.error('Login error:', err)
      const e = err as { response?: { data?: { error?: string | Array<{message: string}> } } }
      const errorData = e.response?.data?.error
      const message = typeof errorData === 'string' 
        ? errorData 
        : Array.isArray(errorData) 
          ? errorData[0]?.message 
          : 'Login failed - Check connection'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        top: '-200px', left: '-200px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        bottom: '-100px', right: '-100px', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'var(--gradient-primary)',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span className="gradient-text">2COMS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Workforce Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Email Address</label>
              <input
                {...register('email')}
                className="form-input"
                type="email"
                placeholder="you@company.com"
              />
              {errors.email && (
                <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="form-label">Password</label>
              <input
                {...register('password')}
                className="form-input"
                type="password"
                placeholder="••••••••"
              />
              {errors.password && (
                <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                color: '#f87171', fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: 24, padding: '16px', background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12,
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo Credentials
            </p>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>Account Manager: </span>
                admin@2coms.com / admin123
              </div>
              <div>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Client: </span>
                client@acme.com / client123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
