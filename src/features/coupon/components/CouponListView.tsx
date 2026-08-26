import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CouponStatusBadge } from '@/features/coupon/components/CouponStatusBadge'
import { formatKstDateTime } from '@/lib/dateUtils'
import type { AdminCouponSummary } from '@/types/domain'

export function CouponListView({ coupons }: { coupons: AdminCouponSummary[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table className="tabular-nums">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>쿠폰</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">총 수량</TableHead>
              <TableHead>오픈</TableHead>
              <TableHead>종료</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  쿠폰이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {coupons.map((coupon) => (
              <TableRow key={coupon.couponId}>
                <TableCell className="font-mono text-xs">{coupon.couponId}</TableCell>
                <TableCell className="font-medium">{coupon.name}</TableCell>
                <TableCell>
                  <CouponStatusBadge status={coupon.status} />
                </TableCell>
                <TableCell className="text-right">
                  {coupon.totalQuantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatKstDateTime(coupon.openAt)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatKstDateTime(coupon.closeAt)}
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/coupons/${coupon.couponId}`}>
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
