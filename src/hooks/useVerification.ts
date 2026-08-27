import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'
import { toErrorMessage } from '@/lib/http'

const storageKey = (couponId: number) => `mocou.lastVerificationRunId.${couponId}`

function readStoredRunId(couponId: number): number | null {
  const raw = localStorage.getItem(storageKey(couponId))
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * 검증에는 목록 API가 없어서, 우리가 시작시킨 runId를 직접 들고 있어야 한다.
 * 예전엔 이 키가 쿠폰 구분 없이 하나였다 — 그래서 쿠폰 A에서 검증을 돌린 뒤 쿠폰 B 페이지로
 * 가면 A의 결과가 B의 정합성 탭에 그대로 보였다. couponId별로 나눠 저장해서 고친다.
 */
export function useLastVerificationRunId(couponId: number) {
  const queryClient = useQueryClient()
  const queryKey = ['verificationRunId', couponId]

  const { data: runId = null } = useQuery({
    queryKey,
    queryFn: () => readStoredRunId(couponId),
    staleTime: Infinity,
  })

  const remember = useCallback(
    (id: number) => {
      localStorage.setItem(storageKey(couponId), String(id))
      queryClient.setQueryData(['verificationRunId', couponId], id)
    },
    [couponId, queryClient],
  )

  /** 초기화(load-test/reset)가 검증 이력까지 지우므로, 죽은 참조를 버릴 수단이 필요하다 */
  const forget = useCallback(() => {
    localStorage.removeItem(storageKey(couponId))
    queryClient.setQueryData(['verificationRunId', couponId], null)
  }, [couponId, queryClient])

  return { runId, remember, forget }
}

/** 검증은 300만 건을 훑느라 1~2분 걸린다. 끝날 때까지 2초 주기로 폴링한다. */
export function useVerification(runId: number | null) {
  return useQuery({
    queryKey: ['verification', runId],
    queryFn: () => adminApi.getVerification(runId!),
    enabled: runId != null,
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === 'RUNNING' ? 2_000 : false),
    // 검증이 1~2분 걸려 그동안 다른 탭을 보기 쉽다. 기본값은 탭이 숨으면 폴링을 멈춰서
    // 돌아와도 "검증 중"에 멈춰 있게 되므로, 숨은 동안에도 계속 돌린다.
    refetchIntervalInBackground: true,
  })
}

export function useStartVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (issueRunId?: number) => adminApi.startVerification(issueRunId),
    onSuccess: (started) => {
      toast.success(started.message)
      queryClient.invalidateQueries({ queryKey: ['verification', started.runId] })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '정합성 검증 시작에 실패했습니다.'))
    },
  })
}
