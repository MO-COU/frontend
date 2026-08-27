import { Link, Outlet } from 'react-router-dom'
import { LayoutDashboardIcon, TicketIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CustomerShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/shop" className="flex items-center gap-2 font-semibold">
            <TicketIcon className="size-5" />
            <span>MOCOU</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <LayoutDashboardIcon /> 관리자 화면
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
