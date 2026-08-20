import { Link, Outlet, useLocation } from 'react-router-dom'
import { TicketIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function AppShell() {
  const location = useLocation()
  const isDashboard = location.pathname === '/'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <TicketIcon className="size-5" />
            <span>MOCOU Admin</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/"
              className={cn(
                'text-muted-foreground hover:text-foreground',
                isDashboard && 'text-foreground font-medium',
              )}
            >
              이벤트 대시보드
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
