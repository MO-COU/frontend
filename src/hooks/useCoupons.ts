import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'
import { toErrorMessage } from '@/lib/http'
import type { CreateCouponInput } from '@/types/domain'

export function useCouponList() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: adminApi.listCoupons,
    retry: false,
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCouponInput) => adminApi.createCoupon(input),
    onSuccess: (coupon) => {
      toast.success(`쿠폰 #${coupon.couponId} "${coupon.name}"을 생성했습니다.`)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '쿠폰 생성에 실패했습니다.'))
    },
  })
}
