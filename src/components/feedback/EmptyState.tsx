import { Link } from 'react-router-dom'
import PrimaryButton from '../ui/PrimaryButton'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
}

export default function EmptyState({ title, description, actionLabel, actionLink }: EmptyStateProps) {
  return (
    <div className="card text-center py-10">
      <p className="text-subheading font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </p>
      <p className="text-small max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionLabel && actionLink && (
        <Link to={actionLink}>
          <PrimaryButton>{actionLabel}</PrimaryButton>
        </Link>
      )}
    </div>
  )
}
