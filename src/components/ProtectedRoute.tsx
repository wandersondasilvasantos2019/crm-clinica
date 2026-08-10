import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode
  adminOnly?: boolean
}) {
  const { session, loading, role, roleLoading } = useAuth()

  if (loading || (session && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light px-4 text-center">
        <div>
          <p className="text-sm font-medium text-gray-900">Sua conta ainda não foi configurada.</p>
          <p className="mt-1 text-sm text-brand-gray">
            Fale com o administrador para liberar seu acesso.
          </p>
        </div>
      </div>
    )
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
