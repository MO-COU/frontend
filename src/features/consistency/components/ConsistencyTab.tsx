import { ShieldCheckIcon } from 'lucide-react'

import { useIssueRun } from '@/hooks/useIssueRuns'
import { useConsistencyBatches, useTriggerConsistencyCheck } from '@/hooks/useConsistencyCheck'
import { formatKstDateTime } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsistencyResultCard } from '@/features/consistency/components/ConsistencyResultCard'

export function ConsistencyTab({ eventId }: { eventId: string }) {
  const { data: run, isLoading: isLoadingRun } = useIssueRun(eventId)
  const { data: batches, isLoading: isLoadingBatches } = useConsistencyBatches(eventId)
  const triggerCheck = useTriggerConsistencyCheck(eventId)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">정합성 검증</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            이 이벤트의 발급 실행을 대상으로 검증합니다. 같은 실행에 대해 여러 번 반복해서 검증할
            수 있습니다.
          </p>

          {!isLoadingRun && !run && (
            <p className="text-sm text-muted-foreground">
              실행 이력이 없습니다. 먼저 [실행] 탭에서 발급을 실행하세요.
            </p>
          )}

          {run && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {run.runId} · 요청 {run.requestedCount.toLocaleString()}건 ·{' '}
                {formatKstDateTime(run.startedAt)}
              </span>
              <Button onClick={() => triggerCheck.mutate()} disabled={triggerCheck.isPending}>
                <ShieldCheckIcon />
                {triggerCheck.isPending ? '검증 중...' : '정합성 검증 실행'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {run && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            검증 이력 {batches ? `(${batches.length}회)` : ''}
          </h2>

          {isLoadingBatches && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
          {!isLoadingBatches && (batches?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              아직 이 실행에 대해 실행한 검증이 없습니다.
            </p>
          )}

          {batches?.map((batch, idx) => (
            <div key={batch.batchId} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  검증 #{batches.length - idx} ({batch.batchId})
                </span>
                <span className="text-muted-foreground">{formatKstDateTime(batch.checkedAt)}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {batch.results.map((result) => (
                  <ConsistencyResultCard key={result.id} result={result} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
