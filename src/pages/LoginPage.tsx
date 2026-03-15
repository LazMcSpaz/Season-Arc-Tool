import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn, signUp, signInWithOtp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password)

    setSubmitting(false)

    if (result.error) {
      setError(result.error.message)
    } else if (mode === 'signup') {
      setMessage('Check your email for a confirmation link.')
    } else {
      navigate('/')
    }
  }

  const handleMagicLink = async () => {
    setError(null)
    setMessage(null)
    if (!email) {
      setError('Enter your email first.')
      return
    }
    setSubmitting(true)
    const { error } = await signInWithOtp(email)
    setSubmitting(false)
    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a magic link.')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="w-full max-w-sm p-8 bg-surface rounded-lg border border-border">
        <h1 className="font-heading text-2xl text-text-primary text-center mb-6">
          The Remnant Continent
        </h1>
        <p className="text-text-secondary text-center text-sm mb-8">
          Story Manager
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm font-mono mb-1">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface-alt border border-border rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
              placeholder="writer@example.com"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-mono mb-1">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-surface-alt border border-border rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
              placeholder="Min 6 characters"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          {message && (
            <p className="text-text-arc text-sm">{message}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-surface-alt border border-border-active rounded text-text-primary font-mono text-sm hover:bg-border transition-colors disabled:opacity-50"
          >
            {submitting ? '...' : mode === 'signin' ? 'SIGN IN' : 'SIGN UP'}
          </button>
        </form>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleMagicLink}
            disabled={submitting}
            className="w-full py-2 border border-border rounded text-text-muted font-mono text-sm hover:text-text-secondary hover:border-border-active transition-colors disabled:opacity-50"
          >
            MAGIC LINK
          </button>

          <p className="text-center text-text-muted text-sm">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
                  className="text-text-secondary underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(null); setMessage(null) }}
                  className="text-text-secondary underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
