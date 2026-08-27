import { useState } from 'react'
import { ChevronDownIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { IssueResultPanel } from '@/features/loadtest/components/IssueResultPanel'
import { RunStatusBadge } from '@/features/loadtest/components/RunStatusBadge'
import { useIssueResultCounts } from '@/hooks/useIssueResultCounts'
import {
  isRunning,
  useLastLoadTestRunId,
  useLoadTestRun,
  useResetLoadTest,
  useStartLoadTest,
} from '@/hooks/useLoadTest'
import { formatKstDateTime } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import {
  LOAD_TEST_SCENARIOS,
  type LoadTestRunResponse,
  type LoadTestScenario,
} from '@/types/domain'

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  )
}

function RunResult({ run }: { run: LoadTestRunResponse }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">실행 결과</CardTitle>
        <RunStatusBadge status={run.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            run #{run.runId} · {run.scenario} · VU {run.users.toLocaleString()}
            {run.rampUpSeconds > 0 && ` · ramp-up ${run.rampUpSeconds}s`}
          </p>
          <p>
            시작 {formatKstDateTime(run.startedAt)}
            {run.finishedAt && ` · k6 종료 ${formatKstDateTime(run.finishedAt)}`}
            {run.dbSyncFinishedAt && ` · DB 적재 완료 ${formatKstDateTime(run.dbSyncFinishedAt)}`}
          </p>
        </div>

        {run.status === 'SYNCING' && (
          <p className="text-sm text-muted-foreground">
            k6는 끝났고 Redis 발급 이벤트가 DB에 모두 적재되기를 기다리는 중입니다. 아래 수치는 DB
            적재가 끝나야 정합성 비교에 쓸 수 있습니다.
          </p>
        )}
        {run.message && <p className="text-sm text-muted-foreground">{run.message}</p>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <ResultTile label="요청" value={run.requestedCount.toLocaleString()} />
          <ResultTile label="발급 성공" value={run.issuedCount.toLocaleString()} />
          <ResultTile label="재고 소진 거절" value={run.soldOutCount.toLocaleString()} />
          <ResultTile label="중복 발급 거절" value={run.duplicateCount.toLocaleString()} />
          <ResultTile label="오류(5xx)" value={run.errorCount.toLocaleString()} />
          <ResultTile label="p95 응답" value={run.p95Ms != null ? `${run.p95Ms}ms` : '—'} />
        </div>
      </CardContent>
    </Card>
  )
}

function ScenarioPicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: LoadTestScenario
  onSelect: (scenario: LoadTestScenario) => void
  disabled: boolean
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {LOAD_TEST_SCENARIOS.map((scenario) => {
        const active = scenario.value === selected
        return (
          <button
            key={scenario.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onSelect(scenario.value)}
            className={cn(
              'flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring/50 outline-none',
              'disabled:pointer-events-none disabled:opacity-50',
              active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{scenario.label}</span>
              <Badge variant={scenario.required ? 'default' : 'outline'}>
                {scenario.required ? '필수' : '추가'}
              </Badge>
            </span>
            <span className="text-xs text-muted-foreground">
              {scenario.users} · ramp-up {scenario.rampUp}
            </span>
            <span className="text-xs text-muted-foreground">{scenario.requests}</span>
            <span className="text-xs text-muted-foreground">확인 목적: {scenario.purpose}</span>
          </button>
        )
      })}
    </div>
  )
}

export function LoadTestTab({ couponId }: { couponId: number }) {
  const [scenario, setScenario] = useState<LoadTestScenario>('V1_RAMP_20000')
  const [resetOpen, setResetOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const selectedScenario = LOAD_TEST_SCENARIOS.find((s) => s.value === scenario)

  const { runId, remember, forget } = useLastLoadTestRunId(couponId)
  const { data: run, isLoading, isError } = useLoadTestRun(runId)
  const startLoadTest = useStartLoadTest(couponId, remember)
  // 초기화는 실행 기록까지 지우므로, 들고 있던 runId도 같이 버려야 404를 안 본다.
  const resetLoadTest = useResetLoadTest(couponId, forget)

  const running = isRunning(run)

  // 부하가 걸리는 중에는 더 자주 본다. 실행 API를 안 거치고 k6가 밖에서 때려도 값이 움직인다.
  const { data: counts, isFetching: isFetchingCounts } = useIssueResultCounts(couponId, running)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">쿠폰 발급</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              disabled={running || startLoadTest.isPending}
              onClick={() => startLoadTest.mutate(scenario)}
            >
              <PlayIcon />
              {running ? '실행 중...' : '쿠폰 발급 시작'}
            </Button>
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={running || resetLoadTest.isPending}
                >
                  <RotateCcwIcon /> 초기화
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>초기화 확인</DialogTitle>
                  <DialogDescription>
                    이 회차의 발급 건·상태 이력·실패 로그·알림·정합성 검증 기록을 모두 삭제하고 재고를
                    되돌립니다. 이전 실행 결과도 함께 사라지므로, 결과를 남겨야 한다면 새 회차를
                    만드는 편이 낫습니다. 계속하시겠습니까?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetOpen(false)}>
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={resetLoadTest.isPending}
                    onClick={() =>
                      resetLoadTest.mutate(undefined, { onSuccess: () => setResetOpen(false) })
                    }
                  >
                    {resetLoadTest.isPending ? '초기화 중...' : '초기화'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-expanded={pickerOpen}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            <ChevronDownIcon
              className={cn('size-4 transition-transform', pickerOpen && 'rotate-180')}
            />
            시나리오: {selectedScenario?.label ?? scenario}
            <span className="text-muted-foreground">{pickerOpen ? '접기' : '변경'}</span>
          </button>

          {pickerOpen && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                시나리오를 하나 고르면 k6 서버에서 그대로 실행됩니다. VU·ramp-up은 시나리오에 고정된
                값이라 따로 바꿀 수 없습니다. 대상 회차는 OPEN이면서 발급 이력이 없어야 합니다.
              </p>
              <ScenarioPicker selected={scenario} onSelect={setScenario} disabled={running} />
            </div>
          )}

          {running && (
            <p className="text-sm text-muted-foreground">
              실행 중입니다. 아래 발급 현황이 1초마다 갱신됩니다.
            </p>
          )}
          {isError && (
            <p className="text-sm text-muted-foreground">
              직전 실행 기록(run #{runId})을 불러오지 못했습니다. 초기화로 지워졌을 수 있습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {counts && <IssueResultPanel counts={counts} isFetching={isFetchingCounts} />}

      {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
      {!isLoading && !run && !isError && (
        <p className="text-sm text-muted-foreground">
          이 브라우저에서 시작한 실행 이력이 없습니다.
        </p>
      )}
      {run && <RunResult run={run} />}
    </div>
  )
}
