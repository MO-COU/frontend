import { useState } from 'react'

import { useIssueRun, useTriggerRun } from '@/hooks/useIssueRuns'
import { formatKstDateTime } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RunStatusBadge } from '@/features/events/components/RunStatusBadge'

export function RunTab({ eventId }: { eventId: string }) {
  const [requestCount, setRequestCount] = useState(1000)
  const [open, setOpen] = useState(false)
  const { data: run, isLoading } = useIssueRun(eventId)
  const triggerRun = useTriggerRun(eventId)

  const handleConfirm = () => {
    triggerRun.mutate(requestCount, {
      onSuccess: () => setOpen(false),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">발급 실행</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!isLoading && run && (
            <p className="text-sm text-muted-foreground">
              이 이벤트는 이미 실행되었습니다. 이벤트당 실행은 1회만 가능합니다.
            </p>
          )}
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="requestCount">동시 요청 수</Label>
              <Input
                id="requestCount"
                type="number"
                min={1}
                value={requestCount}
                onChange={(e) => setRequestCount(Number(e.target.value))}
                className="w-40"
                disabled={Boolean(run)}
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={triggerRun.isPending || Boolean(run)}>발급 실행</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>발급 실행 확인</DialogTitle>
                  <DialogDescription>
                    이벤트 <span className="font-medium">{eventId}</span>에 대해{' '}
                    <span className="font-medium">{requestCount.toLocaleString()}건</span>의 동시
                    발급 요청을 실행합니다. 이벤트당 1회만 실행할 수 있습니다. 계속하시겠습니까?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleConfirm} disabled={triggerRun.isPending}>
                    {triggerRun.isPending ? '실행 중...' : '실행'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">실행 결과</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
          {!isLoading && !run && (
            <p className="text-sm text-muted-foreground">아직 실행되지 않았습니다.</p>
          )}
          {run && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">요청</TableHead>
                  <TableHead className="text-right">발급</TableHead>
                  <TableHead className="text-right">실패</TableHead>
                  <TableHead>시작</TableHead>
                  <TableHead>종료</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">{run.runId}</TableCell>
                  <TableCell>
                    <RunStatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="text-right">{run.requestedCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{run.issuedCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{run.failedCount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatKstDateTime(run.startedAt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {run.finishedAt ? formatKstDateTime(run.finishedAt) : '-'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
