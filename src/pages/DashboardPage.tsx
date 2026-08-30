import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon, LayoutGridIcon, ListIcon, SettingsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminFeaturesPanel } from '@/features/coupon/components/AdminFeaturesPanel'
import { CouponGalleryView } from '@/features/coupon/components/CouponGalleryView'
import { CouponListView } from '@/features/coupon/components/CouponListView'
import { CreateCouponDialog } from '@/features/coupon/components/CreateCouponDialog'
import { useCouponList } from '@/hooks/useCoupons'
import { toErrorMessage } from '@/lib/http'
import { readLastCouponId } from '@/lib/lastCoupon'
import { cn } from '@/lib/utils'

type ViewMode = 'gallery' | 'list'
type RangeFilter = 'month' | 'year' | 'all'

const RANGE_LABEL: Record<RangeFilter, string> = {
  month: '최근 1개월',
  year: '최근 1년',
  all: '전체',
}
const RANGE_DAYS: Record<Exclude<RangeFilter, 'all'>, number> = { month: 30, year: 365 }

/** openAt 기준으로 최근 N일 이내에 열린 회차만 남긴다. 목록 API에 필터 파라미터가 없어 클라이언트에서 거른다. */
function withinRange(openAt: string, range: RangeFilter): boolean {
  if (range === 'all') return true
  const openedAt = new Date(openAt).getTime()
  const cutoffMs = RANGE_DAYS[range] * 24 * 60 * 60 * 1000
  return Date.now() - openedAt <= cutoffMs
}

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
  const [range, setRange] = useState<RangeFilter>('all')
  const [adminOpen, setAdminOpen] = useState(false)
  const { data: coupons, isLoading, error } = useCouponList()

  const filtered = useMemo(
    () => coupons?.filter((coupon) => withinRange(coupon.openAt, range)) ?? [],
    [coupons, range],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">쿠폰 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            LG U+ 멤버십 회원에게 제공되는 쿠폰 테스트 화면입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={adminOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAdminOpen((v) => !v)}
          >
            <SettingsIcon /> 관리자 기능
          </Button>
          <CreateCouponDialog />
        </div>
      </div>

      {adminOpen && <AdminFeaturesPanel />}

      {coupons && coupons.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(Object.keys(RANGE_LABEL) as RangeFilter[]).map((key) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className={cn(range === key && 'bg-background shadow-sm')}
                onClick={() => setRange(key)}
              >
                {RANGE_LABEL[key]}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
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

      {coupons && coupons.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {RANGE_LABEL[range]} 기간에 열린 쿠폰이 없습니다. 다른 기간을 선택해 보세요.
        </p>
      )}

      {filtered.length > 0 &&
        (view === 'gallery' ? (
          <CouponGalleryView coupons={filtered} />
        ) : (
          <CouponListView coupons={filtered} />
        ))}
    </div>
  )
}
