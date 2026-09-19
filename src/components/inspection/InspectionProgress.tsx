import { cn } from '@/utils/cn'

interface InspectionProgressProps {
  completedAreas: number
  totalAreas: number
  className?: string
}

export default function InspectionProgress({
  completedAreas,
  totalAreas,
  className,
}: InspectionProgressProps) {
  const safeCompleted = Math.min(
    Math.max(completedAreas, 0),
    Math.max(totalAreas, 0),
  )

  const percent =
    totalAreas > 0
      ? Math.round((safeCompleted / totalAreas) * 100)
      : 0

  const isComplete = totalAreas > 0 && safeCompleted === totalAreas

  return (
    <div className={cn('card p-4', className)}>
      <div className="mb-2 flex items-center justify-between text-tiny">
        <span>
          {safeCompleted} of {totalAreas} areas complete
        </span>

        <span>{percent}%</span>
      </div>

      <div className="progress-container">
        <div
          className={`progress-bar ${
            isComplete ? '' : 'progress-bar-warning'
          }`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={`${percent}% of inspection areas complete`}
        />
      </div>
    </div>
  )
}