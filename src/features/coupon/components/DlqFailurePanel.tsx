import { RotateCcwIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDlqFailures, useRetryDlqFailure } from '@/hooks/useDlqFailures'
import { formatKstDateTime } from '@/lib/dateUtils'
import { toErrorMessage } from '@/lib/http'

/** 복구 재시도까지 소진해 최종 실패로 확정된 발급 이벤트를 조회·재시도한다. */
export function DlqFailurePanel({ couponId }: { couponId: number | null }) {
  const { data: failures, isLoading, isFetching, error } = useDlqFailures(couponId)
  const retry = useRetryDlqFailure(couponId)

  if (couponId == null) {
    return <p className="text-sm text-muted-foreground">쿠폰 ID를 입력하면 DLQ 실패 목록을 조회합니다.</p>
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">DLQ 실패 목록을 불러오는 중...</p>
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {toErrorMessage(error, 'DLQ 실패 목록을 불러오지 못했습니다.')}
      </p>
    )
  }

  if (!failures || failures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        쿠폰 #{couponId} — 최종 실패로 확정된 항목이 없습니다.
        {isFetching && ' (새로고침 중...)'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          쿠폰 #{couponId} — 최종 실패 {failures.length.toLocaleString()}건
        </span>
        {isFetching && <span className="text-xs text-muted-foreground">새로고침 중...</span>}
      </div>
      <Table className="tabular-nums">
        <TableHeader>
          <TableRow>
            <TableHead>회원 ID</TableHead>
            <TableHead>순번</TableHead>
            <TableHead>실패 사유</TableHead>
            <TableHead>발생 시각</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {failures.map((failure) => (
            <TableRow key={failure.recordId}>
              <TableCell className="font-mono text-xs">{failure.memberId}</TableCell>
              <TableCell>#{failure.issueSequence.toLocaleString()}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {failure.failureReason ?? (
                  <Badge variant="outline">기록 없음(DB 장애)</Badge>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {failure.occurredAt ? formatKstDateTime(failure.occurredAt) : '—'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(failure.recordId)}
                >
                  <RotateCcwIcon /> 재시도
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
