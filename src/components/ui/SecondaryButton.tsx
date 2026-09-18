import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean
}

const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ className, fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'btn btn-secondary',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SecondaryButton.displayName = 'SecondaryButton'

export default SecondaryButton
