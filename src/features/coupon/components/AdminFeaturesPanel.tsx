import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DlqFailurePanel } from '@/features/coupon/components/DlqFailurePanel'
import { ExpirationSchedulerToggle } from '@/features/coupon/components/ExpirationSchedulerToggle'
import { readLastCouponId } from '@/lib/lastCoupon'

/** 쿠폰 목록 화면에 접어둔 관리자 전용 기능 — 만료 스케줄러 on/off, DLQ 최종 실패 관리 */
export function AdminFeaturesPanel() {
  const [couponIdInput, setCouponIdInput] = useState(() => String(readLastCouponId() ?? ''))
  const parsed = Number(couponIdInput)
  const couponId = Number.isFinite(parsed) && parsed > 0 ? parsed : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">관리자 기능</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">만료 스케줄러</span>
          <div>
            <ExpirationSchedulerToggle />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">DLQ 최종 실패 관리</span>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dlqCouponId">쿠폰 ID</Label>
              <Input
                id="dlqCouponId"
                type="number"
                min={1}
                value={couponIdInput}
                onChange={(e) => setCouponIdInput(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
          <DlqFailurePanel couponId={couponId} />
        </div>
      </CardContent>
    </Card>
  )
}
