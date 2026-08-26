import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { adminApi } from '@/api/adminApi'

/** 백엔드 AdminCouponService.MAX_PAGE_SIZE */
export const MAX_PAGE_SIZE = 100

export function useIssues(couponId: number | null, page: number, size = 20) {
  return useQuery({
    queryKey: ['issues', couponId, page, size],
    queryFn: () => adminApi.getIssues(couponId!, page, size),
    enabled: couponId != null,
    placeholderData: keepPreviousData,
  })
}
