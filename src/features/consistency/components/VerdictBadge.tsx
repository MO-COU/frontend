import { CircleAlertIcon, CircleCheckIcon, LoaderIcon, XCircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { Verdict } from '@/types/domain'

/** verdict가 null이면 아직 진행 중이라 판정이 없다 */
export function VerdictBadge({ verdict }: { verdict: Verdict | null }) {
  if (verdict === null) {
    return (
      <Badge variant="warning">
        <LoaderIcon className="animate-spin" /> 검증 중
      </Badge>
    )
  }
  if (verdict === 'PASS') {
    return (
      <Badge variant="success">
        <CircleCheckIcon /> 통과
      </Badge>
    )
  }
  if (verdict === 'FAIL') {
    return (
      <Badge variant="destructive">
        <XCircleIcon /> 불일치 발견
      </Badge>
    )
  }
  // ERROR — 규칙 실행이 깨져 통과/실패를 주장할 수 없는 상태
  return (
    <Badge variant="warning">
      <CircleAlertIcon /> 판정 불가
    </Badge>
  )
}
