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
  const { runId, remember, forget } = useLastVerificationRunId(couponId)
  const { data: result, isLoading, error } = useVerification(runId)
  const startVerification = useStartVerification()
  const { data: latestRun } = useLatestLoadTest(couponId)

  // 초기화가 검증 이력을 지우면 들고 있던 runId가 죽는다. 에러를 띄우는 대신 조용히 버린다.
  const runIdIsStale = error instanceof ApiError && error.code === 'VERIFICATION_RUN_NOT_FOUND'
  useEffect(() => {
    if (runIdIsStale) forget()
  })

  const running = result?.status === 'RUNNING'

  // issueRunId는 검사 범위를 좁히지 않는다 — 항상 DB 전체(300만 건)를 훑는다.
  // 있으면 결과에 "이 부하테스트 직후에 돈 검증"이라는 시점 태그로만 같이 남는다.
  const start = () => {
    startVerification.mutate(latestRun?.runId, {
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
            8종 규칙으로 초과 발급·중복 발급·재고 불일치 등을 DB 전체(더미데이터 포함 300만 건)
            기준으로 검사합니다. 완료까지 1~2분이 걸리며, 실행하면 백그라운드로 돌면서 진행 상황이
            아래에 갱신됩니다.
          </p>

          <div>
            <Button onClick={start} disabled={running || startVerification.isPending}>
              <ShieldCheckIcon />
              정합성 검증 실행
            </Button>
          </div>
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
                {result.issueRunId != null &&
                  ` · 발급 실행 #${result.issueRunId} 직후 실행됨`}
              </CardTitle>
              <VerdictBadge verdict={result.verdict} />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {running ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderIcon className="size-4 animate-spin" />
                  검증이 진행 중입니다. (시작{' '}
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
