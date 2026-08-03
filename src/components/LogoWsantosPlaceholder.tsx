import { useId } from 'react'
import clsx from 'clsx'

interface LogoWsantosPlaceholderProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  textClassName?: string
}

const ICON_SIZES: Record<NonNullable<LogoWsantosPlaceholderProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 48,
}

const TEXT_SIZES: Record<NonNullable<LogoWsantosPlaceholderProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

/**
 * Original hand-drawn SVG mark, used before the official logo files existed.
 * Kept as the runtime fallback for <LogoWsantos /> in case the PNG assets
 * fail to load (see the onError handler in LogoWsantos.tsx).
 */
export default function LogoWsantosPlaceholder({
  size = 'md',
  showText = true,
  className,
  textClassName = 'text-gray-900',
}: LogoWsantosPlaceholderProps) {
  const gradientId = useId()
  const px = ICON_SIZES[size]

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#13C296" />
            <stop offset="100%" stopColor="#0EA57A" />
          </linearGradient>
        </defs>

        <path
          d="M8 4h24a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H15l-6.5 5.5a1 1 0 0 1-1.64-.77V30a6 6 0 0 1-4.86-5.9V10a6 6 0 0 1 6-6Z"
          fill={`url(#${gradientId})`}
        />

        <rect x="14.5" y="2" width="2.6" height="6" rx="1.3" fill="#ffffff" />
        <rect x="22.9" y="2" width="2.6" height="6" rx="1.3" fill="#ffffff" />

        <circle cx="15.5" cy="17.5" r="2.8" fill="#ffffff" />
        <circle cx="24.5" cy="17.5" r="2.8" fill="#ffffff" />

        <path
          d="M15 23c1.8 1.8 8.2 1.8 10 0"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showText && (
        <span className={clsx('font-bold leading-none', TEXT_SIZES[size], textClassName)}>wsantos</span>
      )}
    </div>
  )
}
