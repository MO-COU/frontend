import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon, LayoutGridIcon, ListIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CouponGalleryView } from '@/features/coupon/components/CouponGalleryView'
import { CouponListView } from '@/features/coupon/components/CouponListView'
import { CreateCouponDialog } from '@/features/coupon/components/CreateCouponDialog'
import { useCouponList } from '@/hooks/useCoupons'
import { toErrorMessage } from '@/lib/http'
import { readLastCouponId } from '@/lib/lastCoupon'
import { cn } from '@/lib/utils'

type ViewMode = 'gallery' | 'list'

/** 목록 API가 아직 없을 때를 위한 폴백 — ID를 알면 바로 상세로 갈 수 있게 한다 */
function OpenByIdFallback() {
  const navigate = useNavigate()
  const [couponId, setCouponId] = useState(() => String(readLastCouponId() ?? 1))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ID로 바로 열기</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            const parsed = Number(couponId)
            if (Number.isFinite(parsed) && parsed > 0) navigate(`/coupons/${parsed}`)
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="couponId">쿠폰 ID</Label>
            <Input
              id="couponId"
              type="number"
              min={1}
              value={couponId}
              onChange={(e) => setCouponId(e.target.value)}
              className="w-40"
            />
          </div>
          <Button type="submit">
            열기 <ArrowRightIcon />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [view, setView] = useState<ViewMode>('gallery')
  const { data: coupons, isLoading, error } = useCouponList()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">쿠폰 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            쿠폰별 재고 현황 · 부하테스트 실행 · 발급 리스트 · 정합성 검증을 확인합니다.
          </p>
        </div>
        <CreateCouponDialog />
      </div>

      {coupons && coupons.length > 0 && (
        <div className="flex items-center gap-1 self-end rounded-lg bg-muted p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(view === 'gallery' && 'bg-background shadow-sm')}
            onClick={() => setView('gallery')}
          >
            <LayoutGridIcon /> 갤러리
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(view === 'list' && 'bg-background shadow-sm')}
            onClick={() => setView('list')}
          >
            <ListIcon /> 리스트
          </Button>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">쿠폰 목록을 불러오는 중...</p>}

      {error && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-destructive">
            {toErrorMessage(error, '쿠폰 목록을 불러오지 못했습니다.')} — 목록 API(
            <code className="font-mono text-xs">GET /api/admin/coupons</code>)가 아직 백엔드에
            없으면 정상입니다.
          </p>
          <OpenByIdFallback />
        </div>
      )}

      {coupons && coupons.length === 0 && (
        <p className="text-sm text-muted-foreground">
          등록된 쿠폰이 없습니다. [쿠폰 추가]로 만들어 보세요.
        </p>
      )}

      {coupons &&
        coupons.length > 0 &&
        (view === 'gallery' ? (
          <CouponGalleryView coupons={coupons} />
        ) : (
          <CouponListView coupons={coupons} />
        ))}
    </div>
  )
}
