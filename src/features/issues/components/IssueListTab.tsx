import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IssueStatusBadge } from '@/features/issues/components/IssueStatusBadge'
import { useIssues } from '@/hooks/useIssues'
import { formatKstDateTime } from '@/lib/dateUtils'
import { toErrorMessage } from '@/lib/http'

const PAGE_SIZE = 20

export function IssueListTab({ couponId }: { couponId: number }) {
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching, error } = useIssues(couponId, page, PAGE_SIZE)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">발급 리스트</CardTitle>
          <p className="text-xs text-muted-foreground">
            선착순 발급 순번 순으로 정렬됩니다. 순번이 없는 행은 Redis를 거치지 않고 시더가 직접
            적재한 더미데이터입니다.
          </p>
        </div>
        {data && (
          <span className="shrink-0 text-sm text-muted-foreground">
            총 {data.totalElements.toLocaleString()}건
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {error && (
          <p className="text-sm text-destructive">
            {toErrorMessage(error, '발급 리스트를 불러오지 못했습니다.')}
          </p>
        )}

        {data && (
          <Table className="tabular-nums">
            <TableHeader>
              <TableRow>
                <TableHead>순번</TableHead>
                <TableHead>발급 시 잔여재고</TableHead>
                <TableHead>발급 ID</TableHead>
                <TableHead>회원 ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>발급 시각</TableHead>
                <TableHead>사용 시각</TableHead>
                <TableHead>만료 시각</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    발급된 쿠폰이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {data.content.map((issue) => (
                <TableRow key={issue.issueId}>
                  <TableCell>
                    {issue.issueSequence != null ? (
                      <span className="font-medium">#{issue.issueSequence.toLocaleString()}</span>
                    ) : (
                      <Badge variant="outline">더미</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {issue.remainingAtIssue != null
                      ? issue.remainingAtIssue.toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{issue.issueId}</TableCell>
                  <TableCell className="font-mono text-xs">{issue.memberId}</TableCell>
                  <TableCell>{issue.memberName}</TableCell>
                  <TableCell className="text-muted-foreground">{issue.memberEmail}</TableCell>
                  <TableCell className="text-muted-foreground">{issue.memberPhone}</TableCell>
                  <TableCell>
                    <IssueStatusBadge status={issue.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatKstDateTime(issue.issuedAt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {issue.usedAt ? formatKstDateTime(issue.usedAt) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatKstDateTime(issue.expiresAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {page + 1} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.hasNext || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
