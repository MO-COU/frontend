import { RefreshCwIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StackedMeter } from '@/components/ui/stacked-meter'
import { cn } from '@/lib/utils'
import type { AdminCouponNotificationCounts } from '@/types/domain'

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value.toLocaleString()}</span>
    </div>
  )
}

export function NotificationCountsPanel({
  counts,
  isFetching,
}: {
  counts: AdminCouponNotificationCounts
  isFetching: boolean
}) {
  const hasAny = counts.totalCount > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">알림 처리 현황</CardTitle>
          <p className="text-xs text-muted-foreground">
            발급 성공 이벤트가 DB에 반영된 뒤 outbox가 비동기로 발송한다. 부하테스트 직후에도
            잠시 대기 건수가 남아 있을 수 있다.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCwIcon className={cn('size-3', isFetching && 'animate-spin')} />
          실시간
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">아직 발송 대상 알림이 없습니다.</p>
        ) : (
          <>
            <StackedMeter
              total={counts.totalCount}
              segments={[
                { label: '완료', value: counts.sentCount, color: 'var(--success)' },
                { label: '대기', value: counts.pendingCount, color: 'var(--warning)' },
                { label: '실패', value: counts.failedCount, color: 'var(--destructive)' },
              ]}
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="전체" value={counts.totalCount} />
              <Tile label="완료" value={counts.sentCount} />
              <Tile label="대기" value={counts.pendingCount} />
              <Tile label="실패" value={counts.failedCount} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
