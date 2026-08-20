import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'

/** 이벤트당 실행은 최대 1건 — 아직 실행 전이면 undefined */
export function useIssueRun(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'run'],
    queryFn: () => adminApi.getIssueRun(eventId),
    enabled: Boolean(eventId),
  })
}

function invalidateRunRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  eventId: string,
) {
  queryClient.invalidateQueries({ queryKey: ['events', eventId, 'run'] })
  queryClient.invalidateQueries({ queryKey: ['events', eventId, 'coupons'] })
  queryClient.invalidateQueries({ queryKey: ['events', eventId, 'consistency'] })
  queryClient.invalidateQueries({ queryKey: ['events', eventId] })
  queryClient.invalidateQueries({ queryKey: ['events'] })
}

export function useTriggerRun(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestCount: number) => adminApi.triggerRun(eventId, requestCount),
    onSuccess: (run) => {
      toast.success(`발급 실행 완료 (요청 ${run.requestedCount}건 / 발급 ${run.issuedCount}건)`)
      invalidateRunRelatedQueries(queryClient, eventId)
    },
    onError: () => {
      toast.error('발급 실행에 실패했습니다.')
    },
  })
}

export function useResetEvent(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminApi.resetEvent(eventId),
    onSuccess: () => {
      toast.success('실행/발급/검증 데이터를 초기화했습니다. 다시 실행할 수 있습니다.')
      invalidateRunRelatedQueries(queryClient, eventId)
    },
    onError: () => {
      toast.error('초기화에 실패했습니다.')
    },
  })
}
