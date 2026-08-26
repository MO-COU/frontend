import { CheckCircle2Icon, ClockIcon, LoaderIcon, XCircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { IssueRunStatus } from '@/types/domain'

const LABEL: Record<IssueRunStatus, string> = {
  PENDING: '대기',
  RUNNING: '실행중',
  SUCCESS: '완료',
  FAILED: '실패',
}

const VARIANT: Record<IssueRunStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'secondary',
  RUNNING: 'warning',
  SUCCESS: 'success',
  FAILED: 'destructive',
}

const ICON: Record<IssueRunStatus, typeof ClockIcon> = {
  PENDING: ClockIcon,
  RUNNING: LoaderIcon,
  SUCCESS: CheckCircle2Icon,
  FAILED: XCircleIcon,
}

export function RunStatusBadge({ status }: { status: IssueRunStatus }) {
  const Icon = ICON[status] ?? ClockIcon
  return (
    <Badge variant={VARIANT[status] ?? 'secondary'}>
      <Icon className={status === 'RUNNING' ? 'animate-spin' : undefined} />
      {LABEL[status] ?? status}
    </Badge>
  )
}
