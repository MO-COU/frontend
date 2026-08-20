import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'

import { EventStatusBadge } from '@/features/events/components/EventStatusBadge'
import { formatKstDateTime } from '@/lib/dateUtils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CouponEvent } from '@/types/domain'

export function EventListView({ events }: { events: CouponEvent[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이벤트</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>시작 일시 (KST)</TableHead>
              <TableHead className="text-right">잔여 재고</TableHead>
              <TableHead className="text-right">총 재고</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  이벤트가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>
                  <EventStatusBadge status={event.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatKstDateTime(event.startAt)}
                </TableCell>
                <TableCell className="text-right">
                  {event.remainingStock.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{event.totalStock.toLocaleString()}</TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/events/${event.id}`}>
                      상세보기 <ArrowRightIcon />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
