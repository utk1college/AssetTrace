import { cn } from '@/utils/cn'

interface DamageItemProps {
  className?: string
}

export default function DamageItem({ className }: DamageItemProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">DamageItem Component</p>
    </div>
  )
}
