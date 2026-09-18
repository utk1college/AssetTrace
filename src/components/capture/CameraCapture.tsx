import { cn } from '@/utils/cn'

interface CameraCaptureProps {
  className?: string
}

export default function CameraCapture({ className }: CameraCaptureProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">CameraCapture Component</p>
    </div>
  )
}
