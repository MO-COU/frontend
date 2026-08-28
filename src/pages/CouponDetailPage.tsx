import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConsistencyTab } from '@/features/consistency/components/ConsistencyTab'
import { StockPanel } from '@/features/coupon/components/StockPanel'
import { IssueListTab } from '@/features/issues/components/IssueListTab'
import { LoadTestTab } from '@/features/loadtest/components/LoadTestTab'
import { useDeleteCoupon } from '@/hooks/useCoupons'
import { isRunning, useLatestLoadTest } from '@/hooks/useLoadTest'
import { useStock } from '@/hooks/useStock'
import { rememberCouponId } from '@/lib/lastCoupon'
import { toErrorMessage } from '@/lib/http'

export function CouponDetailPage() {
  const navigate = useNavigate()
  const { couponId: raw } = useParams<{ couponId: string }>()
  const couponId = Number(raw)
  const valid = Number.isFinite(couponId) && couponId > 0
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (valid) rememberCouponId(couponId)
  }, [valid, couponId])

  // 부하테스트가 도는 동안에는 재고를 1초마다 갱신한다
  const { data: latestRun } = useLatestLoadTest(valid ? couponId : null)
  const live = isRunning(latestRun)
  const { data: stock, isFetching, isLoading, error } = useStock(valid ? couponId : null, live)
  const deleteCoupon = useDeleteCoupon(() => navigate('/'))

  if (!valid) {
    return (
      <p className="text-sm text-destructive">쿠폰 ID가 올바르지 않습니다.</p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/">
            <ArrowLeftIcon /> 쿠폰 목록
          </Link>
        </Button>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleteCoupon.isPending}>
              <Trash2Icon /> 회차 삭제
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>회차 삭제 확인</DialogTitle>
              <DialogDescription>
                이 회차와 발급·이력·알림·실패 로그·정합성 검증 기록을 모두 지웁니다. 되돌릴 수
                없습니다. 종료된 회차이거나 부하 테스트가 진행 중이면 삭제가 거부됩니다.
                계속하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                취소
              </Button>
              <Button
                variant="destructive"
                disabled={deleteCoupon.isPending}
                onClick={() =>
                  deleteCoupon.mutate(couponId, { onSuccess: () => setDeleteOpen(false) })
                }
              >
                {deleteCoupon.isPending ? '삭제 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">재고를 불러오는 중...</p>}
      {error && (
        <p className="text-sm text-destructive">
          {toErrorMessage(error, '재고를 불러오지 못했습니다.')}
        </p>
      )}
      {stock && <StockPanel stock={stock} isFetching={isFetching} />}

      <Tabs defaultValue="loadtest">
        <TabsList>
          <TabsTrigger value="loadtest">실행</TabsTrigger>
          <TabsTrigger value="issues">리스트</TabsTrigger>
          <TabsTrigger value="consistency">정합성</TabsTrigger>
        </TabsList>
        <TabsContent value="loadtest">
          <LoadTestTab couponId={couponId} />
        </TabsContent>
        <TabsContent value="issues">
          <IssueListTab couponId={couponId} />
        </TabsContent>
        <TabsContent value="consistency">
          <ConsistencyTab couponId={couponId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
