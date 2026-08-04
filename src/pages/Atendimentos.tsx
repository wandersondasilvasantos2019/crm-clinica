import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import ConversationList from '@/components/atendimentos/ConversationList'
import ChatPanel from '@/components/atendimentos/ChatPanel'
import type { Conversa, ConversaRole } from '@/types/database'

export interface ConversationSummary {
  telefone: string
  mensagem: string
  role: ConversaRole
  criado_em: string
}

// Latest message per phone number, most-recent conversation first.
function toSummaries(rows: ConversationSummary[]): ConversationSummary[] {
  const seen = new Set<string>()
  const summaries: ConversationSummary[] = []
  for (const row of rows) {
    if (seen.has(row.telefone)) continue
    seen.add(row.telefone)
    summaries.push(row)
  }
  return summaries
}

// Move the conversation that just received a message to the top of the
// list — same behavior as WhatsApp Web. Deliberately unconditional (not
// re-sorted by criado_em) so the just-arrived message always wins the top
// spot immediately, regardless of any clock skew in server timestamps.
function moveToTop(list: ConversationSummary[], incoming: ConversationSummary): ConversationSummary[] {
  const rest = list.filter((c) => c.telefone !== incoming.telefone)
  return [incoming, ...rest]
}

export default function Atendimentos() {
  const { instanceId } = useInstance()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedTelefone, setSelectedTelefone] = useState<string | null>(null)
  const [messages, setMessages] = useState<Conversa[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  const selectedTelefoneRef = useRef<string | null>(null)
  useEffect(() => {
    selectedTelefoneRef.current = selectedTelefone
  }, [selectedTelefone])

  // Initial conversation list.
  useEffect(() => {
    if (!instanceId) return
    let cancelled = false

    async function load() {
      setLoadingList(true)
      setListError(null)
      setSelectedTelefone(null)

      const { data, error } = await supabase
        .from('conversas')
        .select('telefone, mensagem, role, criado_em')
        .eq('instance_id', instanceId)
        .order('criado_em', { ascending: false })
        .limit(1000)

      if (cancelled) return

      if (error) {
        setListError('Não foi possível carregar as conversas. Tente novamente em instantes.')
        setLoadingList(false)
        return
      }

      setConversations(toSummaries((data ?? []) as ConversationSummary[]))
      setLoadingList(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [instanceId])

  // Full history for the selected conversation.
  useEffect(() => {
    if (!instanceId || !selectedTelefone) {
      setMessages([])
      return
    }
    let cancelled = false

    async function loadMessages() {
      setLoadingMessages(true)
      setMessagesError(null)

      const { data, error } = await supabase
        .from('conversas')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('telefone', selectedTelefone as string)
        .order('criado_em', { ascending: true })

      if (cancelled) return

      if (error) {
        setMessagesError('Não foi possível carregar o histórico desta conversa.')
        setLoadingMessages(false)
        return
      }

      setMessages((data ?? []) as Conversa[])
      setLoadingMessages(false)
    }

    loadMessages()
    return () => {
      cancelled = true
    }
  }, [instanceId, selectedTelefone])

  // Realtime: new messages update the list preview and, if the affected
  // conversation is open, the message thread. Subscribed once per
  // instanceId (not per selection) to avoid resubscribing on every click.
  useEffect(() => {
    if (!instanceId) return

    let channel: RealtimeChannel | null = null

    try {
      channel = supabase
        .channel(`conversas-realtime-${instanceId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversas', filter: `instance_id=eq.${instanceId}` },
          (payload) => {
            const row = payload.new as Conversa

            setConversations((prev) =>
              moveToTop(prev, {
                telefone: row.telefone,
                mensagem: row.mensagem,
                role: row.role,
                criado_em: row.criado_em,
              })
            )

            if (row.telefone === selectedTelefoneRef.current) {
              setMessages((prev) => [...prev, row])
            }
          }
        )
        .subscribe()
    } catch (err) {
      console.error('Não foi possível iniciar a atualização em tempo real das conversas.', err)
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [instanceId])

  if (!instanceId) {
    return <p className="text-sm text-brand-gray">Selecione uma clínica para visualizar os atendimentos.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atendimentos</h1>
        <p className="text-sm text-brand-gray">Acompanhe em tempo real as conversas com o Agente de IA</p>
      </div>

      {/*
        Fixed, viewport-relative height (not h-full/flex-1) on purpose: the
        page shell's root uses min-h-screen, which is a floor, not a
        ceiling, so flex-1 never actually caps this card's growth — with a
        long conversation it would just grow to fit every message and the
        whole page would scroll instead of this panel scrolling internally.
        Same reasoning as the fixed height on CalendarView.
      */}
      <div className="card flex h-[calc(100vh-220px)] min-h-[480px] overflow-hidden p-0">
        <ConversationList
          conversations={conversations}
          loading={loadingList}
          error={listError}
          selectedTelefone={selectedTelefone}
          onSelect={setSelectedTelefone}
          hideOnMobile={!!selectedTelefone}
        />
        <ChatPanel
          telefone={selectedTelefone}
          messages={messages}
          loading={loadingMessages}
          error={messagesError}
          onBack={() => setSelectedTelefone(null)}
        />
      </div>
    </div>
  )
}
