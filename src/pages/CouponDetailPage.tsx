import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConsistencyTab } from '@/features/consistency/components/ConsistencyTab'
import { StockPanel } from '@/features/coupon/components/StockPanel'
import { IssueListTab } from '@/features/issues/components/IssueListTab'
import { LoadTestTab } from '@/features/loadtest/components/LoadTestTab'
import { isRunning, useLatestLoadTest } from '@/hooks/useLoadTest'
import { useStock } from '@/hooks/useStock'
import { rememberCouponId } from '@/lib/lastCoupon'
import { toErrorMessage } from '@/lib/http'

export function CouponDetailPage() {
  const { couponId: raw } = useParams<{ couponId: string }>()
  const couponId = Number(raw)
  const valid = Number.isFinite(couponId) && couponId > 0

  useEffect(() => {
    if (valid) rememberCouponId(couponId)
  }, [valid, couponId])

  // 부하테스트가 도는 동안에는 재고를 1초마다 갱신한다
  const { data: latestRun } = useLatestLoadTest(valid ? couponId : null)
  const live = isRunning(latestRun)
  const { data: stock, isFetching, isLoading, error } = useStock(valid ? couponId : null, live)

  if (!valid) {
    return (
      <p className="text-sm text-destructive">쿠폰 ID가 올바르지 않습니다.</p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
        <Link to="/">
          <ArrowLeftIcon /> 쿠폰 목록
        </Link>
      </Button>

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
