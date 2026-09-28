import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UsuarioRole } from '@/types/database'

interface AuthContextValue {
  session: Session | null
  user: User | null
  role: UsuarioRole | null
  ownInstanceId: string | null
  loading: boolean
  roleLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Papel carregado + para qual usuário. O refresh do token troca o objeto de
  // sessão (a cada ~1h e ao voltar para a aba) mas não o usuário — derivar o
  // "carregando" do userId evita desmontar o app inteiro nesses momentos.
  const [roleState, setRoleState] = useState<{
    userId: string
    role: UsuarioRole | null
    ownInstanceId: string | null
  } | null>(null)
  const userId = session?.user.id ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setRoleState(null)
      return
    }

    let cancelled = false

    supabase
      .from('usuarios')
      .select('role, instance_id')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setRoleState({ userId, role: data?.role ?? null, ownInstanceId: data?.instance_id ?? null })
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const roleCarregado = roleState !== null && roleState.userId === userId
  const role = roleCarregado ? roleState.role : null
  const ownInstanceId = roleCarregado ? roleState.ownInstanceId : null
  const roleLoading = userId !== null && !roleCarregado

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        ownInstanceId,
        loading,
        roleLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
