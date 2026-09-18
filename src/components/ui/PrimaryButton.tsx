import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'btn btn-primary',
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
PrimaryButton.displayName = 'PrimaryButton'

export default PrimaryButton
