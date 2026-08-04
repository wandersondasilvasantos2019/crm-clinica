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
 *
 * storageKey própria (distinta da usada em lib/supabase.ts) porque o
 * GoTrueClient do supabase-js conta instâncias por storageKey — sem isso,
 * os dois clients (este e o do CRM autenticado) caem na mesma chave padrão
 * e disparam o aviso "Multiple GoTrueClient instances detected" no console
 * sempre que ambos os módulos são carregados no mesmo bundle.
 */
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'wsantos-public-auth',
    persistSession: false,
    autoRefreshToken: false,
  },
})
