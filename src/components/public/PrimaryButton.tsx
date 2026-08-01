import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export default function PrimaryButton({ loading, disabled, className, children, ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
