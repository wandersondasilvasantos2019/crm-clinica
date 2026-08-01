import type { CSSProperties, ReactNode } from 'react'

interface PublicShellProps {
  nomeEmpresa?: string | null
  logoUrl?: string | null
  corPrimaria?: string | null
  children: ReactNode
}

const DEFAULT_PRIMARY = '#10b981'

export default function PublicShell({ nomeEmpresa, logoUrl, corPrimaria, children }: PublicShellProps) {
  const style = { '--color-primary': corPrimaria || DEFAULT_PRIMARY } as CSSProperties

  return (
    <div style={style} className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-6 sm:py-10">
        {(nomeEmpresa || logoUrl) && (
          <header className="mb-6 flex flex-col items-center gap-2 text-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nomeEmpresa ?? ''}
                className="h-14 w-14 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-sm"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {(nomeEmpresa ?? '?').slice(0, 1).toUpperCase()}
              </div>
            )}
            {nomeEmpresa && <h1 className="text-lg font-semibold text-gray-900">{nomeEmpresa}</h1>}
          </header>
        )}

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
