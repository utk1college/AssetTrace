import { LogOut, Mail, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-[var(--surface)] pb-24">
      <div className="container space-y-6 py-6">
        <header>
          <p className="section-label">ACCOUNT</p>
          <h1 className="text-display mt-1">Your profile</h1>
          <p className="text-body mt-2">Manage your account details and sign out securely.</p>
        </header>

        <section className="card p-5" aria-labelledby="profile-details">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-5">
            <span className="asset-icon h-12 w-12 rounded-full" aria-hidden="true">
              <UserRound className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 id="profile-details" className="text-subheading truncate">{user.name}</h2>
              <p className="text-small mt-1">AssetTrace account</p>
            </div>
          </div>

          <dl className="space-y-4 pt-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
              <div>
                <dt className="text-tiny">Email address</dt>
                <dd className="text-body mt-1 break-all">{user.email}</dd>
              </div>
            </div>
          </dl>
        </section>

        {error && <p className="text-small text-[var(--error)]" role="alert">{error}</p>}

        <div className="pt-2">
          <PrimaryButton type="button" fullWidth onClick={() => void handleSignOut()} disabled={isLoading}>
            <LogOut className="h-5 w-5" aria-hidden="true" />
            {isLoading ? 'Signing out...' : 'Sign out'}
          </PrimaryButton>
        </div>
      </div>
    </main>
  )
}
