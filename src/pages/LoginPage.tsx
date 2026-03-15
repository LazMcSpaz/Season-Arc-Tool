import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signInWithPasscode, session } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // If already signed in, redirect
  if (session) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!code.trim()) return
    setSubmitting(true)
    const result = await signInWithPasscode(code.trim())
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-svh px-4">
      <div className="w-full max-w-sm p-8 bg-surface rounded-lg border border-border">
        <h1 className="font-heading text-2xl text-text-primary text-center mb-2">
          The Remnant Continent
        </h1>
        <p className="text-text-secondary text-center text-sm mb-8">
          Story Manager
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-mono mb-1">
              PASSCODE
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              autoComplete="off"
              className="w-full px-4 py-3 bg-surface-alt border border-border rounded text-text-primary text-lg text-center tracking-widest placeholder-text-muted focus:outline-none focus:border-border-active"
              placeholder="Enter passcode"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-surface-alt border border-border-active rounded text-text-primary font-mono text-sm hover:bg-border transition-colors disabled:opacity-50"
          >
            {submitting ? '...' : 'ENTER'}
          </button>
        </form>
      </div>
    </div>
  )
}
