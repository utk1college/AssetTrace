import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, confirmSignUp, isLoading, error, clearError } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role>('renter')
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setFormError(null)
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }
    const passwordRequirements = [
      [password.length >= 8, 'at least 8 characters'],
      [/[A-Z]/.test(password), 'an uppercase letter'],
      [/[a-z]/.test(password), 'a lowercase letter'],
      [/\d/.test(password), 'a number'],
      [/[^A-Za-z0-9]/.test(password), 'a symbol'],
    ] as const
    const missingRequirement = passwordRequirements.find(
      ([isValid]) => !isValid,
    )
    if (missingRequirement) {
      setFormError(`Use ${missingRequirement[1]}.`)
      return
    }
    try {
      const result = await signUp(name, email, password, role)
      if (result.userConfirmed) {
        navigate('/login', { replace: true, state: { registered: true } })
      } else {
        setAwaitingConfirmation(true)
      }
    } catch {
      // The store exposes the normalized error for the form to render.
    }
  }

  async function handleConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setFormError(null)

    if (!confirmationCode.trim()) {
      setFormError('Enter the confirmation code from your email.')
      return
    }

    try {
      await confirmSignUp(email, confirmationCode)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch {
      // The store exposes the normalized error for the form to render.
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 block text-center text-subheading text-[var(--text-primary)] no-underline">AssetTrace</Link>
        <section className="card p-6 sm:p-8" aria-labelledby="register-title">
          <div className="mb-7"><p className="section-label mb-2">GET STARTED</p><h1 id="register-title" className="text-display">Create your account</h1><p className="mt-2 text-small">Set up your account to record and review rental condition.</p></div>
          {awaitingConfirmation ? (
            <form className="space-y-5" onSubmit={handleConfirmation}>
              <p className="text-small">We sent a confirmation code to {email}. Enter it to activate your account.</p>
              <div><label htmlFor="confirmation-code" className="mb-2 block text-small font-medium text-[var(--text-primary)]">Confirmation code</label><input id="confirmation-code" className="input" type="text" inputMode="numeric" autoComplete="one-time-code" value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} required /></div>
              {(formError || error) && <p className="rounded-lg bg-[var(--error-light)] p-3 text-small text-[var(--error)]" role="alert">{formError ?? error}</p>}
              <PrimaryButton type="submit" fullWidth disabled={isLoading}><UserPlus className="h-5 w-5" aria-hidden="true" />{isLoading ? 'Confirming…' : 'Confirm account'}</PrimaryButton>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div><label htmlFor="register-name" className="mb-2 block text-small font-medium text-[var(--text-primary)]">Name</label><input id="register-name" className="input" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
              <div><label htmlFor="register-email" className="mb-2 block text-small font-medium text-[var(--text-primary)]">Email address</label><input id="register-email" className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
              <div><label htmlFor="register-password" className="mb-2 block text-small font-medium text-[var(--text-primary)]">Password</label><input id="register-password" className="input" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /><p className="mt-1 text-tiny">Use 8+ characters with uppercase, lowercase, a number, and a symbol.</p></div>
              <div><label htmlFor="register-confirm-password" className="mb-2 block text-small font-medium text-[var(--text-primary)]">Confirm password</label><input id="register-confirm-password" className="input" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
              <fieldset><legend className="mb-2 block text-small font-medium text-[var(--text-primary)]">I am joining as</legend><div className="grid grid-cols-2 gap-3"><RoleOption value="renter" label="Renter" role={role} onChange={setRole} /><RoleOption value="owner" label="Owner" role={role} onChange={setRole} /></div></fieldset>
              {(formError || error) && <p className="rounded-lg bg-[var(--error-light)] p-3 text-small text-[var(--error)]" role="alert">{formError ?? error}</p>}
              <PrimaryButton type="submit" fullWidth disabled={isLoading}><UserPlus className="h-5 w-5" aria-hidden="true" />{isLoading ? 'Creating account…' : 'Create account'}</PrimaryButton>
            </form>
          )}
          <p className="mt-6 text-center text-small">Already have an account? <Link to="/login" className="font-semibold text-[var(--accent)]">Log in</Link></p>
        </section>
      </div>
    </main>
  )
}

function RoleOption({ value, label, role, onChange }: { value: Role; label: string; role: Role; onChange: (role: Role) => void }) {
  return <label className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-small font-medium ${role === value ? 'border-[var(--accent)] bg-[var(--error-light)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)]'}`}><input className="sr-only" type="radio" name="role" value={value} checked={role === value} onChange={() => onChange(value)} />{label}</label>
}
