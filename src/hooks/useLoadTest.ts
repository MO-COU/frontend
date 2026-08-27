import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'
import { toErrorMessage } from '@/lib/http'
import type { LoadTestRunResponse, LoadTestScenario } from '@/types/domain'

/** k6가 아직 돌고 있거나, DB 적재를 기다리는 중 — 어느 쪽이든 폴링을 계속해야 한다. */
export function isRunning(run: LoadTestRunResponse | null | undefined): boolean {
  return run?.status === 'PENDING' || run?.status === 'RUNNING' || run?.status === 'SYNCING'
}

const storageKey = (couponId: number) => `mocou.lastLoadTestRunId.${couponId}`

function readStoredRunId(couponId: number): number | null {
  const raw = localStorage.getItem(storageKey(couponId))
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * 부하테스트에도 "이 쿠폰의 최근 실행" 목록 API가 없어서, 우리가 시작시킨 runId를 직접 들고 있어야 한다.
 * 검증(useLastVerificationRunId)과 같은 방식이되, 회차를 오가며 봐야 하므로 couponId별로 나눠 저장한다.
 *
 * 실행 탭·정합성 탭·상세 페이지가 같은 runId를 봐야 해서 useState 대신 쿼리 캐시에 얹는다.
 * 컴포넌트마다 useState를 두면 한쪽에서 remember해도 나머지가 옛 값을 그대로 들고 있다.
 */
export function useLastLoadTestRunId(couponId: number | null) {
  const queryClient = useQueryClient()
  const queryKey = ['loadTestRunId', couponId]

  const { data: runId = null } = useQuery({
    queryKey,
    queryFn: () => readStoredRunId(couponId!),
    enabled: couponId != null,
    staleTime: Infinity,
  })

  const remember = useCallback(
    (id: number) => {
      if (couponId == null) return
      localStorage.setItem(storageKey(couponId), String(id))
      queryClient.setQueryData(['loadTestRunId', couponId], id)
    },
    [couponId, queryClient],
  )

  /** 초기화(load-test/reset)가 실행 기록까지 지우므로, 죽은 참조를 버릴 수단이 필요하다 */
  const forget = useCallback(() => {
    if (couponId == null) return
    localStorage.removeItem(storageKey(couponId))
    queryClient.setQueryData(['loadTestRunId', couponId], null)
  }, [couponId, queryClient])

  return { runId, remember, forget }
}

/**
 * 실행 상태 폴링. k6가 최대 15분까지 돌 수 있어 완료를 놓치지 않는 게 중요하다.
 * 끝난 실행은 값이 더 바뀌지 않으므로 폴링을 멈춘다.
 */
export function useLoadTestRun(runId: number | null) {
  return useQuery({
    queryKey: ['loadTestRun', runId],
    queryFn: () => adminApi.getLoadTestRun(runId!),
    enabled: runId != null,
    // 초기화로 사라진 runId를 들고 있을 수 있다. 404를 재시도해봐야 소용없다.
    retry: false,
    refetchInterval: (query) => (isRunning(query.state.data) ? 2_000 : false),
    // 실행이 몇 분씩 걸려 그동안 다른 탭을 보기 쉽다. 기본값은 탭이 숨으면 폴링을 멈춰서
    // 돌아와도 "실행 중"에 멈춰 있게 되므로, 숨은 동안에도 계속 돌린다.
    refetchIntervalInBackground: true,
  })
}

/** runId 보관과 상태 폴링을 한 번에. 읽기만 하는 화면(정합성 탭, 상세 헤더)이 쓴다. */
export function useLatestLoadTest(couponId: number | null) {
  const { runId } = useLastLoadTestRunId(couponId)
  return useLoadTestRun(runId)
}

export function useStartLoadTest(couponId: number | null, onStarted: (runId: number) => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (scenario: LoadTestScenario) =>
      adminApi.startLoadTest({ couponId: couponId!, scenario }),
    onSuccess: (run) => {
      toast.success(`부하테스트를 시작했습니다. (${run.scenario} · VU ${run.users.toLocaleString()})`)
      queryClient.setQueryData(['loadTestRun', run.runId], run)
      queryClient.invalidateQueries({ queryKey: ['stock', couponId] })
      onStarted(run.runId)
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
export function useResetLoadTest(couponId: number | null, onReset: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminApi.resetLoadTest(couponId!),
    onSuccess: (result) => {
      toast.success(
        `초기화 완료 — 발급 ${result.deletedIssues.toLocaleString()}건 삭제, 재고 ${result.restoredStock.toLocaleString()}로 복구`,
      )
      queryClient.invalidateQueries({ queryKey: ['stock', couponId] })
      queryClient.invalidateQueries({ queryKey: ['issues', couponId] })
      queryClient.invalidateQueries({ queryKey: ['issueResultCounts', couponId] })
      onReset()
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, '초기화에 실패했습니다.'))
    },
  })
}
