import { ClockIcon, PauseIcon, PlayIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useExpirationSchedulerState, useSetExpirationSchedulerState } from '@/hooks/useLifecycle'

/** 만료 배치의 자동 실행 여부를 서버 재시작 없이 켜고 끈다 (internal/lifecycle/expiration-scheduler). */
export function ExpirationSchedulerToggle() {
  const { data: state, isLoading } = useExpirationSchedulerState()
  const setState = useSetExpirationSchedulerState()

  if (isLoading || !state) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ClockIcon /> 만료 스케줄러
      </Button>
    )
  }

  return (
    <Button
      variant={state.enabled ? 'default' : 'outline'}
      size="sm"
      disabled={setState.isPending}
      onClick={() => setState.mutate(!state.enabled)}
    >
      {state.enabled ? <PauseIcon /> : <PlayIcon />}
      만료 스케줄러 {state.enabled ? '켜짐' : '꺼짐'}
    </Button>
  )
}
