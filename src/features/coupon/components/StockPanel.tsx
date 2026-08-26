import { AlertTriangleIcon, CheckIcon, RefreshCwIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Meter } from '@/components/ui/meter'
import { CouponStatusBadge } from '@/features/coupon/components/CouponStatusBadge'
import { formatKstDateTime } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import type { AdminCouponStock } from '@/types/domain'

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint?: string
  tone?: 'warning' | 'success'
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-xl font-semibold',
          tone === 'warning' && 'text-warning-foreground',
        )}
      >
        {value.toLocaleString()}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function StockPanel({
  stock,
  isFetching,
}: {
  stock: AdminCouponStock
  isFetching: boolean
}) {
  const issueRate = stock.totalQuantity > 0 ? stock.issuedQuantity / stock.totalQuantity : 0
  const hasSyncGap = stock.syncGapQuantity > 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{stock.couponName}</h2>
              <CouponStatusBadge status={stock.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              쿠폰 #{stock.couponId} · 오픈 {formatKstDateTime(stock.openAt)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCwIcon className={cn('size-3', isFetching && 'animate-spin')} />
            {formatKstDateTime(stock.updatedAt)} 기준
          </div>
        </div>

        {/* 이 화면이 이끄는 하나의 숫자 — 실시간 발급 수 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight">
              {stock.issuedQuantity.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / {stock.totalQuantity.toLocaleString()} 발급 ({(issueRate * 100).toFixed(1)}%)
            </span>
          </div>
          <Meter
            value={stock.issuedQuantity}
            max={stock.totalQuantity}
            label="발급 진행률"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="총 재고" value={stock.totalQuantity} />
          <StatTile
            label="DB 반영 발급"
            value={stock.dbIssuedQuantity}
            hint="실제로 적재된 건수"
          />
          <StatTile
            label="동기화 지연"
            value={stock.syncGapQuantity}
            hint={hasSyncGap ? 'Redis→DB 반영 대기' : '지연 없음'}
            tone={hasSyncGap ? 'warning' : undefined}
          />
          <StatTile label="잔여 재고" value={stock.remainingQuantity} hint="실시간(Redis)" />
        </div>

        {/* 상태는 색만으로 말하지 않는다 — 아이콘과 문구를 함께 붙인다 */}
        {hasSyncGap ? (
          <p className="flex items-center gap-1.5 text-xs text-warning-foreground">
            <AlertTriangleIcon className="size-3.5 shrink-0" />
            발급 {stock.syncGapQuantity.toLocaleString()}건이 아직 DB에 반영되지 않았습니다.
            반영이 끝나기 전에는 초기화가 거부됩니다.
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckIcon className="size-3.5 shrink-0" />
            Redis 발급 수와 DB 적재 건수가 일치합니다.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
