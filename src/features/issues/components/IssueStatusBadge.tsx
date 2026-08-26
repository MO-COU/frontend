import { CircleDashedIcon, CircleIcon, ClockAlertIcon, TicketCheckIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { CouponIssueStatus } from '@/types/domain'

const LABEL: Record<CouponIssueStatus, string> = {
  UNISSUED: '미발급',
  ISSUED: '발급',
  USED: '사용',
  EXPIRED: '만료',
}

const VARIANT: Record<CouponIssueStatus, 'outline' | 'success' | 'secondary' | 'warning'> = {
  UNISSUED: 'outline',
  ISSUED: 'success',
  USED: 'secondary',
  EXPIRED: 'warning',
}

const ICON: Record<CouponIssueStatus, typeof CircleIcon> = {
  UNISSUED: CircleDashedIcon,
  ISSUED: CircleIcon,
  USED: TicketCheckIcon,
  EXPIRED: ClockAlertIcon,
}

export function IssueStatusBadge({ status }: { status: CouponIssueStatus }) {
  const Icon = ICON[status] ?? CircleDashedIcon
  return (
    <Badge variant={VARIANT[status] ?? 'outline'}>
      <Icon /> {LABEL[status] ?? status}
    </Badge>
  )
}
