import { useState } from 'react'
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleAlertIcon,
  XCircleIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VerificationRuleName, VerificationRuleResult } from '@/types/domain'

/** consistency/VerificationRule.java 9종 */
const RULE_LABEL: Record<VerificationRuleName, string> = {
  DUPLICATE_ISSUE: '1인 1매 (중복 발급)',
  OVER_ISSUE: '초과 발급',
  STOCK_MISMATCH: '재고 일치',
  ORPHAN_REFERENCE: '고아 참조',
  STATE_TIMESTAMP_MISMATCH: '상태·시각 정합',
  HISTORY_MISMATCH: '이력 체인 정합',
  TOOL_RELIABILITY: '검증 도구 신뢰성',
  REDIS_DB_MISMATCH: 'Redis ↔ DB 일치',
  ISSUE_SEQUENCE_MISMATCH: '예약 순번 정합',
}

const RULE_DESCRIPTION: Record<VerificationRuleName, string> = {
  DUPLICATE_ISSUE: '한 회원이 같은 쿠폰을 2장 이상 받았는가',
  OVER_ISSUE: '발급 건수가 총 재고를 넘었는가',
  STOCK_MISMATCH: '총재고 = 발급 + 잔여 가 맞는가',
  ORPHAN_REFERENCE: '없는 회원·쿠폰·발급을 가리키는 행이 있는가',
  STATE_TIMESTAMP_MISMATCH: '한 행 안에서 상태와 시각이 모순되는가',
  HISTORY_MISMATCH: '이력 체인이 현재 상태와 어긋나거나 끊겼는가',
  TOOL_RELIABILITY: '위반을 주입했을 때 실제로 검출되는가',
  REDIS_DB_MISMATCH: 'Redis 발급 집합·재고가 DB와 어긋나는가',
  ISSUE_SEQUENCE_MISMATCH: 'Redis가 확정한 예약 순번·잔여재고가 DB까지 온전히 왔는가',
}

export function RuleResultCard({ result }: { result: VerificationRuleResult }) {
  const [expanded, setExpanded] = useState(false)

  const failed = result.status === 'FAILED'
  const hasViolation = result.violationCount > 0

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">
            {RULE_LABEL[result.ruleName] ?? result.ruleName}
          </CardTitle>
          {failed ? (
            <Badge variant="warning">
              <CircleAlertIcon /> 실행 실패
            </Badge>
          ) : hasViolation ? (
            <Badge variant="destructive">
              <XCircleIcon /> 위반 {result.violationCount.toLocaleString()}
            </Badge>
          ) : (
            <Badge variant="success">
              <CheckCircle2Icon /> 위반 없음
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {RULE_DESCRIPTION[result.ruleName] ?? ''}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <span className="text-xs text-muted-foreground">검사 건수</span>
            <span className="text-lg font-semibold">
              {result.checkedCount.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <span className="text-xs text-muted-foreground">위반 건수</span>
            <span className="text-lg font-semibold">
              {result.violationCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 실행이 깨졌으면 "위반 0건"은 정상이라는 뜻이 아니다 */}
        {failed && result.failureReason && (
          <p className="text-xs text-warning-foreground">
            실행 실패: {result.failureReason}
          </p>
        )}

        {result.violations.length > 0 && (
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2"
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronDownIcon
                className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
              위반 상세 {result.violations.length.toLocaleString()}건
            </Button>

            {expanded && (
              <ul className="flex flex-col gap-2">
                {result.violations.map((violation) => (
                  <li
                    key={violation.violationId}
                    className="rounded-md border border-border p-2 text-xs"
                  >
                    <span className="font-medium">
                      {violation.targetType}
                      {violation.targetId != null && ` #${violation.targetId}`}
                      {violation.targetId2 != null && ` / #${violation.targetId2}`}
                    </span>
                    <p className="mt-1 text-muted-foreground">{violation.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
