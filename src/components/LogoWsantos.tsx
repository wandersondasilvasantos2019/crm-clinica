import { useState } from 'react'
import clsx from 'clsx'
import LogoWsantosPlaceholder from './LogoWsantosPlaceholder'
import logoDarkText from '@/assets/logo-wsantos-dark-text.png'
import logoLightText from '@/assets/logo-wsantos-light-text.png'

interface LogoWsantosProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  variant?: 'auto' | 'dark-text' | 'light-text'
  onDarkBackground?: boolean
  className?: string
  textClassName?: string
}

// Icon-only crop window, in the PNGs' native 500x500 space (both files share
// the same icon artwork and position — only the wordmark color differs).
const ICON_CROP = { x: 124, y: 91, width: 256, height: 260 }
const SOURCE_SIZE = 500

const ICON_SIZES: Record<NonNullable<LogoWsantosProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 48,
}

const FULL_HEIGHTS: Record<NonNullable<LogoWsantosProps['size']>, number> = {
  sm: 56,
  md: 72,
  lg: 96,
}

export default function LogoWsantos({
  size = 'md',
  showText = true,
  variant = 'auto',
  onDarkBackground = false,
  className,
  textClassName = 'text-gray-900',
}: LogoWsantosProps) {
  const [imgError, setImgError] = useState(false)

  if (imgError) {
    return (
      <LogoWsantosPlaceholder
        size={size}
        showText={showText}
        className={className}
        textClassName={textClassName}
      />
    )
  }

  const resolvedVariant = variant === 'auto' ? (onDarkBackground ? 'light-text' : 'dark-text') : variant
  const src = resolvedVariant === 'light-text' ? logoLightText : logoDarkText

  if (!showText) {
    const boxSize = ICON_SIZES[size]
    const scale = boxSize / ICON_CROP.width
    const renderedSize = scale * SOURCE_SIZE
    const boxHeight = (ICON_CROP.height / ICON_CROP.width) * boxSize

    return (
      <div
        className={clsx('relative shrink-0 overflow-hidden', className)}
        style={{ width: boxSize, height: boxHeight }}
      >
        <img
          src={src}
          alt="wsantos"
          onError={() => setImgError(true)}
          style={{
            position: 'absolute',
            width: renderedSize,
            height: renderedSize,
            maxWidth: 'none',
            left: -scale * ICON_CROP.x,
            top: -scale * ICON_CROP.y,
          }}
        />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt="wsantos"
      onError={() => setImgError(true)}
      className={clsx('w-auto object-contain', className)}
      style={{ height: FULL_HEIGHTS[size] }}
    />
  )
}
