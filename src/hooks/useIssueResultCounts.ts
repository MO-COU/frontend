import { useQuery } from '@tanstack/react-query'

import { adminApi } from '@/api/adminApi'

/**
 * Redis 발급 결과 누적값 + DB 적재 진행.
 * Redis와 DB를 한 스냅샷으로 읽지 않으므로 값이 잠깐 어긋날 수 있고, 그 상태가 곧 관측 대상이다.
 * @param live 부하가 걸리는 중이면 true — 1초, 아니면 5초 주기
 */
export function useIssueResultCounts(couponId: number | null, live = false) {
  return useQuery({
    queryKey: ['issueResultCounts', couponId],
    queryFn: () => adminApi.getIssueResultCounts(couponId!),
    enabled: couponId != null,
    refetchInterval: live ? 1_000 : 5_000,
    refetchIntervalInBackground: true,
    placeholderData: (previous) => previous,
  })
}
