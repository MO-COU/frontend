import { Link, Outlet } from 'react-router-dom'
import { StoreIcon, TicketIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LgUplusLogo } from '@/components/brand/LgUplusLogo'

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#FBEFF5]">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <TicketIcon className="size-5" />
            <span>MOCOU Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <LgUplusLogo className="text-sm" />
            <Button asChild variant="outline" size="sm">
              <Link to="/shop">
                <StoreIcon /> 고객 화면 보기
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
