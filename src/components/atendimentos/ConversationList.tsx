import { MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import { formatPhone, formatRelativeTime, stripWhatsappSuffix } from '@/lib/format'
import type { ConversationSummary } from '@/pages/Atendimentos'

interface ConversationListProps {
  conversations: ConversationSummary[]
  loading: boolean
  error: string | null
  selectedTelefone: string | null
  onSelect: (telefone: string) => void
  hideOnMobile: boolean
}

function ListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="h-3.5 w-28 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export default function ConversationList({
  conversations,
  loading,
  error,
  selectedTelefone,
  onSelect,
  hideOnMobile,
}: ConversationListProps) {
  const validConversations = conversations.filter((c) => !!c.telefone)

  return (
    <aside
      className={clsx(
        'w-full flex-col overflow-hidden border-r border-gray-100 lg:flex lg:w-80 lg:shrink-0',
        hideOnMobile ? 'hidden lg:flex' : 'flex'
      )}
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Conversas</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <p className="p-4 text-sm text-rose-600">{error}</p>
        ) : validConversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-secondary/10 text-brand-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-sm text-brand-gray">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <ul>
            {validConversations.map((c) => {
              const isActive = c.telefone === selectedTelefone
              return (
                <li key={c.telefone}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.telefone)}
                    className={clsx(
                      'flex w-full flex-col gap-1 border-b border-gray-50 px-4 py-3 text-left transition',
                      isActive ? 'bg-brand-secondary/10' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={clsx(
                          'truncate text-sm font-medium',
                          isActive ? 'text-brand-primary' : 'text-gray-900'
                        )}
                      >
                        {formatPhone(stripWhatsappSuffix(c.telefone))}
                      </span>
                      <span className="shrink-0 text-[11px] text-brand-gray">
                        {formatRelativeTime(c.criado_em)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-brand-gray">{c.mensagem}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
