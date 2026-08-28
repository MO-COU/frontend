import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'
import { toErrorMessage } from '@/lib/http'

const QUERY_KEY = ['expirationSchedulerState']

export function useExpirationSchedulerState() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminApi.getExpirationSchedulerState,
  })
}

export function useSetExpirationSchedulerState() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (enabled: boolean) => adminApi.setExpirationSchedulerState(enabled),
    onSuccess: (state) => {
      toast.success(`만료 스케줄러를 ${state.enabled ? '켰습니다' : '껐습니다'}.`)
      queryClient.setQueryData(QUERY_KEY, state)
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '만료 스케줄러 상태를 바꾸지 못했습니다.'))
    },
  })
}
