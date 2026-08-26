import { useEffect } from 'react'
import { LoaderIcon, ShieldCheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RuleResultCard } from '@/features/consistency/components/RuleResultCard'
import { VerdictBadge } from '@/features/consistency/components/VerdictBadge'
import { useLatestLoadTest } from '@/hooks/useLoadTest'
import {
  useLastVerificationRunId,
  useStartVerification,
  useVerification,
} from '@/hooks/useVerification'
import { formatKstDateTime } from '@/lib/dateUtils'
import { ApiError, toErrorMessage } from '@/lib/http'

export function ConsistencyTab({ couponId }: { couponId: number }) {
  const { runId, remember, forget } = useLastVerificationRunId()
  const { data: result, isLoading, error } = useVerification(runId)
  const startVerification = useStartVerification()
  const { data: latestRun } = useLatestLoadTest(couponId)

  // 초기화가 검증 이력을 지우면 들고 있던 runId가 죽는다. 에러를 띄우는 대신 조용히 버린다.
  const runIdIsStale = error instanceof ApiError && error.code === 'VERIFICATION_RUN_NOT_FOUND'
  useEffect(() => {
    if (runIdIsStale) forget()
  })

  const running = result?.status === 'RUNNING'

  const start = (issueRunId?: number) => {
    startVerification.mutate(issueRunId, {
      onSuccess: (started) => remember(started.runId),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">정합성 검증</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            8종 규칙으로 초과 발급·중복 발급·재고 불일치 등을 검사합니다. 300만 건을 훑기 때문에
            완료까지 1~2분이 걸리며, 실행하면 백그라운드로 돌면서 진행 상황이 아래에 갱신됩니다.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => start(undefined)}
              disabled={running || startVerification.isPending}
            >
              <ShieldCheckIcon />
              DB 전체 검증
            </Button>
            <Button
              variant="outline"
              onClick={() => start(latestRun?.runId)}
              disabled={running || startVerification.isPending || latestRun == null}
            >
              최근 부하테스트만 검증
              {latestRun && ` (run #${latestRun.runId})`}
            </Button>
          </div>

          {latestRun == null && (
            <p className="text-xs text-muted-foreground">
              부하테스트 실행 이력이 없으면 [DB 전체 검증]만 사용할 수 있습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {runId == null && (
        <p className="text-sm text-muted-foreground">아직 실행한 검증이 없습니다.</p>
      )}

      {runId != null && isLoading && (
        <p className="text-sm text-muted-foreground">검증 결과를 불러오는 중...</p>
      )}

      {error && !runIdIsStale && (
        <p className="text-sm text-destructive">
          {toErrorMessage(error, '검증 결과를 불러오지 못했습니다.')}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                검증 #{result.runId}
                {result.issueRunId != null
                  ? ` · 발급 실행 #${result.issueRunId} 대상`
                  : ' · DB 전체 대상'}
              </CardTitle>
              <VerdictBadge verdict={result.verdict} />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {running ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderIcon className="size-4 animate-spin" />
                  검증이 진행 중입니다. 2초마다 자동으로 갱신됩니다. (시작{' '}
                  {formatKstDateTime(result.startedAt)})
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {formatKstDateTime(result.startedAt)}
                  {result.finishedAt && ` ~ ${formatKstDateTime(result.finishedAt)}`}
                  {result.snapshotAt && ` · 스냅샷 ${formatKstDateTime(result.snapshotAt)}`}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
                  <span className="text-xs text-muted-foreground">전체 검사 건수</span>
                  <span className="text-2xl font-semibold">
                    {result.checkedCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
                  <span className="text-xs text-muted-foreground">전체 위반 건수</span>
                  <span className="text-2xl font-semibold">
                    {result.violationCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.rules.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {result.rules.map((rule) => (
                <RuleResultCard key={rule.ruleResultId} result={rule} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
