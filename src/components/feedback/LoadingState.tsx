import { LoaderCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LoadingStateProps {
  className?: string
  label?: string
}

export default function LoadingState({ className, label = 'Loading' }: LoadingStateProps) {
  return (
    <div className={cn('container flex min-h-48 items-center justify-center', className)} role="status">
      <div className="flex items-center gap-2 text-small">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  )
}
