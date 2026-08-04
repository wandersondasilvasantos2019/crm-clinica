import { useLayoutEffect, useRef } from 'react'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import { formatDateTime, formatPhone, stripWhatsappSuffix } from '@/lib/format'
import type { Conversa } from '@/types/database'

interface ChatPanelProps {
  telefone: string | null
  messages: Conversa[]
  loading: boolean
  error: string | null
  onBack: () => void
}

function MessagesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={clsx('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
          <div className="h-10 w-48 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

const NEAR_BOTTOM_THRESHOLD_PX = 120

export default function ChatPanel({ telefone, messages, loading, error, onBack }: ChatPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Telefone of the conversation we last snapped to bottom for — used to
  // tell "conversation just opened" apart from "new message arrived while
  // already viewing it", since `telefone` alone changes a render before the
  // matching `messages` actually load (loading state masks that gap).
  const lastScrolledTelefoneRef = useRef<string | null>(null)
  const previousMessageCountRef = useRef(0)
  const isNearBottomRef = useRef(true)

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX
  }

  useLayoutEffect(() => {
    if (messages.length === 0) return

    const isConversationOpening = lastScrolledTelefoneRef.current !== telefone

    if (isConversationOpening) {
      // Opening a conversation (first load or switching back to it): jump
      // straight to the last message, no animation.
      bottomRef.current?.scrollIntoView({ block: 'end' })
      isNearBottomRef.current = true
      lastScrolledTelefoneRef.current = telefone
    } else if (messages.length > previousMessageCountRef.current && isNearBottomRef.current) {
      // New message arrived while this conversation is already open, and
      // the user is near the bottom: scroll smoothly to reveal it. If
      // they've scrolled up to read older messages, leave the scroll alone.
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }

    previousMessageCountRef.current = messages.length
  }, [messages, telefone])

  if (!telefone) {
    return (
      <section className="hidden flex-1 flex-col items-center justify-center gap-2 px-4 text-center lg:flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary/10 text-brand-primary">
          <MessageCircle className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-gray-900">Selecione uma conversa</p>
        <p className="max-w-xs text-sm text-brand-gray">
          Escolha uma conversa na lista ao lado para ver o histórico completo.
        </p>
      </section>
    )
  }

  const telefoneFormatado = formatPhone(stripWhatsappSuffix(telefone))

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-50 lg:hidden"
          aria-label="Voltar para a lista"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
          {telefoneFormatado.slice(-2)}
        </div>
        <p className="truncate text-sm font-medium text-gray-900">{telefoneFormatado}</p>
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-brand-light/60 px-4 py-4">
        {loading ? (
          <MessagesSkeleton />
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-gray">Nenhuma mensagem nesta conversa.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const isPaciente = m.role === 'paciente'
              return (
                <div key={m.id} className={clsx('flex', isPaciente ? 'justify-start' : 'justify-end')}>
                  <div
                    className={clsx(
                      'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                      isPaciente
                        ? 'border border-gray-100 bg-white text-gray-900'
                        : 'bg-brand-primary text-white'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.mensagem}</p>
                    <p className={clsx('mt-1 text-[10px]', isPaciente ? 'text-brand-gray' : 'text-white/70')}>
                      {formatDateTime(m.criado_em)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </section>
  )
}
