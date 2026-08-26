import { CalendarClockIcon, CircleCheckIcon, CircleSlashIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { CouponStatus } from '@/types/domain'

const LABEL: Record<CouponStatus, string> = {
  SCHEDULED: '예정',
  OPEN: '진행중',
  CLOSED: '종료',
}

const VARIANT: Record<CouponStatus, 'outline' | 'success' | 'secondary'> = {
  SCHEDULED: 'outline',
  OPEN: 'success',
  CLOSED: 'secondary',
}

const ICON: Record<CouponStatus, typeof CalendarClockIcon> = {
  SCHEDULED: CalendarClockIcon,
  OPEN: CircleCheckIcon,
  CLOSED: CircleSlashIcon,
}

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  // 서버가 아직 모르는 값을 보내도 화면이 깨지지 않게 방어한다
  const label = LABEL[status] ?? status
  const Icon = ICON[status] ?? CalendarClockIcon

  return (
    <Badge variant={VARIANT[status] ?? 'outline'}>
      <Icon /> {label}
    </Badge>
  )
}
