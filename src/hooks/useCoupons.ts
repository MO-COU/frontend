import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { adminApi } from '@/api/adminApi'

export function useCoupons(eventId: string, page: number, size = 10) {
  return useQuery({
    queryKey: ['events', eventId, 'coupons', page, size],
    queryFn: () => adminApi.listCoupons(eventId, page, size),
    enabled: Boolean(eventId),
    placeholderData: keepPreviousData,
  })
}
