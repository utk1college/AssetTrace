import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ChecklistProps {
  areas: string[]
  completedAreaIds: string[]
  className?: string
}

export default function Checklist({
  areas,
  completedAreaIds,
  className,
}: ChecklistProps) {
  const completed = new Set(completedAreaIds)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[var(--border)] bg-white',
        className,
      )}
    >
      {areas.map((area, index) => {
        const isComplete = completed.has(area)

        return (
          <div
            key={area}
            className={cn(
              'flex min-h-12 items-center gap-3 px-4 py-3',
              index < areas.length - 1 &&
                'border-b border-[var(--border)]',
            )}
          >
            {isComplete ? (
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-[var(--success)]"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="h-5 w-5 shrink-0 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
            )}

            <span className="text-small">
              {area}
            </span>

            <span className="ml-auto text-tiny">
              {isComplete ? 'Recorded' : 'Pending'}
            </span>
          </div>
        )
      })}
    </div>
  )
}