import { useState } from 'react'
import { LayoutGridIcon, ListIcon } from 'lucide-react'

import { useEvents } from '@/hooks/useEvents'
import { EventGalleryView } from '@/features/events/components/EventGalleryView'
import { EventListView } from '@/features/events/components/EventListView'
import { CreateEventDialog } from '@/features/events/components/CreateEventDialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ViewMode = 'gallery' | 'list'

export function DashboardPage() {
  const { data: events, isLoading, isError } = useEvents()
  const [view, setView] = useState<ViewMode>('gallery')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">이벤트 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            선착순 쿠폰 발급 이벤트별 실행 · 발급 리스트 · 정합성 검증을 확인합니다.
          </p>
        </div>
        <CreateEventDialog />
      </div>

      <div className="flex items-center gap-1 self-end rounded-lg bg-muted p-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(view === 'gallery' && 'bg-background shadow-sm')}
          onClick={() => setView('gallery')}
        >
          <LayoutGridIcon /> 갤러리
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(view === 'list' && 'bg-background shadow-sm')}
          onClick={() => setView('list')}
        >
          <ListIcon /> 리스트
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
      {isError && <p className="text-sm text-destructive">이벤트 목록을 불러오지 못했습니다.</p>}

      {events &&
        (view === 'gallery' ? (
          <EventGalleryView events={events} />
        ) : (
          <EventListView events={events} />
        ))}
    </div>
  )
}
