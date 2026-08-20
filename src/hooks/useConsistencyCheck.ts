import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'

/** 이벤트의 실행에 대해 지금까지 실행된 정합성 검증 이력 (1 event : N 검증) */
export function useConsistencyBatches(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'consistency'],
    queryFn: () => adminApi.listConsistencyBatches(eventId),
    enabled: Boolean(eventId),
  })
}

export function useTriggerConsistencyCheck(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminApi.runConsistencyCheck(eventId),
    onSuccess: (batch) => {
      const allConsistent = batch.results.every((r) => r.isConsistent)
      if (allConsistent) {
        toast.success('검증 통과: 불일치 항목이 없습니다.')
      } else {
        toast.error('검증 실패: 불일치 항목이 발견되었습니다.')
      }
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'consistency'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '정합성 검증 실행에 실패했습니다.')
    },
  })
}
