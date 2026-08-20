import { useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { useCoupons } from '@/hooks/useCoupons'
import { formatKstDateTime } from '@/lib/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { IssuedCoupon } from '@/types/domain'

const columnHelper = createColumnHelper<IssuedCoupon>()

const columns = [
  columnHelper.accessor('id', { header: '발급 ID (coupon_issue_id)' }),
  columnHelper.accessor('userId', { header: '회원' }),
  columnHelper.accessor('status', {
    header: '상태',
    cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor('issuedAt', {
    header: '발급 시각',
    cell: (info) => formatKstDateTime(info.getValue()),
  }),
]

const PAGE_SIZE = 10

export function ListTab({ eventId }: { eventId: string }) {
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching } = useCoupons(eventId, page, PAGE_SIZE)

  const table = useReactTable({
    data: data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">발급 리스트 (DB 조회)</CardTitle>
        {data && (
          <span className="text-sm text-muted-foreground">
            총 {data.totalElements.toLocaleString()}건
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {!isLoading && (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    발급된 쿠폰이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
            <span className="text-sm text-muted-foreground">
              {page + 1} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= data.totalPages || isFetching}
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
