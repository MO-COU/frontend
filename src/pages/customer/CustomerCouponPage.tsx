import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, TicketIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CouponStatusBadge } from '@/features/coupon/components/CouponStatusBadge'
import { useIssueCoupon } from '@/hooks/useCustomerIssue'
import { useStock } from '@/hooks/useStock'
import { formatKstDate, formatKstTime } from '@/lib/dateUtils'
import { toErrorMessage } from '@/lib/http'

function issueButtonLabel(status: string | undefined, remaining: number | undefined): string {
  if (status === 'SCHEDULED') return '아직 발급 전입니다'
  if (status === 'CLOSED') return '발급이 종료되었습니다'
  if (remaining != null && remaining <= 0) return '품절되었습니다'
  return '쿠폰 받기'
}

export function CustomerCouponPage() {
  const { couponId: raw } = useParams<{ couponId: string }>()
  const couponId = Number(raw)
  const valid = Number.isFinite(couponId) && couponId > 0

  const { data: stock, isLoading, error } = useStock(valid ? couponId : null)
  const issueCoupon = useIssueCoupon(couponId)

  if (!valid) {
    return <p className="text-sm text-destructive">쿠폰 ID가 올바르지 않습니다.</p>
  }

  // 재고 소진이거나 발급 가능 시간이 아니면 버튼을 비활성화한다 — OPEN이면서 재고가 남아야 눌린다.
  const canIssue = stock?.status === 'OPEN' && stock.remainingQuantity > 0

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
        <Link to="/shop">
          <ArrowLeftIcon /> 목록으로
        </Link>
      </Button>

      {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

      {error && (
        <p className="text-sm text-destructive">
          {toErrorMessage(error, '쿠폰 정보를 불러오지 못했습니다.')}
        </p>
      )}

      {stock && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <CardTitle className="text-lg">{stock.couponName}</CardTitle>
            <CouponStatusBadge status={stock.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">오픈일</dt>
                <dd className="font-medium">{formatKstDate(stock.openAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">오픈 시각</dt>
                <dd>{formatKstTime(stock.openAt)}</dd>
              </div>
            </dl>

            <Button
              size="lg"
              className="w-full"
              disabled={!canIssue || issueCoupon.isPending}
              onClick={() => issueCoupon.mutate()}
            >
              <TicketIcon />
              {issueCoupon.isPending ? '받는 중...' : issueButtonLabel(stock.status, stock.remainingQuantity)}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
