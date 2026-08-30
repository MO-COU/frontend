import { Link, Outlet } from 'react-router-dom'
import { LayoutDashboardIcon, TicketIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CoffeeIllustration } from '@/components/brand/CoffeeIllustration'
import { LgUplusLogo } from '@/components/brand/LgUplusLogo'

export function CustomerShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/shop" className="flex items-center gap-2 font-semibold">
            <TicketIcon className="size-5" />
            <span>MOCOU</span>
          </Link>
          <div className="flex items-center gap-3">
            <LgUplusLogo className="text-sm" />
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <LayoutDashboardIcon /> 관리자 화면
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-[linear-gradient(180deg,#FDE7F1_0%,var(--background)_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <LgUplusLogo className="text-lg" />
            <p className="text-2xl font-semibold">LG U+ 멤버십 회원에게 제공되는 커피 한 잔</p>
            <p className="text-sm text-muted-foreground">선착순으로 커피 쿠폰을 받아보세요.</p>
          </div>
          <CoffeeIllustration className="h-32 w-32 shrink-0 sm:h-40 sm:w-40" />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
