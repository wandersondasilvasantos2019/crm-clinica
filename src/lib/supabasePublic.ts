import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Configure o arquivo .env a partir do .env.example.'
  )
}

/**
 * Cliente Supabase dedicado à página pública de agendamento (/agendar/:slug).
 * Usa a mesma anon key do restante do app, mas sem persistir sessão no
 * localStorage — essa página roda sem autenticação e não deve interferir
 * com uma eventual sessão de administrador aberta no mesmo navegador.
 */
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
