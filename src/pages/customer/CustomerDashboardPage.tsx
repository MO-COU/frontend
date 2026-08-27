import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CouponStatusBadge } from '@/features/coupon/components/CouponStatusBadge'
import { useCouponList } from '@/hooks/useCoupons'
import { formatKstDate, formatKstTime } from '@/lib/dateUtils'
import { toErrorMessage } from '@/lib/http'

export function CustomerDashboardPage() {
  const { data: coupons, isLoading, error } = useCouponList()

  // 종료된 회차는 고객에게 보여줄 이유가 없다. 예정·진행중만 남긴다.
  const visible = useMemo(
    () => coupons?.filter((coupon) => coupon.status !== 'CLOSED') ?? [],
    [coupons],
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">이번 주 쿠폰</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          진행 중이거나 곧 시작하는 쿠폰입니다. 카드를 눌러 받아보세요.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

      {error && (
        <p className="text-sm text-destructive">
          {toErrorMessage(error, '쿠폰 목록을 불러오지 못했습니다.')}
        </p>
      )}

      {coupons && visible.length === 0 && (
        <p className="text-sm text-muted-foreground">지금 받을 수 있는 쿠폰이 없습니다.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((coupon) => (
          <Link key={coupon.couponId} to={`/shop/coupons/${coupon.couponId}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{coupon.name}</CardTitle>
                  <CouponStatusBadge status={coupon.status} />
                </div>
                <CardDescription>총 {coupon.totalQuantity.toLocaleString()}장</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <dl className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">오픈일</dt>
                    <dd className="font-medium">{formatKstDate(coupon.openAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">오픈 시각</dt>
                    <dd>{formatKstTime(coupon.openAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">종료 시각</dt>
                    <dd>{formatKstTime(coupon.closeAt)}</dd>
                  </div>
                </dl>
                <span className="mt-1 flex items-center gap-1 self-start text-sm font-medium text-primary">
                  쿠폰 받으러 가기 <ArrowRightIcon className="size-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
