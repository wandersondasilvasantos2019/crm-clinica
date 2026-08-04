import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Configure o arquivo .env a partir do .env.example.'
  )
}

/**
 * Cliente Supabase único e compartilhado para todo o CRM autenticado
 * (Dashboard, Contatos, Agendamentos, Atendimentos, etc.) — importe este
 * client em vez de chamar createClient() novamente.
 *
 * Não damos uma storageKey explícita aqui de propósito: esta é a sessão
 * real do usuário (persistSession: true) já em produção. Mudar a chave
 * faria todo mundo logado hoje "deslogar" silenciosamente, porque o app
 * passaria a procurar a sessão em outro slot do localStorage. O cliente
 * público (lib/supabasePublic.ts) é quem recebeu uma storageKey própria
 * para não colidir com esta — ele nunca persiste sessão, então não há
 * esse risco do lado dele.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
