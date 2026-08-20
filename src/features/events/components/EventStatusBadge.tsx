import { Badge } from '@/components/ui/badge'
import type { CouponEventStatus } from '@/types/domain'

const STATUS_LABEL: Record<CouponEventStatus, string> = {
  SCHEDULED: '예정',
  OPEN: '진행중',
  CLOSED: '종료',
}

const STATUS_VARIANT: Record<CouponEventStatus, 'outline' | 'success' | 'secondary'> = {
  SCHEDULED: 'outline',
  OPEN: 'success',
  CLOSED: 'secondary',
}

export function EventStatusBadge({ status }: { status: CouponEventStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
