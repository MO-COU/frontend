import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'
import { toErrorMessage } from '@/lib/http'
import type { CouponIssueRun, StartLoadTestInput } from '@/types/domain'

export function isRunning(run: CouponIssueRun | null | undefined): boolean {
  return run?.status === 'RUNNING' || run?.status === 'PENDING'
}

/**
 * 이 쿠폰의 가장 최근 부하테스트 실행.
 * 실행 중이면 진행 상황을 보려고 1초마다, 끝났으면 갱신할 게 없으니 폴링하지 않는다.
 */
export function useLatestLoadTest(couponId: number | null) {
  return useQuery({
    queryKey: ['loadTest', couponId],
    queryFn: () => adminApi.getLatestLoadTest(couponId!),
    enabled: couponId != null,
    // 백엔드 미구현 구간에서 404가 계속 재시도되지 않도록
    retry: false,
    refetchInterval: (query) => (isRunning(query.state.data) ? 1_000 : false),
    // 부하테스트가 도는 동안 탭을 벗어나도 완료를 놓치지 않도록
    refetchIntervalInBackground: true,
  })
}

export function useStartLoadTest(couponId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: StartLoadTestInput) => adminApi.startLoadTest(couponId!, input),
    onSuccess: (run) => {
      toast.success(`부하테스트를 시작했습니다. (VU ${run.vus ?? '-'})`)
      queryClient.setQueryData(['loadTest', couponId], run)
      queryClient.invalidateQueries({ queryKey: ['stock', couponId] })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '부하테스트 시작에 실패했습니다.'))
    },
  })
}

/**
 * 부하테스트 리셋. 되돌릴 회차를 지정한다.
 * 종료된 회차면 LOAD_TEST_TARGET_CLOSED(409) — 지난 회차를 잘못 지목해 검증 대상 데이터가
 * 사라지는 것을 서버가 막아준다.
 * Redis→DB 반영이 안 끝났으면 LOAD_TEST_SYNC_IN_PROGRESS(409)로 거절된다.
 */
export function useResetLoadTest(couponId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminApi.resetLoadTest(couponId!),
    onSuccess: (result) => {
      toast.success(
        `초기화 완료 — 발급 ${result.deletedIssues.toLocaleString()}건 삭제, 재고 ${result.restoredStock.toLocaleString()}로 복구`,
      )
      queryClient.invalidateQueries({ queryKey: ['stock', couponId] })
      queryClient.invalidateQueries({ queryKey: ['issues', couponId] })
      queryClient.invalidateQueries({ queryKey: ['loadTest', couponId] })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '초기화에 실패했습니다.'))
    },
  })
}
