import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CouponStatusBadge } from '@/features/coupon/components/CouponStatusBadge'
import { formatKstDateTime } from '@/lib/dateUtils'
import type { AdminCouponSummary } from '@/types/domain'

export function CouponGalleryView({ coupons }: { coupons: AdminCouponSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {coupons.map((coupon) => (
        <Card key={coupon.couponId}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{coupon.name}</CardTitle>
              <CouponStatusBadge status={coupon.status} />
            </div>
            <CardDescription>쿠폰 #{coupon.couponId}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">총 수량</dt>
                <dd className="font-medium">{coupon.totalQuantity.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">오픈</dt>
                <dd className="text-xs">{formatKstDateTime(coupon.openAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">종료</dt>
                <dd className="text-xs">
                  {formatKstDateTime(coupon.closeAt)}
                </dd>
              </div>
            </dl>
            <Button asChild size="sm" className="mt-1 self-start">
              <Link to={`/coupons/${coupon.couponId}`}>
                상세보기 <ArrowRightIcon />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
