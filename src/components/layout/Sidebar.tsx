import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  Headset,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/context/AuthContext'
import LogoWsantos from '@/components/LogoWsantos'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/contatos', label: 'Contatos', icon: Users },
  { to: '/app/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { to: '/app/estatisticas', label: 'Estatísticas', icon: BarChart3 },
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/app/atendimentos', label: 'Atendimentos', icon: Headset },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { signOut, user } = useAuth()

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-dark transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <LogoWsantos size="sm" showText={false} onDarkBackground textClassName="text-white" />
            <span className="text-base font-bold leading-none text-white">wsantos</span>
          </div>
          <button
            className="rounded-md p-1 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-primary/15 text-brand-secondary'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" title={user?.email ?? undefined}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-semibold text-brand-secondary">
              {(user?.email ?? 'A').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Admin</p>
              <p className="truncate text-xs text-white/50">Administrador</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
          </div>

          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
