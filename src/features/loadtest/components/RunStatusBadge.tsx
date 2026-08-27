import { CheckCircle2Icon, ClockIcon, DatabaseIcon, LoaderIcon, XCircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { LoadTestRunStatus } from '@/types/domain'

const LABEL: Record<LoadTestRunStatus, string> = {
  PENDING: '대기',
  RUNNING: 'k6 실행중',
  SYNCING: 'DB 적재중',
  SUCCESS: '완료',
  FAILED: '실패',
}

const VARIANT: Record<LoadTestRunStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'secondary',
  RUNNING: 'warning',
  SYNCING: 'warning',
  SUCCESS: 'success',
  FAILED: 'destructive',
}

const ICON: Record<LoadTestRunStatus, typeof ClockIcon> = {
  PENDING: ClockIcon,
  RUNNING: LoaderIcon,
  SYNCING: DatabaseIcon,
  SUCCESS: CheckCircle2Icon,
  FAILED: XCircleIcon,
}

export function RunStatusBadge({ status }: { status: LoadTestRunStatus }) {
  const Icon = ICON[status] ?? ClockIcon
  return (
    <Badge variant={VARIANT[status] ?? 'secondary'}>
      <Icon className={status === 'RUNNING' ? 'animate-spin' : undefined} />
      {LABEL[status] ?? status}
    </Badge>
  )
}
