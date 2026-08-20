import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'

import { EventStatusBadge } from '@/features/events/components/EventStatusBadge'
import { formatKstDateTime } from '@/lib/dateUtils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { CouponEvent } from '@/types/domain'

export function EventGalleryView({ events }: { events: CouponEvent[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{event.name}</CardTitle>
              <EventStatusBadge status={event.status} />
            </div>
            <CardDescription>{formatKstDateTime(event.startAt)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">잔여 재고</span>
              <span className="font-medium">
                {event.remainingStock.toLocaleString()} / {event.totalStock.toLocaleString()}
              </span>
            </div>
            <Button asChild size="sm" className="mt-1 self-start">
              <Link to={`/events/${event.id}`}>
                상세보기 <ArrowRightIcon />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
