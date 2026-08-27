import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { customerApi } from '@/api/customerApi'
import { toErrorMessage } from '@/lib/http'
import { getOrCreateMemberId } from '@/lib/memberId'

/** 발급 성공/실패 메시지는 서버가 이미 사람이 읽을 문장으로 내려준다(SOLD_OUT, DUPLICATE 등). */
export function useIssueCoupon(couponId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => customerApi.issue(couponId, getOrCreateMemberId()),
    onSuccess: () => {
      toast.success('쿠폰을 받았습니다!')
      queryClient.invalidateQueries({ queryKey: ['stock', couponId] })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '쿠폰을 받지 못했습니다.'))
    },
  })
}
