import { Check } from 'lucide-react'
import clsx from 'clsx'

const STEP_LABELS = ['Serviço', 'Profissional', 'Data e hora', 'Confirmação']

export default function ProgressBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const stepNumber = i + 1
          const isCompleted = stepNumber < step
          const isActive = stepNumber === step
          const isLast = i === STEP_LABELS.length - 1

          return (
            <div key={label} className={clsx('flex items-center', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
                    isCompleted || isActive ? 'text-white' : 'bg-gray-100 text-gray-400'
                  )}
                  style={isCompleted || isActive ? { backgroundColor: 'var(--color-primary)' } : undefined}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                </div>
                <span
                  className={clsx(
                    'hidden text-[11px] font-medium sm:block',
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={clsx('mx-1.5 h-0.5 flex-1 rounded-full transition', !isCompleted && 'bg-gray-100')}
                  style={isCompleted ? { backgroundColor: 'var(--color-primary)' } : undefined}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
