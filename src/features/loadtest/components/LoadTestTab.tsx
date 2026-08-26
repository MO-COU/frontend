import { useState } from 'react'
import { PlayIcon, RotateCcwIcon } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RunStatusBadge } from '@/features/loadtest/components/RunStatusBadge'
import {
  isRunning,
  useLatestLoadTest,
  useResetLoadTest,
  useStartLoadTest,
} from '@/hooks/useLoadTest'
import { formatKstDateTime } from '@/lib/dateUtils'
import type { CouponIssueRun } from '@/types/domain'

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  )
}

function RunResult({ run }: { run: CouponIssueRun }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">실행 결과</CardTitle>
        <RunStatusBadge status={run.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          run #{run.runId}
          {run.scenarioVersion && ` · 시나리오 ${run.scenarioVersion}`}
          {run.vus != null && ` · VU ${run.vus.toLocaleString()}`}
          {run.rampUpSeconds != null && ` · ramp-up ${run.rampUpSeconds}s`}
          {' · '}
          {formatKstDateTime(run.startedAt)}
          {run.finishedAt && ` ~ ${formatKstDateTime(run.finishedAt)}`}
        </p>

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

export function LoadTestTab({ couponId }: { couponId: number }) {
  const [scenarioVersion, setScenarioVersion] = useState('1')
  const [vus, setVus] = useState(1000)
  const [rampUpSeconds, setRampUpSeconds] = useState(10)
  const [resetOpen, setResetOpen] = useState(false)

  const { data: run, isLoading, isError } = useLatestLoadTest(couponId)
  const startLoadTest = useStartLoadTest(couponId)
  const resetLoadTest = useResetLoadTest(couponId)

  const running = isRunning(run)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">부하테스트 실행</CardTitle>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={resetLoadTest.isPending}>
                <RotateCcwIcon /> 초기화
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>초기화 확인</DialogTitle>
                <DialogDescription>
                  현재 발급 중인 쿠폰의 발급 건·상태 이력·실패 로그·알림·정합성 검증 기록을 모두
                  삭제하고 재고를 되돌립니다. 초기화만 수행하며, 다시 실행하려면 [부하테스트 시작]을
                  별도로 눌러야 합니다. 계속하시겠습니까?
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
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scenarioVersion">시나리오</Label>
              <Input
                id="scenarioVersion"
                value={scenarioVersion}
                onChange={(e) => setScenarioVersion(e.target.value)}
                className="w-32"
                disabled={running}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vus">동시 사용자(VU)</Label>
              <Input
                id="vus"
                type="number"
                min={1}
                value={vus}
                onChange={(e) => setVus(Number(e.target.value))}
                className="w-36"
                disabled={running}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rampUpSeconds">ramp-up (초)</Label>
              <Input
                id="rampUpSeconds"
                type="number"
                min={0}
                value={rampUpSeconds}
                onChange={(e) => setRampUpSeconds(Number(e.target.value))}
                className="w-32"
                disabled={running}
              />
            </div>
            <Button
              disabled={running || startLoadTest.isPending}
              onClick={() => startLoadTest.mutate({ scenarioVersion, vus, rampUpSeconds })}
            >
              <PlayIcon />
              {running ? '실행 중...' : '부하테스트 시작'}
            </Button>
          </div>

          {running && (
            <p className="text-sm text-muted-foreground">
              실행 중입니다. 위 재고 현황이 1초마다 갱신됩니다.
            </p>
          )}
          {isError && (
            <p className="text-sm text-muted-foreground">
              실행 이력을 불러오지 못했습니다. 부하테스트 실행 API가 아직 백엔드에 없으면 정상입니다.
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
      {!isLoading && !run && !isError && (
        <p className="text-sm text-muted-foreground">아직 실행 이력이 없습니다.</p>
      )}
      {run && <RunResult run={run} />}
    </div>
  )
}
