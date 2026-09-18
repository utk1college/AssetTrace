import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isLoading, error, clearError } = useAuthStore()
  const registered = Boolean(location.state?.registered)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    try {
      await signIn(email, password)
      const from = location.state?.from?.pathname ?? '/dashboard'
      navigate(from, { replace: true })
    } catch {
      // The store exposes the normalized error for the form to render.
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-10 block text-center text-subheading text-[var(--text-primary)] no-underline">AssetTrace</Link>
        <section className="card p-6 sm:p-8" aria-labelledby="login-title">
          <div className="mb-7">
            <p className="section-label mb-2">WELCOME BACK</p>
            <h1 id="login-title" className="text-display">Log in to AssetTrace</h1>
            <p className="mt-2 text-small">Continue to your inspections and condition records.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div><label htmlFor="login-email" className="mb-2 block text-small font-medium text-[var(--text-primary)]">Email address</label><input id="login-email" className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div><label htmlFor="login-password" className="mb-2 block text-small font-medium text-[var(--text-primary)]">Password</label><input id="login-password" className="input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            {registered && <p className="rounded-lg bg-[var(--success-light)] p-3 text-small text-[var(--success)]" role="status">Account created. Log in to continue.</p>}
            {error && <p className="rounded-lg bg-[var(--error-light)] p-3 text-small text-[var(--error)]" role="alert">{error}</p>}
            <PrimaryButton type="submit" fullWidth disabled={isLoading}><LogIn className="h-5 w-5" aria-hidden="true" />{isLoading ? 'Logging in…' : 'Log in'}</PrimaryButton>
          </form>
          <p className="mt-6 text-center text-small">New to AssetTrace? <Link to="/register" className="font-semibold text-[var(--accent)]">Create an account</Link></p>
        </section>
      </div>
    </main>
  )
}
