import { useQuery } from '@tanstack/react-query'

import { adminApi } from '@/api/adminApi'

/**
 * 발급 성공 알림의 전체·완료·대기·실패 건수.
 * 알림은 발급 이벤트가 DB에 반영된 뒤 outbox가 비동기로 처리하므로, 부하가 걸리는 동안이 아니라
 * 부하테스트 직후에도 한동안 pending이 줄어드는 걸 볼 수 있다 — running 여부와 무관하게 폴링한다.
 * @param live 발급이 방금 끝났거나 진행 중이면 true — 2초, 아니면 5초 주기
 */
export function useNotificationCounts(couponId: number | null, live = false) {
  return useQuery({
    queryKey: ['notificationCounts', couponId],
    queryFn: () => adminApi.getNotificationCounts(couponId!),
    enabled: couponId != null,
    refetchInterval: live ? 2_000 : 5_000,
    refetchIntervalInBackground: true,
    placeholderData: (previous) => previous,
  })
}
