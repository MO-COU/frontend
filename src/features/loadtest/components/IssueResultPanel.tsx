import { AlertTriangleIcon, CheckIcon, RefreshCwIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StackedMeter } from '@/components/ui/stacked-meter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { AdminCouponIssueResultCounts } from '@/types/domain'

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint?: string
  tone?: 'warning'
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-xl font-semibold', tone === 'warning' && 'text-warning-foreground')}>
        {value.toLocaleString()}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

/**
 * 거절 사유를 성격별로 나눈다. 여섯 개를 한 덩어리로 늘어놓으면 "정상적으로 막은 것"과
 * "Redis 준비가 안 된 운영 이상"이 같은 무게로 읽힌다.
 *
 * - blocked: 시스템이 제대로 막은 결과. 기본 부하 시나리오에서 발생한다.
 * - window: 발급 기간 밖 요청. 기본 시나리오에서는 발생하지 않는다.
 * - ops: 사용자 입력 오류가 아니라 Redis 준비 누락·키 유실 신호. 0이 아니면 손봐야 한다.
 */
type RejectionKind = 'blocked' | 'window' | 'ops'

const KIND_LABEL: Record<RejectionKind, string> = {
  blocked: '정상 차단',
  window: '기간 밖',
  ops: '운영 이상',
}

const REJECTION_ROWS: Array<{
  key: keyof AdminCouponIssueResultCounts
  label: string
  kind: RejectionKind
  meaning: string
}> = [
  {
    key: 'soldOut',
    label: '재고 소진',
    kind: 'blocked',
    meaning: 'Redis 재고가 0 이하 — 초과 발급을 막은 횟수',
  },
  {
    key: 'duplicateIssue',
    label: '중복 발급',
    kind: 'blocked',
    meaning: '이미 issued-members에 있는 회원의 재요청 — 1인 1매를 막은 횟수',
  },
  {
    key: 'notOpenYet',
    label: '오픈 전',
    kind: 'window',
    meaning: 'Redis 시간이 openAt보다 이른 요청',
  },
  {
    key: 'issueClosed',
    label: '발급 종료',
    kind: 'window',
    meaning: 'Redis 시간이 closeAt을 지난 요청',
  },
  {
    key: 'stockNotInitialized',
    label: '재고 미초기화',
    kind: 'ops',
    meaning: 'coupon:{id}:stock 키가 없음 → 발급 API가 503으로 거절',
  },
  {
    key: 'metadataNotInitialized',
    label: '메타데이터 미초기화',
    kind: 'ops',
    meaning: '발급 기간 Hash 필드가 없음 → 발급 API가 503으로 거절',
  },
]

export function IssueResultPanel({
  counts,
  isFetching,
}: {
  counts: AdminCouponIssueResultCounts
  isFetching: boolean
}) {
  const hasTraffic = counts.totalRequests > 0
  const hasPending = counts.pendingOrRetrying > 0
  const hasCompensated = counts.compensated > 0
  const notReadyCount = counts.stockNotInitialized + counts.metadataNotInitialized

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">발급 결과 (Redis 누적 집계)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Lua가 원자적으로 올린 현재 누적값을 그대로 읽습니다. 과거 시점의 변화나 초당 처리량은
            남지 않습니다.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCwIcon className={cn('size-3', isFetching && 'animate-spin')} />
          실시간
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {!hasTraffic ? (
          <p className="text-sm text-muted-foreground">
            아직 이 회차로 들어온 발급 요청이 없습니다. 부하 테스트를 돌리면 여기에 집계됩니다.
          </p>
        ) : (
          <>
            {/* 요청이 어떻게 갈렸는가 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">
                  {counts.totalRequests.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  전체 요청 = 예약 + 거절 (보상은 새 요청이 아니라 합계에서 빠집니다)
                </span>
              </div>
              <StackedMeter
                total={counts.totalRequests}
                segments={[
                  { label: '예약 성공', value: counts.reserved, color: 'var(--success)' },
                  { label: '거절', value: counts.failed, color: 'var(--muted-foreground)' },
                ]}
              />
            </div>

            {/* Redis 예약이 DB까지 내려갔는가 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Redis 예약 → DB 적재</h3>
              <StackedMeter
                total={counts.reserved}
                segments={[
                  { label: 'DB 적재 완료', value: counts.dbPersisted, color: 'var(--success)' },
                  { label: '처리·재시도 중', value: counts.pendingOrRetrying, color: 'var(--warning)' },
                  { label: '보상 완료', value: counts.compensated, color: 'var(--destructive)' },
                ]}
              />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Tile label="예약 성공" value={counts.reserved} hint="Redis Lua가 수락" />
                <Tile label="DB 적재" value={counts.dbPersisted} hint="coupon_issue 행 수" />
                <Tile
                  label="처리·재시도 중"
                  value={counts.pendingOrRetrying}
                  hint={hasPending ? '아직 DB 미반영' : '밀린 건 없음'}
                  tone={hasPending ? 'warning' : undefined}
                />
                <Tile
                  label="보상 완료"
                  value={counts.compensated}
                  hint={hasCompensated ? '재고·발급자 원복됨' : '원복 없음'}
                  tone={hasCompensated ? 'warning' : undefined}
                />
              </div>

              {/* 상태는 색만으로 말하지 않는다. 원복·대기·완료를 뭉뚱그리지 않는다 */}
              {hasCompensated && (
                <p className="flex items-center gap-1.5 text-xs text-warning-foreground">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  DB 반영 재시도 한도를 넘겨 예약 {counts.compensated.toLocaleString()}건이
                  원복됐습니다 — 회원이 issued-members에서 빠지고 재고가 되돌아갔습니다.
                </p>
              )}
              {hasPending && (
                <p className="flex items-center gap-1.5 text-xs text-warning-foreground">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  예약 {counts.pendingOrRetrying.toLocaleString()}건이 아직 DB에 닿지 않았습니다.
                  동기화 컨슈머가 꺼져 있으면 이 값은 줄지 않습니다
                  (<code className="font-mono">mocou.issue.sync.enabled</code>).
                </p>
              )}
              {!hasCompensated && !hasPending && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckIcon className="size-3.5 shrink-0" />
                  수락된 예약이 모두 DB에 적재됐고 원복된 건이 없습니다.
                </p>
              )}
            </div>

            {/* 무엇이 얼마나 막혔는가 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">
                거절 사유{' '}
                <span className="text-muted-foreground">
                  ({counts.failed.toLocaleString()}건)
                </span>
              </h3>

              {notReadyCount > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  Redis 발급 준비가 안 된 상태에서 {notReadyCount.toLocaleString()}건이 거절됐습니다.
                  사용자 잘못이 아니라 키 초기화 누락·유실 신호입니다.
                </p>
              )}

              <Table className="tabular-nums">
                <TableHeader>
                  <TableRow>
                    <TableHead>사유</TableHead>
                    <TableHead className="text-right">건수</TableHead>
                    <TableHead>구분</TableHead>
                    <TableHead>의미</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REJECTION_ROWS.map((row) => {
                    const value = counts[row.key] as number
                    const isProblem = row.kind === 'ops' && value > 0
                    return (
                      <TableRow key={row.key}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell
                          className={cn(
                            'text-right',
                            value === 0 && 'text-muted-foreground',
                            isProblem && 'text-destructive',
                          )}
                        >
                          {value.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isProblem ? 'destructive' : 'outline'}>
                            {KIND_LABEL[row.kind]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.meaning}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <p className="text-xs text-muted-foreground">
                기본 부하 시나리오에서는 <span className="font-medium">정상 차단</span>만 발생합니다.
                <span className="font-medium"> 기간 밖</span>은 발급 기간을 벗어난 요청,
                <span className="font-medium"> 운영 이상</span>은 0이어야 정상입니다.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
