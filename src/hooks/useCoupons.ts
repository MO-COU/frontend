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

export function useDeleteCoupon(onDeleted: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (couponId: number) => adminApi.deleteCoupon(couponId),
    onSuccess: (result) => {
      toast.success(
        `회차 #${result.couponId}를 삭제했습니다 — 발급 ${result.deletedIssues.toLocaleString()}건, ` +
          `이력 ${result.deletedHistories.toLocaleString()}건 삭제`,
      )
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      onDeleted()
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '회차 삭제에 실패했습니다.'))
    },
  })
}
