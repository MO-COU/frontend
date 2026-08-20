import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ConsistencyCheckResult, ConsistencyCheckType } from '@/types/domain'

const CHECK_LABEL: Record<ConsistencyCheckType, string> = {
  STOCK_MATCH: '재고 일치 (Redis 차감 = DB 발급 수)',
  DUPLICATE_ISSUE: '1인 1매 (중복 발급 0건)',
  STATE_TRANSITION: '상태 전이 무결성',
}

export function ConsistencyResultCard({ result }: { result: ConsistencyCheckResult }) {
  const chartData = [
    { name: '기대값', value: result.expectedValue },
    { name: '실제값', value: result.actualValue },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{CHECK_LABEL[result.checkType]}</CardTitle>
        {result.isConsistent ? (
          <Badge variant="success">
            <CheckCircle2Icon /> 일치
          </Badge>
        ) : (
          <Badge variant="destructive">
            <XCircleIcon /> 불일치
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>기대값: {result.expectedValue.toLocaleString()}</span>
          <span>실제값: {result.actualValue.toLocaleString()}</span>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="value"
                fill={result.isConsistent ? 'var(--color-success)' : 'var(--color-destructive)'}
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {result.mismatchDetail && (
          <p className="text-xs text-destructive">{result.mismatchDetail}</p>
        )}
      </CardContent>
    </Card>
  )
}
