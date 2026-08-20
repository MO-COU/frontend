import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'

import { useEvent } from '@/hooks/useEvents'
import { formatKstDateTime } from '@/lib/dateUtils'
import { EventStatusBadge } from '@/features/events/components/EventStatusBadge'
import { RunTab } from '@/features/events/components/RunTab'
import { ListTab } from '@/features/events/components/ListTab'
import { ConsistencyTab } from '@/features/consistency/components/ConsistencyTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export function EventDetailPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const { data: event, isLoading } = useEvent(eventId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
          <Link to="/">
            <ArrowLeftIcon /> 이벤트 목록
          </Link>
        </Button>

        {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {event && (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{event.name}</h1>
            <EventStatusBadge status={event.status} />
          </div>
        )}
        {event && (
          <p className="text-sm text-muted-foreground">
            {event.id} · {formatKstDateTime(event.startAt)} · 잔여 재고{' '}
            {event.remainingStock.toLocaleString()} / {event.totalStock.toLocaleString()}
          </p>
        )}
      </div>

      <Tabs defaultValue="run">
        <TabsList>
          <TabsTrigger value="run">실행</TabsTrigger>
          <TabsTrigger value="list">리스트</TabsTrigger>
          <TabsTrigger value="consistency">정합성</TabsTrigger>
        </TabsList>
        <TabsContent value="run">
          <RunTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="list">
          <ListTab eventId={eventId} />
        </TabsContent>
        <TabsContent value="consistency">
          <ConsistencyTab eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
