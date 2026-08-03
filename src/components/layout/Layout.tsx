import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import InstanceSwitcher from './InstanceSwitcher'

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-brand-light">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-100 bg-brand-light/80 px-4 py-3 backdrop-blur lg:justify-end">
          <button
            className="rounded-md p-2 text-gray-700 hover:bg-white lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <InstanceSwitcher />
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
