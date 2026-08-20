import { Badge } from '@/components/ui/badge'
import type { IssueRunStatus } from '@/types/domain'

const STATUS_LABEL: Record<IssueRunStatus, string> = {
  PENDING: '대기',
  RUNNING: '실행중',
  SUCCESS: '성공',
  FAILED: '실패',
}

const STATUS_VARIANT: Record<IssueRunStatus, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'secondary',
  RUNNING: 'warning',
  SUCCESS: 'success',
  FAILED: 'destructive',
}

export function RunStatusBadge({ status }: { status: IssueRunStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
