import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'
import { toErrorMessage } from '@/lib/http'

export function useDlqFailures(couponId: number | null) {
  return useQuery({
    queryKey: ['dlqFailures', couponId],
    queryFn: () => adminApi.getDlqFailures(couponId!),
    enabled: couponId != null,
  })
}

export function useRetryDlqFailure(couponId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recordId: string) => adminApi.retryDlqFailure(couponId!, recordId),
    onSuccess: (result) => {
      toast.success(
        result.saved
          ? `회원 ${result.memberId} 재시도 저장 완료`
          : `회원 ${result.memberId}는 이미 처리돼 있어 목록에서 제거했습니다.`,
      )
      queryClient.invalidateQueries({ queryKey: ['dlqFailures', couponId] })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'DLQ 재시도에 실패했습니다.'))
    },
  })
}
