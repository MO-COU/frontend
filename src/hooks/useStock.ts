import { useQuery } from '@tanstack/react-query'

import { adminApi } from '@/api/adminApi'

/**
 * 실시간 재고. Redis 값을 그대로 읽어오므로 부하테스트 중에는 짧은 주기로 폴링한다.
 * @param live 부하테스트가 도는 중이면 true — 1초, 아니면 5초 주기
 */
export function useStock(couponId: number | null, live = false) {
  return useQuery({
    queryKey: ['stock', couponId],
    queryFn: () => adminApi.getStock(couponId!),
    enabled: couponId != null,
    refetchInterval: live ? 1_000 : 5_000,
    refetchIntervalInBackground: true,
    // 폴링 중 잠깐 실패해도 화면이 비지 않도록 직전 값을 유지한다
    placeholderData: (previous) => previous,
  })
}
